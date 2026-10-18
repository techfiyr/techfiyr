'use client';

/*
 * Admin sidebar: sections, the signed-in address and sign out. On small screens it folds into a
 * top bar with a menu button. The current section is marked with aria-current.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { logout } from '@/app/admin/actions';

const ITEMS = [
	{ href: '/admin', label: 'Dashboard', icon: 'fa-gauge-high', exact: true },
	{ href: '/admin/blog', label: 'Blog', icon: 'fa-pen-nib' },
	{ href: '/admin/products', label: 'Products', icon: 'fa-box-open' },
	{ href: '/admin/news', label: 'AI news', icon: 'fa-newspaper' },
];

export default function AdminNav({ email }: { email: string }) {
	const pathname = usePathname() || '/admin';
	const [open, setOpen] = useState(false);

	// close the small-screen menu after moving to another section
	useEffect(() => setOpen(false), [pathname]);

	return (
		<header className={open ? 'admin-side is-open' : 'admin-side'}>
			<div className="admin-side_top">
				<Link className="admin-side_logo" href="/admin">
					<img src="/assets/images/brand/logo.svg" alt="TechFiyr admin" width="166" height="54" />
				</Link>
				<button type="button" className="admin-side_toggle" aria-expanded={open} aria-controls="admin-menu" onClick={() => setOpen(!open)}>
					<i className={open ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'} aria-hidden="true"></i>
					<span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
				</button>
			</div>
			<div className="admin-side_menu" id="admin-menu">
				<nav aria-label="Admin">
					<ul className="admin-side_list">
						{ITEMS.map((item) => {
							const current = item.exact ? pathname === item.href : pathname.startsWith(item.href);
							return (
								<li key={item.href}>
									<Link className="admin-side_link" href={item.href} aria-current={current ? 'page' : undefined}>
										<i className={`fa-solid ${item.icon}`} aria-hidden="true"></i>
										{item.label}
									</Link>
								</li>
							);
						})}
					</ul>
				</nav>
				<div className="admin-side_foot">
					<a className="admin-side_link" href="/" target="_blank" rel="noopener">
						<i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
						View website
						<span className="sr-only">{' '}(opens in a new tab)</span>
					</a>
					<p className="admin-side_user" title={email}>{email}</p>
					<form action={logout}>
						<button type="submit" className="admin-side_link">
							<i className="fa-solid fa-right-from-bracket" aria-hidden="true"></i>
							Sign out
						</button>
					</form>
				</div>
			</div>
		</header>
	);
}
