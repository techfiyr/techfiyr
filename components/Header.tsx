/*
 * Main header (header-top, header-lower, mobile menu), shared by every page through app/(site)/layout.tsx.
 * Markup is the original template's; behaviour (sticky header, mobile menu) lives in public/assets/js/script.js.
 */
import Link from 'next/link';
import NavMenu, { HeaderQuoteButton } from './NavMenu';
import { CONTACT } from '@/lib/site';

export default function Header() {
	return (
		<header className="main-header header-style-one">
			{/* Header Top */}
			<div className="header-top">
				<div className="auto-container">
					<div className="inner-container">
						<div className="d-flex justify-content-between align-items-center flex-wrap">
							<div className="left-box d-flex align-items-center flex-wrap">
								<div className="info-list_outer">
									{/* Info List */}
									<ul className="header-top_list d-flex flex-wrap align-items-center">
										<li>
											<span className="icon fa-classic fa-solid fa-envelope fa-fw"></span>
											<a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
										</li>
										{' '}
										<li>
											<span className="icon fa-brands fa-whatsapp fa-fw" aria-hidden="true"></span>
											<a href={CONTACT.whatsapp} target="_blank" rel="noopener">
												{CONTACT.phoneDisplay}
												<span className="sr-only">{' '}(WhatsApp, opens in a new tab)</span>
											</a>
										</li>
									</ul>
								</div>
							</div>
							{' '}
							<div className="right-box d-flex align-items-center flex-wrap">
								<a href={CONTACT.fiverr} target="_blank" rel="noopener" className="fiverr-badge-tag d-none d-md-inline-flex">
									<i className="fa-solid fa-star"></i>
									{' '}5.0 Rated on Fiverr
								</a>
								{/* Social Box */}
								{' '}
								<div className="header-top_socials ms-3">
									<div className="social-inner">
										<a href={CONTACT.github} target="_blank" rel="noopener" aria-label="GitHub">
											<i className="fa-brands fa-github"></i>
										</a>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			{/* Header Lower */}
			{' '}
			<div className="header-lower">
				<div className="auto-container">
					<div className="inner-container">
						<div className="d-flex justify-content-between align-items-center flex-wrap">
							<div className="logo-box">
								<div className="logo">
									<Link href="/">
										<img src="/assets/images/brand/logo.svg" alt="TechFiyr Logo" title="TechFiyr" />
									</Link>
								</div>
							</div>
							{' '}
							<div className="nav-outer d-flex flex-wrap">
								{/* Main Menu */}
								<nav className="main-menu navbar-expand-md">
									<NavMenu />
								</nav>
							</div>
							{/* Main Menu End */}
							{' '}
							<div className="outer-box d-flex align-items-center flex-wrap">
								{/* Button Box */}
								<div className="main-header_button">
									<HeaderQuoteButton />
								</div>
								{/* Mobile Navigation Toggler */}
								{' '}
								<div className="mobile-nav-toggler">
									<span className="icon fa-classic fa-solid fa-bars fa-fw"></span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			{/* End Header Lower */}
			{/* Mobile Menu */}
			{' '}
			<div className="mobile-menu">
				<div className="menu-backdrop"></div>
				{' '}
				<div className="close-btn">
					<span className="icon fa-xmark"></span>
				</div>
				{' '}
				<nav className="menu-box">
					<div className="nav-logo">
						<Link href="/">
							<img src="/assets/images/brand/logo-mobile.svg" alt="TechFiyr Logo" title="TechFiyr" />
						</Link>
					</div>
					{' '}
					{/* Same menu as in the header */}
					<div className="menu-outer">
						<NavMenu />
					</div>
				</nav>
			</div>
			{/* End Mobile Menu */}
		</header>
	);
}
