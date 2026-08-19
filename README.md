# 星页（Star Tab）

「星页」是一款面向个人使用的 Chrome 新标签页扩展，含义是“如星辰般的新标签页”。项目基于 Vue 3、TypeScript、Vite、Pinia 和 Chrome Manifest V3，无后端、无账号，书签与配置仅保存在本机浏览器中。

## 主要功能

- 展示当前时间、日期和可选秒数。
- 搜索框同时支持书签搜索和网页搜索：
  - 输入内容时匹配整个 Chrome 书签树，包括深层文件夹中的书签。
  - 可直接切换“浏览器默认”、Google、Bing、百度和 DuckDuckGo，选择会保存在本机。
  - 未选中书签时按回车，使用当前选中的搜索引擎搜索。
  - 使用上下方向键或鼠标选择书签后按回车，打开对应网页。
- 读取 Chrome 书签和文件夹，自动加载网站图标。
- 支持“宫格”和“星球”两种书签布局，可在主页控制条中直接切换；星球模式将书签投影到动态 3D 球面，所有节点持续运动，并支持拖拽旋转、滚轮或按钮缩放、双击复位。
- 点击文件夹后以中央毛玻璃弹层展示，支持多级文件夹导航。
- 在设置中选择主页展示的书签分组，并使用上移、下移调整分组顺序。
- 内置 6 套动态星空主题，支持关闭动态效果，并适配系统“减少动态效果”设置。
- 设置实时写入本机，刷新浏览器或重新打开 Chrome 后仍会恢复。
- 页面不可见时暂停 Canvas 动画，减少 CPU/GPU 消耗。

## 运行环境

- 桌面版 Google Chrome。
- Node.js `20.19+` 或 `22.12+`。
- npm。

当前项目只面向 Chrome 本地安装，不包含云同步、登录、书签编辑、浏览历史和自动发布到 Chrome Web Store。

## 技术栈

- Vue 3 + Composition API
- TypeScript
- Vite
- Pinia
- Chrome Manifest V3
- Vitest + Vue Test Utils
- Playwright

## 项目结构

```text
star-tab/
├── public/
│   ├── manifest.json              # Chrome 扩展清单
│   └── icons/                     # 扩展图标
├── src/
│   ├── backgrounds/
│   │   ├── index.ts               # 主题注册表
│   │   ├── motionProfiles.ts      # 每套主题的动态参数
│   │   └── styles/                # 每套主题独立 CSS
│   ├── components/                # 时钟、搜索、宫格/星图书签、设置等组件
│   ├── composables/               # 书签、搜索、设置和背景逻辑
│   ├── search/engines.ts           # 搜索引擎注册表与搜索地址生成
│   ├── services/browser.ts        # Chrome API 与开发模式适配层
│   ├── stores/starPage.ts         # Pinia 状态与配置持久化
│   ├── styles/main.css            # 页面公共样式
│   └── utils/                     # 书签转换、星图布局、搜索和配置校验
├── tests/e2e/                     # Playwright 浏览器测试
├── package.json
└── vite.config.ts
```

## 安装依赖

在项目根目录执行：

```bash
npm install
```

`package-lock.json` 已记录依赖版本，自动化环境也可以使用：

```bash
npm ci
```

## 本地开发预览

```bash
npm run dev
```

然后打开终端显示的地址，通常为 `http://localhost:5173`。

普通网页无法访问 `chrome.bookmarks`、`chrome.search`、`chrome.storage` 等扩展 API，因此开发预览模式存在以下差异：

- 使用 `src/data/mockBookmarks.ts` 中的模拟书签。
- 网页搜索只显示“原型模式”提示，不会真的跳转到搜索结果页。
- 配置保存在当前开发地址的 `localStorage` 中。
- 网站图标使用首字母回退图标。

需要验证真实书签、默认搜索、网站图标和扩展存储时，请构建后加载 `dist` 目录。

## 构建扩展

执行：

```bash
npm run build
```

这个命令会先运行 TypeScript 类型检查，再由 Vite 生成生产文件。最终可安装产物位于：

```text
dist/
├── manifest.json
├── index.html
├── icons/
└── assets/
```

请注意：Chrome 加载的是构建后的 `dist` 目录，不是项目源码根目录。

## 安装到 Chrome（推荐）

个人使用时推荐直接加载已解压扩展，不需要制作 `.crx`。

1. 先执行 `npm run build`。
2. 在 Chrome 地址栏打开 `chrome://extensions`。
3. 打开页面右上角的“开发者模式”。
4. 点击“加载已解压的扩展程序”。
5. 选择本项目生成的 `dist` 目录。
6. 打开一个新标签页，确认“星页”已经接管新标签页。

### 修改代码后更新扩展

每次修改代码后执行：

```bash
npm run build
```

然后回到 `chrome://extensions`，在“星页”卡片上点击“重新加载”。已经打开的新标签页不会自动刷新，重新打开或手动刷新即可。

## 打包为 ZIP

ZIP 适合备份、分享给其他设备解压后加载，也可作为以后上传 Chrome Web Store 的包。

### 使用 Makefile（推荐）

macOS、Linux、WSL 或 Git Bash 环境中，确认已经安装 `make` 和 `zip`，然后在项目根目录执行：

```bash
make package
```

也可以直接执行 `make`，默认目标同样是打包插件。脚本会重新构建 `dist`、检查 `manifest.json`、覆盖旧包，并将 `dist` 目录内的内容打包到项目根目录的 `StarTab.zip`。

如需只删除已生成的 ZIP：

```bash
make clean-package
```

### Windows PowerShell（不使用 Makefile）

```powershell
npm run build
Compress-Archive -Path dist\* -DestinationPath StarTab.zip -Force
```

生成的 ZIP 解压后，应直接看到以下文件，而不是先出现一层 `dist` 文件夹：

```text
manifest.json
index.html
icons/
assets/
```

`manifest.json` 必须位于 ZIP 根目录。若只是本地使用，解压 ZIP 后按照“加载已解压的扩展程序”步骤安装即可。

## 打包为 `.crx`

Chrome 可以把 `dist` 目录签名为单个 `.crx` 文件：

1. 执行 `npm run build`。
2. 打开 `chrome://extensions` 并开启“开发者模式”。
3. 点击“打包扩展程序”。
4. “扩展程序根目录”选择本项目的 `dist` 目录。
5. 第一次打包时将“私钥文件”留空。
6. Chrome 会生成 `.crx` 和 `.pem` 文件。

其中 `.pem` 是扩展签名私钥：

- 不要提交到 Git 仓库，也不要发送给其他人。
- 后续生成同一扩展的新版本时必须继续使用这份 `.pem`。
- 丢失私钥后，新包可能会获得不同的扩展 ID，无法作为原扩展的直接更新。

部分 Chrome 环境或设备策略可能阻止直接安装非商店来源的 `.crx`。个人使用时，“加载已解压的扩展程序”通常更方便、更容易调试。

### 更新 `.crx` 版本

1. 修改 `public/manifest.json` 中的 `version`，新版本号必须高于旧版本。
2. 同步修改 `package.json` 中的项目版本。
3. 执行 `npm run build`。
4. 再次使用“打包扩展程序”，扩展根目录仍选择 `dist`。
5. 私钥文件选择第一次生成的 `.pem`。

## 上传 Chrome Web Store（可选）

当前项目默认范围不包含商店发布。如果以后需要发布，基本流程如下：

1. 注册 Chrome Web Store 开发者账号。
2. 更新 `public/manifest.json` 的版本、名称、描述和图标。
3. 完整运行测试并执行 `npm run build`。
4. 将 `dist` 目录中的内容压缩为 ZIP，确保 `manifest.json` 位于 ZIP 根目录。
5. 在 Chrome Web Store Developer Dashboard 创建项目并上传 ZIP。
6. 补充商店介绍、截图、隐私声明和权限用途后提交审核。

官方文档：

- [本地加载已解压扩展](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)
- [准备 Chrome Web Store 扩展包](https://developer.chrome.com/docs/webstore/prepare)
- [发布到 Chrome Web Store](https://developer.chrome.com/docs/webstore/publish)

## 权限说明

扩展清单位于 `public/manifest.json`，仅申请以下权限：

| 权限 | 用途 |
| --- | --- |
| `bookmarks` | 读取书签树，并监听书签新增、删除、移动和改名 |
| `favicon` | 通过 Chrome `_favicon` 接口加载网站图标 |
| `search` | 选择“浏览器默认”时，调用用户当前的 Chrome 默认搜索引擎 |
| `storage` | 将背景、显示分组、分组顺序等配置保存在本机 |

项目没有申请任意网站访问权限，也不会将书签或配置上传到服务器。

Chrome 的 `search` API 只支持调用浏览器当前的默认搜索服务。Google、Bing、百度和 DuckDuckGo 选项通过当前标签页直接打开对应搜索结果 URL，不需要额外的网站访问权限。

## 配置保存位置

真实扩展模式使用 `chrome.storage.local`，存储键为：

```text
star-page:settings
```

保存内容包括：

- 当前背景主题。
- 主页展示的书签文件夹 ID 及排列顺序。
- 当前选择的搜索引擎。
- 是否显示秒数。
- 是否启用紧凑布局。
- 是否启用动态背景。
- 配置版本号。

本地开发预览使用浏览器 `localStorage` 的同名键作为替代。配置不会自动同步到其他 Chrome 账号或设备。

## 常用快捷操作

| 操作 | 效果 |
| --- | --- |
| `/` | 光标不在输入框时，快速聚焦搜索框 |
| `↑` / `↓` | 在书签搜索结果中移动选择 |
| `Enter` | 未选择书签时使用当前引擎搜索；选择书签后打开网页 |
| `Esc` | 关闭搜索建议、文件夹弹层或设置面板 |
| `Ctrl/Cmd + 点击` | 使用浏览器原生方式打开书签链接 |

## 测试与质量检查

### 类型检查

```bash
npm run typecheck
```

### 单元测试

```bash
npm test
```

持续监听模式：

```bash
npm run test:watch
```

### 浏览器端到端测试

```bash
npm run test:e2e
```

Playwright 会自动启动本地 Vite 服务，并使用本机 Chrome 验证搜索、书签弹层、设置保存、分组排序和动态背景。

### 完整交付检查

```bash
npm run typecheck
npm test
npm run test:e2e
npm run build
```

## 新增背景主题

1. 在 `src/backgrounds/index.ts` 注册主题名称、ID、类型和 CSS 类名。
2. 在 `src/backgrounds/styles/` 创建该主题独立的 CSS 文件。
3. 在 `src/backgrounds/styles/index.css` 导入新 CSS。
4. 在 `src/backgrounds/motionProfiles.ts` 添加对应的动画参数。
5. 更新背景配置测试和 Playwright 背景列表。

## 常见问题

### 本地预览为什么看不到自己的 Chrome 书签？

`npm run dev` 打开的普通网页没有扩展权限，只能使用模拟书签。执行 `npm run build` 并将 `dist` 加载到 Chrome 后，才能读取真实书签。

### 为什么网页搜索只显示提示？

这是开发预览模式的设计。加载 `dist` 后，“浏览器默认”会调用真实的 Chrome 默认搜索引擎，其他选项会打开对应引擎的搜索结果页。

### Chrome 提示找不到或无法解析清单文件

确认选择的是 `dist` 目录，并检查其中是否直接存在 `manifest.json`。如果没有，请先执行 `npm run build`。

### 修改代码后 Chrome 页面没有变化

重新执行 `npm run build`，然后在 `chrome://extensions` 中点击扩展的“重新加载”，最后重新打开新标签页。

### 动态背景没有播放

检查设置中的“动态星空”是否开启。如果操作系统开启了“减少动态效果”，星页会遵循系统偏好自动暂停动画。

### 新标签页没有显示星页

Chrome 同一时间只能由一个扩展接管新标签页。检查是否安装了其他新标签页扩展，并在 `chrome://extensions` 中确认“星页”已启用。

## 隐私说明

- 无后端服务、无登录和无统计上报。
- 不上传书签、搜索内容或设置。
- 书签来自 Chrome `bookmarks` API。
- 设置保存在 `chrome.storage.local`。
- 搜索内容仅在按回车执行网页搜索时交给当前选中的搜索引擎。
