# Optional WordPress owner editing

Uploadable plugin: **Hochi Runs Content Bridge**, in **`hochi-runs-content-bridge.zip`**. Source and owner instructions: [`hochi-content/README.md`](hochi-content/README.md).

The plugin is optional and requires a host that permits custom plugins. It cannot be installed on WordPress.com Free. The project’s native Posts adapter supports the free account separately. [All WordPress.com paid plans](https://wordpress.com/support/plugins/install-a-plugin/), including Personal, accept custom plugins. Personal currently costs US$9 billed monthly or US$48 billed annually, before tax; see [current pricing](https://wordpress.com/pricing/). No plan has been purchased or upgraded for this work.

The ZIP contains the plugin PHP, Setup implementation, current content snapshot, and instructions. Test scripts remain outside the installed plugin. Run `npm run package:wordpress` to rebuild it from the current source.

## Owner controls

The plugin's **Hochi Runs** menu contains **Artists**, **Releases**, **Live**, **Shop**, **Website Pages**, **Appearance**, **Connection**, and **Setup**. Owners publish or update records; the connected Next.js website keeps its layout. Release checkboxes control artist associations when the catalog is loaded; otherwise artists retain the release-route text field and older selections. Release forms provide optional website descriptions, categories, tags, credits, extra streaming links, and hide/show settings, alongside a read-only Bandcamp reference. Bandcamp still supplies source release information, audio, purchase links, and checkout.

Use an **Editor** or **Administrator** role for the shared catalog. Inverse artist/release association updates apply only to related records the current editor can edit. Appearance, Connection, and plugin installation require an administrator.

**Appearance** controls five colors, the header logo, background watermark, background image, and watermark opacity. Other layout changes remain in React/CSS. The version-1 public feed has optional `releaseOverrides` and `appearance` fields, so earlier feeds remain compatible. Empty artist/product/show collections intentionally replace the corresponding local defaults; migrate those records before connecting the full plugin.

The extended forms are a local prototype and have not been deployed to the hosted WordPress.com account or production website. See the [project README](../README.md#edit-content-in-wordpress) and [developer handoff](../HANDOFF.md#wordpress-content-editing) for connection settings and behavior. Activating the plugin on a normal WordPress site creates no demo records.

**Setup → Import existing site content** imports the bundled current content and release choices without overwriting matching existing entries or changing Appearance. It includes source placeholders that owners should replace. The administrator also saves the connected website's `https://YOUR-SITE/api/wordpress/catalog` URL on Setup. Hourly WordPress scheduling, artist/release editor checks throttled to five minutes, and a manual refresh button keep the picker current after Bandcamp sync deployments. Scheduled jobs depend on WordPress traffic. Refresh changes reference metadata only; owner edits and release selections stay intact, and failed requests keep the previous choices. No public write/import endpoint is added.

## Connected local prototype

Use Node.js 24.18+ and run `npm run demo:wordpress` from the project root. The launcher uses official `@wp-playground/cli@3.1.56` with PHP 8.3 and the latest WordPress. It starts WordPress on port 9401, then the connected Next.js development server on port 3001. `npm run demo:wordpress -- --prepare` writes the blueprint without starting servers. Preparation, launch, artist/release publishing, Appearance's Media Library/color/opacity changes, and Live/Shop updates were verified in the connected preview.

Use `npm run demo:wordpress -- --empty` to start with empty WordPress forms and test the actual Setup import button. The private local hook is still configured for the connected preview; save `http://127.0.0.1:3001/api/wordpress/catalog` on Setup to exercise release refresh. HTTP catalog URLs are permitted only in this explicitly enabled local demo.

The CLI process uses a child-only loopback preload to enforce `127.0.0.1` binding for its automatically logged-in local editor. A demo-only MU plugin keeps the exact public Hochi content feed accessible anonymously despite Playground's automatic login redirect. The launcher sets `WORDPRESS_LOCAL_DEMO=1` only for Next.js development, and defines `HOCHI_LOCAL_DEMO` only inside the temporary WordPress process. Those explicit modes allow same-origin local uploads and the local refresh hook; hosted configuration retains public HTTPS validation and production rejects the Next.js local flag.

The generated `output/wordpress-demo/blueprint.json` is private and ignored, with a temporary random hook secret. Do not share it. The launcher leaves existing `.env.local` unchanged. **Ctrl+C** stops the processes; restarting resets WordPress demo edits. These commands do not change a hosted account, publish the site, or buy a plan. See the [local walkthrough](../README.md#try-the-full-owner-editing-demo-locally).

## Isolated verification

The plugin can be linted and tested without a native PHP installation or a live WordPress account using the official WordPress Playground CLI. These commands create a temporary isolated WordPress instance and do not touch an account:

```sh
npx --yes @wp-playground/cli@3.1.56 php --php=8.3 --wp=latest \
  --mount=./wordpress/hochi-content:/wordpress/wp-content/plugins/hochi-content \
  -- -l /wordpress/wp-content/plugins/hochi-content/hochi-content.php

npx --yes @wp-playground/cli@3.1.56 php --php=8.3 --wp=latest \
  --auto-mount=./wordpress/hochi-content \
  --mount=./wordpress/tests:/hochi-tests \
  -- /hochi-tests/integration.php
```

Use the Node version supported by the chosen CLI release. The current CLI package declares Node 24.18+, although the isolated lint run in this workspace also completed on Node 20.19.4.

PHP 8.3 lint and 131 actual WordPress integration checks passed for the extension. Tests cover publication and metadata saving, nonce/capability checks, stable routes, duplicate prevention, published-only export, optional release/appearance schema, URL validation, deliberate empty collections, and association updates respecting related-record permissions. The connected local browser check confirmed artist/release publishing, saved Appearance colors/assets/opacity, an event date/venue update, and a merchandise display-price update. No purchase was made. Local screenshots are [artist editor](../output/wordpress-demo/artist-editor.jpg), [Appearance editor](../output/wordpress-demo/appearance-editor.jpg), and [site preview](../output/wordpress-demo/site-preview.jpg); they are generated files outside the source handoff archive.

For version 1.2.0, an additional 131 actual WordPress Setup checks passed, including complete import validation, existing edits/drafts/Trash, renamed import identities, nonce/role checks, metadata-only refresh, HTTP failures, size limits, scheduling, and throttle behavior. The connected browser imported 31 records into an empty local editor, refreshed all 23 release choices from Next.js, published an artist biography edit to the preview, and repeated the import with zero duplicates while retaining the edit. The test biography was restored; the original white background and logo stayed intact. [Setup screenshot](../output/wordpress-demo/setup-import-refresh.jpg). These checks do not verify a hosted WordPress.com installation.

Official implementation references: [Post type registration](https://developer.wordpress.org/reference/functions/register_post_type/), [Custom meta boxes](https://developer.wordpress.org/plugins/metadata/custom-meta-boxes/), [Custom REST endpoints](https://developer.wordpress.org/rest-api/extending-the-rest-api/adding-custom-endpoints/), [Publication data filter](https://developer.wordpress.org/reference/hooks/wp_insert_post_data/), [Safe outbound HTTP](https://developer.wordpress.org/reference/functions/wp_safe_remote_post/), [Playground CLI testing](https://developer.wordpress.org/playground/handbook/guides/phpunit-testing/).
