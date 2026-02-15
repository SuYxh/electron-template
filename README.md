# 🚀 Electron Template

一个功能完备的 Electron 模板项目，集成常用功能模块，可作为各类桌面应用的开发基础。

## ✨ 功能特性

- 🎬 **FFmpeg 集成** - 视频转码、音频提取、进度回调
- 📢 **系统通知** - 原生通知支持，点击回调
- 🔌 **WebSocket** - 自动重连、心跳检测、消息队列
- 🔄 **自动更新** - GitHub Releases 分发，静默更新
- 💾 **数据存储** - electron-store (本地配置) + MySQL (远程数据)
- 💬 **AI 聊天** - DeepSeek API 流式输出，支持用户自定义 API Key
- 🛡️ **安全** - 上下文隔离、预加载脚本、IPC 类型安全

## 📦 技术栈

| 层级 | 技术选型 |
|------|---------|
| 桌面框架 | Electron 33+ |
| 前端框架 | React 18 + React Router 6 |
| 构建工具 | Vite 5 |
| 开发语言 | TypeScript 5 |
| 样式 | Less |
| 打包工具 | electron-builder |
| 自动更新 | electron-updater |
| 本地存储 | electron-store |
| 远程数据库 | MySQL (mysql2) |
| 媒体处理 | fluent-ffmpeg + ffmpeg-static |
| AI 接口 | DeepSeek API (流式输出) |

## 🗂️ 项目结构

```
electron-study/
├── src/
│   ├── main/                       # 主进程
│   │   ├── index.ts                # 主进程入口
│   │   ├── preload.ts              # 预加载脚本
│   │   ├── ipc/                    # IPC 通信处理
│   │   │   └── index.ts
│   │   ├── modules/
│   │   │   ├── ffmpeg/             # FFmpeg 模块
│   │   │   ├── notification/       # 通知模块
│   │   │   ├── websocket/          # WebSocket 模块
│   │   │   ├── updater/            # 自动更新模块
│   │   │   ├── database/           # 数据库模块
│   │   │   │   ├── index.ts
│   │   │   │   ├── store.ts        # electron-store 配置
│   │   │   │   └── mysql.ts        # MySQL 连接
│   │   │   └── chat/               # AI 聊天模块
│   │   │       └── index.ts
│   │   └── utils/
│   │       └── path.ts
│   │
│   ├── renderer/                   # 渲染进程 (React)
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx                 # 路由配置
│   │   ├── components/
│   │   │   └── Layout.tsx          # 布局组件
│   │   ├── pages/
│   │   │   ├── HomePage.tsx        # 首页
│   │   │   └── ChatPage.tsx        # AI 聊天页
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts
│   │   │   ├── useNotification.ts
│   │   │   └── useChat.ts
│   │   ├── types/
│   │   │   └── electron.d.ts
│   │   └── styles/
│   │       ├── global.less
│   │       ├── layout.less
│   │       ├── home.less
│   │       └── chat.less
│   │
│   └── shared/                     # 共享类型定义
│       ├── types/
│       │   ├── ipc.ts
│       │   ├── ffmpeg.ts
│       │   ├── notification.ts
│       │   ├── websocket.ts
│       │   ├── database.ts
│       │   └── chat.ts
│       └── constants/
│           └── channels.ts         # IPC channel 常量
│
├── .github/
│   └── workflows/
│       └── release.yml             # 自动发布 workflow
│
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── electron-builder.json
```

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 仅启动前端 (浏览器模式，部分功能受限)
pnpm run dev

# 启动完整 Electron 应用 (推荐)
pnpm run dev:electron
```

### 构建打包

```bash
# 构建渲染进程
pnpm run build

# 打包 macOS
pnpm run build:mac

# 打包 Windows
pnpm run build:win

# 打包 Linux
pnpm run build:linux
```

## 📖 功能模块说明

### FFmpeg 视频处理

```typescript
// 渲染进程调用
const result = await window.electronAPI.ffmpeg.convert(
  '/path/to/input.mp4',
  '/path/to/output.webm',
  { format: 'webm', videoBitrate: '1000k' }
)

// 监听进度
window.electronAPI.ffmpeg.onProgress((event, progress) => {
  console.log(`进度: ${progress.percent}%`)
})
```

**支持功能:**
- 视频格式转换 (mp4, avi, mkv, webm)
- 音频提取
- 视频压缩
- 实时进度回调
- 任务取消

### 系统通知

```typescript
await window.electronAPI.notification.show({
  title: '标题',
  body: '通知内容',
  silent: false
})

// 监听点击事件
window.electronAPI.notification.onClicked((event, { id }) => {
  console.log('通知被点击:', id)
})
```

### WebSocket 长连接

```typescript
// 建立连接
const { id } = await window.electronAPI.websocket.connect({
  url: 'wss://example.com/ws',
  reconnect: true,
  heartbeatInterval: 30000
})

// 发送消息
await window.electronAPI.websocket.send(id, { type: 'ping' })

// 监听消息
window.electronAPI.websocket.onMessage((event, { id, data }) => {
  console.log('收到消息:', data)
})
```

**特性:**
- 自动重连 (指数退避算法)
- 心跳检测
- 消息队列 (断线缓存)
- 多连接实例支持

### 数据存储

```typescript
// electron-store (本地配置)
await window.electronAPI.store.set('theme', 'dark')
const { value } = await window.electronAPI.store.get('theme')

// MySQL (远程数据库)
await window.electronAPI.invoke('db:connect', {
  url: 'mysql://user:pass@host:port/database'
})

const result = await window.electronAPI.database.query(
  'SELECT * FROM users WHERE id = ?',
  [1]
)
```

### AI 聊天 (DeepSeek)

进入「💬 AI 聊天」页面：

1. 点击右上角 ⚙️ 设置 API Key
2. 输入你的 DeepSeek API Key
3. 开始对话，支持流式输出

**特性:**
- DeepSeek API 流式输出
- API Key 本地存储
- 停止生成功能
- 清空对话功能

## ⚙️ 配置说明

### electron-builder.json

```json
{
  "appId": "com.yourname.electron-template",
  "productName": "Electron Template",
  "publish": {
    "provider": "github",
    "owner": "your-username",
    "repo": "electron-template"
  }
}
```

### 自动更新

项目已配置 GitHub Actions，推送 tag 时自动构建并发布到 GitHub Releases：

```bash
# 创建版本 tag
git tag v1.0.0
git push origin v1.0.0
```

## 🔒 安全配置

```typescript
new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,      // 禁用 Node.js 集成
    contextIsolation: true,      // 启用上下文隔离
    sandbox: false,              // 沙箱模式
    preload: path.join(__dirname, 'preload.js'),
  },
})
```

## 📝 IPC 通道列表

| 通道 | 说明 |
|------|------|
| `ffmpeg:convert` | 视频转码 |
| `ffmpeg:progress` | 转码进度 |
| `ffmpeg:cancel` | 取消转码 |
| `notification:show` | 显示通知 |
| `ws:connect` | WebSocket 连接 |
| `ws:send` | 发送消息 |
| `ws:message` | 接收消息 |
| `updater:check` | 检查更新 |
| `db:query` | 数据库查询 |
| `store:get/set` | 配置读写 |
| `chat:send` | 发送聊天 |
| `chat:chunk` | 流式响应 |

## 🛠️ 开发脚本

| 命令 | 说明 |
|------|------|
| `pnpm run dev` | 启动 Vite 开发服务器 |
| `pnpm run dev:electron` | 启动完整 Electron 应用 |
| `pnpm run build` | 构建生产版本 |
| `pnpm run build:mac` | 打包 macOS 应用 |
| `pnpm run build:win` | 打包 Windows 应用 |
| `pnpm run build:linux` | 打包 Linux 应用 |
| `pnpm run typecheck` | TypeScript 类型检查 |
| `pnpm run release` | 构建并发布 |

## 📄 License

MIT
