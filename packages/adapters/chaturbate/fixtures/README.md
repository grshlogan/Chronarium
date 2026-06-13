# Chaturbate Adapter Fixtures

This directory contains synthetic or heavily redacted fixture files.

Current fixtures:

- `live-parser.synthetic.json`: a thicker CB-like LL-HLS/CMAF fixture with
  synthetic master/media playlist text, split video/audio tracks, room state,
  chat messages, reconnect/gap facts, and a diagnostic note. It is designed so
  future live code can reuse the same pure parsers with approved real bytes.
- `split-audio-video.synthetic.json`: a CB-like LL-HLS/CMAF topology with one
  synthetic video track, one synthetic audio track, and two synthetic segment
  observations per track.
- `missing-audio.synthetic.json`: a synthetic video-only topology plus one
  diagnostic fact for expected audio being absent.
- `diagnostic-anomalies.synthetic.json`: a synthetic split-track topology with
  a media gap, audio/video duration mismatch, and stalled-output diagnostic
  facts.

Evidence level:

- These fixtures are contract tests for Chronarium's archive, timeline, and
  index behavior.
- They do not prove current live Chaturbate behavior.
- Real compatibility evidence must come later from separately approved,
  sanitized samples or synthetic reproductions derived from approved local
  evidence.

Do not place real recordings, raw playlists with signed URLs, cookies, request
headers, account data, private room labels, or personal chat logs here.

Fixture source references must use `fixture://chaturbate/...`. Playlist text in
fixtures must also use only synthetic references and must not contain raw
network URLs, query strings, cookies, headers, bearer tokens, signed URLs,
account names, real room labels, or personal chat content.

The adapter package is fixture-only and does not connect to Chaturbate.
