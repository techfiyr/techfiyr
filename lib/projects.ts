/*
 * TechFiyr portfolio data: the single place to add or edit projects.
 * Used by /projects (grid), /projects/<slug> (details, prerendered at build time), the sitemap
 * and the projects JSON-LD, so a new entry here is published everywhere at once.
 * Also add the project to the Projects section of public/llms.txt (AGENTS.md section 7.4).
 *
 * Fields
 *   slug         unique, lowercase-with-dashes; becomes the details URL (/projects/<slug>)
 *   type         'mobile' or 'web' (drives the filter tabs)
 *   title        project name
 *   summary      one or two sentences for the grid card and the meta description
 *   description  paragraphs for the details page
 *   highlights   short bullet points (features / results)
 *   client, country, year   optional, shown on the details page
 *   cover        main image (16:10 works best), e.g. '/assets/images/projects/my-app/cover.jpg'
 *   gallery      extra screenshots (optional)
 *   tags         tech stack
 *   links        any of { appStore, playStore, website }; leave out what doesn't exist
 *   category     optional, schema.org app category for mobile apps (e.g. 'SportsApplication')
 *   sample       true = placeholder entry; delete these once real projects are added
 */
export type Project = {
	slug: string;
	type: 'mobile' | 'web';
	category?: string;
	title: string;
	summary: string;
	description: string[];
	highlights?: string[];
	client?: string;
	country?: string;
	year?: string;
	cover: string;
	gallery?: string[];
	tags?: string[];
	links?: { appStore?: string; playStore?: string; website?: string };
	sample?: boolean;
};

export const PROJECTS: Project[] = [
	{
		slug: 'matmaps',
		type: 'mobile',
		category: 'SportsApplication',
		title: 'MatMaps',
		summary: 'A UK combat sports platform that helps athletes find clubs and events, and gives gym owners the tools to run their club, on Android and the web.',
		description: [
			'MatMaps brings martial arts clubs, coaches and athletes across the UK into one place. Fighters can search combat sports gyms, events and training locations near them, while club owners manage their listing, events and members from the same app.',
			'The platform covers a geo-located club directory, an events pipeline for tournaments and bookings, round timers for training, role-based access for staff, review moderation, and cloud media storage on Firebase. It runs on three plans: Free, Athletes (£2.99/month) and Club Owner (£11.99/month).',
		],
		highlights: [
			'Geo-located directory of combat sports clubs across the UK',
			'Events pipeline for tournaments, check-ins and venue bookings',
			'Training round timer built into the app',
			'Role-based access and review moderation for club owners',
			'Subscription plans for athletes and club owners',
		],
		client: 'MatMaps',
		country: 'United Kingdom',
		year: '2026',
		cover: '/assets/images/projects/matmaps/cover.jpg',
		gallery: [
			'/assets/images/projects/matmaps/screens.jpg',
			'/assets/images/projects/matmaps/features.jpg',
			'/assets/images/projects/matmaps/platform.jpg',
		],
		tags: ['Android & iOS', 'Firebase', 'Web Platform'],
		links: {
			playStore: 'https://play.google.com/store/apps/details?id=com.matmaps.app',
			website: 'https://matmaps.co.uk/',
		},
	},
];

export const TYPE_LABEL: Record<Project['type'], string> = { mobile: 'Mobile App', web: 'Website' };

const LINK_LABEL = {
	appStore: { text: 'App Store', icon: 'fa-brands fa-apple' },
	playStore: { text: 'Google Play', icon: 'fa-brands fa-google-play' },
	website: { text: 'Visit Website', icon: 'fa-solid fa-arrow-up-right-from-square' },
} as const;

export function liveLinks(p: Project) {
	const links = p.links || {};
	return (Object.keys(LINK_LABEL) as (keyof typeof LINK_LABEL)[])
		.filter((k) => links[k])
		.map((k) => ({ href: links[k] as string, text: LINK_LABEL[k].text, icon: LINK_LABEL[k].icon }));
}

export function projectPath(p: Project) {
	return `/projects/${p.slug}`;
}

export function getProject(slug: string) {
	return PROJECTS.find((p) => p.slug === slug);
}
