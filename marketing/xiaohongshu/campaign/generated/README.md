# Xiaohongshu Campaign

| ID | Title | Angle |
|---|---|---|
| continuity | 电脑手机接着写代码 | 跨设备同一 terminal session，coding 连续性不断 |
| parallel-agents | 多开AI终端不再乱 | Claude、Codex、npm、日志统一在浏览器里管理 |
| mobile | 手机上继续vibe coding | 手机浏览器接管正在跑的 shell，补 prompt、看日志、重启服务 |
| remote-access | 外网访问自己的AI终端 | Cloudflare Tunnel + Webshell，让本机 shell 可以安全远程打开 |
| security | AI终端远程控制别裸奔 | 远程 Web shell 的安全边界：localhost、tunnel、密码、数据不落盘 |

Run `node marketing/xiaohongshu/campaign/generate-campaign.mjs` after editing `posts.json`.
Render PNGs with `marketing/xiaohongshu/campaign/render-images.sh`.
Validate a post with `marketing/xiaohongshu/campaign/generated/<id>.debug.sh`.
