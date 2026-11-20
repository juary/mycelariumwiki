# Mycelarium Wiki

An independent, English-language game wiki for **Mycelarium**, developed by PLAN KAPKAN. This static website brings together beginner guides, mushroom references, ecosystem mechanics, and source-backed update notes, and is hosted on GitHub Pages.

**Live site: [https://juary.github.io/mycelariumwiki/](https://juary.github.io/mycelariumwiki/)**

**Related wiki: [https://mycelarium.top/](https://mycelarium.top/)**

**Repository: [juary/mycelariumwiki](https://github.com/juary/mycelariumwiki)**

## About the project

Mycelarium is a game about an underground mycelium network and its ecosystem. This project helps players quickly find gameplay information: start with the beginner guides to learn the basics, then browse categories or search for a specific topic.

This wiki covers the full Steam release, **App ID 5181520**. The free demo has a separate **App ID 5371480**. Games with the same name may have different gameplay, so articles identify the version they cover and cite their sources.

The site uses category navigation, quick-start guides, and topic-specific reference pages, with its own implementation of the pages, styles, and content. It is a separately deployed project from [mycelarium.top](https://mycelarium.top/); the About page and footer link to the related site.

## Site features

| Section or feature | Description |
| --- | --- |
| Home | Game introduction, starting points, topic categories, and featured articles |
| Guides | Beginner guides, game modes, demo and full-release details, achievements, and more |
| Mushrooms | Mushroom effects and related mechanics supported by available sources |
| Mechanics | Ecosystem mechanics, including food, water, and mycelium upgrades |
| Updates | Update notes with a clearly identified version and source |
| About | Project information, independent fan-site notice, and a link to mycelarium.top |
| Search | Search articles in the browser without an account or server |
| Themes and responsive layout | Dark and light themes, adapted for desktop and mobile |

Each article is generated as a standalone HTML page, so the core content and navigation do not depend on JavaScript. A small amount of browser-side scripting powers search, theme controls, and other interactions. The project requires no database, backend service, or runtime API keys.

## Run locally

You need **Node.js 22 or later** and npm, which is included with Node.js. The project has no third-party npm dependencies, so you do not need to run `npm install`.

```sh
git clone https://github.com/juary/mycelariumwiki.git
cd mycelariumwiki
npm run build
npm run dev
```

Open the local preview URL shown in the terminal. The default port is `4173`. This project is deployed under the `/mycelariumwiki/` subpath, so use that path when previewing locally as well.

```sh
# Regenerate all static pages
npm run build

# Check the generated output
npm test
```

The build output is in `dist/` and can be hosted by any standard static file server. `dist/` is not committed to the source repository; GitHub Actions regenerates it during deployment.

## Project structure

```text
mycelariumwiki/
├── .github/workflows/deploy.yml  # Build and publish to GitHub Pages
├── docs/
│   ├── DEPLOYMENT.md            # Deployment and troubleshooting guide
│   └── SOURCES.md               # Content sources and scope
├── public/                      # Static assets
├── scripts/
│   ├── build.mjs                # Static page generator
│   └── serve.mjs                # Local preview server
├── src/
│   └── data/
│       ├── content.json         # Categories, articles, and sources
│       └── site.json            # Site information and interface copy
├── package.json
└── README.md
```

## Content maintenance

1. Edit categories and articles in `src/data/content.json`. Each article includes a unique `slug`, category, title, summary, date, body paragraphs, and source links.
2. When adding or revising gameplay information, check developer announcements, the Steam store, or other traceable sources. Distinguish the full release from the demo, and current mechanics from those in older versions.
3. Maintain site details and interface copy in `src/data/site.json`; avoid scattering site identity information across page templates.
4. Put any new images in the project's static assets directory and record their source, description, and rights holder. Do not present illustrative images as actual game screenshots.
5. Run `npm run build` and `npm test`, then review the articles, search, and mobile layout locally before submitting your changes.

Article update dates indicate when content was compiled or checked; they are not the game's patch release dates. This wiki does not present mechanics, achievement routes, or numerical values as confirmed facts without supporting evidence. See [docs/SOURCES.md](docs/SOURCES.md) for the scope of the reference material.

## Automatic deployment to GitHub Pages

The repository's default branch is `main`. The workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and publishes the static site when changes are pushed to `main` or when the workflow is triggered manually.

To enable deployment for the first time, go to **Settings → Pages → Build and deployment → Source** in the repository and select **GitHub Actions**. After a successful deployment, visit:

**[https://juary.github.io/mycelariumwiki/](https://juary.github.io/mycelariumwiki/)**

This project uses a GitHub Pages project path. You do not need to configure a custom domain or add a `CNAME` pointing to `mycelarium.top`. The `mycelarium.top` address is linked as a related wiki from the About page, README, and site footer.

For complete instructions and common issues, see the [deployment guide](docs/DEPLOYMENT.md).

## Contributing

Use [Issues](https://github.com/juary/mycelariumwiki/issues) to report errors, share reliable sources, or suggest topics. Pull Requests improving articles or pages are also welcome. When correcting gameplay information, include the relevant game version and a link to supporting evidence.

## Copyright and disclaimer

This is an independent fan wiki and is not affiliated with or officially partnered with Mycelarium developer **PLAN KAPKAN**.

Original code and original writing in this project are licensed under the [MIT License](LICENSE). The Mycelarium name, game screenshots, promotional artwork, and other third-party materials remain the property of their respective rights holders. The MIT License for this repository does not grant permission to reuse those materials.

Related links: [New GitHub Pages site](https://juary.github.io/mycelariumwiki/) · [mycelarium.top](https://mycelarium.top/) · [Mycelarium on Steam](https://store.steampowered.com/app/5181520/Mycelarium/)
