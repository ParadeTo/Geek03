import * as puppeteer from 'puppeteer'
import * as path from 'path'
import * as fs from 'fs'

/**
 * 预处理 HTML：将 marked.js 动态渲染改为静态 HTML，并内联 iframe 内容
 */
async function preprocessHtml(htmlContent: string, htmlDir: string): Promise<string> {
  // 动态导入 marked
  const {marked} = await import('marked')

  // 1. 提取 Markdown 内容并转换为 HTML
  const mdMatch = htmlContent.match(/const mdContent = "([\s\S]*?)";[\s\n]*document/)
  if (mdMatch) {
    const mdContent = mdMatch[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
    
    const parsedHtml = await marked.parse(mdContent) as string
    
    // 替换 script 部分为静态内容
    htmlContent = htmlContent.replace(
      /<div class="content" id="report-content"><\/div>/,
      `<div class="content" id="report-content">${parsedHtml}</div>`
    )
    
    // 移除 marked.js 脚本
    htmlContent = htmlContent.replace(
      /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/marked\/marked\.min\.js"><\/script>/,
      ''
    )
    htmlContent = htmlContent.replace(
      /<script>[\s\S]*?const mdContent[\s\S]*?<\/script>/,
      ''
    )
  }

  // 2. 处理 iframe：将外部 HTML 内联
  const iframeRegex = /<iframe src="([^"]+)" class="chart-frame"><\/iframe>/g
  let match
  const iframeMatches: Array<{full: string; src: string}> = []
  while ((match = iframeRegex.exec(htmlContent)) !== null) {
    iframeMatches.push({full: match[0], src: match[1]})
  }

  for (const iframe of iframeMatches) {
    const iframePath = path.resolve(htmlDir, iframe.src)
    
    if (fs.existsSync(iframePath)) {
      const iframeContent = fs.readFileSync(iframePath, 'utf-8')
      const chartDiv = extractChartContent(iframeContent)
      htmlContent = htmlContent.replace(iframe.full, chartDiv)
    } else {
      console.warn(`  ⚠️ 图表文件不存在: ${iframePath}`)
      htmlContent = htmlContent.replace(
        iframe.full,
        `<div class="chart-error" style="padding:20px;color:#999;text-align:center;">图表加载失败</div>`
      )
    }
  }

  // 3. 添加 ECharts CDN
  if (!htmlContent.includes('echarts.min.js') && iframeMatches.length > 0) {
    htmlContent = htmlContent.replace(
      '</head>',
      `<script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script></head>`
    )
  }

  return htmlContent
}

/**
 * 从图表 HTML 中提取 ECharts 配置并生成内联脚本
 */
function extractChartContent(iframeHtml: string): string {
  const chartId = `chart_${Math.random().toString(36).substr(2, 9)}`
  
  // 提取 option 配置
  const optionMatch = iframeHtml.match(/var option = (\{[\s\S]*?\});[\s\n]*myChart\.setOption/)
  
  if (optionMatch) {
    const optionStr = optionMatch[1]
    return `
      <div id="${chartId}" style="width:100%;height:400px;margin:20px 0;"></div>
      <script>
        (function(){
          var chart = echarts.init(document.getElementById('${chartId}'));
          var option = ${optionStr};
          chart.setOption(option);
        })();
      </script>
    `
  }
  
  return '<div style="padding:20px;color:#999;text-align:center;">图表解析失败</div>'
}

/**
 * HTML 转 PDF 工具
 */
export async function htmlToPdf(
  htmlPath: string,
  outputPath?: string
): Promise<string> {
  if (!fs.existsSync(htmlPath)) {
    throw new Error(`HTML 文件不存在: ${htmlPath}`)
  }

  const pdfPath = outputPath || htmlPath.replace('.html', '.pdf')
  const htmlDir = path.dirname(htmlPath)

  console.log(`📄 正在将 HTML 转换为 PDF...`)
  console.log(`   输入: ${path.basename(htmlPath)}`)
  console.log(`   输出: ${path.basename(pdfPath)}`)

  // 读取并预处理 HTML
  console.log(`   预处理 HTML 内容...`)
  let htmlContent = fs.readFileSync(htmlPath, 'utf-8')
  htmlContent = await preprocessHtml(htmlContent, htmlDir)

  // 保存预处理后的临时文件
  const tempHtmlPath = htmlPath.replace('.html', '_temp.html')
  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf-8')
  console.log(`   临时文件已生成`)

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
    timeout: 120000,
  })

  try {
    const page = await browser.newPage()

    const fileUrl = `file://${path.resolve(tempHtmlPath)}`
    await page.goto(fileUrl, {
      waitUntil: 'networkidle0',
      timeout: 60000,
    })

    // 等待内容渲染
    await page.waitForFunction(
      () => {
        const content = document.getElementById('report-content')
        return content && content.innerHTML.length > 100
      },
      {timeout: 30000}
    )

    // 等待图表渲染
    console.log(`   等待图表渲染...`)
    await new Promise((resolve) => setTimeout(resolve, 5000))

    // 生成 PDF
    console.log(`   生成 PDF...`)
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm',
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; color: #666; width: 100%; text-align: center; padding: 5px 0;">
          贵州茅台财务研报 - AI Agent 自动生成
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 10px; color: #666; width: 100%; text-align: center; padding: 5px 0;">
          第 <span class="pageNumber"></span> 页 / 共 <span class="totalPages"></span> 页
        </div>
      `,
    })

    // 清理临时文件
    fs.unlinkSync(tempHtmlPath)

    console.log(`✅ PDF 生成成功: ${pdfPath}`)
    return pdfPath
  } finally {
    await browser.close()
  }
}

if (require.main === module) {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.log('用法: ts-node html-to-pdf.ts <html文件路径>')
    process.exit(1)
  }

  htmlToPdf(args[0], args[1])
    .then((pdfPath) => {
      console.log(`\n🎉 转换完成: ${pdfPath}`)
    })
    .catch((error) => {
      console.error(`\n❌ 转换失败: ${error.message}`)
      process.exit(1)
    })
}
