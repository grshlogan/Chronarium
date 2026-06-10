# Chronarium

Chronarium 是一个本地优先的直播归档与回放平台。它的核心目的不是
“录制一场直播，只有画面和声音”，而是保存一场直播的媒体、事件、状态
和时间关系，使未来能够尽可能完整地回放直播当时发生的一切。

项目名来自 `chronos` 的时间语义和档案空间的感觉。Chronarium 应该像一座
本地时间档案馆：保存事实，重建现场，允许诊断、检索、重渲染和导出。

## 核心产品模型

```text
Live Capture
  -> Fact Timeline
  -> Session Archive
  -> Replay / Export / Diagnostics
```

长期判断标准：

```text
媒体要对得齐
事件要留得住
状态要讲得清
回放要复得原
故障要查得明
```

Chronarium 应该给人的感觉是：

```text
站点逻辑独立维护
采集事实可追溯
时间轴是核心资产
视频文件只是导出物
播放器复刻直播间
AI 可以快速接手局部问题
```

## 当前阶段

当前仓库处于项目启动、文档框架和最小 TypeScript workspace 骨架阶段：

- 已确定项目名：`Chronarium`。
- 已确定产品方向：直播事实归档与完美回放，而不是普通录制器。
- 已确定默认技术方向：TypeScript-first。
- 已创建 `pnpm` workspace、基础 `tsconfig` 和首批 `packages/*` 边界。
- 已创建 `packages/types`、`packages/schemas`、`packages/archive`、
  `packages/core`、`packages/adapters/chaturbate`、`packages/testkit` 的
  初版空壳或契约。
- 尚未安装依赖。
- 尚未实现 GUI、可运行 core、真实站点 adapter、SQLite index、FFmpeg
  command builder、完整 archive writer 或 replay player。
- 本阶段的重点是先立稳工程边界、AI 维护规则、架构词汇、schema 草案、
  代码地图和交接文档。

## 默认技术方向

```text
Primary language: TypeScript
Desktop shell: Electron
GUI: React + TypeScript + Vite
Core backend: Node.js + TypeScript, running outside Electron main
Site adapters: isolated TypeScript child processes
Contracts: shared TypeScript types + schema validation
Fact log: JSON Lines
State / search index: SQLite
Media tools: FFmpeg / ffprobe through typed command builders
Analysis tools: Python allowed for offline diagnostics only
Native modules: deferred until a measured bottleneck exists
```

The technology choice is biased toward AI maintainability: common language,
shared contracts, fast tests, explicit schemas, fixture-driven debugging, and
small module boundaries.

## 文档索引

当前事实源：

- [AGENTS.md](./AGENTS.md)：AI coding agent 行为约束、工程边界和安全规则。
- [docs/CONTEXT.md](./docs/CONTEXT.md)：产品词汇、架构词汇和关键概念。
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)：首版系统框架、技术栈、进程边界和数据流。
- [docs/PRODUCT_SPEC.md](./docs/PRODUCT_SPEC.md)：产品承诺、MVP 范围、非目标和核心工作流。
- [docs/ARCHIVE_FORMAT_V1.md](./docs/ARCHIVE_FORMAT_V1.md)：`.chron` archive v1 目录形状和写入规则草案。
- [docs/TIMELINE_SCHEMA_V1.md](./docs/TIMELINE_SCHEMA_V1.md)：timeline event envelope 和事件族草案。
- [docs/ADAPTER_PROTOCOL.md](./docs/ADAPTER_PROTOCOL.md)：core 与 adapter worker 的消息协议草案。
- [docs/SECURITY_PRIVACY.md](./docs/SECURITY_PRIVACY.md)：安全、隐私、fixture 和敏感数据规则。
- [docs/DEVELOPMENT_SETUP.md](./docs/DEVELOPMENT_SETUP.md)：当前开发环境、未安装依赖前的安全检查和后续安装说明。
- [docs/APP_CODE_MAP.md](./docs/APP_CODE_MAP.md)：当前文件树和计划中的代码地图。
- [docs/AI_HANDOFF.md](./docs/AI_HANDOFF.md)：给后续 AI 或开发者接手的当前状态、决策和下一步。
- [docs/AI_CHANGE_INDEX.md](./docs/AI_CHANGE_INDEX.md)：AI 对话与结构性更改索引。
- [docs/plan/README.md](./docs/plan/README.md)：后续计划文档入口和命名规则。

## 设计边界

Chronarium 不应从一开始变成一个巨大的下载脚本。它应围绕这些边界设计：

- GUI 只提交用户意图和渲染状态。
- Electron main 只负责窗口、生命周期和启动 core，不承载站点逻辑。
- Core backend 是本地状态和任务调度的权威。
- Site adapter 只负责特定站点的事实发现和媒体采集策略。
- Timeline 和 event logs 是事实源。
- SQLite 是索引和查询缓存，不是唯一真相。
- FFmpeg 是受控外部媒体工具，不是任意 shell 入口。
- 每个站点必须可独立测试、独立回滚、独立热维护。

## 开源方向

Chronarium 目标 GitHub 仓库：

- [grshlogan/Chronarium](https://github.com/grshlogan/Chronarium)

开源前和提交前必须确保：

- 不提交 cookies、headers、tokens、signed URLs、私密房间信息或个人录制数据。
- 不提交真实直播媒体片段，除非它们是明确可公开的人工 fixture。
- 站点 adapter 的测试样本需要脱敏。
- 文档中不要包含个人账号、路径外的凭据或可识别用户数据。
- 尚未选择开源 LICENSE；添加 LICENSE 前需要用户明确选择。

## 近期建议

下一步适合先做这些基础工作：

1. 选择开源许可证；添加 LICENSE 前需要用户明确选择 MIT、Apache-2.0、
   AGPL-3.0 或其他。
2. 安装 TypeScript/Vitest 等最小开发依赖并生成 lockfile。
3. 把 `packages/schemas` 从 schema 草案推进到可运行 runtime validation。
4. 实现只写本地 synthetic fixture 的 `.chron` archive writer。
5. 用离线 fixture 验证 timeline append、manifest 生成和 SQLite index 同步。
