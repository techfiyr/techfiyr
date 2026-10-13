/*
 * Google Analytics 4 through Firebase Analytics, on every page.
 * Loads only after the visitor allows "Analytics" in the cookie banner (assets/js/consent.js),
 * and switches off again (and removes the _ga cookies) if they withdraw consent.
 * The config comes from /firebase-config.js, written at build time from Netlify environment
 * variables by scripts/build-config.mjs. Without it (local preview) nothing loads.
 */
(function () {
	'use strict';

	var SDK = 'https://www.gstatic.com/firebasejs/13.0.0/';
	var config = window.TECHFIYR_FIREBASE;
	if (!config || !config.measurementId) return;

	var DISABLE = 'ga-disable-' + config.measurementId;
	var started = false;

	function start() {
		window[DISABLE] = false;
		if (started) return;
		started = true;
		Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-analytics.js')])
			.then(function (m) {
				m[1].getAnalytics(m[0].initializeApp(config));
			})
			.catch(function () { started = false; });
	}

	function stop() {
		window[DISABLE] = true;
		// remove Google Analytics cookies (_ga, _ga_<ID>) for this host and its parent domain
		var host = location.hostname.replace(/^www\./, '');
		document.cookie.split(';').forEach(function (c) {
			var name = c.split('=')[0].trim();
			if (!/^_ga/.test(name)) return;
			['', '; domain=' + host, '; domain=.' + host].forEach(function (domain) {
				document.cookie = name + '=; Max-Age=0; path=/' + domain;
			});
		});
	}

	function onConsent(state) {
		if (state && state.analytics) start();
		else stop();
	}

	document.addEventListener('techfiyr:consent', function (e) { onConsent(e.detail); });
	if (window.TechfiyrConsent) onConsent(window.TechfiyrConsent.get());
})();
