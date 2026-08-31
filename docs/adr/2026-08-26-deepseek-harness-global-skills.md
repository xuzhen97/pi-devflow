# 通过 DSH 用户目录提供全局 Skill

- Status: Accepted
- Date: 2026-08-26

## Context

`pi-devflow` 现有 `skills/` 目录是 Pi 工作流的唯一 Skill 源。DeepSeek Harness 的本地 Skill Provider 会扫描用户级 `${DSH_HOME}/skills/`（默认 `~/.dsh/skills/`），但 DSH Bundle 本身按 Profile 组合加载，不能直接保证 Skill 对所有 Profile 和项目全局可见。

因此需要在不维护第二份 Skill 内容、不修改 DSH 本体的前提下，提供可通过 `dsh plugin` 安装的分发方式，并把 Skill 安装到 DSH 的用户级目录。

## Decision

将 `skills/` 作为 Pi 与 DeepSeek Harness 共用的唯一源目录。发布包同时声明 DSH Bundle，并提供一个 Node.js 原生同步器：

- 通过 `dsh plugin --profile global add pi-devflow` 安装包；
- 在安装生命周期或 DSH Plugin 运行时，将包内 `skills/` 同步到 `${DSH_HOME}/skills/`；
- 使用包管理清单跟踪由 `pi-devflow` 管理的 Skill；
- 只更新清单中已管理的目录；同名但未被本包管理的用户目录不得覆盖；
- 通过原子替换写入清单，并在冲突、损坏或 I/O 失败时显式失败；
- DSH Bundle 仅负责安装入口和运行时兜底，不替换 DSH 内置的本地 Skill Provider；
- 不将 Pi 的 `ExtensionAPI` 命令或 UI 直接伪装成 DSH 能力。

## Consequences

- 安装后的 Skill 对使用同一 `DSH_HOME` 的所有 DSH Profile 和项目可发现。
- Pi 和 DSH 共享同一份 Skill 内容，避免双份文档漂移。
- 安装和升级会写入用户目录，并要求用户信任该包的安装代码。
- 清单和冲突保护降低了覆盖用户 Skill 或误删用户文件的风险，但用户可能需要在清单损坏或命名冲突时人工处理。
- DSH developer preview 的 Bundle API 变化可能要求后续调整适配层；Skill 文件格式仍由 DSH 本地 Provider 负责解析。
- Pi 专用扩展继续只在 Pi 中生效，不提供跨宿主的 `/devflow` 命令。

## Alternatives considered

- 仅要求用户手动复制到 `~/.dsh/skills/`：实现最简单，但不能通过 DSH 一键安装或可靠升级。
- 仅注册 DSH Runtime Plugin：作用范围依赖具体 Profile，不能保证所有 Profile 和项目获得全局 Skill。
- 为 DSH 维护一份独立 Skill 目录：可以规避安装时同步，但会造成 Pi 与 DSH 内容漂移。
- 实现新的 DSH Skill Provider：超出需求，重复了 DSH 已有的本地文件系统 Provider。
