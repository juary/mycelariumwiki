# Mycelarium Wiki

为 **PLAN KAPKAN 开发的 Mycelarium** 建立的独立英文游戏 Wiki。项目以静态页面整理入门攻略、蘑菇资料、生态系统机制和版本更新，部署在 GitHub Pages。

**在线访问：[https://juary.github.io/mycelariumwiki/](https://juary.github.io/mycelariumwiki/)**

**相关 Wiki：[https://mycelarium.top/](https://mycelarium.top/)**

**项目仓库：[juary/mycelariumwiki](https://github.com/juary/mycelariumwiki)**

> An independent, English-language fan wiki for Mycelarium by PLAN KAPKAN. Explore beginner guides, mushroom references, ecosystem mechanics, and source-backed update notes. Visit the [GitHub Pages website](https://juary.github.io/mycelariumwiki/) and the [related Mycelarium Wiki](https://mycelarium.top/).

## 项目介绍

Mycelarium 是一款以地下菌丝网络和生态系统为主题的游戏。本项目面向希望快速查找玩法资料的玩家：从新手入口了解基本系统，再通过分类和搜索进入具体专题。

本项目对应 Steam 正式版 **App ID 5181520**；免费 Demo 使用独立的 **App ID 5371480**。同名游戏可能拥有不同玩法，因此文章会说明所对应的游戏和资料来源。

网站采用分类导航、快速入门和专题资料页，使用独立实现的页面、样式和内容。新站与 [mycelarium.top](https://mycelarium.top/) 是独立部署的项目，About 页面和页脚提供相关站点入口。

## 网站功能

| 栏目或功能 | 内容 |
| --- | --- |
| 首页 | 游戏介绍、入门入口、专题分类和推荐文章 |
| Guides | 新手指南、游戏模式、Demo 与正式版、成就等攻略 |
| Mushrooms | 已有来源支持的蘑菇作用与相关机制 |
| Mechanics | 食物、水、菌丝升级等生态系统机制 |
| Updates | 有明确版本和出处的更新说明 |
| About | 项目介绍、独立粉丝站声明与 mycelarium.top 链接 |
| 搜索 | 在浏览器内搜索文章，无需账号或服务器 |
| 主题与适配 | 深色 / 浅色主题，适配桌面和手机 |

文章独立生成 HTML 页面，基本内容和导航不依赖 JavaScript。少量浏览器脚本负责搜索、主题等交互。项目无需数据库、后端服务或运行时 API 密钥。

## 本地运行

需要 **Node.js 22 或更高版本**，以及随 Node.js 安装的 npm。项目没有第三方 npm 依赖，无需执行 `npm install`。

```sh
git clone https://github.com/juary/mycelariumwiki.git
cd mycelariumwiki
npm run build
npm run dev
```

打开终端输出的本地预览地址；默认端口为 `4173`。本项目部署在 `/mycelariumwiki/` 子路径，预览时也应使用对应路径。

```sh
# 重新生成所有静态页面
npm run build

# 检查生成结果
npm test
```

构建结果位于 `dist/`，可由普通静态文件服务器直接托管。`dist/` 不提交到源码仓库，由 GitHub Actions 在部署时重新生成。

## 项目结构

```text
mycelariumwiki/
├── .github/workflows/deploy.yml  # GitHub Pages 构建与发布
├── docs/
│   ├── DEPLOYMENT.md            # 部署与排查说明
│   └── SOURCES.md               # 内容来源与资料边界
├── public/                     # 本地静态资源
├── scripts/
│   ├── build.mjs               # 静态页面生成器
│   └── serve.mjs               # 本地预览服务
├── src/
│   └── data/
│       ├── content.json        # 分类、文章与来源
│       └── site.json           # 站点信息与界面文案
├── package.json
└── README.md
```

## 内容维护

1. 在 `src/data/content.json` 中修改分类和文章。文章包含唯一 `slug`、分类、标题、简介、日期、正文段落和来源链接。
2. 新增或修订玩法事实时，核对开发者公告、Steam 商店或其他可追溯资料；区分正式版与 Demo、当前机制与历史版本。
3. 在 `src/data/site.json` 中维护站点资料和界面文案；不要把站点身份散落在页面模板中。
4. 如有新增图片，放入项目静态资源目录，同时记录出处、说明和权利归属。不要把示意图当作真实游戏截图。
5. 运行 `npm run build` 和 `npm test`，本地检查文章、搜索以及手机布局后提交。

文章中的更新日期表示内容整理或核对日期，不等于游戏补丁发布日期。本 Wiki 不将尚无证据的机制、成就路线或数值作为已确认事实。资料范围见 [docs/SOURCES.md](docs/SOURCES.md)。

## GitHub Pages 自动部署

仓库默认分支为 `main`。工作流位于 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)，会在推送至 `main` 或手动触发时构建并发布静态站点。

首次启用时，在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。部署成功后，访问：

**[https://juary.github.io/mycelariumwiki/](https://juary.github.io/mycelariumwiki/)**

此项目使用 GitHub Pages 项目路径，不需要填写自定义域名，也不应添加指向 `mycelarium.top` 的 `CNAME`。`mycelarium.top` 是 About、README 和站点页脚中展示的相关 Wiki 链接。

完整步骤与常见问题见 [部署说明](docs/DEPLOYMENT.md)。

## 参与贡献

欢迎通过 [Issues](https://github.com/juary/mycelariumwiki/issues) 报告错误、提供可靠来源或建议专题，也欢迎通过 Pull Request 改进文章和页面。涉及玩法修正时，请附对应游戏版本和证据链接。

## 版权与声明

本项目是独立粉丝 Wiki，与 Mycelarium 开发者 **PLAN KAPKAN** 无隶属或官方合作关系。

本项目原创代码和原创文字采用 [MIT License](LICENSE)。Mycelarium 的名称、游戏截图、宣传美术及其他第三方素材归其各自权利人所有，不因本仓库使用 MIT 许可而获得重新授权。

相关入口：[GitHub Pages 新站](https://juary.github.io/mycelariumwiki/) · [mycelarium.top](https://mycelarium.top/) · [Mycelarium on Steam](https://store.steampowered.com/app/5181520/Mycelarium/)
