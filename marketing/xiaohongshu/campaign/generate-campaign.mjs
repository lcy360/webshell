import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(__dirname);
const posts = JSON.parse(fs.readFileSync(path.join(__dirname, "posts.json"), "utf8"));
const outDir = path.join(__dirname, "generated");
const imageRoot = path.join(__dirname, "images");

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(imageRoot, { recursive: true });

function escape(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function noteMarkdown(post) {
  return `# 标题

${post.title}

# 主题

${post.angle}

# 正文

${post.content}

# 标签

${post.tags.join("\n")}
`;
}

function shellTags(post) {
  return post.tags.map((tag) => `  --tag ${JSON.stringify(tag)} \\`).join("\n");
}

function debugScript(post) {
  const imageDir = `$ROOT/marketing/xiaohongshu/campaign/images/${post.id}`;
  return `#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "\${BASH_SOURCE[0]}")/../../../.." && pwd)"
ASSETS="${imageDir}"

TITLE=${JSON.stringify(post.title)}
CONTENT="$(awk 'BEGIN{p=0} /^# 正文/{p=1; next} /^# 标签/{p=0} p{print}' "$ROOT/marketing/xiaohongshu/campaign/generated/${post.id}.md")"

xhs-kit debug-publish \\
  --title "$TITLE" \\
  --content "$CONTENT" \\
  --image "$ASSETS/01.png" \\
  --image "$ASSETS/02.png" \\
  --image "$ASSETS/03.png" \\
  --image "$ASSETS/04.png" \\
${shellTags(post)}
  --verbose
`;
}

function manualPacket(post) {
  const tags = post.tags.map((tag) => `#${tag}`).join(" ");
  return `# Manual Publish Packet

## Title

${post.title}

## Body

${post.content}

${tags}

## Images

Upload in this order:

1. \`marketing/xiaohongshu/campaign/images/${post.id}/01.png\`
2. \`marketing/xiaohongshu/campaign/images/${post.id}/02.png\`
3. \`marketing/xiaohongshu/campaign/images/${post.id}/03.png\`
4. \`marketing/xiaohongshu/campaign/images/${post.id}/04.png\`

## Safe Publish Steps

1. Open Xiaohongshu creator manually in a normal browser.
2. Upload the images above.
3. Paste the title and body.
4. Review the preview yourself.
5. Click publish manually.

Do not use browser automation for the final publish step.
`;
}

function renderCard(card) {
  const lines = card.code
    ? card.code.map((line, index) => `<text x="92" y="${600 + index * 58}" class="code">${escape(line)}</text>`).join("\n")
    : card.lines.map((line, index) => `<text x="110" y="${590 + index * 72}" class="line">${escape(line)}</text>`).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1440" viewBox="0 0 1080 1440">
  <rect width="1080" height="1440" fill="#171b20"/>
  <rect x="56" y="56" width="968" height="1328" rx="34" fill="#20262d" stroke="#3a444f" stroke-width="2"/>
  <circle cx="144" cy="138" r="15" fill="#78e2bc"/>
  <circle cx="196" cy="138" r="15" fill="#f0c266"/>
  <circle cx="248" cy="138" r="15" fill="#ee8374"/>
  <text x="92" y="286" class="kicker">WEBSHELL</text>
  <text x="92" y="412" class="title">${escape(card.title)}</text>
  <text x="92" y="492" class="subtitle">${escape(card.subtitle)}</text>
  <rect x="92" y="540" width="896" height="${card.code ? 310 : 410}" rx="20" fill="#15191f" stroke="#34404a"/>
  ${lines}
  <text x="92" y="1276" class="footer">github.com/lcy360/webshell</text>
  <style>
    text { font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Segoe UI", sans-serif; }
    .kicker { fill: #78e2bc; font-size: 28px; font-weight: 700; letter-spacing: 3px; }
    .title { fill: #eef2f4; font-size: 86px; font-weight: 800; letter-spacing: 0; }
    .subtitle { fill: #b8c1ca; font-size: 40px; font-weight: 520; letter-spacing: 0; }
    .line { fill: #e0e6eb; font-size: 46px; font-weight: 650; letter-spacing: 0; }
    .code { fill: #d7dee5; font-size: 30px; font-family: Menlo, Monaco, Consolas, monospace; letter-spacing: 0; }
    .footer { fill: #7e8b96; font-size: 30px; font-weight: 520; letter-spacing: 0; }
  </style>
</svg>`;
}

const indexRows = [];

for (const post of posts) {
  const postImageDir = path.join(imageRoot, post.id);
  fs.mkdirSync(postImageDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `${post.id}.md`), noteMarkdown(post));
  fs.writeFileSync(path.join(outDir, `${post.id}.debug.sh`), debugScript(post));
  fs.writeFileSync(path.join(outDir, `${post.id}.manual.md`), manualPacket(post));
  fs.chmodSync(path.join(outDir, `${post.id}.debug.sh`), 0o755);

  post.cards.forEach((card, index) => {
    fs.writeFileSync(path.join(postImageDir, `${String(index + 1).padStart(2, "0")}.svg`), renderCard(card));
  });

  indexRows.push(`| ${post.id} | ${post.title} | ${post.angle} |`);
}

fs.writeFileSync(path.join(outDir, "README.md"), `# Xiaohongshu Campaign

| ID | Title | Angle |
|---|---|---|
${indexRows.join("\n")}

Run \`node marketing/xiaohongshu/campaign/generate-campaign.mjs\` after editing \`posts.json\`.
Render PNGs with \`marketing/xiaohongshu/campaign/render-images.sh\`.
Validate a post with \`marketing/xiaohongshu/campaign/generated/<id>.debug.sh\`.
Use \`marketing/xiaohongshu/campaign/generated/<id>.manual.md\` for manual publishing.
`);

console.log(`Generated ${posts.length} campaign posts under ${path.relative(root, outDir)}`);
