This post documents every styling option available for blog posts. Use it as a reference when writing.

---

# Heading 1

## Heading 2

### Heading 3

---

## Paragraphs

This is a regular paragraph. It uses Geist at 1.25rem with a generous 1.75 line-height for readability. Keep paragraphs short and scannable. White space is your friend.

This is a second paragraph to show spacing between them. Notice the consistent gap — no need to add extra line breaks.

---

## Text Formatting

This is **bold text** — rendered at font-weight 400 with full white color for emphasis.

This is *italic text* — standard italic style.

This is ***bold and italic*** combined.

This is ~~strikethrough text~~ — for corrections or outdated info.

---

## Links

Here's an [inline link](https://edoputra.com) — it's cyan and turns white on hover.

Here's another link to [Google](https://google.com) just to show multiple links in a paragraph work fine.

---

## Blockquote

> This is a blockquote. It has a blue left border and slightly muted text. Use it for quotes, callouts, or highlighting important thoughts.

> You can also have multiple paragraphs in a blockquote.
>
> Like this second paragraph here.

---

## Unordered List

- First item in an unordered list
- Second item with some longer text to show how wrapping works when the content extends beyond a single line
- Third item
- Fourth item

---

## Ordered List

1. First step — do this thing
2. Second step — then do this
3. Third step — and finally this
4. Fourth step — you're done

---

## Nested Lists

- Design
  - Figma
  - FigJam
  - Whimsical
- Development
  - HTML / CSS / JS
  - React
  - Next.js
- Tools
  1. Loom
  2. Slack
  3. DaVinci Resolve

---

## Inline Code

Use the `formatDate()` function to convert dates. You can also reference variables like `posts.json` or CSS classes like `.post-reader-content` inline.

---

## Code Block

```javascript
function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
```

```css
.post-reader-content h2 {
  font-size: 2rem;
  font-weight: 400;
  line-height: 1.25;
  margin: 2.5rem 0 1.25rem;
}
```

```html
<video src="/assets/mp4/showreel.mp4" controls playsinline muted></video>
```

---

## Horizontal Rule

Use three dashes `---` to create a divider between sections. You've been seeing them throughout this post.

---

## Image

Standard markdown image syntax. Full-width, rounded corners.

![Showreel poster](/assets/img/showreel.jpg)

---

## Video (local file)

Use raw HTML for local video files. Good for clips under 5MB.

```
<video src="/posts/your-post/demo.mp4" controls playsinline muted></video>
```

<video src="/assets/mp4/showreel.mp4" controls playsinline muted></video>

---

## Video (YouTube embed)

Use an iframe for YouTube. Full-width, 16:9 aspect ratio, rounded corners.

```
<iframe src="https://www.youtube.com/embed/VIDEO_ID" allowfullscreen></iframe>
```

<iframe src="https://www.youtube.com/embed/RS9abpks5Lw" allowfullscreen></iframe>

---

## Pattern Divider

An animated diagonal pattern strip. Full-width, fixed height. Use as a decorative section break.

```
<div class="pattern-break"></div>
```

<div class="pattern-break"></div>

---

## Table

| Element | Markdown | Renders as |
|---------|----------|------------|
| Bold | `**text**` | **text** |
| Italic | `*text*` | *text* |
| Code | `` `code` `` | `code` |
| Link | `[text](url)` | [text](https://edoputra.com) |
| Image | `![alt](url)` | (image) |

---

## Combining Elements

### A real-world example

Here's how a typical section might look in a blog post — mixing headings, text, lists, and code:

When building a design system, I usually start with these foundations:

1. **Color tokens** — define your palette as CSS custom properties
2. **Typography scale** — set a modular scale and stick to it
3. **Spacing system** — use consistent increments (4px, 8px, 16px...)

Here's a quick example of color tokens:

```css
:root {
  --color-blue: #0026FF;
  --color-cyan: #00D4FF;
  --color-white: #FFFFFF;
  --color-black: #010101;
}
```

> The best design systems are the ones your team actually uses. Keep it simple.

---

## Quick Reference

| What you want | How to write it |
|---|---|
| Heading 1 | `# Title` |
| Heading 2 | `## Title` |
| Heading 3 | `### Title` |
| Bold | `**bold**` |
| Italic | `*italic*` |
| Strikethrough | `~~text~~` |
| Link | `[text](url)` |
| Image | `![alt](path)` |
| Inline code | `` `code` `` |
| Code block | ` ``` lang` ... ` ``` ` |
| Blockquote | `> quote` |
| Unordered list | `- item` |
| Ordered list | `1. item` |
| Horizontal rule | `---` |
| Local video | `<video src="path" controls></video>` |
| YouTube | `<iframe src="youtube-embed-url" allowfullscreen></iframe>` |
| Pattern divider | `<div class="pattern-break"></div>` |
