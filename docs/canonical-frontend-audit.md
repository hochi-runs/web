# Canonical frontend architecture and audio UX audit

**Superseding appearance update — 9 October 2026:** The player now uses one full-width bar flush to the viewport’s bottom edge on every page, with archive light colors and a dark `#262626` visualizer surface. Controls, INFO control and artwork captions have no borders or opaque backing rectangles; real panels retain their surfaces. Shared height is 56px on desktop and 100px below 900px, plus the bottom safe-area inset. This CSS-only update supersedes recommendations below to preserve an inset visualizer bar or boxed controls; persistent audio ownership is unchanged. A local browser check confirmed full viewport width at 1384px and playback progressing from 26 seconds in the visualizer to 26.8 seconds on the archive without restarting. The 12 focused tests and TypeScript passed.

**Superseding interaction update — 9 October 2026:** The owner's later direction replaces the archive's separate Play preview/Visualizer actions with one artwork link: open the corresponding visualizer and request playback from the click or keyboard activation. Hover/focus titles and the straight column remain; touchscreens show the titles. The player’s **CREDITS** now opens the dedicated release page directly; its credits drawer has been removed. Detail-page Play preview and the persistent audio owner remain. The architectural findings, recommendations and drawer checks below describe the earlier implementation and are retained as historical evidence where they conflict with this update.

Latest local browser checks observed Low Top Vanz playing at **0:19/4:39**, then the full `/releases/bandcamp-album-4115947133` page via CREDITS at the same position, followed by pause at **0:20**. At a **375px browser viewport**, keyboard Enter on Breaking Format artwork opened its visualizer and reached Playing. Focused audio/interface tests **12/12**, TypeScript and targeted lint passed. These checks establish those local flows, not physical-device or universal autoplay compatibility.

Date: 9 October 2026. Scope: the canonical preservation-first brief, current repository, supplied diagnostic exports and local browser checks. Audio persistence is confirmed working; this audit does not propose rebuilding it.

## Evidence and architectural assessment

The four 1353×774 JSON/PNG export pairs for `/`, `/shows`, `/roster` and `/beta/radio` were accessible in `/Users/user/Downloads/` and inspected during this audit. Their filenames are `layout-xray-home-1353x774`, `layout-xray-shows-1353x774`, `layout-xray-roster-1353x774` and `layout-xray-beta-radio-1353x774`, with `.json`/`.png` extensions. They record particular viewport, scroll and player states; they are not a complete responsive specification. Findings below distinguish those snapshots from current browser evidence.

- [RootLayout](../src/app/layout.tsx) owns the backdrop, chrome, route `main` and one persistent [SitePlayerProvider](../src/components/site-player.tsx). The provider creates no DOM wrapper. The scrolling `main` has its own stacking context; fixed chrome and player remain separate responsibilities.
- [SiteChrome](../src/components/site-chrome.tsx) uses `display: contents` and independently fixed corner elements. This is deliberate editorial composition, not a missing conventional header/footer. Its [CSS module](../src/components/site-chrome.module.css) owns radio theme, mobile-menu stacking and active-player clearance.
- [Home](../src/app/page.tsx) and [ReleaseFeed](../src/components/release-feed.tsx) retain a centered artwork feed and fixed desktop filter/year rails. [Shows](../src/app/shows/page.tsx) uses a `max-w-3xl` wrapper and wrapping flex event rows. [Roster](../src/app/roster/page.tsx) uses `max-w-5xl` with two columns below 640px and three from 640px. These different page systems have valid independent ownership.
- [RadioBeta](../src/components/radio-beta.tsx) owns selected media/session state; its player owns the stream, transport and visualizer. [`/beta/radio`](../src/app/beta/radio/page.tsx) returns no page DOM: the route expands the existing shared player. Compact mode deliberately has a fixed zero-height root with interactive positioned descendants.
- [Radio CSS](../src/components/radio-beta.module.css) owns the soundbar, two-row mobile controls, artwork, INFO and bounded drawers. Drawers attach directly above the soundbar; the fullscreen canvas/artwork/wordmark are intentionally layered. No ancestor/descendant intersection alone proves a defect.
- [PlayReleaseButton](../src/components/play-release-button.tsx) invokes the shared context without routing. Archive artwork opens detail; current visualizer artwork is a noninteractive figure. [Release Credits](../src/components/player-release-credits.tsx) shows selected-release metadata, notes and an informational tracklist, not site-wide credits or a queue.

## Before and after hierarchy

The component and DOM hierarchy remains the same. No wrapper, audio owner, menu, control or page template was added or removed.

```text
RootLayout
└─ SitePlayerProvider (context only)
   ├─ SiteBackdrop (fixed decoration)
   ├─ SiteChrome (display: contents → fixed corner elements)
   ├─ main (scrolling route content)
   │  └─ route-owned feed / grid / event rows / release detail
   └─ Suspense → RadioBeta → RadioBetaPlayer (one shared audio owner)
      ├─ expanded only: canvas, artwork, radio chrome, INFO
      └─ soundbar → transport, release selector, seek/time, links, volume
         └─ conditional release-browser or Credits drawer
```

Before: repeated 20px anchors, a separately maintained 78px raised-nav offset, and INFO height based on a viewport subtraction unrelated to the bar. After: the same containers share their existing edge/bar measurements; INFO explicitly ends above the bar.

## Findings and smallest corrections

| Element and current relationship | Evidence and classification | Smallest correction / composition effect |
| --- | --- | --- |
| INFO is absolutely positioned above the expanded radio bar but had an independent maximum height. | **Demonstrated interaction defect:** at 375×420, INFO occupied y120–344; the bar occupied y322–408. It covered 19px of the transport button, and `elementFromPoint()` on its upper hit target returned INFO text. | Bound INFO by viewport height minus INFO top, bar bottom, existing bar height and 22px clearance. The panel scrolls; controls, artwork and bar placement remain unchanged. |
| Logo, primary navigation, menu controls, secondary navigation and INFO repeat the same 20px edge. | **Source fact:** they express a shared viewport anchor with duplicated values. Their differing top offsets and social 16px inset are deliberate. | Share `--site-edge` only where 20px was already used. Preserve the distinct logo/social offsets, corner placement, surface styling and negative space. |
| At 640–1279px, lower-corner links rise above the nearly full-width active bar. | **Source fact:** radio and archive-active rules repeated the same 78px offset. **Intentional coordination**, not a collision by itself. | Express 78px as existing 12px bar-bottom +48px bar-height +18px gap, including safe-area inset. Keep inactive archive chrome at its existing position. |
| Fullscreen Radio soundbar and lower-corner navigation. | **Snapshot fact:** exported soundbar is913×48; observed horizontal clearance is84px on the left and27.2px on the right. No collision is demonstrated by that 1353×774 capture. | Preserve distinct compact/expanded widths and appearance. Check live intermediate widths instead of increasing z-index or removing lower navigation. |
| Roster chrome/content intersections. | **Snapshot fact:** 14 warnings repeat one image intersection and empty-wrapper geometry. They do not establish 14 independent obstructions. **Intentional/decorative candidates**, subject to rendered hit-target/readability review. | No roster grid/artwork change based solely on warnings. Preserve overlap unless a specific inaccessible target is demonstrated. |
| Main content and active compact player. | **Source fact:** pages already provide bottom padding; no player-specific extra padding is reserved before activation. Compact root height 0 is intentional. | Preserve existing clearance: current end-of-page checks passed at 375px and 1353px. Do not add arbitrary spacer padding or remove the footer. |

## Implemented scope

Only the four runtime files below changed for this architectural pass; this document records the work. There were no audio-source, playback-state, control-semantic, page-grid or visible-surface changes.

| File | Why it changed and what relationship it owns |
| --- | --- |
| [globals.css](../src/app/globals.css) | Adds existing shared measurements: 20px site edge,12px plus safe-area bar bottom, and48/84/86px bar heights for desktop/mobile/narrow-mobile. These describe the current controls and frame; they do not establish a page-wide grid. |
| [site-chrome.tsx](../src/components/site-chrome.tsx) | Reuses the 20px edge variable for matching existing corner anchors. Existing 5/17px logo top and 16px social inset remain deliberate exceptions. |
| [site-chrome.module.css](../src/components/site-chrome.module.css) | Gives radio and archive-active lower navigation one shared formula for the existing clearance above the bar. |
| [radio-beta.module.css](../src/components/radio-beta.module.css) | Reuses edge/bar metrics, keeps existing soundbar dimensions, and derives INFO’s bounded height from its real relationship to the bar. |

## Prioritized recommendations — UNIMPLEMENTED

The brief requires approval for control removal/merging, label/icon changes, new disclosures and Play/Visualizer/Browse/Credits semantics. The following are recommendations only.

1. **Play / Visualizer / return.** Play already starts the release in place and Visualizer expands the shared session. The fragmented part is return: expanded **Browse** always links to `/`, including after entering from a detail or artist page. Prefer returning to the last ordinary in-site page when available, with archive fallback for direct Radio arrivals. Keep explicit Play and optional Visualizer; preserve paused state, selection and position. Starting, expanding and returning remain one action each; returning to the original reading context removes extra navigation/search. Same bar geometry; any return-label change needs approval.

2. **Browse / release selection.** The title/chevron opens a searchable release selector; Browse exits to the archive. The archive adds format/year filters, artwork and detail browsing, whereas the selector offers fast artist/title search among releases with Bandcamp identities. These are distinct tasks. Prefer a clearer exit label such as “Back to site,” retaining the existing title/chevron selector. No new browser or queue. Current selection stops/loads the new preview and leaves Play as a separate explicit step; changing that behavior would be a separate approval decision. One action still opens either destination; composition stays the same apart from the approved label.

3. **Credits redundancy.** Preserve the bar’s Credits action: it describes the selected audio release even while another release, artist or show is being viewed. No site-wide Credits control was found. The drawer’s **Full release page →** is redundant only on the exact matching release-detail pathname. Prefer suppressing or replacing that link in that context alone. Credits stays one action with Close/Escape and focus return; every other route retains the full-page destination. This removes one redundant drawer-footer action without deleting credits or changing the bar.

4. **Bar density.** Transport, release choice, seek, volume/mute, Credits, view switching and Buy have distinct purposes. Preserve immediately accessible basic listening controls. If fewer visible bar actions are preferred, move Buy into the existing Credits drawer while retaining release-page Bandcamp links. Buying from the bar then requires two actions instead of one; that explicit cost needs approval. The bar gains title space without a new menu, panel or icon system. Keeping Buy visible remains appropriate if immediate support access is the priority.

5. **INFO’s source control.** INFO presents one selected Bandcamp source button, while no alternate source is offered there. Its existing handler pauses playback and resets the displayed position even when Bandcamp is already selected. Prefer static source text for this single available source. No source-selection capability or listening access is lost; one unnecessary interrupting action disappears. The effect is confined to INFO, not the bar. Removal still requires approval.

6. **Header and navigation.** Keep corner chrome, `display: contents`, current theme/surfaces and page-specific widths. Shared anchors are sufficient for the demonstrated ownership duplication. No visible full-width header, new border/blur/shadow or centered navigation is recommended. Existing routes, hit targets and interaction counts remain unchanged.

7. **Bottom-edge follow-up.** Preserve the locally corrected INFO/bar relationship and existing corner-link clearance. Treat further overlap warnings as candidates: only a demonstrated blocked control/readability problem warrants a local fix. No evidence currently justifies removing the footer, merging compact/fullscreen layouts or adding another browsing surface. Any correction that requires major movement or material player resizing should be proposed separately.

## Verification

| Check | Result and limit |
| --- | --- |
|375×420 expanded INFO before/after | **Passed local browser check:** after the correction INFO ends at y300; bar remains y322–408, 86px high, leaving 22px clearance. Upper transport hit targets resolve to the intended controls. The last INFO link can be reached by keyboard and scrolls inside the bounded panel to y257–275. |
|Paused navigation across `/`, `/roster`, `/shows` | **Passed local browser check:** pause position 82.1 seconds, selected track and volume 0.2 remained coordinated; one player DOM instance. This is a specific continuity observation, not a cross-tab/reload claim. |
|Full existing test suite | **124 passed** using Node22 with `--no-experimental-global-navigator`. Tests cover catalog/data and simulated audio/visualizer/inspector behavior; they do not substitute for actual browser media/navigation checks. |
|Focused audio tests | **11 passed:** dormant entry, custom-bar/unavailable states, invalid selection, simulated play/pause/resume/seek/end, stale-play suppression, gesture unlock, graph reuse, reduced motion, graphics failure and capture cleanup. |
|Node22 fixture compatibility | Plain Node22 produces two existing fixture errors when assigning getter-only `globalThis.navigator`. The command-line flag allows the tests’ simulated navigator; no application code was altered to address this environment issue. |
|Targeted ESLint | **Passed** for `src/components/site-chrome.tsx`. |
|TypeScript | **Passed** with `tsc --noEmit`. |

### Browser verification matrix

Measurements used the actual browser viewport, `getBoundingClientRect()`, computed layout, and `elementFromPoint()` hit checks. Widths below are CSS pixels; all rows use height 774px except the dedicated INFO row. The ordinary routes have a 15px scrollbar in this browser; expanded Radio does not. A width change alone is not physical-device emulation.

| Route / state | Widths tested | Result |
| --- | --- | --- |
| `/`, active compact player | 320, 375, 639, 640, 768, 901, 1024, 1279, 1280, 1353 | No horizontal document overflow; measured navigation/player control centers remained reachable. Compact bar bounds matched the pre-change samples at matching widths. |
| `/shows`, active compact player | 320, 375, 640, 768, 901, 1353 | No horizontal document overflow or blocked tested navigation/player control centers; wrapping event rows preserved. |
| `/roster`, active compact player | 320, 375, 639, 640, 768, 901, 1280, 1353 | No horizontal document overflow or blocked tested navigation/player control centers. Existing grid/artwork composition retained. |
| `/beta/radio`, expanded player | 375, 640, 768, 901, 1279, 1280, 1353 | No horizontal document overflow or blocked tested navigation/player control centers. At1353, bar remains x220,y714,913×48, matching the supplied export. |
| Radio with INFO open, height 420 | 320, 375, 379, 380, 639, 640, 768, 901, 1280, 1353 | INFO ends 22px above the bar at every sample. Upper Play/Pause hit target works. Bar heights remain 86/84/48px across the existing thresholds. |
| `/releases/bandcamp-album-1883854658` | 375, 768, 901, 1353 | No horizontal document overflow or blocked tested navigation/player controls. Release-level Play remained on the detail page. |

Further interaction evidence:

- **Before activation:** a fresh ordinary-site tab had no compact player. Clicking archive Play activated the existing shared player without routing. The CSS changes add no inactive content spacer.
- **Playing navigation and history:** resuming the paused track, navigating Shows → Artists, Back → Shows and Forward → Artists retained playing state, selected track and 0.21 volume. The displayed position subsequently advanced from 82.1 to 89.3 seconds. Source ownership remains one root player; one player region was observed throughout. Browser checks did not instrument detached `Audio` instances; graph reuse/resource ownership is also covered by the existing runtime fixtures.
- **Mute/volume:** mute set volume 0, navigation retained 0, unmute restored the prior level, and keyboard adjustment set 0.21. Selection and later route changes retained that level.
- **Release replacement:** choosing SDM2 in the existing selector stopped the previous preview and loaded EU PULO at 0 while retaining volume. Explicit Play on the SDM2 detail page started it in place. No new browsing or playback mechanism was introduced.
- **Visualizer entry/exit:** the selected release followed into Radio. Returning through Browse kept playback advancing (35.3 →35.6 seconds) and retained 0.21 volume. Returning again while paused retained 102.8 seconds. Playback was left paused after testing.
- **Credits and selector:** the searchable selector found SDM2; Credits showed SDM2’s notes/tracklist and its Full release page link opened the matching detail route. The short 375×420 Credits drawer was inspected with its scrollable body and close control. INFO’s final Return to archive link was keyboard-reachable within its bounded scroll area.
- **Mobile menu:** opening the existing menu isolated the player, and closing restored the Open menu trigger’s focus and normal body scrolling. No modal behavior was changed.
- **End content:** at maximum scroll, Home’s last release and Roster’s last artist ended at y662 on 375px (bar begins 676), and y646 on 1353px (bar begins 714). Shows’ final row ended at 650/634 respectively. Existing final-page padding is sufficient in these zero-safe-area samples; it was preserved.
- **Intentional overlap:** roster navigation still floats above scrolling imagery. At the supplied desktop state, upper navigation intersects empty wrapper padding; lower links overlap part of the second-row image. Current link centers remained reachable. Transient image coverage remains part of the composition, rather than a reason to shrink the roster or introduce a header/footer band.

Remaining limits: physical touch devices, nonzero safe-area insets, virtual keyboards, extreme viewport heights below the sampled 420px, text zoom/localized label lengths, screen-reader behavior, external Bandcamp iframe interaction and preview-network failure states were not browser-certified in this pass. Unavailable/invalid player markup is covered by the existing interface tests. Center/selected-edge hit tests do not prove every pixel or scroll position is unobstructed. No production build, deployment, cross-tab/reload persistence or CMS changes were performed for this pass.

### Saved evidence

- [Structured browser measurements](../output/canonical-layout/browser-checks.json)
- [Before INFO at 375×420](../output/canonical-layout/before-info-375x420.jpg)
- [After INFO at 375×420](../output/canonical-layout/after-info-375x420.jpg)
- [Roster with compact player](../output/canonical-layout/roster-desktop.jpg)
- [Radio with preserved artwork and soundbar](../output/canonical-layout/radio-desktop.jpg)

The full working tree contains earlier remediation and X-Ray changes. The four runtime files listed above describe this pass specifically; the larger pre-existing Git diff must not be mistaken for newly authorized architectural work.
