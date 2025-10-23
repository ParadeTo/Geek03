# TypeScript Node.js Project

这是一个使用 TypeScript 的 Node.js 项目模板。

## 项目结构

```
js/
├── src/                    # 源代码目录
│   ├── index.ts           # 主入口文件
│   └── utils/             # 工具函数目录
│       └── greet.ts       # 示例工具函数
├── tests/                 # 测试目录
├── dist/                  # 编译输出目录 (自动生成)
├── package.json           # 项目配置文件
├── tsconfig.json          # TypeScript 配置文件
├── .gitignore            # Git 忽略文件
└── README.md             # 项目说明文档
```

## 安装依赖

```bash
pnpm install
```

## 可用脚本

- `pnpm dev` - 开发模式运行 (使用 nodemon 和 ts-node)
- `pnpm build` - 编译 TypeScript 代码到 dist 目录
- `pnpm start` - 运行编译后的代码
- `pnpm clean` - 清理编译输出目录

## 开发

1. 在开发模式下运行项目：
   ```bash
   pnpm dev
   ```

2. 编译项目：
   ```bash
   pnpm build
   ```

3. 运行编译后的项目：
   ```bash
   pnpm start
   ```

## 技术栈

- **TypeScript** - 类型安全的 JavaScript 超集
- **Node.js** - JavaScript 运行时环境
- **ts-node** - 直接运行 TypeScript 文件
- **nodemon** - 开发时自动重启服务器

## 开始开发

编辑 `src/index.ts` 文件开始你的项目开发。所有的源代码都应该放在 `src/` 目录下。
