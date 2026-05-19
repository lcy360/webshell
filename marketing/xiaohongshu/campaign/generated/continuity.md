# 标题

电脑手机接着写代码

# 主题

跨设备同一 terminal session，coding 连续性不断

# 正文

最近 vibe coding 最大的阻力，不是 AI 不会写，而是我换设备后上下文断了。

电脑上一个终端跑 Claude Code，一个终端跑 Codex，一个终端跑 npm dev。出门后想用手机看进度、补 prompt、重启服务，最好还能接着同一个 terminal session 操作。

所以我做了 Webshell：电脑和手机打开，看到的是同一批正在运行的 shell session。终端一直在服务端跑，浏览器只是入口。

它不封装 Claude / Codex，也不替你决定工作流。你只是在浏览器里开 shell，然后自己启动：

```bash
claude
codex
npm run dev
ssh your-server
```

我现在最常用的方式：

1. 一个 shell 让 Claude 写功能
2. 一个 shell 让 Codex 做 review
3. 一个 shell 跑测试和服务
4. 离开电脑后，手机继续接同一个 session

这版重点修了几个真痛点：

- 电脑和手机打开，都是同一个 terminal session
- session 切换不黑屏
- 中文输入更跟手
- 手机端有 ↑、↓、Shift+Tab 快捷键
- 支持登录、Docker、systemd、Cloudflare Tunnel
- terminal 输出不落盘

快速启动：

```bash
git clone https://github.com/lcy360/webshell.git
cd webshell
npm install
WEBSHELL_PASSWORD='change-me' npm run init-user
npm start
```

打开 `http://127.0.0.1:4767`。

外网访问建议绑定 localhost，再用 Cloudflare Tunnel 或 Nginx HTTPS 反代。能登录的人就能执行 shell 命令，密码和访问控制一定要认真做。

这个工具更像是给 AI CLI 时代补一个“连续性层”。不是替代终端，而是让长时间运行的 AI terminal session 可以在电脑、手机、任何浏览器里接着操作。

GitHub：
https://github.com/lcy360/webshell

# 标签

开源项目
程序员工具
AI编程
Claude
Codex
命令行
效率工具
远程开发
Web开发
VibeCoding
