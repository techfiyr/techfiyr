/*
 * Cookie consent for every page: banner, preferences dialog, and gating of non-essential content.
 * Described in cookie-policy.html. The visitor's choice is kept in localStorage ("techfiyr-consent")
 * for 12 months, then we ask again. A Global Privacy Control signal counts as "reject".
 *
 * Categories
 *   necessary  always on (only this consent record)
 *   embedded   third-party embeds that set cookies, e.g. the Google Map on contact.html
 *
 * Gating an embed:  <iframe data-consent="embedded" data-src="https://..." hidden></iframe>
 *                   plus an element with data-consent-placeholder="embedded" (shown until allowed)
 * Opening settings: any element with data-consent-open (e.g. "Cookie settings" in the footer)
 * New category (e.g. analytics): add it to CATEGORIES, to the dialog markup below, to apply(),
 * and to cookie-policy.html, then bump VERSION so everyone is asked again.
 */
(function () {
	'use strict';

	var KEY = 'techfiyr-consent';
	var VERSION = 1;
	var MAX_AGE_DAYS = 365;
	var CATEGORIES = ['embedded'];

	// ---------- Storage ----------
	function read() {
		try {
			var c = JSON.parse(localStorage.getItem(KEY));
			if (!c || c.v !== VERSION) return null;
			if (Date.now() - new Date(c.date).getTime() > MAX_AGE_DAYS * 864e5) return null;
			return c;
		} catch (e) {
			return null;
		}
	}

	function save(choices) {
		var c = { v: VERSION, date: new Date().toISOString() };
		CATEGORIES.forEach(function (k) { c[k] = !!choices[k]; });
		try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { /* private mode: choice lasts for this page only */ }
		state = c;
		apply();
		hideBanner();
	}

	function all(value) {
		var c = {};
		CATEGORIES.forEach(function (k) { c[k] = value; });
		return c;
	}

	var state = read();

	// ---------- Apply choices to the page ----------
	function apply() {
		CATEGORIES.forEach(function (cat) {
			var on = !!(state && state[cat]);
			document.querySelectorAll('[data-consent="' + cat + '"]').forEach(function (el) {
				if (on && !el.getAttribute('src')) el.setAttribute('src', el.getAttribute('data-src'));
				if (!on && el.getAttribute('src')) el.removeAttribute('src');
				el.hidden = !on;
			});
			document.querySelectorAll('[data-consent-placeholder="' + cat + '"]').forEach(function (el) {
				el.hidden = on;
			});
		});
	}

	// ---------- Banner ----------
	var banner = document.createElement('section');
	banner.className = 'consent-banner';
	banner.setAttribute('aria-label', 'Cookie consent');
	banner.hidden = true;
	banner.innerHTML =
		'<div class="consent-banner_inner">' +
			'<div class="consent-banner_text">' +
				'<h2 class="consent-banner_title"><i class="fa-solid fa-cookie-bite" aria-hidden="true"></i> Your privacy, your choice</h2>' +
				'<p>We don\'t use tracking or advertising cookies. With your permission we load Google Maps, which sets Google cookies. ' +
				'You can change this any time in <b>Cookie settings</b>. Read our <a href="cookie-policy.html">Cookie Policy</a>.</p>' +
			'</div>' +
			'<div class="consent-banner_actions">' +
				'<button type="button" class="consent-btn consent-btn_accept" data-consent-accept>Accept all</button>' +
				'<button type="button" class="consent-btn consent-btn_reject" data-consent-reject>Reject non-essential</button>' +
				'<button type="button" class="consent-link" data-consent-open>Customize</button>' +
			'</div>' +
		'</div>';

	// ---------- Preferences dialog ----------
	var dialog = document.createElement('dialog');
	dialog.className = 'consent-dialog';
	dialog.setAttribute('aria-labelledby', 'consent-dialog-title');
	dialog.innerHTML =
		'<button type="button" class="consent-dialog_close" data-consent-close aria-label="Close cookie settings"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
		'<h2 class="consent-dialog_title" id="consent-dialog-title">Cookie settings</h2>' +
		'<p class="consent-dialog_intro">Choose what this site may load. Details are in our <a href="cookie-policy.html">Cookie Policy</a>.</p>' +
		'<div class="consent-option">' +
			'<div class="consent-option_text">' +
				'<h3 id="consent-necessary-label">Strictly necessary</h3>' +
				'<p id="consent-necessary-desc">Remembers your cookie choice. Always on, because the site needs it to respect your choice.</p>' +
			'</div>' +
			'<input type="checkbox" class="consent-switch" role="switch" checked disabled aria-labelledby="consent-necessary-label" aria-describedby="consent-necessary-desc">' +
		'</div>' +
		'<div class="consent-option">' +
			'<div class="consent-option_text">' +
				'<h3 id="consent-embedded-label">Embedded content</h3>' +
				'<p id="consent-embedded-desc">Loads the Google Map on our contact page. Google may set cookies and receive your IP address.</p>' +
			'</div>' +
			'<input type="checkbox" class="consent-switch" role="switch" data-consent-toggle="embedded" aria-labelledby="consent-embedded-label" aria-describedby="consent-embedded-desc">' +
		'</div>' +
		'<div class="consent-dialog_actions">' +
			'<button type="button" class="consent-btn consent-btn_accept" data-consent-save>Save choices</button>' +
			'<button type="button" class="consent-btn consent-btn_reject" data-consent-reject>Reject non-essential</button>' +
			'<button type="button" class="consent-link" data-consent-accept>Accept all</button>' +
		'</div>';

	function showBanner() { banner.hidden = false; }
	function hideBanner() { banner.hidden = true; }

	function openDialog() {
		dialog.querySelectorAll('[data-consent-toggle]').forEach(function (t) {
			t.checked = !!(state && state[t.getAttribute('data-consent-toggle')]);
		});
		if (typeof dialog.showModal === 'function') {
			if (!dialog.open) dialog.showModal();
		} else {
			dialog.setAttribute('open', '');
		}
	}

	function closeDialog() {
		if (typeof dialog.close === 'function') dialog.close();
		else dialog.removeAttribute('open');
	}

	// ---------- Events (delegated, so footer links and page buttons work too) ----------
	document.addEventListener('click', function (e) {
		var t = e.target.closest('[data-consent-accept], [data-consent-reject], [data-consent-save], [data-consent-open], [data-consent-close], [data-consent-allow]');
		if (!t) return;
		if (t.hasAttribute('data-consent-accept')) { save(all(true)); closeDialog(); }
		else if (t.hasAttribute('data-consent-reject')) { save(all(false)); closeDialog(); }
		else if (t.hasAttribute('data-consent-save')) {
			var c = {};
			dialog.querySelectorAll('[data-consent-toggle]').forEach(function (x) { c[x.getAttribute('data-consent-toggle')] = x.checked; });
			save(c);
			closeDialog();
		}
		else if (t.hasAttribute('data-consent-open')) { e.preventDefault(); openDialog(); }
		else if (t.hasAttribute('data-consent-close')) { closeDialog(); }
		else if (t.hasAttribute('data-consent-allow')) {
			// "Load map" on a placeholder grants just that category
			var choice = state ? JSON.parse(JSON.stringify(state)) : all(false);
			choice[t.getAttribute('data-consent-allow')] = true;
			save(choice);
		}
	});

	// click on the dimmed backdrop closes the dialog
	dialog.addEventListener('click', function (e) {
		if (e.target === dialog) closeDialog();
	});

	function init() {
		document.body.appendChild(banner);
		document.body.appendChild(dialog);
		// Global Privacy Control is an opt-out signal: treat it as "reject non-essential"
		if (!state && navigator.globalPrivacyControl === true) save(all(false));
		apply();
		if (!state) showBanner();
	}

	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
	else init();
})();
