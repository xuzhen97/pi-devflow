# Pi DevFlow

一个面向 [Pi](https://pi.dev) 的轻量、可扩展开发工作流包。仓库当前提供最小可运行骨架，后续可逐步加入扩展、Skills、提示模板和主题，并通过 `pi install` 一键安装。

> 当前阶段：项目初始化。安装后会注册 `/devflow` 命令和 `/skill:devflow` Skill，用于确认扩展与 Skill 已正确加载。

## 特性

- 遵循 Pi Package 的 `package.json#pi` 清单规范
- TypeScript 扩展入口，无需预编译即可由 Pi 加载
- 符合 Agent Skills 标准的 Skill 骨架
- 支持 Git、本地路径以及后续 npm 发布安装
- 已配置严格 TypeScript 类型检查
- 为后续拆分命令、工具、事件与 UI 模块保留清晰入口

## 环境要求

- Node.js 20 或更高版本
- Pi `@earendil-works/pi-coding-agent`

## 安装

### 从 GitHub 安装

仓库发布后可直接执行：

```bash
pi install git:github.com/xuzhen97/pi-devflow
```

也可以锁定到某个 tag 或 commit：

```bash
pi install git:github.com/xuzhen97/pi-devflow@v0.1.0
```

全局安装会写入 Pi 的用户设置。若只希望在当前项目中启用，请添加 `-l`：

```bash
pi install git:github.com/xuzhen97/pi-devflow -l
```

### 从本地仓库安装

在本仓库的父目录中执行：

```bash
pi install ./pi-devflow
```

或在任意位置使用绝对路径：

```bash
pi install /absolute/path/to/pi-devflow
```

### 临时试用

无需写入 Pi 设置：

```bash
pi -e ./extensions/index.ts
```

也可以直接临时加载整个 Git 包：

```bash
pi -e git:github.com/xuzhen97/pi-devflow
```

> Pi 扩展拥有当前用户的完整系统权限。安装任何第三方 Pi Package 前，请先审查其源码。

## 使用

启动 Pi：

```bash
pi
```

在交互界面中执行：

```text
/devflow
```

看到 `Pi DevFlow is installed and ready.` 即表示扩展加载成功。

Skill 当前配置为仅手动调用，避免尚未完成的占位工作流被模型自动加载：

```text
/skill:devflow
```

后续 Skill 内容稳定后，可以删除 `skills/devflow/SKILL.md` frontmatter 中的 `disable-model-invocation: true`，允许 Pi 根据描述自动选择该 Skill。

如果开发过程中修改了扩展或 Skill，可在 Pi 中执行 `/reload` 热重载自动发现的资源。

## 本地开发

```bash
git clone https://github.com/xuzhen97/pi-devflow.git
cd pi-devflow
npm install
npm run check
pi -e ./extensions/index.ts
```

常用命令：

| 命令 | 说明 |
| --- | --- |
| `npm install` | 安装开发依赖 |
| `npm run check` | 执行 TypeScript 类型检查 |
| `pi -e ./extensions/index.ts` | 临时加载扩展进行调试 |
| `/skill:devflow` | 手动加载 DevFlow Skill |
| `/reload` | 在 Pi 中重载扩展与其他资源 |

## 项目结构

```text
pi-devflow/
├── extensions/
│   └── index.ts       # Pi 扩展入口
├── skills/
│   └── devflow/
│       ├── SKILL.md   # Skill 入口与工作流说明
│       ├── assets/    # 模板和静态资源（预留）
│       ├── references/# 详细参考资料（预留）
│       └── scripts/   # 可执行辅助脚本（预留）
├── LICENSE
├── package.json       # npm 元数据与 Pi Package 清单
├── README.md
└── tsconfig.json
```

当前显式声明的 Pi 清单：

```json
{
  "pi": {
    "extensions": ["./extensions/index.ts"],
    "skills": ["./skills"]
  }
}
```

后续还可以增加以下资源：

```text
pi-devflow/
├── prompts/           # 可复用 Markdown 提示模板
└── themes/            # Pi 主题 JSON
```

并在 `package.json#pi` 中声明对应路径。Pi 也支持按约定自动发现资源目录，但显式清单更方便维护和审查。

### Skill 骨架

每个 Skill 使用独立目录，并以 `SKILL.md` 作为必需入口：

```text
skills/<skill-name>/
├── SKILL.md
├── scripts/
├── references/
└── assets/
```

`SKILL.md` 必须包含合法的 `name` 和明确的 `description`。其中 `description` 会影响 Pi 判断何时加载 Skill；辅助文件应使用相对于 Skill 目录的路径。当前 `.gitkeep` 文件用于让 Git 保留三个空目录。

## 迭代建议

为避免入口文件持续膨胀，新增能力时建议按职责拆分，例如：

```text
extensions/
├── index.ts
├── commands/
├── tools/
├── events/
└── shared/
```

建议遵循以下原则：

1. `extensions/index.ts` 只负责组装和注册能力。
2. 运行时第三方依赖放入 `dependencies`，不要放在 `devDependencies`。
3. Pi 提供的核心包放入 `peerDependencies`，并使用 `"*"` 范围。
4. 长生命周期资源应在 `session_start` 后创建，并在 `session_shutdown` 中清理。
5. 自定义工具输出必须限制大小，避免占满模型上下文。
6. 新功能至少通过 `npm run check`，并用 `pi -e` 做一次加载验证。

## 发布

### Git 分发

创建版本 tag 后，用户可锁定安装：

```bash
git tag v0.1.0
git push origin v0.1.0
pi install git:github.com/xuzhen97/pi-devflow@v0.1.0
```

### npm 分发

发布前请确认包名可用，并检查将要发布的内容：

```bash
npm pack --dry-run
npm publish
```

`pi-package` 关键字用于 Pi Package 的发现与展示。

## 卸载与更新

```bash
pi update git:github.com/xuzhen97/pi-devflow
pi remove git:github.com/xuzhen97/pi-devflow
```

卸载项目级安装时，在 `pi remove` 命令末尾添加 `-l`。

## License

[MIT](./LICENSE)
