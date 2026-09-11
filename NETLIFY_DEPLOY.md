# Netlify Deployment Guide - NEON MINING

The project is pre-built, tested, and 100% configured for **Netlify** with `netlify.toml`, SPA redirect rules (`_redirects`), and security headers.

---

## ⚡ Option 1: Drag & Drop Deploy (10 Seconds - No Terminal / Git Needed!)

1. Open **[app.netlify.com/drop](https://app.netlify.com/drop)** in your browser.
2. Login to your free Netlify account.
3. Open File Explorer on your computer and navigate to your project's `dist/` folder:
   ```
   dist/
   ```
4. **Drag and drop the entire `dist` folder** into the Netlify Drop box on the browser page.
5. Done! Your site will be live instantly with a free custom SSL link like:
   `https://neon-mining.netlify.app`

---

## 🚀 Option 2: 1-Click Terminal Deploy

Run this command in your terminal:
```bash
npm run deploy:netlify
```
- It will open a browser window to authenticate with Netlify.
- Select "Create & configure a new site" (or link an existing one).
- It will deploy the `dist/` folder immediately to production!

---

## 🔄 Option 3: Connect to GitHub (Auto-Deploy on Push)

1. Push your repository to GitHub.
2. Go to [app.netlify.com](https://app.netlify.com/) -> **Add new site** -> **Import an existing project**.
3. Select GitHub and choose this repository.
4. Netlify will automatically detect [`netlify.toml`](./netlify.toml):
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click **Deploy Site**. Every time you push a change to GitHub, Netlify will automatically rebuild and deploy!
