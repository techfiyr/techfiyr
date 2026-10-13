/*
 * Footer visitor counter and world map, on every page.
 * Data comes from the Netlify Function at /api/visits (netlify/functions/visits.mjs).
 * Counts unique visitors: the browser asks to be counted when someone arrives from another site
 * or types the address, and the server counts each person once per day (see visits.mjs).
 * No cookies or local storage.
 * The map library (assets/vendor/jsvectormap) loads only when the footer scrolls near view.
 * If the API isn't available (e.g. local preview), the block stays hidden.
 */
(function () {
	'use strict';

	var root = document.querySelector('[data-visitors]');
	if (!root || !window.fetch) return;

	var VENDOR = 'assets/vendor/jsvectormap/';
	var numberFmt = new Intl.NumberFormat('en');
	var names = window.Intl && Intl.DisplayNames ? new Intl.DisplayNames(['en'], { type: 'region' }) : null;

	function countryName(code) {
		if (code === 'XX') return 'Unknown';
		try { return (names && names.of(code)) || code; } catch (e) { return code; }
	}

	function isNewVisit() {
		if (navigator.webdriver) return false;
		var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
		if (nav && nav.type !== 'navigate') return false;
		try {
			return !document.referrer || new URL(document.referrer).origin !== location.origin;
		} catch (e) {
			return true;
		}
	}

	function render(data) {
		var countries = data.countries || {};
		var codes = Object.keys(countries).filter(function (c) { return c !== 'XX'; });
		root.querySelector('[data-visitors-total]').textContent = numberFmt.format(data.total || 0);
		root.querySelector('[data-visitors-countries]').textContent = numberFmt.format(codes.length);

		var top = codes.sort(function (a, b) { return countries[b] - countries[a]; }).slice(0, 5);
		var list = root.querySelector('[data-visitors-top]');
		list.textContent = '';
		top.forEach(function (code) {
			var li = document.createElement('li');
			var name = document.createElement('span');
			var value = document.createElement('b');
			name.textContent = countryName(code);
			value.textContent = numberFmt.format(countries[code]);
			li.appendChild(name);
			li.appendChild(value);
			list.appendChild(li);
		});

		root.hidden = false;
		whenNearView(root.querySelector('[data-visitors-map]'), function (el) { drawMap(el, countries); });
	}

	function whenNearView(el, fn) {
		if (!el) return;
		if (!('IntersectionObserver' in window)) { fn(el); return; }
		var io = new IntersectionObserver(function (entries) {
			if (entries[0].isIntersecting) { io.disconnect(); fn(el); }
		}, { rootMargin: '300px' });
		io.observe(el);
	}

	function load(src, isCss) {
		return new Promise(function (resolve, reject) {
			var tag = document.createElement(isCss ? 'link' : 'script');
			if (isCss) { tag.rel = 'stylesheet'; tag.href = src; } else { tag.src = src; }
			tag.onload = resolve;
			tag.onerror = reject;
			document.head.appendChild(tag);
		});
	}

	function drawMap(el, countries) {
		load(VENDOR + 'jsvectormap.min.css?v=1.7.0', true)
			.then(function () { return load(VENDOR + 'jsvectormap.min.js?v=1.7.0'); })
			.then(function () { return load(VENDOR + 'world.js?v=1.7.0'); })
			.then(function () {
				var values = {};
				Object.keys(countries).forEach(function (c) { if (c !== 'XX') values[c] = countries[c]; });
				new window.jsVectorMap({
					selector: el,
					map: 'world',
					zoomButtons: false,
					zoomOnScroll: false,
					draggable: false,
					regionStyle: {
						initial: { fill: '#2e2e2e', stroke: '#191919', strokeWidth: 0.4, fillOpacity: 1 },
						hover: { fillOpacity: 0.85, cursor: 'default' }
					},
					visualizeData: Object.keys(values).length ? { scale: ['#237A57', '#C6E45A'], values: values } : undefined,
					onRegionTooltipShow: function (event, tooltip, code) {
						var n = countries[code] || 0;
						tooltip.text(countryName(code) + ': ' + numberFmt.format(n) + (n === 1 ? ' visit' : ' visits'));
					}
				});
			})
			.catch(function () { el.hidden = true; });
	}

	fetch('/api/visits', { method: isNewVisit() ? 'POST' : 'GET' })
		.then(function (res) {
			return res.json().catch(function () { return {}; }).then(function (data) {
				if (!res.ok) throw data;
				return data;
			});
		})
		.then(render)
		.catch(function (err) {
			// API not available: keep the block hidden, but say why for whoever is debugging
			if (window.console) console.warn('Visitor counter unavailable:', (err && (err.detail || err.error)) || err);
		});
})();
