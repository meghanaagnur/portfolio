# Link Preview Component

Saved component inspired by **Planes Pro (`@useplanes/link-preview`)** & **Aceternity UI (`@aceternity/link-preview`)**.

## What's Included:
1. **`demo.html`**: A standalone 1:1 live demo of the Spy x Family showcase from your screenshot. Open it directly in any browser!
2. **`link-preview.js`**: Lightweight, plug-and-play Vanilla JS implementation that automatically powers any element with `class="link-preview"` or `data-preview-image` / `data-preview-url`.
3. **`link-preview.css`**: Frameless glassmorphic styling, smooth cubic-bezier spring physics, dark and light mode compatible.
4. **`link-preview.tsx`**: React / Next.js / Tailwind CSS / Framer Motion component ready for modern React codebases.
5. **Assets**: `spy-family.jpg`, `loid.jpg`, `anya.jpg`, `yor.jpg`, and `link-preview-original.png`.

---

## Quick Usage (Vanilla HTML / JS)

### 1. Include CSS & JS
```html
<link rel="stylesheet" href="components/link-preview/link-preview.css">
<script src="components/link-preview/link-preview.js"></script>
```

### 2. Static Image Preview
```html
<a href="https://example.com" 
   class="link-preview" 
   data-preview-image="path/to/image.jpg"
   data-preview-title="My Project"
   data-preview-badge="Featured">
   Hover over me!
</a>
```

### 3. Dynamic URL Screenshot (Automatic)
If no `data-preview-image` is specified, it automatically generates a live screenshot of any website using the free Microlink embed API:
```html
<a href="https://github.com/meghanaagnur" 
   class="link-preview"
   data-preview-title="Meghana's GitHub"
   data-preview-badge="GitHub">
   Meghana's GitHub
</a>
```

---

## React / Next.js Usage (`link-preview.tsx`)
```tsx
import { LinkPreview } from "@/components/ui/link-preview";

<LinkPreview url="https://github.com/meghanaagnur" badge="GitHub">
  Meghana's GitHub
</LinkPreview>
```
