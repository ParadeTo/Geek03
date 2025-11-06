const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '三兄弟持仓-Sheet1.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

const lines = csvContent.split('\n');
const data = lines.slice(1).filter(line => line.trim() && !line.match(/^,+$/));

const positions = {
  '伍神': { stocks: {}, cash: { 港币: 0, 美元: 0 } },
  '笑神': { stocks: {}, cash: { 港币: 0, 美元: 0 } },
  '游神': { stocks: {}, cash: { 港币: 0, 美元: 0 } }
};

data.forEach(line => {
  const fields = line.split(',');
  
  const transactionType = fields[1];
  const stockName = fields[2];
  const stockCode = fields[3];
  const direction = fields[4];
  const currency = fields[5];
  const quantity = parseFloat(fields[6]) || 0;
  const totalAmount = parseFloat(fields[8]) || 0;
  const fee = parseFloat(fields[9]) || 0;
  const owner = fields[10];
  
  if (!owner || !positions[owner]) return;
  
  if (transactionType === '入金') {
    positions[owner].cash[currency] += totalAmount;
  } else if (transactionType === '出金') {
    positions[owner].cash[currency] -= totalAmount;
  } else if (transactionType === '港股交易' || transactionType === '美股交易') {
    const stockKey = `${stockName}(${stockCode})`;
    
    if (direction === '买入') {
      if (!positions[owner].stocks[stockKey]) {
        positions[owner].stocks[stockKey] = { quantity: 0, currency };
      }
      positions[owner].stocks[stockKey].quantity += quantity;
      positions[owner].cash[currency] -= (totalAmount + fee);
    } else if (direction === '卖出') {
      if (!positions[owner].stocks[stockKey]) {
        positions[owner].stocks[stockKey] = { quantity: 0, currency };
      }
      positions[owner].stocks[stockKey].quantity -= quantity;
      positions[owner].cash[currency] += (totalAmount - fee);
    }
  }
});

console.log('=== 三兄弟持仓统计 ===\n');

Object.entries(positions).forEach(([name, data]) => {
  console.log(`【${name}】`);
  console.log('\n持仓：');
  
  const hasStocks = Object.entries(data.stocks).some(([_, info]) => info.quantity > 0);
  
  if (hasStocks) {
    Object.entries(data.stocks).forEach(([stock, info]) => {
      if (info.quantity > 0) {
        console.log(`  ${stock}: ${info.quantity} 股`);
      }
    });
  } else {
    console.log('  无持仓');
  }
  
  console.log('\n现金余额：');
  console.log(`  港币: ${data.cash['港币'].toFixed(2)}`);
  console.log(`  美元: ${data.cash['美元'].toFixed(2)}`);
  console.log('\n' + '='.repeat(50) + '\n');
});

