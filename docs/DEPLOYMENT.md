# GitHub Pages 部署说明

项目仓库为 [juary/mycelariumwiki](https://github.com/juary/mycelariumwiki)，部署目标为：

**[https://juary.github.io/mycelariumwiki/](https://juary.github.io/mycelariumwiki/)**

相关 Wiki：[https://mycelarium.top/](https://mycelarium.top/)。此链接用于项目介绍和相关站点入口，不是本 GitHub Pages 项目的自定义域名。

## 首次启用

1. 确认项目源码已推送至公开仓库 `juary/mycelariumwiki` 的 `main` 分支。
2. 打开仓库 **Settings → Pages**。
3. 在 **Build and deployment → Source** 选择 **GitHub Actions**。
4. 打开 **Actions → Build and deploy Mycelarium Wiki**。若没有新的自动运行记录，点击 **Run workflow**，选择 `main` 并运行。
5. 等待构建和部署两个任务完成。在部署任务输出或 Pages 设置页面打开站点链接。

GitHub Pages 的发布需要少量处理时间。工作流成功后，应实际打开首页、分类页、文章页和 About 页面，确认访问路径和资源都正常。

## 自动发布流程

工作流文件： [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)。

- 触发：推送至 `main`，或在 Actions 页面手动运行。
- 构建环境：Ubuntu，项目运行时 Node.js 22。
- 构建：`npm run build`，输出到 `dist/`。
- 验证：`npm test`，失败则不继续发布。
- 发布：上传 `dist/` 为 Pages 构建产物，再通过官方 Pages 部署 Action 发布。
- 并发：同一时间只处理一个 Pages 发布，正在进行的发布不会被新推送取消。

项目没有第三方 npm 依赖，不需要安装依赖，也不需要配置外部服务密钥。工作流使用 GitHub 自动提供的短期 `GITHUB_TOKEN`，声明 `contents: read`、`pages: write` 和 `id-token: write` 权限。

仓库策略或 GitHub 组织策略仍可能要求人工批准 `github-pages` 环境。若 Actions 显示等待审批，应由仓库管理员在对应运行记录中处理。

## 路径设置

GitHub Pages 项目站点部署在 `/mycelariumwiki/` 下。页面地址、样式、脚本、图片、搜索索引和 sitemap 必须带正确的项目路径；修改仓库名或迁移部署地址时，应同步更新站点配置和 README。

使用默认项目域名时：

- 不需要添加 `CNAME` 文件。
- 不需要配置 `mycelarium.top` 的 DNS。
- 不需要把现有相关 Wiki 的域名改绑到本仓库。

## 更新网站

编辑文章或站点文件后运行：

```sh
npm run build
npm test
npm run dev
```

完成本地检查后提交并推送至 `main`，工作流会自动重新构建和发布。构建目录 `dist/` 被忽略，源码变更才是版本控制对象。

## 常见问题

| 现象 | 检查方式 |
| --- | --- |
| 首页返回 404 | 核对仓库名、Pages Source 是否为 GitHub Actions，以及部署任务是否成功；使用完整 `/mycelariumwiki/` 路径 |
| 页面有文字但样式或图片丢失 | 检查静态资源地址是否包含 `/mycelariumwiki/`，不要使用错误的域名根路径 |
| 推送后站点未更新 | 打开 Actions 检查对应提交的运行结果；确认推送分支为 `main` |
| 部署任务等待处理 | 检查 `github-pages` 环境是否有审批要求 |
| Actions 权限错误 | 检查仓库和组织的 Actions/Pages 策略，确保允许使用工作流声明的 Pages 发布权限 |
| 本地预览旧内容 | 先重新运行 `npm run build`，再刷新浏览器 |

## 参考资料

- [GitHub：Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [actions/configure-pages](https://github.com/actions/configure-pages)
- [actions/upload-pages-artifact](https://github.com/actions/upload-pages-artifact)
- [actions/deploy-pages](https://github.com/actions/deploy-pages)
