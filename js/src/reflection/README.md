# 反思模式 (Reflection Mode)

## 概述

反思模式通过自我评估和迭代改进来提升输出质量，类似于人类"先写初稿，再反复修改"的过程。

## 核心特点

### 工作流程

```
生成初始方案 → 反思检查 → 发现问题？
                    ↓
              是 ← 重新生成（带改进建议）
              否 → 输出最终方案
```

### 关键机制

1. **迭代改进**：每次根据反思建议优化方案
2. **多维度检查**：安全性、标准性、效率、完整性
3. **智能终止**：最优方案、安全问题、迭代上限

## 目录结构

```
reflection/
├── prompts.ts    # 生成和反思提示词
├── types.ts      # 状态定义
├── graph.ts      # LangGraph 工作流
├── index.ts      # 入口文件
└── README.md     # 本文件
```

## 运行

```bash
npm run reflection:dev
```

## 示例

**输入：**
```
使用docker创建nginx容器，端口映射8080:80
```

**执行过程：**

1. **第1次生成**
   ```bash
   docker run -d -p 8080:80 nginx
   ```
   
2. **反思检查**
   ```
   建议：缺少容器名称，不便管理；未指定镜像版本
   ```

3. **第2次生成**
   ```bash
   docker run -d --name nginx-server -p 8080:80 nginx:latest
   ```
   
4. **反思检查**
   ```
   建议：latest 标签不利于版本控制，建议指定具体版本
   ```

5. **第3次生成**
   ```bash
   docker run -d --name nginx-server -p 8080:80 nginx:1.25-alpine
   ```
   
6. **反思检查**
   ```
   无需优化
   ```

**最终输出：**
```bash
docker run -d --name nginx-server -p 8080:80 nginx:1.25-alpine
```

## 适用场景

- 对质量要求高的内容生成
- 需要多角度验证的方案
- 代码优化和重构
- 文档撰写和修改

## 配置

在 `graph.ts` 中可调整：

```typescript
// 最大迭代次数
if (state.iterations >= 3) { ... }

// 停止标志
const STOP_SIGNS = ['安全隐患', '木马', '攻击']
```

