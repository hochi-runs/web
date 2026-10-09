import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readSiteData } from './read-site-data.mjs';
import { createWordPressArtists } from '../src/lib/wordpress-catalog.mjs';

// An isolated, temporary WordPress + Next.js preview. No hosted account or
// project environment file is changed. Restarting resets WordPress demo edits.
const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'output/wordpress-demo');
const wpOrigin = 'http://127.0.0.1:9401';
const previewOrigin = 'http://127.0.0.1:3001';

const [catalogData, rosterData, merchData] = await Promise.all([
  readSiteData('releases'), readSiteData('roster'), readSiteData('merch'),
]);
const catalog = catalogData.releases;
const artists = createWordPressArtists(rosterData.members, catalog).map((artist) => ({
  ...artist,
  bio: 'LOCAL DEMO: Edit this biography in WordPress and reload the connected preview. ' + (artist.bio ?? ''),
}));
const assets = await Promise.all(['logo.png', 'hochi-wordmark.png'].map(async (name) => {
  const bytes = await readFile(path.join(root, 'public', name));
  return { name: 'demo-' + name, data: bytes.toString('base64'), width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}));
const payload = { catalog, artists, products: merchData.products, assets };
const encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
const secret = randomBytes(32).toString('base64url');
// Playground's auto-login otherwise redirects anonymous REST requests back
// to themselves. Keep its convenience login on editor pages only.
const anonymousFeed = `<?php
if (defined('HOCHI_LOCAL_DEMO') && HOCHI_LOCAL_DEMO === true && in_array($_SERVER['REQUEST_METHOD'] ?? '', array('GET', 'HEAD'), true)) {
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    $feed = in_array($path, array('/wp-json/hochi/v1/content', '/wp-json/hochi/v1/content/'), true)
        || ($path === '/' && count($_GET) === 1 && ($_GET['rest_route'] ?? '') === '/hochi/v1/content');
    if ($feed) {
        $_COOKIE['playground_auto_login_already_happened'] = '1';
        add_action('init', static function () { remove_action('init', 'playground_auto_login', 1); }, 0);
    }
}
`;
const anonymousFeedEncoded = Buffer.from(anonymousFeed).toString('base64');
const seed = `<?php
require '/wordpress/wp-load.php';
hochi_content_register_types();
wp_set_current_user(1);
wp_mkdir_p(WPMU_PLUGIN_DIR);
file_put_contents(WPMU_PLUGIN_DIR . '/000-hochi-local-feed.php', base64_decode('${anonymousFeedEncoded}'));
update_option('blogname', 'Hochi Runs — Free Local Demo');
update_option('blogdescription', 'Temporary test content, connected only to the local Next.js preview.');
$demo = json_decode(base64_decode('${encoded}'), true);
if (${process.argv.includes('--empty') ? 'false' : 'true'}) {
update_option('hochi_catalog', $demo['catalog'], false);
$upload = wp_upload_dir();
wp_mkdir_p($upload['path']);
foreach ($demo['assets'] as $asset) {
    $file = $upload['path'] . '/' . $asset['name'];
    file_put_contents($file, base64_decode($asset['data']));
    $id = wp_insert_attachment(array('post_title' => $asset['name'], 'post_status' => 'inherit', 'post_mime_type' => 'image/png', 'guid' => $upload['url'] . '/' . $asset['name']), $file);
    wp_update_attachment_metadata($id, array('width' => $asset['width'], 'height' => $asset['height'], 'file' => _wp_relative_upload_path($file)));
}
function hochi_demo_entry($type, $title, $fields, $publish = true) {
    $meta = array();
    foreach ($fields as $key => $value) { $meta['_hochi_' . $key] = $value; }
    $id = wp_insert_post(array('post_type' => $type, 'post_title' => $title, 'post_status' => 'draft', 'meta_input' => $meta));
    if ($publish) { wp_update_post(array('ID' => $id, 'post_status' => 'publish')); }
    return $id;
}
foreach ($demo['artists'] as $artist) {
    $socials = array();
    foreach (($artist['socials'] ?? array()) as $social) { $socials[] = $social['platform'] . ' | ' . $social['url']; }
    hochi_demo_entry('hochi_artist', $artist['name'], array('slug' => $artist['slug'], 'role' => $artist['role'], 'bio' => $artist['bio'], 'photo' => $artist['photo'] ?? '', 'socials' => implode("\\n", $socials), 'release_slugs' => implode("\\n", $artist['releaseSlugs'])));
}
foreach ($demo['products'] as $product) {
    hochi_demo_entry('hochi_product', $product['name'] . ' — Demo', array('price' => $product['price'] . ' (demo)', 'buy_url' => $product['buyUrl'] ?? ''));
}
foreach ($demo['catalog'] as $release) {
    // Draft editorial records do not replace the catalog. Publish an edit to
    // add a website description, artist association, or visibility choice.
    $member_slugs = array();
    foreach ($demo['artists'] as $artist) { if (in_array($release['slug'], $artist['releaseSlugs'], true)) { $member_slugs[] = $artist['slug']; } }
    $credits = array();
    foreach (($release['credits'] ?? array()) as $credit) { $credits[] = $credit['role'] . ' | ' . $credit['name']; }
    $links = array();
    foreach (($release['links'] ?? array()) as $link) { if (strtolower($link['platform']) !== 'bandcamp') { $links[] = $link['platform'] . ' | ' . $link['url']; } }
    hochi_demo_entry('hochi_release', $release['title'], array('slug' => $release['slug'], 'member_slugs' => implode("\\n", $member_slugs),
        'description' => $release['description'] ?? '', 'format' => $release['format'] ?? '',
        'tags' => implode("\\n", $release['tags'] ?? array()), 'credits' => implode("\\n", $credits), 'links' => implode("\\n", $links)), false);
}
hochi_demo_entry('hochi_show', 'Demo event', array('date' => 'TBD — local demo', 'venue' => 'Demo venue', 'city' => 'Washington, D.C.'));
hochi_demo_entry('hochi_page', 'About — Demo', array('page_key' => 'about', 'paragraphs' => 'LOCAL DEMO: This text is edited in WordPress. It does not change the public site.'));
}
update_option('hochi_connection', array('url' => '${previewOrigin}/api/wordpress/revalidate', 'secret' => '${secret}'), false);
unset($GLOBALS['hochi_notification_needed']);
`;
await mkdir(output, { recursive: true });
const blueprintPath = path.join(output, 'blueprint.json');
await writeFile(blueprintPath, JSON.stringify({
  landingPage: '/wp-admin/admin.php?page=hochi-runs', login: true,
  preferredVersions: { php: '8.3', wp: 'latest' },
  steps: [{ step: 'activatePlugin', pluginPath: 'hochi-content/hochi-content.php' }, { step: 'runPHP', code: seed }],
}, null, 2), { mode: 0o600 });
console.log('Prepared a free local demo with ' + artists.length + ' artists and ' + catalog.length + ' Bandcamp releases.');
if (process.argv.includes('--empty')) console.log('WordPress starts empty: use Hochi Runs → Setup to import the bundled existing content.');
if (process.argv.includes('--prepare')) {
  console.log('Blueprint: ' + blueprintPath + ' (temporary local connection secret; do not share).');
} else {
  if (Number(process.versions.node.split('.')[0]) < 24) {
    throw new Error('Use Node.js 24.18 or newer for the WordPress Playground demo tool. The Next.js website itself uses .nvmrc.');
  }
  const children = [];
  let stopping = false;
  function stop(code = 0) {
    if (stopping) return;
    stopping = true;
    for (const child of children) {
      if (!child.pid) continue;
      try {
        if (process.platform === 'win32') child.kill('SIGTERM');
        else process.kill(-child.pid, 'SIGTERM');
      } catch (error) {
        if (error.code !== 'ESRCH') console.error('Could not stop a demo process: ' + error.code);
      }
    }
    process.exitCode = code;
  }
  function run(command, args, env = process.env) {
    const child = spawn(command, args, { cwd: root, env, detached: process.platform !== 'win32', stdio: ['inherit', 'pipe', 'pipe'] });
    children.push(child);
    for (const [source, destination] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) {
      let pending = '';
      source.on('data', (chunk) => {
        pending += chunk.toString();
        const lines = pending.split('\n');
        pending = lines.pop();
        for (const line of lines) destination.write(line.replaceAll(secret, '[local secret]') + '\n');
      });
      source.on('end', () => { if (pending) destination.write(pending.replaceAll(secret, '[local secret]')); });
    }
    child.on('error', (error) => { console.error(error.message); stop(1); });
    child.on('exit', (code) => { if (!stopping) stop(code ?? 1); });
    return child;
  }
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stop());
  run('npx', ['--yes', '@wp-playground/cli@3.1.56', 'server', '--port=9401', '--site-url=' + wpOrigin,
    '--php=8.3', '--workers=1', '--login', '--define-bool', 'HOCHI_LOCAL_DEMO', 'true',
    '--mount=' + path.join(root, 'wordpress/hochi-content') + ':/wordpress/wp-content/plugins/hochi-content',
    '--blueprint=' + blueprintPath], {
      ...process.env,
      PATH: path.dirname(process.execPath) + path.delimiter + (process.env.PATH ?? ''),
      NODE_OPTIONS: [process.env.NODE_OPTIONS ?? '', '--require=' + JSON.stringify(path.join(root, 'scripts/wordpress-demo-loopback.cjs'))].filter(Boolean).join(' '),
    });
  // Wait for the real CMS feed, then connect Next.js. Do not accept redirects.
  const deadline = Date.now() + 120000;
  let ready = false;
  while (!stopping && Date.now() < deadline) {
    try {
      const response = await fetch(wpOrigin + '/?rest_route=/hochi/v1/content', { redirect: 'error', signal: AbortSignal.timeout(1500) });
      if (response.ok && (await response.json()).version === 1) { ready = true; break; }
    } catch { /* WordPress is still installing. */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready) {
    console.error('The local WordPress content feed did not become ready.');
    stop(1);
  } else {
    run(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'dev', '--hostname', '127.0.0.1', '--port', '3001'], {
      ...process.env, NODE_ENV: 'development', WORDPRESS_LOCAL_DEMO: '1',
      WORDPRESS_CONTENT_URL: wpOrigin + '/?rest_route=/hochi/v1/content',
      WORDPRESS_ARTISTS_URL: '', WORDPRESS_MANAGED_ARTIST_SLUGS: '', WORDPRESS_REVALIDATE_SECRET: secret,
    });
    console.log('WordPress editor: ' + wpOrigin + '/wp-admin/admin.php?page=hochi-runs');
    console.log('Connected website: ' + previewOrigin + '/roster/amal');
    console.log('Demo edits reset when this temporary server is restarted.');
  }
}
