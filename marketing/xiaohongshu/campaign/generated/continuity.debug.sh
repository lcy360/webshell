#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
ASSETS="$ROOT/marketing/xiaohongshu/campaign/images/continuity"

TITLE="电脑手机接着写代码"
CONTENT="$(awk 'BEGIN{p=0} /^# 正文/{p=1; next} /^# 标签/{p=0} p{print}' "$ROOT/marketing/xiaohongshu/campaign/generated/continuity.md")"

xhs-kit debug-publish \
  --title "$TITLE" \
  --content "$CONTENT" \
  --image "$ASSETS/01.png" \
  --image "$ASSETS/02.png" \
  --image "$ASSETS/03.png" \
  --image "$ASSETS/04.png" \
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
