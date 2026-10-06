# Hochi Runs developer handoff

Updated October 6, 2026 for the technical handoff call. The repository is now private, with the published dependency-lockfile repair at `680d1a0`. The domain is connected to the Vercel project through Cloudflare DNS. The inspected production deployment at `485837e` is READY, but its Vercel team is suspended for a billing issue: the API reports `UNPAID_INVOICE`, while the dashboard shows Pro expired and no open invoices. Review the subscription with Vercel before paying again. This is separate from the WordPress connection.

## October 6 call brief

**What to say:** “This started as an experimental collaboration with Amal. You now have the website design and a WordPress plugin for editing its supported content. GitHub holds the code, Vercel serves the website, WordPress is the editor, and Bandcamp keeps the music and purchases. We will confirm account access and the remaining setup today. Future design work and new features are separate decisions.”

**What works now:** the local website at `http://127.0.0.1:3001` displays the saved release archive, seven roster artists, ten events with flyers, social links, and the site-wide native Bandcamp player. Its slim bottom bar persists during internal navigation. Selecting different release artwork loads that release; Bandcamp's own Play button starts it. Shop navigation is disabled, with its code and WordPress forms retained. About and Legal still contain placeholders. The contact form needs private Resend settings and a real delivery test; existing iCloud mail DNS does not configure it.

**What still needs verification:** production has no application environment variables and uses local defaults. The paid WordPress.com Personal test previously passed a plugin installation and published biography proof, but its plugin is now deactivated with an invalid header following a failed file-editor replacement. Reinstall the supplied version 1.3.0 ZIP through **Upload plugin**, activate it, run Setup, review existing records and flyers, then verify the full public content feed. Configure that canonical HTTPS content URL in Next.js and test publish, update, unpublish, and restore. Local WordPress-to-Next.js testing does not require Vercel to be online; public catalog refresh and a public hosted demo do require a working website URL.

**Automatic releases:** the hourly GitHub workflow is configured. The missing dependency-lockfile entries were repaired in `680d1a0`, and [manual sync run #12](https://github.com/hochi-runs/web/actions/runs/37527071898) completed successfully in 27 seconds. This verifies the remote installation/import workflow; a new catalog deployment and its appearance in WordPress's release picker remain unverified while hosting is billing-blocked. The intended flow is **Bandcamp metadata → GitHub snapshot → website deployment**. WordPress receives refreshed release choices from the website and sends editorial changes to Next.js. Publishing in WordPress does not upload music to Bandcamp.

| Minutes | Call objective |
| --- | --- |
| 0–10 | Confirm GitHub invitations, repository access, and who will own each account. A source ZIP saves current files; a Git clone preserves repository history. Neither includes the WordPress database, account settings, or secrets. |
| 10–25 | Review Vercel billing or destination hosting, transfer/import the project, and confirm domain/DNS access. Preserve mail records. |
| 25–40 | Demonstrate one WordPress edit reaching Next.js only after the feed and connection work. Otherwise show the forms/local proof and record the setup still required. |
| 40–50 | Walk through one developer code change, review, deployment, and rollback. Git and Node.js are for this work; WordPress editors need neither. |
| 50–60 | Confirm owners, costs, outstanding checks, and follow-up scope. Account recovery or provider delays may require another session. |

**Budget to explain:** WordPress.com Personal is currently US$9 billed monthly. Vercel Pro starts at US$20 monthly with one deploying seat, making a US$29 baseline before tax, domain renewal, extra usage, or add-ons. Additional Vercel Owner/Member seats are US$20 monthly each; people editing WordPress do not need those seats. Vercel Hobby is for personal, non-commercial use and restricts private GitHub organization repositories; it does not forbid every private GitHub repository. The label's commercial use is the relevant plan consideration, not simply “Next.js has many files” or “Bandcamp fetching costs $20.” Prices and policy were checked October 6: [Vercel Pro](https://vercel.com/docs/plans/pro-plan), [Hobby](https://vercel.com/docs/plans/hobby), [Git integration](https://vercel.com/docs/git), [WordPress.com pricing](https://wordpress.com/pricing/), [plugin support](https://wordpress.com/support/plugins/install-a-plugin/).

Motion, a controllable custom visualizer/player, further SEO work, a vector logo, contact delivery/newsletters, Shopify links, blog, and press kit remain future scope. Supported WordPress Appearance fields change selected branding settings; they do not turn WordPress into the Next.js page-layout editor.

## Plain-English owner walkthrough

Oro requested a short recorded walkthrough with timestamps rather than a long document. Use the call agenda above and record a working publishing demonstration only after its connection passes verification. The earlier 15-page owner walkthrough is `output/pdf/hochi-runs-owner-guide.pdf`, retained as a historical reference. Its domain illustrations use official example screenshots with red callouts; account names and DNS values must come from the actual hosting project. Pages 13–15 show the real WordPress post editor, the resulting Next.js page, and the original dedicated plugin form in a local demo. The PDF predates the release editor and branding extension and has not been regenerated. Use the current demo and CMS instructions below for those controls.

Before the call, confirm Oro's experience with WordPress and code, which content he wants to edit himself, who controls the domain, and whether GitHub/Vercel accounts already exist. React is installed with the project packages; Git and Node.js 22 are needed only for working on the code locally. The call can arrange access, deployment, DNS changes and one example update when accounts are ready; account recovery, DNS propagation, and new feature development may require additional time.

### Optional local owner-editing demonstration

This separate demonstration uses a temporary local WordPress installation and needs no subscription of its own. The hosted test account has since purchased WordPress.com Personal. A developer runs `npm ci`, then `npm run demo:wordpress` using Node.js 24.18 or newer. WordPress opens at `http://127.0.0.1:9401/wp-admin/admin.php?page=hochi-runs`; the connected website opens at `http://127.0.0.1:3001`. Stop any existing website process on port 3001 before starting this demo. The current call preview uses local content without a WordPress connection; do not describe it as an active publishing demo.

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
| Published dependency repair | `main`, `680d1a0`; repository now private. Last inspected READY production deployment: `485837e`. This document is a later working update. |
| Framework | Next.js 16.2.7 App Router, React 19.2.4, TypeScript, Tailwind CSS 4 |
| Node.js | 22 recommended; see `.nvmrc` |
| Production domain | `hochiruns.com`, also set in `src/app/layout.tsx` |
| Vercel project | `hochi`, team `valcoholics-projects`; aliases include `hochi.vercel.app` and `hochiruns.com` |
| Hosting status | Pro subscription canceled/expired; team billing suspension returns HTTP 402 `DEPLOYMENT_DISABLED`. Deployment itself is READY. |
| Domain/DNS | Registration reported at Namecheap; authoritative DNS at Cloudflare. `hochiruns.com` and `www` are connected to Vercel. Preserve iCloud mail records. |
| Website database | No separate database required; WordPress stores CMS content in its own installation |
| Production CMS configuration | No application environment variables configured; currently uses saved local content. See `.env.example` for one CMS source mode. |
| Hosted WordPress test | Personal plan purchased; canonical primary address `hochirunstransfer.wpcomstaging.com`. Earlier artist/plugin proof succeeded, but current plugin recovery is pending. |
| Owner forms | Version 1.3.0 ZIP prepared and locally tested; hosted reinstall, import review, full feed and publishing verification pending |
| Optional deployment hook | `BANDCAMP_DEPLOY_HOOK_URL` can be stored as a GitHub Actions secret; its configuration still needs checking. |

The Git remote establishes the source location. It does not establish who controls Vercel, the domain, or Bandcamp.

## Current functionality

The archive combines imported Bandcamp metadata with 20 original editorial records. Purchase buttons open the corresponding Bandcamp pages; Bandcamp handles payment and download fulfillment. The importer follows the label's curated music grid, including releases hosted on individual artists' storefronts, rather than importing every release those artists have published.

The website has no separate database or local checkout. One site-wide native Bandcamp player handles listening; audio originals remain on Bandcamp. Its headless WordPress integration can supply content to the existing Next.js pages once configured. The plugin adds forms for artists, merch, shows, releases, and About/Legal copy, plus supported colors, logo, and background controls. Navigation, layout changes, a blog, and a press kit still require development.

Current local defaults include seven roster artists, ten archived events with flyers, and merchandise data for later use. Some biographies and About/Legal text remain placeholders. Shop navigation is inactive; the `/merch` route and forms are retained. Contact delivery is unavailable until `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, and `CONTACT_TO_EMAIL` are configured privately, abuse protection is reviewed, and real delivery is verified.

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

The domain has since been connected: Namecheap's nameservers point to Cloudflare (`rachel.ns.cloudflare.com` and `robert.ns.cloudflare.com`), and Cloudflare manages the apex and `www` records for Vercel. The old October 3 timeout at `159.203.172.240` is historical and does not describe the current configuration. On October 6, the domain reaches Vercel and returns HTTP 402 `DEPLOYMENT_DISABLED` because of the hosting team's billing suspension. Do not change nameservers or abandon the domain to solve this billing issue.

When transferring to a destination hosting project:

1. Confirm the domain registration is active and identify the account controlling authoritative DNS.
2. Add the apex and `www` hostnames in the hosting project's domain settings.
3. Apply the exact DNS records that project supplies. Do not guess an IP address from an old tutorial.
4. Preserve unrelated records, including email MX and verification TXT records.
5. Select the primary hostname, redirect the other, and wait for domain verification and HTTPS issuance.
6. Verify both hostnames, direct release URLs, mobile pages, artwork, and Bandcamp purchase links.

Connecting or moving the site does not require transferring the domain registration. Cloudflare DNS records must match whichever hosting project will serve it. Keeping the existing Vercel project through a supported transfer may preserve its domains; a new imported project requires its own domain setup and verification. Confirm the exact records in the destination dashboard before changing DNS.

Node.js 22 is recommended locally and in the project configuration. The Vercel dashboard warned that projects configured for Node.js 20 or older can no longer make new builds after September 30, 2026. Confirm a currently supported runtime for this project before its next deployment; that warning is separate from the existing READY deployment's billing suspension.

## WordPress content editing

WordPress is the owner editor; Next.js remains the website visitors see. Publishing a configured content record does not require editing source files, pushing to GitHub, or deploying a new website build. The plugin also exposes selected colors, logos, and background controls. Navigation and page layout remain in the code. The implementation displays plain text rather than arbitrary WordPress HTML or theme blocks.

### Earlier free artist demonstration (historical)

The original test used ordinary published posts on the then-free `hochirunstransfer.wordpress.com` account. That account has since been upgraded to Personal and its primary address moved to `hochirunstransfer.wpcomstaging.com`. This artist-only mode is retained as a technical reference; the intended handoff uses the full plugin. The earlier native-mode settings were:

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

The core forms/feed/display workflow is proven locally. On October 4, the plugin was installed on paid WordPress.com Personal and a published biography update reached local Next.js. A later failed Plugin File Editor replacement left the hosted plugin invalid and deactivated. Reinstall version 1.3.0 using **Upload plugin**, replacing the existing plugin if prompted, then activate it. Saved database content was not deleted. Review Setup imports and existing event flyers, verify the full public JSON feed, and repeat the hosted publish/update/unpublish cycle before connecting production. Use the canonical HTTPS endpoint displayed by the plugin; the adapter rejects redirects, and WordPress.com redirects secondary domains to the primary domain. See [REST URLs by site type](https://developer.wordpress.com/docs/rest-api-urls-by-site-type/).

Before connecting the full CMS, use **Hochi Runs → Setup → Import existing site content**. The bundled snapshot copies the current artists, products, events, and About/Legal text into published records and release editorial data into drafts. It populates release checkboxes, skips matching existing records in any status, and preserves appearance settings and owner edits. Review existing placeholders before handoff. **The plugin's published collections replace corresponding local collections. An empty collection means no entries.** About and Legal remain local if their page records are absent. Unpublishing a full-CMS record removes it from the website after refresh.

| Form | Fields the owner edits |
| --- | --- |
| Artists | Name, stable website slug, role, biography, HTTPS photo URL, social links, release checkboxes |
| Shop | Merchandise name, price text, HTTPS image URL, purchase URL |
| Live | Date, venue, city, ticket URL, flyer image |
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

On October 3, 2026, an AMAL native post and a later biography edit appeared in local Next.js without rebuilding or pushing code. Page metadata was checked. The paid hosted plugin proof followed on October 4. These are prior proofs, not evidence that the current hosted connection works after the plugin interruption. Ignored `.env.local` still holds hosted CMS settings, but the current port-3001 preview overrides those settings to empty and uses local content. Production CMS configuration and hosted recovery remain pending.

## Enable automatic catalog updates

October 6 status: the workflow is on `main` and configured hourly. Five preceding runs failed at dependency installation because of missing `@emnapi/core` / `@emnapi/runtime` 1.11.3 lockfile entries. The repair passed local Node.js 22 and Linux-resolution checks without upgrading existing package versions, and was committed/pushed as `680d1a0`. [Manual sync run #12](https://github.com/hochi-runs/web/actions/runs/37527071898) then completed successfully in 27 seconds, verifying the repaired remote installation/import workflow. A new catalog deployment and WordPress picker refresh remain unverified. Confirm those steps after restoring hosting before promising unattended visible updates.

The sync reads public catalog and release-page metadata. It is a page parser, not an official catalog API, and may need maintenance if Bandcamp changes its HTML. Bandcamp's published API documents accounts, sales reports, and merch orders rather than a general release-catalog endpoint. See [Bandcamp API documentation](https://bandcamp.com/developer).

The importer combines rendered catalog cards with Bandcamp's overflow list, then reads each release's JSON-LD metadata. It permits only HTTPS Bandcamp release pages and public Bandcamp artwork URLs, limits request size and concurrency, and persists an explicit metadata field list. Audio files, stream URLs, player data, and raw page HTML are not saved.

1. Confirm the dependency-lockfile repair at `680d1a0` is present on GitHub's default branch, `main`.
2. Confirm GitHub Actions and branch rules permit the workflow's catalog commits. Its token requests `contents: write`.
3. Run **Actions → Sync Bandcamp catalog → Run workflow** to verify dependency installation and a complete import.
4. Verify the hosting provider deploys the workflow bot's commits. If it does not, create a production deployment hook for `main` and save its URL as the GitHub Actions secret `BANDCAMP_DEPLOY_HOOK_URL`.
5. Confirm the site deploys the updated snapshot and inspect the new release pages.

The hook step accepts HTTPS Vercel or Netlify build hook URLs and runs only after a changed snapshot is pushed. An accepted hook request starts a deployment; check the host for build completion. If the hook fails after a successful push, manually deploy the saved commit in the hosting dashboard.

The workflow runs at minute 17 each hour and commits only when metadata changes. Expect hourly refresh plus deployment time, rather than immediate updates on upload. GitHub schedules can be delayed or dropped; public-repository schedules can be disabled after 60 inactive days. GitHub token commits also do not trigger other push-based GitHub Actions workflows, so do not rely on one for deployment. See [GitHub schedule behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule) and [token trigger behavior](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow#triggering-a-workflow-from-a-workflow).

Local commands are `npm run sync:bandcamp` to update and `npm run sync:bandcamp:check` to compare without writing. Check mode exits with status 1 for changes or validation failure. A failed import never replaces the last complete snapshot. Builds read that saved snapshot and do not contact Bandcamp.

Existing HR codes and site slugs are local editorial values; imported title, artist, date, artwork, and track information can update. New entries use immutable Bandcamp IDs for site slugs and BC codes. The original curated archive remains when an old release leaves the public grid; remove such archive entries deliberately if desired. Newly imported entries follow the latest valid grid.

If the sync fails, inspect its GitHub Actions logs. A blocked request or changed page structure should be investigated before rerunning; the saved archive continues to serve visitors. Keep the importer in GitHub Actions: Vercel's fair use guidelines list scrapers outside permitted use on its platform.

## Hosting costs

Vercel and WordPress.com policies and prices were checked October 6, 2026 and can change.

Vercel restricts Hobby to personal, non-commercial use and explicitly counts advertising products for sale as commercial. Our assessment is that promoting Bandcamp purchases places this label site in that category. Vercel Pro currently starts at $20 per month with one deploying seat and $20 in usage credit; additional Owner or Member seats cost $20 per month each. Extra usage, add-ons, and taxes can add costs. See [Vercel fair use](https://vercel.com/docs/limits/fair-use-guidelines) and [Pro pricing](https://vercel.com/docs/plans/pro-plan).

Private GitHub organization repositories also require an eligible Vercel paid plan; this is different from a blanket ban on private repositories. A private personal repository is supported on Hobby subject to its other restrictions. Changing this label repository from public to private is not itself a repair for the current billing suspension. See [Vercel Git integration](https://vercel.com/docs/git) and [Hobby restrictions](https://vercel.com/docs/plans/hobby).

Earlier research identified Netlify as another hosting option for commercial projects. If avoiding a subscription is a priority, recheck its current allowances and verify this build in a separate deployment before moving the domain. No Netlify deployment has been verified for this project. See [Netlify commercial use guidance](https://www.netlify.com/guides/netlify-vs-vercel/), [Netlify pricing](https://www.netlify.com/pricing/), and [Next.js on Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/).

The isolated local WordPress demonstration has no hosting subscription. Hosting the full plugin on WordPress.com requires a paid plan: Personal currently costs US$9 billed monthly, before tax. This test account purchased Personal on October 4. The receiving owner needs their own suitable site/plan or an agreed transfer of the existing paid installation. All paid plans permit plugins. The monthly baseline with one Vercel Pro deploying seat is US$29 before tax and other charges. Routine WordPress editors need no Vercel seat. Check the actual checkout price and renewal terms. See [WordPress.com pricing](https://wordpress.com/pricing/) and [plugin installation](https://wordpress.com/support/plugins/install-a-plugin/).

Domain renewals, other CMS hosting choices, and GitHub Actions usage beyond the account's allowance are separate. This application needs no separate website database subscription. Check usage allowances for the actual accounts before promising zero upkeep costs.

## Media protection and design editing

There are no music masters or video files in the public site assets. Music purchase and download delivery stay on Bandcamp, and the website now uses its official embedded player for listening. See [Bandcamp embed instructions](https://get.bandcamp.help/en/articles/15263071-how-do-i-create-a-bandcamp-embedded-player).

Public artwork can be saved, and any media delivered for viewing or listening can potentially be copied or recorded. An iframe, hidden controls, or disabled right-click cannot guarantee otherwise. The practical protection is to keep unpurchased originals out of public assets and responses. Browser tools can inspect network resources; see [Chrome network documentation](https://developer.chrome.com/docs/devtools/network/overview).

The plugin's **Appearance** screen handles the supported colors, logos, and backgrounds. Other design edits are made in React and Tailwind/CSS; the README maps common changes to files. Choosing a different WordPress theme or arranging blocks in its editor does not redesign the Next.js pages. New content sections, including a blog or press kit, still require implementation.

WordPress's standard export is XML content for another WordPress installation, and its themes use WordPress-specific templates. Exporting a theme does not create a drop-in Next.js application; the design requires implementation in React or a rebuild in WordPress. Headless WordPress can supply content through its API, but adds a separate WordPress installation and does not automatically transfer its visual theme builder. See [WordPress export](https://wordpress.org/documentation/article/tools-export-screen/), [theme architecture](https://developer.wordpress.org/themes/getting-started/what-is-a-theme/), and [REST API](https://developer.wordpress.org/rest-api/).

## Launch checklist

- [ ] Confirm this repository and the approved preview show the same design.
- [ ] Arrange repository, hosting, billing, and domain DNS access.
- [x] Repair the dependency lockfile and verify a successful remote catalog workflow run (#12).
- [ ] Verify automatic deployment of a changed catalog snapshot and WordPress release-choice refresh.
- [ ] Choose a CMS mode, migrate required content, configure the production source, and verify publish/update/unpublish in the existing layout.
- [ ] Approve release associations, editorial overrides, hide/show behavior, and branding settings after hosted plugin recovery.
- [ ] Confirm every purchase link and the label's curated catalog selection.
- [ ] Keep Shop navigation disabled until its destination and approved listings are ready; retain the underlying forms/code.
- [ ] Replace placeholder biographies and legal copy, and approve video content.
- [ ] Restore or move hosting, preserve the connected domain/mail DNS, and recheck HTTPS, redirects, release pages, and mobile navigation.
- [ ] Record account owners, the live deployment URL, and a working rollback procedure.

## Verification

Before the CMS addition, the initial live import saved 23 releases, including Low Top Vanz (Amal Techno Remix), Breaking Format, and SDM2 beyond the original 20. A repeat live check found no changes. All 23 catalog tests passed, ESLint passed, and the production build generated all 23 release pages. Generated pages were checked for their title and Bandcamp purchase link, and all 20 original release addresses remain present.

Before the release and branding extension, all 37 JavaScript tests passed on Node.js 20.19.4 and 22.23.2: 23 catalog checks, 12 WordPress adapter checks, and 2 webhook authorization checks. That integrated ESLint and production build passed. The live WordPress.com browser publish/edit proof succeeded against the local production server, including the updated page description. The webhook returned 401 for an unauthenticated POST, 405 for GET, and 200 for the correct Bearer header. The preceding plugin passed PHP lint and 67 checks in an isolated real WordPress/PHP 8.3 instance. The earlier illustrated owner guide includes real editing and website screenshots. These are historical local/CMS results; current hosting and recovery status is stated above.

For the release and branding extension, all 43 JavaScript tests passed: 23 catalog checks, 18 WordPress adapter checks, and 2 webhook authorization checks. TypeScript/ESLint and the production build also passed using the original configured native WordPress mode. PHP 8.3 lint and 131 checks passed in an actual isolated WordPress instance. The demo's blueprint preparation was verified twice without changing hosting settings or `.env.local`.

Version 1.2.0 added two picker-export checks (45 JavaScript checks total), passing TypeScript/ESLint and production build, plus 131 additional actual WordPress Setup checks (262 WordPress checks total). The actual browser Setup flow was verified from an empty local editor: 31 entries imported, 23 release choices refreshed through the Next.js endpoint, a published biography appeared on the preview, and reimport skipped all 31 existing records without overwriting the edit. Test biography restored; original appearance retained. Screenshot: `output/wordpress-demo/setup-import-refresh.jpg`. This predates the hosted installation, version 1.3.0, and domain connection.

The extended demo was tested on loopback: WordPress at `http://127.0.0.1:9401` and Next.js at `http://127.0.0.1:3001`. An anonymous request to the plugin's public content feed returned HTTP 200 JSON. Through the real WordPress UI, publishing Amal's changed biography, social link, and new release association updated the Next.js profile. Publishing a release override updated its description, tags, and credits while preserving its canonical Bandcamp purchase URL. Saving **Website Appearance** changed the background to `#f5f0e8`, accent to `#7c3aed`, Media Library logo/watermark assets, and watermark opacity to `0.08`; the preview's computed styles and image URLs matched. Updating the demo event's venue/date appeared on `/shows`, and the hoodie's `$45 — local demo` display price appeared on `/merch`. No checkout purchase was made. These appearance overrides were subsequently cleared to restore the original design. Hosted recovery, the production catalog-to-picker bridge, account transfer, and successful remote catalog deployment still need verification.

The earlier catalog-only build used Node.js 20.19.4; the integrated CMS build used the bundled Node.js 24.19.0 runtime. Node.js 22 remains the repository's recommended runtime family. The build requires network access to fetch JetBrains Mono from Google Fonts.

The earlier archive in `handoff/hochi-runs-developer-handoff.zip` contains the preceding source snapshot, lockfile, catalog workflow, CMS adapter, plugin ZIP/source/tests, `.env.example`, and illustrated owner guide. It predates the release editor and branding extension and has not been regenerated. Use this working repository for the current implementation. The archive excludes Git history, dependencies, build output, local environment settings, and credentials. Copy the current example environment settings into a private local or hosting configuration; the archive does not include the personal test connection or its webhook secret.

The website changes were pushed to `main` at `485837e` and deployed successfully before the current Vercel billing suspension. Version 1.3.0 passed 59 JavaScript checks, 156 isolated WordPress checks, 151 Setup checks, PHP lint, TypeScript, targeted ESLint, and a production build using local content. Desktop/mobile checks confirmed all ten flyers load without horizontal overflow. The final native bottom-player pass passed full ESLint and the production build; browser checks confirmed its capped, centered 42px dock and playback surviving internal navigation. On October 6, dependency repair `680d1a0` passed remote sync run #12 in 27 seconds. These checks do not establish the currently broken hosted WordPress connection, a new catalog deployment, or updated hosted release choices. Recheck the dated call brief after each recovery step.
