# Cinematic hero — three implementations, measured

Branch `experiment/cinematic-media-converter`. Produced with the workspace
`cinematic-media-converter` skill (`../../.agents/skills/cinematic-media-converter/`).

**Not merged, and not a recommendation to merge.** The MP4 hero remains the default and is
untouched; everything here is switchable and reversible.

## What was compared

| | Selector | Implementation |
| --- | --- | --- |
| **A** | `?hero=video` (default) | Shipped `AstronautHero.tsx` — all-intra MP4 scrubbed via `currentTime` |
| **B** | `?hero=frames` | 193 WebP frames drawn to a 2D canvas |
| **C** | `?hero=interactive` | Same 193 frames as a texture on a three/R3F plane, with camera depth and cursor parallax |

All three are driven by the **same** scroll pipeline (`useHeroRunway` → the existing framer-motion
spring → `--p`), so the only variable is the renderer. Candidates B and C share byte-identical
frame assets.

## Conditions

Every number below was measured under these conditions. None is carried over from anywhere else.

- Windows 11, Chrome (DevTools MCP), production build (`npm run build`) served by `vite preview`.
- **Display refresh: 143 Hz** — idle median frame 7.0 ms. The frame budget here is ~7 ms, *not*
  16.7 ms, so "long frame" thresholds below are relative to that. **No 60 FPS claim is made
  anywhere in this document**, because 60 FPS was never the target cadence on this machine.
- Desktop: 1440×900, DPR 1, no throttling, served from localhost.
- Mobile: 390×844, DPR 3, touch, **Fast 4G + 4× CPU throttling**.
- Cold cache (reload with cache disabled) unless stated.
- Scripted scroll, identical for every candidate: 0 → end of the hero runway over 4000 ms, then
  back to 0 over 2500 ms. Desktop = median of 3 runs; mobile = 2 runs (range shown).

**Localhost has no network latency.** That flatters every candidate and flatters the 193-request
one most. The throttled section below exists because of it.

## Desktop, unthrottled

| | A video | B frames | C 3D |
| --- | --- | --- | --- |
| Hero media requests | **3** | 196 | 198 |
| Hero media transfer | 8.91 MB | 8.70 MB | 8.70 MB + 217 kB |
| Total page transfer | 9.21 MB | **9.00 MB** | 9.44 MB |
| Shared JS (gzip) | 95.5 kB | 95.5 kB | 95.5 kB **+ 222 kB lazy chunk** |
| JS heap after scroll | **5.4 MB** | 11.9 MB | 20.4 MB |
| LCP | 205 ms | **164 ms** | 367 ms |
| CLS | 0.01 | 0.01 | 0.01 |
| Scroll down — p95 frame | 20.9 ms | **7.1 ms** | 13.9 ms |
| Scroll down — longest frame | 111.3 ms | **13.9 ms** | 27.8 ms |
| Scroll down — frames > 2× median | 45 | **0** | 3 |
| Scroll down — hitches > 50 ms | 4 | **0** | 0 |
| Scroll up — p95 frame | 27.9 ms | **7.0 ms** | 14.0 ms |
| Scroll up — longest frame | 132.1 ms | **7.1 ms** | 20.9 ms |
| Scroll up — hitches > 50 ms | 3 | **0** | 0 |

The frame sequence is not marginally smoother on desktop — it is *categorically* smoother. Zero
frames over twice the median, in both directions, across three runs. The MP4 scrub produced 45
long frames going down and a 132 ms stall going back up, which is the reverse-seek cost of asking
a video decoder to land on an arbitrary frame.

## Under throttling (Fast 4G + 4× CPU)

This is where the 193-request structure is paid for.

| | Time until the hero can scrub |
| --- | --- |
| A video | ~1.0 s to first playable data; **~6.9 s** to fully buffer 8.9 MB |
| B frames | **11.3–13.6 s** for all 193 frames |
| C 3D | three chunk at 1.5 s; **8.0 s** for all frames |

B and C fetch identical assets, so their spread is emulator noise, not a real difference — take
the honest range as **8–14 s for the frame sequence versus ~7 s for the video**. Two structural
notes: the video is *progressively* usable (it plays before it is fully buffered, though scrubbing
far ahead can still stall), whereas the frame implementation deliberately waits for every frame
before revealing, because a partially loaded sequence would skip. Halving the sequence (`--every 2`,
97 frames) would roughly halve this and was not tried.

## Mobile (390×844, Fast 4G, 4× CPU)

| | A video | B frames | C 3D |
| --- | --- | --- | --- |
| Tier chosen | 720p MP4, 3.2 MB | w720 WebP, 3.82 MB | w720 WebP + three |
| Scroll down — p95 frame | 7.0–7.1 ms | 7.0–13.8 ms | 14.0–20.8 ms |
| Longest frame | 14–21 ms | 14–21 ms | 21–41.8 ms (one 132 ms outlier) |
| Hitches > 50 ms | 0 | 0 | 0–1 |
| JS heap | 22.6 MB | 24.5 MB | 19.5 MB |

**The MP4 hero has no smoothness problem on mobile.** It is served the 720p encode over a 200svh
runway, and it is indistinguishable from the frame sequence. The desktop jitter in the previous
table is a *1440p-desktop* problem, not an inherent property of scrubbing video. Responsive tier
selection was verified working: the phone pulled `w720`, never the 1440 set.

## Reduced motion

Verified on `?hero=interactive` with `prefers-reduced-motion: reduce`:

- **0** frames fetched, **0** three chunk, **0** video — 123 kB of poster and nothing else.
- Hero fully composed: settled state, `<h1>`, all 4 telemetry cells, all 3 CTAs in the DOM.

This required a fix found by measuring: `React.lazy` starts fetching the moment the component
renders, so a reduced-motion visitor was downloading **217 kB of three for a scene that never
mounted**. The preference is now resolved in `HeroSwitch` before the lazy component is reached.

## Bundle impact

| | gzip |
| --- | --- |
| `main` baseline JS | 92.90 kB |
| Branch shared JS | 95.53 kB (**+2.63 kB** — switch, shell, frame maths) |
| 3D chunk (`?hero=interactive` only) | **222.09 kB**, lazy |

## Visual fidelity

Screenshots at identical scroll (`--p = 0.515`), 1440×900: `benchmarks/hero-video-mid.jpeg`,
`benchmarks/hero-frames-mid.jpeg`, `benchmarks/hero-interactive-mid.jpeg`.

B is visually indistinguishable from A — same pixels, same crop. C is very slightly pushed in
(a 5% cover margin plus the scroll dolly, both intentional); composition, palette, typography and
choreography are otherwise unchanged. No candidate is a redesign.

## Recommendation

**Keep the MP4 hero as the default. Do not ship the 3D candidate.**

- **C (3D) does not earn its cost.** It buys 222 kB gzipped, the worst LCP of the three (367 ms vs
  205 ms), the highest desktop memory, and — the point that matters — it is *less smooth than the
  plain 2D canvas doing the same job*. WebGL added real depth and a genuinely pleasant cursor
  parallax, but nothing here supports the premise that Three.js makes a scroll hero faster. It made
  it slower on every load metric.
- **B (frames) is the interesting result.** It is decisively smoother on desktop, marginally
  lighter in total bytes, and has the best LCP. What it costs is a 193-request first load that
  takes 8–14 s over Fast 4G instead of ~7 s, and roughly double the JS heap.
- **The cheapest real win is neither.** Since the video's jitter is specific to the 1440p desktop
  encode and absent on the 720p mobile one, the first thing to try is a better desktop encode —
  which is `scroll-video-optimizer`'s territory, not a new renderer's. That is a much smaller
  change than replacing the hero.

If the desktop scrub is re-encoded and *still* stutters, candidate B becomes the right answer, and
it should ship subsampled (97 frames) to halve its first-load penalty.

## Limitations

- One machine, one browser, one 143 Hz display. **No real device was tested** — mobile numbers are
  emulated (viewport + CPU + network), which does not model GPU, thermals, or real radio latency.
- **Safari/WebKit untested.** The shipped hero carries a deliberate WebKit playback prime; whether
  the canvas candidates need equivalent handling is unknown.
- Throttled load figures are noisy (emulated throttling over localhost); ranges are given rather
  than single values.
- The "hero usable" polling metric competes with main-thread work under throttling, so network
  `responseEnd` was used for the load figures instead.
- **No 2.5D layered candidate was built.** The source does not matte: the astronaut's visor and
  suit shadows sit at background luma *and* connect to the backdrop through shadow at the neck
  ring, so neither a luma key nor a border-connected fill separates them. Evidence is in the
  skill's `references/analysis.md`. Layering this footage would have meant inventing content.
- No 3D candidate using real geometry was built, because no real 3D source assets exist. Footage
  cannot be reconstructed into accurate geometry.

## Rerunning the conversion on another MP4

```bash
SKILL=../.agents/skills/cinematic-media-converter/scripts

node $SKILL/check-tooling.mjs --project .
node $SKILL/analyze-source.mjs media-src/<name>-source.mp4 --assets-dir public
node $SKILL/extract-frames.mjs media-src/<name>-source.mp4 \
  --outdir public/media/generated --name <name> --widths 1440,1080,720
```

`--every 2` halves the sequence; `--alpha connected` derives a matte and writes
`matte-preview/*-on-magenta.png` — **look at those** before trusting any layered treatment.
Frames are git-ignored; `manifest.json` is tracked and is what the runtime reads, so a
regenerated sequence with a different frame count needs no code change.
