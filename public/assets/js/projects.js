/*
 * Renders the portfolio grid (projects.html) and the details page (project.html?p=<slug>)
 * from window.TECHFIYR_PROJECTS in projects-data.js.
 */
(function () {
	'use strict';

	var projects = window.TECHFIYR_PROJECTS || [];
	var TYPE_LABEL = { mobile: 'Mobile App', web: 'Website' };
	var LINK_LABEL = {
		appStore: { text: 'App Store', icon: 'fa-brands fa-apple' },
		playStore: { text: 'Google Play', icon: 'fa-brands fa-google-play' },
		website: { text: 'Visit Website', icon: 'fa-solid fa-arrow-up-right-from-square' }
	};

	function esc(s) {
		return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
		});
	}

	function liveLinks(p) {
		var links = p.links || {};
		return Object.keys(LINK_LABEL).filter(function (k) { return links[k]; }).map(function (k) {
			return { href: links[k], text: LINK_LABEL[k].text, icon: LINK_LABEL[k].icon };
		});
	}

	function detailsUrl(p) { return 'project.html?p=' + encodeURIComponent(p.slug); }

	// ---------- SEO (project.html) ----------
	var SITE = 'https://techfiyr.com/';

	function absUrl(path) { return SITE + String(path || '').replace(/^\//, ''); }

	function setRobots(value) {
		var tag = document.querySelector('meta[name="robots"]');
		if (tag) tag.setAttribute('content', value);
	}

	// Canonical, description, Open Graph/Twitter tags and JSON-LD for one project
	function setSeo(p) {
		var url = absUrl(detailsUrl(p));
		var title = p.title + ' | TechFiyr Projects';
		var image = absUrl(p.cover);
		var values = { title: title, description: p.summary, url: url, image: image };

		var desc = document.querySelector('meta[name="description"]');
		if (desc) desc.setAttribute('content', p.summary);
		document.querySelectorAll('[data-project-meta]').forEach(function (tag) {
			var v = values[tag.getAttribute('data-project-meta')];
			if (v) tag.setAttribute('content', v);
		});

		var canonical = document.createElement('link');
		canonical.rel = 'canonical';
		canonical.href = url;
		document.head.appendChild(canonical);

		var links = p.links || {};
		var work = {
			'@type': p.type === 'mobile' ? 'MobileApplication' : 'WebSite',
			'@id': url + '#work',
			name: p.title,
			description: (p.description || [p.summary]).join(' '),
			url: links.website || url,
			image: [image].concat((p.gallery || []).map(absUrl)),
			keywords: (p.tags || []).join(', '),
			creator: { '@id': SITE + '#organization' }
		};
		if (p.type === 'mobile') {
			if (p.category) work.applicationCategory = p.category;
			work.operatingSystem = [links.playStore ? 'Android' : '', links.appStore ? 'iOS' : ''].filter(Boolean).join(', ') || undefined;
			work.installUrl = links.playStore || links.appStore || undefined;
		}
		if (p.year) work.dateCreated = p.year;
		if (p.client) work.sourceOrganization = { '@type': 'Organization', name: p.client };
		var same = Object.keys(links).map(function (k) { return links[k]; });
		if (same.length) work.sameAs = same;

		var data = {
			'@context': 'https://schema.org',
			'@graph': [
				{
					'@type': 'WebPage',
					'@id': url + '#webpage',
					url: url,
					name: title,
					description: p.summary,
					isPartOf: { '@id': SITE + '#website' },
					mainEntity: { '@id': url + '#work' },
					primaryImageOfPage: image,
					inLanguage: 'en'
				},
				work,
				{
					'@type': 'BreadcrumbList',
					itemListElement: [
						{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
						{ '@type': 'ListItem', position: 2, name: 'Projects', item: SITE + 'projects.html' },
						{ '@type': 'ListItem', position: 3, name: p.title, item: url }
					]
				}
			]
		};
		var script = document.createElement('script');
		script.type = 'application/ld+json';
		script.textContent = JSON.stringify(data);
		document.head.appendChild(script);
	}

	// ---------- Grid ----------
	var grid = document.querySelector('[data-projects-grid]');
	if (grid) {
		var filterBar = document.querySelector('[data-projects-filter]');
		var empty = document.querySelector('[data-projects-empty]');

		function card(p) {
			var live = liveLinks(p)[0];
			return '<article class="project-card" data-type="' + esc(p.type) + '">' +
				'<div class="project-card_media">' +
					'<img src="' + esc(p.cover) + '" alt="' + esc(p.title) + '" loading="lazy">' +
					'<span class="project-chip">' + esc(TYPE_LABEL[p.type] || p.type) + '</span>' +
					(p.sample ? '<span class="project-chip project-chip_sample">Sample</span>' : '') +
				'</div>' +
				'<div class="project-card_body">' +
					'<h3 class="project-card_title"><a href="' + detailsUrl(p) + '">' + esc(p.title) + '</a></h3>' +
					'<p class="project-card_text">' + esc(p.summary) + '</p>' +
					'<ul class="project-tags">' + (p.tags || []).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
					'<div class="project-card_foot">' +
						'<span class="project-card_more">View details <i class="fa-solid fa-arrow-right"></i></span>' +
						(live ? '<a class="project-card_live" href="' + esc(live.href) + '" target="_blank" rel="noopener"><i class="' + live.icon + '"></i> Live</a>' : '') +
					'</div>' +
				'</div>' +
			'</article>';
		}

		function render(type) {
			var list = projects.filter(function (p) { return type === 'all' || p.type === type; });
			grid.innerHTML = list.map(card).join('');
			if (empty) empty.hidden = list.length > 0;
		}

		if (filterBar) {
			filterBar.addEventListener('click', function (e) {
				var btn = e.target.closest('[data-filter]');
				if (!btn) return;
				filterBar.querySelectorAll('[data-filter]').forEach(function (b) {
					var on = b === btn;
					b.classList.toggle('is-active', on);
					b.setAttribute('aria-pressed', on ? 'true' : 'false');
				});
				render(btn.dataset.filter);
			});
			// counts on the tabs
			filterBar.querySelectorAll('[data-filter]').forEach(function (b) {
				var n = b.dataset.filter === 'all' ? projects.length : projects.filter(function (p) { return p.type === b.dataset.filter; }).length;
				var c = b.querySelector('[data-count]');
				if (c) c.textContent = n;
			});
		}

		render('all');
	}

	// ---------- Details ----------
	var detail = document.querySelector('[data-project-detail]');
	if (detail) {
		var slug = new URLSearchParams(location.search).get('p');
		var p = projects.filter(function (x) { return x.slug === slug; })[0];
		var notFound = document.querySelector('[data-project-missing]');

		if (!p) {
			detail.hidden = true;
			if (notFound) notFound.hidden = false;
			setRobots('noindex, follow');
			return;
		}

		document.title = p.title + ' | TechFiyr Projects';
		setSeo(p);
		var heading = document.querySelector('.page-title h1');
		if (heading) heading.textContent = p.title;
		var crumb = document.querySelector('[data-project-crumb]');
		if (crumb) crumb.textContent = p.title;
		var bigTitle = document.querySelector('[data-project-bigtitle]');
		if (bigTitle) bigTitle.textContent = TYPE_LABEL[p.type] || 'Project';

		var links = liveLinks(p);
		var meta = [['Client', p.client], ['Country', p.country], ['Year', p.year], ['Type', TYPE_LABEL[p.type]]]
			.filter(function (m) { return m[1]; });

		detail.innerHTML =
			'<div class="project-hero">' +
				'<div class="project-hero_text">' +
					'<span class="project-chip">' + esc(TYPE_LABEL[p.type] || p.type) + '</span>' +
					(p.sample ? ' <span class="project-chip project-chip_sample">Sample</span>' : '') +
					'<h2 class="project-hero_title">' + esc(p.title) + '</h2>' +
					'<p class="project-hero_summary">' + esc(p.summary) + '</p>' +
					'<dl class="project-meta">' + meta.map(function (m) { return '<div><dt>' + m[0] + '</dt><dd>' + esc(m[1]) + '</dd></div>'; }).join('') + '</dl>' +
					(links.length ? '<div class="project-links">' + links.map(function (l) {
						return '<a class="project-link" href="' + esc(l.href) + '" target="_blank" rel="noopener"><i class="' + l.icon + '"></i> ' + l.text + '</a>';
					}).join('') + '</div>' : '') +
				'</div>' +
				'<div class="project-hero_media"><img src="' + esc(p.cover) + '" alt="' + esc(p.title) + '"></div>' +
			'</div>' +
			'<div class="project-body">' +
				'<div class="project-body_main">' +
					'<h3>Overview</h3>' + (p.description || []).map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') +
					((p.highlights || []).length ? '<h3>Highlights</h3><ul class="project-highlights">' + p.highlights.map(function (h) { return '<li><i class="fa-solid fa-circle-check"></i> ' + esc(h) + '</li>'; }).join('') + '</ul>' : '') +
				'</div>' +
				'<aside class="project-body_aside">' +
					'<h4>Tech stack</h4><ul class="project-tags">' + (p.tags || []).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
					'<h4>Have a similar idea?</h4><p>Book a free call and we\'ll map out scope, stack, and timeline.</p>' +
					'<a class="theme-btn btn-style-one" href="contact.html"><span class="btn-wrap"><span class="text-one">Book a Free Call</span><span class="text-two">Book a Free Call</span></span></a>' +
				'</aside>' +
			'</div>' +
			((p.gallery || []).length ? '<div class="project-gallery">' + p.gallery.map(function (g) {
				return '<img src="' + esc(g) + '" alt="' + esc(p.title) + ' screenshot" loading="lazy">';
			}).join('') + '</div>' : '') +
			'<div class="project-nav"><a href="projects.html"><i class="fa-solid fa-arrow-left"></i> All projects</a></div>';
	}
})();
