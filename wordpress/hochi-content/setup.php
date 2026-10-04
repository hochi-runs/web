<?php
/** First-run content import and read-only release picker synchronization. */
if (!defined('ABSPATH')) { exit; }

function hochi_setup_error($message = 'The supplied content has an unsupported value. No content was imported.') {
    return new WP_Error('hochi_setup_invalid', $message);
}

function hochi_setup_is_list($value, $limit) {
    return is_array($value) && array_values($value) === $value && count($value) <= $limit;
}

function hochi_setup_text($value, $limit, $multiline = false) {
    if (!is_string($value) || strlen($value) > $limit * 4 || (function_exists('mb_strlen') ? mb_strlen($value) : strlen($value)) > $limit) { return hochi_setup_error(); }
    return hochi_content_text($value, $limit, $multiline);
}

function hochi_setup_slugs($value) {
    if (!hochi_setup_is_list($value, 50)) { return hochi_setup_error(); }
    $result = array();
    foreach ($value as $slug) {
        if (!hochi_content_slug($slug) || isset($result[$slug])) { return hochi_setup_error(); }
        $result[$slug] = $slug;
    }
    return array_values($result);
}

function hochi_setup_pairs($value, $credits = false) {
    if (!hochi_setup_is_list($value, $credits ? 50 : 10)) { return hochi_setup_error(); }
    $lines = array();
    foreach ($value as $entry) {
        $left = $credits ? 'role' : 'platform';
        $right = $credits ? 'name' : 'url';
        if (!is_array($entry) || !isset($entry[$left], $entry[$right])) { return hochi_setup_error(); }
        $label = hochi_setup_text($entry[$left], 80);
        $target = $credits ? hochi_setup_text($entry[$right], 500) : hochi_content_url($entry[$right]);
        if (is_wp_error($label) || is_wp_error($target) || !$label || !$target || strpos($label, '|') !== false || strpos($target, '|') !== false || strpos($label, "\n") !== false || strpos($target, "\n") !== false) { return hochi_setup_error(); }
        $lines[] = $label . ' | ' . $target;
    }
    return implode("\n", $lines);
}

function hochi_setup_catalog_values($input) {
    if (!is_array($input) || !isset($input['version'], $input['releases']) || $input['version'] !== 1 || !hochi_setup_is_list($input['releases'], 1000) || !$input['releases']) { return hochi_setup_error('The website did not supply a supported release catalog. Existing choices were kept.'); }
    $result = array();
    foreach ($input['releases'] as $item) {
        if (!is_array($item) || !isset($item['slug'], $item['title'], $item['artist']) || !hochi_content_slug($item['slug']) || isset($result[$item['slug']])) { return hochi_setup_error(); }
        $entry = array('slug' => $item['slug']);
        foreach (array('title' => 200, 'artist' => 200, 'code' => 100, 'date' => 100) as $key => $limit) {
            $value = hochi_setup_text(isset($item[$key]) ? $item[$key] : '', $limit);
            if (is_wp_error($value) || (in_array($key, array('title', 'artist'), true) && $value === '')) { return hochi_setup_error(); }
            $entry[$key] = $value;
        }
        foreach (array('cover', 'buyUrl') as $key) {
            $value = isset($item[$key]) ? $item[$key] : '';
            if (!is_string($value) || ($value !== '' && !hochi_content_url($value, $key === 'cover'))) { return hochi_setup_error(); }
            $entry[$key] = $value === '' ? '' : hochi_content_url($value, $key === 'cover');
        }
        $slugs = hochi_setup_slugs(isset($item['memberSlugs']) ? $item['memberSlugs'] : array());
        if (is_wp_error($slugs)) { return $slugs; }
        $entry['memberSlugs'] = $slugs;
        // Only public reference metadata is stored. Unknown fields, including audio URLs, are discarded.
        $result[$entry['slug']] = $entry;
    }
    return array_values($result);
}

function hochi_setup_identity($type, $title, $meta) {
    if (in_array($type, array('hochi_artist', 'hochi_release'), true)) { return $meta['slug']; }
    if ($type === 'hochi_page') { return $meta['page_key']; }
    if ($type === 'hochi_product') { return strtolower(hochi_content_text($title, 200)); }
    return hash('sha256', wp_json_encode(array($meta['date'], $meta['venue'], $meta['city'])));
}

function hochi_setup_record($type, $title, $meta, $order, $status = 'publish') {
    $title = hochi_setup_text($title, 200);
    if (is_wp_error($title) || !$title) { return hochi_setup_error(); }
    foreach ($meta as $value) { if (is_wp_error($value)) { return $value; } }
    $fields = hochi_content_fields($type);
    foreach ($fields as $key => $field) {
        if (!array_key_exists($key, $meta)) { $meta[$key] = $field[1] === 'checkbox' ? '0' : ''; }
        $checked = hochi_setup_text($meta[$key], $field[2], in_array($field[1], array('textarea', 'release_picker', 'member_picker'), true));
        if (is_wp_error($checked)) { return $checked; }
        $meta[$key] = $checked;
    }
    // Publication validation also checks required fields, links, and supported formatting.
    // Release slugs are checked against this import's catalog, not a possibly stale installed catalog.
    if ($type !== 'hochi_release') {
        $valid = hochi_content_validate(0, $type, $title, $meta);
        if (is_wp_error($valid) && $valid->get_error_code() !== 'hochi_duplicate') { return $valid; }
    }
    $identity = hochi_setup_identity($type, $title, $meta);
    $post_name = $type === 'hochi_show' ? 'event-' . substr($identity, 0, 24) : ($type === 'hochi_product' ? sanitize_title($title) : $identity);
    if (!$post_name) { return hochi_setup_error(); }
    return array('type' => $type, 'title' => $title, 'meta' => $meta, 'order' => $order, 'status' => $status, 'identity' => $identity, 'post_name' => $post_name);
}

function hochi_setup_prepare_import($input) {
    if (!is_array($input) || !isset($input['version'], $input['artists'], $input['products'], $input['shows'], $input['pages'], $input['releases']) || $input['version'] !== 1 || !is_array($input['pages'])) { return hochi_setup_error(); }
    foreach (array('artists', 'products', 'shows') as $key) { if (!hochi_setup_is_list($input[$key], 500)) { return hochi_setup_error(); } }
    foreach (array_keys($input['pages']) as $key) { if (!in_array($key, array('about', 'legal'), true)) { return hochi_setup_error(); } }
    $catalog = hochi_setup_catalog_values(array('version' => 1, 'releases' => $input['releases']));
    if (is_wp_error($catalog)) { return $catalog; }
    $records = array();
    foreach ($input['artists'] as $order => $item) {
        if (!is_array($item) || !isset($item['slug'], $item['name'], $item['role']) || !hochi_content_slug($item['slug'])) { return hochi_setup_error(); }
        $slugs = hochi_setup_slugs(isset($item['releaseSlugs']) ? $item['releaseSlugs'] : array());
        if (is_wp_error($slugs)) { return $slugs; }
        $records[] = hochi_setup_record('hochi_artist', $item['name'], array('slug' => $item['slug'], 'role' => $item['role'], 'bio' => isset($item['bio']) ? $item['bio'] : '', 'photo' => isset($item['photo']) ? $item['photo'] : '', 'socials' => hochi_setup_pairs(isset($item['socials']) ? $item['socials'] : array()), 'release_slugs' => implode("\n", $slugs)), $order);
    }
    foreach ($input['products'] as $order => $item) {
        if (!is_array($item) || !isset($item['name'], $item['price'])) { return hochi_setup_error(); }
        $records[] = hochi_setup_record('hochi_product', $item['name'], array('price' => $item['price'], 'image' => isset($item['image']) ? $item['image'] : '', 'buy_url' => isset($item['buyUrl']) ? $item['buyUrl'] : ''), $order);
    }
    foreach ($input['shows'] as $order => $item) {
        if (!is_array($item) || !isset($item['date'], $item['venue'], $item['city']) || !is_string($item['venue'])) { return hochi_setup_error(); }
        $records[] = hochi_setup_record('hochi_show', $item['venue'], array('date' => $item['date'], 'venue' => $item['venue'], 'city' => $item['city'], 'ticket_url' => isset($item['ticketUrl']) ? $item['ticketUrl'] : ''), $order);
    }
    foreach ($input['pages'] as $key => $item) {
        if (!is_array($item) || !isset($item['paragraphs']) || !hochi_setup_is_list($item['paragraphs'], 30)) { return hochi_setup_error(); }
        $paragraphs = array();
        foreach ($item['paragraphs'] as $paragraph) {
            $value = hochi_setup_text($paragraph, 2000, true);
            if (is_wp_error($value)) { return $value; }
            $paragraphs[] = $value;
        }
        $records[] = hochi_setup_record('hochi_page', ucfirst($key), array('page_key' => $key, 'paragraphs' => implode("\n\n", $paragraphs)), 0);
    }
    foreach ($input['releases'] as $order => $item) {
        $tags = isset($item['tags']) ? $item['tags'] : array();
        if (!hochi_setup_is_list($tags, 30)) { return hochi_setup_error(); }
        foreach ($tags as $tag) { if (is_wp_error(hochi_setup_text($tag, 100)) || strpos($tag, "\n") !== false || strpos($tag, ',') !== false) { return hochi_setup_error(); } }
        $members = hochi_setup_slugs(isset($item['memberSlugs']) ? $item['memberSlugs'] : array());
        $format = isset($item['format']) ? $item['format'] : '';
        if (is_wp_error($members) || !in_array($format, array('', 'Album', 'Single', 'EP', 'Compilation'), true) || (isset($item['hidden']) && !is_bool($item['hidden']))) { return hochi_setup_error(); }
        $records[] = hochi_setup_record('hochi_release', $item['title'], array('slug' => $item['slug'], 'description' => isset($item['description']) ? $item['description'] : '', 'format' => $format, 'tags' => implode("\n", $tags), 'credits' => hochi_setup_pairs(isset($item['credits']) ? $item['credits'] : array(), true), 'links' => hochi_setup_pairs(isset($item['links']) ? $item['links'] : array()), 'member_slugs' => implode("\n", $members), 'hidden' => !empty($item['hidden']) ? '1' : '0'), $order, 'draft');
    }
    $seen = array();
    $artist_slugs = array();
    $release_slugs = array_column($catalog, 'slug');
    foreach ($records as $record) {
        if (is_wp_error($record)) { return $record; }
        $key = $record['type'] . ':' . $record['identity'];
        if (isset($seen[$key])) { return hochi_setup_error('The initial content contains duplicate entries. No content was imported.'); }
        $seen[$key] = true;
        if ($record['type'] === 'hochi_artist') { $artist_slugs[] = $record['meta']['slug']; }
    }
    foreach ($records as $record) {
        if ($record['type'] === 'hochi_artist' && array_diff(hochi_content_release_slugs($record['meta']['release_slugs']), $release_slugs)) { return hochi_setup_error('An artist links to a release missing from the initial catalog. No content was imported.'); }
        if ($record['type'] === 'hochi_release' && array_diff(hochi_content_release_slugs($record['meta']['member_slugs']), $artist_slugs)) { return hochi_setup_error('A release links to an artist missing from the initial roster. No content was imported.'); }
    }
    return array('records' => $records, 'catalog' => $catalog);
}

function hochi_setup_import_content($input) {
    if (!current_user_can('manage_options')) { return new WP_Error('hochi_forbidden', 'Only administrators can import the existing site content.'); }
    $prepared = hochi_setup_prepare_import($input);
    if (is_wp_error($prepared)) { return $prepared; }
    $lock = get_option('hochi_import_lock');
    if ($lock && (int) $lock < time() - 600) { delete_option('hochi_import_lock'); }
    if (!add_option('hochi_import_lock', time(), '', false)) { return new WP_Error('hochi_setup_busy', 'An import is already running. Try again shortly.'); }
    $created = 0;
    try {
        $catalog = hochi_content_catalog();
        foreach ($prepared['catalog'] as $entry) { if (!isset($catalog[$entry['slug']])) { $catalog[$entry['slug']] = $entry; } }
        if (count($catalog) > 1000) { return hochi_setup_error('The combined release choices exceed the supported catalog size. No content was imported.'); }
        $existing = array();
        foreach (hochi_content_types() as $type) {
            $posts = get_posts(array('post_type' => $type, 'post_status' => array_keys(get_post_stati()), 'numberposts' => 1001, 'suppress_filters' => true));
            if (count($posts) > 1000) { return hochi_setup_error('There are too many existing records for a safe import. No content was imported.'); }
            foreach ($posts as $post) {
                $meta = hochi_content_values($post->ID, $type);
                $import_identity = get_post_meta($post->ID, '_hochi_import_identity', true);
                $identity = $import_identity !== '' ? $import_identity : hochi_setup_identity($type, $post->post_title, $meta);
                $existing[$type][] = array('identity' => $identity, 'name' => $post->post_name);
            }
        }
        $pending = array();
        $skipped = 0;
        foreach ($prepared['records'] as $record) {
            $matches = 0;
            foreach (isset($existing[$record['type']]) ? $existing[$record['type']] : array() as $old) {
                if ($old['identity'] === $record['identity']) { $matches++; }
                elseif ($old['name'] === $record['post_name']) { return hochi_setup_error('An existing entry conflicts with an imported route. No content was imported.'); }
            }
            if ($matches > 1) { return hochi_setup_error('Multiple existing entries use the same identity. Resolve them before importing. No content was imported.'); }
            if ($matches) { $skipped++; } else { $pending[] = $record; }
        }
        $GLOBALS['hochi_importing_content'] = true;
        foreach ($pending as $record) {
            $meta = array();
            foreach ($record['meta'] as $key => $value) { $meta['_hochi_' . $key] = $value; }
            $meta['_hochi_import_identity'] = $record['identity'];
            $id = wp_insert_post(wp_slash(array('post_type' => $record['type'], 'post_title' => $record['title'], 'post_name' => $record['post_name'], 'post_status' => 'draft', 'menu_order' => $record['order'], 'meta_input' => $meta)), true);
            if (is_wp_error($id) || !is_int($id) || $id <= 0) { return new WP_Error('hochi_setup_write', 'The import could not save an entry. Already imported entries were kept; retrying will skip them.'); }
            if ($record['status'] === 'publish') {
                $updated = wp_update_post(array('ID' => $id, 'post_status' => 'publish'), true);
                if (is_wp_error($updated) || get_post_status($id) !== 'publish') {
                    wp_delete_post($id, true);
                    return new WP_Error('hochi_setup_write', 'The import could not publish an entry. Already imported entries were kept; retrying will skip them.');
                }
            }
            $created++;
        }
        // Seed missing reference choices without replacing previously fetched metadata.
        update_option('hochi_catalog', array_values($catalog), false);
        $result = array('created' => $created, 'skipped' => $skipped, 'completedAt' => time());
        update_option('hochi_import_status', $result, false);
        if ($created) { hochi_content_queue_notification(); }
        return $result;
    } finally {
        $GLOBALS['hochi_importing_content'] = false;
        delete_option('hochi_import_lock');
    }
}

function hochi_setup_catalog_url($value) {
    if (!is_string($value)) { return ''; }
    $parts = wp_parse_url($value);
    $demo = defined('HOCHI_LOCAL_DEMO') && HOCHI_LOCAL_DEMO === true;
    if (!$parts || isset($parts['query']) || isset($parts['fragment']) || isset($parts['user']) || isset($parts['pass']) || !isset($parts['path']) || $parts['path'] !== '/api/wordpress/catalog') { return ''; }
    if ($demo && isset($parts['scheme'], $parts['host']) && $parts['scheme'] === 'http' && $parts['host'] === '127.0.0.1' && (!isset($parts['port']) || ($parts['port'] >= 1 && $parts['port'] <= 65535)) && strlen($value) <= 2048 && !preg_match('/[\x00-\x20\x7f]/', $value)) { return esc_url_raw($value, array('http')); }
    return hochi_content_url($value);
}

function hochi_setup_store_catalog_connection($value) {
    if (!current_user_can('manage_options')) { return new WP_Error('hochi_forbidden', 'Only administrators can change the release catalog connection.'); }
    $url = $value === '' ? '' : hochi_setup_catalog_url($value);
    if (!is_string($value) || ($value !== '' && !$url)) { return hochi_setup_error('Use the public HTTPS website /api/wordpress/catalog URL, without query strings or credentials.'); }
    update_option('hochi_catalog_connection', array('url' => $url), false);
    delete_option('hochi_catalog_status');
    hochi_setup_schedule_catalog();
    return true;
}

function hochi_setup_refresh_catalog($force = false) {
    $settings = get_option('hochi_catalog_connection', array());
    $url = isset($settings['url']) ? hochi_setup_catalog_url($settings['url']) : '';
    if (!$url) { return new WP_Error('hochi_catalog_unconfigured', 'Set the website catalog URL first.'); }
    $status = get_option('hochi_catalog_status', array());
    if (!$force && isset($status['checkedAt']) && (int) $status['checkedAt'] > time() - 300) { return true; }
    if (get_transient('hochi_catalog_refreshing')) { return new WP_Error('hochi_catalog_busy', 'The release catalog is already being refreshed.'); }
    set_transient('hochi_catalog_refreshing', 1, 30);
    try {
        $arguments = array('timeout' => 5, 'redirection' => 0, 'limit_response_size' => 1024 * 1024 + 1, 'headers' => array('Accept' => 'application/json'), 'cookies' => array());
        $parts = wp_parse_url($url);
        $local = defined('HOCHI_LOCAL_DEMO') && HOCHI_LOCAL_DEMO === true && $parts['scheme'] === 'http' && $parts['host'] === '127.0.0.1';
        $response = $local ? wp_remote_get($url, $arguments) : wp_safe_remote_get($url, $arguments);
        $body = is_wp_error($response) ? '' : wp_remote_retrieve_body($response);
        $catalog = is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200 || !is_string($body) || strlen($body) > 1024 * 1024 ? hochi_setup_error() : hochi_setup_catalog_values(json_decode($body, true));
        if (is_wp_error($catalog)) {
            update_option('hochi_catalog_status', array('state' => 'error', 'checkedAt' => time(), 'count' => count(hochi_content_catalog())), false);
            return new WP_Error('hochi_catalog_failed', 'The website catalog could not be refreshed. Existing release choices and your edits were kept.');
        }
        update_option('hochi_catalog', $catalog, false);
        update_option('hochi_catalog_status', array('state' => 'success', 'checkedAt' => time(), 'count' => count($catalog)), false);
        return count($catalog);
    } finally { delete_transient('hochi_catalog_refreshing'); }
}

function hochi_setup_schedule_catalog() {
    $settings = get_option('hochi_catalog_connection', array());
    if (empty($settings['url']) || !hochi_setup_catalog_url($settings['url'])) { wp_clear_scheduled_hook('hochi_catalog_refresh'); return; }
    if (!wp_next_scheduled('hochi_catalog_refresh')) { wp_schedule_event(time() + HOUR_IN_SECONDS, 'hourly', 'hochi_catalog_refresh'); }
}
add_action('init', 'hochi_setup_schedule_catalog');
add_action('hochi_catalog_refresh', 'hochi_setup_refresh_catalog');
function hochi_setup_deactivate() { wp_clear_scheduled_hook('hochi_catalog_refresh'); }
register_deactivation_hook(__DIR__ . '/hochi-content.php', 'hochi_setup_deactivate');

function hochi_setup_refresh_editor_catalog($screen) {
    if (!current_user_can('edit_posts') || !$screen || !in_array($screen->post_type, array('hochi_artist', 'hochi_release'), true) || !in_array($screen->base, array('post', 'edit'), true)) { return; }
    hochi_setup_refresh_catalog();
}
add_action('current_screen', 'hochi_setup_refresh_editor_catalog');

function hochi_setup_admin_menu() {
    add_submenu_page('hochi-runs', 'Hochi Runs Setup', 'Setup', 'manage_options', 'hochi-setup', 'hochi_setup_screen');
}
add_action('admin_menu', 'hochi_setup_admin_menu', 9);

function hochi_setup_screen() {
    if (!current_user_can('manage_options')) { return; }
    $connection = get_option('hochi_catalog_connection', array());
    $status = get_option('hochi_catalog_status', array());
    $import = get_option('hochi_import_status', array());
    echo '<div class="wrap"><h1>Hochi Runs Setup</h1><p>Use this screen once when connecting the existing Hochi Runs website to this WordPress editor. Installing the plugin alone does not connect or take control of a website. Its developer must configure the website to read this WordPress content URL: <code>' . esc_html(rest_url('hochi/v1/content')) . '</code>.</p>';
    if (isset($_GET['done']) && in_array($_GET['done'], array('import', 'connection', 'refresh'), true)) { echo '<div class="notice notice-success"><p>Setup action completed.</p></div>'; }
    echo '<h2>1. Import the existing website content</h2><p>Copy the bundled current artists, merch, events, About and Legal text into these editing forms. Existing matching entries are skipped, including drafts and entries in Trash. Your appearance settings are kept. Release editorial entries start as drafts; their titles appear immediately in artist release choices. Music stays on Bandcamp.</p>';
    if ($import) { echo '<p>Last import: ' . (int) $import['created'] . ' entries added; ' . (int) $import['skipped'] . ' existing entries skipped.</p>'; }
    echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '"><input type="hidden" name="action" value="hochi_import_content">';
    wp_nonce_field('hochi_import_content');
    submit_button('Import existing site content', 'secondary');
    echo '</form><h2>2. Keep release choices updated</h2><p>Paste the public catalog URL from the connected Next.js website. New Bandcamp releases become choices after that website’s catalog sync and deployment. This only refreshes reference information; it keeps your artist selections, descriptions, credits, and other edits.</p><form method="post" action="' . esc_url(admin_url('admin-post.php')) . '"><input type="hidden" name="action" value="hochi_save_catalog_connection">';
    wp_nonce_field('hochi_save_catalog_connection');
    echo '<p><label for="hochi-catalog-url"><strong>Website catalog URL</strong></label><br><input class="large-text" type="url" id="hochi-catalog-url" name="catalog_url" value="' . esc_attr(isset($connection['url']) ? $connection['url'] : '') . '" maxlength="2048"><br><span class="description">For example: https://hochiruns.com/api/wordpress/catalog . Use the live Vercel address until the custom domain is connected. Leave blank to disable automatic refresh.</span></p>';
    submit_button('Save catalog connection');
    echo '</form><form method="post" action="' . esc_url(admin_url('admin-post.php')) . '"><input type="hidden" name="action" value="hochi_refresh_catalog">';
    wp_nonce_field('hochi_refresh_catalog');
    submit_button('Refresh release choices', 'secondary');
    echo '</form><p>WordPress schedules hourly checks when configured. WordPress scheduling runs when the editor site receives traffic; artist and release editing screens also check at most once every five minutes. You can use the refresh button whenever needed.</p>';
    if ($status) { echo '<p>Last catalog check: ' . esc_html($status['state'] === 'success' ? 'successful' : 'failed; previous choices were kept') . '. Available releases: ' . (int) $status['count'] . '.</p>'; }
    echo '<p>For publishing notifications, open <a href="' . esc_url(admin_url('admin.php?page=hochi-connection')) . '">Connection</a>. The private refresh secret is separate from this public catalog URL.</p></div>';
}

function hochi_setup_admin_action($action) {
    if (!current_user_can('manage_options')) { return new WP_Error('hochi_forbidden', 'Only administrators can use setup.'); }
    $nonce = isset($_POST['_wpnonce']) && is_string($_POST['_wpnonce']) ? wp_unslash($_POST['_wpnonce']) : '';
    if (!wp_verify_nonce($nonce, $action)) { return new WP_Error('hochi_setup_nonce', 'This setup request expired. Reload the Setup screen and try again.'); }
    if ($action === 'hochi_import_content') {
        $file = __DIR__ . '/initial-content.json';
        if (!is_readable($file) || filesize($file) > 2 * 1024 * 1024) { return hochi_setup_error('The bundled initial content is missing or unsupported. Ask the developer for the complete plugin ZIP.'); }
        return hochi_setup_import_content(json_decode(file_get_contents($file), true));
    }
    if ($action === 'hochi_save_catalog_connection') {
        $url = isset($_POST['catalog_url']) && is_string($_POST['catalog_url']) ? trim(wp_unslash($_POST['catalog_url'])) : '';
        return hochi_setup_store_catalog_connection($url);
    }
    if ($action === 'hochi_refresh_catalog') { return hochi_setup_refresh_catalog(true); }
    return hochi_setup_error();
}

function hochi_setup_handle_action() {
    $action = isset($_POST['action']) && is_string($_POST['action']) ? sanitize_key(wp_unslash($_POST['action'])) : '';
    $result = hochi_setup_admin_action($action);
    if (is_wp_error($result)) { wp_die(esc_html($result->get_error_message()), '', array('response' => in_array($result->get_error_code(), array('hochi_forbidden', 'hochi_setup_nonce'), true) ? 403 : 400)); }
    $done = $action === 'hochi_import_content' ? 'import' : ($action === 'hochi_refresh_catalog' ? 'refresh' : 'connection');
    wp_safe_redirect(admin_url('admin.php?page=hochi-setup&done=' . $done));
    exit;
}
foreach (array('hochi_import_content', 'hochi_save_catalog_connection', 'hochi_refresh_catalog') as $hochi_setup_action) { add_action('admin_post_' . $hochi_setup_action, 'hochi_setup_handle_action'); }
