# Kairo UI Style Explorations

Generated using the **ui-ux-pro-max** skill (installed at `.cursor/skills/ui-ux-pro-max`).
Each variant is a self-contained, mobile-first prototype of Kairo's core **Now** screen so you can
compare directions side by side. Each lives in its own folder and is served on its own local port.

| # | Style | Folder | Local URL | Vibe |
|---|-------|--------|-----------|------|
| 01 | Claymorphism | `01-claymorphism` | http://localhost:4101 | Soft, playful, toy-like, mascot-forward |
| 02 | Neubrutalism | `02-neubrutalism` | http://localhost:4102 | Bold, high-contrast, Gen-Z, loud |
| 03 | Glassmorphism | `03-glassmorphism` | http://localhost:4103 | Frosted glass over aurora, modern SaaS |
| 04 | Bento Minimal | `04-bento-minimal` | http://localhost:4104 | Clean modular tiles, Apple-style calm |
| 05 | Aurora (dark) | `05-aurora` | http://localhost:4105 | Premium dark, flowing gradient mesh |
| 06 | Y2K Aesthetic | `06-y2k` | http://localhost:4106 | Chrome, neon pink/cyan, pixel type, sparkles |
| 07 | Cyberpunk | `07-cyberpunk` | http://localhost:4107 | Neon-on-black, scanlines, mono, HUD |
| 08 | Soft UI | `08-soft-ui` | http://localhost:4108 | Evolved neumorphism, calm embossed depth |
| 09 | OLED Dark | `09-oled` | http://localhost:4109 | True-black, minimal, battery-friendly |
| 10 | Editorial | `10-editorial` | http://localhost:4110 | Magazine layout, Bodoni serif, drop caps |

## Run all servers

```bash
cd design-previews
for d in */; do
  port=$((4100 + ${d:0:2#0} )); # not portable; use the helper below instead
done
```

Use the helper script instead:

```bash
bash design-previews/serve-all.sh
```

Stop them with:

```bash
pkill -f "http.server 410"
```

## Notes
- Built with Tailwind Play CDN + Google Fonts (per the skill's typography pairings).
- Colors, effects, and type come from the skill's `styles.csv` / `typography.csv`.
- These are visual prototypes for selection only; the chosen direction gets ported into the real Next.js app.
