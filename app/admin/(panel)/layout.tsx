/*
 * Signed-in admin pages: sidebar and content area. The session is checked here and again in every
 * server action (lib/server/auth.ts), so a page is never rendered for someone who is not the admin.
 */
import AdminNav from '@/components/admin/AdminNav';
import { requireAdmin } from '@/lib/server/auth';
import { storeMode } from '@/lib/server/store';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
	const email = await requireAdmin();
	const mode = storeMode();

	return (
		<div className="admin-shell">
			<a className="admin-skip" href="#main">Skip to content</a>
			<AdminNav email={email} />
			<main className="admin-main" id="main">
				{mode === 'local' && (
					<p className="admin-alert is-note admin-devnote">
						<i className="fa-solid fa-circle-info" aria-hidden="true"></i> Local mode: content is saved in the <code>.data</code> folder on this computer, not in Firebase.
					</p>
				)}
				{children}
			</main>
		</div>
	);
}
