export interface IdentityFont {
  id: string;
  display: string;
  body: string;
  mono: string;
  google_fonts_url: string;
  stack_display: string;
  stack_body: string;
  stack_mono: string;
}

export interface IdentityPalette {
  id: string;
  hue: number;
  neutral_family: string;
  accent: string;
  accent_dark: string;
  surface: string;
  surface_alt: string;
  fg: string;
  fg_muted: string;
  border: string;
  surface_dark: string;
  surface_alt_dark: string;
  fg_dark: string;
  fg_muted_dark: string;
  border_dark: string;
}

export interface IdentityLayout {
  id: "magazine" | "dashboard" | "feed" | "directory" | "longform" | "kiosk";
  component: string;
  component_path: string;
  density: "loose" | "normal" | "dense";
  brief: string;
}

export interface IdentityVoice {
  id: string;
  label_latest: string;
  label_recent: string;
  label_featured: string;
  label_more: string;
  nav_posts: string;
  nav_about: string;
  cta_subscribe: string;
  cta_subscribe_desc: string;
  cta_button: string;
  site_motto: string;
}

export interface Identity {
  font: IdentityFont;
  palette: IdentityPalette;
  layout: IdentityLayout;
  voice: IdentityVoice;
}

export const identity: Identity = {
  "font": {
    "id": "f11_serif_newsreader_plex",
    "display": "Newsreader",
    "body": "IBM Plex Sans",
    "mono": "IBM Plex Mono",
    "google_fonts_url": "https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap",
    "stack_display": "Newsreader, \"Iowan Old Style\", Georgia, serif",
    "stack_body": "\"IBM Plex Sans\", \"Helvetica Neue\", system-ui, sans-serif",
    "stack_mono": "\"IBM Plex Mono\", ui-monospace, monospace"
  },
  "palette": {
    "id": "p24_h34_zinc",
    "hue": 34,
    "neutral_family": "zinc",
    "accent": "199 124 26",
    "accent_dark": "241 174 85",
    "surface": "255 255 255",
    "surface_alt": "250 250 250",
    "fg": "24 24 27",
    "fg_muted": "82 82 91",
    "border": "228 228 231",
    "surface_dark": "24 24 27",
    "surface_alt_dark": "39 39 42",
    "fg_dark": "250 250 250",
    "fg_muted_dark": "161 161 170",
    "border_dark": "63 63 70"
  },
  "layout": {
    "id": "longform",
    "component": "HomeCivic",
    "component_path": "@components/clusters/HomeCivic.astro",
    "density": "loose",
    "brief": "Narrow centered column, big serif type, generous whitespace."
  },
  "voice": {
    "id": "v05_reviews",
    "label_latest": "New reviews",
    "label_recent": "Recently updated",
    "label_featured": "Editor's pick",
    "label_more": "Read the breakdown",
    "nav_posts": "Reviews",
    "nav_about": "How we test",
    "cta_subscribe": "Buyer's brief",
    "cta_subscribe_desc": "New reviews, ranked picks, and price drops.",
    "cta_button": "Get the brief",
    "site_motto": "Honest reviews, with numbers."
  }
} as const;
