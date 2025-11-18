#!/usr/bin/env node
/**
 * 使用 Puppeteer 从 HTML 生成人机协作流程图 PNG 图片
 */

const fs = require('fs');
const path = require('path');

async function generateImage() {
  let puppeteer;
  
  try {
    puppeteer = require('puppeteer');
  } catch (e) {
    console.log('puppeteer 未安装，正在安装...');
    console.log('这可能需要几分钟，请耐心等待...');
    require('child_process').execSync('npm install puppeteer', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    puppeteer = require('puppeteer');
  }

  console.log('🚀 启动浏览器...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  
  await page.setViewport({ width: 1400, height: 600 });

  const htmlPath = path.join(__dirname, 'draw-human-loop-flow.html');
  await page.goto(`file://${htmlPath}`);

  await page.waitForTimeout(1000);

  const imagesDir = path.join(__dirname, 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  const canvas = await page.$('#canvas');
  const outputPath = path.join(imagesDir, 'human-loop-workflow.png');
  
  await canvas.screenshot({ 
    path: outputPath,
    omitBackground: false
  });

  await browser.close();

  console.log('✅ 图片已生成：', outputPath);
}

generateImage().catch(error => {
  console.error('❌ 生成失败：', error.message);
  console.log('\n💡 替代方案：');
  console.log('1. 在浏览器中打开 draw-human-loop-flow.html');
  console.log('2. 点击"下载图片"按钮');
  console.log('3. 将下载的图片保存到 images/human-loop-workflow.png');
  process.exit(1);
});

