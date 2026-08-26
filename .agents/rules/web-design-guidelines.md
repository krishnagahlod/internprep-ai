# Web Interface Guidelines — Vercel Labs Quality Standards

## 1. Accessibility & Contrast (WCAG AA Standard)
- All primary text must maintain a minimum contrast ratio of **4.5:1** against its direct background in both Light Mode and Dark Mode.
- Subtle/secondary text must maintain at least **3:1** contrast.
- Never use color alone to convey meaning (always pair with text or clear icons).

## 2. Interaction & Keyboard Navigability
- Every interactive element (`<button>`, `<a>`, `<input>`, `<select>`, `<summary>`) must have:
  - An explicit `focus-visible` ring: `focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none`.
  - An active tactile response: `active:scale-[0.98]` or instant opacity shift.
  - Hover transition: `transition-all duration-150 ease-out`.
- Touch targets on mobile viewports must be at least **44px × 44px**.

## 3. Layout Stability & Performance
- Always provide explicit `width` and `height` (or aspect-ratio) for icons and media to prevent Cumulative Layout Shift (CLS).
- Avoid animating `top`, `left`, `width`, or `height`. Animate only GPU-accelerated properties: `opacity` and `transform` (`scale`, `translate3d`).

## 4. Semantic Hierarchy
- Each page must have exactly one `<h1>`.
- Maintain sequential heading hierarchy (`<h1>` → `<h2>` → `<h3>`).
- Use HTML5 semantic landmarks (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`, `<dialog>`).
