<?php
/** Run in a fresh isolated WordPress; never ship this test in the plugin ZIP. */
set_exception_handler(function ($error) { echo 'FAIL: ' . $error->getMessage() . "\n" . $error->getTraceAsString() . "\n"; exit(1); });
require '/wordpress/wp-load.php';
require_once '/wordpress/wp-content/plugins/hochi-content/hochi-content.php';
hochi_content_register_types();
wp_set_current_user(1);
$_POST = array();
delete_option('hochi_connection');
// Exercise portable plugin asset URLs on a public HTTPS origin inside isolated WordPress.
add_filter('plugins_url', function ($url, $path, $plugin) {
    return basename($plugin) === 'hochi-content.php' ? 'https://cms.hochiruns.com/wp-content/plugins/hochi-content/' . ltrim($path, '/') : $url;
}, 10, 3);

$hochi_setup_checks = 0;
function hochi_setup_test($condition, $message) {
    global $hochi_setup_checks;
    if (!$condition) { throw new RuntimeException($message); }
    $hochi_setup_checks++;
}
function hochi_setup_test_posts($type = null) {
    return get_posts(array('post_type' => $type ? $type : hochi_content_types(), 'post_status' => array_keys(get_post_stati()), 'numberposts' => 1000, 'suppress_filters' => true));
}
function hochi_setup_test_post($type, $slug) {
    $ids = get_posts(array('post_type' => $type, 'post_status' => array_keys(get_post_stati()), 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => '_hochi_slug', 'meta_value' => $slug, 'suppress_filters' => true));
    return $ids ? $ids[0] : 0;
}

hochi_setup_test(hochi_setup_test_posts() === array(), 'Activation must not import any content');
hochi_setup_test(get_option('hochi_catalog', array()) === array(), 'Activation must not create release choices');
$fixture = json_decode(file_get_contents('/wordpress/wp-content/plugins/hochi-content/initial-content.json'), true);
$prepared = hochi_setup_prepare_import($fixture);
hochi_setup_test(!is_wp_error($prepared), 'Bundled initial content must completely validate');
$expected = count($prepared['records']);

// Optional flyers survive setup and use the same public image validation as the editor.
$flyer_fixture = $fixture;
$flyer_fixture['shows'] = array(array('date' => 'Sep 4, 2026', 'venue' => 'HOCHI HOUR', 'city' => 'New York City', 'image' => 'https://cdn.hochiruns.com/event-flyer.jpg', 'ticketUrl' => 'https://ra.co/events/2525516'));
$flyer_prepared = hochi_setup_prepare_import($flyer_fixture);
hochi_setup_test(!is_wp_error($flyer_prepared), 'Initial event flyer validates');
$event_records = array_values(array_filter($flyer_prepared['records'], function ($record) { return $record['type'] === 'hochi_show'; }));
hochi_setup_test(count($event_records) === 1 && $event_records[0]['meta']['image'] === $flyer_fixture['shows'][0]['image'], 'Initial event flyer maps into editable image metadata');
$flyer_fixture['shows'][0]['image'] = 'https://cdn.hochiruns.com/master.mp3';
hochi_setup_test(is_wp_error(hochi_setup_prepare_import($flyer_fixture)), 'Invalid initial flyer rejects the import before writes');

// Packaged artwork resolves on the receiving WordPress account, without a developer CMS hostname.
$bundled_shows = array_values(array_filter($fixture['shows'], function ($item) { return isset($item['bundledImage']); }));
$bundled_products = array_values(array_filter($fixture['products'], function ($item) { return isset($item['bundledImage']); }));
hochi_setup_test(count($bundled_shows) > 0 && count($bundled_products) > 0, 'The prepared handoff includes actual event and merch artwork');
$bundled_show = $bundled_shows[0];
$bundled_product = $bundled_products[0];
$bundled_show_url = 'https://cms.hochiruns.com/wp-content/plugins/hochi-content/assets/' . $bundled_show['bundledImage'];
$bundled_product_url = 'https://cms.hochiruns.com/wp-content/plugins/hochi-content/assets/' . $bundled_product['bundledImage'];
hochi_setup_test(hochi_setup_image($bundled_show) === $bundled_show_url && hochi_setup_image($bundled_product) === $bundled_product_url, 'Real packaged event and merch assets resolve through receiving-site plugins_url');
foreach (array('../shows/flyer.png', 'shows/../merch/shirt.png', 'shows/%2e%2e/flyer.png', '/shows/flyer.png', 'https://cdn.hochiruns.com/flyer.png', 'shows/flyer.svg', 'shows/missing-image.png', 'shows/flyer.png?x=1', null, array()) as $path) {
    $invalid_artwork = array('bundledImage' => $path);
    hochi_setup_test(is_wp_error(hochi_setup_image($invalid_artwork)), 'Bundled image resolver rejects traversal, schemes, missing files, unsupported types, and non-string paths');
}
hochi_setup_test(is_wp_error(hochi_setup_image(array('bundledImage' => $bundled_show['bundledImage'], 'image' => 'https://cdn.hochiruns.com/conflicting.jpg'))), 'Ambiguous bundled and external images are rejected');
$invalid_artwork_fixture = $fixture;
$invalid_artwork_fixture['shows'][0]['bundledImage'] = 'shows/../../setup.php';
unset($invalid_artwork_fixture['shows'][0]['image']);
hochi_setup_test(is_wp_error(hochi_setup_import_content($invalid_artwork_fixture)) && hochi_setup_test_posts() === array(), 'A bad bundled file rejects the complete import before any post is written');

// Any later bad record invalidates the entire import, before the first database write.
$bad = $fixture;
$bad['releases'][count($bad['releases']) - 1]['cover'] = 'https://cdn.hochiruns.com/master.mp3';
hochi_setup_test(is_wp_error(hochi_setup_import_content($bad)), 'A bad late record must reject the whole payload');
hochi_setup_test(hochi_setup_test_posts() === array() && get_option('hochi_catalog', array()) === array(), 'Rejected payload must not create posts or replace the catalog');
$bad = $fixture;
$bad['artists'][0]['releaseSlugs'][] = 'unknown-release';
hochi_setup_test(is_wp_error(hochi_setup_prepare_import($bad)), 'Broken initial artist release references must be rejected');
$bad = $fixture;
$bad['releases'][0]['memberSlugs'] = array('unknown-artist');
hochi_setup_test(is_wp_error(hochi_setup_prepare_import($bad)), 'Broken initial release artist references must be rejected');
$bad = $fixture;
$bad['products'][] = $bad['products'][0];
hochi_setup_test(is_wp_error(hochi_setup_import_content($bad)) && hochi_setup_test_posts() === array(), 'Duplicate bundled entries must reject before writes');

// Existing draft entries must stay drafts with their current owner content.
$owner_artist = wp_insert_post(array('post_type' => 'hochi_artist', 'post_title' => 'Owner artist', 'post_status' => 'draft', 'meta_input' => array('_hochi_slug' => $fixture['artists'][0]['slug'], '_hochi_role' => 'Owner role', '_hochi_bio' => 'Owner biography', '_hochi_release_slugs' => 'older-selected-release')));
$release_slug = $fixture['releases'][0]['slug'];
$owner_release = wp_insert_post(array('post_type' => 'hochi_release', 'post_title' => 'Owner release label', 'post_status' => 'draft', 'meta_input' => array('_hochi_slug' => $release_slug, '_hochi_description' => 'Owner release description', '_hochi_member_slugs' => 'owner-selected-artist')));
wp_update_post(array('ID' => $owner_release, 'post_status' => 'publish'));
hochi_setup_test(get_post_status($owner_release) === 'publish', 'Existing owner release fixture must publish');
$appearance = array('accentColor' => '#123456', 'backgroundColor' => '#ffffff');
update_option('hochi_appearance', $appearance, false);

wp_set_current_user(0);
hochi_setup_test(is_wp_error(hochi_setup_import_content($fixture)) && count(hochi_setup_test_posts()) === 2, 'Anonymous callers cannot import');
hochi_setup_test(is_wp_error(hochi_setup_store_catalog_connection('https://hochiruns.com/api/wordpress/catalog')), 'Anonymous callers cannot configure sync');
wp_set_current_user(1);
$_POST = array();
hochi_setup_test(hochi_setup_admin_action('hochi_import_content')->get_error_code() === 'hochi_setup_nonce', 'Admin import requires a valid nonce');
$_POST = array('_wpnonce' => 'forged');
hochi_setup_test(hochi_setup_admin_action('hochi_save_catalog_connection')->get_error_code() === 'hochi_setup_nonce', 'Admin connection changes reject a forged nonce');
$editor_id = wp_insert_user(array('user_login' => 'setup-editor', 'user_pass' => 'isolated-test-password', 'role' => 'editor'));
wp_set_current_user($editor_id);
$_POST = array('_wpnonce' => wp_create_nonce('hochi_import_content'));
hochi_setup_test(hochi_setup_admin_action('hochi_import_content')->get_error_code() === 'hochi_forbidden', 'Editors cannot import even with a valid nonce');
wp_set_current_user(1);
$_POST = array('_wpnonce' => wp_create_nonce('hochi_import_content'));
$import = hochi_setup_admin_action('hochi_import_content');
$_POST = array();
hochi_setup_test(!is_wp_error($import) && $import['created'] === $expected - 2 && $import['skipped'] === 2, 'Valid admin first import adds missing records and skips existing identities');
hochi_setup_test(count(hochi_setup_test_posts()) === $expected, 'Import produces one record for each bundled logical identity');
hochi_setup_test(get_post_status($owner_artist) === 'draft' && get_post_meta($owner_artist, '_hochi_bio', true) === 'Owner biography', 'Existing artist draft and biography are preserved');
hochi_setup_test(get_post_meta($owner_artist, '_hochi_release_slugs', true) === 'older-selected-release', 'Existing artist selections are preserved');
hochi_setup_test(get_post_meta($owner_release, '_hochi_description', true) === 'Owner release description' && get_post_meta($owner_release, '_hochi_member_slugs', true) === 'owner-selected-artist', 'Import does not overwrite owner release edits or inverse relationships');
hochi_setup_test(get_post_status($owner_release) === 'publish', 'Import preserves preexisting published release status');
hochi_setup_test(get_option('hochi_appearance') === $appearance, 'Import leaves appearance unchanged');
hochi_setup_test(count(hochi_setup_test_posts('hochi_show')) === count($fixture['shows']), 'An empty event list imports no demo event');
hochi_setup_test(count(hochi_content_catalog()) === count($fixture['releases']), 'Import populates the release picker');
$bundled_show_posts = get_posts(array('post_type' => 'hochi_show', 'post_status' => 'publish', 'numberposts' => 1, 'meta_key' => '_hochi_venue', 'meta_value' => $bundled_show['venue']));
hochi_setup_test(count($bundled_show_posts) === 1 && get_post_meta($bundled_show_posts[0]->ID, '_hochi_image', true) === $bundled_show_url, 'First import publishes bundled event artwork as an editable public URL');
$bundled_product_posts = get_posts(array('post_type' => 'hochi_product', 'post_status' => 'publish', 'numberposts' => 1000));
$bundled_product_post = null;
foreach ($bundled_product_posts as $post) { if ($post->post_title === $bundled_product['name']) { $bundled_product_post = $post; break; } }
hochi_setup_test($bundled_product_post !== null && get_post_meta($bundled_product_post->ID, '_hochi_image', true) === $bundled_product_url, 'First import publishes bundled shirt artwork on the receiving site');
update_post_meta($bundled_show_posts[0]->ID, '_hochi_image', 'https://cdn.hochiruns.com/owner-updated-flyer.jpg');

foreach (hochi_setup_test_posts('hochi_release') as $release) {
    if ($release->ID === $owner_release) { continue; }
    $source = null;
    foreach ($fixture['releases'] as $item) { if ($item['slug'] === get_post_meta($release->ID, '_hochi_slug', true)) { $source = $item; break; } }
    hochi_setup_test($release->post_status === 'draft' && $source !== null, 'Imported release editorial entries start as drafts');
    hochi_setup_test(get_post_meta($release->ID, '_hochi_description', true) === hochi_content_text($source['description'], 12000, true), 'Release draft starts with the existing description');
    hochi_setup_test(get_post_meta($release->ID, '_hochi_member_slugs', true) === implode("\n", $source['memberSlugs']), 'Release draft starts with the existing artist choices');
}
$again = hochi_setup_import_content($fixture);
hochi_setup_test(!is_wp_error($again) && $again['created'] === 0 && $again['skipped'] === $expected, 'Repeating import is idempotent');
hochi_setup_test(get_post_meta($bundled_show_posts[0]->ID, '_hochi_image', true) === 'https://cdn.hochiruns.com/owner-updated-flyer.jpg', 'Retrying a bundled import preserves the owner’s subsequent artwork edit');
$products = hochi_setup_test_posts('hochi_product');
$product_id = $products[0]->ID;
wp_update_post(array('ID' => $product_id, 'post_title' => 'Owner renamed item'));
update_post_meta($product_id, '_hochi_price', '$99 owner edit');
wp_trash_post($products[1]->ID);
$again = hochi_setup_import_content($fixture);
hochi_setup_test(!is_wp_error($again) && $again['created'] === 0 && count(hochi_setup_test_posts()) === $expected, 'Renaming or trashing an imported item must not recreate it');
hochi_setup_test(get_post($product_id)->post_title === 'Owner renamed item' && get_post_meta($product_id, '_hochi_price', true) === '$99 owner edit', 'Reimport preserves renamed merch and price edits');
hochi_setup_test(get_post_status($products[1]->ID) === 'trash', 'Reimport does not restore an intentionally trashed item');
hochi_setup_test(get_option('hochi_import_lock') === false, 'Import lock is always released');

foreach (array('http://hochiruns.com/api/wordpress/catalog', 'https://127.0.0.1/api/wordpress/catalog', 'http://127.0.0.1:3001/api/wordpress/catalog', 'http://localhost:3001/api/wordpress/catalog', 'https://intranet/api/wordpress/catalog', 'https://host.local/api/wordpress/catalog', 'https://user:pass@hochiruns.com/api/wordpress/catalog', 'https://hochiruns.com/api/wordpress/catalog?secret=x', 'https://hochiruns.com/api/wordpress/catalog#x', 'https://hochiruns.com/api/wordpress/content', 'https://hochiruns.com:8080/api/wordpress/catalog') as $url) {
    hochi_setup_test(hochi_setup_catalog_url($url) === '', 'Catalog URL must use the strict public HTTPS endpoint');
}
hochi_setup_test(hochi_setup_catalog_url('https://hochiruns.com/api/wordpress/catalog') !== '', 'Public HTTPS catalog URL is accepted');
hochi_setup_test(hochi_setup_store_catalog_connection('https://hochiruns.com/api/wordpress/catalog') === true, 'Administrator can configure the public catalog URL');
hochi_setup_test(wp_next_scheduled('hochi_catalog_refresh') !== false, 'Configured catalog schedules an hourly refresh');
hochi_setup_schedule_catalog();
hochi_setup_test(count(wp_get_scheduled_event('hochi_catalog_refresh')->args) === 0, 'Refresh does not create argument-specific duplicate schedules');

$captured = array();
$next_catalog = array('version' => 1, 'releases' => array(array('slug' => 'brand-new-release', 'title' => 'New Release', 'artist' => 'AMAL', 'code' => 'BC-NEW', 'cover' => 'https://f4.bcbits.com/img/a123_10.jpg', 'date' => '03 Oct 2026', 'buyUrl' => 'https://hochiruns.bandcamp.com/album/new-release', 'memberSlugs' => array('amal'), 'audioUrl' => 'private-master.mp3', 'user_email' => 'private@example.com', 'description' => 'Not an editorial overwrite')));
$http_mode = 'success';
$http_count = 0;
add_filter('pre_http_request', function ($preempt, $arguments, $url) use (&$captured, &$next_catalog, &$http_mode, &$http_count) {
    $http_count++;
    $captured = array('args' => $arguments, 'url' => $url);
    if ($http_mode === 'error') { return new WP_Error('network_failure', 'Private diagnostic text that must not appear in status'); }
    if ($http_mode === 'oversize') { $body = str_repeat('x', 1024 * 1024 + 1); } else { $body = wp_json_encode($next_catalog); }
    return array('headers' => array(), 'body' => $body, 'response' => array('code' => $http_mode === 'redirect' ? 302 : 200, 'message' => 'Test response'), 'cookies' => array());
}, 10, 3);
$before_meta = get_post_meta($owner_release);
$before_artist_meta = get_post_meta($owner_artist);
$refresh = hochi_setup_refresh_catalog(true);
hochi_setup_test($refresh === 1 && isset(hochi_content_catalog()['brand-new-release']), 'Manual refresh makes newly published Bandcamp catalog releases selectable');
hochi_setup_test(array_keys(hochi_content_catalog()['brand-new-release']) === array('slug', 'title', 'artist', 'code', 'date', 'cover', 'buyUrl', 'memberSlugs'), 'Catalog stores only the public metadata allowlist');
hochi_setup_test(get_post_meta($owner_release) === $before_meta && get_post_meta($owner_artist) === $before_artist_meta, 'Catalog refresh never overwrites release edits or artist selections');
hochi_setup_test(get_post_status($owner_release) === 'publish' && get_option('hochi_appearance') === $appearance, 'Refresh preserves publication and appearance settings');
hochi_setup_test($captured['args']['reject_unsafe_urls'] === true && $captured['args']['redirection'] === 0 && $captured['args']['timeout'] === 5 && $captured['args']['limit_response_size'] === 1024 * 1024 + 1, 'Refresh uses the SSRF-safe client with bounded time/body and no redirects');
hochi_setup_test(!isset($captured['args']['headers']['Authorization']) && $captured['args']['cookies'] === array(), 'Public catalog refresh sends no site secrets or login credentials');
ob_start();
hochi_content_picker('release_slugs', 'older-selected-release', array('brand-new-release' => 'New release'));
$picker = ob_get_clean();
hochi_setup_test(strpos($picker, 'older-selected-release') !== false && strpos($picker, '(existing selection)') !== false, 'Missing older catalog routes remain visible and selected');
$count = $http_count;
hochi_setup_refresh_catalog();
hochi_setup_test($http_count === $count, 'Automatic editor checks are throttled for five minutes');
$last_good = get_option('hochi_catalog');
foreach (array('error', 'oversize', 'redirect') as $mode) {
    $http_mode = $mode;
    hochi_setup_test(is_wp_error(hochi_setup_refresh_catalog(true)), 'Fetch failure must report a safe failure');
    hochi_setup_test(get_option('hochi_catalog') === $last_good, 'Fetch failure must retain the last valid release choices');
}
$http_mode = 'success';
foreach (array(array('version' => 1, 'releases' => array()), array('version' => 2, 'releases' => $next_catalog['releases']), array('version' => 1, 'releases' => array($next_catalog['releases'][0], $next_catalog['releases'][0])), array('version' => 1, 'releases' => array(array('slug' => 'bad', 'title' => 'Bad', 'artist' => 'Bad', 'cover' => 'https://cdn.hochiruns.com/song.wav')))) as $invalid) {
    $next_catalog = $invalid;
    hochi_setup_test(is_wp_error(hochi_setup_refresh_catalog(true)) && get_option('hochi_catalog') === $last_good, 'Invalid catalog payload must retain all known choices');
}
$state = wp_json_encode(get_option('hochi_catalog_status'));
hochi_setup_test(strpos($state, 'Private diagnostic') === false && strpos($state, 'private@example') === false && get_option('hochi_catalog_status')['state'] === 'error', 'Stored refresh status contains no raw upstream diagnostics or private fields');
hochi_setup_test(get_transient('hochi_catalog_refreshing') === false, 'Refresh lock is always cleared');
hochi_setup_test(hochi_setup_store_catalog_connection('') === true && wp_next_scheduled('hochi_catalog_refresh') === false, 'Disabling the connection removes recurring checks');
require_once ABSPATH . 'wp-admin/includes/template.php';
ob_start();
hochi_setup_screen();
$screen = ob_get_clean();
hochi_setup_test(strpos($screen, 'Import existing site content') !== false && strpos($screen, 'Refresh release choices') !== false && strpos($screen, 'does not connect or take control') !== false, 'Setup screen presents import, refresh and the explicit website pairing boundary');
echo 'PASS: ' . $hochi_setup_checks . " setup integration checks\n";
