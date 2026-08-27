---
name: code-flow-visualizer
description: Analyze a codebase execution flow and generate an interactive HTML flow map. Use GitNexus or available code-intelligence tools to discover real symbols, callers, callees, files, and line numbers. Produce a simplified human-readable flow instead of dumping the full dependency graph. Every code node should preserve source metadata and support jumping to the corresponding file and line in VS Code.
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
Generate Interactive HTML
      ↓
Validate Source Links
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

生成的 HTML 至少应包含：

### Flow Canvas

展示：

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

### Node click

单击节点：

显示：

- Symbol
- Type
- File
- Start line
- Description
- Callers
- Callees

### Open Code

提供：

```text
Open in VS Code
```

### Expand

对于被语义压缩的节点：

```text
展开内部调用
```

### Filtering

如果流程复杂，可以过滤：

- Business
- Infrastructure
- Async
- Database
- External

---

# Recommended visual style

代码流程图应该优先保证可读性，而不是视觉效果。

推荐：

- 浅色或深色 IDE 风格
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

默认输出：

```text
1. 流程摘要
2. 关键执行路径
3. 交互 HTML
4. 关键 Symbol 列表
5. 未确认或值得继续调查的分支
```

当用户明确要求 HTML 时：

生成一个独立可打开的：

```text
code-flow.html
```

HTML 应尽量自包含。

除非必要，不依赖后端服务。

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
- [ ] HTML 节点可以查看源码位置
- [ ] VS Code 链接使用真实路径和行号
- [ ] 用户可以快速理解整个执行流程
