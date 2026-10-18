'use client';

/*
 * The main menu markup, rendered in the header and again inside the mobile menu
 * (the template used to copy it there with jQuery). Marks the current page with
 * class="current" and aria-current="page".
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import { NAV } from '@/lib/site';

export default function NavMenu() {
	const pathname = usePathname() || '/';

	return (
		<>
			<div className="navbar-header">
				{/* Toggle Button */}
				<button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
					<span className="icon-bar"></span>
					{' '}
					<span className="icon-bar"></span>
					{' '}
					<span className="icon-bar"></span>
				</button>
			</div>
			{' '}
			{/* The template's CSS shows both menus through this id (header and mobile), so both copies carry it */}
			<div className="navbar-collapse scroll-nav collapse clearfix" id="navbarSupportedContent">
				<ul className="navigation clearfix">
					{NAV.map((item, i) => {
						const current = item.match ? item.match(pathname) : false;
						// On the home page "Home" scrolls back to the hero, like the other section links
						const href = item.href === '/' && pathname === '/' ? '/#home' : item.href;
						return (
							<Fragment key={item.href}>
								{i > 0 && ' '}
								<li className={current ? 'current' : undefined}>
									<Link href={href} aria-current={current ? 'page' : undefined}>{item.label}</Link>
								</li>
							</Fragment>
						);
					})}
				</ul>
			</div>
		</>
	);
}

/** "Get a Free Quote" in the header: jumps to the booking widget on the contact page itself. */
export function HeaderQuoteButton() {
	const pathname = usePathname() || '/';
	return (
		<Link href={pathname === '/contact' ? '#contact' : '/contact'} className="theme-btn btn-style-one">
			<span className="btn-wrap">
				<span className="text-one">Get a Free Quote</span>
				{' '}
				<span className="text-two">Get a Free Quote</span>
			</span>
		</Link>
	);
}
