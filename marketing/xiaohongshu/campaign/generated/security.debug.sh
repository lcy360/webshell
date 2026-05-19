#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
ASSETS="$ROOT/marketing/xiaohongshu/campaign/images/security"

TITLE="AI终端远程控制别裸奔"
CONTENT="$(awk 'BEGIN{p=0} /^# 正文/{p=1; next} /^# 标签/{p=0} p{print}' "$ROOT/marketing/xiaohongshu/campaign/generated/security.md")"

xhs-kit debug-publish \
  --title "$TITLE" \
  --content "$CONTENT" \
  --image "$ASSETS/01.png" \
  --image "$ASSETS/02.png" \
  --image "$ASSETS/03.png" \
  --image "$ASSETS/04.png" \
  --tag "安全" \
  --tag "自托管" \
  --tag "远程开发" \
  --tag "程序员工具" \
  --tag "AI编程" \
  --tag "命令行" \
  --tag "Cloudflare" \
  --tag "开源项目" \
  --tag "Web开发" \
  --tag "效率工具" \
  --verbose
