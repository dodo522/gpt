# 灵感同事 · Idea Room

一个中文头脑风暴模拟器：输入 2–8 位员工和讨论方向，生成可编辑的角色卡，再进入群聊。员工按顺序发言，后发言者能看到前面的观点，后续轮次保留聊天上下文。支持本地会话保存、失败后从未完成成员重试，以及 Markdown 导出。

## 运行

需要 Node.js 22 或更新版本，无第三方依赖。

```sh
cd /workspace/gpt
npm start
```

默认端口 3000。使用浏览器打开运行服务的地址。没有密钥时，勾选「演示模式」即可体验；演示内容为固定规则示例，不是 GPT 生成。

## 接入 GPT

将 `.env.example` 复制为 `.env`，在本地或部署平台安全填写 `OPENAI_API_KEY`，可选填写 `OPENAI_MODEL`（默认 `gpt-4.1-mini`），然后重新启动服务。不要提交 `.env`。取消演示模式后生成角色，即会通过服务端调用 OpenAI Chat Completions API；密钥不会发送到浏览器。

部署环境需允许 HTTPS 访问 `api.openai.com`。API 调用产生费用，每轮每位员工调用一次。当前云环境未配置密钥且该域名不在自定义网络允许列表，真实 GPT 调用尚未在线验证。

## 验证

```sh
npm test
```

## 使用说明与范围

- 直接编辑员工姓名、职位、性格、年龄、性别、爱好、履历和记忆。
- 点击「开始头脑风暴」，输入问题。Enter 发送，Shift+Enter 换行。
- 切回团队可以编辑角色，下一轮采用修改后的角色。
- 同一会话固定使用创建时的模式；更换模式后重新生成团队。
- 会话只保存在当前浏览器 localStorage，清理浏览器数据会丢失，可随时导出。
- 模型接收最近 40 条消息作为上下文；角色记忆来自角色卡，并非无限长期记忆。
- 这是单用户原型，没有登录和限流。接入付费密钥后应只在可信网络运行；公开部署前需要认证、限流和访问控制。

## 静态演示版

`public/` 可直接部署到 GitHub Pages 等静态托管服务；演示模式在浏览器本地运行，不调用 GPT、不需要密钥。真实 GPT 模式需要运行本项目 Node.js 服务端。

## 部署真实 GPT 版本到 Render

[开始创建 Render 服务](https://dashboard.render.com/select-repo?type=blueprint&repo=https%3A%2F%2Fgithub.com%2Fdodo522%2Fgpt)

1. 登录 Render，选择本仓库的 `main` 分支，通过 Blueprint 使用 `render.yaml`。
2. 在 Render 的秘密环境变量中填写 `OPENAI_API_KEY`。密钥从 OpenAI 平台创建，需有可用的 API 额度。不要发到聊天或提交到 GitHub。
3. `APP_PASSWORD` 会自动生成。在 Render 服务的 Environment 页面安全查看它；它是本网站的访问密码，请妥善保管。
4. 等待部署显示 Live，访问 Render 提供的 HTTPS 地址。浏览器弹出登录框时，用户名任意填写，密码填 `APP_PASSWORD`。
5. 取消「演示模式」并重新生成团队，然后开始讨论。旧的演示会话不会自动变成 GPT 会话。

免费实例的可用性及休眠策略以 Render 当时规则为准；休眠后的首次请求可能需要等待。GitHub Pages 网址保留为静态演示版，真实 GPT 版使用 Render 新网址。

### 访问保护与验证

设置 OpenAI 密钥后，服务必须同时有 `APP_PASSWORD` 才开放访问；全部页面及 API 均受 HTTP Basic 登录保护，`/healthz` 仅返回无敏感信息的健康状态。公开部署应使用平台提供的 HTTPS。API 有每连接来源每分钟 30 次的内存限流，重启清零，不适合作为多用户计费配额系统。请在 OpenAI 平台设置适当的额度与使用提醒。

验证时检查：`/healthz` 正常；未登录的 `/api/status` 返回 401；登录后取消演示模式能生成不同角色、下一轮能回应前面的具体观点。密钥存在状态不代表真实 API 调用已验证。

## 改用 DeepSeek（现有 Render 服务无需重新创建）

1. 到 https://platform.deepseek.com/ 注册或登录，在官方平台查看可用充值方式和价格，创建 API Key。DeepSeek 的 API 余额与其他平台独立计算。
2. 在 Render 打开 `idea-room` → Environment，添加或修改：
   - `AI_PROVIDER` = `deepseek`
   - `DEEPSEEK_API_KEY` = 你在 DeepSeek 创建的密钥（仅在 Render 填写）
   - `DEEPSEEK_MODEL` = `deepseek-chat`
3. 保留原来的 `APP_PASSWORD`；旧的 `OPENAI_API_KEY` 和 `OPENAI_MODEL` 不会在 DeepSeek 模式下使用，可在 Render 中移除。
4. 保存并重新部署最新 `main`；打开 Render 网站，取消演示模式，重新生成团队。讨论方向、角色描述与聊天上下文将发送给所选的 DeepSeek 服务。
5. 显示 DeepSeek 模式并成功生成角色和发言后，才算真实调用验证通过。402 表示 DeepSeek 余额不足，401 表示密钥验证失败，429 表示速率限制。

新建服务的 `render.yaml` 默认使用 DeepSeek。现有 Blueprint 若提示缺少 `DEEPSEEK_API_KEY`，在 Render 中安全填写后继续同步。服务端也可继续使用 OpenAI：设置 `AI_PROVIDER=openai` 并配置 `OPENAI_API_KEY`。没有明确设置 provider 时，有 DeepSeek 密钥会选择 DeepSeek，否则保留 OpenAI 默认行为。DeepSeek JSON 输出和请求路由已通过模拟上游测试，尚未用真实密钥在线验证。

## 全员共享品牌资料

生成团队前可在「品牌资料」粘贴文本（最多 12,000 字符），包括品牌历史、产品价格、客户、渠道、过往活动结果、预算与限制。资料自动保存在当前浏览器，与角色卡分开维护；生成员工和每次真实 AI 发言都会携带完整的当前资料，不受最近 40 条聊天截断影响。修改后作用于后续发言，不重写既有聊天；导出包含当前版本资料。会议室可展开查看共享资料，旧会话也可通过「编辑团队」补充，无需重新生成员工。

模型被要求区分用户提供的事实、推测和待确认事项，不得编造品牌数据。这是提示约束，不代表自动事实核验。资料在真实模式会发送给所选 AI 服务；内容越长、员工越多，重复输入的 token 成本越高。演示模式仍使用固定示例，不会理解品牌资料。此版本支持粘贴文本，不包含 PDF/Word 附件解析或跨浏览器同步。
