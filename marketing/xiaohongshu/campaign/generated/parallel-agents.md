# 标题

多开AI终端不再乱

# 主题

Claude、Codex、npm、日志统一在浏览器里管理

# 正文

多 Agent 编程最爽的是并行，最烦的是窗口太多。

我现在经常这样开：

- Claude Code 写功能
- Codex 做 review
- npm dev 跑服务
- 一个 shell 看日志
- 一个 shell 改配置或 ssh 上机器

以前切来切去很容易忘：哪个窗口是哪个项目？哪个任务已经跑完？哪个 session 还能继续输入？

于是做了 Webshell，把多个 shell terminal 放进一个 Web 页面里。它不封装任何 AI CLI，只负责把 shell 管好。你想跑 Claude、Codex、Gemini、npm、ssh 都可以自己启动。

我喜欢这个设计的原因是：它没有替我改工作流，只是给原来的 CLI 工作流加了一个管理层。

这版已经处理了几个影响体验的问题：

1. new shell 后直接出现在主窗口
2. session 切换不卡很久
3. 历史输出多也不会黑屏
4. 中文输入更稳定
5. 手机端有 ↑、↓、Shift+Tab
6. 运行中的 shell 不因为切浏览器而断

如果你也经常同时开好几个 AI CLI，这个工具的核心价值不是“更强的 Agent”，而是让并行工作流变得可控。

GitHub：
https://github.com/lcy360/webshell

# 标签

AI编程
Claude
Codex
命令行
效率工具
程序员工具
VibeCoding
开源项目
终端工具
独立开发
