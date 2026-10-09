# Remediation register — October 9, 2026

Source: the complete user-supplied “HOCHI RUNS — NOTE-DRIVEN ENGINEERING REMEDIATION” attachment, sections 1–14. Historical statements are reports, not current defect findings. This register was established before implementation; final dispositions and changed files will be reconciled in `outcomes.md`. No additional companion note file or internal Page was available.

Revision: `3a199d372b143c5cfb17b96679b80675a67c2bdc`. Initial user changes: radio page, radio component/CSS, visualizer (304 insertions / 74 deletions). Preserve these. Next 16.2.7 / React 19.2.4. Initial shell Node 20.19.4 (project recommends 22); installed Node 22.23.2 available. Baseline: 75/75 JS tests, lint, TypeScript pass; production build pending at inventory time.

P1 = release-critical experience/security/content honesty; P2 = important robustness/editorial operation; P3 = planned architecture or validation. Type D = reported/current defect, F = feature gap, V = validation, O = owner decision. Dependencies name other issue IDs or required approvals/access. Each acceptance target is independently assessable. Investigation statuses below are superseded only by the evidence-backed final outcomes table.

Later owner direction explicitly authorized site-wide native-preview persistence and release Credits. This supersedes L01's initial unused-provider/stop-on-route-exit recommendation and updates L02/P03/O01: Play preview starts in place, a shared root provider retains audio during ordinary internal navigation, artwork opens detail, Visualizer expands the same player, and selection replaces the current preview. Future owned-media unit, rights, queue/programming and production delivery remain unapproved. Current execution evidence is in [verification.md](verification.md#site-wide-player-and-credits-follow-up).

| ID | Source / type / priority | Report and current evidence / root cause or hypothesis | Acceptance target | Dependencies | Initial status |
|---|---|---|---|---|---|
| B01 | §1,10 V P1 | Repository exists; four user-modified radio files; baseline revision/deps captured | Preserve user edits, record commands and preexisting failures | none | Resolved and verified |
| B02 | §1 V P2 | Historical 23/7/19/18 counts require current audit | Recount full effective local catalog + explain CMS limits | CMS read access | Partially resolved |
| A01 | §2 F P1 | AMAL profile has only two explicit local links; other same-name imports are insufficient identity proof | Publish only confirmed AMAL mappings; list proposed/unresolved | owner relationship approval | Requires owner decision |
| A02 | §2 F P1 | Hit Dat lacks explicit multi-member associations | Confirm collaborator identities then show every confirmed profile without duplicates | owner relationship approval | Requires owner decision |
| A03 | §2 V P1 | Local slugs/memberSlugs + artist releaseSlugs coexist; precedence needs audit | Merge/override tests retain stable URLs, curated entries, explicit mappings; explicit empty respected | none | Partially resolved |
| A04 | §2 D P1 | Placeholder AMAL/roster biographies are public local content | Honest missing biography state; approved replacement only | owner biography approval | Partially resolved |
| A05 | §2 F P2 | Names serve as roster-photo placeholders | Intentional absent-photo treatment; approved real photographs only | approved assets | Requires owner decision |
| C01 | §3 V P1 | Form/server/Resend route exists with origin/schema/body/honeypot checks | Invalid/injection/oversize submissions never send; error privacy | none | Partially resolved |
| C02 | §3 F P1 | Resend sender/key configuration not yet established | Authorized sender/provider test accepted for correct fixed private recipient | provider access, sender approval | Blocked |
| C03 | §3 F P1 | No approved public fallback email found | Approved usable destination visible when delivery absent | owner fallback approval | Blocked |
| C04 | §3 D P1 | Pending/success/failure and retained input need wording/audit | No false success/receipt claim; input retained after failure and unknown response | none | Partially resolved |
| C05 | §3 V P1 | Provider acceptance cannot establish inbox receipt | One authorized inquiry and separate recipient-confirmed receipt evidence | C02, approved test inquiry | Blocked |
| L01 | §4 O P1 | Initially unused shared provider; later owner explicitly authorized native persistence + Credits | Shared root runtime retains native playback during ordinary navigation; release selection replaces it; exact-source credits accessible | desktop/mobile/lifecycle checks; future owned rights separate | Initial decision superseded; see outcomes |
| L02 | §4 F P1 | Feed/detail only link to release/platform | Listen entry from feed, standard and prototype detail with matching ?release URL | radio contract | Not started |
| L03 | §4 F P1 | Release choice hidden in INFO | Discoverable selector + playing/release/support identity | radio UI | Not started |
| L04 | §4 D P1 | Invalid requested slug falls through to first release | Invalid/unavailable has explicit recovery; selection/back/forward agree | radio routing | Not started |
| P01 | §5 D P1 | Native selection featured/fallback track, display only release | Same resolved selection drives selected-track title/credit + pinned audio; honest release preview if unknown | preview core | Not started |
| P02 | §5 V P1 | 16 original preview restriction fixtures currently pass | Private/subscriber/exclusive/origin/range/timeout/abort/stream protections retained | none | Already satisfied/not applicable with evidence |
| P03 | §5 V P1 | Switching/lifecycle races not yet exercised at inventory | Loading/pause/resume/seek/end/switch/stale responses; ordinary navigation retains media, full departure/unmount tears down | native browser | Not started at inventory; scope updated |
| P04 | §5 V P1 | Official iframe alternative exists | Disabled/unavailable native can recover to iframe; label iframe identity observability limits | browser + upstream | Not started |
| P05 | §5 V P1 | Optional tab capture exists | Explicit permission; local/unrecorded/unsent/no replay; denial/unsupported leaves controls usable | browser capture support | Not started |
| P06 | §1,5 V P2 | Three bands/palette direct renderer path; ambient without analyser | Distinguish ambient vs reactive; no per-frame React meters; no upload/queue implication | radio UI | Partially resolved |
| X01 | §6 D P1 | Radio labels cross shader bright areas | Opaque stable backing; measured >=4.5:1 text target, no glows/shadows; palettes/narrow/focus | owner can change contrast target | Not started |
| X02 | §6 D P1 | Archive menu lacks radio's Escape/focus/isolation behavior | Named dialog, initial/trapped focus, Escape, inert/scroll lock/return + route/resize cleanup | real browser | Not started |
| X03 | §6 D P1 | Reduced motion freezes clock but redraws/audio colors continue | Static bands/color/time/no burst; redraw only necessary updates; live preference changes | visualizer | Not started |
| X04 | §6 V P2 | WebGL initialization/context loss not yet tested | Artwork/metadata/audio work after init/loss; resources released | browser simulation/device | Not started |
| S01 | §7 D P1 | Test cosign triggers RGB; BUY outbound only | Clearly visual test or dev-only; support remains referral, no purchase reaction claim | radio UI | Not started |
| S02 | §7 O P2 | Shop disabled; four unlinked local products, no checkout | Honest navigation/showcase availability; inclusion/links approved before expansion | owner scope + approved URLs | Requires owner decision |
| S03 | §7 O P2 | One Videos route, no chrome nav/CMS model | Retain truthful local selection + actual YouTube destination; decide inclusion/model | owner scope | Requires owner decision |
| E01 | §8 O P1 | Placeholder About; identity label/collective/agency unclear | Publish approved identity + audience actions through CMS; unfinished local fallback honest | owner identity copy | Requires owner decision |
| E02 | §8 O P1 | Legal placeholder, no approved policy | Clear unpublished state; approved policy via CMS only | owner policy | Requires owner decision |
| E03 | §8 O P2 | Working credit only; no final collaborators evidence | Confirm names/roles; avoid invented sole authorship | owner credits | Requires owner decision |
| E04 | §8 V P2 | Catalog influence/local reconstruction; license/privacy claims require evidence | Verify primary repository/license; no Hochi open-source claim absent evidence | public upstream + repo permissions | Not started |
| E05 | §8 V P2 | Lot/Decimal, Surf/TAW, Dweller are influences only | No borrowed capability/provider/FM/scale/outcome claims | source audit | Not started |
| E06 | §8 V P2 | README October 6 suspension claim historical | Current public check with limits; no inference about billing/CMS/deploy health | public network + operator | Not started |
| W01 | §9 V P1 | Local/artist-only/full bridge modes exist | Mode exclusivity, mapping, published filtering, authoritative empty + failures covered | fixture tests | Partially resolved |
| W02 | §9 V P1 | 60s revalidation + optional bearer webhook exist | Unauthorized rejected; cache expiry distinguished from explicit expire:0 | local route + fixtures | Partially resolved |
| W03 | §9 V P1 | Config exists; real editor session not proven | Authorized publish→served content + observed timing; no draft exposure | real editor/staging access | Blocked |
| W04 | §9 V P2 | Hourly workflow exists | Inspect permissions/commit/no-change/deploy hook/failures; isolated imports repeatable | repo workflow | Partially resolved |
| W05 | §9 V P1 | Real sync→commit→deployment→served chain not proven | Authorized trace with run/commit/deploy IDs and served snapshot, failures/no-change | operator access | Blocked |
| W06 | §9 F P2 | Owner needs concise operational procedure | Editing + catalog refresh runbooks exact config/rollback/failure instructions | W01–W05 | Not started |
| V01 | §10 V P1 | Historical fixtures distinct from current 75 baseline | Execute current tests + regressions, show original defect fails where practical | implemented fixes | Partially resolved |
| V02 | §10 V P1 | Baseline lint/tsc pass; build pending | Exact final lint/type/test/build outcomes; no suppressed assertions | final changes | Partially resolved |
| V03 | §10 V P1 | Historical one-browser Low Top Vanz smoke insufficient | Separate native/iframe actual/simulated matrix Safari/Chrome/Edge/iOS/Android and all listed scenarios | devices/access + upstream | Not started |
| D01 | §11 O P3 | Archive DB and own delivery planned, WP editorial current | Choose listening unit with rights/maintenance/journey justification | owner journey/media rights | Requires owner decision |
| D02 | §11 F P3 | No dedicated relationship schema | Decision-ready artist/release/track/credit/art/media/state/provenance/URL model | D01 recommendation | Not started |
| D03 | §11 F P3 | Existing snapshot/curation/WP need migration | Precedence, idempotency/quarantine/validation/staging/backfill/rollback/URL preservation | D02 | Not started |
| D04 | §11 F P3 | Transport undecided; HLS under consideration | Playback contract; progressive vs HLS; only necessary scheduling/auth/queue requirements | D01 + rights | Not started |
| D05 | §11 V P3 | Authorized media browser/analyser compatibility not proven | Non-destructive generated-media POC or exact ready test; distinguish prototype from shipped service | test runtime/rights | Not started |
| D06 | §11 O P3 | Vendor/owner/rights/migration prerequisites unresolved | Named responsibility roles + explicit approvals before commitments/ingestion/prod migration/WP change | owner/vendor/media decisions | Requires owner decision |
| O01 | §12 O P2 | Primary journey undecided | Recommendation/interim/tradeoff/approval logged | owner | Requires owner decision |
| O02 | §12 O P1 | Label/collective/agency undecided | Recommendation/interim/tradeoff/approval logged | owner | Requires owner decision |
| O03 | §12 O P1 | Relationship/bio/event/override maintainer not named | Role ownership proposal + specific assignee approval | owner | Requires owner decision |
| O04 | §12 O P2 | Success not defined | Candidate discover/context/referral/inquiry/editor measures with no tracking added | owner | Requires owner decision |
| U01 | §12 V P2 | No participant evidence | Ready listener/editor tasks; execute only authorized people; no invented results | participants/access | Blocked |
| U02 | §12 V P1 | Actual observability limited | Outbound click=referral; iframe playback/purchase not inferred; no silent telemetry | source audit | Not started |
| R01 | §13,14 V P1 | Entry paths verified, imports followed by workstream owners | Full source reconciliation + outcome/change/verification/decisions/ADR/release verdict | all IDs | Not started |

Additional discoveries are kept separately in the outcome report and linked to affected source IDs. Approval/access absence does not block independent local work. The owner’s clarification response was “N/A”; it supplies no new approved copy, relationship, address, participant, or production action.
