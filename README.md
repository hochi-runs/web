# Hochi Runs

Next.js website for the label's release archive, roster, videos, shows, and merch. Music purchase links lead to Bandcamp, which handles checkout and purchased downloads.

**Start with [the developer handoff](HANDOFF.md)** for account access, deployment, connecting `hochiruns.com`, costs, and remaining work.

## Run locally

Use Node.js 22, as specified in `.nvmrc`, and npm.

```bash
git clone https://github.com/hochi-runs/web.git
cd web
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). Private repository access, if applicable, must be granted first.

The original local content works without environment variables. For WordPress content, copy `.env.example` to an ignored `.env.local`, choose one mode below, and restart the development server. Keep connection settings and secrets out of Git.

## Try the full owner-editing demo locally

Use Node.js 24.18 or newer for the official WordPress Playground CLI; the website itself still recommends Node.js 22. After `npm ci`, run:

```bash
npm run demo:wordpress
```

The launcher starts a temporary WordPress editor at [127.0.0.1:9401](http://127.0.0.1:9401/wp-admin/admin.php?page=hochi-runs) and the connected Next.js preview at [127.0.0.1:3001](http://127.0.0.1:3001). It seeds the current roster, sample products/event/About text, and catalog choices. Release-editing records begin as drafts, so publish an override only when you want to change that release's website display. The extended demo is local and has not been deployed.

1. Open **Hochi Runs → Artists**, edit Amal's biography or release checkboxes, and click **Update**. Check the connected `/roster/amal` page.
2. Open **Releases**, choose a release, edit its website description, credits, links, or associated artists, and click **Publish**. Check its release page and artist pages. Test the hide checkbox, then restore it.
3. Open **Hochi Runs → Appearance**, change a color or choose a Media Library image, and save. Reload the preview to see the supported branding changes.
4. Use **Shop**, **Live**, and **Website Pages** for merchandise, events, and About/Legal text.

Press **Ctrl+C** to stop the demo. Its WordPress edits reset when restarted. The launcher leaves ignored `.env.local` unchanged and configures only its child development process. First use needs internet access to download the Playground runtime. It requires no WordPress.com purchase.

To generate the private blueprint without starting either server:

```bash
npm run demo:wordpress -- --prepare
```

The blueprint in `output/wordpress-demo/blueprint.json` contains a temporary local connection secret. Keep it private and out of Git. The loopback-only launcher, anonymous public content feed, and artist/release/appearance/event/merch editing flow were verified on October 3, 2026. Local proof screenshots: [artist editor](output/wordpress-demo/artist-editor.jpg), [Appearance editor](output/wordpress-demo/appearance-editor.jpg), and [connected site preview](output/wordpress-demo/site-preview.jpg). These generated screenshots are in the ignored output folder, rather than the GitHub source or earlier handoff archive.

## Check and build

Run these commands separately:

```bash
npm run test:catalog
npm run lint
npm run build
npm run start
```

`test:catalog` runs the catalog, WordPress adapter, and webhook tests in `scripts/*.test.mjs`. The last command starts the production server after a successful build. The build downloads JetBrains Mono through `next/font/google`, so it needs access to Google Fonts. Visitors receive the resulting font assets from the site.

## Automatic Bandcamp updates

The importer reads the public [Hochi Runs catalog](https://hochiruns.bandcamp.com/music) and its listed release pages. It saves only display metadata in `src/data/bandcamp-catalog.json`: titles, artists, dates, public artwork, track titles and durations, credits, and purchase links. It never downloads audio files or saves the raw HTML or player data.

```bash
npm run sync:bandcamp
npm run sync:bandcamp:check
```

The first command refreshes the snapshot. The second validates the current upstream catalog without writing; it exits with status 1 if the snapshot differs or validation fails. Builds use the saved snapshot, so an upstream outage does not prevent the site from building.

`.github/workflows/bandcamp-sync.yml` schedules an hourly sync at minute 17 and supports manual runs. When metadata changes, it commits the snapshot to `main`. The connected host must deploy that commit, or a deployment hook must be configured. **The schedule becomes active only after the workflow is pushed to the default branch and GitHub Actions is enabled.** See the handoff for bot permissions, deploy hooks, and scheduling limits.

Existing `HR` codes and release URLs are preserved through `src/data/releases.ts`. New releases use their stable Bandcamp IDs for codes and site URLs. The manually curated archive remains available if older releases leave Bandcamp's public grid; removal from that archive is an editorial change.

## Edit content in WordPress

The site has a server-side WordPress content adapter. WordPress provides published content and supported branding settings; Next.js renders the website. The full owner forms were tested on the paid WordPress.com test site. That test installation currently needs the ZIP reinstalled, as described under Hosted recovery pending. Vercel uses the local content defaults until the hosted feed is restored and deliberately connected. There are two connection modes, and they cannot be enabled together.

### Free WordPress.com artist demonstration

This artist-only mode was originally tested on the free `hochirunstransfer.wordpress.com` site with the managed route `amal`. The same account has since been upgraded to Personal for the full plugin test below. This mode reads ordinary published posts for explicitly managed artist routes; it is separate from the full plugin connection, and production hosting has not been configured or verified.

```dotenv
WORDPRESS_ARTISTS_URL=https://public-api.wordpress.com/wp/v2/sites/hochirunstransfer.wordpress.com/posts
WORDPRESS_MANAGED_ARTIST_SLUGS=amal
```

For the managed artist's post:

1. Set **Title** to the artist's display name.
2. Set **Excerpt** to a short role, such as `DJ / Producer`. Set it explicitly so WordPress does not generate a role from the biography.
3. Write the biography in the main post body. The site displays plain text in its existing biography area.
4. Set **Featured image** to the artist photo if desired.
5. Keep the post's URL slug `amal`, then **Publish** or **Update**. Changing the display name does not require changing this slug.

Publishing content needs no GitHub push. Unpublishing a managed artist removes that artist from the roster and makes its profile unavailable after the site's cache refreshes. Other existing artists and all merch, shows, About, and Legal content keep their local values. Drafts, private posts, unrelated posts, and password-protected posts are excluded. Adding another managed artist requires the developer to update the managed-slug setting and restart or redeploy the website. This mode does not provide full content forms, artist socials, or editable release relationships.

### Full content forms on a plugin-capable WordPress site

Install **Hochi Runs Content Bridge**, supplied as `wordpress/hochi-runs-content-bridge.zip`, on a WordPress installation that supports custom plugins. Free WordPress.com cannot install it; all its paid plans, including Personal, support [custom plugin installation](https://wordpress.com/support/plugins/install-a-plugin/). The test account was upgraded to the US$9 monthly Personal plan on October 4, 2026, and the ZIP was installed successfully. Check the [current pricing](https://wordpress.com/pricing/) before choosing another hosted plan. The plugin adds **Hochi Runs** forms for artists, merchandise, shows, releases, and About/Legal text, plus an administrator **Appearance** screen. Its **Connection** screen gives the public content URL to set as `WORDPRESS_CONTENT_URL` in the website's server environment. Leave the native artist URL and managed-slug setting empty in this mode.

Before enabling the full plugin connection, open **Hochi Runs → Setup → Import existing site content**. The ZIP bundles the current repository's artists, merchandise, events, About/Legal text, and release choices. Existing matching WordPress entries, including drafts and Trash, are skipped; appearance settings and owner edits are preserved. Release editorial entries start as drafts, while artist/shop/event/page records are published. Review the existing placeholder bios and text before handoff. Its published collections replace local collections, including when a collection is empty.

The owner menu contains **Artists**, **Releases**, **Live**, **Shop**, **Website Pages**, **Appearance**, and **Connection**. An artist has a display name, stable website slug, role, biography, photo URL, social links, and release checkboxes when the catalog is loaded. The slug locks after first publication to keep links stable. An explicit release selection controls that artist's releases, including an empty selection showing none. Without a loaded catalog, the plugin retains the release-route text field and existing selections. **Shop** forms have a name, price, image URL, and purchase URL. **Live** forms have a date, venue, city, ticket URL, and optional flyer image. Use **Choose image** for a Media Library upload or **Copy linked image to Media Library** to store a direct public image URL on WordPress. **Website Pages** forms contain paragraphs for About or Legal. Publish or update the relevant record; no GitHub push is needed for these content changes.

Use a WordPress **Editor** or **Administrator** role for the shared catalog. The two association forms update related records only when the editor can edit those records. Administrator access is required for Appearance, Connection, and plugin installation.

Release forms edit the website's description, category (`Album`, `Single`, `EP`, or `Compilation`), tags, credits, extra streaming links, associated artists, and visibility. They attach to an existing catalog release and show its Bandcamp details as a read-only reference. Bandcamp still supplies its title, primary artist, date, artwork, tracks, and purchase URL; its source, audio, and checkout are maintained separately. Hiding a release removes it from the website's feeds, artist pages, and direct release route while leaving Bandcamp unchanged. Unpublish an override to return its editorial fields to catalog defaults; artist-form selections remain separately editable.

The **Appearance** screen changes background, text, accent, muted-text, and border colors; the header logo; the background watermark; a background image; and watermark opacity from 0 to 0.3. Hosted image URLs must use public HTTPS and end in a supported raster extension (`jpg`, `jpeg`, `png`, `gif`, `webp`, or `avif`). Upload an image to WordPress's Media Library and paste its File URL. Empty appearance fields keep the existing defaults. These controls retain the Next.js layout; navigation, spacing, new sections, and page structure remain code changes.

The version-1 content API accepts optional `releaseOverrides` and `appearance` fields alongside artists, products, shows, and pages. Omitting an editorial field preserves its catalog value; an empty description or list clears that website field. A blank release category keeps the catalog category. An empty override list preserves the catalog. Older feeds without either optional field still work.

The administrator also saves `https://YOUR-WEBSITE/api/wordpress/catalog` on **Setup** and clicks **Refresh release choices**. This public metadata feed reads the underlying catalog independently of WordPress and includes hidden releases for editing. WordPress refreshes its saved reference choices through hourly scheduled checks and artist/release editor visits, throttled to once every five minutes. WordPress scheduling depends on traffic; the manual button requests an immediate refresh. New choices appear after the hourly GitHub Bandcamp sync and a successful website deployment. Refresh preserves owner edits and selections, does not publish editorial overrides or assign new releases, and keeps the previous catalog on failure. The private publish secret is separate; there is no public write/import endpoint.

Run `npm run package:wordpress` before a new handoff to regenerate the bundled source snapshot and ZIP. Use `npm run demo:wordpress -- --empty` for a free local test of the actual Setup import, then save `http://127.0.0.1:3001/api/wordpress/catalog` as the demo catalog URL. This explicit local mode permits that loopback address; production requires public HTTPS.

Installing the plugin on another WordPress site does not control this website. Only the CMS chosen in the deployed `WORDPRESS_CONTENT_URL` is read. Routine editors need WordPress accounts and invitations to that site; GitHub and Vercel are needed for ownership and code/deployment maintenance, not everyday publishing.

### Refresh behavior

WordPress-backed pages and content are eligible for refresh after 60 seconds, when visited. A cached response can appear first while the next version is generated. This is not a background schedule or an instant publish guarantee. If WordPress fails or sends invalid data, the website does not silently replace the last successful content with local seeds; an existing successful cached page can continue serving during a failed regeneration.

For faster refresh, optionally configure the plugin's **Hochi Runs → Connection** screen with `https://YOUR-WEBSITE/api/wordpress/revalidate` and the same `WORDPRESS_REVALIDATE_SECRET` stored in the website's server environment. Use 32–256 random URL-safe characters: letters, digits, `_`, and `-`. The endpoint accepts **POST** with `Authorization: Bearer YOUR_SECRET`, invalidates the `wordpress-content` cache and related pages, and refreshes them on subsequent visits. Keep the secret private. The free native demonstration has no plugin publish hook; it uses the timed refresh unless the developer sends an authenticated request. Content refresh works without a webhook secret.

The earlier free artist-only test was verified on October 3, 2026: an AMAL post was published and its biography edited through WordPress. Both versions appeared in a local Next.js production build without rebuilding or pushing code. Page title and description were checked, and the local cache refresh endpoint returned 401 without authorization and 200 with the correct header. That was a separate native-post test, rather than a hosted plugin webhook test.

On October 4, 2026, **Hochi Runs Content Bridge** was activated on the paid WordPress.com Personal test site. WordPress.com moved its primary address to `hochirunstransfer.wpcomstaging.com`. **Setup → Import existing site content** added 31 entries: 3 published artists, 3 published shop items, 2 published About/Legal pages, and 23 draft release editorial entries with release-picker metadata; there were no events in the imported snapshot. The canonical [public plugin feed](https://hochirunstransfer.wpcomstaging.com/wp-json/hochi/v1/content) was fetched without a login and passed the website's actual content adapter. A temporary AMAL biography edit published through the hosted plugin appeared in the connected local Next.js development preview at `127.0.0.1:3001`. The original biography was then restored and verified in both the hosted feed and Next.js page. Appearance settings were not changed during this hosted test. The ignored `.env.local` now selects this hosted feed, so ordinary local development restarts retain the connection. This proves hosted plugin publishing reaches the local preview; it does not verify production Vercel refresh timing, a hosted publish webhook, or automatic hosted release-choice refresh. The test required cache refreshes; publishing is not verified as instantaneous.

To finish the public website connection:

1. In Vercel, set `WORDPRESS_CONTENT_URL=https://hochirunstransfer.wpcomstaging.com/wp-json/hochi/v1/content`, leave `WORDPRESS_ARTISTS_URL`, `WORDPRESS_MANAGED_ARTIST_SLUGS`, and `WORDPRESS_LOCAL_DEMO` empty, and deploy. Use the canonical address: the adapter rejects redirects from the old `.wordpress.com` address. Publish an edit and check the public Next.js website.
2. In WordPress **Hochi Runs → Setup**, save `https://YOUR-PUBLIC-NEXT-SITE/api/wordpress/catalog` and click **Refresh release choices**. Use the live Vercel address until the custom domain is connected. Verify that GitHub Bandcamp sync commits produce successful website deployments and that new choices reach WordPress. A hosted WordPress server cannot reach this computer's `127.0.0.1` preview.
3. For faster refresh, optionally configure the public `/api/wordpress/revalidate` URL and matching private secret as described above, then verify a hosted publish notification and the resulting public page. These webhook settings are still pending; content can use the timed refresh without them.
4. Connect `hochiruns.com` to the Vercel project through the account that controls its DNS, and verify the domain and HTTPS. WordPress remains the editor at its own content URL. Domain/DNS changes and account ownership transfers have not been performed by this hosted test.

The extended local plugin demo also passed real browser publish/update checks: Amal's biography, social link, and added release association appeared in Next.js. A published release's description, tags, and credits appeared while its canonical Bandcamp purchase URL stayed intact. Saving Appearance updated the background/accent colors, logo, watermark asset, and opacity in the connected preview, using WordPress's native Media Library. Editing an event's date/venue and a hoodie's display price updated `/shows` and `/merch`; no checkout purchase was made. All 43 JavaScript checks, TypeScript/ESLint, the production build, PHP 8.3 lint, and 131 actual WordPress integration checks passed. These checks do not activate a hosted CMS, deploy the extension, transfer accounts, or connect the domain.

The local demonstration appearance overrides were subsequently cleared through WordPress, restoring the original white background, dark accent, `/logo.png`, and `/hochi-wordmark.png` at its original opacity. [Restored preview](output/wordpress-demo/appearance-restored.jpg). The plugin is **Hochi Runs Content Bridge**, version 1.2.0, with explicit Setup import and automatic release-choice refresh. Hosted installation and a published biography update are now verified as described above; a hosted unpublish check and the remaining public website connections have not been verified.

The Setup extension passed 45 JavaScript checks, TypeScript/ESLint, a production build, PHP 8.3 lint, the 131 existing WordPress checks, and 131 new Setup checks. In a fresh local editor, the actual import button added 31 records, release refresh returned 23 choices, and an artist edit appeared in the connected Next.js preview. Reimport added zero duplicates and preserved the edited biography; that test text was then restored. [Setup and refresh proof](output/wordpress-demo/setup-import-refresh.jpg). These local checks are separate from the October 4 hosted verification. Successful public deployments of Bandcamp sync commits, the production CMS connection, and hosted release-choice refresh still need verification.

## Event archive

The Live page at `/shows` includes the nine events listed on [Hochi Runs’ Resident Advisor promoter archive](https://ra.co/promoters/132037/past-events), from December 28, 2024 through September 4, 2026. These entries were published in the hosted WordPress test site before its plugin-file interruption, with matching local defaults and a refreshed plugin import bundle. The Venue field contains the event title followed by the venue; each entry links to its original RA listing. Past events appear in **Archive**, newest first, with **Details** links. Upcoming dates sort forward; an unrecognized or TBD date remains visible in Upcoming. Calendar-day classification uses America/New_York.

Production Vercel was inspected on October 4, 2026: its production environment has no WordPress connection variables. Publishing in this test WordPress account therefore does not yet update `hochiruns.com`. The rejected cover-reveal and navigation-scramble pass was removed. The production release uses local content until the hosted CMS recovery is complete.

### Flyer and roster update (version 1.3.0)

The prepared local content adds the May 22, 2026 **Hochi Runs Label Takeover** at Songbyrd Music House from [the supplied Instagram post](https://www.instagram.com/p/DW9LfoMjUbR/). All ten events have linked flyers, displayed without cropping. RA flyers were captured from their visible image views; they are readable copies, not original full-resolution files. The roster adds Tromac, Taylor Spencer, Hunch, Geno, and Nedaj, and removes Mr. Davinse. Verified release associations are retained; no new biographies or photos were invented. Taylor Spencer's Instagram uses `taylorspenxer`; the display name follows the user's spelling.

The [limited shirt post](https://www.instagram.com/p/DYfdwYaSDlo/) supplies a product collage and describes an event-only run. Its local listing has no invented price, stock status, or checkout link. The ZIP carries all eleven event/merch images in its own assets folder. Setup resolves these to the receiving WordPress installation's HTTPS URLs. Existing records are preserved during import, so their flyer fields must be updated separately; installation alone does not populate the forms.

**Hosted recovery pending:** a browser-based Plugin File Editor replacement failed and left the test installation's plugin PHP file empty. Its custom forms and content endpoint are currently unavailable; saved database content was not deleted. Reinstall `wordpress/hochi-runs-content-bridge.zip` through WordPress's **Upload plugin** screen, replace the existing plugin if prompted, and activate it. Avoid the Plugin File Editor. Then run Setup, assign flyers to the existing event records, verify the new Songbyrd event is published, and check the public content feed before reconnecting Next.js. Mr. Davinse's hosted artist record was moved to Trash before this interruption.

The current development process at `127.0.0.1:3001` uses local content with `WORDPRESS_CONTENT_URL`, `WORDPRESS_ARTISTS_URL`, and `WORDPRESS_LOCAL_DEMO` overridden to empty. `.env.local` remains configured for the hosted CMS. Restart normally only after restoring and verifying that CMS. Version 1.3.0 passed 59 JavaScript checks, 156 isolated WordPress checks, 151 Setup checks, PHP lint, TypeScript, targeted ESLint, and a production build using local content. Desktop and mobile checks confirmed all ten flyers load without horizontal overflow. Hosted installation and publishing for this version remain unverified. Publishing the website does not complete that separate CMS recovery.

## Edit the design and local defaults

The release-page study at `/releases/like-dat-riddim` has tighter liner notes. All release artwork is static and clickable, with a small Play control inside its bottom-right corner. Clicking the image selects that release in the shared player; it does not claim to start Bandcamp playback. The experimental artwork-motion component remains unused for possible future work. Other releases keep their existing layout.

The shared root layout now contains one persistent native Bandcamp player on every page. The player loads the directly visited release initially, or the newest playable release on another entry page. Its native Play control is available immediately, without a separate click to load the iframe. Client navigation keeps the existing player and selected release; it does not switch music simply because another release page opens. Select another release in the player or click its artwork or corner Play control on a release page, then click Bandcamp's native Play button. Selecting the already loaded release preserves its iframe and playback session. **Stop and close music player** unloads the iframe and stops playback; **Listen** restores it. Bandcamp [does not support autostart](https://get.bandcamp.help/en/articles/15263187-how-do-i-make-the-embedded-player-auto-start), so a parent button cannot start a newly selected release. External links open a separate tab; keeping the original Hochi tab open lets it continue playing. Reloading, closing, or navigating that tab to another website ends this session. There are no imported audio files or custom playback-state claims.

**Shop** is currently inactive in desktop and mobile navigation. The `/merch` route, local product data, and WordPress Shop forms remain available for later use. A future Shopify link can replace the navigation destination once supplied.

The shared-player pass passed TypeScript, targeted ESLint, and a production build. Browser checks at desktop and 390px widths verified one player iframe, direct-entry release selection, preserved selection across Artists/Live navigation, explicit switching, and iframe removal/recreation on close/reopen. Native controls were visually checked; no Bandcamp parent playback API or raw audio source was introduced. The artwork control replaces the earlier text selector beneath the cover. Final desktop and 390px mobile checks verified artwork selection, a 44px corner control, no horizontal overflow, and selection retained through internal navigation; full ESLint and the production build passed.

**Bottom-dock preview (`codex/warp-player`):** the native 42px Slim player sits on the bottom edge, centered within the space between the desktop social icons and About/Legal/Contact. That region reserves 20px clearance from both link groups. The native iframe caps at Bandcamp's 700px display width; Close stays beside it. Mobile uses the bottom width. This preview removes the release dropdown and extra toolbar: release-page artwork selects music, and Bandcamp's native button controls playback. Closing moves keyboard focus to Listen; reopening returns focus to the iframe. The Slim format has no visible seek bar. A cropped 120px Standard player was rejected because album and single layouts differ and controls could overlap; no cropping or hidden playback control is used. A true custom progress bar and one-click selection/play need a supported controllable player or separately supplied preview audio. This branch does not change the production deployment.

This preview passed full ESLint and a production build with TypeScript. Browser checks verified the desktop footer gap, no horizontal overflow at 640px and 390px, native playback retained through Artists navigation, same-release artwork selection without resetting playback, and close/reopen focus. Both an album and a standalone track were checked. Local review currently runs development mode on port 3001 with the hosted WordPress connection disabled, as described above.

The social profiles in `src/data/site.ts` appear as monochrome icons in the bottom-left corner and mobile menu. No TikTok link is included until the label supplies a profile. The release archive keeps the original bold wordmark; other pages use a quieter watermark by default. Explicit WordPress Appearance settings still take precedence. Captions have a background matching the site. Corner navigation and filters are transparent, with a faint text halo where letters overlap the wordmark.

Contact now links to `/contact`, without exposing a recipient through a `mailto:` URL. Sending requires private server settings `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, and `CONTACT_TO_EMAIL` in the deployment environment. `CONTACT_FROM_EMAIL` must be a bare email address on a [verified Resend sending domain](https://resend.com/docs/dashboard/domains/introduction); the recipient can be the label's Gmail inbox. The form stays unavailable until these settings are present, and delivery failures never display a success message. Validation and delivery-failure paths were tested with mocked responses; no real email was sent. Before enabling public submissions, configure persistent abuse protection and verify real delivery. The honeypot and same-origin check alone do not prevent determined automated submissions.

| Change | File or directory |
| --- | --- |
| Existing catalog codes, slugs, and editorial overrides | `src/data/releases.ts` |
| Imported Bandcamp metadata | `src/data/bandcamp-catalog.json`, generated by the importer |
| Metadata importer and validation | `scripts/sync-bandcamp.mjs` |
| Local artist defaults and biographies | `src/data/roster.ts` |
| Videos and local show defaults | `src/data/content.ts` |
| Local merch defaults and purchase links | `src/data/merch.ts` |
| WordPress source validation and content access | `src/lib/wordpress-core.mjs`, `src/lib/wordpress.ts` |
| WordPress owner forms, appearance controls, and publish hook | `wordpress/hochi-content/hochi-content.php` |
| Main navigation and shared layout | `src/components/site-chrome.tsx` |
| Persistent player and clickable release artwork | `src/components/site-player.tsx`, `src/components/release-artwork.tsx` |
| Mobile-menu social links | `src/data/site.ts` |
| Colors, typography, and global styles | `src/app/globals.css` |
| Logo, wordmark, and favicon | `public/logo.png`, `public/hochi-wordmark.png`, `src/app/icon.png` |
| Home release feed and filters | `src/components/release-feed.tsx` |
| Page layouts | `src/app/` |
| Domain metadata, font, and theme initialization | `src/app/layout.tsx` |

Use the WordPress **Appearance** screen for the supported colors, logos, and background controls. Other design changes are implemented in React and Tailwind/CSS. About and Legal local defaults are in `src/data/pages.ts`. Blog and press-kit sections have not been implemented. Artist release checkboxes control full-CMS associations; code-only defaults can use `memberSlugs` matching stable artist slugs in editorial release records.

## Hosting and media

Next.js 16.2.7, React 19.2.4, TypeScript, and Tailwind CSS 4. The website does not need its own database. Optional server-only WordPress settings are documented in `.env.example`; the full CMS's WordPress installation manages its own content storage. An optional `BANDCAMP_DEPLOY_HOOK_URL` is a GitHub Actions secret, not a browser or application variable. Use standard Next.js hosting rather than a static `out` directory for the CMS cache and webhook.

The sync runs in GitHub Actions. Vercel lists scrapers outside [fair use](https://vercel.com/docs/limits/fair-use-guidelines); do not move the importer into a Vercel request handler or cron function. Vercel Hobby also permits only personal, non-commercial use, so the label needs a suitable hosting plan or another provider.

Audio originals stay off this site. Public artwork and any media delivered for viewing or listening can potentially be copied; an embedded player cannot guarantee otherwise. Merch purchasing and some editorial content are still placeholders, detailed in the handoff.

## Instructions for coding agents

Follow `AGENTS.md` and read the relevant guides in `node_modules/next/dist/docs/` before writing code. Install locked dependencies with `npm ci` to make those guides available.
