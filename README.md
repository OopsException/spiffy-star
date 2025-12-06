# **Spiffy Star**

**Spiffy Star** is the personal website and blog of **Bahaa**. A place to publish thoughts, projects, links, and anything worth documenting.
The site is fully developed and maintained by **his brother**, who handles the design, structure, and deployment.

---

## ✨ Overview

Spiffy Star is built to be:

* **Fast** and lightweight
* **Minimal** in design, focused on content
* **Easy to maintain**, publish, and extend
* **SEO-friendly** with clean metadata
* **Fully static** for reliable deployment

---

## 🛠 Tech Stack

* **Astro** - main framework
* **TypeScript**
* **Markdown & MDX** for all posts
* **Custom CSS** for styling
* Deployable on **Netlify**

---

## 🚀 Development

Install dependencies:

```sh
npm install
```

Run in development:

```sh
npm run dev
```

Build:

```sh
npm run build
```

Preview production:

```sh
npm run preview
```

---

## 📁 Structure

```
/
├─ public/          # Static assets
├─ src/
│  ├─ components/   # UI components
│  ├─ content/      # Blog posts (MD/MDX)
│  ├─ layouts/      # Page + post layouts
│  ├─ pages/        # Site pages
│  └─ styles/       # Styling
└─ package.json
```

---

## ✏️ Creating Content

Add posts inside:

```
src/content/
```

A sample post:

```md
---
title: "Post Title"
description: "Short description"
publishDate: 2025-01-01
---

Your content goes here.
```

---

## 📦 Deployment

The site builds into static files (`dist/`) and can be deployed anywhere:

* Vercel
* Netlify
* GitHub Pages
* Cloudflare Pages

Just build and upload:

```sh
npm run build
```