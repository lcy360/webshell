#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
ASSETS="$ROOT/marketing/xiaohongshu/campaign/images/mobile"

TITLE="手机上继续vibe coding"
CONTENT="$(awk 'BEGIN{p=0} /^# 正文/{p=1; next} /^# 标签/{p=0} p{print}' "$ROOT/marketing/xiaohongshu/campaign/generated/mobile.md")"

xhs-kit debug-publish \
  --title "$TITLE" \
  --content "$CONTENT" \
  --image "$ASSETS/01.png" \
  --image "$ASSETS/02.png" \
  --image "$ASSETS/03.png" \
  --image "$ASSETS/04.png" \
  --tag "手机编程" \
  --tag "远程开发" \
  --tag "AI编程" \
  --tag "Claude" \
  --tag "Codex" \
  --tag "效率工具" \
  --tag "程序员工具" \
  --tag "命令行" \
  --tag "VibeCoding" \
  --tag "开源项目" \
  --verbose
