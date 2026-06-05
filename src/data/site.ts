/** Site-wide constants: nav links and social profiles. */

export const navLinks = [
  { label: "Roster", href: "/roster" },
  { label: "Releases", href: "/" },
  { label: "Merch", href: "/merch" },
  { label: "About", href: "/about" },
  { label: "Videos", href: "/videos" },
  { label: "Shows", href: "/shows" },
] as const;

export const socials = [
  { label: "Instagram", url: "https://www.instagram.com/hochiruns/" },
  { label: "Bandcamp", url: "https://hochiruns.bandcamp.com/" },
  { label: "SoundCloud", url: "https://soundcloud.com/hochiruns" },
  { label: "YouTube", url: "https://www.youtube.com/@hochiruns668" },
] as const;
