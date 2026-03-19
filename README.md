# Repow! ⚡

> Awesome links, supercharged. A community-driven link repository — curated, tagged, and actually searchable.

**[→ repow.kira1q.dev](https://repow.kira1q.dev)**

---

## What is this?

Repow! is a self-hostable, searchable link repository — like an awesome-list, but with a real UI. No more ctrl+F-ing through a giant markdown file.

- 🔍 **Fuzzy search** across titles, descriptions, tags, and URLs
- 🏷️ **Clickable tags & badges** — click any tag or badge to filter instantly
- 📂 **Categories** — browsable sidebar with jump-to navigation
- ➕ **Add link form** — generates ready-to-paste YAML for PRs
- 📄 **YAML-driven** — all links live in one `links.yaml` file, easy to contribute via PR

---

## Contributing a link

All links live in [`links.yaml`](./links.yaml). To add one:

1. **Fork** this repo
2. **Edit** `links.yaml` — add your link under the right category (or create a new one)
3. **Open a PR** — that's it

### Link format

```yaml
categories:
  - name: "Category Name"
    icon: "🛠️"
    links:
      - title: "Tool Name"
        url: "https://example.com"
        description: "One-liner about what it does."
        tags: [tag1, tag2, tag3]
        badges: [free, opensource]
```

### Available badges

| Badge | Meaning |
|-------|---------|
| `community` | Maintained by the community |
| `opensource` | Source code is public |
| `official` | Made by the official org/team |
| `free` | Free to use |
| `paid` | Requires payment |
| `tool` | It's an app/tool, not just a resource |

### PR guidelines

- One link per PR — keeps reviews clean and fast
- Description should be a single concise sentence
- Tags lowercase, no spaces (use `-` if needed e.g. `open-source`)
- Always add the `paid` badge if the tool isn't free
- Link must be publicly accessible

---

## Running locally

> **Note:** You can't just double-click `index.html` — the app fetches `links.yaml` at runtime, which requires a local server.

```bash
# Option 1 — Node
npx serve .

# Option 2 — Python
python3 -m http.server

# Then open http://localhost:3000 (or whatever port it prints)
```

---

## File structure

```
repow/
├── index.html      # HTML structure
├── style.css       # All styles (Geist font, glassmorphism dark theme)
├── app.js          # App logic — search, render, modals
├── links.yaml      # ← All the links live here. Edit this.
├── CNAME           # Custom domain for GitHub Pages
└── README.md
```

---

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus search |
| `Esc` | Clear search / close modal |
| `+` | Open "add link" form |

---

## Deploying your own instance

1. **Fork** this repo
2. Go to **Settings → Pages → Source → Deploy from branch → main → / (root)**
3. Add a `CNAME` file to the repo root with your domain (e.g. `repow.yourdomain.com`)
4. In your DNS provider, add a `CNAME` record pointing to `yourusername.github.io`
5. Set your custom domain under **Settings → Pages → Custom domain**
6. Wait a few minutes for DNS to propagate, then tick **Enforce HTTPS**

Full guide: [GitHub Pages custom domain docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)

---

## Tech stack

No build step. No npm install. Just files.

| | |
|--|--|
| [Fuse.js](https://fusejs.io/) | Fuzzy search |
| [js-yaml](https://github.com/nodeca/js-yaml) | YAML parsing in the browser |
| [Geist](https://vercel.com/font) | Font by Vercel |

---

## License

MIT — fork it, remix it, make it yours.
