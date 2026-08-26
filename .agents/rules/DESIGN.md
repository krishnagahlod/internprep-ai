# DESIGN.md — InternPrep AI Design System Tokens

## 1. Color Palette System

### Light Mode (Editorial Swiss / Clean Stone)
- **Base Background:** `#F8F9FA` (`hsl(210 20% 98%)`)
- **Base Surface (Card):** `#FFFFFF` (`hsl(0 0% 100%)`)
- **Elevated Surface (Muted):** `#ECEEF1` (`hsl(210 20% 94%)`)
- **Primary Text:** `#0F172A` (`hsl(222 47% 11%)`)
- **Secondary Text:** `#64748B` (`hsl(215 16% 45%)`)
- **Borders:** `#DDE2E8` (`hsl(214 24% 88%)`)
- **Primary Accent:** `#059669` (Technical Emerald)
- **Secondary Accent:** `#2563EB` (Electric Blue)

### Dark Mode (Obsidian / Linear Titanium)
- **Base Background:** `#08090A` (`hsl(220 14% 4%)`)
- **Base Surface (Card):** `#0F1013` (`hsl(220 13% 7%)`)
- **Elevated Surface (Muted):** `#16181D` (`hsl(220 11% 11%)`)
- **Primary Text:** `#F4F4F5` (`hsl(0 0% 96%)`)
- **Secondary Text:** `#91949D` (`hsl(220 9% 60%)`)
- **Borders:** `#23252B` (`hsl(220 10% 16%)`)
- **Primary Accent:** `#10B981` (Precision Emerald)
- **Secondary Accent:** `#3B82F6` (Electric Blue)

---

## 2. Typographic Hierarchy & Scale

| Token | Size / Line-Height | Weight | Usage |
| :--- | :--- | :--- | :--- |
| `display-2xl` | 56px / 1.1 | Bold (700) | Hero Headline |
| `display-xl` | 36px / 1.15 | Bold (700) | Section Titles (`h2`) |
| `display-lg` | 24px / 1.25 | SemiBold (600) | Card Titles (`h3`) |
| `body-base` | 15px / 1.6 | Regular (400) / Medium (500) | Paragraphs & Explanations |
| `body-sm` | 13px / 1.5 | Regular (400) / Medium (500) | Card Descriptions & Subtext |
| `mono-tech` | 11px–12px / 1.4 | Medium (500) / SemiBold (600) | Rubrics, Chips, Metrics, Logs |

**Font Families:**
- Display & Body: `Plus Jakarta Sans` (`--font-sans`, `--font-display`)
- Technical / Data / Rubrics: `JetBrains Mono` (`--font-mono`)

---

## 3. Spatial System (8pt Grid)
- **Micro Spacing:** `4px` (`gap-1`), `8px` (`gap-2`), `12px` (`gap-3`), `16px` (`gap-4`)
- **Section Spacing:** `24px` (`p-6`), `32px` (`p-8`), `48px` (`py-12`), `80px` (`py-20`)
- **Corner Radii:** Sharp & technical: `6px` (`rounded-md`), `8px` (`rounded-lg`), `12px` (`rounded-xl`). **Banned:** `rounded-3xl` (24px+).

---

## 4. Button & Interactive Variants
- **Primary Button:** Emerald filled (`bg-emerald-600 dark:bg-emerald-500 text-white dark:text-zinc-950 font-semibold px-4 py-2 rounded-md hover:brightness-110 active:scale-[0.98] transition-all`)
- **Secondary / Outline Button:** Theme-aware card surface (`bg-card border border-border text-foreground hover:bg-muted font-medium px-4 py-2 rounded-md active:scale-[0.98] transition-all`)
- **Ghost Button:** Zero border (`text-muted-foreground hover:text-foreground hover:bg-muted/50 px-3 py-1.5 rounded-md transition-colors`)
- **Focus Rings:** `focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-background`
