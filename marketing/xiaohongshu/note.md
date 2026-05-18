# 标题

手机也能远程开AI终端

# 正文

最近 vibe coding 最大的阻力，不是 AI 不会写，而是我离开电脑后就接不上了。

一个终端跑 Claude Code，一个终端跑 Codex，一个终端跑 npm dev，再开几个 shell 看日志、改配置。出门之后想看进度、补一句 prompt、重启服务，就很尴尬。

所以我做了 Webshell：把多个本机 shell 放进浏览器统一管理，也能通过手机远程接着操作。

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
4. 手机上看进度、补命令、继续 vibe coding

这版重点修了几个真痛点：

- session 切换不再黑屏等半天
- 中文输入和短命令回显更跟手
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

如果要外网访问，建议只绑定 localhost，再用 Cloudflare Tunnel 或 Nginx HTTPS 反代。注意：能登录的人就能执行 shell 命令，密码和访问控制一定要认真做。

这个工具更像是给 AI CLI 时代补一个“远程窗口管理层”。不是替代终端，而是让多终端并行和手机远程接管都顺一点。

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
