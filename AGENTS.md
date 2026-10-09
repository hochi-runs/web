<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Design preferences

Never add outer glows, text shadows, or drop-shadow filters to text. Resolve text readability through layout and color instead.

Keep the logo, navigation links, Menu control, social icons, captions, and text labels transparent. Do not add white or opaque backing rectangles behind them, including over artwork or custom backgrounds. Actual dialog/menu surfaces and form fields may retain their backgrounds.

On archive pages, keep About and Radio with the left filter rail. In the page-end footer, social icons sit on the left and Legal and Contact align to the right corner, separate from the audio player.

Keep the archive's single straight artwork column. Reveal title and artist inside the artwork on hover and keyboard focus; show them on touchscreens. Clicking playable artwork opens its visualizer and starts playback from that user gesture. Do not add separate playback/visualizer buttons to archive artwork. Credits in the persistent player links to the dedicated release page.

Use uppercase navigation and control labels consistently; preserve the editorial casing of artist names and release titles.

Use one full-width, bottom-flush persistent player with the same responsive layout on the archive and visualizer. Its light palette follows the archive; its dark palette blends into the visualizer. Keep player controls, INFO, and visualizer captions free of backing boxes. Navigation between these views must retain the same audio session.
