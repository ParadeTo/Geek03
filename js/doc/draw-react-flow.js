#!/usr/bin/env node
/**
 * 绘制 ReAct 工作流程图
 * 使用 Node.js Canvas API
 */

const fs = require('fs');
const path = require('path');

// 检查是否安装了 canvas
let Canvas;
try {
  Canvas = require('canvas');
} catch (e) {
  console.log('正在安装 canvas 库...');
  require('child_process').execSync('npm install canvas', { stdio: 'inherit' });
  Canvas = require('canvas');
}

const { createCanvas } = Canvas;

// 创建画布
const width = 1400;
const height = 800;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// 填充白色背景
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, width, height);

// 颜色定义
const colors = {
  llmBg: '#E3F2FD',
  llmBorder: '#1976D2',
  envBg: '#F3E5F5',
  envBorder: '#7B1FA2',
  thought: '#FFF9C4',
  action: '#FFECB3',
  pause: '#FFCDD2',
  tool: '#E1BEE7',
  obs: '#C5CAE9',
  final: '#C8E6C9',
};

// 绘制圆角矩形
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// 绘制外框
function drawContainer(x, y, w, h, title, bgColor, borderColor) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 15);
  ctx.fillStyle = bgColor;
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // 绘制标题
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(title, x + w / 2, y + 35);
  ctx.restore();
}

// 绘制节点
function drawNode(x, y, w, h, text, bgColor) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = bgColor;
  ctx.fill();
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // 绘制文字
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // 处理多行文本
  const lines = text.split('\n');
  const lineHeight = 22;
  const startY = y + h / 2 - ((lines.length - 1) * lineHeight) / 2;
  
  lines.forEach((line, i) => {
    ctx.fillText(line, x + w / 2, startY + i * lineHeight);
  });
  
  ctx.restore();
}

// 绘制箭头
function drawArrow(x1, y1, x2, y2, color = '#333333', lineWidth = 3) {
  const headlen = 15;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  
  // 画线
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  
  // 画箭头
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headlen * Math.cos(angle - Math.PI / 6),
    y2 - headlen * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    x2 - headlen * Math.cos(angle + Math.PI / 6),
    y2 - headlen * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

// 绘制虚线箭头
function drawDashedArrow(x1, y1, x2, y2, color = '#4CAF50') {
  const headlen = 15;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 5]);
  
  // 画线
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  
  ctx.setLineDash([]);
  
  // 画箭头
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headlen * Math.cos(angle - Math.PI / 6),
    y2 - headlen * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    x2 - headlen * Math.cos(angle + Math.PI / 6),
    y2 - headlen * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

// 绘制标注
function drawLabel(x, y, text, color = '#000000', size = 20) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
  ctx.restore();
}

// 开始绘制
console.log('🎨 开始绘制 ReAct 流程图...');

// LLM 层外框
drawContainer(50, 450, 1300, 300, '🤖 LLM 层', colors.llmBg, colors.llmBorder);

// 执行环境外框
drawContainer(50, 50, 1300, 350, '⚙️ 人类/执行环境', colors.envBg, colors.envBorder);

// LLM 层的节点
const nodeWidth = 150;
const nodeHeight = 80;
const nodeY = 600;

drawNode(100, nodeY, nodeWidth, nodeHeight, 'Input', colors.thought);
drawNode(350, nodeY, nodeWidth, nodeHeight, 'Thought', colors.thought);
drawNode(600, nodeY, nodeWidth, nodeHeight, 'Action', colors.action);
drawNode(850, nodeY, nodeWidth, nodeHeight, 'Action\nInput', colors.action);
drawNode(1150, nodeY, nodeWidth, nodeHeight, 'PAUSE', colors.pause);

// 执行环境的节点
drawNode(1150, 250, 180, nodeHeight, '工具执行', colors.tool);
drawNode(850, 250, 200, nodeHeight, 'Observation', colors.obs);
drawNode(350, 120, 220, nodeHeight, 'Final Answer', colors.final);

// LLM 层内部流程箭头
drawArrow(250, nodeY + nodeHeight / 2, 350, nodeY + nodeHeight / 2);
drawArrow(500, nodeY + nodeHeight / 2, 600, nodeY + nodeHeight / 2);
drawArrow(750, nodeY + nodeHeight / 2, 850, nodeY + nodeHeight / 2);
drawArrow(1000, nodeY + nodeHeight / 2, 1150, nodeY + nodeHeight / 2);

// PAUSE 到工具执行
drawArrow(1225, nodeY, 1225, 330, colors.envBorder);

// 工具执行到 Observation
drawArrow(1150, 290, 1050, 290, colors.envBorder);

// Observation 回到 Thought (循环)
ctx.save();
ctx.strokeStyle = colors.llmBorder;
ctx.lineWidth = 3;
ctx.beginPath();
ctx.moveTo(850, 250);
ctx.lineTo(850, 150);
ctx.lineTo(425, 150);
ctx.lineTo(425, 400);
ctx.stroke();
ctx.restore();
drawArrow(425, 400, 425, 600, colors.llmBorder);

// Thought 到 Final Answer (虚线)
drawDashedArrow(425, nodeY, 425, 200, colors.final);

// 添加标注
drawLabel(1280, 430, '①', colors.envBorder, 24);
drawLabel(1080, 320, '②', colors.envBorder, 24);
drawLabel(600, 150, '③ 循环', colors.llmBorder, 20);
drawLabel(500, 400, '④ 完成', '#4CAF50', 20);

// 保存图片
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const outputPath = path.join(imagesDir, 'react-workflow.png');
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(outputPath, buffer);

console.log('✅ 流程图已生成：', outputPath);


