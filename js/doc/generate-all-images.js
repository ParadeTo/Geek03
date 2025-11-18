const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const flows = [
  { html: 'draw-react-flow.html', png: 'react-workflow.png', width: 1400, height: 500 },
  { html: 'draw-codeact-flow.html', png: 'codeact-workflow.png', width: 1000, height: 600 },
  { html: 'draw-plan-flow.html', png: 'plan-workflow.png', width: 1000, height: 600 },
  { html: 'draw-plan-advanced-flow.html', png: 'plan-advanced-workflow.png', width: 800, height: 800 },
  { html: 'draw-reflection-flow.html', png: 'reflection-workflow.png', width: 900, height: 800 },
  { html: 'draw-langgraph-flow.html', png: 'langgraph-workflow.png', width: 1000, height: 600 },
  { html: 'draw-human-loop-flow.html', png: 'human-loop-workflow.png', width: 1400, height: 600 },
];

async function generateAllImages() {
  const browser = await puppeteer.launch();
  
  for (const flow of flows) {
    try {
      console.log(`生成 ${flow.png}...`);
      
      const page = await browser.newPage();
      await page.setViewport({ width: flow.width, height: flow.height });
      
      const htmlPath = path.join(__dirname, flow.html);
      await page.goto(`file://${htmlPath}`);
      
      // 等待画布加载
      await page.waitForSelector('#canvas');
      
      const canvas = await page.$('#canvas');
      const imagePath = path.join(__dirname, 'images', flow.png);
      
      await canvas.screenshot({ path: imagePath });
      
      console.log(`✓ 已生成 ${flow.png}`);
      await page.close();
    } catch (error) {
      console.error(`✗ 生成 ${flow.png} 失败:`, error.message);
    }
  }
  
  await browser.close();
  console.log('\n所有图片生成完成！');
}

generateAllImages().catch(console.error);

