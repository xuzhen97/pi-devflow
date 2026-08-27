---
name: code-flow-visualizer
description: Analyze a codebase execution flow and generate an interactive HTML flow map. Use GitNexus or available code-intelligence tools to discover real symbols, callers, callees, files, and line numbers. Present the exact HTML output path for confirmation, then write the file immediately when confirmed. Produce a simplified human-readable flow instead of dumping the full dependency graph. Every code node should preserve source metadata and support jumping to the corresponding file and line in VS Code.
---

# Code Flow Visualizer

## Purpose

将复杂代码仓库中的真实执行路径转换为：

1. 人类容易理解的执行流程
2. 可交互的 HTML 流程图
3. 可追溯到真实源代码的节点
4. 可直接跳转 VS Code 的代码导航界面

核心原则：

> 先建立事实，再进行解释，最后进行可视化。

不要让 LLM 根据代码名称猜测执行流程。

---

# When to use

当用户提出以下类型的问题时使用本 Skill：

- 分析某个功能的代码执行流程
- 这个 API 请求经过了哪些代码
- 某个按钮点击后发生了什么
- 某个任务是如何执行的
- 某个设备命令经过哪些模块
- 某个函数最终调用到哪里
- 某个事件由谁触发、谁处理
- 某个数据如何从入口流到数据库
- 某个业务功能涉及哪些核心类和函数
- 为代码生成流程图
- 生成可以点击查看源码的代码地图

典型输入：

> 分析设备升级完整执行流程

> 登录接口从 HTTP 请求到数据库经历了什么？

> 分析 executeTask() 的调用链，并生成 HTML。

---

# Core Workflow

严格按照以下顺序执行：

```text
Understand Request
      ↓
Locate Entry Point
      ↓
Query Code Intelligence
      ↓
Trace Real Call Chain
      ↓
Collect Symbol Metadata
      ↓
Verify Important Links
      ↓
Simplify into Semantic Flow
      ↓
Generate Flow Model
      ↓
Report Flow Scope + Exact HTML Path
      ↓
Request HTML Write Confirmation
      ↓ confirmed
Write Interactive HTML
      ↓
Validate HTML + Source Links
```

---

# Step 1 — Understand the requested flow

首先识别用户真正想看的是什么。

确定：

- 功能名称
- 入口
- 终点
- 关注范围
- 是否跨模块
- 是否包含外部服务
- 是否包含数据库
- 是否包含异步事件

不要一开始扫描整个仓库。

优先寻找一个明确入口，例如：

- HTTP Route
- Controller
- CLI Command
- UI Event
- Message Handler
- Scheduled Task
- Worker
- Public Function
- Event Listener

---

# Step 2 — Locate entry points

优先使用 GitNexus 或其他代码索引工具定位相关 Symbol。

搜索：

- Function
- Method
- Class
- Route
- Handler
- Event
- Command

如果存在多个可能入口：

先根据：

1. 文件位置
2. callers
3. callees
4. route
5. import relationship
6. surrounding symbols

判断哪个最符合用户描述。

不要仅凭函数名字判断。

---

# Step 3 — Trace real execution paths

优先使用代码图能力，例如：

- query
- context
- trace
- callers
- callees
- references
- dependencies
- process

建立真实调用关系。

例如：

```text
HTTP Route
   ↓
Controller
   ↓
Service
   ↓
Domain Logic
   ↓
Repository
   ↓
Database
```

但是实际代码可能是：

```text
POST /device/update
      ↓
updateDevice()
      ↓
createUpgradeTask()
      ↓
taskQueue.push()
      ↓
UpgradeWorker.handle()
      ↓
upgradeService.execute()
      ↓
client.sendCommand()
```

必须以代码关系为事实来源。

---

# Step 4 — Preserve source metadata

每个重要节点必须尽可能保存：

```json
{
  "uid": "...",
  "name": "executeUpgrade",
  "qualifiedName": "UpgradeService.executeUpgrade",
  "kind": "method",
  "filePath": "src/services/UpgradeService.ts",
  "startLine": 128,
  "endLine": 182
}
```

最低要求：

```text
name
filePath
startLine
```

优先保留 GitNexus UID。

UID 可以用于后续：

- context 查询
- trace 查询
- impact analysis
- disambiguation
- agent follow-up

---

# Step 5 — Verify important transitions

不要因为：

```text
A imports B
```

就认为：

```text
A → B
```

是实际执行关系。

区分：

- CALLS
- IMPORTS
- REFERENCES
- IMPLEMENTS
- EXTENDS
- READS
- WRITES
- EMITS
- LISTENS
- ROUTES_TO

流程图优先展示真实执行关系。

重要边必须至少有代码图或源码依据。

---

# Step 6 — Semantic compression

不要把所有函数都画出来。

目标不是：

> 展示完整 Call Graph

目标是：

> 让开发者快速理解这段业务是怎么跑的。

例如原始调用：

```text
route()
 ↓
middleware()
 ↓
parseBody()
 ↓
validateSchema()
 ↓
controller()
 ↓
normalizeParams()
 ↓
service()
 ↓
getConfig()
 ↓
checkStatus()
 ↓
repository()
 ↓
db.execute()
```

可以压缩成：

```text
HTTP Route
 ↓
参数校验
 ↓
DeviceController
 ↓
UpgradeService
 ↓
状态检查
 ↓
TaskRepository
 ↓
Database
```

但被省略的函数仍然可以保存在节点详情中。

---

# Recommended abstraction levels

优先区分以下节点：

## Entry

例如：

- HTTP API
- UI Action
- CLI
- Event
- Scheduler

## Orchestration

例如：

- Controller
- Handler
- Application Service

## Business Logic

例如：

- Service
- Domain Service
- Use Case

## Infrastructure

例如：

- Repository
- Queue
- RPC
- WebSocket
- Client

## External

例如：

- Database
- Redis
- Kafka
- Third-party API
- Device

---

# Step 7 — Build Flow Model

先生成结构化数据，再生成 HTML。

不要让 HTML 本身成为唯一结果。

推荐内部模型：

```json
{
  "title": "设备升级执行流程",
  "entry": "POST /devices/:id/upgrade",

  "nodes": [
    {
      "id": "n1",
      "uid": "gitnexus-symbol-id",
      "type": "entry",
      "label": "Upgrade API",
      "symbol": "upgradeDevice",
      "filePath": "src/routes/device.ts",
      "startLine": 42,
      "endLine": 58,
      "description": "接收设备升级请求"
    }
  ],

  "edges": [
    {
      "source": "n1",
      "target": "n2",
      "type": "call",
      "label": "调用"
    }
  ]
}
```

Flow Model 是事实层。

HTML 是展示层。

---

# Mandatory HTML delivery gate

本 Skill 的最终产物必须包含一个真实写入磁盘、可独立打开的 `.html` 文件；不能只在聊天中输出流程摘要、Mermaid 代码块或 HTML 片段。

完成事实核验和 Flow Model 后、写文件前，必须向用户报告：

- 流程标题、入口、终点和核心节点数量
- 已确认的主路径与仍不确定的分支
- 将要写入的**准确 HTML 路径**

默认输出路径：

```text
<PROJECT_ROOT>/.tmp/code-flow-<topic>.html
```

用户指定路径时使用用户路径。`<topic>` 使用简短、安全的文件名；不要覆盖已有文件，除非用户明确同意。

然后用一个封闭问题确认：

```text
流程事实已核验，准备写入 <exact-path>。是否生成交互式 HTML？（生成 / 暂不）
```

此确认只控制 HTML 写入：

- 在用户确认前保持只读，不创建目录、不写临时 HTML。
- `生成`、`确认`、`是`、`可以` 等直接肯定答复都视为授权。
- 用户一旦确认，立即创建所需目录并写出 HTML；**不要再为同一个 HTML 重复询问确认，也不要另行要求 Spec、Plan 或实现确认**。
- 用户拒绝或答复不明确时不写文件；不明确时只重新询问这个问题。
- 若确认后输出路径或流程范围发生实质变化，先说明变化并重新确认。

---

# Step 8 — VS Code source navigation

生成 HTML 时，代码节点必须支持打开 VS Code。

URL 格式：

```text
vscode://file/{absolutePath}:{line}:{column}
```

例如：

```text
vscode://file/D:/Projects/VCPDeck/src/device/upgrade.ts:128:1
```

不要把绝对项目目录硬编码到 Skill。

运行时确定：

```text
PROJECT_ROOT
```

然后：

```javascript
function openInVSCode(filePath, line = 1, column = 1) {
    const root = PROJECT_ROOT.replace(/\\/g, "/");
    const file = filePath.replace(/\\/g, "/");

    window.location.href =
        `vscode://file/${root}/${file}:${line}:${column}`;
}
```

---

# Path handling

必须考虑：

## Windows

```text
D:\Projects\App
```

转换：

```text
D:/Projects/App
```

## Linux

```text
/home/user/project
```

保持：

```text
/home/user/project
```

## WSL / Remote

如果检测到：

- WSL
- Dev Container
- SSH Remote

不要假设本地 `vscode://file` 一定正确。

在 HTML 中仍展示：

```text
filePath:line
```

并将 VS Code 跳转能力标记为环境相关。

---

# Step 9 — HTML interaction

交互行为参考以下文件（只参考交互与布局，不复制其业务内容，也不形成运行时依赖）：

```text
file:///D:/OptiMinderHub/OptiMinder/.tmp/sl2000-3%E5%B9%B4%E5%AE%B9%E9%87%8F%E6%B5%8B%E7%AE%97%E4%B8%8E%E5%A4%9A%E5%AE%9E%E4%BE%8B%E9%83%A8%E7%BD%B2%E6%96%B9%E6%A1%88.html
```

参考文件不可访问时，仍必须实现下面的交互契约。

## Flow Canvas

主视图使用横向或从上到下的 DAG，展示：

```text
Entry
 ↓
Controller
 ↓
Service
 ↓
Repository
 ↓
External System
```

## Full-screen zoom and pan

流程图必须提供明显的“全屏查看”入口，并实现与参考文件一致的核心体验：

- 全屏遮罩查看流程图
- 鼠标滚轮以指针位置为中心缩放
- 按住鼠标拖拽平移
- `放大`、`缩小`、`适应窗口`、`1:1` 按钮
- `Esc`、关闭按钮或点击遮罩关闭
- 缩放范围必须有限制，避免图形消失或无限放大
- 打开时自动适应窗口；窗口尺寸变化后仍可重新适应

单击代码节点与打开全屏不得冲突：节点点击应停止事件冒泡并打开详情；点击画布空白处或专用按钮进入全屏。

## Node details

单击节点显示：

- Symbol、Type
- File、Start line、End line
- Description
- Callers、Callees
- Confidence
- 被语义压缩的内部调用（如有）

详情面板必须提供 `Open in VS Code`。文件路径本身也要显示，确保协议跳转不可用时仍可手动定位。

## Expand and filtering

存在压缩节点时提供“展开内部调用”。仅当流程复杂时提供以下过滤，简单流程不要增加无效控件：

- Business
- Infrastructure
- Async
- Database
- External

隐藏节点时必须同时正确处理相关边，不能留下悬空连线。

## Implementation constraints

- HTML 优先使用内联 CSS、JavaScript 和 SVG，保持单文件可打开。
- 除非确有必要，不依赖后端服务或新增前端依赖。
- 所有按钮使用原生 `<button>`，提供可见焦点和准确文本或 `aria-label`。
- HTML 中的数据来自 Flow Model；不要在 DOM 和脚本中维护两份互相漂移的流程事实。

---

# Theme requirements

每个生成的 HTML 必须同时提供亮色和暗色主题：

- 页面工具栏提供明确的主题切换按钮。
- 首次打开使用 `prefers-color-scheme` 跟随系统主题。
- 用户手动选择后保存到 `localStorage`，刷新后保持选择。
- 页面背景、卡片、文字、边框、流程节点、连线、详情面板、全屏遮罩和缩放工具栏必须同步切换。
- 两种主题都要保证文字、连线、焦点和节点类型之间有足够对比度。
- 不允许只切换页面外壳而让流程图固定为另一种主题。

优先通过 CSS custom properties 和根元素的 `data-theme="light|dark"` 实现，避免维护两套页面。

---

# Post-write validation

写出 HTML 后必须实际在浏览器中打开；有 Playwright 或等价浏览器工具时优先自动检查，否则至少进行源码静态检查并明确说明限制。验证：

1. 页面本地打开无阻断性脚本错误，流程节点与连线正常显示。
2. 节点点击显示匹配 Flow Model 的详情，源码路径与行号准确。
3. 全屏打开、滚轮缩放、拖拽、放大/缩小、适应、`1:1` 和 `Esc` 关闭可用。
4. 亮色/暗色切换覆盖整个界面，刷新后保持手动选择；清除保存值后跟随系统主题。
5. 过滤与展开不会产生悬空边或无法恢复的节点。
6. `vscode://file` 链接使用真实绝对路径；无法启动 VS Code 时仍核对链接文本和目标格式。

发现问题应直接修复并重新验证；只有输出路径或流程范围发生实质变化时才需要重新向用户确认。

---

# Recommended visual style

代码流程图应该优先保证可读性，而不是视觉效果。

推荐：

- 默认支持亮色/暗色 IDE 风格切换
- 横向或从上到下 DAG
- 清晰的节点类型
- 不使用大量装饰
- 避免全屏力导向图

不同节点使用轻微视觉差异：

```text
Entry        → API / Event
Controller   → 调度
Service      → 核心逻辑
Repository   → 数据访问
Queue        → 异步
External     → 外部系统
Database     → 数据库
```

---

# Important Rules

## Rule 1

GitNexus / AST / LSP 是事实来源。

LLM 是：

```text
Interpreter
+
Summarizer
+
Visualizer
```

而不是事实来源。

---

## Rule 2

禁止根据函数名称幻想调用关系。

错误：

```text
函数叫 saveUser
所以它应该调用 UserRepository
```

正确：

```text
代码图显示：

saveUser
  CALLS
UserRepository.insert
```

---

## Rule 3

不要默认展示所有调用。

如果一个流程包含 100 个 Symbol：

首先压缩到：

```text
5 ~ 15 个核心节点
```

用户需要时再展开。

---

## Rule 4

保留可追溯性。

每个核心结论都应该可以回到：

```text
Symbol
 ↓
File
 ↓
Line
 ↓
Source Code
```

---

## Rule 5

区分同步与异步。

例如：

```text
Controller
   ↓
createTask()
   ↓
Queue
   ⇢
Worker
   ↓
execute()
```

异步边不要画成普通 CALL。

推荐：

```text
──→ sync call

- - → async/event

══→ data flow
```

---

# Handling uncertainty

当调用关系无法确认时，不要伪造成确定事实。

使用：

```text
Confirmed
Likely
Unknown
```

或者：

```json
{
  "confidence": "confirmed"
}
```

优先只将 Confirmed 关系放入主流程。

---

# Output

每次使用本 Skill 都必须以写出交互式 HTML 为交付目标，无需用户额外说“生成 HTML”。默认交付：

```text
1. 流程摘要
2. 关键执行路径
3. 关键 Symbol 列表
4. 未确认或值得继续调查的分支
5. 待写入的准确 HTML 路径
6. 用户确认后生成的交互 HTML
```

确认后必须生成一个独立可打开、尽量自包含的 `.html` 文件。完成时报告：

- HTML 的准确路径
- 已验证的入口、核心节点数和源码链接数
- 亮色/暗色主题与缩放交互的检查结果
- 仍未确认的分支（没有则明确写“无”）

不要把聊天中的代码块当成交付文件。除非必要，不依赖后端服务。

---

# Example

用户：

> 分析“设备升级”执行流程并生成交互图。

最终图应该类似：

```text
┌──────────────────────┐
│ POST /device/upgrade │
│ routes/device.ts:42  │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ upgradeDevice()      │
│ controller.ts:88     │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ createUpgradeTask()  │
│ taskService.ts:112   │
└──────────┬───────────┘
           ↓ async
┌──────────────────────┐
│ UpgradeWorker        │
│ worker.ts:73         │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ executeUpgrade()     │
│ upgrade.ts:128       │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ client.sendCommand() │
│ client.ts:204        │
└──────────────────────┘
```

每一个代码节点都支持：

```text
点击
 ↓
VS Code
 ↓
对应 file:line
```

---

# Definition of Done

完成任务前检查：

- [ ] 找到了明确入口
- [ ] 核心调用链来自真实代码关系
- [ ] 没有把 import 当作 call
- [ ] 每个核心 Symbol 有 filePath
- [ ] 每个核心 Symbol 有 startLine
- [ ] 尽可能保留 GitNexus UID
- [ ] 复杂调用链已经语义压缩
- [ ] 异步调用被正确表示
- [ ] 写入前已展示准确路径并获得用户确认
- [ ] 确认后已实际写出独立 HTML，而不是只输出代码块
- [ ] HTML 节点可以查看源码位置
- [ ] VS Code 链接使用真实路径和行号
- [ ] 节点详情点击与全屏查看入口没有事件冲突
- [ ] 全屏遮罩支持滚轮缩放、拖拽、适应窗口、1:1 和 Esc 关闭
- [ ] 亮色/暗色主题可切换，首次跟随系统并记忆用户选择
- [ ] 两种主题覆盖流程图、详情面板和缩放遮罩且可读
- [ ] 过滤节点时相关边同步更新
- [ ] 用户可以快速理解整个执行流程
