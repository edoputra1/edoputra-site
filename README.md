# Edo Putra — Portfolio Website

Personal portfolio website showcasing 10+ years of product design experience.

🔗 **Live Site:** [edoputra.com](https://edoputra.com)

## Overview

A clean, performant portfolio site built with vanilla JavaScript and optimized for speed. Features horizontal scrolling on desktop, responsive design, and smooth scrolling experience. Vanilla + Semantic markup + Custom properties + No framework overhead + Lenis + jQuery + Geist typeface

## Performance

- ⚡️ Optimized for Google PageSpeed Insights
- 🎥 Efficient video background
- 📱 Mobile-first approach
- 🚀 Deferred non-critical resources

## Features

- Horizontal scroll layout (desktop)
- Responsive mobile design
- Animated text + button effects
- Video showreel integration
- Dynamic footer elements
- Real-time clock (desktop)

## Local Development

```bash
# Clone the repository
git clone https://github.com/edoputra1/edoputra-site.git

# Navigate to directory
cd edoputra-site

# Start local server
python3 -m http.server 8000

# Visit in browser
open http://localhost:8000
```

## Playground (UI shots)

`/playground` is a staggered grid of UI screenshots and short videos. There's no CMS; the list lives in `playground/shots.json`.

1. Export the screenshot (JPG or WebP, ~2000px wide, ideally under 800 KB) or a short MP4 loop (no sound needed, ideally a few MB) and drop it into `playground/shots/`. Videos play muted on loop while they're on screen.
2. Run `node build-playground.js`. New images are added to the top of `shots.json` with their size; deleted images are removed.
3. Optionally edit `playground/shots.json`:
   - reorder entries to change the order on the page (it reads left to right),
   - add `"hidden": true` to hide a shot without deleting it.
4. `git push`.

Re-running the build script keeps your order and hidden flags.

## Project Structure

```
edoputra-site/
├── assets/
│   ├── css/          # jQuery modal styles
│   ├── favicons/     # Site icons
│   ├── img/          # Images and SVGs
│   ├── js/           # jQuery libraries
│   ├── mp4/          # Video assets
│   ├── og/           # Open Graph images
│   └── svgs/         # Icon set
├── index.html        # Main HTML file
├── style.css         # Main stylesheet
├── script.js         # Main JavaScript
└── CNAME            # Custom domain config
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

© 2026 Edo Putra. All rights reserved.

## Contact

- 📧 Email: hi.edoputra@gmail.com
- 💼 LinkedIn: [linkedin.com/in/edoputra](https://linkedin.com/in/edoputra)
- 📷 Instagram: [@__edoputra](https://instagram.com/__edoputra)
- 🎨 Portfolio: [View Full Portfolio](https://drive.google.com/file/d/1ufQxrLbkdaCFdxh4kEjiDcSkvKAJVG5V/view)

---

built with attention to detail — optimized for performance — assisted by Claude + chatGPT 👍
