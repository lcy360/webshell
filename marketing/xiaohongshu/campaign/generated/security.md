# 标题

AI终端远程控制别裸奔

# 主题

远程 Web shell 的安全边界：localhost、tunnel、密码、数据不落盘

# 正文

远程控制 shell 很方便，但也很危险。

Webshell 的设计里，我一直把它当成“本地操作者工具”，不是公开 SaaS。因为只要能登录，就能用运行服务的系统用户执行命令。

所以如果你要把它放到外网，我建议至少做到：

1. Webshell 绑定 `127.0.0.1`
2. 只通过 Cloudflare Tunnel 或 HTTPS 反代访问
3. 设置长密码
4. 最好加 Cloudflare Access
5. runtime 数据目录不要提交 git
6. terminal 输出不写入磁盘
7. 不要把它当多用户权限系统

Webshell 自带本地用户名密码登录，也提供 `WEBSHELL_DATA_DIR`，方便把 auth/state 放到仓库外面。

它适合个人或小团队远程接管自己的 shell session，不适合直接暴露给不可信用户。

我觉得 AI CLI 以后会越来越常驻运行：Claude 写功能、Codex review、npm dev、日志监控都可能跑很久。远程接管这些 session 是刚需，但安全边界一定要讲清楚。

GitHub：
https://github.com/lcy360/webshell

# 标签

安全
自托管
远程开发
程序员工具
AI编程
命令行
Cloudflare
开源项目
Web开发
效率工具
