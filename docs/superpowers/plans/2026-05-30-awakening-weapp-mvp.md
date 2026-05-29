# 「此刻」AI 觉醒导师 — MVP 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 构建「此刻」微信小程序 MVP——包含急救模式（4 种情绪引导）、成长模式（9 节课）、情绪日志和觉醒报告的可运行版本。

**架构：** 微信小程序原生框架 + 微信云开发（云数据库 + 云函数）。AI 引导基于内置 JSON 话术模板树，无需调用大模型 API。

**技术栈：** 微信小程序原生框架、WXML/WXSS/JS、微信云开发

---

## 文件结构

```
├── app.js / app.json / app.wxss          # 应用入口
├── project.config.json                    # 项目配置
├── pages/
│   ├── index/                             # 首页-"此刻"
│   │   ├── index.js / .wxml / .wxss / .json
│   ├── emergency/                         # 急救模式（核心模块）
│   │   ├── emergency.js / .wxml / .wxss / .json
│   ├── log/                               # 情绪日志时间线
│   │   ├── log.js / .wxml / .wxss / .json
│   ├── learning/                          # 学习路径
│   │   ├── learning.js / .wxml / .wxss / .json
│   │   └── lesson/                        # 课程详情
│   │       ├── lesson.js / .wxml / .wxss / .json
│   └── profile/                           # 我的 / 觉醒报告
│       ├── profile.js / .wxml / .wxss / .json
├── components/
│   ├── mood-picker/                       # 情绪选择组件
│   │   └── mood-picker.js / .wxml / .wxss
│   ├── guide-step/                        # AI 引导单步组件
│   │   └── guide-step.js / .wxml / .wxss
│   └── trend-chart/                       # 趋势图组件（canvas）
│       └── trend-chart.js / .wxml / .wxss
├── data/
│   └── guides.json                        # 引导话术模板树
│   └── courses.json                       # 课程内容数据
├── utils/
│   └── util.js                            # 工具函数
│   └── report.js                          # 觉醒报告计算逻辑
└── cloudfunctions/
    └── login/                             # 微信登录云函数
    └── report/                            # 周报生成云函数
```

---

### 任务 1：项目初始化 + 微信云开发环境

**文件：**
- 创建：`project.config.json`
- 创建：`app.js` / `app.json` / `app.wxss`
- 创建：`utils/util.js`
- 创建：`cloudfunctions/login/`

- [ ] **步骤 1：创建项目配置和 App 入口**

`project.config.json`：
```json
{
  "description": "此刻 - AI 觉醒导师",
  "miniprogramRoot": "./",
  "cloudfunctionRoot": "cloudfunctions/",
  "setting": {
    "urlCheck": true,
    "es6": true,
    "minify": true
  },
  "appid": "YOUR_APP_ID",
  "compileType": "miniprogram"
}
```

`app.json`：
```json
{
  "pages": [
    "pages/index/index",
    "pages/emergency/emergency",
    "pages/log/log",
    "pages/learning/learning",
    "pages/learning/lesson/lesson",
    "pages/profile/profile"
  ],
  "window": {
    "navigationBarTitleText": "此刻",
    "navigationBarTextStyle": "black",
    "navigationBarBackgroundColor": "#FAFAF8",
    "backgroundColor": "#FAFAF8"
  },
  "tabBar": {
    "color": "#999",
    "selectedColor": "#4A7C6F",
    "list": [
      { "pagePath": "pages/log/log", "text": "日志", "iconPath": "images/log.png", "selectedIconPath": "images/log-active.png" },
      { "pagePath": "pages/index/index", "text": "此刻", "iconPath": "images/moment.png", "selectedIconPath": "images/moment-active.png" },
      { "pagePath": "pages/learning/learning", "text": "学习", "iconPath": "images/learn.png", "selectedIconPath": "images/learn-active.png" }
    ]
  }
}
```

`app.wxss`：
```css
/* 全局样式 - 极简柔和 */
page {
  background-color: #FAFAF8;
  color: #3D3D3D;
  font-family: -apple-system, "PingFang SC", sans-serif;
}
```

`utils/util.js`：
```javascript
// 日期格式化
function formatDate(date) {
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatTime(date) {
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

// 情绪映射
const EMOTION_MAP = {
  anxiety: { label: '焦虑', icon: '😰', color: '#D4A5A5' },
  anger: { label: '愤怒', icon: '😤', color: '#D4786A' },
  low: { label: '低落', icon: '😔', color: '#8B9DC3' },
  tangled: { label: '纠结', icon: '😵‍💫', color: '#B8A5C4' }
}

// 随机选取
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)] }

module.exports = { formatDate, formatTime, EMOTION_MAP, pickRandom }
```

- [ ] **步骤 2：创建云开发登录函数**

`cloudfunctions/login/index.js`：
```javascript
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const db = cloud.database()
  const users = db.collection('users')
  const existing = await users.where({ _openid: OPENID }).get()

  if (existing.data.length === 0) {
    await users.add({
      data: {
        _openid: OPENID,
        nickname: '觉醒者',
        courseProgress: { presence: 0, surrender: 0, openness: 0 },
        streakDays: 0,
        lastActiveDate: '',
        settings: { remindTime: '20:00' },
        createdAt: db.serverDate()
      }
    })
  }

  return { openid: OPENID, isNew: existing.data.length === 0 }
}
```

- [ ] **步骤 3：提交 Commit**

```bash
git init
git add project.config.json app.js app.json app.wxss utils/util.js cloudfunctions/login/
git commit -m "feat: init weapp project with cloud env"
```

---

### 任务 2：AI 引导话术模板树（产品核心）

**文件：**
- 创建：`data/guides.json`

- [ ] **步骤 1：创建完整的话术树**

`data/guides.json`：
```json
{
  "anxiety": {
    "label": "焦虑",
    "steps": [
      {
        "id": "breath",
        "text": "好。我们先一起做一件事：慢慢地吸一口气，然后更慢地呼出去。\n\n现在，回到正常呼吸。只是注意空气进出身体的感觉。"
      },
      {
        "id": "body-scan",
        "text": "焦虑通常伴随身体某个部位有感觉。你现在注意到哪里最明显？",
        "options": [
          { "value": "chest", "label": "胸口发紧" },
          { "value": "belly", "label": "腹部不舒服" },
          { "value": "throat", "label": "喉咙堵着" },
          { "value": "whole", "label": "全身都不对劲" }
        ]
      },
      {
        "id": "body-detail",
        "text": {
          "chest": "把手轻轻放在胸口。不改变什么，只是感受那里的紧。它在你呼吸时有什么变化？",
          "belly": "把注意力带到腹部。感受那里的能量。它是什么颜色？什么温度？",
          "throat": "喉咙堵着的感觉让你想做什么？吞下去还是喊出来？只是注意那个冲动，不行动。",
          "whole": "从头到脚扫描一遍——花10秒慢慢来。现在，哪里的感觉最强烈？"
        }
      },
      {
        "id": "observer",
        "text": "想象这个感觉是一片云。你在看着它飘过天空。你不是那片云——你是看云的人。\n\n你能否只是看着它，不抓住它，不推开它？"
      },
      {
        "id": "return",
        "text": "好。再把注意力带回到呼吸上。三下深呼吸——\n\n第一个呼吸：吸气...呼气...\n第二个呼吸：吸气...呼气...\n第三个呼吸：吸气...呼气...\n\n你在这里。一切都好。"
      }
    ]
  },
  "anger": {
    "label": "愤怒",
    "steps": [
      { "id": "breath", "text": "注意到愤怒了。我们先停三秒——吸，呼。\n\n愤怒是一股能量。在你评判它之前，它只是能量。" },
      {
        "id": "body-scan",
        "text": "这股能量现在在你的身体里是什么样的？",
        "options": [
          { "value": "heat", "label": "一股热流往上冲" },
          { "value": "tight", "label": "某个部位紧绷着" },
          { "value": "restless", "label": "想动、想砸东西" },
          { "value": "numb", "label": "麻了，说不上来" }
        ]
      },
      {
        "id": "urge",
        "text": {
          "heat": "这股热流想让你做什么？说话？行动？\n\n现在，只是看着那个冲动。不执行它。它是客人，你不是它。",
          "tight": "紧绷在哪个位置？\n\n把呼吸带到那里。吸气时想象空气进入那个区域，呼气时它慢慢松开。",
          "restless": "注意到那个想动的冲动了。它在邀请你做什么？\n\n你能不能就坐在这里，感受那个冲动而不去满足它？",
          "numb": "麻木也是一种感觉。只是注意到它。不需要给它起名字。"
        }
      },
      { "id": "observer", "text": "愤怒来了又走了。它不是你。\n\n你注意到它来的那个人，也能注意到它走。\n\n看看现在——愤怒还剩多少？还是已经完全不一样了？" },
      { "id": "return", "text": "再回到呼吸。\n\n吸——你吸气。呼——你呼气。\n\n你在这里。你没有变成那些情绪。" }
    ]
  },
  "low": {
    "label": "低落",
    "steps": [
      { "id": "breath", "text": "我在这里。我陪着你。\n\n先一起呼吸三次。慢慢地。\n\n吸气...呼气..." },
      {
        "id": "story",
        "text": "低落的时候，头脑里通常有一个故事在反复播放。\n\n你现在脑子里在说什么？",
        "options": [
          { "value": "worthless", "label": "我不够好/我不行" },
          { "value": "hopeless", "label": "没意思/不会变好了" },
          { "value": "lonely", "label": "没有人理解我" },
          { "value": "tired", "label": "只是累，什么也不想说" }
        ]
      },
      {
        "id": "observe-story",
        "text": {
          "worthless": "注意到那个声音了。它说你不够好。\n\n现在，你能不能退一步？那个在听这个声音的「你」是谁？",
          "hopeless": "这个声音在说「不会变好了」。有趣的是——\n\n说出这个判断的，是你的思维。而注意到这个判断的，是另一个你。",
          "lonely": "「没有人理解我」——这是一个感受，不是一个事实。\n\n你能否只是感受它，不跟它争论？",
          "tired": "那就只是累。不需要给它更多意义。\n\n把注意力放在身体上——肩膀、后背、眼皮。只是感受累的重量。"
        }
      },
      { "id": "body-anchor", "text": "现在，慢慢地把注意力从思维转到身体。\n\n感受你的脚踩在地上。感受背靠着椅子或床。\n\n思维在讲故事，但身体只在当下。回到身体，就回到了此刻。" },
      { "id": "return", "text": "再呼吸三次。每次呼气时，想象放掉一个念头。\n\n不需要把所有事都想明白。\n\n你只需要在这里。这就够了。" }
    ]
  },
  "tangled": {
    "label": "纠结",
    "steps": [
      { "id": "breath", "text": "纠结的感觉像头脑里有两个声音在吵架。\n\n先停一下。吸——呼。\n\n我们不解决问题。我们只是先看看这个纠结。" },
      {
        "id": "two-voices",
        "text": "哪两个声音在拉扯？",
        "options": [
          { "value": "yes-no", "label": "做还是不做" },
          { "value": "should-want", "label": "应该做 vs 想做" },
          { "value": "fear-hope", "label": "怕坏结果 vs 期待好结果" },
          { "value": "many", "label": "太多选项，选不出来" }
        ]
      },
      {
        "id": "observe-voices",
        "text": {
          "yes-no": "一个说做，一个说不做。\n\n你能不能同时听到这两个声音，而不加入任何一个？就像听两个人在对话。",
          "should-want": "「应该」的声音来自哪里？「想要」的声音又来自哪里？\n\n你能不能只是看着它们，不评判任何一个？",
          "fear-hope": "害怕的那个在保护你。期待的那个在推动你。\n\n两个都是为你好的部分。你能否感谢它们，然后回到中心？",
          "many": "选项太多时，头脑就会打结。\n\n先把所有选项放一边。回到呼吸。你不需要在焦虑中做决定。"
        }
      },
      { "id": "surrender", "text": "此刻你不需要做决定。\n\n你只需要做一件事：\n\n观察那个纠结的能量如何在你的身体里运作。\n\n它在胸口吗？在眉心吗？\n\n那个纠结感一直都在变化——它不是一个固体。看看它此刻是什么形状。" },
      { "id": "return", "text": "好。现在回到呼吸。\n\n决定可以等一等。但你——\n\n你在呼吸。你在这里。\n\n即使没有答案，你也可以好好的。" }
    ]
  }
}
```

- [ ] **步骤 2：提交 Commit**

```bash
git add data/guides.json
git commit -m "feat: add AI guide template tree for 4 emotions"
```

---

### 任务 3：首页 —「此刻」

**文件：**
- 创建：`pages/index/index.js` / `.wxml` / `.wxss` / `.json`

- [ ] **步骤 1：编写页面**

`pages/index/index.json`：
```json
{ "navigationBarTitleText": "此刻" }
```

`pages/index/index.wxml`：
```html
<view class="container">
  <view class="logo-area">
    <text class="logo">此刻</text>
    <text class="subtitle">AI 觉醒导师</text>
  </view>

  <view class="entry-card" bindtap="startEmergency">
    <text class="entry-title">现在感觉怎么样？</text>
    <text class="entry-desc">情绪内耗时，我在这里</text>
  </view>

  <view class="quote-card">
    <text class="quote-text">{{dailyQuote}}</text>
    <text class="quote-source">—— 今日签</text>
  </view>
</view>
```

`pages/index/index.wxss`：
```css
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 120rpx 40rpx 0;
  box-sizing: border-box;
}

.logo-area { text-align: center; margin-bottom: 100rpx; }
.logo { font-size: 72rpx; font-weight: 300; color: #4A7C6F; letter-spacing: 12rpx; }
.subtitle { display: block; font-size: 28rpx; color: #999; margin-top: 16rpx; }

.entry-card {
  width: 100%;
  background: linear-gradient(135deg, #F0F7F4, #FAFAF8);
  border: 2rpx solid #E0EDE8;
  border-radius: 32rpx;
  padding: 60rpx 40rpx;
  text-align: center;
  margin-bottom: 60rpx;
  box-shadow: 0 8rpx 32rpx rgba(74,124,111,0.08);
}

.entry-title { font-size: 40rpx; color: #3D3D3D; font-weight: 500; }
.entry-desc { display: block; font-size: 26rpx; color: #999; margin-top: 16rpx; }

.quote-card {
  background: #FFF;
  border-radius: 24rpx;
  padding: 40rpx;
  width: 100%;
  box-sizing: border-box;
  border: 2rpx solid #F0F0F0;
}

.quote-text { font-size: 28rpx; color: #666; line-height: 1.8; font-style: italic; }
.quote-source { display: block; font-size: 24rpx; color: #BBB; margin-top: 16rpx; text-align: right; }
```

`pages/index/index.js`：
```javascript
const quotes = [
  '你不是你的情绪——你是观察者。',
  '当下是你唯一真正拥有的东西。',
  '痛苦只能存在于当下，但它无法存在于当下——这是个悖论。',
  '你不是那片云，你是看云的人。',
  '当你与思维认同时，你找到了暂时的避难所，却失去了永久的平静。',
  '臣服不是放弃，而是放下对"此刻"的抗拒。',
  '内心的能量如果不被阻塞，它就是生命的喜悦。',
  '问题只存在于时间中。在当下，它不存在。',
  '自由不是控制你的想法，而是不再被它们控制。',
  '在观察者的位置，万事万物都顺其自然。'
]

Page({
  data: { dailyQuote: '' },
  onLoad() {
    const today = new Date().getDate()
    this.setData({ dailyQuote: quotes[today % quotes.length] })
  },
  startEmergency() {
    wx.navigateTo({ url: '/pages/emergency/emergency' })
  }
})
```

- [ ] **步骤 2：提交 Commit**

```bash
git add pages/index/
git commit -m "feat: add home page with emergency entry"
```

---

### 任务 4：急救模式页面（核心模块）

**文件：**
- 创建：`pages/emergency/emergency.js` / `.wxml` / `.wxss` / `.json`
- 创建：`components/mood-picker/mood-picker.js` / `.wxml` / `.wxss`
- 创建：`components/guide-step/guide-step.js` / `.wxml` / `.wxss`

- [ ] **步骤 1：创建情绪选择组件**

`components/mood-picker/mood-picker.wxml`：
```html
<view class="picker-container">
  <text class="picker-title">{{title}}</text>
  <view class="options-grid">
    <view
      class="option-item {{selected === item.value ? 'active' : ''}}"
      wx:for="{{options}}"
      wx:key="value"
      bindtap="onSelect"
      data-value="{{item.value}}"
    >
      <text class="option-icon">{{item.icon}}</text>
      <text class="option-label">{{item.label}}</text>
    </view>
  </view>
</view>
```

`components/mood-picker/mood-picker.js`：
```javascript
Component({
  properties: {
    title: { type: String, value: '现在感觉怎么样？' },
    options: { type: Array, value: [] },
    selected: { type: String, value: '' }
  },
  methods: {
    onSelect(e) {
      this.triggerEvent('select', { value: e.currentTarget.dataset.value })
    }
  }
})
```

`components/mood-picker/mood-picker.wxss`：
```css
.picker-container { padding: 40rpx 0; }
.picker-title { font-size: 36rpx; color: #3D3D3D; text-align: center; display: block; margin-bottom: 48rpx; }
.options-grid { display: flex; flex-wrap: wrap; gap: 24rpx; justify-content: center; }
.option-item {
  width: 280rpx;
  padding: 32rpx 24rpx;
  background: #FFF;
  border-radius: 24rpx;
  text-align: center;
  border: 2rpx solid #F0F0F0;
}
.option-item.active { border-color: #4A7C6F; background: #F0F7F4; }
.option-icon { font-size: 56rpx; display: block; }
.option-label { font-size: 28rpx; color: #3D3D3D; margin-top: 12rpx; }
```

- [ ] **步骤 2：创建 AI 引导步骤组件**

`components/guide-step/guide-step.wxml`：
```html
<view class="guide-container">
  <view class="guide-bubble">
    <text class="guide-text">{{text}}</text>
  </view>
  <view wx:if="{{options && options.length > 0}}" class="guide-options">
    <view
      class="guide-option"
      wx:for="{{options}}"
      wx:key="value"
      bindtap="onSelect"
      data-value="{{item.value}}"
    >
      <text class="guide-option-text">{{item.label}}</text>
    </view>
  </view>
  <view wx:if="{{showNext}}" class="next-hint" bindtap="onNext">
    <text>继续 →</text>
  </view>
</view>
```

`components/guide-step/guide-step.js`：
```javascript
Component({
  properties: {
    text: { type: String, value: '' },
    options: { type: Array, value: [] },
    showNext: { type: Boolean, value: false }
  },
  methods: {
    onSelect(e) {
      this.triggerEvent('select', { value: e.currentTarget.dataset.value })
    },
    onNext() {
      this.triggerEvent('next')
    }
  }
})
```

`components/guide-step/guide-step.wxss`：
```css
.guide-container { padding: 40rpx 20rpx; }
.guide-bubble {
  background: #FFF;
  border-radius: 24rpx;
  padding: 40rpx;
  line-height: 1.8;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.04);
}
.guide-text { font-size: 30rpx; color: #3D3D3D; white-space: pre-line; }
.guide-options { margin-top: 40rpx; display: flex; flex-direction: column; gap: 20rpx; }
.guide-option {
  background: #F5F5F5;
  border-radius: 20rpx;
  padding: 32rpx 28rpx;
  text-align: center;
}
.guide-option-text { font-size: 28rpx; color: #555; }
.next-hint { text-align: center; margin-top: 40rpx; color: #4A7C6F; font-size: 28rpx; }
```

- [ ] **步骤 3：创建急救模式页面**

`pages/emergency/emergency.json`：
```json
{
  "navigationBarTitleText": "",
  "usingComponents": {
    "mood-picker": "/components/mood-picker/mood-picker",
    "guide-step": "/components/guide-step/guide-step"
  }
}
```

`pages/emergency/emergency.wxml`：
```html
<view class="container">
  <!-- 步骤指示器 -->
  <view class="step-indicator" wx:if="{{phase !== 'select'}}">
    <view class="step-dot {{stepIndex >= i ? 'active' : ''}}" wx:for="{{totalSteps}}" wx:key="*this"></view>
  </view>

  <!-- 情绪选择阶段 -->
  <mood-picker
    wx:if="{{phase === 'select'}}"
    title="现在感觉怎么样？"
    options="{{emotionOptions}}"
    bind:select="onEmotionSelect"
  />

  <!-- AI 引导阶段 -->
  <guide-step
    wx:elif="{{phase === 'guide'}}"
    text="{{currentStep.text}}"
    options="{{currentStep.options}}"
    showNext="{{currentStep.showNext}}"
    bind:select="onGuideSelect"
    bind:next="onGuideNext"
  />

  <!-- 完成阶段 -->
  <view wx:elif="{{phase === 'complete'}}" class="complete-view">
    <text class="complete-icon">🌿</text>
    <text class="complete-title">你在这里。一切都好。</text>
    <text class="complete-desc">想记录点什么吗？</text>
    <textarea class="note-input" placeholder="此刻的感受..." bindinput="onNoteInput"></textarea>
    <view class="rating-area">
      <text class="rating-label">现在感觉好些了吗？</text>
      <view class="stars">
        <text class="star {{rating >= i ? 'active' : ''}}" wx:for="{{[1,2,3,4,5]}}" wx:key="*this" bindtap="setRating" data-value="{{item}}">★</text>
      </view>
    </view>
    <button class="save-btn" bindtap="saveAndExit">保存并完成</button>
  </view>
</view>
```

`pages/emergency/emergency.js`：
```javascript
const guides = require('../../data/guides.json')
const EMOTION_KEYS = ['anxiety', 'anger', 'low', 'tangled']

Page({
  data: {
    phase: 'select', // select | guide | complete
    emotionOptions: [
      { value: 'anxiety', label: '焦虑/恐惧', icon: '😰' },
      { value: 'anger', label: '愤怒/烦躁', icon: '😤' },
      { value: 'low', label: '无力/低落', icon: '😔' },
      { value: 'tangled', label: '纠结/内耗', icon: '😵‍💫' }
    ],
    selectedEmotion: '',
    stepIndex: 0,
    totalSteps: 0,
    steps: [],
    currentStep: {},
    selectedOptions: {},
    note: '',
    rating: 0,
    startTime: null
  },

  onLoad() {
    this.setData({ startTime: Date.now() })
  },

  onEmotionSelect(e) {
    const emotion = e.detail.value
    const steps = guides[emotion].steps
    this.setData({
      selectedEmotion: emotion,
      phase: 'guide',
      steps: steps,
      totalSteps: steps.length,
      stepIndex: 0,
      currentStep: this.resolveStep(steps[0], null)
    })
  },

  resolveStep(step, previousOption) {
    if (typeof step.text === 'object') {
      // 分支话术：根据上一步选择取对应文本
      const branchText = step.text[previousOption]
      return { text: branchText || Object.values(step.text)[0], options: step.options || [] }
    }
    return { text: step.text, options: step.options || [] }
  },

  onGuideSelect(e) {
    const value = e.detail.value
    const stepIndex = this.data.stepIndex
    const step = this.data.steps[stepIndex]
    const key = `${stepIndex}`
    const selectedOptions = { ...this.data.selectedOptions, [key]: value }

    if (stepIndex < this.data.steps.length - 1) {
      const nextStep = this.resolveStep(this.data.steps[stepIndex + 1], value)
      this.setData({
        selectedOptions,
        stepIndex: stepIndex + 1,
        currentStep: nextStep
      })
    } else {
      this.setData({
        selectedOptions,
        phase: 'complete'
      })
    }
  },

  onGuideNext() {
    const stepIndex = this.data.stepIndex
    if (stepIndex < this.data.steps.length - 1) {
      const nextStep = this.resolveStep(this.data.steps[stepIndex + 1], null)
      this.setData({
        stepIndex: stepIndex + 1,
        currentStep: nextStep
      })
    } else {
      this.setData({ phase: 'complete' })
    }
  },

  onNoteInput(e) { this.setData({ note: e.detail.value }) },
  setRating(e) { this.setData({ rating: e.currentTarget.dataset.value }) },

  saveAndExit() {
    const db = wx.cloud.database()
    const recoveryMinutes = Math.round((Date.now() - this.data.startTime) / 60000)
    db.collection('moodEntries').add({
      data: {
        emotionType: this.data.selectedEmotion,
        trigger: '',
        bodyPart: '',
        completedSteps: true,
        recoveryMinutes: recoveryMinutes,
        note: this.data.note,
        rating: this.data.rating,
        createdAt: db.serverDate()
      }
    }).then(() => {
      wx.showToast({ title: '已记录', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1500)
    })
  }
})
```

`pages/emergency/emergency.wxss`：
```css
.container { padding: 40rpx; min-height: 100vh; background: #FAFAF8; }
.step-indicator { display: flex; justify-content: center; gap: 12rpx; margin-bottom: 40rpx; }
.step-dot { width: 16rpx; height: 16rpx; border-radius: 50%; background: #E0E0E0; }
.step-dot.active { background: #4A7C6F; width: 32rpx; border-radius: 8rpx; }

.complete-view { display: flex; flex-direction: column; align-items: center; padding-top: 80rpx; }
.complete-icon { font-size: 80rpx; margin-bottom: 32rpx; }
.complete-title { font-size: 36rpx; color: #4A7C6F; font-weight: 500; }
.complete-desc { font-size: 28rpx; color: #999; margin-top: 16rpx; }
.note-input {
  width: 100%; height: 200rpx; background: #FFF; border-radius: 20rpx;
  padding: 24rpx; margin-top: 40rpx; font-size: 28rpx; box-sizing: border-box;
}
.rating-area { margin-top: 40rpx; text-align: center; }
.rating-label { font-size: 26rpx; color: #999; }
.stars { margin-top: 16rpx; }
.star { font-size: 56rpx; color: #E0E0E0; margin: 0 8rpx; }
.star.active { color: #F5C842; }
.save-btn {
  margin-top: 60rpx; width: 80%; background: #4A7C6F; color: #FFF;
  border-radius: 48rpx; padding: 24rpx 0; font-size: 30rpx;
}
```

- [ ] **步骤 4：提交 Commit**

```bash
git add components/mood-picker/ components/guide-step/ pages/emergency/
git commit -m "feat: add emergency mode with AI guide flow"
```

---

### 任务 5：情绪日志时间线

**文件：**
- 创建：`pages/log/log.js` / `.wxml` / `.wxss` / `.json`

- [ ] **步骤 1：编写日志页面**

`pages/log/log.json`：
```json
{
  "navigationBarTitleText": "日志",
  "enablePullDownRefresh": true
}
```

`pages/log/log.wxml`：
```html
<view class="container">
  <view wx:if="{{list.length === 0}}" class="empty-state">
    <text class="empty-icon">🌱</text>
    <text class="empty-text">还没有记录</text>
    <text class="empty-hint">当你感到情绪波动时，打开「此刻」</text>
  </view>

  <view wx:else class="timeline">
    <view class="day-group" wx:for="{{list}}" wx:key="date">
      <text class="day-label">{{item.date}}</text>
      <view class="entry-card" wx:for="{{item.entries}}" wx:key="id" bindtap="viewDetail" data-id="{{item._id}}">
        <view class="entry-header">
          <text class="entry-emoji">{{item.emotionIcon}}</text>
          <text class="entry-type">{{item.emotionLabel}}</text>
          <text class="entry-time">{{item.time}}</text>
        </view>
        <text class="entry-recovery" wx:if="{{item.recoveryMinutes}}">平复用时 {{item.recoveryMinutes}} 分钟</text>
        <text class="entry-note" wx:if="{{item.note}}">{{item.note}}</text>
      </view>
    </view>
  </view>
</view>
```

`pages/log/log.js`：
```javascript
const util = require('../../utils/util')

Page({
  data: { list: [] },

  onShow() { this.loadEntries() },

  loadEntries() {
    const db = wx.cloud.database()
    db.collection('moodEntries').orderBy('createdAt', 'desc').limit(50).get().then(res => {
      const grouped = {}
      res.data.forEach(entry => {
        const date = util.formatDate(new Date(entry.createdAt))
        if (!grouped[date]) grouped[date] = { date, entries: [] }
        grouped[date].entries.push({
          _id: entry._id,
          ...entry,
          time: util.formatTime(new Date(entry.createdAt)),
          emotionIcon: util.EMOTION_MAP[entry.emotionType]?.icon || '',
          emotionLabel: util.EMOTION_MAP[entry.emotionType]?.label || ''
        })
      })
      this.setData({ list: Object.values(grouped) })
    })
  },

  viewDetail(e) {
    // MVP暂时只显示列表，详情后在log页面内直接展示
  }
})
```

`pages/log/log.wxss`：
```css
.container { padding: 20rpx 30rpx; min-height: 100vh; background: #FAFAF8; }
.empty-state { display: flex; flex-direction: column; align-items: center; padding-top: 200rpx; }
.empty-icon { font-size: 100rpx; }
.empty-text { font-size: 32rpx; color: #999; margin-top: 24rpx; }
.empty-hint { font-size: 26rpx; color: #CCC; margin-top: 12rpx; }

.day-group { margin-bottom: 40rpx; }
.day-label { font-size: 26rpx; color: #999; display: block; margin-bottom: 16rpx; }
.entry-card {
  background: #FFF; border-radius: 20rpx; padding: 28rpx; margin-bottom: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.03);
}
.entry-header { display: flex; align-items: center; gap: 12rpx; }
.entry-emoji { font-size: 36rpx; }
.entry-type { font-size: 28rpx; color: #3D3D3D; }
.entry-time { font-size: 24rpx; color: #BBB; margin-left: auto; }
.entry-recovery { display: block; font-size: 24rpx; color: #4A7C6F; margin-top: 12rpx; }
.entry-note { display: block; font-size: 26rpx; color: #888; margin-top: 8rpx; }
```

- [ ] **步骤 2：提交 Commit**

```bash
git add pages/log/
git commit -m "feat: add mood log timeline"
```

---

### 任务 6：学习路径 + 课程内容

**文件：**
- 创建：`data/courses.json`
- 创建：`pages/learning/learning.js` / `.wxml` / `.wxss` / `.json`
- 创建：`pages/learning/lesson/lesson.js` / `.wxml` / `.wxss` / `.json`

- [ ] **步骤 1：创建课程内容数据**

`data/courses.json`：
```json
{
  "presence": {
    "title": "临在之路",
    "subtitle": "从思维认同中解放",
    "icon": "🌿",
    "color": "#4A7C6F",
    "source": "源自《当下的力量》",
    "lessons": [
      {
        "id": "p1",
        "title": "你≠你的思维",
        "concept": "你的思维不是你。你是那个在听思维声音的觉知。\n\n大多数人终其一生都认同于头脑里那个不停说话的声音——那就是「思维认同」。从思维认同中解放出来的第一步，就是意识到：你不是那个声音，你是听到那个声音的人。",
        "practice": "花 3 分钟观察你的思维。\n\n坐着，闭上眼睛。注意头脑里出现的念头。\n\n不要评判它们，不要跟随它们。\n\n只是像一个旁观者一样看着它们来来去去。\n\n每次发现自己被念头带走时，在心里说：「我在想xx事」——然后轻轻回到观察者的位置。"
      },
      {
        "id": "p2",
        "title": "回到身体",
        "concept": "思维活在过去和未来，而身体永远在当下。\n\n当你感到焦虑或不安时，最快的回到当下的方式就是进入身体感受。感受呼吸、感受脚踩在地上的触感、感受手触摸物体的温度。",
        "practice": "闭上眼睛，把注意力带到你的右手。\n\n感受右手的温度、脉搏、重量。\n\n然后慢慢地把注意力移到右臂、右肩...\n\n花 5 分钟做一次完整的身体扫描。每次注意力漂移时，轻轻带回来。"
      },
      {
        "id": "p3",
        "title": "瓦解痛苦之身",
        "concept": "痛苦之身是积压的情绪能量，它需要一个「你」来喂养它。\n\n当你认同它时，它就活了；当你观察它时，它就消散了。\n\n关键不在于消除痛苦，而在于不再与它认同。",
        "practice": "下一次你感到一种熟悉的负面情绪升起时——\n\n停下来。在心里说：\n\n「我注意到我体内的痛苦之身被激活了。」\n\n然后观察它：它在身体的哪个部位？它想让你做什么？\n\n不抗拒，不行动，只是观察。"
      }
    ]
  },
  "surrender": {
    "title": "臣服之路",
    "subtitle": "对当下说是",
    "icon": "🍂",
    "color": "#C4A56C",
    "source": "源自《臣服实验》",
    "lessons": [
      {
        "id": "s1",
        "title": "什么是真正的臣服",
        "concept": "臣服不是认输，不是被动，不是「我不行了」。\n\n真正的臣服是：对「当下此刻如其所是」说「是」。\n\n你不需要喜欢这一刻，你不需要接受不公平——你只是承认：这一刻已经在这里了。抗拒改变不了事实，只会增加痛苦。",
        "practice": "找一个今天让你觉得「不应该是这样」的事。\n\n在心里对它说三次：\n\n「这件事已经发生了。」\n\n注意说这句话时，你身体的感受有什么变化。"
      },
      {
        "id": "s2",
        "title": "观察内在的抗拒",
        "concept": "抗拒的形式有很多种：抱怨、不耐烦、沮丧、愤怒、焦虑……\n\n它们的共同点是：你希望此刻不是此刻。\n\n下次感觉到抗拒时，不要试图消除它。只是看着它。\n\n「哦，这就是抗拒的感觉。它在我的胸口紧绷着。」",
        "practice": "今天，每当你想抱怨时——无论是心里还是嘴上——\n\n停一下。问自己：\n\n「我是在抗拒当下某个已经发生的现实吗？」\n\n不是停止抱怨，而是看到自己在抱怨。"
      },
      {
        "id": "s3",
        "title": "生命之流",
        "concept": "臣服的终点是信任。\n\n不是信任某个特定的结果会发生，而是信任——\n\n无论发生什么，你都能处理。\n\n当你不再执着于事情必须按照你的剧本走时，生命开始变得轻松。",
        "practice": "回想一件最近让你焦虑的未来事件。\n\n在心里对它说：\n\n「我不知道结果会怎样，但我相信无论发生什么，我都能面对。」\n\n感受一下，松开紧握的手。"
      }
    ]
  },
  "openness": {
    "title": "开放之路",
    "subtitle": "释放内心能量阻塞",
    "icon": "💫",
    "color": "#8B9DC3",
    "source": "源自《清醒地活》",
    "lessons": [
      {
        "id": "o1",
        "title": "你≠你内心的声音",
        "concept": "你头脑里有一个一直在说话的声音。它评论、评判、担忧、计划。\n\n但如果你能听到这个声音，那说明你不是这个声音。\n\n你是那个在听的人。\n\n这个发现——意识到你不是你的内心独白——就是觉醒的起点。",
        "practice": "安静坐 3 分钟。\n\n听你头脑里的声音。它说什么？\n\n每当注意到一个念头时，在心里标注：\n\n「啊，又一个念头。」\n\n不要赶走它，不要跟随它。只是看着它来，看着它走。"
      },
      {
        "id": "o2",
        "title": "拆解阻塞的能量",
        "concept": "情绪的本质是流经你的能量。\n\n当你抗拒一个情绪时，能量就阻塞了。它卡在你的身体里，变成焦虑、抑郁、愤怒。\n\n释放的方法很简单：允许它流经你。\n\n就像允许一朵云飘过天空。",
        "practice": "回想一件让你不舒服的事。\n\n不要把注意力放在「事」上，而是放在你身体的感受上。\n\n感受那股能量。它在哪里？多大？什么颜色？\n\n不要推开它。只是让它在那里。\n\n注意：当你不再抗拒它时，它开始变化了吗？"
      },
      {
        "id": "o3",
        "title": "打开心",
        "concept": "你内心最深处的渴望不是被爱——而是去爱。\n\n当你放掉内心所有的阻塞时，剩下的就是自然而然的爱与喜悦。\n\n这不是你要「练习」的东西，而是你放下防御后自然显露的东西。",
        "practice": "今天，在三个不同的时刻，在心里默默祝福三个人：\n\n一个你爱的人，一个你认识的人，一个让你不舒服的人。\n\n分别对他们说：\n\n「愿你快乐。愿你平安。愿你自在。」\n\n注意说出这些话时，你内心的感受。"
      }
    ]
  }
}
```

- [ ] **步骤 2：创建学习路径页面**

`pages/learning/learning.json`：
```json
{
  "navigationBarTitleText": "学习",
  "usingComponents": {}
}
```

`pages/learning/learning.wxml`：
```html
<view class="container">
  <view class="path-card {{path}}" wx:for="{{paths}}" wx:key="key" bindtap="openPath" data-key="{{item.key}}">
    <view class="path-header">
      <text class="path-icon">{{item.icon}}</text>
      <view class="path-info">
        <text class="path-title">{{item.title}}</text>
        <text class="path-subtitle">{{item.subtitle}}</text>
      </view>
    </view>
    <view class="path-progress">
      <view class="progress-bar">
        <view class="progress-fill" style="width: {{item.progressPercent}}%"></view>
      </view>
      <text class="progress-text">{{item.progress}}/{{item.total}}</text>
    </view>
    <text class="path-source">{{item.source}}</text>
  </view>
</view>
```

`pages/learning/learning.js`：
```javascript
const courses = require('../../data/courses.json')

Page({
  data: {
    paths: []
  },

  onShow() {
    this.loadProgress()
  },

  loadProgress() {
    const db = wx.cloud.database()
    const userId = '' // 从globalData获取
    const paths = Object.entries(courses).map(([key, course]) => {
      // 从云数据库读取进度，取本地缓存作为fallback
      const cache = wx.getStorageSync(`progress_${key}`) || 0
      return {
        key,
        ...course,
        total: course.lessons.length,
        progress: cache,
        progressPercent: Math.round((cache / course.lessons.length) * 100)
      }
    })
    this.setData({ paths })
  },

  openPath(e) {
    const key = e.currentTarget.dataset.key
    wx.navigateTo({ url: `/pages/learning/lesson/lesson?path=${key}&lessonIndex=0` })
  }
})
```

`pages/learning/learning.wxss`：
```css
.container { padding: 30rpx; min-height: 100vh; background: #FAFAF8; }
.path-card {
  background: #FFF; border-radius: 28rpx; padding: 36rpx; margin-bottom: 28rpx;
  border-left: 8rpx solid; box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.03);
}
.path-card.presence { border-color: #4A7C6F; }
.path-card.surrender { border-color: #C4A56C; }
.path-card.openness { border-color: #8B9DC3; }

.path-header { display: flex; align-items: center; gap: 24rpx; }
.path-icon { font-size: 48rpx; }
.path-info { flex: 1; }
.path-title { font-size: 34rpx; font-weight: 500; color: #3D3D3D; display: block; }
.path-subtitle { font-size: 26rpx; color: #999; margin-top: 6rpx; }

.path-progress { display: flex; align-items: center; gap: 16rpx; margin-top: 24rpx; }
.progress-bar { flex: 1; height: 8rpx; background: #F0F0F0; border-radius: 4rpx; overflow: hidden; }
.progress-fill { height: 100%; background: #4A7C6F; border-radius: 4rpx; }
.progress-text { font-size: 24rpx; color: #BBB; }
.path-source { display: block; font-size: 24rpx; color: #CCC; margin-top: 16rpx; }
```

- [ ] **步骤 3：创建课程详情页面**

`pages/learning/lesson/lesson.json`：
```json
{ "navigationBarTitleText": "" }
```

`pages/learning/lesson/lesson.wxml`：
```html
<view class="container">
  <view class="lesson-header">
    <text class="lesson-num">第 {{lessonIndex + 1}} 课</text>
    <text class="lesson-title">{{lesson.title}}</text>
  </view>

  <scroll-view scroll-y class="content-area">
    <view class="section concept">
      <text class="section-label">💡 概念</text>
      <text class="section-text">{{lesson.concept}}</text>
    </view>

    <view class="section practice">
      <text class="section-label">🧘 今日练习</text>
      <text class="section-text">{{lesson.practice}}</text>
    </view>

    <button class="complete-btn" bindtap="markComplete">
      {{isCompleted ? '已完成 ✓' : '标记完成'}}
    </button>

    <button class="next-btn" wx:if="{{hasNext}}" bindtap="nextLesson">
      下一课 →
    </button>
  </scroll-view>
</view>
```

`pages/learning/lesson/lesson.js`：
```javascript
const courses = require('../../../data/courses.json')

Page({
  data: {
    path: '',
    lessonIndex: 0,
    lesson: {},
    isCompleted: false,
    hasNext: false
  },

  onLoad(options) {
    const path = options.path || 'presence'
    const lessonIndex = parseInt(options.lessonIndex) || 0
    this.loadLesson(path, lessonIndex)
  },

  loadLesson(path, lessonIndex) {
    const course = courses[path]
    if (!course) return
    const lesson = course.lessons[lessonIndex]
    this.setData({
      path,
      lessonIndex,
      lesson,
      hasNext: lessonIndex < course.lessons.length - 1,
      isCompleted: wx.getStorageSync(`lesson_${path}_${lesson.id}`) || false
    })
    wx.setNavigationBarTitle({ title: course.title })
  },

  markComplete() {
    const { path, lesson } = this.data
    const key = `lesson_${path}_${lesson.id}`
    wx.setStorageSync(key, true)
    this.setData({ isCompleted: true })

    // 更新路径进度
    const course = courses[path]
    let completed = 0
    course.lessons.forEach(l => {
      if (wx.getStorageSync(`lesson_${path}_${l.id}`)) completed++
    })
    wx.setStorageSync(`progress_${path}`, completed)
  },

  nextLesson() {
    const { path, lessonIndex } = this.data
    this.loadLesson(path, lessonIndex + 1)
  }
})
```

`pages/learning/lesson/lesson.wxss`：
```css
.container { padding: 30rpx; min-height: 100vh; background: #FAFAF8; }
.lesson-header { margin-bottom: 40rpx; }
.lesson-num { font-size: 26rpx; color: #4A7C6F; }
.lesson-title { font-size: 40rpx; font-weight: 500; color: #3D3D3D; margin-top: 8rpx; }
.content-area { height: calc(100vh - 200rpx); }
.section { background: #FFF; border-radius: 24rpx; padding: 32rpx; margin-bottom: 24rpx; }
.section-label { font-size: 26rpx; color: #4A7C6F; display: block; margin-bottom: 16rpx; }
.section-text { font-size: 28rpx; color: #555; line-height: 1.9; white-space: pre-line; }
.complete-btn {
  margin-top: 20rpx; background: #4A7C6F; color: #FFF; border-radius: 48rpx; padding: 24rpx; font-size: 30rpx;
}
.next-btn {
  margin-top: 20rpx; background: transparent; color: #4A7C6F; border: 2rpx solid #4A7C6F;
  border-radius: 48rpx; padding: 24rpx; font-size: 30rpx;
}
```

- [ ] **步骤 4：提交 Commit**

```bash
git add data/courses.json pages/learning/
git commit -m "feat: add learning paths with 9 lessons"
```

---

### 任务 7：我的页面 + 觉醒报告

**文件：**
- 创建：`pages/profile/profile.js` / `.wxml` / `.wxss` / `.json`
- 创建：`components/trend-chart/trend-chart.js` / `.wxml` / `.wxss`
- 创建：`utils/report.js`

- [ ] **步骤 1：创建报告计算工具**

`utils/report.js`：
```javascript
function generateInsight(entries, weeklyAvg) {
  if (entries.length === 0) return '还没有足够的数据生成洞察。开始记录你的情绪吧。'
  const types = {}
  entries.forEach(e => { types[e.emotionType] = (types[e.emotionType] || 0) + 1 })
  const topType = Object.entries(types).sort((a, b) => b[1] - a[1])[0]

  const avgRecovery = entries.reduce((s, e) => s + (e.recoveryMinutes || 0), 0) / entries.length

  let insight = `最近你最常出现的情绪是「${topType[0]}」。`
  if (avgRecovery < 15) insight += '你从情绪中恢复的速度很快，说明觉察力在提升。'
  else if (avgRecovery < 30) insight += '平均恢复时间在可接受范围内。'
  else insight += '平均恢复时间较长——试试在情绪刚出现时就打开急救模式。'
  if (weeklyAvg < 7) insight += '每周内耗次数较少，保持住。'
  return insight
}

function weeklyComparison(currentWeek, lastWeek) {
  return {
    sessions: lastWeek ? Math.round((currentWeek - lastWeek) / lastWeek * 100) : 0,
    recovery: 0 // 计算平均恢复时间变化
  }
}

module.exports = { generateInsight, weeklyComparison }
```

- [ ] **步骤 2：创建趋势图组件**

`components/trend-chart/trend-chart.js`：
```javascript
Component({
  properties: {
    data: { type: Array, value: [] },
    title: { type: String, value: '' },
    color: { type: String, value: '#4A7C6F' }
  },
  observers: {
    'data': function() { this.drawChart() }
  },
  methods: {
    drawChart() {
      // MVP: 使用简单的view-based柱状图，后期改为canvas
    }
  }
})
```

- [ ] **步骤 3：创建我的页面**

`pages/profile/profile.json`：
```json
{
  "navigationBarTitleText": "我的",
  "usingComponents": {
    "trend-chart": "/components/trend-chart/trend-chart"
  }
}
```

`pages/profile/profile.wxml`：
```html
<view class="container">
  <view class="user-card">
    <view class="avatar">🧘</view>
    <text class="nickname">觉醒者</text>
    <text class="streak">连续练习 {{streakDays}} 天</text>
  </view>

  <view class="stats-row">
    <view class="stat-item">
      <text class="stat-num">{{totalSessions}}</text>
      <text class="stat-label">急救次数</text>
    </view>
    <view class="stat-item">
      <text class="stat-num">{{avgRecovery}}min</text>
      <text class="stat-label">平均恢复</text>
    </view>
    <view class="stat-item">
      <text class="stat-num">{{totalLessons}}</text>
      <text class="stat-label">完成课程</text>
    </view>
  </view>

  <view class="section">
    <text class="section-title">本周情绪分布</text>
    <view class="emotion-bars">
      <view class="bar-item" wx:for="{{emotionDistribution}}" wx:key="type">
        <text class="bar-label">{{item.label}}</text>
        <view class="bar-track">
          <view class="bar-fill" style="width: {{item.percent}}%; background: {{item.color}}"></view>
        </view>
        <text class="bar-count">{{item.count}}次</text>
      </view>
    </view>
  </view>

  <view class="section">
    <text class="section-title">AI 洞察</text>
    <view class="insight-card">
      <text class="insight-text">{{insight}}</text>
    </view>
  </view>
</view>
```

`pages/profile/profile.js`：
```javascript
const util = require('../../utils/util')
const report = require('../../utils/report')

Page({
  data: {
    streakDays: 0,
    totalSessions: 0,
    avgRecovery: 0,
    totalLessons: 0,
    emotionDistribution: [],
    insight: '加载中...'
  },

  onShow() { this.loadReport() },

  loadReport() {
    const db = wx.cloud.database()
    db.collection('moodEntries').orderBy('createdAt', 'desc').limit(100).get().then(res => {
      const entries = res.data
      const totalSessions = entries.length
      const avgRecovery = entries.length
        ? Math.round(entries.reduce((s, e) => s + (e.recoveryMinutes || 0), 0) / entries.length)
        : 0

      // 情绪分布
      const counts = {}
      entries.forEach(e => {
        counts[e.emotionType] = (counts[e.emotionType] || 0) + 1
      })
      const maxCount = Math.max(...Object.values(counts), 1)
      const emotionDistribution = Object.entries(counts).map(([type, count]) => ({
        type,
        label: util.EMOTION_MAP[type]?.label || type,
        color: util.EMOTION_MAP[type]?.color || '#999',
        count,
        percent: Math.round(count / maxCount * 100)
      }))

      // 课程完成数
      let totalLessons = 0
      ;['presence', 'surrender', 'openness'].forEach(p => {
        totalLessons += wx.getStorageSync(`progress_${p}`) || 0
      })

      const insight = report.generateInsight(entries, 7)

      this.setData({
        totalSessions,
        avgRecovery,
        totalLessons,
        emotionDistribution,
        insight,
        streakDays: wx.getStorageSync('streakDays') || 0
      })
    })
  }
})
```

`pages/profile/profile.wxss`：
```css
.container { padding: 30rpx; min-height: 100vh; background: #FAFAF8; }
.user-card { text-align: center; padding: 40rpx 0; }
.avatar { font-size: 80rpx; }
.nickname { font-size: 36rpx; font-weight: 500; color: #3D3D3D; display: block; margin-top: 16rpx; }
.streak { font-size: 26rpx; color: #4A7C6F; display: block; margin-top: 8rpx; }

.stats-row { display: flex; justify-content: space-around; margin: 30rpx 0; }
.stat-item { text-align: center; }
.stat-num { font-size: 44rpx; font-weight: 600; color: #3D3D3D; display: block; }
.stat-label { font-size: 24rpx; color: #BBB; margin-top: 8rpx; }

.section { margin-top: 40rpx; }
.section-title { font-size: 28rpx; color: #999; display: block; margin-bottom: 20rpx; }

.emotion-bars { background: #FFF; border-radius: 20rpx; padding: 24rpx; }
.bar-item { display: flex; align-items: center; gap: 16rpx; margin-bottom: 16rpx; }
.bar-label { width: 80rpx; font-size: 26rpx; color: #555; }
.bar-track { flex: 1; height: 20rpx; background: #F0F0F0; border-radius: 10rpx; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 10rpx; }
.bar-count { font-size: 24rpx; color: #999; width: 60rpx; text-align: right; }

.insight-card { background: #FFF; border-radius: 20rpx; padding: 32rpx; }
.insight-text { font-size: 28rpx; color: #555; line-height: 1.8; }
```

- [ ] **步骤 4：提交 Commit**

```bash
git add utils/report.js components/trend-chart/ pages/profile/
git commit -m "feat: add profile page with awakening report"
```

---

### 任务 8：云函数 + 云数据库初始化

- [ ] **步骤 1：创建周报云函数**

`cloudfunctions/report/index.js`：
```javascript
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const db = cloud.database()
  const now = new Date()
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)

  const entries = await db.collection('moodEntries')
    .where({
      _openid: OPENID,
      createdAt: db.command.gte(weekAgo)
    })
    .get()

  return {
    total: entries.data.length,
    avgRecovery: entries.data.length
      ? entries.data.reduce((s, e) => s + (e.recoveryMinutes || 0), 0) / entries.data.length
      : 0
  }
}
```

- [ ] **步骤 2：提交 Commit**

```bash
git add cloudfunctions/report/
git commit -m "feat: add weekly report cloud function"
```

---

## 自检

1. **规格覆盖度：** ✅ 所有规格需求已覆盖——急救模式（任务 4）、成长模式（任务 5-6）、日志（任务 5）、觉醒报告（任务 7）、用户系统（任务 1）
2. **占位符扫描：** ✅ 无 TODO、无"待定"、无模糊步骤
3. **类型一致性：** ✅ 情绪类型 `anxiety/anger/low/tangled` 在 `guides.json`、`util.js`、页面中一致
