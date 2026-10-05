# Hochi Runs Content Bridge

Version **1.3.0** adds event flyers and a linked-image copy action for published artists, events, and products.

This plugin adds **Hochi Runs → Artists, Releases, Live, Shop, Website Pages, Appearance, Connection, and Setup** to WordPress. Owners edit simple fields and use the normal WordPress **Publish**, **Update**, **Save Draft**, and **Move to Trash** controls. The existing Next.js website keeps its design.

It needs WordPress 6.4+ and PHP 7.4+. Install it on a WordPress host that permits plugins. **WordPress.com Free does not allow this upload**; the separate native Posts connection can be used there without changing the plan. Installing this ZIP does not change your theme or create demo content.

## Install and connect

1. In WordPress, open **Plugins → Add New → Upload Plugin**, select `hochi-runs-content-bridge.zip`, install, and activate.
2. Open **Hochi Runs**. Its overview shows the public content endpoint, normally `https://YOUR-WORDPRESS-HOST/wp-json/hochi/v1/content`.
3. Open **Hochi Runs → Setup → Import existing site content**. This copies the bundled current artists, products, events, and About/Legal text into published editing forms. Release editorial entries start as drafts and their titles populate the artist checkboxes immediately. Review the imported placeholders and add real bios, shop links, and event information as needed. Existing matching entries, including drafts and Trash, are skipped; appearance settings are preserved. Activating the plugin alone does not import anything.
4. Give the developer the endpoint. Set `WORDPRESS_CONTENT_URL` on the Next.js host, then redeploy with the plugin adapter enabled according to the project handoff.
5. Verify a small published edit on the website. Drafts, private entries, password-protected entries, and trash are excluded.
6. On **Setup**, save the connected website's public catalog URL, such as `https://YOUR-SITE/api/wordpress/catalog`, and click **Refresh release choices**. The existing live `vercel.app` address can be used before connecting a custom domain. See the catalog refresh details below.

Installing this plugin on an unrelated WordPress site does not give it control of Hochi Runs. The Next.js deployment reads only the WordPress content URL chosen in its server settings. Invite trusted users to that chosen WordPress site; routine content editors do not need GitHub, Vercel, Git, or Node.js. Administrators manage Setup, Appearance, and Connection.

Publishing content does not change the WordPress theme or transfer a page-builder layout into Next.js. Website layout changes still happen in the Next.js project.

The version 1.3.0 flyer fields, feed, setup import, and linked-image copy action have passed isolated local WordPress tests. Installation and publish/update verification of this version on WordPress.com remain pending. Use the canonical HTTPS endpoint shown by the plugin; the Next.js adapter rejects redirects, and WordPress.com can redirect a secondary domain to its primary domain. Installing the plugin alone does not migrate content or connect the public website. The internal `hochi-content` folder and PHP entry filename remain stable so plugin updates preserve the existing identity and saved settings.

## Editing fields

**Artists:** The native title is the artist’s name. Set the role and website route name, such as `amal` to keep `/roster/amal` working. The route name locks after first publication. Change the biography, image, social links, or role freely. Use one social link per line, for example `Instagram | https://www.instagram.com/hochiruns/`. Select releases using the checkboxes after importing or refreshing the catalog on Setup. Without an imported catalog, enter existing website route names, one per line, such as `like-dat-riddim` or `bandcamp-album-1883854658`. Existing saved routes remain available if a catalog refresh omits them. Clearing every selection deliberately shows no releases for this artist.

**Shop:** The title is the product name. Enter a display price, optional image, and optional HTTPS checkout link. This plugin supplies showcase content; payment and stock management stay with the linked shop.

**Live:** Enter the display date, venue or event name, city, and optional ticket/details link. Add an optional **Flyer image URL**, or use **Choose image** to upload or select its flyer. The connected website displays the whole flyer and links to the full image. Events without flyers still work. Include a timezone in the date when useful. The current Next.js Live page separates upcoming events from the archive and sorts them by date; **Order** is retained in the source feed.

**Website Pages:** Select About or Legal and enter plain paragraphs separated by blank lines. Publish only one entry for each page. Publishing blank text deliberately clears that page’s text. Drafting or deleting its entry removes that page override, letting the website use its local fallback.

**Releases:** Select an existing website release route. The form displays the imported Bandcamp title, artist, artwork, date, and purchase link as read-only information. Edit the website description, category, tags (up to 30), credits (`role | name` per line), extra streaming links (`platform | HTTPS URL`), associated artists, or Hide checkbox. These fields do not edit the music, title, artwork, date, or Bandcamp purchase destination. The route locks after first publication. Missing editorial fields inherit the catalog; saving empty descriptions or lists clears those fields. A blank category uses the catalog category. Unpublishing or deleting an override restores the catalog presentation, while separately saved artist selections remain in place. An empty override collection never deletes the Bandcamp catalog.

Both artist and release association pickers update their inverse selection on existing published entries the editor has permission to edit. Use the WordPress Editor or Administrator role for the shared catalog workflow; Authors can edit only their own entries and cannot modify other owners’ inverse selections. A saved artist release selection is authoritative, including an empty selection. WordPress changes only relationship metadata during this synchronization.

**Appearance (administrators):** Use the native WordPress color pickers for background, text, accent, secondary text, and borders. Choose the main logo, background wordmark, and background image with the Media Library chooser, or paste public HTTPS image URLs. Optional wordmark opacity ranges from 0 to 0.3. Blank colors or opacity and cleared image URLs use the existing website defaults. This changes the connected website’s branding within its current layout; it does not change the WordPress theme.

Images must use public HTTPS URLs ending in `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, or `.avif`. Use **Choose image** to upload or select an image through WordPress’s existing Media Library, or copy **File URL** and paste it. This plugin adds no audio uploading, audio streaming, or paid file downloads. Public images remain copyable.

For an image hosted elsewhere, first publish the artist, event, or product. Paste its current direct image-file URL into the image field and click **Copy linked image to Media Library**. This saves the entry and replaces the external URL with a WordPress upload URL. Use a direct JPG/PNG/etc. link, rather than an Instagram post or event-page URL. The action requires permission to edit the entry and upload media, checks the downloaded image, and accepts images up to 20 megapixels and 8 MB or the host's lower upload limit. It uses WordPress's safe HTTP client with a timeout and no redirects. A failed copy keeps the previous image and displays the actual error; copying an existing Media Library URL reuses that upload.

Invalid saves retain the previously valid content and display a notice. Invalid new entries stay in draft. Duplicate published artist routes, release routes, and About/Legal choices are rejected. If another tool corrupts published records, the feed returns an error instead of exporting ambiguous records.

## Optional immediate publish notifications

The Next.js site can refresh through its regular cache interval. An administrator can also open **Hochi Runs → Connection** and set:

- Website endpoint: `https://YOUR-SITE/api/wordpress/revalidate`
- Shared secret: the same `WORDPRESS_REVALIDATE_SECRET` configured on the Next.js host, 32–256 characters using letters, numbers, underscores, or hyphens only

The plugin sends a small notification after published content (including release overrides) is edited, published, unpublished, trashed, or deleted, and after appearance settings are saved. Authentication uses an `Authorization: Bearer` header. The endpoint URL must have no credentials, query string, or fragment. Requests have a five-second timeout, no redirects, and a capped response. Production requests use WordPress’s safe HTTP client; literal `http://localhost:PORT/api/wordpress/revalidate` is available only for local testing.

The saved secret is never shown in the form or public feed. Leave its field blank to retain it, or use the removal checkbox to disable notifications. The connection screen shows whether the last notification succeeded, without exposing the secret. Failed notifications do not undo an owner’s saved edit; regular website refresh can still retrieve it.

## Feed contract

The read-only public endpoint returns these required top-level keys, with optional `releaseOverrides` and `appearance` extensions:

```json
{
  "version": 1,
  "artists": [],
  "products": [],
  "shows": [],
  "pages": {}
}
```

Artists contain `slug`, `name`, `role`, and optional `bio`, `photo`, `socials`, and `releaseSlugs`. Products contain `name`, `price`, and optional `image` and `buyUrl`. Events contain `date`, `venue`, `city`, and optional `image` and `ticketUrl`. About/Legal overrides contain `paragraphs`. No user records, author identities, internal post metadata, drafts, passwords, or connection settings are included. There is no public write endpoint.

`releaseOverrides` contains published entries with `slug` and optional `description`, `format`, `tags`, `credits` (`role`/`name`), `links` (`platform`/`url`), `memberSlugs`, and boolean `hidden`. It contains no Bandcamp source metadata or audio URLs. `appearance` contains only explicitly saved color, image, and opacity fields; connection credentials are never exported.

## Initial import and automatic release choices

The administrator's **Setup** import reads `initial-content.json` bundled with this ZIP. It validates the full payload before saving, preserves stable artist/release routes, skips matching existing entries, and leaves Appearance unchanged. The bundled snapshot retains the repository's current placeholder text and display-only shop items. Artist release selections start from explicit source associations or exact artist-name matches; review these in Artists. Release descriptions, categories, tags, credits, and extra links are copied into draft editorial records so publishing an edit starts with the existing values. Repeating the import preserves owner edits, renamed imported items, drafts, and Trash.

The ZIP includes the sourced event flyers and shirt artwork under `assets/`. During a fresh import, each bundled artwork reference becomes an HTTPS image URL served from that installed plugin on the new WordPress site. These images do not depend on a temporary Instagram CDN link or the developer's test WordPress account. Keep the complete plugin folder and its assets installed.

**Existing records are preserved.** Updating the plugin and repeating the import will not add flyers to events already in WordPress or replace existing product images. Open those entries and add their images using **Choose image** or **Copy linked image to Media Library**. The import creates only missing entries.

The website exposes `GET /api/wordpress/catalog` with `{ "version": 1, "releases": [...] }`. This separate read-only feed includes public picker fields only: `slug`, `title`, `artist`, `code`, `cover`, `date`, `buyUrl`, and `memberSlugs`. Hidden releases remain selectable. It does not read WordPress, contain audio URLs, or require the private publish secret.

After the administrator saves its public HTTPS URL on Setup, WordPress schedules hourly refreshes and checks when an artist/release editing screen is opened, at most once every five minutes. WordPress's scheduled jobs run when its site receives traffic; use **Refresh release choices** for an immediate check. Failed or malformed responses retain the previous catalog. Successful refreshes update reference metadata only, preserving all published/draft editorial records and artist selections. New releases become available after the GitHub Bandcamp sync updates the catalog and the hosting provider deploys it; refresh does not automatically publish editorial overrides or assign new releases to artists.

The URL must end exactly in `/api/wordpress/catalog`, with no credentials, query, or fragment. Production uses WordPress's safe HTTPS client with a five-second timeout, no redirects, and a 1 MiB response cap. There is no public write/import endpoint. For a new handoff build, the developer runs `npm run package:wordpress` to regenerate the snapshot and uploadable ZIP from the current source; this does not modify a hosted WordPress account.

A deliberately enabled isolated local prototype can define `HOCHI_LOCAL_DEMO=true`. This permits HTTP image URLs only from the exact loopback WordPress site origin and port under `/wp-content/uploads/`, plus the loopback revalidation hook. Production image, social, shop, and ticket links continue to require public HTTPS. The local demo is separate from any hosted WordPress account.
