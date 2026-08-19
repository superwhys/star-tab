# 星页

如星辰般的新标签页。基于 Vue 3、TypeScript、Vite 和 Chrome Manifest V3。

## 本地预览

```bash
npm install
npm run dev
```

普通浏览器预览会使用内置模拟书签，方便体验文件夹弹层和设置交互。

## 安装到 Chrome

```bash
npm run build
```

然后打开 `chrome://extensions`：

1. 开启“开发者模式”。
2. 点击“加载已解压的扩展程序”。
3. 选择本项目的 `dist` 目录。
4. 新建标签页即可使用。

扩展只申请书签、站点图标、默认搜索和本地存储权限。书签与设置不会上传到任何服务器。

## 验证

```bash
npm run typecheck
npm test
npm run test:e2e
npm run build
```

