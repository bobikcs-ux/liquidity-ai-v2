# Liquidity.ai — Financial Intelligence Platform

A sophisticated AI-powered liquidity and risk intelligence dashboard built with **React 18**, **Vite 6**, **TypeScript**, **Tailwind CSS v4**, and **shadcn/ui**.

---

## 🚀 Quick Start (VS Code)

### Prerequisites
- **Node.js** ≥ 18.0.0 → [nodejs.org](https://nodejs.org)
- **npm** ≥ 9 (comes with Node)
- **VS Code** → [code.visualstudio.com](https://code.visualstudio.com)

### 1. Install dependencies
```bash
npm install
```

### 2. Start development server
```bash
npm run dev
```
Opens at **http://localhost:3000**

### 3. Build for production
```bash
npm run build
```
Output → `dist/`

### 4. Preview production build locally
```bash
npm run preview
```
Opens at **http://localhost:4173**

---

## 🧩 Recommended VS Code Extensions

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run:
> **Extensions: Show Recommended Extensions**

Key extensions (auto-suggested via `.vscode/extensions.json`):
- **Tailwind CSS IntelliSense** — `bradlc.vscode-tailwindcss`
- **ESLint** — `dbaeumer.vscode-eslint`
- **Prettier** — `esbenp.prettier-vscode`
- **ES7+ React/Redux/React-Native snippets**

---

## 🌐 Deploy to Vercel

### Option A — Vercel CLI
```bash
npm install -g vercel
vercel
```

### Option B — Vercel Dashboard (recommended)
1. Push your project to **GitHub / GitLab / Bitbucket**
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Settings are auto-detected:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Click **Deploy** ✅

> SPA routing is handled by `vercel.json` — all routes redirect to `index.html`.

---

## 📁 Project Structure

```
liquidity-ai/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── ui/          # shadcn/ui components
│   │   │   ├── dossier/     # Dossier report pages
│   │   │   ├── layout/      # UnifiedLayout (sidebar + topbar)
│   │   │   └── figma/       # Figma-exported components
│   │   ├── context/         # React context (AdaptiveTheme)
│   │   ├── pages/           # Route-level pages
│   │   ├── App.tsx
│   │   └── routes.tsx
│   ├── styles/
│   │   ├── index.css        # Main CSS entry
│   │   ├── tailwind.css     # Tailwind v4 config
│   │   ├── theme.css        # CSS variables & adaptive themes
│   │   └── fonts.css        # Google Fonts
│   └── main.tsx
├── .vscode/
│   ├── settings.json        # Editor settings
│   └── extensions.json      # Recommended extensions
├── .gitignore
├── .prettierrc
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── vercel.json              # Vercel SPA routing config
```

---

## 🎨 Adaptive Theme System

The app uses a 3-mode adaptive theme:

| Mode | Background | Use Case |
|------|-----------|----------|
| `light` (Research) | `#F8F9FA` | Stable / Expansionary market |
| `hybrid` (Hybrid) | `#1a1f2e` | Uncertain / Contraction |
| `terminal` (Terminal) | `#0F1419` | Stress / Crisis |

Toggle via the top-right button in the UI.

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run type-check` | TypeScript type checking |

---

## 🛠 Tech Stack

- **React 18** + **TypeScript**
- **Vite 6** (bundler)
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **shadcn/ui** + **Radix UI** (component primitives)
- **React Router v7** (SPA routing)
- **Recharts** (charts)
- **MUI v7** (additional components)
- **Lucide React** (icons)
- **Motion** (animations)
- **Sonner** (toast notifications)
