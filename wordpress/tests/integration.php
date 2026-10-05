<?php
/** Runs only in an isolated test WordPress; not included in the upload ZIP. */
set_exception_handler(function ($error) { echo 'FAIL: ' . $error->getMessage() . "\n" . $error->getTraceAsString() . "\n"; exit(1); });
require '/wordpress/wp-load.php';
require_once '/wordpress/wp-content/plugins/hochi-content/hochi-content.php';
hochi_content_register_types();
wp_set_current_user(1);

$hochi_test_checks = 0;
function hochi_test($condition, $message) {
    global $hochi_test_checks;
    if (!$condition) { throw new RuntimeException($message); }
    $hochi_test_checks++;
}
function hochi_test_form($type, $title, $fields, $status = 'publish') {
    $id = wp_insert_post(array('post_type' => $type, 'post_title' => $title, 'post_status' => 'draft'), true);
    hochi_test(!is_wp_error($id), 'Draft insertion failed');
    $_POST = array('hochi_content_nonce' => wp_create_nonce('hochi_content_save_' . $id), 'hochi' => $fields);
    wp_update_post(array('ID' => $id, 'post_status' => $status));
    $_POST = array();
    return $id;
}

hochi_test(wp_json_encode(hochi_content_payload()) === '{"version":1,"artists":[],"products":[],"shows":[],"pages":{}}', 'Activation must not seed or publish content');
hochi_test(strpos(wp_json_encode(hochi_content_payload()), '"pages":{}') !== false, 'Empty pages must serialize as an object');

$artist = hochi_test_form('hochi_artist', 'AMAL', array('slug' => 'amal', 'role' => 'Artist', 'bio' => '<b>Updated owner biography</b>', 'photo' => 'https://cdn.hochiruns.com/amal.jpg', 'socials' => 'Instagram | https://www.instagram.com/hochiruns/', 'release_slugs' => "like-dat-riddim\nbandcamp-album-1883854658"));
hochi_test(get_post_status($artist) === 'publish', 'Valid native form must publish');
hochi_test(get_post_meta($artist, '_hochi_slug_locked', true) === '1', 'Artist slug must lock after publication');
update_post_meta($artist, '_hochi_private_note', 'private-account-note');
$product = hochi_test_form('hochi_product', 'Hochi Hoodie', array('price' => '$25', 'image' => 'https://cdn.hochiruns.com/hoodie.webp', 'buy_url' => 'https://hochiruns.bandcamp.com/merch/hoodie'));
$show_fields = array('date' => 'Oct 23, 2026 · 9 PM EDT', 'venue' => 'Test venue', 'city' => 'Washington, D.C.', 'image' => 'https://cdn.hochiruns.com/event-flyer.jpg', 'ticket_url' => 'https://tickets.hochiruns.com/show');
$show = hochi_test_form('hochi_show', 'Launch show', $show_fields);
$about = hochi_test_form('hochi_page', 'About website', array('page_key' => 'about', 'paragraphs' => "First paragraph.\n\nSecond paragraph."));
$draft = hochi_test_form('hochi_artist', 'Draft Artist', array('slug' => 'draft-artist', 'role' => 'DJ'), 'draft');
$private = hochi_test_form('hochi_artist', 'Private Artist', array('slug' => 'private-artist', 'role' => 'DJ'), 'private');
$password = hochi_test_form('hochi_artist', 'Password Artist', array('slug' => 'password-artist', 'role' => 'DJ'));
wp_update_post(array('ID' => $password, 'post_password' => 'not-public'));

$payload = hochi_content_payload();
hochi_test(!is_wp_error($payload), 'Valid published feed must export');
hochi_test(array_keys($payload) === array('version', 'artists', 'products', 'shows', 'pages'), 'Exact top-level public schema');
hochi_test(count($payload['artists']) === 1 && $payload['artists'][0]['slug'] === 'amal', 'Draft, private, and password-protected artists must be excluded');
hochi_test($payload['artists'][0]['bio'] === 'Updated owner biography', 'Plain biography strips HTML');
hochi_test($payload['artists'][0]['releaseSlugs'] === array('like-dat-riddim', 'bandcamp-album-1883854658'), 'Artist links retain existing route names');
hochi_test($payload['products'][0]['buyUrl'] === 'https://hochiruns.bandcamp.com/merch/hoodie', 'Product checkout link mapping');
hochi_test($payload['shows'][0]['venue'] === 'Test venue', 'Event fields mapping');
hochi_test($payload['shows'][0]['image'] === $show_fields['image'], 'Event flyer persists and exports through native forms');
ob_start();
hochi_content_meta_box(get_post($show));
$event_screen = ob_get_clean();
hochi_test(strpos($event_screen, 'Flyer image URL') !== false && strpos($event_screen, 'data-target="hochi-image"') !== false && strpos($event_screen, 'Choose image') !== false, 'Event editor exposes its flyer field and Media Library picker');
hochi_test(strpos($event_screen, 'name="hochi_copy_linked_image" value="image"') !== false && strpos($event_screen, 'Copy linked image to Media Library') !== false, 'Published event editor exposes the linked-image copy submit button');
hochi_test($payload['pages']->about['paragraphs'] === array('First paragraph.', 'Second paragraph.'), 'About paragraphs mapping');
$encoded = wp_json_encode($payload);
hochi_test(strpos($encoded, 'private-account-note') === false && strpos($encoded, 'not-public') === false && strpos($encoded, 'user_email') === false, 'No private metadata, passwords, or user fields exported');

$_POST = array('hochi_content_nonce' => wp_create_nonce('hochi_content_save_' . $artist), 'hochi' => array('slug' => 'changed-route', 'role' => 'Producer', 'bio' => 'Second update', 'photo' => '', 'socials' => '', 'release_slugs' => ''));
wp_update_post(array('ID' => $artist, 'post_status' => 'publish'));
$_POST = array();
hochi_test(get_post_meta($artist, '_hochi_slug', true) === 'amal', 'Native updates cannot change an established artist URL');
hochi_test(get_post_meta($artist, '_hochi_role', true) === 'Producer', 'Native updates save editable fields');

$_POST = array('hochi_content_nonce' => 'forged', 'hochi' => array('role' => 'Forged role'));
wp_update_post(array('ID' => $artist));
$_POST = array();
hochi_test(get_post_meta($artist, '_hochi_role', true) === 'Producer', 'Forged nonce cannot change metadata');
wp_set_current_user(0);
$_POST = array('hochi_content_nonce' => wp_create_nonce('hochi_content_save_' . $artist), 'hochi' => array('role' => 'Anonymous role'));
hochi_content_save($artist, get_post($artist));
$_POST = array();
wp_set_current_user(1);
hochi_test(get_post_meta($artist, '_hochi_role', true) === 'Producer', 'Unauthenticated callers cannot save metadata');

$duplicate = hochi_test_form('hochi_artist', 'Another AMAL', array('slug' => 'amal', 'role' => 'DJ'));
hochi_test(get_post_status($duplicate) === 'draft', 'Duplicate artist slug must not publish');
$duplicate_page = hochi_test_form('hochi_page', 'Duplicate About', array('page_key' => 'about', 'paragraphs' => 'Duplicate'));
hochi_test(get_post_status($duplicate_page) === 'draft', 'Duplicate About page must not publish');
$bad_image = hochi_test_form('hochi_product', 'Music file', array('price' => '$10', 'image' => 'https://cdn.hochiruns.com/master.mp3'));
hochi_test(get_post_status($bad_image) === 'draft', 'Audio files cannot be used as images');
$bad_flyer = hochi_test_form('hochi_show', 'Invalid flyer', array_merge($show_fields, array('image' => 'https://cdn.hochiruns.com/master.mp3')));
hochi_test(get_post_status($bad_flyer) === 'draft', 'Event flyers reject audio files before publication');
$_POST = array('hochi_content_nonce' => wp_create_nonce('hochi_content_save_' . $show), 'hochi' => array_merge($show_fields, array('image' => 'http://cdn.hochiruns.com/event-flyer.jpg')));
wp_update_post(array('ID' => $show));
$_POST = array();
hochi_test(hochi_content_payload()['shows'][0]['image'] === $show_fields['image'], 'Invalid flyer updates preserve the previously published image');
$_POST = array('hochi_content_nonce' => wp_create_nonce('hochi_content_save_' . $show), 'hochi' => array_merge($show_fields, array('image' => '')));
wp_update_post(array('ID' => $show));
$_POST = array();
hochi_test(!isset(hochi_content_payload()['shows'][0]['image']), 'Clearing a flyer retains a supported text-only event');

// Copy a supplied linked image through the same native form, preserving previous media on failure.
$image_source = 'https://wordpress.org/hochi-linked-image-test.png?source=fixture';
$image_request_count = 0;
$image_request_arguments = array();
$image_download_mode = 'success';
$image_download_mock = function ($preempt, $arguments, $url) use (&$image_request_count, &$image_request_arguments, &$image_download_mode, $image_source) {
    if ($url !== $image_source) { return $preempt; }
    $image_request_count++;
    $image_request_arguments = $arguments;
    if ($image_download_mode === 'error') { return new WP_Error('expired_fixture', 'Source link expired.'); }
    $bytes = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jQ3cAAAAASUVORK5CYII=');
    if ($image_download_mode === 'html') { $bytes = '<html>Sign in to view this image.</html>'; }
    if ($image_download_mode === 'oversize') { $bytes = str_repeat('x', 8 * 1024 * 1024 + 1); }
    file_put_contents($arguments['filename'], $bytes);
    return array('headers' => array(), 'body' => '', 'response' => array('code' => $image_download_mode === 'redirect' ? 302 : 200, 'message' => 'Fixture response'), 'cookies' => array());
};
$image_upload_urls = function ($uploads) {
    $uploads['baseurl'] = 'https://cms.hochiruns.com/wp-content/uploads';
    $uploads['url'] = $uploads['baseurl'] . $uploads['subdir'];
    return $uploads;
};
add_filter('pre_http_request', $image_download_mock, 1, 3);
add_filter('upload_dir', $image_upload_urls);
$_POST = array('hochi_content_nonce' => wp_create_nonce('hochi_content_save_' . $show));
hochi_test(is_wp_error(hochi_content_copy_linked_image($show, 'ticket_url', $image_source)), 'Linked image action cannot target a non-image field');
$_POST['hochi_content_nonce'] = wp_create_nonce('hochi_content_save_' . $draft);
hochi_test(is_wp_error(hochi_content_copy_linked_image($draft, 'photo', $image_source)), 'Linked image action is limited to published entries');
$_POST['hochi_content_nonce'] = 'forged';
hochi_test(is_wp_error(hochi_content_copy_linked_image($show, 'image', $image_source)) && $image_request_count === 0, 'Forged image-copy nonce cannot download or create media');
$_POST['hochi_content_nonce'] = wp_create_nonce('hochi_content_save_' . $show);
$admin = wp_get_current_user();
$admin->add_cap('upload_files', false);
hochi_test(current_user_can('edit_post', $show) && is_wp_error(hochi_content_copy_linked_image($show, 'image', $image_source)) && $image_request_count === 0, 'Edit permission alone cannot bypass media upload permission');
$admin->remove_cap('upload_files');
wp_set_current_user(0);
hochi_test(is_wp_error(hochi_content_copy_linked_image($show, 'image', $image_source)) && $image_request_count === 0, 'Anonymous linked-image imports cannot download or upload');
wp_set_current_user(1);
$_POST = array('hochi_content_nonce' => wp_create_nonce('hochi_content_save_' . $show), 'hochi' => array_merge($show_fields, array('image' => $image_source)), 'hochi_copy_linked_image' => 'image');
wp_update_post(array('ID' => $show));
$_POST = array();
$owned_image = get_post_meta($show, '_hochi_image', true);
$owned_attachment = attachment_url_to_postid($owned_image);
hochi_test(strpos($owned_image, 'https://cms.hochiruns.com/wp-content/uploads/') === 0 && $owned_image !== $image_source && $owned_attachment, 'Native linked-image submit replaces the external URL with a durable Media Library URL');
hochi_test(get_post($owned_attachment)->post_parent === $show && hochi_content_payload()['shows'][0]['image'] === $owned_image, 'Copied media belongs to the entry and exports to the website');
hochi_test($image_request_arguments['reject_unsafe_urls'] === true && $image_request_arguments['redirection'] === 0 && $image_request_arguments['timeout'] === 20 && $image_request_arguments['stream'] === true && $image_request_arguments['limit_response_size'] <= 8 * 1024 * 1024 + 1, 'Linked image requests use safe HTTP, bounded disk streaming, timeout, and no redirects');
$attachment_count = count(get_posts(array('post_type' => 'attachment', 'post_status' => 'inherit', 'numberposts' => -1)));
foreach (array('error', 'html', 'oversize', 'redirect') as $mode) {
    $image_download_mode = $mode;
    $_POST = array('hochi_content_nonce' => wp_create_nonce('hochi_content_save_' . $show), 'hochi' => array_merge($show_fields, array('image' => $image_source)), 'hochi_copy_linked_image' => 'image');
    wp_update_post(array('ID' => $show));
    $_POST = array();
    hochi_test(get_post_meta($show, '_hochi_image', true) === $owned_image && count(get_posts(array('post_type' => 'attachment', 'post_status' => 'inherit', 'numberposts' => -1))) === $attachment_count, 'Failed, invalid, oversized, or redirected copies preserve the existing image and create no attachment');
    hochi_test(strpos(get_transient('hochi_notice_1'), 'Your previous image was kept.') !== false, 'Image-copy failures display an actionable editing notice');
    if ($mode === 'error') { hochi_test(strpos(get_transient('hochi_notice_1'), 'Source link expired.') !== false, 'Image-copy notice contains the actual download error'); }
}
$_POST = array('hochi_content_nonce' => wp_create_nonce('hochi_content_save_' . $show), 'hochi' => array_merge($show_fields, array('image' => $owned_image)), 'hochi_copy_linked_image' => 'image');
$image_request_before = $image_request_count;
wp_update_post(array('ID' => $show));
$_POST = array();
hochi_test($image_request_count === $image_request_before && count(get_posts(array('post_type' => 'attachment', 'post_status' => 'inherit', 'numberposts' => -1))) === $attachment_count, 'Copying an owned Media Library URL reuses its existing attachment');
remove_filter('pre_http_request', $image_download_mock, 1);
remove_filter('upload_dir', $image_upload_urls);
$bad_link = hochi_test_form('hochi_artist', 'Invalid Link', array('slug' => 'invalid-link', 'role' => 'DJ', 'socials' => 'Instagram | javascript:alert(1)'));
hochi_test(get_post_status($bad_link) === 'draft', 'Unsafe social links must not publish');

// Simulate out-of-band corruption: export must fail rather than return ambiguous artists.
update_post_meta($password, '_hochi_slug', 'amal');
global $wpdb;
$wpdb->update($wpdb->posts, array('post_password' => ''), array('ID' => $password));
clean_post_cache($password);
$conflict = hochi_content_payload();
hochi_test(is_wp_error($conflict) && $conflict->get_error_data()['status'] === 409, 'Duplicate corruption must prevent export');
update_post_meta($password, '_hochi_slug', 'password-artist');
wp_update_post(array('ID' => $password, 'post_status' => 'draft'));

foreach (array('javascript:alert(1)', 'http://cdn.hochiruns.com/photo.jpg', 'https://user:pass@cdn.hochiruns.com/photo.jpg', 'https://localhost/photo.jpg', 'https://127.0.0.1/photo.jpg', 'https://127.000.0.1/photo.jpg', 'https://0x7f.0.0.1/photo.jpg', 'https://intranet/photo.jpg', 'https://photos.internal/photo.jpg', 'https://cdn.hochiruns.com/photo.jpg#fragment') as $url) {
    hochi_test(hochi_content_url($url, true) === '', 'Public URL restrictions must match website validation');
}
hochi_test(hochi_content_url('https://cdn.hochiruns.com:443/photo.jpg', true) === 'https://cdn.hochiruns.com/photo.jpg', 'Default HTTPS port is normalized');
hochi_test(hochi_content_hook_url('http://localhost:3000/api/wordpress/revalidate') !== '', 'Literal localhost is permitted for local webhook tests');
hochi_test(hochi_content_hook_url('http://127.0.0.1:3000/api/wordpress/revalidate') === '', 'IP-address localhost bypass is refused');
hochi_test(hochi_content_hook_url('https://hochiruns.com/api/wordpress/revalidate?secret=oops') === '', 'Credentials may not travel in webhook URL queries');

wp_update_post(array('ID' => $artist, 'post_status' => 'draft'));
hochi_test(hochi_content_payload()['artists'] === array(), 'Unpublishing the last artist deliberately exports an empty collection');
hochi_test_form('hochi_page', 'Legal website', array('page_key' => 'legal', 'paragraphs' => ''));
hochi_test(hochi_content_payload()['pages']->legal['paragraphs'] === array(), 'Published empty page deliberately clears text');

hochi_content_rest_routes();
$request = new WP_REST_Request('GET', '/hochi/v1/content');
wp_set_current_user(0);
$response = rest_do_request($request);
hochi_test($response->get_status() === 200 && $response->get_data()['version'] === 1, 'Public endpoint works without login');
$write_request = new WP_REST_Request('POST', '/hochi/v1/content');
hochi_test(rest_do_request($write_request)->get_status() === 404, 'Public endpoint has no write method');

$captured = array();
$secret = str_repeat('a', 40);
update_option('hochi_connection', array('url' => 'https://hochiruns.com/api/wordpress/revalidate', 'secret' => $secret), false);
add_filter('pre_http_request', function ($preempt, $arguments, $url) use (&$captured) {
    $captured = array('arguments' => $arguments, 'url' => $url);
    return array('headers' => array(), 'body' => '', 'response' => array('code' => 204, 'message' => 'No Content'), 'cookies' => array());
}, 10, 3);
hochi_content_queue_notification();
hochi_content_notify_website();
hochi_test($captured['arguments']['headers']['Authorization'] === 'Bearer ' . $secret, 'Publish notification uses a Bearer header');
hochi_test($captured['arguments']['redirection'] === 0 && $captured['arguments']['timeout'] === 5 && $captured['arguments']['limit_response_size'] === 1024, 'Publish requests have bounded timeout/response and no redirects');
hochi_test(json_decode($captured['arguments']['body'], true) === array('event' => 'content-updated'), 'Notification body contains no content, account, or secret data');
hochi_test(get_option('hochi_hook_status')['state'] === 'success', 'Successful notifications record a secret-free status');
hochi_test(strpos(wp_json_encode(hochi_content_payload()), $secret) === false, 'Connection secrets never enter public content');
wp_set_current_user(1);
require_once ABSPATH . 'wp-admin/includes/template.php';
ob_start();
hochi_content_connection_screen();
$screen = ob_get_clean();
hochi_test(strpos($screen, $secret) === false, 'Saved secrets are not rendered in the connection form');

hochi_test(hochi_content_valid_secret(str_repeat('a', 30) . '_-'), 'URL-safe underscores and hyphens are valid secret characters');
$invalid_secrets = array(str_repeat('a', 32) . '.', str_repeat('a', 32) . '~');
foreach ($invalid_secrets as $invalid_secret) {
    hochi_test(!hochi_content_valid_secret($invalid_secret), 'Dots and tildes must not pass website secret validation');
    $captured = array();
    update_option('hochi_connection', array('url' => 'https://hochiruns.com/api/wordpress/revalidate', 'secret' => $invalid_secret), false);
    hochi_content_queue_notification();
    hochi_content_notify_website();
    hochi_test($captured === array(), 'Invalid saved secret must not trigger an outbound publish notification');
}
update_option('hochi_connection', array('url' => 'https://hochiruns.com/api/wordpress/revalidate', 'secret' => $secret), false);
$die_handler = function () { return function ($message) { throw new RuntimeException((string) $message); }; };
add_filter('wp_die_handler', $die_handler);
foreach ($invalid_secrets as $invalid_secret) {
    $_POST = array('hook_url' => 'https://hochiruns.com/api/wordpress/revalidate', 'hook_secret' => $invalid_secret);
    $_REQUEST['_wpnonce'] = wp_create_nonce('hochi_save_connection');
    $rejected = false;
    try { hochi_content_save_connection(); }
    catch (RuntimeException $error) { $rejected = strpos($error->getMessage(), 'underscores, or hyphens only') !== false; }
    hochi_test($rejected, 'Authenticated settings form must reject dots and tildes before saving');
    hochi_test(get_option('hochi_connection')['secret'] === $secret, 'Rejected settings must retain the previously valid secret');
}
$_POST = array();
$_REQUEST = array();
remove_filter('wp_die_handler', $die_handler);

// Optional release overlays preserve catalog-controlled metadata and established routes.
wp_update_post(array('ID' => $artist, 'post_status' => 'publish'));
update_option('hochi_catalog', array(
    array('slug' => 'like-dat-riddim', 'title' => 'LIKE DAT RIDDIM', 'artist' => 'AMAL', 'code' => 'HR-001', 'cover' => 'https://cdn.hochiruns.com/release.jpg', 'date' => '01 May 2026', 'buyUrl' => 'https://hochiruns.bandcamp.com/album/like-dat-riddim', 'memberSlugs' => array('amal')),
    array('slug' => 'bandcamp-album-1883854658', 'title' => 'Other release', 'artist' => 'AMAL', 'memberSlugs' => array('amal')),
), false);
$release_fields = array('slug' => 'like-dat-riddim', 'description' => '<b>Owner liner notes</b>', 'format' => 'EP', 'tags' => "Club\nClub, Baltimore", 'credits' => "Producer | AMAL\nMastering | Test Engineer", 'links' => 'Spotify | https://open.spotify.com/album/test', 'member_slugs' => array('', 'amal'), 'hidden' => '0', 'audio_url' => 'https://cdn.hochiruns.com/private-master.mp3', 'buyUrl' => 'https://evil.example/checkout');
$GLOBALS['hochi_notification_needed'] = false;
$release = hochi_test_form('hochi_release', 'LIKE DAT RIDDIM editor', $release_fields);
hochi_test(get_post_status($release) === 'publish', 'Release editorial form must publish');
hochi_test($GLOBALS['hochi_notification_needed'] === true, 'Published release changes queue website refresh');
hochi_test(get_post_meta($release, '_hochi_slug_locked', true) === '1', 'Release URL must lock after first publication');
$overlay = hochi_content_payload()['releaseOverrides'][0];
hochi_test($overlay['slug'] === 'like-dat-riddim' && $overlay['description'] === 'Owner liner notes' && $overlay['format'] === 'EP', 'Release slug and plain editorial fields map');
hochi_test($overlay['tags'] === array('Club', 'Baltimore') && $overlay['credits'][1] === array('role' => 'Mastering', 'name' => 'Test Engineer'), 'Release tags and credits map without duplicates');
hochi_test($overlay['links'] === array(array('platform' => 'Spotify', 'url' => 'https://open.spotify.com/album/test')) && $overlay['memberSlugs'] === array('amal') && $overlay['hidden'] === false, 'Streaming links, picker arrays, and visibility map');
hochi_test(!isset($overlay['audio_url']) && !isset($overlay['buyUrl']) && !isset($overlay['title']) && !isset($overlay['cover']), 'Release API exports editorial fields only');
hochi_test(strpos(wp_json_encode(hochi_content_payload()), 'private-master.mp3') === false, 'Unrecognized audio input never reaches public feed');
hochi_test(in_array('like-dat-riddim', hochi_content_release_slugs(get_post_meta($artist, '_hochi_release_slugs', true)), true), 'Release picker synchronizes inverse artist relationship');
$duplicate_release = hochi_test_form('hochi_release', 'Duplicate overlay', $release_fields);
hochi_test(get_post_status($duplicate_release) === 'draft', 'Duplicate published release route cannot publish');
$unknown_release = hochi_test_form('hochi_release', 'Unknown catalog route', array('slug' => 'unknown-release'));
hochi_test(get_post_status($unknown_release) === 'draft', 'New override must select a known route when catalog is present');

$before_release = hochi_content_payload()['releaseOverrides'][0];
$_POST = array('hochi_content_nonce' => wp_create_nonce('hochi_content_save_' . $release), 'hochi' => array_merge($release_fields, array('format' => 'Video', 'description' => 'Invalid replacement')));
wp_update_post(array('ID' => $release, 'post_title' => 'Invalid title replacement', 'post_status' => 'publish'));
$_POST = array();
hochi_test(get_post_status($release) === 'publish' && get_post($release)->post_title === 'LIKE DAT RIDDIM editor', 'Invalid published update retains prior status and title');
hochi_test(hochi_content_payload()['releaseOverrides'][0] === $before_release, 'Invalid release fields preserve previous good overlay');
$_POST = array('hochi_content_nonce' => wp_create_nonce('hochi_content_save_' . $release), 'hochi' => array_merge($release_fields, array('tags' => implode(',', range(1, 31)))));
wp_update_post(array('ID' => $release));
$_POST = array();
hochi_test(hochi_content_payload()['releaseOverrides'][0] === $before_release, 'Too many tags preserve previous good data');
$_POST = array('hochi_content_nonce' => wp_create_nonce('hochi_content_save_' . $release), 'hochi' => array_merge($release_fields, array('description' => str_repeat('x', 12001))));
wp_update_post(array('ID' => $release));
$_POST = array();
hochi_test(hochi_content_payload()['releaseOverrides'][0] === $before_release, 'Over-limit raw fields are rejected before truncation');

$_POST = array('hochi_content_nonce' => wp_create_nonce('hochi_content_save_' . $release), 'hochi' => array('slug' => 'changed-release-route', 'description' => '', 'format' => '', 'tags' => '', 'credits' => '', 'links' => '', 'member_slugs' => array(''), 'hidden' => '1'));
wp_update_post(array('ID' => $release));
$_POST = array();
$cleared = hochi_content_payload()['releaseOverrides'][0];
hochi_test($cleared['slug'] === 'like-dat-riddim', 'Published release URL cannot be changed');
hochi_test($cleared['description'] === '' && !isset($cleared['format']) && $cleared['tags'] === array() && $cleared['credits'] === array() && $cleared['links'] === array() && $cleared['memberSlugs'] === array() && $cleared['hidden'] === true, 'Saved empty overlays explicitly clear fields, blank category inherits, and hidden is boolean');
hochi_test(hochi_content_payload()['artists'][0]['releaseSlugs'] === array(), 'Release deselection exports authoritative empty artist picker');

$_POST = array('hochi_content_nonce' => wp_create_nonce('hochi_content_save_' . $artist), 'hochi' => array('slug' => 'amal', 'role' => 'Producer', 'release_slugs' => array('', 'like-dat-riddim')));
wp_update_post(array('ID' => $artist));
$_POST = array();
hochi_test(hochi_content_payload()['artists'][0]['releaseSlugs'] === array('like-dat-riddim'), 'Artist checkbox array uses existing routes');
hochi_test(hochi_content_payload()['releaseOverrides'][0]['memberSlugs'] === array('amal'), 'Artist picker synchronizes inverse release relationship');
$_POST = array('hochi_content_nonce' => wp_create_nonce('hochi_content_save_' . $artist), 'hochi' => array('slug' => 'amal', 'role' => 'Producer', 'release_slugs' => array('')));
wp_update_post(array('ID' => $artist));
$_POST = array();
hochi_test(hochi_content_payload()['artists'][0]['releaseSlugs'] === array() && hochi_content_payload()['releaseOverrides'][0]['memberSlugs'] === array(), 'Clearing artist checkboxes clears both relationship views');
$limited_author = wp_insert_user(array('user_login' => 'isolated-catalog-author', 'user_pass' => wp_generate_password(), 'role' => 'author'));
hochi_test(!is_wp_error($limited_author), 'Create local-only restricted role fixture');
wp_set_current_user($limited_author);
hochi_test(!current_user_can('edit_post', $artist), 'Restricted author cannot edit another owner’s artist');
update_post_meta($release, '_hochi_member_slugs', 'amal');
hochi_content_sync_associations($release, get_post($release));
hochi_test(get_post_meta($artist, '_hochi_release_slugs', true) === '', 'Inverse synchronization cannot bypass target edit permissions');
wp_set_current_user(1);
update_post_meta($release, '_hochi_member_slugs', '');
ob_start();
hochi_content_meta_box(get_post($artist));
$artist_screen = ob_get_clean();
hochi_test(strpos($artist_screen, 'type="checkbox"') !== false && strpos($artist_screen, 'LIKE DAT RIDDIM') !== false && strpos($artist_screen, 'Choose image') !== false, 'Catalog artist choices and native image chooser controls render');
ob_start();
hochi_content_meta_box(get_post($release));
$release_screen = ob_get_clean();
hochi_test(strpos($release_screen, 'read only') !== false && strpos($release_screen, 'View or purchase on Bandcamp') !== false && strpos($release_screen, 'Producer') === false, 'Release form displays source metadata without editable source controls');
wp_update_post(array('ID' => $release, 'post_status' => 'draft'));
hochi_test(!isset(hochi_content_payload()['releaseOverrides']), 'Unpublishing final overlay restores catalog without deleting catalog');

// Administrator-owned appearance changes are atomic and explicit.
$appearance = array('backgroundColor' => '#112233', 'textColor' => '#FFFFFF', 'accentColor' => '#ff0000', 'mutedColor' => '#888888', 'borderColor' => '#333333', 'logoUrl' => 'https://cdn.hochiruns.com/logo.png', 'backgroundLogoUrl' => '', 'backgroundImageUrl' => 'https://cdn.hochiruns.com/background.webp', 'backgroundLogoOpacity' => '0.2');
$GLOBALS['hochi_notification_needed'] = false;
hochi_test(hochi_content_store_appearance($appearance) === true, 'Administrator can store appearance settings');
$appearance_payload = hochi_content_payload()['appearance'];
hochi_test($appearance_payload['textColor'] === '#ffffff' && $appearance_payload['backgroundLogoOpacity'] === 0.2 && $appearance_payload['backgroundLogoUrl'] === '', 'Appearance colors normalize, opacity is numeric, and clear image is explicit');
hochi_test($GLOBALS['hochi_notification_needed'] === true, 'Saving appearance queues website refresh');
foreach (array(array('accentColor' => '#abc'), array('logoUrl' => 'https://cdn.hochiruns.com/audio.mp3'), array('backgroundLogoOpacity' => '0.31'), array('backgroundLogoOpacity' => '-0.1'), array('backgroundColor' => array('#ffffff')), array('logoUrl' => 'https://127.0.0.1/logo.png')) as $invalid_appearance) {
    hochi_test(is_wp_error(hochi_content_store_appearance($invalid_appearance)), 'Invalid appearance values must be rejected');
    hochi_test(get_option('hochi_appearance') === $appearance_payload, 'Rejected appearance save preserves all previous settings');
}
wp_set_current_user(0);
hochi_test(is_wp_error(hochi_content_store_appearance(array('accentColor' => '#00ff00'))) && get_option('hochi_appearance') === $appearance_payload, 'Anonymous appearance update cannot alter settings');
wp_set_current_user(1);
add_filter('wp_die_handler', $die_handler);
$_POST = array('appearance' => array('accentColor' => '#00ff00'));
$_REQUEST = array('_wpnonce' => 'forged');
$appearance_nonce_rejected = false;
try { hochi_content_save_appearance(); } catch (RuntimeException $error) { $appearance_nonce_rejected = true; }
hochi_test($appearance_nonce_rejected && get_option('hochi_appearance') === $appearance_payload, 'Appearance POST rejects forged nonce before mutation');
$_POST = array(); $_REQUEST = array();
remove_filter('wp_die_handler', $die_handler);
ob_start(); hochi_content_appearance_screen(); $appearance_screen = ob_get_clean();
hochi_test(strpos($appearance_screen, 'Save website appearance') !== false && substr_count($appearance_screen, 'Choose image') === 3, 'Appearance page renders three native image selectors and save button');
hochi_test(substr_count($appearance_screen, 'hochi-color-picker') === 5, 'Appearance exposes five native WordPress visual color controls');
hochi_test(hochi_content_store_appearance(array('backgroundColor' => '', 'logoUrl' => '', 'backgroundLogoOpacity' => '')) === true && hochi_content_payload()['appearance'] === array('logoUrl' => ''), 'Blank colors and opacity inherit defaults while empty images clear custom overrides');
hochi_content_store_appearance(array());
hochi_test(!isset(hochi_content_payload()['appearance']), 'Missing appearance settings preserve original website design');

// HTTP uploads are accepted only with an explicit isolated demo flag and exact site origin.
hochi_test(hochi_content_url('http://127.0.0.1:9401/wp-content/uploads/logo.png', true) === '', 'Production rejects HTTP loopback image URLs');
define('HOCHI_LOCAL_DEMO', true);
$old_site_url = get_option('siteurl');
update_option('siteurl', 'http://127.0.0.1:9401');
$demo_site_filter = function () { return 'http://127.0.0.1:9401'; };
add_filter('site_url', $demo_site_filter);
hochi_test(hochi_content_url('http://127.0.0.1:9401/wp-content/uploads/2026/10/logo.png', true) !== '', 'Explicit local demo allows exact WordPress uploads origin');
foreach (array('http://127.0.0.1:9402/wp-content/uploads/logo.png', 'http://localhost:9401/wp-content/uploads/logo.png', 'http://127.0.0.1:9401/other/logo.png', 'http://user:pass@127.0.0.1:9401/wp-content/uploads/logo.png', 'http://127.0.0.1:9401/wp-content/uploads/logo.png#part', 'http://127.0.0.1:9401/wp-content/uploads/audio.mp3', 'http://127.0.0.1:9401/wp-content/uploads/../other/logo.png', 'http://127.0.0.1:9401/wp-content/uploads/%2e%2e/other/logo.png') as $url) {
    hochi_test(hochi_content_url($url, true) === '', 'Local images reject other origins, paths, credentials, fragments, and audio');
}
hochi_test(hochi_content_url('http://127.0.0.1:9401/wp-content/uploads/logo.png') === '', 'Demo image exception never weakens shop or social links');
hochi_test(hochi_content_hook_url('http://127.0.0.1:3001/api/wordpress/revalidate') !== '', 'Explicit local demo permits literal loopback webhook');
update_option('hochi_connection', array('url' => 'http://127.0.0.1:3001/api/wordpress/revalidate', 'secret' => $secret), false);
$captured = array(); hochi_content_queue_notification(); hochi_content_notify_website();
hochi_test(isset($captured['url']) && $captured['url'] === 'http://127.0.0.1:3001/api/wordpress/revalidate', 'Scoped local webhook reaches bounded HTTP client');
update_option('siteurl', $old_site_url);
remove_filter('site_url', $demo_site_filter);

echo 'PASS: ' . $hochi_test_checks . " WordPress integration checks.\n";
