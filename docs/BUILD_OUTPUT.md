# 📦 构建产物说明

执行 `pnpm run build:mac` 后，会在 `release/{version}/` 目录下生成构建产物。

## 目录结构

```
release/1.0.0/
├── 📦 可分发文件 (给用户安装用)
│   ├── Electron Template-1.0.0-arm64.dmg      # DMG 安装镜像
│   ├── Electron Template-1.0.0-arm64.zip      # ZIP 压缩包
│   └── mac-arm64/                              # 原始 .app 目录
│       └── Electron Template.app/
│
├── 🔄 自动更新相关
│   ├── latest-mac.yml                          # 版本元数据
│   ├── *.blockmap                              # 增量更新映射
│
└── 🔧 调试/配置文件
    ├── builder-debug.yml                       # 构建调试信息
    └── builder-effective-config.yaml           # 实际生效的配置
```

## 文件详解

### 可分发文件

| 文件 | 大小 | 说明 |
|------|------|------|
| **`.dmg`** | ~128 MB | **macOS 安装镜像** - 用户双击打开，拖拽到 Applications 安装。这是最常见的 macOS 软件分发方式 |
| **`.zip`** | ~129 MB | **压缩包** - 解压后直接得到 .app，适合不需要安装过程的场景，也用于自动更新下载 |
| **`mac-arm64/`** | ~304 MB | **原始 .app 目录** - 未压缩的应用程序，electron-builder 用这个生成 dmg/zip |

### 自动更新文件

| 文件 | 说明 |
|------|------|
| **`latest-mac.yml`** | 自动更新元数据，包含版本号、文件名、SHA512 校验和。发布到 GitHub Releases 后，`electron-updater` 会读取这个文件来检查更新 |
| **`.blockmap`** | 增量更新映射文件，用于差分更新（只下载变化的部分），大幅减少更新下载量 |

### 调试文件

| 文件 | 说明 |
|------|------|
| **`builder-debug.yml`** | 构建过程的调试日志 |
| **`builder-effective-config.yaml`** | 实际生效的 electron-builder 配置，可以查看最终用了哪些参数 |

## .app 内部结构

```
Electron Template.app/
└── Contents/
    ├── MacOS/
    │   └── Electron Template          # 主可执行文件
    │
    ├── Resources/
    │   ├── app-update.yml             # 自动更新配置
    │   ├── electron.icns              # 应用图标
    │   └── ffmpeg                     # FFmpeg 二进制 (extraResources)
    │
    ├── Frameworks/                    # Electron 框架和依赖 (~120 MB)
    │   ├── Electron Framework.framework/   # Chromium + Node.js 核心
    │   ├── Electron Template Helper*.app/  # 辅助进程 (GPU/渲染/插件)
    │   ├── Squirrel.framework/             # macOS 自动更新框架
    │   ├── Mantle.framework/               # ObjC 模型框架
    │   └── ReactiveObjC.framework/         # 响应式编程框架
    │
    ├── Info.plist                     # 应用元数据 (版本号、Bundle ID 等)
    ├── PkgInfo                        # 包类型标识
    └── _CodeSignature/                # 代码签名 (当前为 ad-hoc 临时签名)
```

### Frameworks 目录说明

| 框架 | 说明 |
|------|------|
| **Electron Framework** | Chromium 浏览器引擎 + Node.js 运行时，这是 Electron 的核心 |
| **Helper (GPU)** | GPU 进程，负责图形渲染加速 |
| **Helper (Renderer)** | 渲染进程，运行你的 React 应用 |
| **Helper (Plugin)** | 插件进程，运行 PPAPI 插件 |
| **Squirrel** | macOS 自动更新框架，`electron-updater` 在 macOS 上使用它 |

## 构建流程

```
pnpm run build:mac
       │
       ├── 1. pnpm run build
       │      ├── tsc -p tsconfig.node.json     # 编译主进程 TypeScript
       │      │   src/main/**/*.ts → dist-electron/
       │      │
       │      └── vite build                    # 构建渲染进程
       │          src/renderer/**/* → dist/
       │
       └── 2. electron-builder --mac
              ├── 收集文件 (dist-electron/, dist/)
              ├── 复制 extraResources (ffmpeg, ffprobe)
              ├── 下载 Electron 二进制文件
              ├── 打包 .app
              ├── 生成 .dmg 安装镜像
              └── 生成 .zip 压缩包
```

## 测试安装

```bash
# 方式 1: 打开 DMG 安装镜像
open release/1.0.0/Electron\ Template-1.0.0-arm64.dmg

# 方式 2: 直接运行 .app
open release/1.0.0/mac-arm64/Electron\ Template.app
```

> **注意：** 因为应用没有签名，首次打开会提示"无法打开，因为 Apple 无法检查其是否包含恶意软件"。
> 
> 解决方法：右键点击 .app → 选择"打开" → 在弹窗中点击"打开"

## 各平台构建命令

| 命令 | 输出格式 |
|------|---------|
| `pnpm run build:mac` | `.dmg`, `.zip` |
| `pnpm run build:win` | `.exe` (NSIS 安装程序), `.exe` (便携版) |
| `pnpm run build:linux` | `.AppImage`, `.deb` |

## 发布到 GitHub Releases

```bash
# 1. 更新 package.json 中的版本号
# 2. 创建 git tag
git tag v1.0.0
git push origin v1.0.0

# 3. 构建并发布 (需要配置 GH_TOKEN 环境变量)
GH_TOKEN=your_github_token pnpm run release
```

或者使用 GitHub Actions 自动发布（推送 tag 时自动触发）。

## 减小包体积

当前包体积约 128 MB，主要组成：

| 组件 | 大小 | 是否可移除 |
|------|------|-----------|
| Electron 框架 | ~100 MB | ❌ 核心组件 |
| FFmpeg 二进制 | ~20 MB | ✅ 如不需要视频处理可移除 |
| 应用代码 | ~5 MB | ❌ 你的代码 |

**移除 FFmpeg 的方法：**

1. 删除 `electron-builder.json` 中的 `extraResources` 配置
2. 移除 `ffmpeg-static` 和 `@ffprobe-installer/ffprobe` 依赖
3. 删除 `src/main/modules/ffmpeg/` 目录
