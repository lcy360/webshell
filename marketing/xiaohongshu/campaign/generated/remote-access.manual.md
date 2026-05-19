# Manual Publish Packet

## Title

外网访问自己的AI终端

## Body

很多 AI CLI 任务都跑在自己的电脑或服务器上，但人不一定一直坐在电脑前。

我想要的是：外面打开浏览器，也能看到自己那几个正在跑的 shell session。

Webshell 负责把 shell 放进浏览器，Cloudflare Tunnel 负责把本地服务安全映射到域名。这样就不需要暴露端口，也不用折腾公网 IP。

推荐方式：

1. Webshell 只绑定 `127.0.0.1`
2. 用 Cloudflare Tunnel 映射到自己的域名
3. Webshell 自己有用户名密码
4. 外层最好再加 Cloudflare Access
5. 不要把 runtime cookies 和 auth 文件提交到仓库

启动 Webshell：

```bash
HOST=127.0.0.1 PORT=4767 npm start
```

Tunnel 指向：

```text
http://127.0.0.1:4767
```

这样在电脑、手机、平板上打开同一个域名，看到的都是同一批 terminal session。

安全提醒：这个工具能执行 shell 命令，所以它不是普通网页后台。密码、HTTPS、访问控制都必须认真做。

GitHub：
https://github.com/lcy360/webshell

#Cloudflare #远程开发 #自托管 #程序员工具 #AI编程 #命令行 #Web开发 #效率工具 #开源项目 #VibeCoding

## Images

Upload in this order:

1. `marketing/xiaohongshu/campaign/images/remote-access/01.png`
2. `marketing/xiaohongshu/campaign/images/remote-access/02.png`
3. `marketing/xiaohongshu/campaign/images/remote-access/03.png`
4. `marketing/xiaohongshu/campaign/images/remote-access/04.png`

## Safe Publish Steps

1. Open Xiaohongshu creator manually in a normal browser.
2. Upload the images above.
3. Paste the title and body.
4. Review the preview yourself.
5. Click publish manually.

Do not use browser automation for the final publish step.
