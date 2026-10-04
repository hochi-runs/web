# Hochi Runs developer handoff

Prepared October 3, 2026 for the developer taking over the Hochi Runs website. The approved Next.js design already has a publicly reachable preview. Connecting `hochiruns.com`, transferring account access, and activating the new integrations are separate tasks. A metadata sync prepares hourly Bandcamp updates once enabled in GitHub. A WordPress adapter supports owner editing in the existing website. The extended release editor, artist release checkboxes, and branding controls are a local prototype; they have not been deployed.

## Plain-English owner walkthrough

The earlier 15-page owner walkthrough is `output/pdf/hochi-runs-owner-guide.pdf`. Its domain illustrations use official example screenshots with red callouts; account names and DNS values must come from the actual hosting project. Pages 13–15 show the real WordPress post editor, the resulting Next.js page, and the original dedicated plugin form in a local demo. The PDF predates the release editor and branding extension and has not been regenerated. Use the current demo and CMS instructions below for those controls.

Before the call, confirm Oro's experience with WordPress and code, which content he wants to edit himself, who controls the domain, and whether GitHub/Vercel accounts already exist. React is installed with the project packages; Git and Node.js 22 are needed only for working on the code locally. The call can arrange access, deployment, DNS changes and one example update when accounts are ready; account recovery, DNS propagation, and new feature development may require additional time.

### Current local owner-editing prototype

The expanded demonstration uses a temporary local WordPress installation, so there is no WordPress.com plan purchase or public deployment. A developer runs `npm ci`, then `npm run demo:wordpress` using Node.js 24.18 or newer. WordPress opens at `http://127.0.0.1:9401/wp-admin/admin.php?page=hochi-runs`; the connected website opens at `http://127.0.0.1:3001`.

Show the owner these changes:

1. **Artists → Amal**: edit the biography and release checkboxes, click **Update**, then check `/roster/amal` in the website preview.
2. **Releases**: open a catalog release, change its website description or artist checkboxes, click **Publish**, and check the existing release page. Hide it, verify removal, then restore it.
3. **Hochi Runs → Appearance**: change a color or choose a logo/background from the Media Library, save, and reload the preview.
4. **Shop**, **Live**, and **Website Pages**: demonstrate merchandise links, event details, and About/Legal text.

The demo preloads current roster and catalog data, plus clearly marked sample content. Release overrides begin as drafts. Its changes reset on restart; use it to approve the editing experience before migrating content to a hosted CMS. **Ctrl+C** stops the local servers. Existing ignored `.env.local` is left unchanged. `npm run demo:wordpress -- --prepare` generates only the private blueprint. The loopback-only launcher and artist/release/appearance/Live/Shop walkthrough are verified. The blueprint contains a temporary connection secret and must not be shared or committed.

Current local screenshots show the [artist editor with release checkboxes](output/wordpress-demo/artist-editor.jpg), [Appearance editor](output/wordpress-demo/appearance-editor.jpg), and [connected Next.js preview](output/wordpress-demo/site-preview.jpg). They are generated local proof files in the ignored output folder; the earlier PDF and handoff archive do not include them.

## Project and account details

| Item | Current evidence |
| --- | --- |
| Source | [hochi-runs/web](https://github.com/hochi-runs/web), configured as this checkout's Git remote |
| Branch and original reviewed commit | `main`, `20370a7` |
| Framework | Next.js 16.2.7 App Router, React 19.2.4, TypeScript, Tailwind CSS 4 |
| Node.js | 22 recommended; see `.nvmrc` |
| Production domain | `hochiruns.com`, also set in `src/app/layout.tsx` |
| Vercel preview | Shown in the supplied conversation; exact URL, project name, and account owner still need to be supplied |
| Hosting plan | User reports Vercel Free; dashboard details have not been inspected |
| Website database | No separate database required; WordPress stores CMS content in its own installation |
| Optional CMS configuration | One WordPress source mode, plus an optional private refresh secret; see `.env.example`. The loopback demo flag is development-only. |
| Free hosted artist proof | `hochirunstransfer.wordpress.com`, with artist route `amal` managed through published native posts |
| Extended owner forms | Isolated local WordPress prototype; separate from the free hosted account and production website |
| Optional deployment secret | `BANDCAMP_DEPLOY_HOOK_URL`, stored in GitHub Actions |

The Git remote establishes the source location. It does not establish who controls Vercel, the domain, or Bandcamp.

## Current functionality

The archive combines imported Bandcamp metadata with 20 original editorial records. Purchase buttons open the corresponding Bandcamp pages; Bandcamp handles payment and download fulfillment. The importer follows the label's curated music grid, including releases hosted on individual artists' storefronts, rather than importing every release those artists have published.

The website has no separate database, local music player, or local checkout. Its headless WordPress integration supplies content to the existing Next.js pages. The free hosted demonstration controls selected artists only; the plugin adds forms for artists, merch, shows, releases, and About/Legal copy, plus supported colors, logo, and background controls. Navigation, layout changes, a blog, and a press kit still require development.

The original local defaults still include one YouTube embed, three merch listings without purchase links or images, placeholder roster biographies, no shows, and placeholder legal copy. Unmanaged content continues using those defaults in the free demonstration. Review or migrate it before treating the website as complete.

## Access and ownership

The recommended arrangement is to keep the repository, domain, and billing under Hochi Runs control and grant the developer appropriate access. Transferring complete ownership is optional.

1. Obtain the developer's GitHub username and hosting account or team details.
2. Grant repository access and agree whether updates use direct pushes or pull requests.
3. Grant hosting access or transfer the existing project. Check any seat charges first.
4. Grant WordPress **Editor** or **Administrator** access for the shared catalog. Inverse artist/release selections update only related records the editor can edit. An administrator handles plugin installation, Appearance, and Connection settings; everyday content edits do not require GitHub access.
5. Identify the domain account and grant DNS access, or have its owner make the records supplied by the host.
6. Provide the exact preview URL, hosting project name, current DNS records, and dashboard settings not captured in Git. Configure any private refresh secret directly in the destination environments rather than sending it in public files or chat.

For GitHub ownership transfer, use repository **Settings → Danger Zone → Transfer**. Admin access and a valid destination are required. Hosting ownership does not change with the repository. See [GitHub transfer guidance](https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository).

For Vercel, use project **Settings → General → Transfer Project**. The source team Owner must belong to the destination team. Deployments, settings, the Git connection, domains, and dashboard environment variables transfer; integrations and separate storage resources can require additional handling. Verify a deployment after either transfer. See [Vercel transfer guidance](https://vercel.com/docs/projects/transferring-projects).

## Deployment and the domain

Reuse the existing hosting project after arranging access and an appropriate plan, or import the GitHub repository into the selected host.

| Vercel import setting | Value |
| --- | --- |
| Framework | Next.js |
| Root | Repository root |
| Install | `npm ci` |
| Build | `npm run build` |
| Output | Framework default; do not set it to `out` |
| Production branch | `main` |
| Node.js | 22 |
| Application environment variables | None for local defaults; configure one WordPress mode from `.env.example` to enable CMS content |

Verify the deployment on the provider's URL first. Changes to a connected production branch can then trigger subsequent deployments. See [Vercel Git deployment guidance](https://vercel.com/docs/git).

Live checks on October 3, 2026 found both `hochiruns.com` and `www.hochiruns.com` resolving to `159.203.172.240`. HTTPS connections to both timed out before TLS negotiation; apex HTTP also timed out. Nameservers were `dns1.registrar-servers.com` and `dns2.registrar-servers.com`. These checks confirm unreachability from this network, but cannot distinguish server, firewall, or routing failure. Certificate status is unknown.

To connect the new build:

1. Confirm the domain registration is active and identify the account controlling authoritative DNS.
2. Add the apex and `www` hostnames in the hosting project's domain settings.
3. Apply the exact DNS records that project supplies. Do not guess an IP address from an old tutorial.
4. Preserve unrelated records, including email MX and verification TXT records.
5. Select the primary hostname, redirect the other, and wait for domain verification and HTTPS issuance.
6. Verify both hostnames, direct release URLs, mobile pages, artwork, and Bandcamp purchase links.

Connecting the site does not require transferring the domain registration. No domain or hosting configuration has been changed in preparing this handoff.

## WordPress content editing

WordPress is the owner editor; Next.js remains the website visitors see. Publishing a configured content record does not require editing source files, pushing to GitHub, or deploying a new website build. The plugin also exposes selected colors, logos, and background controls. Navigation and page layout remain in the code. The implementation displays plain text rather than arbitrary WordPress HTML or theme blocks.

### Current free artist demonstration

The selected account is the free test site `hochirunstransfer.wordpress.com`. An ignored local `.env.local` selects its public native posts API and manages the existing artist route `amal`. This does not configure the production host. The intended server settings are:

```dotenv
WORDPRESS_ARTISTS_URL=https://public-api.wordpress.com/wp/v2/sites/hochirunstransfer.wordpress.com/posts
WORDPRESS_MANAGED_ARTIST_SLUGS=amal
```

Keep `WORDPRESS_CONTENT_URL` empty in this mode. In WordPress, open the post for Amal and use these fields:

| WordPress field | Existing website area |
| --- | --- |
| Title | Artist name on roster and profile |
| Excerpt | Short role under the name, such as `DJ / Producer` |
| Main post body | Biography in the profile's existing layout |
| Featured image | Artist photo |
| URL slug `amal` | Stable `/roster/amal` address and content matching key |

Set the Excerpt explicitly; otherwise WordPress may generate it from the biography. Keep the slug `amal` when changing the display name. Click **Publish** or **Update**, then visit the existing website profile after its cache refreshes. A normal WordPress post URL is not the public artist profile on the label website.

Only published, public, unprotected posts matching the managed slugs are used. Unpublishing the managed artist hides it from the roster and makes its profile unavailable after refresh; the original placeholder does not reappear. Unmanaged artists keep their local values. Merch, shows, About, and Legal also keep local values in this mode. Artist socials and release relationships are not editable through these ordinary post fields. To manage another artist or add a new route in this demonstration, the developer must update the comma-separated managed-slug setting and restart or redeploy the website.

### Full owner forms and branding controls

The supplied `wordpress/hochi-runs-content-bridge.zip` installs **Hochi Runs Content Bridge**, with custom **Hochi Runs** forms. Use a self-hosted WordPress installation or a paid WordPress.com plan. Free WordPress.com cannot install this plugin; [all paid plans, including Personal, support custom plugin installation](https://wordpress.com/support/plugins/install-a-plugin/).

The core forms/feed/display workflow is proven locally. WordPress.com installation and the hosted publish/update/unpublish cycle still need verification after content migration and connection setup. Use the canonical HTTPS endpoint displayed by the plugin; the adapter rejects redirects, and WordPress.com redirects secondary domains to the primary domain. See [REST URLs by site type](https://developer.wordpress.com/docs/rest-api-urls-by-site-type/).

Before connecting the full CMS, use **Hochi Runs → Setup → Import existing site content**. The bundled snapshot copies the current artists, products, events, and About/Legal text into published records and release editorial data into drafts. It populates release checkboxes, skips matching existing records in any status, and preserves appearance settings and owner edits. Review existing placeholders before handoff. **The plugin's published collections replace corresponding local collections. An empty collection means no entries.** About and Legal remain local if their page records are absent. Unpublishing a full-CMS record removes it from the website after refresh.

| Form | Fields the owner edits |
| --- | --- |
| Artists | Name, stable website slug, role, biography, HTTPS photo URL, social links, release checkboxes |
| Shop | Merchandise name, price text, HTTPS image URL, purchase URL |
| Live | Date, venue, city, ticket URL |
| Website Pages | About or Legal, with paragraphs of text |
| Releases | Existing release, read-only Bandcamp reference, website description, category, tags, credits, extra streaming links, artist checkboxes, hide/show |
| Appearance (administrator) | Background, text, accent, muted-text, and border colors; header logo; background watermark; background image; watermark opacity |

The artist's website slug locks after first publication. Changing a display name does not change its profile address. Artist release checkboxes explicitly control the releases on that profile; clearing them shows none. The two selection forms update corresponding relationships in published records the current editor can edit, so use Editor or Administrator access for the shared catalog. The local demo preloads the catalog to provide readable choices; without a loaded catalog, the artist form uses release route names and retains older selections.

On **Setup**, save the connected website's public `https://YOUR-WEBSITE/api/wordpress/catalog` URL, then click **Refresh release choices**. It returns only versioned public picker metadata, independently of WordPress, and includes releases hidden from website visitors. WordPress schedules hourly checks and refreshes on artist/release editor visits at most once every five minutes; WordPress scheduling depends on its site receiving traffic. The manual button makes an immediate check. After a Bandcamp sync and successful website deployment, new releases become choices. Failed, oversized, empty, or malformed responses preserve the last valid choices. Successful refresh changes reference metadata only, preserving owner posts, selections, drafts, and Appearance. It never assigns new releases or publishes overrides automatically, and adds no public write endpoint.

The initial import is administrator-only and nonce protected. It validates the complete snapshot before writes, skips matching entries including drafts and Trash, and preserves stable import identities after owner renames. A failed database write can leave earlier successfully imported entries in place; retry safely skips them. Run `npm run package:wordpress` to regenerate the source snapshot and uploadable ZIP for a new handoff. The free local `npm run demo:wordpress -- --empty` exercises this same import button; its explicitly enabled local catalog URL is `http://127.0.0.1:3001/api/wordpress/catalog`.

Only the WordPress site configured in the deployed `WORDPRESS_CONTENT_URL` supplies website content. Installing this plugin elsewhere or possessing the cache-refresh secret cannot change that choice. Invite content editors to the chosen WordPress site; they need no GitHub, Vercel, Git, or Node.js access for routine editing. The owner/developer separately maintains the repository/organization, hosting project, and domain.

Release forms add optional website editorial changes to an existing catalog release. Bandcamp keeps control of the title, primary artist, date, artwork, tracks, and purchase URL. The source, audio delivery, and checkout remain on Bandcamp. An omitted override keeps the catalog field; an empty description or list clears that website field, while a blank category keeps the existing category. Unpublishing an override restores its underlying editorial values; artist-form selections remain separately editable. Hiding a release removes it from website feeds, artist pages, and its direct route; it remains available on Bandcamp. Purchase and ticket fields still link to the external seller, and stock is not synchronized.

Under **Hochi Runs → Appearance**, an administrator can save colors and branding assets. Watermark opacity ranges from 0 to 0.3. Hosted images use public HTTPS URLs with supported raster extensions (`jpg`, `jpeg`, `png`, `gif`, `webp`, or `avif`); copy a Media Library File URL into the relevant field. Empty appearance fields keep the default design. These controls do not add a page builder or transfer a WordPress theme into Next.js.

An administrator installs and activates the plugin, then opens **Hochi Runs → Connection** and gives its public content URL to the developer. Configure that URL as `WORDPRESS_CONTENT_URL` in the website's server environment, leave the native artist settings empty, and deploy once to activate the connection. The endpoint is `https://YOUR-WORDPRESS-SITE/wp-json/hochi/v1/content`. Its version-1 response includes published artists, products, shows, and page paragraphs, plus optional `releaseOverrides` and `appearance` fields. Existing version-1 feeds without those new fields remain compatible. No API password is needed to read published content. Drafts, private records, and passwords or connection secrets are excluded.

### Refresh and failure behavior

The website's WordPress requests and affected pages use a 60-second revalidation interval. After that interval, a visit can receive the cached version while Next.js refreshes it in the background. There is no independent background polling job and publishing does not promise an instant visible change. This CMS refresh is separate from the hourly Bandcamp workflow, which still needs a deployment when its saved catalog changes.

For faster updates, the plugin can notify the website after publish, update, unpublish, or delete. Set its connection URL to `https://YOUR-WEBSITE/api/wordpress/revalidate` and store the same `WORDPRESS_REVALIDATE_SECRET` in both places. Use 32–256 random characters consisting only of letters, digits, `_`, and `-`. A developer or the plugin sends **POST** with `Authorization: Bearer YOUR_SECRET`. The route expires the `wordpress-content` cache and related page caches; the next visits generate the updated content. Leave the secret unset to use the timed refresh alone. The free native demonstration has no automatic plugin hook.

Keep the secret in the ignored local environment file or hosting dashboard, never a `NEXT_PUBLIC_` variable, Git, or screenshots. A missing or invalid secret disables the refresh endpoint, not ordinary content reads. A failed hook leaves timed refresh available. If WordPress is unavailable or sends invalid data, the adapter throws rather than silently restoring placeholder content. Previously successful pages can remain available through failed background regeneration; a first build or uncached request still needs a working configured source.

The adapter permits configured public HTTPS sources, checks resolved addresses, rejects redirects, and validates response size and fields. Its source URL is trusted server configuration, not visitor input. The explicit local prototype mode accepts only a literal loopback HTTP address with a port and the plugin endpoint, and is rejected in production. Local demo images are limited to the same WordPress origin's uploads directory; hosted sources keep the HTTPS checks. These checks do not turn published CMS text or photos into private media.

### Activate and verify the CMS

1. Choose native artist demonstration or full plugin mode. In full mode, import and review the bundled current content through Setup before enabling the feed.
2. Use `.env.example` for the server settings. Keep local values in ignored `.env.local`; configure production values in the hosting dashboard and deploy.
3. Publish one artist and verify its name, role, biography, photo, profile address, and page metadata in the unchanged layout.
4. Edit the biography and confirm it refreshes without a GitHub push. Unpublish and republish to verify removal and restoration.
5. In full mode, also verify a product purchase link, event ticket link, About/Legal text, and a newly published artist route. Edit a release, check artist associations, hide/show it, and save supported appearance settings. Test the optional hook if configured.
6. Save the public catalog URL on Setup, refresh, and confirm a newly deployed Bandcamp release becomes an artist checkbox without overwriting existing selections. Verify failed refreshes keep choices available.
7. Record who owns WordPress and who can maintain content versus website design.

The selected free test site, `hochirunstransfer.wordpress.com`, is connected to ignored `.env.local` for the local preview. On October 3, 2026 an AMAL post was published through its browser editor; the artist page appeared on demand after the production build. A second saved biography then appeared through the normal timed cache refresh, without rebuilding or pushing code. Its page title and description were verified. This is a real WordPress-to-local-Next.js proof. Production CMS environment settings, deployment, and live refresh are still pending. The dedicated plugin forms were tested in an isolated local WordPress installation; the free account has not installed that plugin.

## Enable automatic catalog updates

The sync reads public catalog and release-page metadata. It is a page parser, not an official catalog API, and may need maintenance if Bandcamp changes its HTML. Bandcamp's published API documents accounts, sales reports, and merch orders rather than a general release-catalog endpoint. See [Bandcamp API documentation](https://bandcamp.com/developer).

The importer combines rendered catalog cards with Bandcamp's overflow list, then reads each release's JSON-LD metadata. It permits only HTTPS Bandcamp release pages and public Bandcamp artwork URLs, limits request size and concurrency, and persists an explicit metadata field list. Audio files, stream URLs, player data, and raw page HTML are not saved.

1. Publish these source changes to GitHub's default branch, `main`.
2. Enable GitHub Actions and ensure branch rules permit the workflow's catalog commits. Its token requests `contents: write`.
3. Run **Actions → Sync Bandcamp catalog → Run workflow** to verify a complete import.
4. Verify the hosting provider deploys the workflow bot's commits. If it does not, create a production deployment hook for `main` and save its URL as the GitHub Actions secret `BANDCAMP_DEPLOY_HOOK_URL`.
5. Confirm the site deploys the updated snapshot and inspect the new release pages.

The hook step accepts HTTPS Vercel or Netlify build hook URLs and runs only after a changed snapshot is pushed. An accepted hook request starts a deployment; check the host for build completion. If the hook fails after a successful push, manually deploy the saved commit in the hosting dashboard.

The workflow runs at minute 17 each hour and commits only when metadata changes. Expect hourly refresh plus deployment time, rather than immediate updates on upload. GitHub schedules can be delayed or dropped; public-repository schedules can be disabled after 60 inactive days. GitHub token commits also do not trigger other push-based GitHub Actions workflows, so do not rely on one for deployment. See [GitHub schedule behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule) and [token trigger behavior](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow#triggering-a-workflow-from-a-workflow).

Local commands are `npm run sync:bandcamp` to update and `npm run sync:bandcamp:check` to compare without writing. Check mode exits with status 1 for changes or validation failure. A failed import never replaces the last complete snapshot. Builds read that saved snapshot and do not contact Bandcamp.

Existing HR codes and site slugs are local editorial values; imported title, artist, date, artwork, and track information can update. New entries use immutable Bandcamp IDs for site slugs and BC codes. The original curated archive remains when an old release leaves the public grid; remove such archive entries deliberately if desired. Newly imported entries follow the latest valid grid.

If the sync fails, inspect its GitHub Actions logs. A blocked request or changed page structure should be investigated before rerunning; the saved archive continues to serve visitors. Keep the importer in GitHub Actions: Vercel's fair use guidelines list scrapers outside permitted use on its platform.

## Hosting costs

Policies and prices were checked October 3, 2026 and can change.

Vercel restricts Hobby to personal, non-commercial use and explicitly counts advertising products for sale as commercial. Our assessment is that promoting Bandcamp purchases places this label site in that category. Vercel Pro currently starts at $20 per month with one deploying seat and $20 in usage credit; additional Owner or Member seats cost $20 per month each. Extra usage, add-ons, and taxes can add costs. See [Vercel fair use](https://vercel.com/docs/limits/fair-use-guidelines) and [Pro pricing](https://vercel.com/docs/plans/pro-plan).

If avoiding a hosting subscription is a priority, evaluate Netlify Free. Netlify states that it supports commercial projects, and its current pricing lists a 300-credit monthly limit. Verify this build in a separate deployment before moving the domain. See [Netlify commercial use guidance](https://www.netlify.com/guides/netlify-vs-vercel/), [Netlify pricing](https://www.netlify.com/pricing/), and [Next.js on Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/).

The isolated local WordPress demonstration has no hosting subscription. Hosting the full plugin on WordPress.com requires a paid plan: Personal currently costs US$9 billed monthly or US$48 billed annually, before tax. All paid plans permit plugins. Check the actual checkout price and renewal terms; no plan has been purchased or upgraded during this work. See [WordPress.com pricing](https://wordpress.com/pricing/) and [plugin installation](https://wordpress.com/support/plugins/install-a-plugin/).

Domain renewals, other CMS hosting choices, and GitHub Actions usage beyond the account's allowance are separate. This application needs no separate website database subscription. Check usage allowances for the actual accounts before promising zero upkeep costs.

## Media protection and design editing

There are no music masters or video files in the public site assets. Keep music purchase and download delivery on Bandcamp. If on-site listening is added, use Bandcamp's official player. See [Bandcamp embed instructions](https://get.bandcamp.help/en/articles/15263071-how-do-i-create-a-bandcamp-embedded-player).

Public artwork can be saved, and any media delivered for viewing or listening can potentially be copied or recorded. An iframe, hidden controls, or disabled right-click cannot guarantee otherwise. The practical protection is to keep unpurchased originals out of public assets and responses. Browser tools can inspect network resources; see [Chrome network documentation](https://developer.chrome.com/docs/devtools/network/overview).

The plugin's **Appearance** screen handles the supported colors, logos, and backgrounds. Other design edits are made in React and Tailwind/CSS; the README maps common changes to files. Choosing a different WordPress theme or arranging blocks in its editor does not redesign the Next.js pages. New content sections, including a blog or press kit, still require implementation.

WordPress's standard export is XML content for another WordPress installation, and its themes use WordPress-specific templates. Exporting a theme does not create a drop-in Next.js application; the design requires implementation in React or a rebuild in WordPress. Headless WordPress can supply content through its API, but adds a separate WordPress installation and does not automatically transfer its visual theme builder. See [WordPress export](https://wordpress.org/documentation/article/tools-export-screen/), [theme architecture](https://developer.wordpress.org/themes/getting-started/what-is-a-theme/), and [REST API](https://developer.wordpress.org/rest-api/).

## Launch checklist

- [ ] Confirm this repository and the approved preview show the same design.
- [ ] Arrange repository, hosting, billing, and domain DNS access.
- [ ] Push the changes, enable and verify the sync workflow, and verify automatic deployment.
- [ ] Choose a CMS mode, migrate required content, configure the production source, and verify publish/update/unpublish in the existing layout.
- [ ] Approve release associations, editorial overrides, hide/show behavior, and branding settings before deploying the extended local prototype.
- [ ] Confirm every purchase link and the label's curated catalog selection.
- [ ] Add real merch links and images or remove placeholder listings.
- [ ] Replace placeholder biographies and legal copy, and approve video content.
- [ ] Connect the domain and check HTTPS, redirects, release pages, and mobile navigation.
- [ ] Record account owners, the live deployment URL, and a working rollback procedure.

## Verification

Before the CMS addition, the initial live import saved 23 releases, including Low Top Vanz (Amal Techno Remix), Breaking Format, and SDM2 beyond the original 20. A repeat live check found no changes. All 23 catalog tests passed, ESLint passed, and the production build generated all 23 release pages. Generated pages were checked for their title and Bandcamp purchase link, and all 20 original release addresses remain present.

Before the release and branding extension, all 37 JavaScript tests passed on Node.js 20.19.4 and 22.23.2: 23 catalog checks, 12 WordPress adapter checks, and 2 webhook authorization checks. That integrated ESLint and production build passed. The live WordPress.com browser publish/edit proof succeeded against the local production server, including the updated page description. The webhook returned 401 for an unauthenticated POST, 405 for GET, and 200 for the correct Bearer header. The preceding plugin passed PHP lint and 67 checks in an isolated real WordPress/PHP 8.3 instance. The earlier illustrated owner guide includes real editing and website screenshots. Production hosting and domain cutover remain unverified.

For the release and branding extension, all 43 JavaScript tests passed: 23 catalog checks, 18 WordPress adapter checks, and 2 webhook authorization checks. TypeScript/ESLint and the production build also passed using the original configured native WordPress mode. PHP 8.3 lint and 131 checks passed in an actual isolated WordPress instance. The demo's blueprint preparation was verified twice without changing hosting settings or `.env.local`.

Version 1.2.0 adds two picker-export checks (45 JavaScript checks total), passing TypeScript/ESLint and production build, plus 131 additional actual WordPress Setup checks (262 WordPress checks total). The actual browser Setup flow was verified from an empty local editor: 31 entries imported, 23 release choices refreshed through the Next.js endpoint, a published biography appeared on the preview, and reimport skipped all 31 existing records without overwriting the edit. Test biography restored; original appearance retained. Screenshot: `output/wordpress-demo/setup-import-refresh.jpg`. Hosted plugin installation, production deployment, scheduled Bandcamp activation, account transfer, and DNS remain separate pending steps.

The extended demo runs only on loopback: WordPress at `http://127.0.0.1:9401` and Next.js at `http://127.0.0.1:3001`. An anonymous request to the plugin's public content feed returned HTTP 200 JSON. Through the real WordPress UI, publishing Amal's changed biography, social link, and new release association updated the Next.js profile. Publishing a release override updated its description, tags, and credits while preserving its canonical Bandcamp purchase URL. Saving **Website Appearance** changed the background to `#f5f0e8`, accent to `#7c3aed`, Media Library logo/watermark assets, and watermark opacity to `0.08`; the preview's computed styles and image URLs matched. Updating the demo event's venue/date appeared on `/shows`, and the hoodie's `$45 — local demo` display price appeared on `/merch`. No checkout purchase was made. Hosted installation, the production catalog-to-picker bridge, account transfer, automatic deployment, and domain cutover remain pending.

The earlier catalog-only build used Node.js 20.19.4; the integrated CMS build used the bundled Node.js 24.19.0 runtime. Node.js 22 remains the repository's recommended runtime family. The build requires network access to fetch JetBrains Mono from Google Fonts.

The earlier archive in `handoff/hochi-runs-developer-handoff.zip` contains the preceding source snapshot, lockfile, catalog workflow, CMS adapter, plugin ZIP/source/tests, `.env.example`, and illustrated owner guide. It predates the release editor and branding extension and has not been regenerated. Use this working repository for the current implementation. The archive excludes Git history, dependencies, build output, local environment settings, and credentials. Copy the current example environment settings into a private local or hosting configuration; the archive does not include the personal test connection or its webhook secret.

These changes have not been pushed, and remote workflow execution, automatic production deployment, and domain cutover remain unverified. Those steps require the account access described above.
