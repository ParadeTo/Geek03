"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var messages_1 = require("@langchain/core/messages");
console.log('测试 2: 导入 @langchain/core/messages');
console.log('导入成功');
var msg = new messages_1.AIMessage('test');
console.log('创建消息成功:', msg.content);
