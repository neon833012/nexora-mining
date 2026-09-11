# Cloudflare Pages Deployment Guide - Neon Mining

This app is fully optimized and configured for **Cloudflare Pages** with high performance, edge caching headers, and SPA routing.

---

## ⚡ Option 1: 1-Command CLI Deployment (Fastest)

If you have a free Cloudflare account:

1. **Login to Cloudflare in terminal:**
   ```bash
   npx wrangler login
   ```
   *(This will open your browser to authorize your free Cloudflare account)*

2. **Deploy directly:**
   ```bash
   npm run deploy:cf
   ```

3. Your site will instantly be live at:
   ```
   https://neon-mining.pages.dev
   ```

---

## 🌐 Option 2: Drag & Drop Deploy (Zero CLI)

1. Open the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Workers & Pages** -> **Create application** -> **Pages**.
3. Select **Upload assets**.
4. Set project name: `neon-mining`.
5. Drag and drop the `dist/` folder.
6. Click **Deploy site** — It's live in 10 seconds!

---

## 🔄 Option 3: Connect to GitHub / GitLab (Auto Deploy on Push)

1. Push this project to GitHub.
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) -> **Workers & Pages** -> **Pages** -> **Connect to Git**.
3. Select your repository.
4. Set the build configurations:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node.js version**: `18` or `20+`
5. Click **Save and Deploy**. Every `git push` will now automatically build and update your live site!

---

## 🛠 Local Cloudflare Pages Emulator

You can also test the exact Cloudflare edge environment locally:
```bash
npm run preview:cf
```
Accessible at `http://localhost:8788/`.
