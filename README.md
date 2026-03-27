# 🪨 Diketo - Traditional African Stone Game

A beautiful digital implementation of **Diketo**, the ancient traditional stone game from Southern Africa.

## 🎮 How to Play

1. **Toss the Ghoen** - Tap the large golden stone to throw it in the air
2. **Scoop Stones** - While the Ghoen is airborne, tap the small stones to scoop them
3. **Catch** - Catch the Ghoen before it lands
4. **Progress** - Complete all 20 levels to master the game!

## ✨ Features

- 🎯 **20 Levels** - Progressive difficulty with speed increases
- 🏆 **High Score** - Compete for the best score
- 💎 **Cosmetics** - Unlock different stone appearances
- 📱 **Mobile Ready** - Optimized for touch devices
- 🌍 **Cultural Heritage** - Traditional Southern African game

## 🚀 Quick Start

### Install
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Preview
```bash
npm run preview
```

## 🛠️ Tech Stack

- **Framework:** Vite 6 + React 19
- **Styling:** Tailwind CSS v4
- **Animation:** Framer Motion
- **Audio:** Web Audio API
- **TypeScript:** Full type safety

## 📁 Project Structure

```
Diketo/
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── types/          # TypeScript types
│   ├── constants/      # Game constants
│   ├── App.tsx         # Main game component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── public/
│   ├── manifest.json   # PWA manifest
│   └── icons/          # App icons
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 🎯 Game Rules

### Objective
Scoop the correct number of stones while the Ghoen is airborne, then catch it before it lands.

### Controls
- **Tap Ghoen** - Toss the golden stone
- **Tap Stones** - Scoop stones into your tray
- **Tap Scooped Stone** - Return stone to hole

### Scoring
- **Per Stone:** 10 points
- **Dust Bonus:** 2 dust per stone (for cosmetics)
- **Combo:** No penalty for fast play

### Lives
- Start with 3 lives
- Lose a life for:
  - Not scooping enough stones
  - Scooping too many stones
  - Not catching the Ghoen
  - Running out of time

## 📜 Cultural Heritage

Diketo (also known as Upuca, Magave, or Puca) is one of ten recognized indigenous games of South Africa, Lesotho, and Botswana. This digital version preserves and celebrates this important cultural heritage.

## 📄 License

Built with Ubuntu - African strategic brilliance.

---

**Enjoy the game!** 🪨🇿🇦
