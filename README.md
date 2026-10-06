# Hochi Runs

Next.js website for the label’s release archive, artists, and events. Bandcamp handles music playback, purchases, and purchased downloads. WordPress supplies editable content through the Content Bridge plugin.

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

As of October 6, 2026, the repository is private. The production domain is attached to Vercel through Cloudflare DNS, but Vercel billing suspension prevents public access. The hosted test WordPress plugin needs ZIP reinstallation and a publishing check. Production has no CMS environment settings configured. Shop navigation is disabled; its underlying code and forms remain. Contact delivery needs private mail-service settings and testing; About and Legal contain placeholders.

Generated screenshots, recordings, invoices, and guide renders belong outside the source package. The optional demo recreates its private blueprint in the ignored `output/` directory when explicitly run.

Coding agents must follow `AGENTS.md` and read the relevant guides in `node_modules/next/dist/docs/` before changing Next.js code.
