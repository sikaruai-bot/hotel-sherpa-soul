# Hotel Sherpa Soul — Production Deployment Manual

---

## Deployment Option A: cPanel / LiteSpeed Hosting (Existing Host)
1. **Node.js Setup:** In cPanel, open **Setup Node.js App** (Node.js v20+ recommended).
2. **Upload Code:** Upload source code (excluding `node_modules` and `.next`).
3. **Install Dependencies:** Click **Run NPM Install** in cPanel.
4. **Build Application:** In cPanel terminal or SSH:
   ```bash
   npm run build
   ```
5. **Start Application:** Start the application via cPanel Node.js Application Manager with LiteSpeed reverse proxy forwarding port 3000 to `hotelsherpasoul.com`.

---

## Deployment Option B: Vercel (Recommended for Global CDN & Speed)
1. Push repository to Client-owned GitHub account (`mingmasaino`).
2. Log into [Vercel](https://vercel.com) using the Client's email.
3. Import the repository.
4. Add environment variables from `.env.example`.
5. Connect custom domain `hotelsherpasoul.com`.
