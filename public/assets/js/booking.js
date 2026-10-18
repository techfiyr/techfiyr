/*
 * Discovery-call booking widget for the contact page (app/(site)/contact/page.tsx).
 * Slots are defined in Dhaka time and shown in the visitor's own time zone.
 * Submissions go to Netlify Forms (form name "booking", declared for Netlify in public/__forms.html);
 * if that fails (e.g. local preview), the visitor's email app opens with the details instead.
 * The page can be opened several times without a reload, so assets/js/script.js calls
 * window.TechfiyrBooking() each time the contact page is shown.
 */
window.TechfiyrBooking = function () {
	'use strict';

	// ---- Availability (Dhaka time, UTC+6, no daylight saving) ----
	var HOST_OFFSET_MIN = 6 * 60;
	var DAY_START = 19 * 60 + 30;   // 7:30 PM
	var DAY_END = 23 * 60 + 30;     // 11:30 PM (last call must end by this time)
	var DURATION = 30;              // minutes per call
	var STEP = 30;                  // minutes between slot starts
	var MIN_NOTICE_MIN = 120;       // no bookings closer than 2 hours from now
	var DAYS_AHEAD = 45;
	var CONTACT_EMAIL = 'info@techfiyr.com';

	var root = document.getElementById('booking');
	if (!root || root.getAttribute('data-booking-ready')) return;
	root.setAttribute('data-booking-ready', 'true');

	var $ = function (sel) { return root.querySelector(sel); };
	var visitorTz = (Intl.DateTimeFormat().resolvedOptions().timeZone) || 'your local time';
	var fmtTime = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
	var fmtDay = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
	var fmtFull = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
	var fmtMonth = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });
	var fmtDhaka = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

	function dayKey(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

	// Every open slot, grouped by the visitor's local calendar day
	var slotsByDay = {};
	(function buildSlots() {
		var now = Date.now();
		var hostToday = new Date(now + HOST_OFFSET_MIN * 60000);
		var y = hostToday.getUTCFullYear(), m = hostToday.getUTCMonth(), d = hostToday.getUTCDate();
		for (var i = 0; i <= DAYS_AHEAD; i++) {
			for (var t = DAY_START; t + DURATION <= DAY_END; t += STEP) {
				var ms = Date.UTC(y, m, d + i, 0, t) - HOST_OFFSET_MIN * 60000;
				if (ms < now + MIN_NOTICE_MIN * 60000) continue;
				var key = dayKey(new Date(ms));
				(slotsByDay[key] = slotsByDay[key] || []).push(ms);
			}
		}
	})();

	var keys = Object.keys(slotsByDay);
	var firstDay = keys.length ? new Date(slotsByDay[keys[0]][0]) : new Date();
	var lastDay = keys.length ? new Date(slotsByDay[keys[keys.length - 1]][0]) : new Date();
	var view = new Date(firstDay.getFullYear(), firstDay.getMonth(), 1);
	var selectedKey = null, selectedSlot = null;

	// Time zone labels
	root.querySelectorAll('[data-booking-tz]').forEach(function (el) { el.textContent = visitorTz.replace(/_/g, ' '); });
	(function localRange() {
		// Use today's date so daylight saving in the visitor's zone is accounted for
		var t = new Date(Date.now() + HOST_OFFSET_MIN * 60000);
		var hostMidnight = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()) - HOST_OFFSET_MIN * 60000;
		var from = new Date(hostMidnight + DAY_START * 60000), to = new Date(hostMidnight + DAY_END * 60000);
		var el = $('[data-booking-local-range]');
		if (el) el.textContent = fmtTime.format(from) + ' – ' + fmtTime.format(to) + ' your time';
	})();

	// ---- Calendar ----
	function renderCalendar() {
		$('[data-cal-month]').textContent = fmtMonth.format(view);
		var grid = $('[data-cal-days]');
		grid.innerHTML = '';
		var lead = (view.getDay() + 6) % 7; // Monday first
		for (var i = 0; i < lead; i++) grid.appendChild(document.createElement('span'));
		var daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
		var todayKey = dayKey(new Date());
		for (var day = 1; day <= daysInMonth; day++) {
			var date = new Date(view.getFullYear(), view.getMonth(), day);
			var key = dayKey(date);
			var btn = document.createElement('button');
			btn.type = 'button';
			btn.textContent = day;
			btn.className = 'booking-day';
			if (key === todayKey) btn.classList.add('is-today');
			if (slotsByDay[key]) {
				btn.classList.add('is-open');
				btn.dataset.key = key;
				btn.setAttribute('aria-label', fmtDay.format(date) + ', ' + slotsByDay[key].length + ' times available');
				if (key === selectedKey) { btn.classList.add('is-selected'); btn.setAttribute('aria-pressed', 'true'); }
			} else {
				btn.disabled = true;
			}
			grid.appendChild(btn);
		}
		$('[data-cal-prev]').disabled = view <= new Date(firstDay.getFullYear(), firstDay.getMonth(), 1);
		$('[data-cal-next]').disabled = view >= new Date(lastDay.getFullYear(), lastDay.getMonth(), 1);
	}

	function renderTimes() {
		var list = $('[data-times-list]');
		list.innerHTML = '';
		if (!selectedKey) return;
		var slots = slotsByDay[selectedKey];
		$('[data-times-date]').textContent = fmtDay.format(new Date(slots[0]));
		slots.forEach(function (ms) {
			var b = document.createElement('button');
			b.type = 'button';
			b.className = 'booking-time';
			b.dataset.ms = ms;
			b.textContent = fmtTime.format(new Date(ms));
			list.appendChild(b);
		});
	}

	$('[data-cal-days]').addEventListener('click', function (e) {
		var btn = e.target.closest('.booking-day.is-open');
		if (!btn) return;
		selectedKey = btn.dataset.key;
		renderCalendar();
		renderTimes();
	});
	$('[data-cal-prev]').addEventListener('click', function () { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderCalendar(); });
	$('[data-cal-next]').addEventListener('click', function () { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderCalendar(); });

	// ---- Steps ----
	function show(step) {
		root.querySelectorAll('[data-step]').forEach(function (el) { el.hidden = el.dataset.step !== step; });
		var picked = $('[data-booking-picked]');
		picked.hidden = step === 'pick' || !selectedSlot;
		if (selectedSlot) picked.querySelector('span').textContent = describe(selectedSlot);
	}

	function describe(ms) {
		var start = new Date(ms), end = new Date(ms + DURATION * 60000);
		return fmtTime.format(start) + ' – ' + fmtTime.format(end) + ', ' + fmtDay.format(start);
	}

	$('[data-times-list]').addEventListener('click', function (e) {
		var b = e.target.closest('.booking-time');
		if (!b) return;
		selectedSlot = Number(b.dataset.ms);
		show('details');
		var first = $('[data-booking-form] input[name="name"]');
		if (first) first.focus();
	});
	$('[data-booking-back]').addEventListener('click', function () { show('pick'); });
	$('[data-booking-restart]').addEventListener('click', function () {
		selectedSlot = null;
		$('[data-booking-form]').reset();
		show('pick');
	});

	// ---- Submit ----
	var form = $('[data-booking-form]');
	form.addEventListener('submit', function (e) {
		e.preventDefault();
		if (!selectedSlot) { show('pick'); return; }
		var start = new Date(selectedSlot);
		form.elements.slot_dhaka_time.value = fmtDhaka.format(start) + ' (Dhaka)';
		form.elements.slot_visitor_time.value = fmtFull.format(start);
		form.elements.visitor_timezone.value = visitorTz;
		form.elements.slot_utc.value = start.toISOString();

		var submitBtn = $('[data-booking-submit]');
		submitBtn.disabled = true;

		fetch('/__forms.html', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams(new FormData(form)).toString()
		}).then(function (res) {
			if (!res.ok) throw new Error('HTTP ' + res.status);
			done(false);
		}).catch(function () {
			openEmailFallback();
			done(true);
		}).then(function () { submitBtn.disabled = false; });
	});

	function openEmailFallback() {
		var f = form.elements;
		var subject = 'Discovery call request: ' + f.slot_dhaka_time.value;
		var body = 'Name: ' + f.name.value + '\nEmail: ' + f.email.value + '\nService: ' + f.service.value +
			'\nTime (Dhaka): ' + f.slot_dhaka_time.value + '\nTime (' + visitorTz + '): ' + f.slot_visitor_time.value +
			'\n\n' + f.message.value;
		window.location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
	}

	function done(viaEmail) {
		$('[data-done-text]').textContent = viaEmail
			? 'Your email app has opened with the booking details. Send that email and we\'ll confirm with a meeting link.'
			: 'We\'ll confirm by email with a Google Meet link, usually within a few hours.';
		$('[data-done-slot]').textContent = describe(selectedSlot) + ' (' + visitorTz.replace(/_/g, ' ') + ')';
		var z = function (d) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };
		$('[data-done-gcal]').href = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
			'&text=' + encodeURIComponent('TechFiyr discovery call') +
			'&dates=' + z(new Date(selectedSlot)) + '/' + z(new Date(selectedSlot + DURATION * 60000)) +
			'&details=' + encodeURIComponent('Free discovery call with TechFiyr. Meeting link will be emailed to you.');
		show('done');
	}

	renderCalendar();
	if (keys.length) { selectedKey = keys[0]; renderCalendar(); renderTimes(); }
};
