# Xiaohongshu Campaign

This campaign splits Webshell into focused Xiaohongshu posts. Each post should emphasize one convenience instead of packing every feature into one note.

## Recommended Sequence

1. `continuity`: desktop and phone open the same long-running terminal sessions. This is the core positioning.
2. `mobile`: phone browser can check progress, add prompts, restart services, and continue vibe coding.
3. `parallel-agents`: multiple AI CLI sessions run in parallel without terminal-window chaos.
4. `remote-access`: Cloudflare Tunnel/domain access for your own Webshell.
5. `security`: remote shell control needs a clear security boundary.

## Files

- `posts.json`: canonical source for titles, body copy, tags, and card text.
- `generated/*.md`: generated post drafts.
- `generated/*.debug.sh`: validates a post with `xhs-kit debug-publish`.
- `generated/*.manual.md`: paste-ready manual publishing packet.
- `images/<post-id>/*.png`: ready-to-upload 1080x1440 images.

## Workflow

```bash
node marketing/xiaohongshu/campaign/generate-campaign.mjs
marketing/xiaohongshu/campaign/render-images.sh
marketing/xiaohongshu/campaign/generated/continuity.debug.sh
```

## Draft Policy

`xhs-kit` in this repo is used only for draft generation, image generation, and local format validation.

Xiaohongshu does not expose a reliable public CLI for saving drafts, so the handoff is manual:

1. Generate the post package.
2. Open `generated/<id>.manual.md`.
3. Upload images in the listed order.
4. Paste title, body, and tags.
5. Save as draft manually inside Xiaohongshu.
6. Publish later by hand when ready.
