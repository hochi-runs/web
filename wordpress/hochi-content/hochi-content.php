<?php
/**
 * Plugin Name: Hochi Runs Content Bridge
 * Description: Edit Hochi Runs content and branding in WordPress and publish it to the connected Next.js website.
 * Version: 1.3.0
 * Requires at least: 6.4
 * Requires PHP: 7.4
 * License: GPL-2.0-or-later
 */

if (!defined('ABSPATH')) { exit; }

function hochi_content_types() {
    return array('hochi_artist', 'hochi_product', 'hochi_show', 'hochi_page', 'hochi_release');
}

function hochi_content_register_types() {
    $labels = array(
        'hochi_artist' => array('Artists', 'Artist'),
        'hochi_product' => array('Shop', 'Product'),
        'hochi_show' => array('Live', 'Event'),
        'hochi_page' => array('Website Pages', 'Website Page'),
        'hochi_release' => array('Releases', 'Release Override'),
    );
    foreach ($labels as $type => $label) {
        register_post_type($type, array(
            'labels' => array('name' => $label[0], 'singular_name' => $label[1], 'add_new_item' => 'Add ' . $label[1], 'edit_item' => 'Edit ' . $label[1]),
            'public' => false, 'publicly_queryable' => false, 'show_ui' => true,
            'show_in_menu' => 'hochi-runs', 'show_in_rest' => false,
            'show_in_nav_menus' => false, 'exclude_from_search' => true,
            'supports' => array('title', 'page-attributes'), 'rewrite' => false,
            'query_var' => false, 'capability_type' => 'post', 'map_meta_cap' => true,
            'delete_with_user' => false,
        ));
    }
}
add_action('init', 'hochi_content_register_types');

function hochi_content_admin_menu() {
    add_menu_page('Hochi Runs', 'Hochi Runs', 'edit_posts', 'hochi-runs', 'hochi_content_instructions', 'dashicons-album', 25);
    add_submenu_page('hochi-runs', 'Website Appearance', 'Appearance', 'manage_options', 'hochi-appearance', 'hochi_content_appearance_screen');
    add_submenu_page('hochi-runs', 'Connection', 'Connection', 'manage_options', 'hochi-connection', 'hochi_content_connection_screen');
}
add_action('admin_menu', 'hochi_content_admin_menu', 8);

function hochi_content_instructions() {
    if (!current_user_can('edit_posts')) { return; }
    echo '<div class="wrap"><h1>Hochi Runs</h1><p>Edit artists, merch, events, releases, and About or Legal text with the menu on the left. Use WordPress’s Publish or Update button when a change is ready. Administrators can change website colors, logos, and the background under Appearance.</p>';
    echo '<p>Drafts, private entries, and entries in the trash stay out of the website feed. Publishing an empty collection means that collection is intentionally empty. No demo content is created when this plugin is activated.</p>';
    echo '<p>For an existing artist, use the current website route name, for example <code>amal</code> for <code>/roster/amal</code>. The artist route name becomes permanent after its first publication. Artist route names and About/Legal page choices must be unique among published entries.</p>';
    echo '<p>Artist release links use existing website route names, such as <code>like-dat-riddim</code> or <code>bandcamp-album-1883854658</code>. Music uploads and purchases remain on Bandcamp.</p>';
    echo '<p>Release entries provide optional descriptions, credits, tags, streaming links, artist associations, and visibility overrides. Bandcamp still supplies the music, release title, artwork, dates, and purchase URL. Empty override lists leave the catalog available.</p>';
    echo '<p>Use Choose image to upload or select a Media Library image. On a published artist, product, or event, you can also paste a direct HTTPS image file URL and use Copy linked image to Media Library to save a permanent WordPress copy. This plugin adds no audio uploads or music downloads.</p>';
    echo '<p>Lower Order values appear first. This plugin supplies content; the existing website controls the design. It does not change your WordPress theme, page builder, or other pages.</p>';
    echo '<h2>Website content endpoint</h2><p><code>' . esc_html(rest_url('hochi/v1/content')) . '</code></p><p>This read-only URL exposes published Hochi content only. It contains no user accounts, private posts, or connection credentials.</p></div>';
}

function hochi_content_fields($type) {
    $fields = array(
        'hochi_artist' => array(
            'slug' => array('Permanent website route name', 'text', 120, 'Use the current name, e.g. amal. Lowercase letters, numbers, and hyphens only. Locked after first publication.'),
            'role' => array('Role', 'text', 120, 'For example: Artist, DJ / Producer, or Director.'),
            'bio' => array('Biography', 'textarea', 6000, 'Plain text. No HTML or page-builder markup.'),
            'photo' => array('Photo URL', 'url', 2048, 'HTTPS image URL ending in .jpg, .jpeg, .png, .webp, .gif, or .avif.'),
            'socials' => array('Social links', 'textarea', 24000, 'One link per line: platform | HTTPS URL. For example: Instagram | https://www.instagram.com/hochiruns/ . Up to 10 links.'),
            'release_slugs' => array('Releases on this artist’s page', 'release_picker', 8000, 'Choose the releases to show on this artist’s page. Selections also update existing release artist associations. Clear all selections to show none.'),
        ),
        'hochi_product' => array(
            'price' => array('Display price', 'text', 100, 'For example: $25 or $25–$35. This is display text, not a checkout setting.'),
            'image' => array('Image URL', 'url', 2048, 'HTTPS image URL. Upload an image to Media Library and paste its File URL.'),
            'buy_url' => array('Purchase URL', 'url', 2048, 'HTTPS link to Bandcamp merchandise or your other checkout. Leave empty for a showcase item.'),
        ),
        'hochi_show' => array(
            'date' => array('Event date', 'text', 100, 'Display date, for example: Oct 23, 2026 · 9 PM. Include the timezone if needed.'),
            'venue' => array('Venue', 'text', 200, 'Venue or event name.'),
            'city' => array('City', 'text', 200, 'For example: Washington, D.C.'),
            'image' => array('Flyer image URL', 'url', 2048, 'Optional flyer. Choose an image from Media Library or paste its public HTTPS image URL.'),
            'ticket_url' => array('Ticket URL', 'url', 2048, 'Optional HTTPS ticket link.'),
        ),
        'hochi_page' => array(
            'page_key' => array('Website page', 'select', 10, 'Choose About or Legal. Only one published entry for each page is allowed.'),
            'paragraphs' => array('Page text', 'textarea', 60000, 'Plain text with a blank line between paragraphs. Up to 30 paragraphs, each up to 2,000 characters. A published blank page intentionally clears its text.'),
        ),
        'hochi_release' => array(
            'slug' => array('Existing website release', 'catalog_slug', 120, 'Select an existing release. Its website route becomes permanent after publication. Bandcamp title, artwork, music, date, and purchase link remain unchanged.'),
            'description' => array('Website description', 'textarea', 12000, 'Plain editorial text. Saving an empty description clears it on the website.'),
            'format' => array('Website release category', 'format', 20, 'Leave blank to use the current catalog category.'),
            'tags' => array('Tags', 'textarea', 12000, 'One tag per line, or comma-separated. Up to 30 tags of 100 characters each; empty clears website tags.'),
            'credits' => array('Credits', 'textarea', 32000, 'One credit per line: role | name. Up to 50 credits; empty clears website credits.'),
            'links' => array('Extra streaming links', 'textarea', 24000, 'One link per line: platform | HTTPS URL. Up to 10. The Bandcamp purchase link always remains available.'),
            'member_slugs' => array('Associated artists', 'member_picker', 8000, 'Choose artists from the published roster. Updating this selection also updates those artists’ release pickers.'),
            'hidden' => array('Hide this release on the website', 'checkbox', 1, 'The release stays on Bandcamp. Uncheck to show it again.'),
        ),
    );
    return isset($fields[$type]) ? $fields[$type] : array();
}

function hochi_content_meta_boxes() {
    foreach (hochi_content_types() as $type) {
        add_meta_box('hochi-details', 'Website content', 'hochi_content_meta_box', $type, 'normal', 'high');
    }
}
add_action('add_meta_boxes', 'hochi_content_meta_boxes');

function hochi_content_catalog() {
    $catalog = get_option('hochi_catalog', array());
    if (!is_array($catalog)) { return array(); }
    $result = array();
    foreach (array_slice($catalog, 0, 1000) as $release) {
        if (is_array($release) && isset($release['slug']) && hochi_content_slug($release['slug'])) { $result[$release['slug']] = $release; }
    }
    return $result;
}

function hochi_content_picker($key, $value, $choices) {
    if (!$choices) {
        echo '<textarea class="large-text" rows="5" id="hochi-' . esc_attr($key) . '" name="hochi[' . esc_attr($key) . ']" maxlength="8000">' . esc_textarea($value) . '</textarea>';
        return;
    }
    $selected = hochi_content_release_slugs($value);
    if (is_wp_error($selected)) { $selected = array(); }
    echo '<input type="hidden" name="hochi[' . esc_attr($key) . '][]" value=""><span style="display:block;max-height:260px;overflow:auto;border:1px solid #c3c4c7;padding:12px">';
    foreach ($choices as $slug => $label) {
        echo '<label style="display:block;margin:6px 0"><input type="checkbox" name="hochi[' . esc_attr($key) . '][]" value="' . esc_attr($slug) . '" ' . checked(in_array($slug, $selected, true), true, false) . '> ' . esc_html($label) . '</label>';
    }
    // Retain older routes if a temporarily stale imported catalog omits them.
    foreach (array_diff($selected, array_keys($choices)) as $slug) {
        echo '<label style="display:block;margin:6px 0"><input type="checkbox" name="hochi[' . esc_attr($key) . '][]" value="' . esc_attr($slug) . '" checked> ' . esc_html($slug) . ' (existing selection)</label>';
    }
    echo '</span>';
}

function hochi_content_image_buttons($target, $post = null, $key = '') {
    if (!current_user_can('upload_files')) { return; }
    echo '<br><button class="button hochi-select-image" type="button" data-target="' . esc_attr($target) . '">Choose image</button> <button class="button hochi-clear-image" type="button" data-target="' . esc_attr($target) . '">Use default / clear</button>';
    if ($post && $post->post_status === 'publish' && current_user_can('edit_post', $post->ID) && in_array($key, array('photo', 'image'), true)) {
        echo ' <button class="button" type="submit" name="hochi_copy_linked_image" value="' . esc_attr($key) . '">Copy linked image to Media Library</button><br><span class="description">Paste an image file URL above, then copy it to keep a permanent WordPress upload. This also saves the entry. Maximum 8 MB.</span>';
    }
}

function hochi_content_copy_linked_image($post_id, $key, $source) {
    $post = get_post($post_id);
    if (!hochi_content_has_form($post_id) || !current_user_can('upload_files')) { return new WP_Error('hochi_image_permission', 'You need permission to edit this entry and upload media, with a valid editing form.'); }
    $fields = $post ? hochi_content_fields($post->post_type) : array();
    if (!$post || $post->post_status !== 'publish' || !in_array($key, array('photo', 'image'), true) || !isset($fields[$key])) { return new WP_Error('hochi_image_field', 'Copy linked images only on a published artist, product, or event image field.'); }
    $source = hochi_content_url($source, true);
    if (!$source || wp_parse_url($source, PHP_URL_SCHEME) !== 'https') { return new WP_Error('hochi_image_url', 'Paste a public HTTPS image file URL before copying.'); }
    // An already-owned upload can be reused without duplicating the Media Library entry.
    if (attachment_url_to_postid($source)) { return $source; }
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';
    $limit = min(8 * 1024 * 1024, (int) wp_max_upload_size());
    if ($limit < 1) { return new WP_Error('hochi_image_upload_limit', 'WordPress is not allowing new media uploads.'); }
    $temporary = wp_tempnam('hochi-linked-image');
    if (!$temporary) { return new WP_Error('hochi_image_temp', 'WordPress could not create a temporary image file.'); }
    $response = wp_safe_remote_get($source, array('timeout' => 20, 'redirection' => 0, 'stream' => true, 'filename' => $temporary, 'limit_response_size' => $limit + 1));
    if (is_wp_error($response)) {
        @unlink($temporary);
        return new WP_Error('hochi_image_download', 'Image download failed: ' . $response->get_error_message());
    }
    $status = wp_remote_retrieve_response_code($response);
    if ($status !== 200) {
        @unlink($temporary);
        return new WP_Error('hochi_image_http', 'The image server returned HTTP ' . (int) $status . '. Use a current direct image link.');
    }
    clearstatcache(true, $temporary);
    $size = filesize($temporary);
    if (!$size || $size > $limit) {
        @unlink($temporary);
        return new WP_Error('hochi_image_size', 'The downloaded image is empty or exceeds the upload limit of ' . size_format($limit) . '.');
    }
    $mime = wp_get_image_mime($temporary);
    $extensions = array('image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif', 'image/webp' => 'webp', 'image/avif' => 'avif');
    $dimensions = wp_getimagesize($temporary);
    if (!isset($extensions[$mime]) || !in_array($mime, get_allowed_mime_types(), true) || !$dimensions || empty($dimensions[0]) || empty($dimensions[1])) {
        @unlink($temporary);
        return new WP_Error('hochi_image_type', 'The download is not a supported image. Use a JPG, PNG, GIF, WebP, or AVIF file allowed by WordPress.');
    }
    if ($dimensions[0] * $dimensions[1] > 20 * 1000 * 1000) {
        @unlink($temporary);
        return new WP_Error('hochi_image_dimensions', 'Use an image under 20 megapixels.');
    }
    $attachment = media_handle_sideload(array('name' => 'hochi-' . (int) $post_id . '-' . $key . '.' . $extensions[$mime], 'tmp_name' => $temporary), $post_id, $post->post_title);
    if (is_wp_error($attachment)) {
        @unlink($temporary);
        return new WP_Error('hochi_image_media', 'WordPress could not save the image: ' . $attachment->get_error_message());
    }
    $url = hochi_content_url(wp_get_attachment_url($attachment), true);
    if (!$url) {
        wp_delete_attachment($attachment, true);
        return new WP_Error('hochi_image_media_url', 'WordPress saved an image URL that this website cannot use. Check that Media Library URLs use public HTTPS.');
    }
    return $url;
}

function hochi_content_media_assets($hook) {
    if ($hook === 'hochi-runs_page_hochi-appearance' && current_user_can('manage_options')) {
        wp_enqueue_style('wp-color-picker');
        wp_enqueue_script('wp-color-picker');
        wp_add_inline_script('wp-color-picker', 'jQuery(function ($) { $(".hochi-color-picker").wpColorPicker(); });');
    }
    $screen = get_current_screen();
    if (!current_user_can('upload_files') || (!$screen || (!in_array($screen->post_type, array('hochi_artist', 'hochi_product', 'hochi_show'), true) && $hook !== 'hochi-runs_page_hochi-appearance'))) { return; }
    wp_enqueue_media();
    wp_add_inline_script('media-editor', <<<'JS'
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.hochi-select-image').forEach(function (button) {
    button.addEventListener('click', function () {
      var input = document.getElementById(button.dataset.target);
      if (!input || !window.wp || !wp.media) return;
      var frame = wp.media({ title: 'Choose a website image', library: { type: 'image' }, button: { text: 'Use this image' }, multiple: false });
      frame.on('select', function () {
        var selected = frame.state().get('selection').first().toJSON();
        input.value = selected.url || '';
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      frame.open();
    });
  });
  document.querySelectorAll('.hochi-clear-image').forEach(function (button) {
    button.addEventListener('click', function () {
      var input = document.getElementById(button.dataset.target);
      if (input) { input.value = ''; input.dispatchEvent(new Event('change', { bubbles: true })); }
    });
  });
});
JS
    );
}
add_action('admin_enqueue_scripts', 'hochi_content_media_assets');

function hochi_content_catalog_preview($slug) {
    $catalog = hochi_content_catalog();
    if (!isset($catalog[$slug])) { echo '<p>The website catalog has not supplied a preview for this route yet. The developer can refresh the read-only catalog.</p>'; return; }
    $release = $catalog[$slug];
    echo '<div style="padding:16px;background:#f6f7f7;margin-bottom:20px"><h3>From Bandcamp — read only</h3>';
    echo '<p><strong>' . esc_html(isset($release['title']) ? $release['title'] : $slug) . '</strong><br>' . esc_html(isset($release['artist']) ? $release['artist'] : '') . '</p>';
    if (!empty($release['cover']) && hochi_content_url($release['cover'], true)) { echo '<img src="' . esc_url($release['cover']) . '" alt="Release artwork" width="140" style="max-width:140px;height:auto">'; }
    if (!empty($release['date'])) { echo '<p>Release date: ' . esc_html($release['date']) . '</p>'; }
    if (!empty($release['buyUrl']) && hochi_content_url($release['buyUrl'])) { echo '<p><a href="' . esc_url($release['buyUrl']) . '" target="_blank" rel="noopener noreferrer">View or purchase on Bandcamp</a></p>'; }
    echo '<p>Music, release title, artwork, date, and purchase URL continue to come from Bandcamp. The fields below affect website presentation only.</p></div>';
}

function hochi_content_meta_box($post) {
    wp_nonce_field('hochi_content_save_' . $post->ID, 'hochi_content_nonce');
    echo '<p>The title above is the artist or product name. For an event, page, or release override, it is an internal editor label.</p>';
    if ($post->post_type === 'hochi_release') { hochi_content_catalog_preview(get_post_meta($post->ID, '_hochi_slug', true)); }
    foreach (hochi_content_fields($post->post_type) as $key => $field) {
        $value = get_post_meta($post->ID, '_hochi_' . $key, true);
        $id = 'hochi-' . $key;
        echo '<p><label for="' . esc_attr($id) . '"><strong>' . esc_html($field[0]) . '</strong></label><br>';
        if ($field[1] === 'textarea') {
            echo '<textarea class="large-text" rows="' . ($key === 'paragraphs' ? '12' : '5') . '" id="' . esc_attr($id) . '" name="hochi[' . esc_attr($key) . ']" maxlength="' . (int) $field[2] . '">' . esc_textarea($value) . '</textarea>';
        } elseif (in_array($field[1], array('release_picker', 'member_picker'), true)) {
            $choices = array();
            if ($field[1] === 'release_picker') {
                foreach (hochi_content_catalog() as $slug => $release) { $choices[$slug] = (isset($release['code']) ? $release['code'] . ' · ' : '') . (isset($release['artist']) ? $release['artist'] . ' — ' : '') . (isset($release['title']) ? $release['title'] : $slug); }
            } else {
                foreach (get_posts(array('post_type' => 'hochi_artist', 'post_status' => 'publish', 'numberposts' => 500, 'suppress_filters' => true)) as $artist) {
                    $slug = get_post_meta($artist->ID, '_hochi_slug', true);
                    if ($artist->post_password === '' && hochi_content_slug($slug)) { $choices[$slug] = $artist->post_title; }
                }
            }
            hochi_content_picker($key, $value, $choices);
        } elseif ($field[1] === 'checkbox') {
            echo '<input type="checkbox" id="' . esc_attr($id) . '" name="hochi[' . esc_attr($key) . ']" value="1" ' . checked($value, '1', false) . '> Hide from the website';
        } elseif ($field[1] === 'catalog_slug' && !get_post_meta($post->ID, '_hochi_slug_locked', true) && hochi_content_catalog()) {
            echo '<select class="large-text" id="' . esc_attr($id) . '" name="hochi[' . esc_attr($key) . ']"><option value="">Choose an existing release</option>';
            foreach (hochi_content_catalog() as $slug => $release) { echo '<option value="' . esc_attr($slug) . '" ' . selected($value, $slug, false) . '>' . esc_html((isset($release['title']) ? $release['title'] : $slug) . ' — ' . (isset($release['artist']) ? $release['artist'] : '')) . '</option>'; }
            echo '</select>';
        } elseif (in_array($field[1], array('select', 'format'), true)) {
            echo '<select id="' . esc_attr($id) . '" name="hochi[' . esc_attr($key) . ']"><option value="">' . ($field[1] === 'format' ? 'Use catalog category' : 'Choose a page') . '</option>';
            $options = $field[1] === 'format' ? array('Album' => 'Album', 'Single' => 'Single', 'EP' => 'EP', 'Compilation' => 'Compilation') : array('about' => 'About', 'legal' => 'Legal');
            foreach ($options as $option => $label) {
                echo '<option value="' . esc_attr($option) . '" ' . selected($value, $option, false) . '>' . esc_html($label) . '</option>';
            }
            echo '</select>';
        } else {
            $locked = $key === 'slug' && get_post_meta($post->ID, '_hochi_slug_locked', true);
            echo '<input class="large-text" type="' . esc_attr($field[1] === 'catalog_slug' ? 'text' : $field[1]) . '" id="' . esc_attr($id) . '" name="hochi[' . esc_attr($key) . ']" value="' . esc_attr($value) . '" maxlength="' . (int) $field[2] . '"' . ($locked ? ' readonly' : '') . '>';
            if (in_array($key, array('photo', 'image'), true)) { hochi_content_image_buttons($id, $post, $key); }
        }
        echo '<br><span class="description">' . esc_html($field[3]) . '</span></p>';
    }
}

function hochi_content_text($value, $limit, $multiline = false) {
    if (!is_scalar($value)) { return ''; }
    $value = $multiline ? sanitize_textarea_field((string) $value) : sanitize_text_field((string) $value);
    return function_exists('mb_substr') ? mb_substr($value, 0, $limit) : wp_check_invalid_utf8(substr($value, 0, $limit), true);
}

function hochi_content_url($value, $image = false, $local_hook = false) {
    if (!is_string($value) || strlen($value) > 2048 || preg_match('/[\x00-\x20\x7f]/', $value)) { return ''; }
    $url = esc_url_raw($value, array('https', 'http'));
    $parts = wp_parse_url($url);
    if (!$parts || empty($parts['host']) || empty($parts['scheme']) || isset($parts['user']) || isset($parts['pass']) || isset($parts['fragment'])) { return ''; }
    $demo = defined('HOCHI_LOCAL_DEMO') && HOCHI_LOCAL_DEMO === true;
    $local = $local_hook && $parts['scheme'] === 'http' && (strtolower($parts['host']) === 'localhost' || ($demo && strtolower($parts['host']) === '127.0.0.1'));
    if ($image && $demo && $parts['scheme'] === 'http') {
        $site = wp_parse_url(site_url());
        $local = $site && $site['scheme'] === 'http' && in_array(strtolower($site['host']), array('localhost', '127.0.0.1'), true)
            && strtolower($parts['host']) === strtolower($site['host'])
            && (isset($parts['port']) ? $parts['port'] : 80) === (isset($site['port']) ? $site['port'] : 80)
            && strpos(isset($parts['path']) ? $parts['path'] : '', '/wp-content/uploads/') === 0
            && !preg_match('#(?:^|/)(?:\.|%2e){1,2}(?:/|$)#i', $parts['path']);
    }
    if (!$local && ($parts['scheme'] !== 'https' || (isset($parts['port']) && $parts['port'] !== 443))) { return ''; }
    $host = strtolower($parts['host']);
    if (!$local && (filter_var(trim($host, '[]'), FILTER_VALIDATE_IP) || strpos($host, '.') === false || substr($host, -1) === '.' || strpos($host, '%') !== false || strpos($host, '\\') !== false || preg_match('/^(?:0x[0-9a-f]+|[0-9]+)(?:\.(?:0x[0-9a-f]+|[0-9]+))*$/i', $host) || preg_match('/(?:^|\.)(localhost|local|internal|test|invalid|example|home|lan)$/', $host))) { return ''; }
    if ($image && !preg_match('/\.(jpe?g|png|gif|webp|avif)$/i', isset($parts['path']) ? $parts['path'] : '')) { return ''; }
    return preg_replace('#^(https://[^/:]+):443(?=/|$)#i', '$1', $url);
}

function hochi_content_slug($value) {
    return is_string($value) && preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $value) && strlen($value) <= 120 ? $value : '';
}

function hochi_content_socials($value) {
    $result = array();
    foreach (preg_split('/\r\n|\r|\n/', is_string($value) ? $value : '') as $line) {
        if (!trim($line)) { continue; }
        $parts = explode('|', $line, 2);
        $platform = hochi_content_text(trim($parts[0]), 80);
        $url = isset($parts[1]) ? hochi_content_url(trim($parts[1])) : '';
        if (!$platform || !$url || count($result) >= 10) { return new WP_Error('hochi_invalid_socials', 'Use at most 10 social links in the form platform | HTTPS URL.'); }
        $result[] = array('platform' => $platform, 'url' => $url);
    }
    return $result;
}

function hochi_content_release_slugs($value) {
    $slugs = array();
    foreach (preg_split('/[\r\n,]+/', is_string($value) ? $value : '') as $entry) {
        $entry = trim($entry);
        if ($entry === '') { continue; }
        $slug = hochi_content_slug($entry);
        if (!$slug || count($slugs) >= 50) { return new WP_Error('hochi_invalid_releases', 'Use at most 50 existing release route names, without full URLs.'); }
        $slugs[$slug] = $slug;
    }
    return array_values($slugs);
}

function hochi_content_values($post_id, $type, $from_form = false) {
    $values = array();
    $input = $from_form && isset($_POST['hochi']) && is_array($_POST['hochi']) ? wp_unslash($_POST['hochi']) : array();
    foreach (hochi_content_fields($type) as $key => $field) {
        $value = $from_form ? (isset($input[$key]) ? $input[$key] : '') : get_post_meta($post_id, '_hochi_' . $key, true);
        if ($key === 'slug' && get_post_meta($post_id, '_hochi_slug_locked', true)) { $value = get_post_meta($post_id, '_hochi_slug', true); }
        $picker = in_array($field[1], array('release_picker', 'member_picker'), true);
        if ($picker && is_array($value)) { $value = implode("\n", array_filter(array_slice($value, 0, 102), 'is_scalar')); }
        $values[$key] = $field[1] === 'checkbox' ? ($value === '1' || $value === 1 ? '1' : '0') : hochi_content_text($value, $field[2], $field[1] === 'textarea' || $picker);
    }
    return $values;
}

function hochi_content_has_form($post_id) {
    return isset($_POST['hochi_content_nonce']) && is_string($_POST['hochi_content_nonce'])
        && wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['hochi_content_nonce'])), 'hochi_content_save_' . $post_id)
        && current_user_can('edit_post', $post_id);
}

function hochi_content_form_error($type) {
    $input = isset($_POST['hochi']) && is_array($_POST['hochi']) ? wp_unslash($_POST['hochi']) : array();
    foreach (hochi_content_fields($type) as $key => $field) {
        if (!isset($input[$key])) { continue; }
        $value = $input[$key];
        if (in_array($field[1], array('release_picker', 'member_picker'), true) && is_array($value)) {
            if (count($value) > 51 || count(array_filter($value, 'is_scalar')) !== count($value)) { return new WP_Error('hochi_invalid_input', 'Choose at most 50 valid website associations.'); }
            $value = implode("\n", $value);
        }
        if (!is_scalar($value) || strlen((string) $value) > $field[2] * 4 || (function_exists('mb_strlen') ? mb_strlen((string) $value) : strlen((string) $value)) > $field[2]) { return new WP_Error('hochi_invalid_input', 'A website field exceeds its supported length or has an invalid value.'); }
        if ($field[1] === 'url' && trim((string) $value) !== '' && !hochi_content_url(trim((string) $value), in_array($key, array('photo', 'image'), true))) { return new WP_Error('hochi_invalid_url', 'Use a valid public HTTPS link or image.'); }
        if ($field[1] === 'checkbox' && !in_array((string) $value, array('', '0', '1'), true)) { return new WP_Error('hochi_invalid_input', 'Use the visibility checkbox to change release visibility.'); }
    }
    return true;
}

function hochi_content_validate($post_id, $type, $title, $values) {
    if ($type !== 'hochi_page' && !hochi_content_text($title, 200)) { return new WP_Error('hochi_missing_title', 'Add a name or internal event title before publishing.'); }
    $required = array('hochi_artist' => array('slug', 'role'), 'hochi_product' => array('price'), 'hochi_show' => array('date', 'venue', 'city'), 'hochi_page' => array('page_key'), 'hochi_release' => array('slug'));
    foreach ($required[$type] as $key) {
        if (empty($values[$key])) { return new WP_Error('hochi_missing_field', 'Complete the required website fields before publishing.'); }
    }
    foreach (array('photo', 'image', 'buy_url', 'ticket_url') as $key) {
        if (!empty($values[$key]) && !hochi_content_url($values[$key], in_array($key, array('photo', 'image'), true))) {
            return new WP_Error('hochi_invalid_url', 'Use valid HTTPS URLs; photos, product images, and event flyers must be image files.');
        }
    }
    if ($type === 'hochi_artist') {
        if (!hochi_content_slug($values['slug'])) { return new WP_Error('hochi_invalid_slug', 'The artist route name must use lowercase letters, numbers, and single hyphens.'); }
        foreach (array(hochi_content_socials($values['socials']), hochi_content_release_slugs($values['release_slugs'])) as $result) {
            if (is_wp_error($result)) { return $result; }
        }
    }
    if ($type === 'hochi_release') {
        if (!hochi_content_slug($values['slug'])) { return new WP_Error('hochi_invalid_slug', 'Use an existing lowercase website release route name.'); }
        $catalog = hochi_content_catalog();
        if ($catalog && !isset($catalog[$values['slug']]) && !get_post_meta($post_id, '_hochi_slug_locked', true)) { return new WP_Error('hochi_unknown_release', 'Choose a release from the current website catalog.'); }
        if ($values['format'] !== '' && !in_array($values['format'], array('Album', 'Single', 'EP', 'Compilation'), true)) { return new WP_Error('hochi_invalid_format', 'Choose Album, Single, EP, Compilation, or the catalog category.'); }
        foreach (array(hochi_content_tags($values['tags']), hochi_content_credits($values['credits']), hochi_content_socials($values['links']), hochi_content_release_slugs($values['member_slugs'])) as $result) { if (is_wp_error($result)) { return $result; } }
    }
    if ($type === 'hochi_page') {
        if (!in_array($values['page_key'], array('about', 'legal'), true)) { return new WP_Error('hochi_invalid_page', 'Choose About or Legal.'); }
        $paragraphs = hochi_content_paragraphs($values['paragraphs']);
        if (is_wp_error($paragraphs)) { return $paragraphs; }
    }
    $unique = in_array($type, array('hochi_artist', 'hochi_release'), true) ? 'slug' : ($type === 'hochi_page' ? 'page_key' : '');
    if ($unique) {
        $others = get_posts(array('post_type' => $type, 'post_status' => 'publish', 'numberposts' => 1, 'fields' => 'ids', 'exclude' => array((int) $post_id), 'meta_key' => '_hochi_' . $unique, 'meta_value' => $values[$unique], 'suppress_filters' => true));
        if ($others) { return new WP_Error('hochi_duplicate', 'Another published entry already uses this website route or page. Update that entry instead.'); }
    }
    return true;
}

function hochi_content_tags($value) {
    $result = array();
    foreach (preg_split('/[\r\n,]+/', $value) as $entry) {
        $entry = trim($entry);
        if ($entry === '') { continue; }
        if (strlen($entry) > 400 || (function_exists('mb_strlen') ? mb_strlen($entry) : strlen($entry)) > 100 || count($result) >= 30) { return new WP_Error('hochi_invalid_tags', 'Use at most 30 tags of 100 characters each.'); }
        $result[$entry] = $entry;
    }
    return array_values($result);
}

function hochi_content_credits($value) {
    $result = array();
    foreach (preg_split('/\r\n|\r|\n/', $value) as $line) {
        if (!trim($line)) { continue; }
        $parts = explode('|', $line, 2);
        $role = trim($parts[0]);
        $name = isset($parts[1]) ? trim($parts[1]) : '';
        if (!$role || !$name || strlen($role) > 320 || strlen($name) > 2000 || (function_exists('mb_strlen') ? mb_strlen($role) > 80 || mb_strlen($name) > 500 : strlen($role) > 80 || strlen($name) > 500) || count($result) >= 50) { return new WP_Error('hochi_invalid_credits', 'Use at most 50 credits in the form role | name; roles up to 80 characters and names up to 500.'); }
        $result[] = array('role' => $role, 'name' => $name);
    }
    return $result;
}

function hochi_content_paragraphs($value) {
    $paragraphs = array();
    foreach (preg_split('/\n\s*\n/', str_replace(array("\r\n", "\r"), "\n", $value)) as $paragraph) {
        $paragraph = trim($paragraph);
        if ($paragraph === '') { continue; }
        if (strlen($paragraph) > 8000 || (function_exists('mb_strlen') ? mb_strlen($paragraph) : strlen($paragraph)) > 2000 || count($paragraphs) >= 30) {
            return new WP_Error('hochi_invalid_paragraphs', 'Use at most 30 paragraphs, each up to 2,000 characters.');
        }
        $paragraphs[] = $paragraph;
    }
    return $paragraphs;
}

function hochi_content_guard_publication($data, $postarr) {
    if (!in_array($data['post_type'], hochi_content_types(), true)) { return $data; }
    $post_id = isset($postarr['ID']) ? (int) $postarr['ID'] : 0;
    $form = hochi_content_has_form($post_id);
    if ($data['post_status'] !== 'publish' && !$form) { return $data; }
    unset($GLOBALS['hochi_rejected_save'][$post_id]);
    $values = hochi_content_values($post_id, $data['post_type'], $form);
    $result = $form ? hochi_content_form_error($data['post_type']) : true;
    if (!is_wp_error($result)) { $result = hochi_content_validate($post_id, $data['post_type'], wp_unslash($data['post_title']), $values); }
    if (is_wp_error($result)) {
        $old = $post_id ? get_post($post_id) : null;
        $old_valid = $old && !is_wp_error(hochi_content_validate($post_id, $old->post_type, $old->post_title, hochi_content_values($post_id, $old->post_type)));
        $GLOBALS['hochi_rejected_save'][$post_id] = true;
        $data['post_status'] = $old_valid ? $old->post_status : 'draft';
        if ($old_valid) { $data['post_title'] = wp_slash($old->post_title); $data['menu_order'] = $old->menu_order; }
        if (get_current_user_id()) { set_transient('hochi_notice_' . get_current_user_id(), $result->get_error_message() . ($old_valid ? ' Your previous valid content was kept.' : ' This entry remains a draft.'), 120); }
    }
    return $data;
}
add_filter('wp_insert_post_data', 'hochi_content_guard_publication', 20, 2);

function hochi_content_save($post_id, $post) {
    if (!in_array($post->post_type, hochi_content_types(), true) || wp_is_post_revision($post_id) || wp_is_post_autosave($post_id) || (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE)) { return; }
    if (!empty($GLOBALS['hochi_rejected_save'][$post_id])) { unset($GLOBALS['hochi_rejected_save'][$post_id]); return; }
    if (hochi_content_has_form($post_id)) {
        $values = hochi_content_values($post_id, $post->post_type, true);
        if (isset($_POST['hochi_copy_linked_image'])) {
            $image_key = is_string($_POST['hochi_copy_linked_image']) ? sanitize_key(wp_unslash($_POST['hochi_copy_linked_image'])) : '';
            $copied = hochi_content_copy_linked_image($post_id, $image_key, isset($values[$image_key]) ? $values[$image_key] : '');
            if (is_wp_error($copied)) {
                foreach (array('photo', 'image') as $key) { if (array_key_exists($key, $values)) { $values[$key] = get_post_meta($post_id, '_hochi_' . $key, true); } }
                set_transient('hochi_notice_' . get_current_user_id(), $copied->get_error_message() . ' Your previous image was kept.', 120);
            } else {
                $values[$image_key] = $copied;
                delete_transient('hochi_notice_' . get_current_user_id());
            }
        }
        foreach ($values as $key => $value) {
            update_post_meta($post_id, '_hochi_' . $key, $value);
        }
    }
    if (in_array($post->post_type, array('hochi_artist', 'hochi_release'), true) && $post->post_status === 'publish') { update_post_meta($post_id, '_hochi_slug_locked', 1); }
    if ($post->post_status === 'publish') { hochi_content_sync_associations($post_id, $post); hochi_content_queue_notification(); }
}
add_action('save_post', 'hochi_content_save', 20, 2);

function hochi_content_sync_associations($post_id, $post) {
    // Importing the existing website must not rewrite any previously edited relationships.
    if (!empty($GLOBALS['hochi_importing_content'])) { return; }
    $artist_source = $post->post_type === 'hochi_artist';
    if (!$artist_source && $post->post_type !== 'hochi_release') { return; }
    $source_key = $artist_source ? 'release_slugs' : 'member_slugs';
    if (!metadata_exists('post', $post_id, '_hochi_' . $source_key)) { return; }
    $selected = hochi_content_release_slugs(get_post_meta($post_id, '_hochi_' . $source_key, true));
    $source_slug = get_post_meta($post_id, '_hochi_slug', true);
    if (is_wp_error($selected) || !hochi_content_slug($source_slug)) { return; }
    $target_type = $artist_source ? 'hochi_release' : 'hochi_artist';
    $target_key = $artist_source ? 'member_slugs' : 'release_slugs';
    $catalog = hochi_content_catalog();
    foreach (get_posts(array('post_type' => $target_type, 'post_status' => 'publish', 'numberposts' => 500, 'suppress_filters' => true)) as $target) {
        if ($target->post_password !== '' || !current_user_can('edit_post', $target->ID)) { continue; }
        $target_slug = get_post_meta($target->ID, '_hochi_slug', true);
        $has_meta = metadata_exists('post', $target->ID, '_hochi_' . $target_key);
        $current = hochi_content_release_slugs(get_post_meta($target->ID, '_hochi_' . $target_key, true));
        if (is_wp_error($current)) { continue; }
        if (!$has_meta) {
            // When a seeded relationship has not been edited, retain all other catalog associations.
            if ($artist_source && isset($catalog[$target_slug]['memberSlugs']) && is_array($catalog[$target_slug]['memberSlugs'])) {
                $current = array_values(array_filter($catalog[$target_slug]['memberSlugs'], 'hochi_content_slug'));
            } elseif (!$artist_source) {
                foreach ($catalog as $slug => $entry) { if (isset($entry['memberSlugs']) && is_array($entry['memberSlugs']) && in_array($target_slug, $entry['memberSlugs'], true)) { $current[] = $slug; } }
            }
        }
        $next = array_values(array_diff($current, array($source_slug)));
        if (in_array($target_slug, $selected, true)) { $next[] = $source_slug; }
        $next = array_values(array_unique($next));
        if ($next !== $current && count($next) <= 50) { update_post_meta($target->ID, '_hochi_' . $target_key, implode("\n", $next)); }
    }
}

function hochi_content_admin_notice() {
    $key = 'hochi_notice_' . get_current_user_id();
    $notice = get_transient($key);
    if ($notice) {
        delete_transient($key);
        echo '<div class="notice notice-error"><p>Hochi Runs: ' . esc_html($notice) . '</p></div>';
    }
}
add_action('admin_notices', 'hochi_content_admin_notice');

function hochi_content_payload() {
    $payload = array('version' => 1, 'artists' => array(), 'products' => array(), 'shows' => array(), 'pages' => new stdClass());
    $seen = array();
    foreach (hochi_content_types() as $type) {
        $posts = get_posts(array('post_type' => $type, 'post_status' => 'publish', 'numberposts' => 501, 'orderby' => array('menu_order' => 'ASC', 'ID' => 'ASC'), 'suppress_filters' => true));
        if (count($posts) > 500) { return new WP_Error('hochi_limit', 'Published Hochi content exceeds the supported collection size.', array('status' => 503)); }
        foreach ($posts as $post) {
            // Defense in depth: no draft, password-protected, or private item is exported.
            if ($post->post_status !== 'publish' || $post->post_password !== '') { continue; }
            $values = hochi_content_values($post->ID, $type);
            $valid = hochi_content_validate($post->ID, $type, $post->post_title, $values);
            if (is_wp_error($valid)) { return new WP_Error('hochi_invalid_published_content', 'A published Hochi entry needs correction. Check the editing forms for required fields or duplicate route names.', array('status' => 409)); }
            if ($type === 'hochi_artist') {
                if (isset($seen[$values['slug']])) { return new WP_Error('hochi_duplicate_slug', 'Published artist route names must be unique.', array('status' => 409)); }
                $seen[$values['slug']] = true;
                $artist = array('slug' => $values['slug'], 'name' => hochi_content_text($post->post_title, 200), 'role' => $values['role']);
                foreach (array('bio', 'photo') as $key) { if ($values[$key] !== '') { $artist[$key] = $key === 'photo' ? hochi_content_url($values[$key], true) : $values[$key]; } }
                $socials = hochi_content_socials($values['socials']);
                $releases = hochi_content_release_slugs($values['release_slugs']);
                if ($socials) { $artist['socials'] = $socials; }
                if (metadata_exists('post', $post->ID, '_hochi_release_slugs')) { $artist['releaseSlugs'] = $releases; }
                $payload['artists'][] = $artist;
            } elseif ($type === 'hochi_product') {
                $product = array('name' => hochi_content_text($post->post_title, 200), 'price' => $values['price']);
                if ($values['image'] !== '') { $product['image'] = hochi_content_url($values['image'], true); }
                if ($values['buy_url'] !== '') { $product['buyUrl'] = hochi_content_url($values['buy_url']); }
                $payload['products'][] = $product;
            } elseif ($type === 'hochi_show') {
                $show = array('date' => $values['date'], 'venue' => $values['venue'], 'city' => $values['city']);
                if ($values['image'] !== '') { $show['image'] = hochi_content_url($values['image'], true); }
                if ($values['ticket_url'] !== '') { $show['ticketUrl'] = hochi_content_url($values['ticket_url']); }
                $payload['shows'][] = $show;
            } elseif ($type === 'hochi_release') {
                if (!isset($payload['releaseOverrides'])) { $payload['releaseOverrides'] = array(); }
                $entry = array('slug' => $values['slug']);
                if (metadata_exists('post', $post->ID, '_hochi_description')) { $entry['description'] = $values['description']; }
                if ($values['format'] !== '') { $entry['format'] = $values['format']; }
                foreach (array('tags' => 'hochi_content_tags', 'credits' => 'hochi_content_credits', 'links' => 'hochi_content_socials', 'member_slugs' => 'hochi_content_release_slugs') as $key => $parse) {
                    if (metadata_exists('post', $post->ID, '_hochi_' . $key)) { $entry[$key === 'member_slugs' ? 'memberSlugs' : $key] = call_user_func($parse, $values[$key]); }
                }
                if (metadata_exists('post', $post->ID, '_hochi_hidden')) { $entry['hidden'] = $values['hidden'] === '1'; }
                $payload['releaseOverrides'][] = $entry;
            } else {
                $key = $values['page_key'];
                if (isset($payload['pages']->$key)) { return new WP_Error('hochi_duplicate_page', 'Publish only one About entry and one Legal entry.', array('status' => 409)); }
                $payload['pages']->$key = array('paragraphs' => hochi_content_paragraphs($values['paragraphs']));
            }
        }
    }
    $appearance = hochi_content_appearance_values(get_option('hochi_appearance', array()));
    if (is_wp_error($appearance)) { return new WP_Error('hochi_invalid_appearance', 'Website appearance settings need correction.', array('status' => 409)); }
    if ($appearance) { $payload['appearance'] = $appearance; }
    if (strlen(wp_json_encode($payload)) > 2 * 1024 * 1024) { return new WP_Error('hochi_payload_size', 'Published Hochi content exceeds the website feed size limit.', array('status' => 503)); }
    return $payload;
}

function hochi_content_rest_response() {
    $payload = hochi_content_payload();
    if (is_wp_error($payload)) { return $payload; }
    $response = new WP_REST_Response($payload);
    $response->header('Cache-Control', 'public, max-age=60');
    return $response;
}

function hochi_content_rest_routes() {
    register_rest_route('hochi/v1', '/content', array('methods' => WP_REST_Server::READABLE, 'callback' => 'hochi_content_rest_response', 'permission_callback' => '__return_true'));
}
add_action('rest_api_init', 'hochi_content_rest_routes');

function hochi_content_appearance_fields() {
    return array(
        'backgroundColor' => array('Background color', 'color'),
        'textColor' => array('Text color', 'color'),
        'accentColor' => array('Accent color', 'color'),
        'mutedColor' => array('Secondary text color', 'color'),
        'borderColor' => array('Border color', 'color'),
        'logoUrl' => array('Main logo', 'image'),
        'backgroundLogoUrl' => array('Background wordmark', 'image'),
        'backgroundImageUrl' => array('Background image', 'image'),
        'backgroundLogoOpacity' => array('Background wordmark opacity', 'opacity'),
    );
}

function hochi_content_appearance_values($input) {
    if (!is_array($input)) { return new WP_Error('hochi_invalid_appearance', 'Use the appearance form to edit website settings.'); }
    $values = array();
    foreach (hochi_content_appearance_fields() as $key => $field) {
        if (!array_key_exists($key, $input)) { continue; }
        if (!is_scalar($input[$key])) { return new WP_Error('hochi_invalid_appearance', 'Use a single value for each appearance field.'); }
        $value = trim((string) $input[$key]);
        if ($field[1] === 'color') {
            if ($value === '') { continue; }
            if (!preg_match('/^#[a-f0-9]{6}$/i', $value)) { return new WP_Error('hochi_invalid_appearance', 'Colors must use six-digit hex codes, such as #ffffff.'); }
            $values[$key] = strtolower($value);
        } elseif ($field[1] === 'image') {
            $url = $value === '' ? '' : hochi_content_url($value, true);
            if ($value !== '' && !$url) { return new WP_Error('hochi_invalid_appearance', 'Choose a valid HTTPS JPG, PNG, GIF, WebP, or AVIF image.'); }
            $values[$key] = $url;
        } else {
            if ($value === '') { continue; }
            if (!preg_match('/^(?:0(?:\.\d+)?|\.\d+)$/', $value) || (float) $value < 0 || (float) $value > 0.3) { return new WP_Error('hochi_invalid_appearance', 'Background wordmark opacity must be between 0 and 0.3.'); }
            $values[$key] = (float) $value;
        }
    }
    return $values;
}

function hochi_content_store_appearance($input) {
    if (!current_user_can('manage_options')) { return new WP_Error('hochi_forbidden', 'Only administrators can change website appearance.'); }
    $values = hochi_content_appearance_values($input);
    if (is_wp_error($values)) { return $values; }
    update_option('hochi_appearance', $values, false);
    hochi_content_queue_notification();
    return true;
}

function hochi_content_appearance_screen() {
    if (!current_user_can('manage_options')) { return; }
    $settings = get_option('hochi_appearance', array());
    if (!is_array($settings)) { $settings = array(); }
    echo '<div class="wrap"><h1>Website Appearance</h1><p>Change the colors, main logo, background wordmark, or background image on the existing Hochi Runs website. Its layout stays in the Next.js design. Leave a color or opacity blank, or clear an image, to use the original website default.</p>';
    if (isset($_GET['saved'])) { echo '<div class="notice notice-success"><p>Website appearance saved.</p></div>'; }
    echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '"><input type="hidden" name="action" value="hochi_save_appearance">';
    wp_nonce_field('hochi_save_appearance');
    foreach (hochi_content_appearance_fields() as $key => $field) {
        $value = isset($settings[$key]) ? $settings[$key] : '';
        $id = 'hochi-appearance-' . $key;
        echo '<p><label for="' . esc_attr($id) . '"><strong>' . esc_html($field[0]) . '</strong></label><br>';
        if ($field[1] === 'opacity') {
            echo '<input class="small-text" type="number" step="0.01" min="0" max="0.3" id="' . esc_attr($id) . '" name="appearance[' . esc_attr($key) . ']" value="' . esc_attr($value) . '"><br><span class="description">0 is invisible; 0.3 is 30% opacity. Blank keeps the original wordmark appearance.</span>';
        } else {
            echo '<input class="' . ($field[1] === 'image' ? 'large-text' : 'regular-text hochi-color-picker') . '" type="' . ($field[1] === 'image' ? 'url' : 'text') . '" id="' . esc_attr($id) . '" name="appearance[' . esc_attr($key) . ']" value="' . esc_attr($value) . '" maxlength="' . ($field[1] === 'image' ? '2048' : '7') . '"' . ($field[1] === 'color' ? ' placeholder="#ffffff"' : '') . '>';
            if ($field[1] === 'image') { hochi_content_image_buttons($id); echo '<br><span class="description">Choose an image from the WordPress Media Library or paste its public HTTPS image URL.</span>'; }
            else { echo '<br><span class="description">Six-digit color code, such as #ffffff. Blank keeps the original color.</span>'; }
        }
        echo '</p>';
    }
    submit_button('Save website appearance');
    echo '</form></div>';
}

function hochi_content_save_appearance() {
    if (!current_user_can('manage_options')) { wp_die('You cannot change website appearance.', '', array('response' => 403)); }
    check_admin_referer('hochi_save_appearance');
    $input = isset($_POST['appearance']) ? wp_unslash($_POST['appearance']) : array();
    $result = hochi_content_store_appearance($input);
    if (is_wp_error($result)) { wp_die(esc_html($result->get_error_message()) . ' Your previous settings were kept.'); }
    wp_safe_redirect(admin_url('admin.php?page=hochi-appearance&saved=1'));
    exit;
}
add_action('admin_post_hochi_save_appearance', 'hochi_content_save_appearance');

function hochi_content_connection_screen() {
    if (!current_user_can('manage_options')) { return; }
    $settings = get_option('hochi_connection', array());
    $status = get_option('hochi_hook_status', array());
    echo '<div class="wrap"><h1>Hochi Runs connection</h1><p>Give the developer this public content URL: <code>' . esc_html(rest_url('hochi/v1/content')) . '</code>.</p><p>The website can poll for published updates. For faster updates, optionally configure its authenticated revalidation endpoint below. WordPress remains the editor; the existing website controls the layout.</p>';
    if (isset($_GET['saved'])) { echo '<div class="notice notice-success"><p>Connection settings saved.</p></div>'; }
    if ($status) { echo '<p>Last publish notification: ' . esc_html($status['state'] === 'success' ? 'accepted' : 'failed — ask the developer to check the connection; polling can still refresh content') . '.</p>'; }
    echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '"><input type="hidden" name="action" value="hochi_save_connection">';
    wp_nonce_field('hochi_save_connection');
    echo '<p><label for="hochi-hook-url"><strong>Website revalidation URL</strong></label><br><input class="large-text" type="url" id="hochi-hook-url" name="hook_url" value="' . esc_attr(isset($settings['url']) ? $settings['url'] : '') . '" maxlength="2048"><br><span class="description">For example: https://your-site.example/api/wordpress/revalidate . HTTPS is required; http://localhost is permitted for local testing only. No URL credentials, query strings, or fragments.</span></p>';
    echo '<p><label for="hochi-hook-secret"><strong>Shared secret</strong></label><br><input class="regular-text" type="password" id="hochi-hook-secret" name="hook_secret" value="" autocomplete="new-password" maxlength="256"><br><span class="description">Use the same 32–256 character secret as WORDPRESS_REVALIDATE_SECRET on the website: letters, numbers, underscores, or hyphens only. Leave blank to keep the saved secret. The saved secret is not displayed.</span></p><p><label><input type="checkbox" name="clear_secret" value="1"> Remove the saved secret and disable publish notifications</label></p>';
    submit_button('Save connection');
    echo '</form></div>';
}

function hochi_content_hook_url($value) {
    $url = hochi_content_url($value, false, true);
    $parts = wp_parse_url($url);
    return $parts && !isset($parts['query']) && !isset($parts['fragment']) && isset($parts['path']) && $parts['path'] === '/api/wordpress/revalidate' ? $url : '';
}

function hochi_content_valid_secret($value) {
    return is_string($value) && preg_match('/^[A-Za-z0-9_-]{32,256}$/', $value) === 1;
}

function hochi_content_save_connection() {
    if (!current_user_can('manage_options')) { wp_die('You cannot change this connection.', '', array('response' => 403)); }
    check_admin_referer('hochi_save_connection');
    $settings = get_option('hochi_connection', array());
    $raw_url = isset($_POST['hook_url']) && is_string($_POST['hook_url']) ? trim(wp_unslash($_POST['hook_url'])) : '';
    $url = $raw_url === '' ? '' : hochi_content_hook_url($raw_url);
    if ($raw_url !== '' && !$url) { wp_die('Use the HTTPS website /api/wordpress/revalidate URL without query strings or credentials.'); }
    $secret = isset($_POST['hook_secret']) && is_string($_POST['hook_secret']) ? wp_unslash($_POST['hook_secret']) : '';
    if ($secret !== '' && !hochi_content_valid_secret($secret)) { wp_die('Use a 32–256 character secret containing letters, numbers, underscores, or hyphens only.'); }
    if (!$secret) { $secret = isset($settings['secret']) ? $settings['secret'] : ''; }
    if (isset($_POST['clear_secret'])) { $secret = ''; }
    update_option('hochi_connection', array('url' => $url, 'secret' => $secret), false);
    wp_safe_redirect(admin_url('admin.php?page=hochi-connection&saved=1'));
    exit;
}
add_action('admin_post_hochi_save_connection', 'hochi_content_save_connection');

function hochi_content_queue_notification() { $GLOBALS['hochi_notification_needed'] = true; }
function hochi_content_status_change($new, $old, $post) {
    if (in_array($post->post_type, hochi_content_types(), true) && ($new === 'publish' || $old === 'publish')) { hochi_content_queue_notification(); }
}
add_action('transition_post_status', 'hochi_content_status_change', 10, 3);
function hochi_content_before_delete($post_id, $post) {
    if ($post && in_array($post->post_type, hochi_content_types(), true) && $post->post_status === 'publish') { hochi_content_queue_notification(); }
}
add_action('before_delete_post', 'hochi_content_before_delete', 10, 2);

function hochi_content_notify_website() {
    if (empty($GLOBALS['hochi_notification_needed'])) { return; }
    $GLOBALS['hochi_notification_needed'] = false;
    $settings = get_option('hochi_connection', array());
    if (empty($settings['url']) || empty($settings['secret']) || !hochi_content_hook_url($settings['url']) || !hochi_content_valid_secret($settings['secret'])) { return; }
    $arguments = array('timeout' => 5, 'redirection' => 0, 'limit_response_size' => 1024, 'headers' => array('Authorization' => 'Bearer ' . $settings['secret'], 'Content-Type' => 'application/json'), 'body' => wp_json_encode(array('event' => 'content-updated')));
    $parts = wp_parse_url($settings['url']);
    // Explicit localhost testing is permitted; production uses WP's SSRF-safe HTTP client.
    $local = $parts['scheme'] === 'http' && (strtolower($parts['host']) === 'localhost' || (defined('HOCHI_LOCAL_DEMO') && HOCHI_LOCAL_DEMO === true && strtolower($parts['host']) === '127.0.0.1'));
    $response = $local ? wp_remote_post($settings['url'], $arguments) : wp_safe_remote_post($settings['url'], $arguments);
    $code = is_wp_error($response) ? 0 : wp_remote_retrieve_response_code($response);
    update_option('hochi_hook_status', array('state' => $code >= 200 && $code < 300 ? 'success' : 'error', 'checkedAt' => time()), false);
}
add_action('shutdown', 'hochi_content_notify_website');

require_once __DIR__ . '/setup.php';
