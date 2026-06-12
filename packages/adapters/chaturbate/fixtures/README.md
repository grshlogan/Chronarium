# Chaturbate Adapter Fixtures

This directory contains synthetic or heavily redacted fixture files.

Current fixtures:

- `split-audio-video.synthetic.json`: a CB-like LL-HLS/CMAF topology with one
  synthetic video track, one synthetic audio track, and two synthetic segment
  observations per track.

Do not place real recordings, raw playlists with signed URLs, cookies, request
headers, account data, private room labels, or personal chat logs here.

Fixture source references must use `fixture://chaturbate/...`.

The adapter package is fixture-only and does not connect to Chaturbate.
