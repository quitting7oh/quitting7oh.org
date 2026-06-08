// Swap favicon + theme-color to match the active data-theme and light/dark mode.
// Assumes files live at /favicons/<theme>/favicon.svg and per-theme theme_color.
(function () {
  const THEME_COLOR = {
  "accent-teal": {
    "light": "#1d7260",
    "dark": "#53c6ad"
  },
  "zinc": {
    "light": "#2a2a32",
    "dark": "#f0f0f0"
  },
  "slate": {
    "light": "#1f3451",
    "dark": "#94b2db"
  },
  "stone": {
    "light": "#604020",
    "dark": "#d5b890"
  },
  "neutral": {
    "light": "#262626",
    "dark": "#ebebeb"
  },
  "rose": {
    "light": "#d61f49",
    "dark": "#e64c70"
  },
  "blue": {
    "light": "#195ae6",
    "dark": "#5588f6"
  },
  "green": {
    "light": "#1d8743",
    "dark": "#2dd269"
  }
}; // { theme: { light, dark } }
  function current() {
    // ThemeScript.astro omits data-theme entirely when stone (the default)
    // is active, so a missing attribute means stone — not accent-teal.
    // The .dark class is the single source of truth for mode (ThemeScript
    // already resolves system→OS-pref into the class), so we don't re-check
    // prefers-color-scheme here — that double-counted when the user picked
    // light/dark explicitly against their OS preference.
    const t = document.documentElement.getAttribute('data-theme') || 'stone';
    const dark = document.documentElement.classList.contains('dark');
    return { t, dark };
  }
  function apply() {
    const { t, dark } = current();
    let link = document.querySelector('link[rel="icon"][type="image/svg+xml"]');
    if (link) link.href = `/favicons/${t}/favicon.svg`;
    const meta = document.querySelector('meta[name="theme-color"]');
    const c = (THEME_COLOR[t] || {})[dark ? 'dark' : 'light'];
    if (meta && c) meta.setAttribute('content', c);
  }
  // ThemeScript.astro toggles the .dark class whenever mode or OS pref
  // changes, so observing class + data-theme is sufficient — no need for
  // a separate prefers-color-scheme listener here.
  new MutationObserver(apply).observe(document.documentElement,
    { attributes: true, attributeFilter: ['data-theme', 'class'] });
  apply();
})();
