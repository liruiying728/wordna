# WorDNA 词根分析工具

一个基于 Next.js 的英语词根分析网站，可以分析单词的词根及扩展词汇，加深理解，加速记忆。

## 功能特性

- 🔍 **智能词根分析**：输入单词，自动判断是否为词根，支持词根变体匹配
- 📚 **完整词汇信息**：展示词性、音标、中文意思，优先展示被搜索单词的词汇卡片
- 🔗 **丰富扩展词汇**：展示最多 20 个基于该词根的相关扩展词汇（加前缀、后缀）
- ✨ **可视化分割**：使用「·」分隔符清晰展示单词结构（如：inter·nation·al·ization），支持复合后缀拆分
- 🎨 **智能布局**：默认搜索框居中显示，有结果时自动固定在顶部，WorDNA logo 清晰展示
- ⚡ **流畅体验**：全屏加载遮罩，禁止滚动，确保专注分析过程
- 📝 **历史记录**：自动保存搜索历史，支持快速查看和重新搜索
- 💾 **本地缓存**：已搜索的单词会缓存，避免重复调用 API
- 📋 **前缀后缀清单**：内置 400+ 常见前缀后缀，智能匹配和拆分

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
│   │   └── analyze/          # API 路由（词根分析接口）
│   ├── utils/
│   │   ├── affixes.json     # 前缀后缀清单（400+ 常见词缀）
│   │   ├── highlight.tsx    # 单词高亮和分隔符显示（智能分割）
│   │   ├── history.ts        # 历史记录管理
│   │   └── partOfSpeech.ts  # 词性简写转换
│   ├── globals.css           # 全局样式
│   ├── layout.tsx            # 根布局
│   └── page.tsx              # 主页面（智能布局、全屏加载）
├── env.example               # 环境变量示例
├── .gitignore               # Git 忽略文件
├── package.json             # 项目配置
└── README.md                # 项目说明
```

## 开发说明

### 核心功能

- **历史记录**：保存在浏览器 localStorage 中，保存 100 天
- **本地缓存**：已搜索的单词会缓存，避免重复调用 API
- **智能分割**：单词结构使用「·」分隔符展示，清晰显示前缀、词根、后缀
  - 支持词根变体匹配（如 "image" → "imag"）
  - 支持复合后缀拆分（如 "inatively" → "ina·tive·ly"）
  - 「·」分隔符使用浅灰色样式，便于区分

### 前缀后缀系统

- **清单文件**：`app/utils/affixes.json` 包含 400+ 常见前缀后缀
- **匹配策略**：
  1. 优先使用 API 返回的前缀后缀（最准确）
  2. 如果 API 未返回，使用清单中的常见词缀
  3. 如果清单中也没有，使用智能拆分（元音-辅音边界）
- **扩展词汇**：最多显示 20 个，自动排除被搜索的单词本身

### 布局特性

- **默认状态**：搜索框居中显示，上方显示主标题和副标题
- **结果页面**：搜索框固定在顶部，左侧显示 WorDNA logo
- **加载效果**：全屏遮罩，禁止滚动，居中显示加载动画
- **响应式设计**：小尺寸设备自动调整布局，确保按钮不被挤出

### API 优化

- **JSON 解析**：智能处理被截断的 JSON，自动补全缺失的括号
- **错误处理**：详细的错误日志，便于调试和排查问题
- **Token 限制**：max_tokens 设置为 5000，确保能返回完整的 20 个扩展词汇

## License

MIT
