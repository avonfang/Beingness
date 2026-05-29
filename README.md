# 此刻 — AI 觉醒导师

> "你不是你的情绪——你是观察者。"

基于《当下的力量》《臣服实验》《清醒地活》三本灵性经典，构建的 AI 情绪觉察微信小程序。

## 功能

**🆘 急救模式** — 情绪内耗来袭时，4 种情绪 × 6 步 AI 结构化引导，帮你回到当下

**📚 三条觉醒路径**
- 🌿 临在之路（源自《当下的力量》）— 从思维认同中解放
- 🍂 臣服之路（源自《臣服实验》）— 对当下说是
- 💫 开放之路（源自《清醒地活》）— 释放内心能量阻塞

**🗣️ 深度对话** — 完成急救后可深度对话 AI 觉醒导师（接入 DeepSeek API）

**📊 觉醒报告** — 情绪趋势、恢复速度、AI 洞察，看见自己的变化

**🪙 觉醒币** — 完成急救和课程获得觉醒币，用于解锁深度对话

## 技术栈

- **前端：** 微信小程序原生框架（WXML / WXSS / JS）
- **后端：** 微信云开发（云数据库 + 云函数）
- **AI：** DeepSeek Chat API（深度对话）/ 内置模板树（急救模式）

## 快速开始

1. 在 [微信公众平台](https://mp.weixin.qq.com/) 注册小程序，获取 AppID
2. 在 `project.config.json` 中填入 AppID
3. 开通微信云开发，创建集合：`users`、`moodEntries`、`dialogues`
4. 在云开发控制台 → 环境变量中设置 `DEEPSEEK_API_KEY`
5. 用微信开发者工具打开项目，上传并部署云函数

## 目录结构

```
├── app.js / app.json / app.wxss     # 应用入口
├── pages/
│   ├── index/                        # 首页「此刻」
│   ├── emergency/                    # 急救模式
│   ├── dialogue/                     # 深度对话
│   ├── log/                          # 情绪日志
│   ├── learning/                     # 三条觉醒路径
│   └── profile/                      # 觉醒报告
├── components/                       # 通用组件
├── data/
│   ├── guides.json                   # 急救引导话术树
│   └── courses.json                  # 课程内容
├── cloudfunctions/
│   ├── login/                        # 微信登录
│   ├── deep-dialogue/                # DeepSeek API 代理
│   └── report/                       # 周报生成
└── docs/superpowers/                 # 设计文档与计划
```

## License

MIT
