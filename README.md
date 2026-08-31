# Pi DevFlow

面向 [Pi](https://pi.dev) 的开发工作流包，将需求澄清、临时规格、实施计划、条件式 TDD、系统调试、代码审查和代码流可视化组合成一套可按需加载的 Skills。

## 能力

- 先澄清并确认设计，再单独确认是否生成 Spec、ADR 和 Plan
- 执行前展示当前计划范围并再次获得明确确认，避免直接修改代码
- Spec 和 Plan 只作为临时工作材料，不污染长期文档
- 仅在用户确认后把长期架构决策保留为 ADR
- 按任务行为与回归风险决定是否使用 TDD
- 调试时先复现和定位根因，再实施修复
- 支持已提交范围和未提交工作区的只读代码审查
- 基于真实调用关系生成可追溯到源码的交互流程图

## 安装

### GitHub

```bash
pi install git:github.com/xuzhen97/pi-devflow
```

锁定版本：

```bash
pi install git:github.com/xuzhen97/pi-devflow@v0.1.0
```

仅在当前项目启用：

```bash
pi install git:github.com/xuzhen97/pi-devflow -l
```

### 本地仓库

```bash
pi install ./pi-devflow
```

也可以使用绝对路径：

```bash
pi install /absolute/path/to/pi-devflow
```

> Pi 扩展拥有当前用户的系统权限。安装第三方 Pi Package 前应先审查源码。

## DeepSeek Harness

`pi-devflow` 也可以作为 DeepSeek Harness 的全局 Skill 包安装：

```bash
dsh plugin --profile global add pi-devflow
```

安装完成或首次启动已安装该 Bundle 的 DSH Profile 后，Skill 会同步到：

```text
${DSH_HOME:-~/.dsh}/skills/
```

`global` 是用于安装用户级 Skill 的 DSH Profile 名称；Skill 的全局可见性来自 `DSH_HOME/skills/`，不是某个 Profile 的运行时范围。所有使用同一 `DSH_HOME` 的 DSH Profile 和项目都会通过内置 filesystem Skill Provider 发现这些 Skill。

- 未设置 `DSH_HOME` 时，目标目录默认为 `~/.dsh/skills/`。
- 再次运行同一条命令可以升级已安装的 Skill；如果包管理器跳过安装脚本，下一次 DSH 启动会自动补做同步。
- 安装包会执行受信任的同步脚本；安装前请审查包源码和权限。
- Pi 与 DSH 共用仓库中的同一份 `skills/` 源文件，不需要手动复制第二份。
- `extensions/index.ts` 和 `/devflow` 是 Pi 专用能力，不会在 DSH 中注册同名命令。

## Skills

Pi 会根据描述自动加载匹配的 Skill，也可以手动调用：

| Skill | 手动调用 | 用途 |
| --- | --- | --- |
| Brainstorming | `/skill:brainstorming` | 澄清并确认设计；分别询问是否生成 Spec、ADR 和 Plan，不修改实现代码 |
| Writing Plans | `/skill:writing-plans` | 经确认后生成临时 Plan并逐任务选择测试策略；完成后停止并询问是否执行 |
| Executing Plans | `/skill:executing-plans` | 先只读审查 Plan 和当前仓库，再经最终确认逐项实现和验证 |
| Test-Driven Development | `/skill:test-driven-development` | 为具有真实行为回归风险的任务执行 Red-Green-Refactor |
| Systematic Debugging | `/skill:systematic-debugging` | 复现故障、追踪根因、验证单一假设并实施回归修复 |
| Code Reviewer | `/skill:code-reviewer` | 对 commit 范围或 staged、unstaged、untracked 工作区执行只读审查 |
| Code Flow Visualizer | `/skill:code-flow-visualizer` | 分析真实调用链并生成可跳转源码的交互 HTML 流程图 |

修改 Skill 后，可在 Pi 中执行 `/reload` 重新发现资源。

扩展还提供状态检查命令：

```text
/devflow
```

## 技能关系

```mermaid
flowchart TD
    Request["需求或功能想法"] --> Brainstorming["brainstorming<br/>只读探索与设计"]
    Brainstorming --> DesignGate{"用户批准设计？"}
    DesignGate -- "修改" --> Brainstorming
    DesignGate -- "批准" --> SpecGate{"用户确认生成 Spec？"}
    SpecGate -- "生成" --> Spec["临时 Spec<br/>.tmp/specs/"]
    Spec --> SpecReview{"用户批准 Spec 内容？"}
    SpecReview -- "修改" --> Spec
    SpecReview -- "批准" --> ADRCheck{"存在长期架构决策？"}
    SpecGate -- "跳过" --> ADRCheck

    ADRCheck -- "有" --> ADRGate{"用户确认写 ADR？"}
    ADRGate -- "写入" --> ADR["永久 ADR<br/>docs/adr/"]
    ADRGate -- "跳过" --> NextAction{"多步骤工作需要 Plan？"}
    ADRCheck -- "无" --> NextAction
    ADR --> NextAction

    NextAction -- "需要" --> PlanGate{"用户确认生成 Plan？"}
    NextAction -- "Bounded" --> BoundedGate{"用户确认执行已批准设计？"}
    BoundedGate -- "执行" --> Task
    BoundedGate -- "暂不" --> Stop

    PlanGate -- "生成" --> Planning["writing-plans<br/>只写临时计划"]
    PlanGate -- "暂不" --> Stop["停止，等待用户"]
    Planning --> Plan["临时 Plan<br/>.tmp/plans/"]
    Plan --> HandoffGate{"用户确认交给执行流程？"}
    HandoffGate -- "暂不" --> Stop
    HandoffGate -- "确认" --> ReadOnlyReview["executing-plans<br/>只读审查当前范围与风险"]
    ReadOnlyReview --> ExecuteGate{"用户最终确认执行？"}
    ExecuteGate -- "暂不" --> Stop
    ExecuteGate -- "执行" --> Task["逐项修改与验证"]

    Task --> TDDGate{"当前任务适合 TDD？"}
    TDDGate -- "是" --> TDD["test-driven-development<br/>Red → Green → Refactor"]
    TDDGate -- "否" --> Verify["针对性验证<br/>类型、Schema、构建或引用检查"]
    TDD --> Verify
    Verify --> Review["code-reviewer<br/>只读审查"]
    Review --> Result["代码 + 测试 + 经确认的 ADR"]

    Failure["Bug、失败测试或异常行为"] --> Debug["systematic-debugging<br/>复现 → 根因 → 单一假设"]
    Debug --> RegressionGate{"存在可自动验证的行为？"}
    RegressionGate -- "是" --> TDD
    RegressionGate -- "否" --> Verify

    Flow["code-flow-visualizer<br/>可选代码理解工具"] -. "提供现有调用链" .-> Brainstorming
    Flow -. "辅助根因追踪" .-> Debug
    Flow -. "辅助确认影响范围" .-> Review
```

关系说明：

- `brainstorming` 只负责探索与设计；设计批准、生成 Spec、写 ADR、生成 Plan 是互不继承的独立确认。
- `writing-plans` 只能创建临时 Plan。完成后必须停止、总结范围并询问是否交给执行流程。
- `executing-plans` 先做只读时效性审查，再展示任务、风险和工作区状态；用户最终确认前不得修改任何文件。
- “请实现”“继续”或前一阶段的批准不能提前授权后续动作；每个确认只对当前明确询问的动作有效。
- 执行中出现实质性设计或范围变化时，原执行授权失效，必须回到相应确认门。
- `test-driven-development` 是逐任务选择的执行策略，不是所有任务的强制步骤。
- `systematic-debugging` 是故障入口；确认根因后，有可测试行为时进入 TDD，否则使用合适的非测试验证。
- `code-reviewer` 是实现后的质量门槛，不负责修改代码。
- `code-flow-visualizer` 是可选的代码理解工具，可辅助设计、调试和审查，不阻塞主流程。

## 文档生命周期

```text
.tmp/specs/   临时规格
.tmp/plans/   临时实施计划
docs/adr/     永久架构决策记录
```

规则：

- `.tmp/` 已被 Git 忽略，不进入 npm 发布包。
- Spec 和 Plan 是执行期间的工作记忆，完成后可以删除。
- 代码和测试是实现行为的事实来源。
- ADR 只保留长期约束系统边界、公共接口、数据、安全、基础依赖或部署方式的决策。
- ADR 记录背景、决策、后果和主要替代方案，不复制 Spec 或 Plan。

当前 ADR：

- [`2026-08-26-temporary-specs-and-plans.md`](docs/adr/2026-08-26-temporary-specs-and-plans.md)
- [`2026-08-26-conditional-tdd-by-task.md`](docs/adr/2026-08-26-conditional-tdd-by-task.md)

## 条件式 TDD

`writing-plans` 必须为每个任务声明测试策略：

```markdown
**Test strategy:** TDD: Required
**Reason:** 该任务修改了解析分支，错误实现会产生可观察的错误结果。
```

或者：

```markdown
**Test strategy:** TDD: Not applicable
**Reason:** 该任务只修改人工阅读的文档，不存在有意义的 Red/Green 行为周期。
```

通常需要 TDD：

- 业务规则、分支、解析和状态转换
- API、持久化、安全、并发和资金逻辑
- Bug 修复及具有行为回归风险的重构

通常不强制 TDD：

- 人工阅读的文档和 ADR 文案
- 不包含自定义运行逻辑的声明式元数据
- 生成文件、格式化和精确机械修改

不使用 TDD 仍必须提供适合的验证，例如类型检查、Schema 校验、构建、Lint、引用搜索或权威生成器检查。

## 项目结构

```text
pi-devflow/
├── docs/
│   └── adr/                       # 永久架构决策
├── extensions/
│   └── index.ts                   # /devflow 状态命令
├── skills/
│   ├── brainstorming/
│   ├── code-flow-visualizer/
│   ├── code-reviewer/
│   ├── executing-plans/
│   ├── systematic-debugging/
│   ├── test-driven-development/
│   └── writing-plans/
├── package.json
├── README.md
└── tsconfig.json
```

`package.json` 显式声明 Pi 资源：

```json
{
  "pi": {
    "extensions": ["./extensions/index.ts"],
    "skills": ["./skills"]
  }
}
```

## 本地开发

```bash
git clone https://github.com/xuzhen97/pi-devflow.git
cd pi-devflow
npm install
npm run check
pi -e ./extensions/index.ts
```

发布前检查：

```bash
npm run check
npm pack --dry-run
```

## 更新与卸载

```bash
pi update git:github.com/xuzhen97/pi-devflow
pi remove git:github.com/xuzhen97/pi-devflow
```

项目级安装在命令末尾添加 `-l`。

## License

[MIT](./LICENSE)
