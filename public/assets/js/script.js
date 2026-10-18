/*
 * Template behaviour for every page (iThub template, customised for TechFiyr).
 * Loaded by app/(site)/layout.tsx after the vendor libraries in public/assets/vendor.
 *
 * The site is a Next.js app: the header, footer and back-to-top ring stay on the page while
 * the content between them changes on client-side navigation. So the work is split in two:
 *   initOnce()      header, mobile menu, footer animations: run once, after React hydrates
 *   initPage(path)  sliders, counters, reveals for the current page: run on every page change,
 *                   after destroyPage() has cleaned up the previous page
 * components/SiteRuntime.tsx calls window.TechFiyr.mount(pathname) on each navigation.
 * Nothing here runs before hydration (except the preloader), so React's HTML is never changed early.
 */
(function ($) {

	'use strict';

	var started = false;
	var wow = null;
	var swipers = [];
	var sectionNav = null;
	var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;


	//Hide Loading Box (Preloader)
	function handlePreloader() {
		if ($('.preloader').length) {
			$('.preloader').fadeOut(300);
		}
	}


	//Update Header Style and Scroll to Top
	function headerStyle() {
		if ($('.main-header').length) {
			var windowpos = $(window).scrollTop();
			var siteHeader = $('.main-header');
			var scrollLink = $('.scroll-to-top');

			var HeaderHight = $('.main-header').height();
			if (windowpos >= HeaderHight) {
				siteHeader.addClass('fixed-header');
				scrollLink.fadeIn(300);
			} else {
				siteHeader.removeClass('fixed-header');
				scrollLink.fadeOut(300);
			}
		}
	}


	function closeMobileMenu() {
		$('body').removeClass('mobile-menu-visible');
		$('.mobile-menu .navigation > li').removeClass('open');
		$('.mobile-menu .navigation li ul').slideUp(0);
	}


	function swiper(selector, options) {
		if (!document.querySelector(selector)) return;
		swipers.push(new Swiper(selector, options));
	}


	/* ==========================================================================
	   Section links on the home page: smooth scroll and scroll-spy for the nav
	   (what jquery.nav.js did, but it can be stopped when the visitor leaves the page)
	   ========================================================================== */
	function startSectionNav() {
		var $links = $('.scroll-nav .navigation a[href^="/#"]');
		var sections = {};
		var docHeight = 0;
		var didScroll = false;

		function hash(link) { return link.getAttribute('href').split('#')[1]; }

		function positions() {
			$links.each(function () {
				var $target = $('#' + hash(this));
				if ($target.length) sections[hash(this)] = Math.round($target.offset().top);
			});
		}

		function setCurrent($li) {
			$('.scroll-nav .navigation > li').removeClass('current');
			$li.addClass('current');
		}

		function spy() {
			var windowPos = $(window).scrollTop();
			var windowHeight = Math.round($(window).height() * 0.5);
			var current = null;
			for (var id in sections) {
				if ((sections[id] - windowHeight) < windowPos) current = id;
			}
			if (!current) return;
			var $li = $links.filter('[href="/#' + current + '"]').parent();
			if (!$li.first().hasClass('current')) setCurrent($li);
		}

		var locked = false;
		var unlock;

		function onClick(e) {
			var id = hash(this);
			var $target = $('#' + id);
			if (!$target.length) return;
			e.preventDefault();
			closeMobileMenu();
			setCurrent($links.filter('[href="/#' + id + '"]').parent());
			// the browser's own smooth scroll (jQuery's animation fought Bootstrap's scroll-behavior
			// and stopped short of the section); 81px leaves room for the sticky header
			var behavior = reduceMotion ? 'auto' : 'smooth';
			locked = true;
			clearTimeout(unlock);
			unlock = setTimeout(function () {
				locked = false;
				// content above may have finished loading meanwhile; settle on the section's real position
				var top = $target.offset().top - 81;
				if (Math.abs($(window).scrollTop() - top) > 4) window.scrollTo({ top: top, behavior: behavior });
			}, 1600);
			window.scrollTo({ top: $target.offset().top - 81, behavior: behavior });
			history.replaceState(history.state, '', '#' + id);
		}

		positions();
		$links.on('click.sectionNav', onClick);
		$(window).on('scroll.sectionNav', function () { didScroll = true; });
		$(window).on('resize.sectionNav', positions);
		var timer = setInterval(function () {
			var h = $(document).height();
			if (didScroll && !locked) { didScroll = false; spy(); }
			if (h !== docHeight) { docHeight = h; positions(); }
		}, 250);

		return function stop() {
			clearInterval(timer);
			clearTimeout(unlock);
			$links.off('.sectionNav');
			$(window).off('.sectionNav');
			// section items are never the current page on other pages
			$links.parent().removeClass('current');
		};
	}


	/* ==========================================================================
	   Once per visit: header, mobile menu, footer
	   ========================================================================== */
	function initOnce() {

		headerStyle();

		//Mobile Nav Hide Show (the menu markup is rendered by components/NavMenu.tsx)
		if ($('.mobile-menu').length) {

			//Menu Toggle Btn
			$('.mobile-nav-toggler').on('click', function () {
				$('body').addClass('mobile-menu-visible');
			});

			//Menu Toggle Btn
			$('.mobile-menu .menu-backdrop,.mobile-menu .close-btn').on('click', closeMobileMenu);

			// Any link in the menu leads somewhere else on the site, so close the panel
			$('.mobile-menu').on('click', '.navigation a, .nav-logo a', closeMobileMenu);

			$(document).keydown(function (e) {
				if (e.keyCode == 27) closeMobileMenu();
			});
		}


		// Elements Animation (live: picks up the content of each new page by itself)
		if (typeof WOW === 'function') {
			wow = new WOW({
				boxClass: 'wow',      // animated element css class (default is wow)
				animateClass: 'animated', // animation css class (default is animated)
				offset: 0,          // distance to the element when triggering the animation (default is 0)
				mobile: true,       // trigger animations on mobile devices (default is true)
				live: true       // act on asynchronously loaded content (default is true)
			});
			wow.init();
		}


		//Typeit Text in the footer
		if ($('.variable-text').length) {
			$('.variable-text').typeIt({
				strings: ["Mobile Apps", "Web & SaaS", "CI/CD", "TechFiyr"],
				speed: 120,
				breakLines: false,
				loop: true,
				autoStart: true
			});
		}


		/////////////////////////////////////////////////////
		// "let's discuss!" in the footer
		if ($('.up-down_animation').length) {
			var endTl = gsap.timeline({
				repeat: -1,
				delay: 0.5,
				scrollTrigger: {
					trigger: '.up-down_animation',
					start: 'bottom 100%-=50px'
				}
			});
			gsap.set('.up-down_animation', {
				opacity: 0
			});
			gsap.to('.up-down_animation', {
				opacity: 1,
				duration: 1,
				ease: 'power2.out',
				scrollTrigger: {
					trigger: '.up-down_animation',
					start: 'bottom 100%-=50px',
					once: true
				}
			});
			var mySplitText = new SplitText(".up-down_animation", { type: "" });
			var chars = mySplitText.chars;
			endTl.to(chars, {
				duration: 0.5,
				scaleY: 0.6,
				ease: "power3.out",
				stagger: 0.04,
				transformOrigin: 'center bottom'
			});
			endTl.to(chars, {
				yPercent: -20,
				ease: "elastic",
				stagger: 0.03,
				duration: 0.8
			}, 0.5);
			endTl.to(chars, {
				scaleY: 1,
				ease: "elastic.out(2.5, 0.2)",
				stagger: 0.03,
				duration: 1.5
			}, 0.5);
			endTl.to(chars, {
				ease: "power2.out",
				stagger: 0.03,
				duration: 0.3
			}, 0.5);
			endTl.to(chars, {
				yPercent: 0,
				ease: "back",
				stagger: 0.03,
				duration: 0.8
			}, 0.7);
			endTl.to(chars, {
				color: '#000DFF',
				duration: 1.4,
				stagger: 0.05
			});
		}
		/////////////////////////////////////////////////////


		$(window).on('scroll', function () {
			headerStyle();
		});

		// Lazy images change the layout when they arrive; re-measure GSAP scroll triggers (debounced).
		// Wait until scrolling has stopped: refresh() puts the page back where it was when it started,
		// which cut short smooth scrolls to a section and the visitor's own momentum scrolling
		var lazyRefreshTimer;
		var lastScroll = 0;
		window.addEventListener('scroll', function () { lastScroll = Date.now(); }, { passive: true });
		function refreshWhenIdle() {
			clearTimeout(lazyRefreshTimer);
			lazyRefreshTimer = setTimeout(function () {
				if (Date.now() - lastScroll < 300) { refreshWhenIdle(); return; }
				ScrollTrigger.refresh();
			}, 200);
		}
		document.addEventListener('load', function (e) {
			if (e.target.tagName !== 'IMG' || !window.ScrollTrigger) return;
			refreshWhenIdle();
		}, true);

		// Footer visitor counter (assets/js/visitors.js)
		if (window.TechfiyrVisitors) window.TechfiyrVisitors.start();
	}


	/* ==========================================================================
	   Every page: the widgets inside <main>
	   ========================================================================== */
	function initPage(path) {

		// Main Slider
		var mainSlideCount = $('.main-slider .swiper-slide').length;
		swiper('.main-slider', {
			slidesPerView: 1,
			spaceBetween: 0,
			loop: mainSlideCount > 1,
			allowTouchMove: mainSlideCount > 1,
			autoplay: {
				enabled: true,
				delay: 30000,
			},
			// Navigation arrows
			navigation: {
				nextEl: '.main-slider-next',
				prevEl: '.main-slider-prev',
				clickable: true,
			},
			//Pagination
			pagination: {
				el: ".slider-one_pagination",
				clickable: true,
				renderBullet: function (index, className) {
					var formattedIndex = (index + 1).toString().padStart(2, '0'); // Ensures two-digit format
					return '<span class="' + className + '">' + formattedIndex + "</span>";
				},
			},
			speed: 500,
		});


		// Single One Slider
		swiper('.single-item_carousel', {
			slidesPerView: 1,
			spaceBetween: 0,
			loop: true,
			autoplay: {
				enabled: true,
				delay: 6000
			},
			// Navigation arrows
			navigation: {
				nextEl: '.single-item_carousel-next',
				prevEl: '.single-item_carousel-prev',
				clickable: true,
			},
			//Pagination
			pagination: {
				el: ".single-item_carousel-pagination",
				clickable: true,
			},
			speed: 500,
		});


		// Testimonial One Slider
		swiper('.testimonial-one_carousel', {
			slidesPerView: 1,
			spaceBetween: 0,
			effect: "slide",
			fadeEffect: {
				crossFade: true,
			},
			loop: true,
			autoplay: {
				enabled: true,
				delay: 6000
			},
			// Navigation arrows
			navigation: {
				nextEl: '.testimonial-one_carousel-next',
				prevEl: '.testimonial-one_carousel-prev',
				clickable: true,
			},
			//Pagination
			pagination: {
				el: ".testimonial-one_carousel-pagination",
				clickable: true,
			},
			speed: 500,
		});


		// Team One Slider (home #team): slides through the team, no autoplay for reduced motion
		swiper('.team-one_carousel', {
			slidesPerView: 1,
			spaceBetween: 10,
			loop: true,
			autoplay: reduceMotion ? false : {
				delay: 3000,
				disableOnInteraction: false,
				pauseOnMouseEnter: true
			},
			navigation: {
				nextEl: '.team-one_carousel-next',
				prevEl: '.team-one_carousel-prev',
			},
			speed: reduceMotion ? 0 : 800,
			breakpoints: {
				'1200': {
					slidesPerView: 4,
				},
				'992': {
					slidesPerView: 3,
				},
				'576': {
					slidesPerView: 2,
				},
				'0': {
					slidesPerView: 1,
				},
			},
		});


		// Odometer (counters start at 0 and roll to data-count when they scroll into view)
		if ($('.odometer').length && window.Odometer) {
			$('.odometer').each(function () {
				if (!this.odometer) this.odometer = new Odometer({ el: this, value: this.innerText });
			});
			$('.odometer').appear(function () {
				var odo = $(".odometer");
				odo.each(function () {
					var countNumber = $(this).attr("data-count");
					$(this).html(countNumber);
				});
			});
		}


		/////////////////////////////////////////////////////
		// Title Animation
		gsap.utils.toArray(".title-anim").forEach(function (splitTextLine) {
			if (splitTextLine.getAttribute('data-split')) return;
			splitTextLine.setAttribute('data-split', 'true');
			var tl = gsap.timeline({
				scrollTrigger: {
					trigger: splitTextLine,
					start: 'top 90%',
					end: 'bottom 60%',
					scrub: false,
					markers: false,
					toggleActions: 'play none none none'
				}
			});

			var itemSplitted = new SplitText(splitTextLine, { type: "words, lines" });
			gsap.set(splitTextLine, { perspective: 400 });
			itemSplitted.split({ type: "lines" });
			tl.from(itemSplitted.lines, { duration: 1, delay: 0.3, opacity: 0, rotationX: -80, force3D: true, transformOrigin: "top center -50", stagger: 0.1 });
		});
		/////////////////////////////////////////////////////


		if ($(".animation_mode").length && !$('.animation_mode .js-marquee-wrapper').length) {
			$('.animation_mode').marquee({
				speed: 50,
				gap: 20,
				delayBeforeStart: 0,
				direction: 'left',
				duplicated: true,
				pauseOnHover: true,
				startVisible: true,
			});
		}


		// Active Class
		var selectedIndex = 0;
		$('.offer-one_title').on('mousemove', function () {
			$(this).addClass('active').siblings().removeClass('active');
			var arr = $('.offer-one_titles .offer-one_title').toArray();
			arr.forEach(function (value, index) {
				if ($(value).hasClass('active')) {
					selectedIndex = index + 1;
				}
			});
			$('.offer-one_images_outer .offer-one_image:nth-child(' + selectedIndex + ')').addClass('active').siblings().removeClass('active');
		});


		if (path === '/') sectionNav = startSectionNav();

		// Discovery-call booking widget (assets/js/booking.js)
		if (path === '/contact' && window.TechfiyrBooking) window.TechfiyrBooking();

		// Cookie consent: show or hide the embeds on this page (assets/js/consent.js)
		if (window.TechfiyrConsent) window.TechfiyrConsent.apply();

		if (window.ScrollTrigger) ScrollTrigger.refresh();

		// WOW, the counters and the in-view images check on scroll; nudge them for the new content
		setTimeout(function () { window.dispatchEvent(new Event('scroll')); }, 60);
	}


	function destroyPage() {
		swipers.forEach(function (s) { if (s && !s.destroyed) s.destroy(true, true); });
		swipers = [];
		if (sectionNav) { sectionNav(); sectionNav = null; }
		// scroll triggers of content that is no longer on the page
		if (window.ScrollTrigger) {
			ScrollTrigger.getAll().forEach(function (st) {
				if (st.trigger && !document.body.contains(st.trigger)) st.kill();
			});
		}
		$('html, body').stop();
	}


	window.TechFiyr = {
		mount: function (path) {
			if (!started) {
				started = true;
				initOnce();
			} else {
				destroyPage();
				closeMobileMenu();
			}
			initPage(path);
		}
	};


	// Hide the preloader as soon as the DOM is ready; waiting for window load meant waiting for every image
	$(handlePreloader);

	document.dispatchEvent(new Event('techfiyr:ready'));

})(window.jQuery);
