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

当前仓库处于项目启动、文档框架和最小可运行 TypeScript 验证链阶段：

- 已确定项目名：`Chronarium`。
- 已确定产品方向：直播事实归档与完美回放，而不是普通录制器。
- 已确定默认技术方向：TypeScript-first。
- 已创建 `pnpm` workspace、基础 `tsconfig` 和首批 `packages/*` 边界。
- 已创建 `packages/types`、`packages/schemas`、`packages/archive`、
  `packages/indexer`、`packages/core`、`packages/adapters/chaturbate`、
  `packages/testkit` 的初版空壳或契约。
- 已选择并添加开源许可证：Apache-2.0。
- 已安装最小开发依赖并生成 `pnpm-lock.yaml`。
- 已实现 `packages/schemas` 的首批 Zod runtime schemas。
- 已实现 `packages/archive` 的 fixture-safe `.chron` writer，可写
  `manifest.json`、`timeline.jsonl` 和顶层目录骨架。
- archive writer 已开始在 append-time 主动拒绝未写 manifest、跨 session、
  sequence 不连续、重复 eventId 和 finalize 后追加等基础 timeline 错误。
- archive writer 已支持 fixture-safe media track metadata 写入：更新
  manifest track inventory，写 `tracks/<track-id>/track.json`，并创建空的
  `tracks/<track-id>/segments/` 边界目录。
- 已实现 `packages/archive` 的首个 fixture-safe reader/validator，可读取
  `manifest.json`、`timeline.jsonl` 和 media track metadata，并报告
  timeline / track 一致性问题。
- 已实现 `packages/indexer` 的首个 rebuildable SQLite index，可从
  synthetic `.chron` archive 派生 archive metadata、timeline events 和
  validation issues。
- `packages/indexer` 已提供 reindex、remove、clear 和按 archive/session/
  site/type/code 过滤查询的初版契约。
- `packages/core` 已有第一个 archive/index service，可通过 core 调用
  archive validate/read 和 SQLite reindex/query。
- `packages/core` 已有最小 runtime lifecycle shell，可 start/stop、返回
  health，并在运行时持有 archive/index service。
- `packages/core` 已有第一版只读 maintenance archive inspector，可把 archive
  validator issues 和 timeline diagnostic facts 转成结构化 MaintenanceReport。
  它只报告，不自动修复、不 reindex、不接 AI。
- `packages/adapters/chaturbate` 已有第一个离线 split audio/video synthetic
  fixture，可生成 media track metadata 和 timeline facts，并通过 adapter
  protocol fixture runner 测试；该 fixture 也已可写入 synthetic `.chron`
  archive，并被 archive reader/validator 和 SQLite indexer 消费。
- `packages/adapters/chaturbate` 已增加离线 synthetic diagnostic fixtures，
  覆盖缺音频、media gap、音视频时长不一致和输出停滞等故障模型。这些是合成
  契约测试，用来证明 Chronarium 能保存坏录制事实，不代表真实 CB 站点行为已验证。
- 已添加 Vitest 行为测试，覆盖 synthetic session/timeline 写入 `.chron`
  package、读取 `.chron` package，以及 invalid JSONL、重复 eventId、
  sequence gap、manifest count/lastSequence mismatch、unsafe path、media track
  metadata 缺失/不一致、SQLite index 写入/查询、core archive/index service、
  core runtime lifecycle、core maintenance inspector、Chaturbate 离线
  split-track fixture、fixture archive/indexer flow 和 synthetic diagnostic
  fixture。
- 尚未实现 GUI、core task scheduler、adapter lifecycle、真实站点 adapter、
  SQLite index 与 GUI 集成、FFmpeg command builder、真实媒体分片写入、archive
  recovery/migration 或 replay player。
- 已补充回放模型、GUI↔core 协议、诊断码注册表、媒体工具边界等基础契约
  文档草案，以及归档恢复的实现前设计计划。
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
- [LICENSE](./LICENSE)：Apache License 2.0。
- [docs/CONTEXT.md](./docs/CONTEXT.md)：产品词汇、架构词汇和关键概念。
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)：首版系统框架、技术栈、进程边界和数据流。
- [docs/PRODUCT_SPEC.md](./docs/PRODUCT_SPEC.md)：产品承诺、MVP 范围、非目标和核心工作流。
- [docs/ARCHIVE_FORMAT_V1.md](./docs/ARCHIVE_FORMAT_V1.md)：`.chron` archive v1 目录形状和写入规则草案。
- [docs/TIMELINE_SCHEMA_V1.md](./docs/TIMELINE_SCHEMA_V1.md)：timeline event envelope 和事件族草案。
- [docs/REPLAY_MODEL_V1.md](./docs/REPLAY_MODEL_V1.md)：回放语义契约草案——回放输入、回放时钟、seek 和状态重建规则。
- [docs/ADAPTER_PROTOCOL.md](./docs/ADAPTER_PROTOCOL.md)：core 与 adapter worker 的消息协议草案。
- [docs/GUI_CORE_PROTOCOL.md](./docs/GUI_CORE_PROTOCOL.md)：GUI 与 core 之间的消息协议草案。
- [docs/DIAGNOSTIC_CODES_V1.md](./docs/DIAGNOSTIC_CODES_V1.md)：诊断与校验错误码注册表和命名规则。
- [docs/MEDIA_TOOLS_BOUNDARY.md](./docs/MEDIA_TOOLS_BOUNDARY.md)：外部媒体工具的类型化命令边界契约草案。
- [docs/SECURITY_PRIVACY.md](./docs/SECURITY_PRIVACY.md)：安全、隐私、fixture 和敏感数据规则。
- [docs/MAINTENANCE_OPS_DESIGN.md](./docs/MAINTENANCE_OPS_DESIGN.md)：maintenance / ops 巡检系统设计草案和项目引用。
- [docs/CB_RECORDING_REFERENCES.md](./docs/CB_RECORDING_REFERENCES.md)：CB 分离音视频录播参考项目和 Chronarium 设计取舍。
- [docs/DEVELOPMENT_SETUP.md](./docs/DEVELOPMENT_SETUP.md)：当前开发环境、依赖、脚本和安全检查说明。
- [docs/APP_CODE_MAP.md](./docs/APP_CODE_MAP.md)：当前文件树和计划中的代码地图。
- [docs/AI_HANDOFF.md](./docs/AI_HANDOFF.md)：给后续 AI 或开发者接手的当前状态、决策和下一步。
- [docs/AI_CHANGE_INDEX.md](./docs/AI_CHANGE_INDEX.md)：AI 对话与结构性更改索引。
- [docs/conversation-A01-documentation-and-initial-skeleton.md](./docs/conversation-A01-documentation-and-initial-skeleton.md)：A01 对话上下文维护文档。
- [docs/conversation-A02-foundation-docs-completion.md](./docs/conversation-A02-foundation-docs-completion.md)：A02 对话上下文维护文档。
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
- 项目许可证为 Apache-2.0。

## 近期建议

下一步适合先做这些基础工作：

1. 开始 archive recovery 的 report-only 检测，但继续禁止真实站点连接和账号/session 处理。
2. 给 maintenance inspector 增加 index freshness 对比，仍只读或只建议 safe rebuild。
3. 设计真实媒体分片写入前的 FFmpeg / segment 边界。
4. 后续如要验证真实 CB 行为，先准备用户批准的脱敏样本或合成复现材料。
