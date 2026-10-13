/*
 * TechFiyr portfolio data — the single place to add or edit projects.
 * Used by projects.html (grid) and project.html?p=<slug> (details).
 *
 * Fields
 *   slug         unique, lowercase-with-dashes; becomes the details URL (project.html?p=slug)
 *   type         'mobile' or 'web' (drives the filter tabs)
 *   title        project name
 *   summary      one or two sentences for the grid card
 *   description  array of paragraphs for the details page
 *   highlights   short bullet points (features / results)
 *   client, country, year   optional, shown on the details page
 *   cover        main image (16:10 works best), e.g. 'assets/images/projects/my-app/cover.jpg'
 *   gallery      extra screenshots (optional)
 *   tags         tech stack
 *   links        any of { appStore, playStore, website } — leave out what doesn't exist
 *   category     optional, schema.org app category for mobile apps (e.g. 'SportsApplication', 'BusinessApplication')
 *   sample       true = placeholder entry; delete these once real projects are added
 *
 * When you add a project, also add its details URL (project.html?p=<slug>) to sitemap.xml, the ItemList
 * and <noscript> list in projects.html, and llms.txt, so search engines and AI crawlers find it.
 */
window.TECHFIYR_PROJECTS = [
	{
		slug: 'matmaps',
		type: 'mobile',
		category: 'SportsApplication',
		title: 'MatMaps',
		summary: 'A UK combat sports platform that helps athletes find clubs and events, and gives gym owners the tools to run their club, on Android and the web.',
		description: [
			'MatMaps brings martial arts clubs, coaches and athletes across the UK into one place. Fighters can search combat sports gyms, events and training locations near them, while club owners manage their listing, events and members from the same app.',
			'The platform covers a geo-located club directory, an events pipeline for tournaments and bookings, round timers for training, role-based access for staff, review moderation, and cloud media storage on Firebase. It runs on three plans: Free, Athletes (£2.99/month) and Club Owner (£11.99/month).'
		],
		highlights: [
			'Geo-located directory of combat sports clubs across the UK',
			'Events pipeline for tournaments, check-ins and venue bookings',
			'Training round timer built into the app',
			'Role-based access and review moderation for club owners',
			'Subscription plans for athletes and club owners'
		],
		client: 'MatMaps',
		country: 'United Kingdom',
		year: '2026',
		cover: 'assets/images/projects/matmaps/cover.jpg',
		gallery: [
			'assets/images/projects/matmaps/screens.jpg',
			'assets/images/projects/matmaps/features.jpg',
			'assets/images/projects/matmaps/platform.jpg'
		],
		tags: ['Android & iOS', 'Firebase', 'Web Platform'],
		links: {
			playStore: 'https://play.google.com/store/apps/details?id=com.matmaps.app',
			website: 'https://matmaps.co.uk/'
		}
	}
];
