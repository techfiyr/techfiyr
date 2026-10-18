'use client';

/*
 * Submit button for admin forms: disabled with a "working" label while its form is being sent.
 */
import { useFormStatus } from 'react-dom';

type Props = {
	children: React.ReactNode;
	pending?: string;
	className?: string;
	name?: string;
	value?: string;
	formAction?: (fd: FormData) => void;
};

export default function SubmitButton({ children, pending, className = 'admin-btn is-primary', name, value, formAction }: Props) {
	const status = useFormStatus();
	const busy = status.pending && (!name || status.data?.get(name) === value);
	return (
		<button type="submit" className={className} name={name} value={value} formAction={formAction} disabled={status.pending} aria-busy={busy || undefined}>
			{busy && <span className="admin-spinner" aria-hidden="true"></span>}
			{busy ? pending || children : children}
		</button>
	);
}
