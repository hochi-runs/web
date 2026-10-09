# Hochi Runs

Next.js website for the label’s release archive, artists, and events. Bandcamp supplies public music previews, purchases, and purchased downloads. WordPress supplies editable content through the Content Bridge plugin.

## Local development

Use Node.js 22 and npm. Repository access is required.

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). React and Next.js install with the project dependencies.

Copy `.env.example` to a private `.env.local` when configuring integrations. Leave both WordPress source URLs empty to use the saved site content. For the full plugin, set `WORDPRESS_CONTENT_URL` to the canonical HTTPS `/wp-json/hochi/v1/content` endpoint; leave the alternative artist-only URL and local-demo flag empty. Keep private settings out of Git and shared archives.

## Project files

- `src/`: pages, components, content defaults, and integration code.
- `public/`: website artwork, logos, event flyers, and merchandise images.
- `wordpress/`: plugin source, bundled import assets, tests, and installable ZIP. See [plugin instructions](wordpress/hochi-content/README.md).
- `scripts/`: catalog import, packaging, tests, and the optional isolated WordPress demo.
- `.github/workflows/bandcamp-sync.yml`: hourly Bandcamp metadata sync in GitHub Actions.

WordPress’s bundled flyers duplicate selected `public/` assets so a new installation can import them independently. `initial-content.json` is the plugin’s starting content snapshot.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run test:catalog` | Run JavaScript checks |
| `npm run lint` | Check source style |
| `npm run build` | Build the website |
| `npm run start` | Serve an existing production build |
| `npm run sync:bandcamp` | Refresh the saved public catalog metadata |
| `npm run package:wordpress` | Rebuild the plugin snapshot and ZIP |
| `npm run demo:wordpress` | Start an isolated local editing demo; requires Node.js 24.18+ |

The Bandcamp importer stores metadata in `src/data/bandcamp-catalog.json`; builds read this snapshot. WordPress edits do not upload music to Bandcamp. A changed snapshot needs a successful website deployment before WordPress can receive updated release choices.

## Current setup

The October 9 release removes Layout X-Ray from the app and repository tooling. Release checks passed: repository lint, all 98 tests, and a production-configured build generating 44 pages. The Vercel `hochi` project deploys `hochi-runs/web` from `main`, with bundled catalog content and the existing native-preview origin configuration.

On October 9, 2026, a live browser check loaded the public archive at [hochiruns.com](https://hochiruns.com/). The older hosting-suspension observation is historical; this check does not establish billing status, deployment reliability, or editor access. This checkout's configured full WordPress endpoint returned HTTP 404 during a production build. An explicit local-content build succeeded. A real editor publish and catalog-sync/deployment trace are still required.

Contact delivery needs a verified sender and mail-service key, an authorized test, and confirmed recipient receipt; no public fallback address has been approved. Seven local artist profiles now use sourced biographies, verified public profile images and official links, following the owner's research instruction. About and Legal copy remain unpublished. Shop is absent from navigation until scope and purchase destinations are approved; its existing merchandise reference page remains. Videos retains a local selection and YouTube destination, with navigation/CMS expansion awaiting a scope decision.

The archive keeps a straight artwork column with title and artist revealed on hover or keyboard focus, and visible on touchscreens. Clicking artwork is its single action: open the matching visualizer at `/beta/radio?release=<slug>` and request playback from that user gesture. The separate archive Play preview/Visualizer buttons are removed; release-detail **Play preview** remains available to start the shared player in place. **Credits** links directly to the selected release's dedicated page, and **Browse** returns to the archive. The same player spans the full viewport width, flush to the bottom edge on every page: light archive colors outside the visualizer and a dark `#262626` surface inside it. Its controls, INFO control and artwork caption have transparent backgrounds without borders; actual panels retain their surfaces. One responsive bar layout uses 56px on desktop and 100px below 900px, plus bottom safe-area clearance. The root layout retains the player during ordinary internal navigation and compact/expanded view changes. Changing releases stops/replaces the current preview; full page reload or departure ends this in-memory session. A browser that blocks the playback request leaves the bar's Play control available.

This is one selected eligible preview, with no queue or continuous broadcast. Owned-media hosting, recording rights and the future delivery unit remain pending decisions. Public native previews retain exact deployment-origin and eligibility checks; the official Bandcamp player remains a separately chosen alternative with its own controls. Support links are outbound referrals, not confirmed purchases. Reduced motion uses a static visual treatment while audio controls remain usable. Lint, TypeScript and 97 tests passed again after the simpler INFO copy/control cleanup. The earlier 44-page production build predates that edit; the verification report records desktop navigation/history and narrow/landscape viewport checks separately from unexecuted forced-network-failure and physical-device scenarios.

See [remediation outcomes](docs/remediation/outcomes.md), [verification](docs/remediation/verification.md), [operator procedures](docs/remediation/contact-operations.md), and the [archive/audio decision record](docs/remediation/architecture-decision.md) for evidence, open approvals, and release limits.

## Credits and influences

“Creative development and platform architecture” is a working role description (“creative developer” is the short form). Final names, roles, and visual/editorial collaborators require owner confirmation. Catalog Radio is a study source; Hochi's renderer is an original local reconstruction, and does not bundle Catalog's application, logo, or audio. [Catalog's public radio repository](https://github.com/catalogworks/catalog-radio-public) identifies its license as MIT. No license file granting public reuse was found in this Hochi checkout; `package.json` is private, and GitHub repository visibility was not independently authenticated. Do not describe Hochi as open source on that evidence.

Lot Radio/Decimal, Surf Gang/TAW, and Dweller are references or personal influences, not evidence of Hochi's transport, providers, FM implementation, audience, revenue, or usability outcomes. Catalog counts describe content, not reach.

Generated screenshots, recordings, invoices, and guide renders belong outside the source package. The optional demo recreates its private blueprint in the ignored `output/` directory when explicitly run.

Coding agents must follow `AGENTS.md` and read the relevant guides in `node_modules/next/dist/docs/` before changing Next.js code.
