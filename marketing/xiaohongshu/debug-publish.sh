#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ASSETS="$ROOT/marketing/xiaohongshu/images"

TITLE="电脑手机接着写代码"
CONTENT="$(awk 'BEGIN{p=0} /^# 正文/{p=1; next} /^# 标签/{p=0} p{print}' "$ROOT/marketing/xiaohongshu/note.md")"

xhs-kit debug-publish \
  --title "$TITLE" \
  --content "$CONTENT" \
  --image "$ASSETS/01-cover.png" \
  --image "$ASSETS/02-problem.png" \
  --image "$ASSETS/03-features.png" \
  --image "$ASSETS/04-quick-start.png" \
  --tag "开源项目" \
  --tag "程序员工具" \
  --tag "AI编程" \
  --tag "Claude" \
  --tag "Codex" \
  --tag "命令行" \
  --tag "效率工具" \
  --tag "远程开发" \
  --tag "Web开发" \
  --tag "VibeCoding" \
  --verbose
