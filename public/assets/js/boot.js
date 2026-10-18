/*
 * Loaded first on every page (app/(site)/layout.tsx), before the vendor libraries.
 * Odometer must not rewrite the counters on DOMContentLoaded: React hydrates the server HTML
 * first, then assets/js/script.js starts the counters (see initPage there).
 */
window.odometerOptions = { auto: false, format: 'd' };
