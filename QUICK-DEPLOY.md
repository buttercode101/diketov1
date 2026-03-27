# ⚡ Quick Deploy - Diketo to Vercel

## 🚨 Critical Configuration

**Node.js version must be set in Vercel Dashboard:**
1. Settings → Build & Development Settings → Node.js Version → `20.x`
2. Save changes

---

## ✅ Deploy Now

### 1. Commit & Push
```bash
cd C:\Users\motaung\Games-Production\Diketo

git add .
git commit -m "fix: Configure Vercel deployment
- Add vercel.json, .npmrc
- Generate PWA icons
- Fix dependencies for Node 20.x compatibility"
git push origin main
```

### 2. Vercel Setup
1. Go to [vercel.com](https://vercel.com)
2. **Add New Project** → Import `Diketo` from GitHub
3. **Settings** → Set Node.js to `20.x` → Save
4. **Deployments** → Redeploy

---

## 📋 Vercel Settings

| Setting | Value | Where |
|---------|-------|-------|
| Framework | Vite | Auto-detected |
| Build Command | `npm run build` | `vercel.json` |
| Output Directory | `dist` | `vercel.json` |
| Node.js Version | `20.x` | **Dashboard Settings** ⚠️ |

---

## ✅ Verify Deployment

- [ ] Green checkmark on deployment
- [ ] Site loads at `diketo-*.vercel.app`
- [ ] Game playable (throw gho, scoop stones)
- [ ] PWA install works
- [ ] Mobile responsive

---

## 🔧 If Build Fails

| Error | Solution |
|-------|----------|
| Unsupported engine | Set Node.js to 20.x in Dashboard |
| lightningcss error | Commit package-lock.json |
| terser not found | Already in package.json, check install |

---

**Status:** ✅ Ready to Deploy  
**Build:** ✅ Tested locally (56.83s)
