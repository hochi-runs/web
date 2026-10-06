# Hochi Runs Content Bridge

Installable plugin: [hochi-runs-content-bridge.zip](hochi-runs-content-bridge.zip). Source and editing instructions: [hochi-content/README.md](hochi-content/README.md).

The plugin supplies WordPress forms for artists, release overrides, events, merchandise, About/Legal text, and supported branding fields. Next.js keeps the website layout. Use a WordPress installation that permits custom plugins.

## Package contents

- `hochi-content.php` and `setup.php`: plugin implementation.
- `initial-content.json`: current site content used by Setup import.
- `assets/`: event flyers and merchandise artwork needed by a fresh installation.
- `README.md`: installation and field instructions.

From the repository root, run `npm run package:wordpress` to regenerate the snapshot and ZIP. The ZIP contains only those plugin files; tests and generated screenshots remain outside it.

## Connection

Configure the deployed website’s `WORDPRESS_CONTENT_URL` with the chosen WordPress site’s canonical HTTPS `/wp-json/hochi/v1/content` URL. Import and review the content before connecting: published artist, product, and event collections replace the website defaults, including empty collections.

In WordPress Setup, use the website’s public `/api/wordpress/catalog` URL for release choices. The optional private revalidation secret is configured separately in WordPress Connection and the website’s environment. Only the WordPress URL selected by the deployment controls its content.

## Local checks

JavaScript integration checks run with `npm run test:catalog`. PHP integration checks are in `tests/integration.php` and `tests/setup-integration.php` and run in an isolated WordPress installation.

The optional `npm run demo:wordpress` launcher requires Node.js 24.18+, creates a temporary WordPress instance, and regenerates an ignored private blueprint under `output/wordpress-demo/`. Demo edits reset when restarted.

Version 1.3.0 is the current source. Hosted ZIP recovery and publication testing remain pending as of October 6, 2026.
