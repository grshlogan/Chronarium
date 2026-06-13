# Security And Privacy

Status: active project policy. This document applies before real capture
exists.

## Principles

- Local-first does not mean careless. Local archives can still contain private
  data.
- Preserve facts, but do not preserve secrets.
- Prefer stable references, hashes, or redacted placeholders over raw sensitive
  source fields.
- Keep GUI, Electron main, core, adapters, archive, and tools separated.
- Do not expose arbitrary shell execution through user-facing or adapter-facing
  surfaces.

## Data That Must Not Be Committed

- Cookies.
- Headers.
- Bearer tokens.
- Signed URLs.
- Account identifiers or credentials.
- Private room information.
- Real captured media.
- Private chat logs.
- Personal data.
- Local-only database files and runtime state.

## Fixture Policy

Fixtures must be one of:

- synthetic;
- public-domain and intentionally included;
- heavily redacted with no personal data;
- generated from small artificial examples.

Fixtures must not contain real signed media URLs, raw request headers, cookies,
tokens, private room labels, or personal recordings.

## Redaction Status

Chronarium uses these sensitivity labels:

```text
safe
synthetic
redacted
contains-sensitive
unknown
```

`contains-sensitive` is allowed only as a local runtime warning state. Such data
must not be committed, included in docs, or exported into shareable diagnostics.

## Secrets And Credentials

Real credential handling is not implemented. Future designs must use safe
credential references instead of passing raw secrets through:

- renderer state;
- IPC payloads;
- adapter manifests;
- timeline events;
- archive manifests;
- logs;
- shareable diagnostics.

## Process Boundaries

Renderer:

- may display state;
- must not fetch site media;
- must not mutate archives directly;
- must not launch arbitrary commands.

Electron main:

- owns desktop lifecycle and safe IPC;
- must stay thin;
- must not contain adapter, SQLite, archive, or media logic.

Core:

- owns task state, archive writes, adapter lifecycle, indexing, and
  diagnostics;
- must validate adapter messages;
- must prevent secrets from entering durable logs.

Adapters:

- own site-specific parsing and discovery;
- must run isolated once executable;
- must emit structured facts;
- must not write final archives directly.

Future site adapters must pass the offline readiness gate before live-site
design begins. The gate rejects raw network URLs, secret-looking field names,
cookies, authorization headers, bearer tokens, signed URLs, token query strings,
and `contains-sensitive` messages in committed fixtures.

## Filesystem Safety

- Archive-relative paths must not be absolute.
- Archive-relative paths must not escape the archive root.
- Writers must not silently overwrite archives, media, exports, or indexes.
- Destructive cleanup must require explicit user intent and bounded target
  paths.
- Media retention and upload are policy choices. The project owner's local
  deployment may delete raw media after verified processing and delete local
  processed outputs after verified upload, but a public release must not force
  that policy on every user.
- Automatic media deletion must be backed by recorded verification facts, such
  as raw hashes, processed-output hashes, playable validation, upload
  verification, and bounded deletion targets.
- Diagnostics bundles must be reviewed for sensitive data before sharing.

## External Tools

FFmpeg and ffprobe must be called only through typed command builders. The UI,
config files, adapter manifests, and debug endpoints must not expose arbitrary
shell command strings.

## Logging

Logs should be useful for diagnosis but safe to share after redaction.

Do not log:

- raw source URLs when they may be signed;
- request headers;
- cookies or tokens;
- full private chat payloads;
- local paths that reveal private user data unless the user intentionally opts
  into a local-only diagnostic.

## Incident Response

If sensitive data is discovered in a committed or shareable file:

1. Stop adding new changes that copy the data.
2. Identify every affected file.
3. Replace with synthetic or redacted content.
4. Document the cleanup in `docs/AI_CHANGE_INDEX.md`.
5. If Git exists, plan history cleanup separately with explicit user approval.
