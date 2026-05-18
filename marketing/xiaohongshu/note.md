# 标题

多个 CLI 窗口，一个 Web 控制台

# 正文

最近同时用 Codex CLI、Claude CLI 和普通 shell 做多个项目，最痛的不是写代码，而是窗口太多：

哪个窗口对应哪个项目？
哪个 session 还活着？
切换回来为什么黑屏？
手机上临时看一下进度怎么办？

所以做了一个小工具：Webshell。

它不是 AI agent 框架，也不封装 Codex / Claude。它只做一件事：

把本机 shell terminal 放进浏览器里统一管理。

现在可以：

1. 在 Web 页面新建多个 shell
2. 每个 shell 独立运行，可以自己启动 codex、claude、npm、ssh
3. 浏览器里直接输入输出
4. 手机浏览器也能操作
5. 支持中文输入和移动端快捷键
6. 支持 Cloudflare Tunnel 远程访问
7. 不保存 terminal 输出到磁盘

这版重点修了几个真实使用痛点：

- 只保留 shell，不内置 AI CLI 选择
- 手机端加入 ↑、↓、Shift+Tab
- 优化 session 切换和输出延迟
- 增加登录、Docker、systemd、launchd、Nginx、Cloudflare 模板

快速启动：

```bash
git clone https://github.com/lcy360/webshell.git
cd webshell
npm install
WEBSHELL_USERNAME=admin WEBSHELL_PASSWORD='change-me' npm run init-user
npm start
```

打开：

```text
http://127.0.0.1:4767
```

外网访问建议绑定 localhost，再用 Cloudflare Tunnel 或 Nginx HTTPS 反代。注意：能登录 Webshell 的人，就能用运行服务的系统用户执行命令，所以密码和访问控制一定要认真处理。

GitHub：
https://github.com/lcy360/webshell

我后面还想继续做：

- session 分组
- 操作审计
- 更细的权限控制
- 多机器管理
- 项目进度面板

如果你也经常开一堆 CLI 窗口，这个工具应该能缓解一点混乱。

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
终端工具
