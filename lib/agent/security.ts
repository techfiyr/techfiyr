/*
 * Security, anti-fraud, anti-script/link-execution, privacy-protection, and
 * workflow intent classifier for TechFiyr Sales Agent, MCP, A2A, REST, and Chatbot endpoints.
 *
 * Enforces:
 *  - Zero execution or fetching of third-party URLs / scripts submitted by callers.
 *  - Deterministic detection of XSS, SQLi, shell RCE, SSRF, prompt injection, scam/fraud, and spam.
 *  - Stage & purpose gating: confirm software/partnership/consulting purpose first, ask scoping
 *    questions before quoting blindly, protect personal info on first turn, and hand off real
 *    human/founder/developer meeting requests cleanly to https://techfiyr.com/contact#contact.
 */

export type WorkflowStage =
	| 'security_blocked'
	| 'qualifying_purpose'
	| 'scoping_questions'
	| 'quoting_pricing'
	| 'negotiating'
	| 'meeting_handover'
	| 'deal_closed'
	| 'closed_off_topic';

export type SecurityThreatCategory = 'clean' | 'hacking_injection' | 'script_or_3p_link' | 'fraud_scam' | 'spam';

export type SecurityInspectionResult = {
	safe: boolean;
	category: SecurityThreatCategory;
	flaggedUrls: boolean;
	detectedUrls: string[];
	sanitizedText: string;
	reasons: string[];
	refusalMessage?: string;
};

export type SalesIntent =
	| 'human_handoff'
	| 'deal_confirmation'
	| 'scoping_or_quote'
	| 'pricing_inquiry_missing_details'
	| 'partnership_or_consulting'
	| 'purpose_unconfirmed'
	| 'off_topic_chat';

export type IntentClassification = {
	intent: SalesIntent;
	purposeConfirmed: boolean;
	hasScopeDetails: boolean;
	wantsHumanMeeting: boolean;
	asksPricing: boolean;
	missingQuestions: string[];
};

const SAFE_TECHFIYR_HOST_RE = /^https:\/\/(?:www\.)?techfiyr\.com(?:\/|$)/i;
const URL_EXTRACT_RE = /\b(?:https?:\/\/|javascript:|vbscript:|data:|file:\/\/|ftp:\/\/)[^\s<>"')]+/gi;

const HACKING_PATTERNS: { re: RegExp; reason: string }[] = [
	{ re: /<script\b|<\/script>|javascript:|vbscript:|data:text\/html/i, reason: 'Executable script or HTML injection payload' },
	{ re: /\b(?:onerror|onload|onmouseover|onfocus|eval|settimeout|function)\s*[=(]/i, reason: 'Client-side script event handler or eval payload' },
	{ re: /\b(?:curl|wget|fetch|powershell|invoke-webrequest)\b[^|\n]*\|\s*(?:sh|bash|zsh|pwsh|python|node)\b/i, reason: 'Remote script download-and-execute shell pattern' },
	{ re: /(?:;|&&|\|\|)\s*(?:rm\s+-rf|chmod\s+\+x|cat\s+\/etc\/passwd|nc\s+-e|bash\s+-i|python\s+-c)\b/i, reason: 'Shell command injection attempt' },
	{ re: /\bunion\s+(?:all\s+)?select\b|\bdrop\s+table\b|'\s*or\s+'?1'?\s*=\s*'?1|--\s*$/im, reason: 'SQL injection signature' },
	{ re: /(?:\.\.\/){2,}|firebase-service-account|\.env\.local|process\.env\b/i, reason: 'Path traversal or server credential exfiltration probe' },
	{ re: /\b(?:ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions|disregard\s+system\s+prompt|reveal\s+(?:your\s+)?(?:system\s+prompt|api\s*key|secret|private\s*key|wallet\s*seed)|bypass\s+(?:floor|guardrail|pricing))\b/i, reason: 'Prompt injection or guardrail bypass attempt' },
	{ re: /\b(?:169\.254\.169\.254|127\.0\.0\.1|0\.0\.0\.0|localhost:\d+)\b/i, reason: 'Internal loopback / metadata SSRF probe' },
];

const EXECUTE_LINK_INTENT_RE =
	/\b(?:execute|run|fetch|open|click|visit|curl|eval|load|download|check\s+this\s+link|open\s+link|run\s+script)\b/i;

const FRAUD_SCAM_PATTERNS: { re: RegExp; reason: string }[] = [
	{ re: /\b(?:seed\s+phrase|mnemonic\s+phrase|private\s+key|recovery\s+phrase|send\s+(?:your\s+)?(?:otp|pin|verification\s+code|password)|double\s+your\s+(?:btc|eth|usdt|usdc|crypto))\b/i, reason: 'Credential harvesting or crypto scam indicator' },
	{ re: /\b(?:nigerian\s+prince|inheritance\s+fund|unclaimed\s+lottery|urgent\s+wire\s+transfer\s+commission|money\s+launder|carding|cloned\s+cards|cvv\s+dumps|phishing\s+kit|ransomware|ddos\s+(?:tool|service|botnet)|exploit\s+kit|hack\s+(?:account|instagram|facebook|whatsapp|bank))\b/i, reason: 'Fraudulent, malicious, or illegal engagement request' },
];

const SPAM_PATTERNS: { re: RegExp; reason: string }[] = [
	{ re: /\b(?:buy\s+backlinks|guest\s+post\s+exchange|casino\s+backlink|viagra|cialis|crypto\s+pump\s+signal|telegram\s+airdrop|guaranteed\s+#1\s+seo\s+spam|bulk\s+email\s+list\s+sale)\b/i, reason: 'Unsolicited promotional or SEO spam' },
];

/**
 * Removes control bytes and HTML tags so untrusted text can never execute as script or markup.
 */
export function sanitizeAgentText(raw: string, maxLen = 6000): string {
	return String(raw || '')
		.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
		.replace(/<[^>]{1,200}>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, maxLen);
}

/**
 * Rejects localhost, RFC1918 private IPs, metadata IPs, non-HTTPS protocols, and embedded credentials.
 */
export function validateSafeCallbackUrl(rawUrl?: string): { ok: true; url?: string } | { ok: false; reason: string } {
	if (!rawUrl || !rawUrl.trim()) return { ok: true };
	const trimmed = rawUrl.trim().slice(0, 500);
	let parsed: URL;
	try {
		parsed = new URL(trimmed);
	} catch {
		return { ok: false, reason: 'callbackUrl must be a valid public HTTPS URL.' };
	}
	if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
		return { ok: false, reason: 'callbackUrl must use HTTPS without embedded credentials.' };
	}
	const host = parsed.hostname.toLowerCase();
	if (
		host === 'localhost' ||
		host.endsWith('.localhost') ||
		host.endsWith('.local') ||
		host.endsWith('.internal') ||
		host === '0.0.0.0' ||
		host === '::1' ||
		host === '[::1]' ||
		/^127\./.test(host) ||
		/^10\./.test(host) ||
		/^192\.168\./.test(host) ||
		/^169\.254\./.test(host) ||
		/^172\.(?:1[6-9]|2\d|3[01])\./.test(host) ||
		/^(?:fc|fd|fe80:)/i.test(host.replace(/^\[|\]$/g, ''))
	) {
		return { ok: false, reason: 'callbackUrl cannot point to localhost, private networks, or cloud metadata addresses.' };
	}
	return { ok: true, url: parsed.toString() };
}

/**
 * Inspects caller prose / descriptions for script/link execution attempts, hacking payloads,
 * fraud/scam patterns, or spam BEFORE calling LLMs or creating quotes/orders.
 */
export function inspectAgentInteraction(rawText: string): SecurityInspectionResult {
	const raw = String(rawText || '');
	const sanitizedText = sanitizeAgentText(raw);
	const urls = (raw.match(URL_EXTRACT_RE) || []).filter((u) => !SAFE_TECHFIYR_HOST_RE.test(u));

	const dangerousUrl = urls.find((u) => /^(?:javascript:|vbscript:|data:|file:\/\/|http:\/\/(?:127\.|10\.|192\.168\.|169\.254\.|localhost))/i.test(u));
	if (dangerousUrl) {
		return {
			safe: false,
			category: 'hacking_injection',
			flaggedUrls: true,
			detectedUrls: urls.slice(0, 5),
			sanitizedText,
			reasons: ['Unsafe script or internal URL scheme detected.'],
			refusalMessage:
				'Request rejected: TechFiyr never executes scripts or unverified links. Provide software development requirements in plain text or structured JSON only.',
		};
	}

	for (const rule of HACKING_PATTERNS) {
		if (rule.re.test(raw)) {
			return {
				safe: false,
				category: 'hacking_injection',
				flaggedUrls: urls.length > 0,
				detectedUrls: urls.slice(0, 5),
				sanitizedText,
				reasons: [rule.reason],
				refusalMessage:
					'Security guardrail triggered: suspicious script, injection, or unauthorized server probe blocked. TechFiyr only handles verified custom software engineering inquiries.',
			};
		}
	}

	for (const rule of FRAUD_SCAM_PATTERNS) {
		if (rule.re.test(raw)) {
			return {
				safe: false,
				category: 'fraud_scam',
				flaggedUrls: urls.length > 0,
				detectedUrls: urls.slice(0, 5),
				sanitizedText,
				reasons: [rule.reason],
				refusalMessage:
					'Request declined: flagged as potential fraud, malicious software, or credential solicitation. TechFiyr does not engage in non-legitimate requests.',
			};
		}
	}

	for (const rule of SPAM_PATTERNS) {
		if (rule.re.test(raw)) {
			return {
				safe: false,
				category: 'spam',
				flaggedUrls: urls.length > 0,
				detectedUrls: urls.slice(0, 5),
				sanitizedText,
				reasons: [rule.reason],
				refusalMessage:
					'Inquiry closed: promotional link spam is not accepted on TechFiyr sales channels.',
			};
		}
	}

	if (urls.length > 0 && (EXECUTE_LINK_INTENT_RE.test(raw) || raw.replace(URL_EXTRACT_RE, '').trim().length < 18)) {
		return {
			safe: false,
			category: 'script_or_3p_link',
			flaggedUrls: true,
			detectedUrls: urls.slice(0, 5),
			sanitizedText,
			reasons: ['Third-party link execution or link-only solicitation refused.'],
			refusalMessage:
				'TechFiyr Sales Agent does not open, fetch, or execute third-party links or scripts. Describe your software project, timeline, and stack directly in plain text or book a human review at https://techfiyr.com/contact#contact.',
		};
	}

	return {
		safe: true,
		category: 'clean',
		flaggedUrls: urls.length > 0,
		detectedUrls: urls.slice(0, 5),
		sanitizedText,
		reasons: [],
	};
}

const SOFTWARE_OR_BUSINESS_RE =
	/\b(?:app|mobile|web|website|saas|software|platform|portal|dashboard|system|mvp|prototype|backend|frontend|api|erp|hr|hrm|hrms|payroll|crm|e-?commerce|try-?on|virtual\s+fitting|ai|llm|rag|agent|mcp|a2a|java|spring|python|fastapi|django|php|laravel|flutter|react\s*native|react|next\.?js|capacitor|ionic|android|ios|swift|kotlin|node\.?js|postgres|supabase|docker|partner|partnership|technical\s+partner|cto|consult(?:ant|ing)|hire|developer|dedicated|build|develop|project|scope|estimate|quote|price|pricing|cost)\b/i;

const MEETING_WITH_HUMAN_RE =
	/\b(?:human|founder|founders|ceo|cto|team\s+lead|developer|engineer|real\s+person|speak\s+(?:with|to)\s+(?:someone|a\s+person|founder|team)|talk\s+to\s+(?:a\s+)?(?:human|founder|developer)|book\s+(?:a\s+)?(?:call|meeting)|schedule\s+(?:a\s+)?(?:call|meeting|consultation)|discovery\s+call|zoom|google\s+meet|calendar)\b/i;

const PARTNERSHIP_CONSULTING_RE =
	/\b(?:partner|partnership|white-?label|agency\s+partner|technical\s+partner|startup\s+partner|cto|consultant|consulting|advisory|dedicated\s+(?:team|developer|developers))\b/i;

const PRICING_ASK_RE = /\b(?:price|pricing|cost|how\s+much|quote|estimate|budget|fee|rate|rates|charge)\b/i;

const SCOPE_DETAIL_RE =
	/\b(?:crud|screens?|modules?|entities|integrations?|auth|login|dashboard|payment||crypto|usdc|usdt|erp|payroll|attendance|inventory|hr|hrm|ai\s*try-?on|virtual\s+try-?on|rag|vector|flutter|react\s*native|capacitor|android|ios|laravel|spring|python|next\.?js|ecommerce|booking|chat|marketplace|admin\s+panel)\b/i;

const DEAL_CONFIRM_RE =
	/\b(?:accept|confirm|approve|proceed|close|deal|lock|agreed|send\s+invoice|send\s+wallet|ready\s+to\s+pay)\b/i;

/**
 * Classifies caller workflow stage so Sales Agent confirms purpose first,
 * prevents aimless multi-turn chatting, collects missing scope questions before
 * locking quotes, and hands human meeting requests cleanly to /contact#contact.
 */
export function classifySalesIntent(params: {
	text: string;
	priorPurposeConfirmed?: boolean;
	structuredArgsProvided?: boolean;
	acceptOffer?: boolean;
	hasBudgetOrTimeline?: boolean;
}): IntentClassification {
	const clean = sanitizeAgentText(params.text, 4000);
	const wantsHumanMeeting = MEETING_WITH_HUMAN_RE.test(clean);
	const asksPricing = PRICING_ASK_RE.test(clean);
	const hasDomainKeyword = SOFTWARE_OR_BUSINESS_RE.test(clean);
	const purposeConfirmed = Boolean(params.priorPurposeConfirmed || hasDomainKeyword || params.structuredArgsProvided || wantsHumanMeeting);
	const isPartnershipOrConsulting = PARTNERSHIP_CONSULTING_RE.test(clean);

	const detailMatches = clean.match(new RegExp(SCOPE_DETAIL_RE.source, 'gi')) || [];
	const hasScopeDetails = Boolean(
		params.structuredArgsProvided ||
		detailMatches.length >= 2 ||
		(hasDomainKeyword && clean.length >= 70 && (detailMatches.length >= 1 || /\b(for|with|need|build|want)\b/i.test(clean))),
	);

	const missingQuestions: string[] = [];
	const hasLocationOrCompany = /\b(?:based\s+in|location|city|country|company|client|firm|agency|enterprise|startup|from\s+[a-z]+)\b/i.test(clean);
	if (!hasLocationOrCompany) {
		missingQuestions.push('Agent ownership/operator name, company or client name, and location (city & country)');
	}
	if (!purposeConfirmed) {
		missingQuestions.push('Purpose: custom software build, ERP/HR/AI Try-On system, startup technical partner, or development partnership?');
	}
	if (!hasScopeDetails) {
		missingQuestions.push('Platform & preferred stack (Web, Mobile [Android/iOS/Flutter/React Native/Capacitor], Java Spring, Python, PHP/Laravel, Next.js)');
		missingQuestions.push('Core features, user roles, or approximate modules/screens/integrations');
		missingQuestions.push('Target timeline and budget range (USD)');
	}

	let intent: SalesIntent;
	if (wantsHumanMeeting && !params.acceptOffer) {
		intent = 'human_handoff';
	} else if (!purposeConfirmed) {
		intent = clean.length > 0 ? 'purpose_unconfirmed' : 'off_topic_chat';
	} else if (params.acceptOffer || (DEAL_CONFIRM_RE.test(clean) && hasScopeDetails)) {
		intent = 'deal_confirmation';
	} else if (asksPricing && !hasScopeDetails) {
		intent = 'pricing_inquiry_missing_details';
	} else if (isPartnershipOrConsulting && !hasScopeDetails && !params.hasBudgetOrTimeline) {
		intent = 'partnership_or_consulting';
	} else if (hasScopeDetails || params.hasBudgetOrTimeline) {
		intent = 'scoping_or_quote';
	} else if (hasDomainKeyword) {
		intent = 'pricing_inquiry_missing_details';
	} else {
		intent = 'off_topic_chat';
	}

	return {
		intent,
		purposeConfirmed,
		hasScopeDetails,
		wantsHumanMeeting,
		asksPricing,
		missingQuestions,
	};
}

