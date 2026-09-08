(function($) {
	
	"use strict";
	
	
	//Hide Loading Box (Preloader)
	function handlePreloader() {
		if($('.preloader').length){
			$('.preloader').delay(200).fadeOut(500);
		}
	}
	
	
	//Update Header Style and Scroll to Top
	function headerStyle() {
		if($('.main-header').length){
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
	
	headerStyle();
	
	
	//Submenu Dropdown Toggle
	if($('.main-header li').length){
		$('.main-header li.dropdown').append('<div class="dropdown-btn"><span class="fa fa-angle-down"></span></div>');
		
		//Dropdown Button
		$('.main-header li.dropdown .dropdown-btn').on('click', function() {
			$(this).prev('ul').slideToggle(500);
		});
		
		//Disable dropdown parent link
		$('.navigation li.dropdown > a').on('click', function(e) {
			e.preventDefault();
		});
		
		//Disable dropdown parent link
		$('.main-header .navigation li.dropdown > a,.hidden-bar .side-menu li.dropdown > a').on('click', function(e) {
			e.preventDefault();
		});

		$('.main-menu .navigation > li .mega-menu-bar > .column > ul').addClass('first-ul');
		$('.main-header .main-menu .navigation > li > ul').addClass('last-ul');

		$('.xs-sidebar-group .close-button').on('click', function(e) {
			$('.xs-sidebar-group.info-group').removeClass('isActive');
		});

		$('.about-widget').on('click', function(e) {
			$('.about-sidebar').addClass('active');
		});

		$('.about-sidebar .close-button').on('click', function(e) {
			$('.about-sidebar').removeClass('active');
		});
		
		$('.about-sidebar .gradient-layer').on('click', function(e) {
			$('.about-sidebar').removeClass('active');
		});
		
	}
	
	
	//Mobile Nav Hide Show
	if($('.mobile-menu').length){
		//$('.mobile-menu .menu-box').mCustomScrollbar();
		var mobileMenuContent = $('.main-header .nav-outer .main-menu').html();
		$('.mobile-menu .menu-box .menu-outer').append(mobileMenuContent);
		$('.sticky-header .main-menu').append(mobileMenuContent);
		


		//Hide / Show Submenu
		$('.mobile-menu .navigation > li.dropdown > .dropdown-btn').on('click', function(e) {
			console.log('btn clicked');
			e.preventDefault();
			var target = $(this).parent('li').children('ul');
			var target1 = $(this).parent('li').children('div.mega-menu');
			// console.log('target', $(target).is(':visible'));
			console.log('target1', $(target1).is(':visible'));
			
			if ($(target).is(':visible')){
				$(this).parent('li').removeClass('open');
				$(target).slideUp(500);
				$(this).parents('.navigation').children('li.dropdown').removeClass('open');
				$(this).parents('.navigation').children('li.dropdown > ul.last-ul').slideUp(500);
				return false;
			} else{
				$(this).parents('.navigation').children('li.dropdown').removeClass('open');
				$(this).parents('.navigation').children('li.dropdown').children('ul.last-ul').slideUp(500);
				$(this).parent('li').toggleClass('open');
				$(this).parent('li').children('ul.last-ul').slideToggle(500);
			}
			if ($(target1).is(':visible')) {
				console.log('Visible');
				$(this).parent('li').removeClass('open');
				$(target1).slideUp(500);
				$(this).parents('.navigation').children('li.dropdown').removeClass('open');
				$(this).parents('.navigation').children('li.dropdown > .mega-menu').slideUp(500);
				// return false;
			} else {
				console.log('Not Visible');
				$(this).parents('.navigation').children('li.dropdown').removeClass('open');
				$(this).parents('.navigation').children('li.dropdown').children('.mega-menu').slideUp(500);
				$('.first-ul').css('display', 'block');
				$(this).parent('li').toggleClass('open');
				$(this).parent('li').children('.mega-menu').slideToggle(500);
			}
		});


		//3rd Level Nav
		$('.mobile-menu .navigation > li.dropdown > ul  > li.dropdown > .dropdown-btn').on('click', function(e) {
			e.preventDefault();
			var targetInner = $(this).parent('li').children('ul');
			
			if ($(targetInner).is(':visible')){
				$(this).parent('li').removeClass('open');
				$(targetInner).slideUp(500);
				$(this).parents('.navigation > ul').find('li.dropdown').removeClass('open');
				$(this).parents('.navigation > ul').find('li.dropdown > ul').slideUp(500);
				return false;
			}else{
				$(this).parents('.navigation > ul').find('li.dropdown').removeClass('open');
				$(this).parents('.navigation > ul').find('li.dropdown > ul').slideUp(500);
				$(this).parent('li').toggleClass('open');
				$(this).parent('li').children('ul').slideToggle(500);
			}
		});

		//Menu Toggle Btn
		$('.mobile-nav-toggler').on('click', function() {
			$('body').addClass('mobile-menu-visible');

		});



		//Menu Toggle Btn
		$('.mobile-menu .menu-backdrop,.mobile-menu .close-btn').on('click', function() {
			$('body').removeClass('mobile-menu-visible');
			$('.mobile-menu .navigation > li').removeClass('open');
			$('.mobile-menu .navigation li ul').slideUp(0);
		});

		$(document).keydown(function(e){
	        if(e.keyCode == 27) {
				$('body').removeClass('mobile-menu-visible');
			$('.mobile-menu .navigation > li').removeClass('open');
			$('.mobile-menu .navigation li ul').slideUp(0);
        	}
	    });
		
	}


	//Add One Page nav
	if($('.scroll-nav ul').length) {
		$('.scroll-nav ul').onePageNav();
	}
	
	
	//Custom Scroll Linsk / Sidebar
	if($('.scroll-nav li a').length){
		$(".scroll-nav li a").on('click', function(e) {
			e.preventDefault();
		   $('body').removeClass('mobile-menu-visible');
		});
	}



	//Header Search
	if($('.search-box-outer').length) {
		$('.search-box-outer').on('click', function() {
			$('body').addClass('search-active');
		});
		$('.close-search').on('click', function() {
			$('body').removeClass('search-active');
		});
	}


	
	
	//Event Countdown Timer
	if($('.time-countdown').length){  
		$('.time-countdown').each(function() {
		var $this = $(this), finalDate = $(this).data('countdown');
		$this.countdown(finalDate, function(event) {
			var $this = $(this).html(event.strftime('' + '<div class="counter-column"><span class="count">%D</span>Days</div> ' + '<div class="counter-column"><span class="count">%H</span>Hours</div>  ' + '<div class="counter-column"><span class="count">%M</span>Minutes</div>  ' + '<div class="counter-column"><span class="count">%S</span>Seconds</div>'));
		});
	 });
	}


	if($('.clock-wrapper').length){  
		(function(){
            //generate clock animations
            var now       = new Date(),
                hourDeg   = now.getHours() / 12 * 360 + now.getMinutes() / 60 * 30,
                minuteDeg = now.getMinutes() / 60 * 360 + now.getSeconds() / 60 * 6,
                secondDeg = now.getSeconds() / 60 * 360,
                stylesDeg = [
                    "@-webkit-keyframes rotate-hour{from{transform:rotate(" + hourDeg + "deg);}to{transform:rotate(" + (hourDeg + 360) + "deg);}}",
                    "@-webkit-keyframes rotate-minute{from{transform:rotate(" + minuteDeg + "deg);}to{transform:rotate(" + (minuteDeg + 360) + "deg);}}",
                    "@-webkit-keyframes rotate-second{from{transform:rotate(" + secondDeg + "deg);}to{transform:rotate(" + (secondDeg + 360) + "deg);}}",
                    "@-moz-keyframes rotate-hour{from{transform:rotate(" + hourDeg + "deg);}to{transform:rotate(" + (hourDeg + 360) + "deg);}}",
                    "@-moz-keyframes rotate-minute{from{transform:rotate(" + minuteDeg + "deg);}to{transform:rotate(" + (minuteDeg + 360) + "deg);}}",
                    "@-moz-keyframes rotate-second{from{transform:rotate(" + secondDeg + "deg);}to{transform:rotate(" + (secondDeg + 360) + "deg);}}"
                ].join("");
            document.getElementById("clock-animations").innerHTML = stylesDeg;
        })();
    }





	
	//Parallax Scene for Icons
	if($('.parallax-scene-1').length){
		var scene = $('.parallax-scene-1').get(0);
		var parallaxInstance = new Parallax(scene);
	}

	
	
	if($('.paroller').length){
		$('.paroller').paroller({
			  factor: 0.2,            // multiplier for scrolling speed and offset, +- values for direction control  
			  factorLg: 0.4,          // multiplier for scrolling speed and offset if window width is less than 1200px, +- values for direction control  
			  type: 'foreground',     // background, foreground  
			  direction: 'horizontal' // vertical, horizontal  
		});
	}



	//  Animation Fade Left End
	/////////////////////////////////////////////////////
	// CURSOR
	var cursor = $(".cursor"),
	follower = $(".cursor-follower");

	var posX = 0,
		posY = 0;

	var mouseX = 0,
		mouseY = 0;

	TweenMax.to({}, 0.016, {
	repeat: -1,
	onRepeat: function() {
		posX += (mouseX - posX) / 9;
		posY += (mouseY - posY) / 9;

		TweenMax.set(follower, {
			css: {
			left: posX - 12,
			top: posY - 12
			}
		});

		TweenMax.set(cursor, {
			css: {
			left: mouseX,
			top: mouseY
			}
		});
	}
	});

	$(document).on("mousemove", function(e) {
		mouseX = e.clientX;
		mouseY = e.clientY;
	});
	//circle
	$(".theme-btn, a").on("mouseenter", function() {
		cursor.addClass("active");
		follower.addClass("active");
	});
	$(".theme-btn, a").on("mouseleave", function() {
		cursor.removeClass("active");
		follower.removeClass("active");
	});   
	// CURSOR End


	
	// Main Slider
	var slider = new Swiper('.main-slider', {
		slidesPerView: 1,
		spaceBetween: 0,
		loop: true,
		autoplay: {
			enabled: true,
			delay: 60000,
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
        let formattedIndex = (index + 1).toString().padStart(2, '0'); // Ensures two-digit format
        return '<span class="' + className + '">' + formattedIndex + "</span>";
    },
		},
		speed: 500,
		breakpoints: {
			'1600': {
				slidesPerView: 1,
			},
			'1200': {
				slidesPerView: 1,
			},
			'992': {
				slidesPerView: 1,
			},
			'768': {
				slidesPerView: 1,
			},
			'576': {
				slidesPerView: 1,
			},
			'0': {
				slidesPerView: 1,
			},
		},
	});


	
	// Clients Slider
	var slider = new Swiper('.clients-one_slider', {
		slidesPerView: 6,
		spaceBetween: 10,
		loop: true,
		autoplay: {
			enabled: true,
			delay: 2000,
		},
		// Navigation arrows
		navigation: {
			nextEl: '.clients-one_slider_button-next',
			prevEl: '.clients-one_slider_button-prev',
			clickable: true,
		},
		//Pagination
		pagination: {
			el: ".clients-one_pagination",
			clickable: true,
		},
		speed: 500,
		breakpoints: {
			'1600': {
				slidesPerView: 6,
			},
			'1200': {
				slidesPerView: 6,
			},
			'992': {
				slidesPerView: 4,
			},
			'768': {
				slidesPerView: 3,
			},
			'576': {
				slidesPerView: 3,
			},
			'0': {
				slidesPerView: 2,
			},
		},
	});



	// Single One Slider
	var slider = new Swiper('.single-item_carousel', {
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
		breakpoints: {
			'1600': {
				slidesPerView: 1,
			},
			'1200': {
				slidesPerView: 1,
			},
			'992': {
				slidesPerView: 1,
			},
			'768': {
				slidesPerView: 1,
			},
			'576': {
				slidesPerView: 1,
			},
			'0': {
				slidesPerView: 1,
			},
		},
	});
	
	
	
	
	// Testimonial One Slider
	var slider = new Swiper('.testimonial-one_carousel', {
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
		breakpoints: {
			'1600': {
				slidesPerView: 1,
			},
			'1200': {
				slidesPerView: 1,
			},
			'992': {
				slidesPerView: 1,
			},
			'768': {
				slidesPerView: 1,
			},
			'576': {
				slidesPerView: 1,
			},
			'0': {
				slidesPerView: 1,
			},
		},
	});
	
	
	
	
	// Testimonial Two Slider
	var slider = new Swiper('.testimonial-two_carousel', {
		slidesPerView: 2,
		slidesPerGroup: 2, // Moves two slides at a time
		spaceBetween: 0,
		loop: true,
		autoplay: {
			enabled: true,
			delay: 6000
		},
		// Navigation arrows
		navigation: {
			nextEl: '.testimonial-two_carousel-next',
			prevEl: '.testimonial-two_carousel-prev',
			clickable: true,
		},
		//Pagination
		pagination: {
			el: ".testimonial-two_carousel-pagination",
			clickable: true,
		},
		speed: 500,
		breakpoints: {
			'1600': {
				slidesPerView: 2,
			},
			'1200': {
				slidesPerView: 2,
			},
			'992': {
				slidesPerView: 2,
			},
			'768': {
				slidesPerView: 1,
			},
			'576': {
				slidesPerView: 1,
			},
			'0': {
				slidesPerView: 1,
			},
		},
	});
	
	
	
	
	var Testimonial_nav = new Swiper(".testimonial__nav", {
		loop: false, // Disable infinite loop
		spaceBetween: 0,
		speed: 500,
		slidesPerView: 2, // 2 slides per row
		grid: {
			rows: 2, // 2x2 layout
			fill: "row", // Ensure proper row-wise arrangement
		},
		centeredSlides: false, // Prevent centering behavior
		allowTouchMove: false, // Disable manual sliding
		slideToClickedSlide: false, // Prevent auto-scrolling when clicking
		autoplay: false, // Ensure no auto movement
		watchSlidesProgress: true, // Maintain active slide tracking
		updateOnWindowResize: false, // Stop re-rendering on resize
		breakpoints: {
			'1400': { slidesPerView: 2, grid: { rows: 2 } },
			'1200': { slidesPerView: 2, grid: { rows: 2 } },
			'992': { slidesPerView: 2, grid: { rows: 2 } },
			'768': { slidesPerView: 2, grid: { rows: 2 } },
			'577': { slidesPerView: 2, grid: { rows: 2 } },
			'0': { slidesPerView: 2, grid: { rows: 2 } },
		},
		on: {
			slideChangeTransitionStart: function () {
				this.allowSlideNext = false;
				this.allowSlidePrev = false;
			},
		},
	});

	var swiper2 = new Swiper(".testimonial__active", {
		loop: false,
		spaceBetween: 0,
		pagination: {
			el: ".swiper-pagination",
			clickable: true,
		},
		autoplay: {
			enabled: true,
			delay: 6000
		},
		slidesPerView: 1,
		thumbs: {
			swiper: Testimonial_nav, // Sync with testimonial__nav
		},
	});



	const serviceImgItem = document.querySelectorAll(".news-block_two-inner");
	function followImageCursor(event, serviceImgItem) {
		const contentBox = serviceImgItem.getBoundingClientRect();
		const dx = event.clientX - contentBox.x;
		const dy = event.clientY - contentBox.y;
		serviceImgItem.children[1].style.transform = `translate(${dx}px, ${dy}px)`;
	}

	serviceImgItem.forEach((item, i) => {
		item.addEventListener("mousemove", (event) => {
		  setInterval(followImageCursor(event, item), 1000);
		});
	});
	
	
	
	
	// Odometer
	if ($(".odometer").length) {
		$('.odometer').appear();
		$('.odometer').appear(function(){
			var odo = $(".odometer");
			odo.each(function() {
				var countNumber = $(this).attr("data-count");
				$(this).html(countNumber);
			});
			window.odometerOptions = {
				format: 'd',
			};
		});
	}
	
	


	//Event Countdown Timer
	if($('.time-countdown').length){  
		$('.time-countdown').each(function() {
		var $this = $(this), finalDate = $(this).data('countdown');
		$this.countdown(finalDate, function(event) {
			var $this = $(this).html(event.strftime('' + '<div class="counter-column"><span class="count">%D</span>Days</div> ' + '<div class="counter-column"><span class="count">%H</span>Hours</div>  ' + '<div class="counter-column"><span class="count">%M</span>Minutes</div>  ' + '<div class="counter-column"><span class="count">%S</span>Seconds</div>'));
		});
	 });
	}


	if($('.clock-wrapper').length){  
		(function(){
            //generate clock animations
            var now       = new Date(),
                hourDeg   = now.getHours() / 12 * 360 + now.getMinutes() / 60 * 30,
                minuteDeg = now.getMinutes() / 60 * 360 + now.getSeconds() / 60 * 6,
                secondDeg = now.getSeconds() / 60 * 360,
                stylesDeg = [
                    "@-webkit-keyframes rotate-hour{from{transform:rotate(" + hourDeg + "deg);}to{transform:rotate(" + (hourDeg + 360) + "deg);}}",
                    "@-webkit-keyframes rotate-minute{from{transform:rotate(" + minuteDeg + "deg);}to{transform:rotate(" + (minuteDeg + 360) + "deg);}}",
                    "@-webkit-keyframes rotate-second{from{transform:rotate(" + secondDeg + "deg);}to{transform:rotate(" + (secondDeg + 360) + "deg);}}",
                    "@-moz-keyframes rotate-hour{from{transform:rotate(" + hourDeg + "deg);}to{transform:rotate(" + (hourDeg + 360) + "deg);}}",
                    "@-moz-keyframes rotate-minute{from{transform:rotate(" + minuteDeg + "deg);}to{transform:rotate(" + (minuteDeg + 360) + "deg);}}",
                    "@-moz-keyframes rotate-second{from{transform:rotate(" + secondDeg + "deg);}to{transform:rotate(" + (secondDeg + 360) + "deg);}}"
                ].join("");
            document.getElementById("clock-animations").innerHTML = stylesDeg;
        })();
    }




	//Tabs Box
	if($('.tabs-box').length){
		$('.tabs-box .tab-buttons .tab-btn').on('click', function(e) {
			e.preventDefault();
			var target = $($(this).attr('data-tab'));
			
			if ($(target).is(':visible')){
				return false;
			}else{
				target.parents('.tabs-box').find('.tab-buttons').find('.tab-btn').removeClass('active-btn');
				$(this).addClass('active-btn');
				target.parents('.tabs-box').find('.tabs-content').find('.tab').fadeOut(0);
				target.parents('.tabs-box').find('.tabs-content').find('.tab').removeClass('active-tab');
				$(target).fadeIn(300);
				$(target).addClass('active-tab');
			}
		});
	}




	//Add One Page nav
	if($('.scroll-nav').length) {
		$('.scroll-nav ul').onePageNav();
	}
	
	
	//Custom Scroll Linsk / Sidebar
	if($('.scroll-nav li a').length){
		$(".scroll-nav li a").on('click', function(e) {
			e.preventDefault();
		   $('body').removeClass('mobile-menu-visible');
		});
	}
	
	
	
	
	// Testimonial Section Four Carousel
	if($('.shop-detail').length){
		var thumbsCarousel = new Swiper('.shop-detail .thumbs-carousel', {
	      spaceBetween: 15,
	      slidesPerView: 4,
	      //direction: 'vertical',
	      breakpoints: {
		      320: {       
	     		  //direction: 'horizontal',
			      slidesPerView: 3, 
		      },
		      640: {       
	     		  //direction: 'horizontal',
			      slidesPerView: 4, 
		      } ,
		      1023: {       
			      slidesPerView: 4, 
		      } 
		  
		   }
	    });

	    var contentCarousel = new Swiper('.shop-detail .content-carousel', {
	      spaceBetween: 0,
	      loop:true,
	      navigation: {
	        nextEl: '.swiper-button-next',
	        prevEl: '.swiper-button-prev',
	      },
	      thumbs: {
	        swiper: thumbsCarousel
	      },
	    });
	}
	
	
	
	//Jquery Spinner / Quantity Spinner
	if($('.qty-spinner').length){
		$("input.qty-spinner").TouchSpin({
		  verticalbuttons: true
		});
	}
	
	
	
	//Custom Seclect Box
	if($('.custom-select-box').length){
		$('.custom-select-box').selectmenu().selectmenu('menuWidget').addClass('overflow');
	}
	

	
	///////////////////////////////////////////////////// 
    // Title Animation
    let splitTitleLines = gsap.utils.toArray(".title-anim");

    splitTitleLines.forEach(splitTextLine => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: splitTextLine,
          start: 'top 90%',
          end: 'bottom 60%',
          scrub: false,
          markers: false,
          toggleActions: 'play none none none'
        }
      });

      const itemSplitted = new SplitText(splitTextLine, { type: "words, lines" });
      gsap.set(splitTextLine, { perspective: 400 });
      itemSplitted.split({ type: "lines" })
      tl.from(itemSplitted.lines, { duration: 1, delay: 0.3, opacity: 0, rotationX: -80, force3D: true, transformOrigin: "top center -50", stagger: 0.1 });
    });
    /////////////////////////////////////////////////////


	if ($(".animation_mode").length) {
		$('.animation_mode').marquee({
			speed: 50,
			gap: 20,
			delayBeforeStart: 0,
			direction: 'left',
			duplicated: true,
			pauseOnHover: true,
			startVisible:true,
		});
	}



	if ($(".animation_mode-two").length) {
		$('.animation_mode-two').marquee({
			speed: 50,
			gap: 20,
			delayBeforeStart: 0,
			direction: 'right',
			duplicated: true,
			duplicateCount: 8,
			delayBeforeStart: 0,
			pauseOnHover: true,
			startVisible:true,
		});
	}
	
	
  let imageTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".video-image",
      start: "top bottom",
      markers: false,
      scrub: 1,
      end: "bottom center"
    }
  })
	// Image pin 
	imageTl.to(".video-image img", {
		scale: 1.15,
		duration: 1,
	})
	
	
	//Typeit Text On Main Page
	if ($('.variable-text').length) {
		
		$('.variable-text').typeIt({
			 strings: ["TechFiyr"],
			 speed: 450,
			 breakLines: true,
			 loop:true,
			 autoStart: true
		});	
	}
	
	
	
	// Instagram One Slider
	var slider = new Swiper('.instagram-one_carousel', {
		slidesPerView: 5,
		spaceBetween: 0,
		loop: true,
		autoplay: {
			enabled: true,
			delay: 6000
		},
		// Navigation arrows
		navigation: {
			nextEl: '.instagram-one_next-arrow',
			prevEl: '.instagram-one_prev-arrow',
			clickable: true,
		},
		//Pagination
		pagination: {
			el: ".instagram-one_carousel-pagination",
			clickable: true,
		},
		speed: 500,
		breakpoints: {
			'1600': {
				slidesPerView: 5,
			},
			'1200': {
				slidesPerView: 5,
			},
			'992': {
				slidesPerView: 4,
			},
			'768': {
				slidesPerView: 4,
			},
			'576': {
				slidesPerView: 3,
			},
			'0': {
				slidesPerView: 2,
			},
		},
	});
	
	
	
	
	// Instagram One Slider
	var slider = new Swiper('.instagram-two_carousel', {
		slidesPerView: 8,
		spaceBetween: 0,
		loop: true,
		autoplay: {
			enabled: true,
			delay: 6000
		},
		// Navigation arrows
		navigation: {
			nextEl: '.instagram-two_next-arrow',
			prevEl: '.instagram-two_prev-arrow',
			clickable: true,
		},
		//Pagination
		pagination: {
			el: ".instagram-two_carousel-pagination",
			clickable: true,
		},
		speed: 500,
		breakpoints: {
			'1600': {
				slidesPerView: 8,
			},
			'1200': {
				slidesPerView: 7,
			},
			'992': {
				slidesPerView: 5,
			},
			'768': {
				slidesPerView: 4,
			},
			'576': {
				slidesPerView: 3,
			},
			'0': {
				slidesPerView: 2,
			},
		},
	});
	
	
	
	
	// Gallery Slider
	var slider = new Swiper('.gallery_carousel', {
		slidesPerView: 3,
		spaceBetween: 30,
		centeredSlides: true,
		loop: true,
		autoplay: {
			enabled: true,
			delay: 6000
		},
		// Navigation arrows
		navigation: {
			nextEl: '.gallery_carousel_next-arrow',
			prevEl: '.gallery_carousel_prev-arrow',
			clickable: true,
		},
		//Pagination
		pagination: {
			el: ".gallery_carousel_carousel-pagination",
			clickable: true,
		},
		speed: 500,
		breakpoints: {
			'1600': {
				slidesPerView: 3,
			},
			'1200': {
				slidesPerView: 3,
			},
			'992': {
				slidesPerView: 3,
			},
			'768': {
				slidesPerView: 2,
			},
			'576': {
				slidesPerView: 2,
			},
			'0': {
				slidesPerView: 1,
			},
		},
	});
	
	
	
	
	//Gallery Block One Overlay
	document.querySelectorAll('.gallery-block-one').forEach(block => {
		const overlay = block.querySelector('.gallery-block_one-overlay');
		
		block.addEventListener('mouseenter', (e) => {
			const rect = block.getBoundingClientRect();
			const enterX = e.clientX - rect.left;
			const enterY = e.clientY - rect.top;
			
			overlay.style.transition = 'none';
			overlay.style.transform = `translate(${enterX - overlay.clientWidth / 2}px, ${enterY - overlay.clientHeight / 2}px)`;
			
			setTimeout(() => {
				overlay.style.transition = 'transform 150ms ease-out';
			});
		});
		
		block.addEventListener('mousemove', (e) => {
			const rect = block.getBoundingClientRect();
			const offsetX = e.clientX - rect.left - (overlay.clientWidth / 2);
			const offsetY = e.clientY - rect.top - (overlay.clientHeight / 2);
			
			overlay.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
		});
		
		block.addEventListener('mouseleave', () => {
			overlay.style.transition = 'transform 600ms ease-out';
			overlay.style.transform = 'translate(0, 0)';
		});
	});
	
	
	
	// Accordion Box
	if($('.accordion-box').length){
		$(".accordion-box").on('click', '.acc-btn', function() {

			var outerBox = $(this).parents('.accordion-box');
			var target = $(this).parents('.accordion');

			if ($(this).next('.acc-content').is(':visible')){
				//return false;
				$(this).removeClass('active');
				$(this).next('.acc-content').slideUp(300);
				$(outerBox).children('.accordion').removeClass('active-block');
			}else{
				$(outerBox).find('.accordion .acc-btn').removeClass('active');
				$(this).addClass('active');
				$(outerBox).children('.accordion').removeClass('active-block');
				$(outerBox).find('.accordion').children('.acc-content').slideUp(300);
				target.addClass('active-block');
				$(this).next('.acc-content').slideDown(300);
			}
		});
	}
	
	
	
	// Masonary
	function enableMasonry() {
		if($('.masonry-items-container').length){
	
			var winDow = $(window);
			// Needed variables
			var $container=$('.masonry-items-container');
	
			$container.isotope({
				itemSelector: '.masonry-item',
				 masonry: {
					columnWidth : '.masonry-item.col-lg-4'
				 },
				animationOptions:{
					duration:500,
					easing:'linear'
				}
			});
	
			winDow.bind('resize', function(){

				$container.isotope({ 
					itemSelector: '.masonry-item',
					animationOptions: {
						duration: 500,
						easing	: 'linear',
						queue	: false
					}
				});
			});
		}
	}
	
	enableMasonry();

	
	
	
	// Services Slider
	var slider = new Swiper('.services-carousel', {
		slidesPerView: 4,
		spaceBetween: 30,
		loop: true,
		autoplay: {
			enabled: true,
			delay: 6000
		},
		// Navigation arrows
		navigation: {
			nextEl: '.services-carousel-arrow',
			prevEl: '.services-carousel-arrow',
			clickable: true,
		},
		//Pagination
		pagination: {
			el: ".services-carousel_pagination",
			clickable: true,
		},
		speed: 500,
		breakpoints: {
			'1600': {
				slidesPerView: 4,
			},
			'1200': {
				slidesPerView: 4,
			},
			'992': {
				slidesPerView: 3,
			},
			'768': {
				slidesPerView: 2,
			},
			'576': {
				slidesPerView: 2,
			},
			'0': {
				slidesPerView: 1,
			},
		},
	});




	//Progress Bar
	if($('.progress-line').length){
		$('.progress-line').appear(function(){
			var el = $(this);
			var percent = el.data('width');
			$(el).css('width',percent+'%');
		},{accY: 0});
	}
	
	
	//Fact Counter + Text Count
	if($('.count-box').length){
		$('.count-box').appear(function(){
	
			var $t = $(this),
				n = $t.find(".count-text").attr("data-stop"),
				r = parseInt($t.find(".count-text").attr("data-speed"), 10);
				
			if (!$t.hasClass("counted")) {
				$t.addClass("counted");
				$({
					countNum: $t.find(".count-text").text()
				}).animate({
					countNum: n
				}, {
					duration: r,
					easing: "linear",
					step: function() {
						$t.find(".count-text").text(Math.floor(this.countNum));
					},
					complete: function() {
						$t.find(".count-text").text(this.countNum);
					}
				});
			}
			
		},{accY: 0});
	}



	// Active Class
	let selectedIndex = 0;
	$('.offer-one_title').on('mousemove', function (e) {
		$(this).addClass('active').siblings().removeClass('active');
		let arr = [...$('.offer-one_titles .offer-one_title')];
		arr.forEach((value, index) => {
			if ($(value).hasClass('active')) {
				selectedIndex = index + 1;
			}
		});
		$('.offer-one_images_outer .offer-one_image:nth-child(' + selectedIndex + ')').addClass('active').siblings().removeClass('active');
	});
	
	
	
	
	 /////////////////////////////////////////////////////
  // 31. Folks animation
  let endTl = gsap.timeline({
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
  let mySplitText = new SplitText(".up-down_animation", { type: "" });
  let chars = mySplitText.chars;
  //let endGradient = chroma.scale(['#F9D371', '#F47340', '#EF2F88', '#8843F2']);
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
    //color: (i, el, arr) => {
      //return endGradient(i / arr.length).hex();
    //},
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
  /////////////////////////////////////////////////////




	// LightBox Image
	if($('.lightbox-image').length) {
		$('.lightbox-image').magnificPopup({
		  type: 'image',
		  gallery:{
		    enabled:true
		  }
		});
	}
	


	// LightBox Video
	if($('.lightbox-video').length) {
		$('.lightbox-video').magnificPopup({
	      // disableOn: 700,
	      type: 'iframe',
	      mainClass: 'mfp-fade',
	      removalDelay: 160,
	      preloader: false,
	      iframe:{
	        patterns:{
	          youtube:{
	          index: 'youtube.com',
	          id: 'v=',
	          src: 'https://www.youtube.com/embed/%id%'
	        },
	      },
	      srcAction:'iframe_src',
	    },
	      fixedContentPos: false
	    });
	}



	//Contact Form Validation
	if($('#contact-form').length){
		$('#contact-form').validate({
			rules: {
				username: {
					required: true
				},
				email: {
					required: true,
					email: true
				},
				message: {
					required: true
				}
			}
		});
	}
	
	
	
	// Scroll to a Specific Div
	if($('.scroll-to-target').length){
		$(".scroll-to-target").on('click', function() {
			var target = $(this).attr('data-target');
		   // animate
		   $('html, body').animate({
			   scrollTop: $(target).offset().top
			 }, 1500);
	
		});
	}
	
	
	
	// Elements Animation
	if($('.wow').length){
		var wow = new WOW(
		  {
			boxClass:     'wow',      // animated element css class (default is wow)
			animateClass: 'animated', // animation css class (default is animated)
			offset:       0,          // distance to the element when triggering the animation (default is 0)
			mobile:       true,       // trigger animations on mobile devices (default is true)
			live:         true       // act on asynchronously loaded content (default is true)
		  }
		);
		wow.init();
	}
	


/* ==========================================================================
   When document is Scrollig, do
   ========================================================================== */
	
	$(window).on('scroll', function() {
		headerStyle();
	});
	
/* ==========================================================================
   When document is loading, do
   ========================================================================== */
	
	$(window).on('load', function() {
		handlePreloader();
		enableMasonry();
	});	

})(window.jQuery);