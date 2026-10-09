# Verification report — October 9, 2026

This report records executed checks, rather than treating the operator checklist as completed work. The source is the full 14-section supplied remediation brief and the owner's subsequent custom-player screenshot/direction. [Outcomes and release recommendation](outcomes.md) reconcile all 57 original concern IDs; detailed catalog, contact/operations and radio reports contain focused regressions and remaining procedures.

The owner later requested public Bandcamp/Resident Advisor artist research and imagery. [Artist sources](artist-sources.md) records the resulting seven local biographies/profile images, source/identity checks, and follow-up verification. Earlier zero-biography/portrait and missing-artist-copy observations below remain baseline evidence, not the current local profile inventory.

The earlier browser comments requested merging release choice into the custom media bar. [Earlier radio follow-up](radio-playback.md#earlier-integrated-release-browser-follow-up) retains the searchable-disclosure, keyboard/dismissal/history and viewport evidence for that stage. The owner's latest instruction then authorized site-wide native-preview persistence and release Credits. The [current follow-up](#site-wide-player-and-credits-follow-up) records the shared-root implementation, desktop continuity/history, narrow/landscape viewport and release-replacement observations. Final lint, TypeScript, **97/97 tests**, diff check and an explicit local-content production build with **44 pages** passed. Forced-network/rapid-race, missing-credit browser state, complete keyboard and physical-device checks remain incomplete.

## Environment and preserved work

Repository: `/Users/user/data____v/hochi-runs`; baseline `3a199d372b143c5cfb17b96679b80675a67c2bdc`. Next 16.2.7, React 19.2.4. Installed Next guides were read before implementation. Initial user changes in the radio page/component/CSS/visualizer (304 insertions, 74 deletions) were retained, including the selected-release URL contract and prism/wordmark treatments. No reset, commit, push or deployment occurred.

The initial shell uses Node 20.19.4/npm 11.6.2. Installed Node 22.23.2 was used for Next build/start/dev. PHP, Node 24 and `gh` were unavailable in the inspected normal runtime inventory. No physical iOS/Android device or connected Chrome/Edge browser was available. Credentials were audited only for presence; their values are absent from this report, output and client code.

## Executed command results

Commands below ran from the repository root. Empty WordPress settings select an **explicit local-content test environment**; they are not a runtime fallback or a correction to the configured CMS.

| Command / procedure | Result and scope |
|---|---|
| `git status --short`, `git rev-parse HEAD`, package/data/source inspection | Baseline revision and four existing user-modified radio files recorded before edits. Local effective catalog has 23 releases, 7 roster members, 23 tracklists, 19 descriptions, 5 linked releases/11 explicit pairs, 18 unlinked releases; no approved biographies/portraits. Live CMS counts are unknown. |
| Baseline `npm run test:catalog` | 75/75 local JS tests passed before task changes. This supersedes the note's historical 16-test observation only as local fixture evidence. |
| Baseline `npm run lint`; `npx tsc --noEmit` | Both passed. |
| Final `npm run test:catalog` | **97/97 passed**, zero failures, again after the INFO wording/control cleanup. Includes import/merge/WP/contact/preview fixtures, simulated browser APIs, actual-component SSR, engine unlock/clearSource and dormant ordinary-entry regressions. No test assertion was deleted to obtain a pass. |
| Final `npm run lint`; `npx tsc --noEmit`; `git diff --check` | Exit 0 after the INFO wording/control cleanup. Documentation links/concern reconciliation and untracked Markdown whitespace are checked separately at handoff. |
| Initial restricted `npm run build` | Stalled during compilation without a diagnostic and was interrupted (exit 130). This attempt is inconclusive, not a proven code failure. |
| `/Users/user/.nvm/versions/node/v22.23.2/bin/node node_modules/next/dist/bin/next build` with existing server settings | Compilation and TypeScript passed; `/about` prerender failed on **WordPress HTTP 404**. The preexisting configured full-bridge endpoint remains a connected-release blocker. A separate restricted-shell feed read returned `ENOTFOUND`, which does not replace the observed 404 diagnosis. |
| `WORDPRESS_CONTENT_URL= WORDPRESS_ARTISTS_URL= WORDPRESS_LOCAL_DEMO= /Users/user/.nvm/versions/node/v22.23.2/bin/node node_modules/next/dist/bin/next build` | **Passed**, including 44 generated static pages, after the shared-player/Credits change and before the subsequent INFO copy/control cleanup. No new build was run for that reversible edit. This local-mode build does not prove connected publishing. |
| `WORDPRESS_CONTENT_URL= WORDPRESS_ARTISTS_URL= WORDPRESS_LOCAL_DEMO= /Users/user/.nvm/versions/node/v22.23.2/bin/node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3000` | Earlier local-content production server supplied native-disabled/HTTP checks below. Those browser checks preceded persistence; a fresh deployment is not inferred. Native preview remains intentionally unavailable on loopback production. |
| `WORDPRESS_CONTENT_URL= WORDPRESS_ARTISTS_URL= WORDPRESS_LOCAL_DEMO= /Users/user/.nvm/versions/node/v22.23.2/bin/node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3001` | Served local native development mode. Existing development eligibility permits loopback; no hosted preview origin was enabled. Restricted socket attempts returned `EPERM`; the approved local process supplied browser evidence. |
| `node scripts/editorial-pages.smoke.mjs http://127.0.0.1:3000 && node scripts/contact-local-smoke.mjs http://127.0.0.1:3000` | Earlier production checks exited 0. They verified rendered content/link/placeholder states and real HTTP validation below, before public artist enrichment/persistent Play preview. Contact smoke accepts only loopback and sends invalid input, never an inquiry. |
| Earlier `node --test scripts/bandcamp-preview.test.mjs scripts/radio-runtime.test.mjs scripts/radio-interface.test.mjs` | 26/26 passed at the custom-bar stage: 18 preview fixtures, 6 explicit simulated audio/capture/renderer lifecycle cases, 2 component SSR cases. The current whole-suite result above supersedes this count; original 16 preview safeguards remain retained. |
| Catalog/editorial focused checks and package generation | Explicit identity/override/collision/seed regressions pass; generated initial JSON and installable ZIP updated. Existing installed editor entries are not overwritten by importing the package. See [catalog evidence](catalog-editorial.md) for exact commands. |
| `node scripts/media-compatibility-server.mjs` | Loopback-only prototype on port 3002. Generates a six-second mono PCM WAV (180/900/5000 Hz segments), serves fixed routes and transpiles the actual player/analyser/renderer. No Bandcamp audio is stored or reused. Browser proof below; this is not a shipped audio service. |

Focused before/after evidence: original catalog code fails the explicit relationship/collision regressions; original contact code fails internal-host and uncertain-timeout assertions. Temporarily testing the original renderer against the new reduced-motion/context-loss harness fails both regressions; current renderer passes. Temporary comparison files were removed. These comparisons detect defects rather than asserting that all production integrations are certified.

## Real Next HTTP checks

Earlier smoke checks observed (before public artist enrichment and persistent Play preview):

- `/contact`: HTTP 200, accurate unavailable heading, disabled fields; no claimed submission success.
- `POST /api/contact`: missing/foreign/internal-alias Origin rejected with 403; exact visitor Origin reaches the correctly unconfigured 503 response. No mail sent; responses are not cached. This detected and verifies the actual visitor Host correction despite Next's differing internal request URL.
- `POST /api/wordpress/revalidate`: missing/wrong bearer returns 401; exact existing bearer with CMS explicitly disconnected returns 409 and does not claim invalidation. Secrets were read privately inside the smoke script and never printed.
- Archive, standard and prototype release pages expose matching selected-release Listen URLs. Roster/artist/About/Legal output has truthful unpublished states; unapproved biography/policy copy is absent. Merch keeps four unavailable purchase states; Videos has the existing actual YouTube destination. The catalog picker contains 23 effective releases and stable explicit links.

HTTP route success alone is not audible playback, email receipt, an editor publication, or a served remote deployment.

## Earlier executed browser walkthrough

These actions preceded the shared-root persistence change and are retained as historical evidence; route-owned entry/exit observations are superseded by the follow-up below. Browser actions used the in-app browser and native Safari on this Mac. Viewport overrides are responsive-layout checks, **not mobile device emulation/certification**. Temporary overrides were reset after those checks. External/user changes to a test tab and unrelated server requests are excluded as playback evidence.

| Environment / action | Observed result | Limit |
|---|---|---|
| Public `https://hochiruns.com`, in-app browser | Public archive loaded on October 9. README's older suspension claim was corrected. | Does not establish billing, editor access, deployment health or current CMS content. |
| Final local production, Hit Dat native-disabled | Custom PLAY/track/seek/time/BUY/volume bar remained; native controls disabled, accurate configuration message, no automatic iframe. | Hosted native availability still requires approved exact HTTPS origin configuration. |
| Click “Use official Bandcamp player” | Separate named panel opened with Close focused; iframe loaded **Hit Dat by Amal, DJ SWISHA**. Native bar remained paused/disabled. Closing removed iframe and returned focus to release selector. | Actual iframe playback was not exercised; parent cannot observe/control its internal playback or guarantee current track identity. |
| Archive → Low Top standard detail → Listen | Selected Low Top radio URL, artwork, selector and matching BUY destination. | Native disabled in this production check; separately tested in development below. |
| Prototype `like-dat-riddim` detail → Listen | Matching `?release=like-dat-riddim`, artwork/selector/support destination. | No native play claim for this release. |
| Unknown slug and duplicate `release` query | Requested release unavailable, no silently selected first release, custom bar disabled with no selection. | Full device history matrix remains open. |
| Invalid slug with `view=review` → select Hit Dat → Back → Forward | Selector changed to Hit Dat and preserved `view=review`; Back restored unavailable selection; Forward restored Hit Dat. | Real audio/history races also have simulated coverage, but slow-network device testing remains open. |
| Archive mobile menu at 390×844 | Named dialog, initial Close focus, Shift+Tab wraps to final YouTube link, Tab wraps to Close, Escape returns to Open menu. Background isolated and body overflow locked; exit restores attributes/overflow. Artists navigation closes/cleans menu. | Keyboard behavior executed in this browser, not all devices. |
| Final archive menu resize 390×844 → 900×800 while open | Menu dismissed, overflow restored, focus moved to visible **Hochi Runs home** link. | Responsive desktop-return regression found during review is corrected. |
| Radio menu at 390×844 during Low Top playback | Same Close/YouTube/Close keyboard wrap and Escape-return behavior; custom native bar remains present after dismissal. | No OS capture/reduced-motion preference exercised here. |
| Native development Low Top, in-app browser | Loading identity → Paused → Buffering → **Playing**, increasing elapsed time and 4:39 duration. Pause stops state; keyboard seek to start and resume observed earlier. Final narrow layout showed artwork, wrapped caption and usable custom footer on bright animated background. | Not a catalog-wide availability guarantee; full end/interruption/slow-network matrix incomplete. |
| Native Low Top, Safari 26.3.1 / macOS 26.3.1 | Real native Safari Play reached **Playing** with elapsed 0:49/4:39; Pause at about 0:55; resume returned Playing, then home navigation exited radio. Safari's native tab audio indicator was present. | Slider setValue attempt did not move its value; Safari seeking remains unverified, not a diagnosed product failure. No physical iOS inference. |
| Low Top → SDM2 selector change | URL/artwork/support changed; controls and progress reset during loading. Metadata resolved actual track **EU PULO — Rxfx, Clementaum & MC Indiazinha**, distinct from release SDM2. | Actual SDM2 Playing state/colored-layout proof remains unverified; a later test-tab route change prevented completing that check. Featured/fallback classification is fixture-proven, not inferred from UI title. |
| Synthetic-media prototype, in-app browser | Actual player reached Playing, live low-band diagnostic about 0.56; Pause produced zero bands around 0.34 s; seek to 4 s and resume showed 4.00 s. | WAV/loopback proof only. Later end state was not conclusively verified; do not call end-of-track/device/CDN/MP3/AAC/HLS passed. |

Screenshots: `output/remediation/native-player.png` records native Playing with INFO open; `output/remediation/custom-player-preserved.png` records the final paused native interface with INFO closed and default viewport restored. Both are local development evidence, not screenshots of a deployed change.

At the earlier handoff, reconciliation checked all 57 register IDs against the outcome table, temporary production/synthetic-media servers were stopped, and a paused local development review tab was retained. The shared-player follow-up below records subsequent activity; this historical cleanup statement does not describe the final follow-up tab/server state.

## Site-wide player and Credits follow-up

The owner authorized persistent native playback while browsing and release credits inside the player. The root layout now supplies the full effective catalog to one `SitePlayerProvider`. **Play preview** activates its native runtime without navigation. Artwork opens release detail; **Visualizer** expands the existing runtime and **Browse** returns to the archive. Selection replaces the current preview, while ordinary internal navigation retains its source/position. The optional official player is still separate. Credits uses exact release metadata/source text/notes/informational tracks and exposes honest missing-credit states; it does not fabricate per-track contributors or a playable track queue.

Executed on the local native development server in the in-app browser:

| Action | Observed result | Scope / remaining limit |
|---|---|---|
| Low Top Playing on archive → roster → AMAL → Credits → Full release page → Visualizer | Progress **2:05 → 2:08 → 2:11 → 2:12 → 2:29 → 2:29**, with Playing/source retained. Credits remained Low Top's current-release notes while reading AMAL. | Specific desktop IAB native state/position evidence; hosted delivery, heard-track identity and full physical-device lifecycle remain unverified. |
| Credits at 375×812 viewport | Drawer fit with scrollable body, stationary Close/header, and two-row compact bar. | Browser viewport layout check; physical device/onscreen keyboard and full drawer keyboard/empty-state review remain pending. |
| Compact player at 320×568 viewport | No horizontal overflow: document scrollWidth **305**, viewport **320**. | Specific browser viewport only, not mobile-device certification. |
| Mobile menu → Artists during Low Top playback | Open menu isolated the compact bar; Artists navigation dismissed it/restored the bar. Low Top remained Playing with progress **214 seconds**. Compact DOM had **zero canvas elements**. | Observed menu/navigation continuity and compact rendering; no general OS interruption or performance claim. |
| Select SDM2 from the bar while on `/roster`, then Play | Page stayed `/roster`; old Low Top stopped, identity loaded, new preview Paused at **0:00**. Play began **EU PULO**. | One deliberate replacement sequence; rapid-selection/late-response real-browser checks remain unexecuted. |
| With SDM2 Playing, navigate to archive and click Low Top artwork/detail | SDM2 stayed selected/Playing, position about **0.5 seconds**, while the Low Top detail opened. | Artwork/detail browsing does not implicitly choose the viewed release. Full device/history/race matrix remains open. |
| Final code: archive Play preview on the same paused SDM2 selection → roster → Visualizer → Back → Forward → Credits | SDM2 Playing **0.3/2:52 → 4.2 seconds → 8.5 → 8.8 → 9.3**, with literal multiline SDM2 source credits visible. | Observed same-selection activation and internal history continuity after final code. Real rapid different-release selection/late response and forced failed-metadata retry remain unexecuted. |
| Credits at 640×320 short-landscape viewport; Escape | Close/header and scrollable body fit; Escape closed the drawer and returned focus. | Specific browser viewport/focus observation; complete keyboard/physical-device matrix remains open. |

Screenshots: [artist Credits](../../output/remediation/persistent-player-artist-credits.png), [expanded visualizer](../../output/remediation/persistent-player-visualizer.png), [375px Credits](../../output/remediation/persistent-player-mobile-credits.png), [320px compact bar](../../output/remediation/persistent-player-mobile-320.png), [final visualizer Credits](../../output/remediation/persistent-player-visualizer-credits.png), [short-landscape Credits](../../output/remediation/persistent-player-landscape-credits.png). These are local development captures; no production publication was performed. Final checks passed: lint, TypeScript, **97 tests**, diff check, and explicit local-content production build with **44 pages**. Final browser warning/error logs were empty. The review tab was left **Paused at 0:42/2:52 with SDM2 Credits open**, marked as a deliverable.

Implemented final lifecycle safeguards allow retry of failed metadata for the same release, suppress duplicate same-slug starts while loading, and use play-operation tokens against stale completions. New engine unlock/clearSource and dormant ordinary-entry SSR regressions pass. A browser metadata failure/retry was not forced; these code/fixture results do not certify the remaining real-network race scenarios or audible output on untested devices.

## Subsequent INFO cleanup

The user then requested plain INFO wording that previews still come from Bandcamp, removal of diagnostic/development copy and the RGB test, removal of the INFO official-player action, and removal of the technical analyser/reduced-motion paragraph. The unused visual-test handler/state/timer were removed; loading/failure and ARIA wording now use plain preview/Playback language. The custom-bar fallback remains only for unavailable/failed native previews; audio delivery/control engine and persistence are unchanged.

After this edit, repository lint, TypeScript, **97/97 tests** and diff check passed. Current browser INFO review confirmed the plain Bandcamp-source/persistence text and absence of the removed official-player button, development copy, RGB control and analyser paragraph. The [INFO screenshot](../../output/remediation/radio-info-cleanup.png) was reviewed. The earlier **44-page production build** remains historical; no new build was needed/run for this reversible copy/control removal. No production publication occurred.

## Required matrix still open

| Platform/scenario | Executed evidence | Remaining check |
|---|---|---|
| Desktop Safari | Actual native Low Top start/pause/resume/exit | Seeking/end, release/history switching, unavailable/iframe path, keyboard menu, reduced motion, GPU fallback and network interruption. |
| Desktop Chrome/Edge | No installed/connected real browser available; simulated API fixtures only | All actual browser/capture scenarios. |
| iOS Safari / Android Chrome | No real-device access; 390 px responsive viewport only | All physical-device controls/audio interruption/resume/history/layout/motion/fallback scenarios. |
| Featured + first eligible fallback | Deterministic preview-selection fixtures; live Low Top and SDM2 identity observed | Confirm actual upstream featured/fallback cases in each release/browser; do not mutate third-party metadata to manufacture evidence. |
| Unavailable native/invalid selection | Real production native-disabled and invalid/duplicate selection states | Actual upstream disappearance/recovery and same-release optional iframe play. |
| Shared native navigation / Credits / artwork detail | Current IAB continuity/history sequences, 375/320/640-landscape layouts, Credits Escape return, menu navigation and explicit SDM2 replacement/detail-browse checks | Missing-credit browser state/complete keyboard, rapid different-release/history/late response, native-disabled shared-layout browser retest, full departure and physical-device extension. |
| Slow network, rapid change, stale promises, end-of-track | Restriction/timeout/abort fixtures and simulated lifecycle cases | Real throttled network and physical-device interruption/end observations. |
| Capture denial/grant/late permission/unsupported | Explicit simulated APIs, local/unrecorded/unsent/no replay reviewed | Real supported desktop picker and actual unsupported-browser path. No permission was granted during this audit. |
| Missing artwork | Source fallback and renderer fixtures | Actual missing-artwork browser/layout case without altering production records. |
| Reduced motion initially/live preference change | New simulated static-render/no continuous RAF/audio/RGB tests detect original defect | Actual OS preference and browser/device behavior. |
| WebGL allocation/context loss | New simulated fallback/disposal tests detect original defect | Actual GPU/browser context loss, controls/artwork layout and device recovery. |
| Contact pending/failure/input retention | Server fixtures/source inspection; real unavailable form and rejection HTTP | Authorized staging browser/provider execution plus independently confirmed inbox receipt. |
| Editor save/publish/cache/refresh; sync→commit→deploy→served | Local fixtures/auth HTTP and workflow/source audit | Actual authorized editor/operator records, measured timings, run IDs/SHA/deployment IDs. |
| Listener/editor task study | Ready protocol in [decisions-and-evaluation.md](decisions-and-evaluation.md) | Authorized participants; no observations or impact invented. |

## Text contrast and design limits

Calculated WCAG sRGB relative luminance with `(lighter + 0.05)/(darker + 0.05)` for explicit text against opaque `#262626`:

| Text color | Ratio |
|---|---|
| `#999` | 5.31:1 |
| `#aaa` | 6.51:1 |
| `#b8b8b8` | 7.63:1 |
| `#c6c6c6` | 8.86:1 |
| `#ddd` | 11.14:1 |
| `#eee` | 13.04:1 |
| `#fafafa` | 14.50:1 |
| `#fff` | 15.13:1 |
| Earlier development visual-test `#d3b3ff` (control removed by latest INFO cleanup) | 8.40:1 |

Normal text uses a provisional 4.5:1 target; the owner has not confirmed a complete conformance target. Disabled-opacity controls, transparent corner navigation, all focus indicators/themes and physical devices are not covered by these ratios. Captions, selector/status, native transport and INFO use stable opaque backings independently of shader brightness. No text shadows, outer glows or text drop-shadow filters were added. Bright/gray native layout was visually checked; colored artwork, missing artwork and all-palette conformance remain unverified.

## Evidence boundary and release gate

**Conditional Go** for local review or explicitly configured staging using local content, authorized persistent native-preview/Credits and sourced artist profiles, and honest unavailable contact/native states. **No-Go** for the intended connected production release until CMS HTTP 404 is corrected; approved mail/fallback and receipt are verified; remaining release mappings/identity/policy and ownership decisions are resolved; connected editorial publish/refresh/deployment proof and the required browser/device matrix are complete. See [outcomes.md](outcomes.md) for precise prerequisites and rollback. Local checks do not authorize production changes or certify untested external services.
