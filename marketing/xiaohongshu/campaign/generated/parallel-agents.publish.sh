#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
ASSETS="$ROOT/marketing/xiaohongshu/campaign/images/parallel-agents"

TITLE="多开AI终端不再乱"
CONTENT="$(awk 'BEGIN{p=0} /^# 正文/{p=1; next} /^# 标签/{p=0} p{print}' "$ROOT/marketing/xiaohongshu/campaign/generated/parallel-agents.md")"

xhs-kit publish \
  --title "$TITLE" \
  --content "$CONTENT" \
  --image "$ASSETS/01.png" \
  --image "$ASSETS/02.png" \
  --image "$ASSETS/03.png" \
  --image "$ASSETS/04.png" \
  --tag "AI编程" \
  --tag "Claude" \
  --tag "Codex" \
  --tag "命令行" \
  --tag "效率工具" \
  --tag "程序员工具" \
  --tag "VibeCoding" \
  --tag "开源项目" \
  --tag "终端工具" \
  --tag "独立开发" \
  --no-headless
