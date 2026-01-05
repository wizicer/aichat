# AIChat 需求文档

## 1. 项目概述

**应用名称：** AIChat  
**类型：** PWA - AI社交聊天应用  
**技术栈：** React + TypeScript + TailwindCSS  
**界面风格：** 类微信四Tab布局

---

## 2. 整体架构

### 2.1 主导航（底部Tab栏）
- **聊天** - 聊天列表
- **通讯录** - 人物卡片管理
- **发现** - 朋友圈 + 世界书
- **我** - 个人设置

---

## 3. 功能模块

### 3.1 聊天模块

#### 3.1.1 聊天列表页
- 显示所有聊天会话列表
- 每项显示：头像、名称、最后消息、时间、未读数
- 支持置顶（置顶项显示在最上方）
- 支持静音（静音项不显示红点/震动）
- 点击进入聊天详情

#### 3.1.2 聊天详情页
- 消息气泡展示（用户右侧、AI左侧）
- 消息输入框 + 发送按钮
- 更多功能按钮（图片、红包、位置、链接等）

#### 3.1.3 消息类型

| 类型 | 说明 |
|------|------|
| **文本消息** | 基本文字消息 |
| **图片消息** | 发送/接收图片，点击可放大查看 |
| **语音消息** | 显示时长，点击播放 |
| **红包消息** | 红包卡片样式，可领取 |
| **位置分享** | 地图卡片，显示位置名称和地址 |
| **链接分享** | 链接卡片，显示标题、描述、来源 |
| **系统消息** | 居中灰色文字（如"你撤回了一条消息"） |
| **现实卡片** | 特殊交互卡片（见3.1.4） |

#### 3.1.4 现实卡片（Reality Card）

**触发方式：**
- 用户发起：通过聊天界面的"+"菜单选择"发起现实"
- AI发起：AI在回复中生成现实卡片

**卡片状态：**
- 待接受：显示"现实邀请"卡片，有"接受"/"拒绝"按钮
- 进行中：显示"进入现实"入口
- 已结束：显示"查看回忆"入口

**现实详情页（二级页面）：**
```
┌─────────────────────────┐
│  ← 退出现实              │  ← 返回聊天消息流
├─────────────────────────┤
│                         │
│  [段落1文字内容]         │
│                         │
│  [段落2文字内容]         │
│                         │
│  [段落3文字内容]         │
│                         │
│  ─────────────────────  │
│                         │
│  [交互按钮1] [交互按钮2]  │  ← 只在最后出现
│                         │
└─────────────────────────┘
```

**交互逻辑：**
- 点击按钮后，按钮消失
- AI根据选择生成新的段落内容追加显示
- 新内容末尾可能再次出现新的交互按钮
- 如此循环直到剧情结束

**数据结构：**
```typescript
interface RealityCard {
  id: string;
  chatId: string;
  status: 'pending' | 'active' | 'ended';
  title: string;
  paragraphs: RealityParagraph[];
  createdAt: number;
}

interface RealityParagraph {
  id: string;
  content: string;
  choices?: RealityChoice[];  // 只有最后一个段落可能有
  chosenId?: string;          // 用户选择的选项ID
}

interface RealityChoice {
  id: string;
  label: string;
}
```

---

### 3.2 通讯录模块

#### 3.2.1 通讯录列表页
- 按字母索引排序的联系人列表
- 顶部：新建联系人 / 导入卡片
- 每项显示：头像、名称
- 点击进入联系人详情

#### 3.2.2 联系人详情页（人物卡片）
- 头像、名称、签名/简介
- AI人设描述
- 操作按钮：发消息、编辑、删除
- 关系设置（可选）

#### 3.2.3 人物卡片数据结构
```typescript
interface CharacterCard {
  id: string;
  name: string;
  avatar: string;
  bio: string;           // 签名/简介
  persona: string;       // AI人设（系统提示词）
  createdAt: number;
  updatedAt: number;
}
```

---

### 3.3 发现模块

#### 3.3.1 发现页入口
- 朋友圈入口
- 世界书入口

#### 3.3.2 朋友圈
**动态列表：**
- 显示用户和AI角色发布的动态
- 每条动态：头像、名称、内容、图片（可选）、时间
- 支持点赞、评论

**发布动态：**
- 文字内容（必填）
- 图片（可选，最多9张）

**评论功能：**
- 查看评论列表
- 发表评论
- @提及功能

#### 3.3.3 世界书
**世界书列表：**
- 显示所有世界观设定条目
- 支持分类筛选
- 新建/编辑/删除条目

**世界书条目结构：**
```typescript
interface LoreBookEntry {
  id: string;
  name: string;
  content: string;
  category: string;
  priority: number;
  enabled: boolean;
}
```

---

### 3.4 我（个人中心）

#### 3.4.1 个人信息
- 头像、昵称、签名
- 点击可编辑

#### 3.4.2 钱包
- 余额显示
- 收支记录（红包收发记录）

#### 3.4.3 设置
- **API设置**
  - API端点URL
  - API密钥
  - 模型选择
  - 测试连接按钮
  
- **通用设置**
  - 深色模式开关
  - 字体大小
  - 消息通知

- **数据管理**
  - 导出数据
  - 导入数据
  - 清空数据

---

## 4. 技术栈

### 4.1 前端框架
- **React 18** - 核心框架
- **TypeScript** - 类型安全
- **React Router** - 路由管理
- **Zustand** - 轻量状态管理

### 4.2 UI/样式
- **TailwindCSS** - 样式框架
- **Lucide React** - 图标库
- **Framer Motion** - 动画（可选）

### 4.3 数据存储
- **Dexie.js** - IndexedDB封装，本地数据持久化

### 4.4 构建工具
- **Vite** - 开发和构建

---

## 5. 数据库设计

### 5.1 IndexedDB Tables

```typescript
// 聊天会话
interface Chat {
  id: string;
  characterId: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
  pinned: boolean;
  muted: boolean;
}

// 聊天消息
interface Message {
  id: string;
  chatId: string;
  sender: 'user' | 'ai' | 'system';
  type: 'text' | 'image' | 'voice' | 'redpacket' | 'location' | 'link' | 'system' | 'reality';
  content: string;
  metadata?: object;
  recalled: boolean;
  timestamp: number;
}

// 人物卡片
interface Character {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  persona: string;
  createdAt: number;
}

// 朋友圈动态
interface Moment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  images: string[];
  likes: string[];
  comments: Comment[];
  timestamp: number;
}

// 世界书条目
interface LoreBook {
  id: string;
  name: string;
  content: string;
  category: string;
  priority: number;
  enabled: boolean;
}

// 现实卡片
interface Reality {
  id: string;
  chatId: string;
  status: 'pending' | 'active' | 'ended';
  title: string;
  paragraphs: Paragraph[];
  createdAt: number;
}

// 用户设置
interface Settings {
  id: string;
  provider: 'openai' | 'gemini' | 'deepseek' | 'moonshot' | 'custom';
  apiEndpoint: string;
  apiKey: string;
  model: string;
  darkMode: boolean;
  fontSize: number;
  notifications: boolean;
}

// 用户资料
interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  balance: number;
}
```

---

## 6. 页面路由

```
/                     → 重定向到 /chat
/chat                 → 聊天列表
/chat/:id             → 聊天详情
/chat/:id/reality/:rid → 现实卡片详情
/contacts             → 通讯录列表
/contacts/:id         → 联系人详情
/contacts/new         → 新建联系人
/discover             → 发现页
/discover/moments     → 朋友圈
/discover/lorebook    → 世界书
/me                   → 个人中心
/me/profile           → 编辑个人资料
/me/wallet            → 钱包
/me/settings          → 设置
/me/settings/api      → API设置
```

---

## 7. AI集成

### 7.0 支持的API提供商

| 提供商 | 端点 | 支持的模型 |
|--------|------|-----------|
| **OpenAI (ChatGPT)** | https://api.openai.com/v1 | gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo |
| **Google Gemini** | https://generativelanguage.googleapis.com/v1beta | gemini-1.5-pro, gemini-1.5-flash, gemini-2.0-flash-exp |
| **DeepSeek** | https://api.deepseek.com/v1 | deepseek-chat, deepseek-reasoner |
| **Moonshot (月之暗面)** | https://api.moonshot.cn/v1 | moonshot-v1-8k, moonshot-v1-32k, moonshot-v1-128k |
| **自定义** | 用户自定义 | 用户自定义（支持OpenAI兼容API） |

### 7.1 基础提示结构
```
[系统提示]
你是{characterName}，{persona}

[世界书内容]
{适用的世界书条目}

[对话历史]
{最近N条消息}

[用户消息]
{当前用户输入}
```

### 7.2 消息类型响应格式
AI返回JSON格式，支持多种消息类型：
```json
{
  "type": "text",
  "content": "消息内容"
}
```

```json
{
  "type": "reality",
  "title": "现实标题",
  "paragraph": "第一段内容",
  "choices": [
    {"id": "1", "label": "选项1"},
    {"id": "2", "label": "选项2"}
  ]
}
```

---

## 8. 项目结构

```
src/
├── components/          # 通用组件
│   ├── ui/             # 基础UI组件
│   ├── chat/           # 聊天相关组件
│   ├── contacts/       # 通讯录相关组件
│   └── common/         # 公共组件
├── pages/              # 页面组件
│   ├── Chat/
│   ├── Contacts/
│   ├── Discover/
│   └── Me/
├── stores/             # Zustand状态管理
├── services/           # API和数据库服务
│   ├── ai.ts           # AI调用服务
│   └── db.ts           # Dexie数据库
├── hooks/              # 自定义Hooks
├── types/              # TypeScript类型定义
├── utils/              # 工具函数
└── App.tsx             # 应用入口
```

---

*版本：1.0*  
*日期：2026-01-05*
