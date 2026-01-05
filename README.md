# 词根分析工具

一个基于 Next.js 的英语词根分析网站，可以分析单词的词根及扩展词汇。

## 功能特性

- 🔍 **词根分析**：输入单词，自动判断是否为词根
- 📚 **词根信息**：展示词性、音标、中文意思
- 🔗 **扩展词汇**：展示基于该词根的所有扩展词汇（加前缀、后缀）
- ✨ **可视化分割**：使用「·」分隔符清晰展示单词结构（如：inter·nation·al·ization）
- 📝 **历史记录**：自动保存搜索历史，支持快速查看和重新搜索
- 💾 **本地缓存**：已搜索的单词会缓存，避免重复调用 API

## 技术栈

- Next.js 14
- TypeScript
- Tailwind CSS
- Gemini API (通过 ohmygpt.com)

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `env.example` 文件为 `.env.local`：

```bash
cp env.example .env.local
```

编辑 `.env.local` 文件，填入你的 API KEY：

```
GEMINI_API_KEY=your_api_key_here
```

**注意**：`.env.local` 文件需要创建在项目根目录（和 `package.json` 同级），这个文件会被 git 忽略，不会上传到 GitHub。

### 3. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 部署到 Vercel

### 1. 推送到 GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/wordna.git
git push -u origin main
```

### 2. 在 Vercel 中部署

1. 登录 [Vercel](https://vercel.com)
2. 点击 "New Project"
3. 导入你的 GitHub 仓库
4. 在 "Environment Variables" 中添加：
   - **Name**: `GEMINI_API_KEY`
   - **Value**: 你的 API KEY
5. 点击 "Deploy"

## 环境变量说明

### `.env.local` vs `env.example`

- **`env.example`**：示例文件，包含环境变量的格式说明，**会上传到 GitHub**，供其他开发者参考
- **`.env.local`**：实际的配置文件，包含真实的 API KEY，**不会上传到 GitHub**（已在 `.gitignore` 中忽略）

### 本地开发

创建 `.env.local` 文件（在项目根目录）：

```
GEMINI_API_KEY=sk-BpZMTHM0Fb7C22e94Dd3T3BLBkFJ6AE301A7c176419fB7a3
```

### Vercel 部署

在 Vercel 项目设置 → Environment Variables 中添加：
- **Name**: `GEMINI_API_KEY`
- **Value**: 你的 API KEY

## 项目结构

```
wordna/
├── app/
│   ├── api/
│   │   └── analyze/          # API 路由
│   ├── utils/
│   │   ├── highlight.tsx    # 单词高亮和分隔符显示
│   │   ├── history.ts        # 历史记录管理
│   │   └── partOfSpeech.ts  # 词性简写转换
│   ├── globals.css           # 全局样式
│   ├── layout.tsx            # 根布局
│   └── page.tsx              # 主页面
├── env.example               # 环境变量示例
├── .gitignore               # Git 忽略文件
├── package.json             # 项目配置
└── README.md                # 项目说明
```

## 开发说明

- 历史记录保存在浏览器 localStorage 中，保存 100 天
- 已搜索的单词会缓存，避免重复调用 API
- 单词结构使用「·」分隔符展示，清晰显示前缀、词根、后缀

## License

MIT
