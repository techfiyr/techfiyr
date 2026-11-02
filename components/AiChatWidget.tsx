'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { CONTACT } from '@/lib/site';

type Message = {
	id: string;
	role: 'assistant' | 'user';
	text: string;
	timestamp: string;
};

const STARTER_PROMPTS = [
	'How much does a Flutter/React Native MVP cost?',
	'What services and tech stacks do you specialize in?',
	'Can I hire TechFiyr via Upwork or Fiverr?',
	'Who is on the TechFiyr engineering team?',
];

export default function AiChatWidget() {
	const [isOpen, setIsOpen] = useState(false);
	const [input, setInput] = useState('');
	const [loading, setLoading] = useState(false);
	const [messages, setMessages] = useState<Message[]>([
		{
			id: 'welcome',
			role: 'assistant',
			text: "Hi there! 👋 I'm TechFiyr's AI Assistant powered by Gemini.\n\nAsk me anything about our mobile app development, custom web/SaaS engineering, UI/UX design, or our team and pricing.\n\nYou can also jump straight into a chat on WhatsApp or book a free discovery call below!",
			timestamp: 'Just now',
		},
	]);

	const chatBodyRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Scroll to bottom when messages update
	useEffect(() => {
		if (isOpen && chatBodyRef.current) {
			chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
		}
	}, [messages, loading, isOpen]);

	// Focus input on open
	useEffect(() => {
		if (isOpen) {
			setTimeout(() => inputRef.current?.focus(), 150);
		}
	}, [isOpen]);

	// Close on Escape
	useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape' && isOpen) {
				setIsOpen(false);
			}
		}
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [isOpen]);

	async function sendMessage(textToSend?: string) {
		const text = (textToSend ?? input).trim();
		if (!text || loading) return;

		const userMsg: Message = {
			id: 'u-' + Date.now(),
			role: 'user',
			text,
			timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
		};

		const updatedMessages = [...messages, userMsg];
		setMessages(updatedMessages);
		setInput('');
		setLoading(true);

		try {
			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message: text,
					history: updatedMessages
						.filter((m) => m.id !== 'welcome')
						.map((m) => ({ role: m.role, content: m.text })),
				}),
			});

			const data = await res.json();
			const replyText =
				data?.ok && typeof data?.reply === 'string'
					? data.reply
					: "Sorry, I ran into an issue connecting to the AI. You can chat directly with our engineering team on [WhatsApp](" +
					  CONTACT.whatsapp +
					  ') or [book a free discovery call](/contact).';

			setMessages((prev) => [
				...prev,
				{
					id: 'a-' + Date.now(),
					role: 'assistant',
					text: replyText,
					timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
				},
			]);
		} catch {
			setMessages((prev) => [
				...prev,
				{
					id: 'a-' + Date.now(),
					role: 'assistant',
					text: "I couldn't reach the server right now. Feel free to message our team directly on [WhatsApp](" +
						CONTACT.whatsapp +
						') or [schedule a discovery call](/contact).',
					timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
				},
			]);
		} finally {
			setLoading(false);
		}
	}

	function renderFormattedText(text: string) {
		// Parse markdown links [text](url) safely
		const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
		const parts: React.ReactNode[] = [];
		let lastIndex = 0;
		let match: RegExpExecArray | null;

		while ((match = linkRegex.exec(text)) !== null) {
			if (match.index > lastIndex) {
				parts.push(text.slice(lastIndex, match.index));
			}
			const linkLabel = match[1];
			const linkUrl = match[2];
			const isExternal = linkUrl.startsWith('http') || linkUrl.startsWith('mailto:') || linkUrl.startsWith('tel:');

			if (isExternal) {
				parts.push(
					<a key={match.index} href={linkUrl} target="_blank" rel="noopener" className="chat-link">
						{linkLabel} <i className="fa-solid fa-arrow-up-right-from-square fa-xs" aria-hidden="true"></i>
					</a>
				);
			} else {
				parts.push(
					<Link key={match.index} href={linkUrl} className="chat-link" onClick={() => setIsOpen(false)}>
						{linkLabel}
					</Link>
				);
			}
			lastIndex = linkRegex.lastIndex;
		}

		if (lastIndex < text.length) {
			parts.push(text.slice(lastIndex));
		}

		return (
			<div className="chat-text-content">
				{parts.length > 0 ? parts : text}
			</div>
		);
	}

	return (
		<>
			{/* Floating WhatsApp trigger button */}
			<button
				type="button"
				className={`whatsapp-float ${isOpen ? 'is-active' : ''}`}
				onClick={() => setIsOpen((prev) => !prev)}
				aria-expanded={isOpen}
				aria-label={isOpen ? 'Close TechFiyr AI chat assistant' : 'Open WhatsApp & AI chat assistant'}
			>
				{isOpen ? (
					<i className="fa-solid fa-xmark" aria-hidden="true"></i>
				) : (
					<i className="fa-brands fa-whatsapp" aria-hidden="true"></i>
				)}
			</button>

			{/* Floating AI Chat Assistant Window */}
			{isOpen && (
				<div className="ai-chat-drawer" role="dialog" aria-modal="true" aria-label="TechFiyr AI Assistant">
					{/* Header */}
					<div className="ai-chat-header">
						<div className="ai-chat-header-info">
							<div className="ai-chat-avatar">
								<i className="fa-solid fa-robot" aria-hidden="true"></i>
								<span className="online-indicator"></span>
							</div>
							<div>
								<h3 className="ai-chat-title">TechFiyr Assistant</h3>
								<p className="ai-chat-subtitle">
									<i className="fa-solid fa-bolt" aria-hidden="true"></i> Powered by Gemini AI
								</p>
							</div>
						</div>
						<button
							type="button"
							className="ai-chat-close"
							onClick={() => setIsOpen(false)}
							aria-label="Close chat"
						>
							<i className="fa-solid fa-xmark" aria-hidden="true"></i>
						</button>
					</div>

					{/* Direct Handover Action Bar */}
					<div className="ai-chat-handover-bar">
						<a
							href={`${CONTACT.whatsapp}?text=${encodeURIComponent("Hi TechFiyr, I'd like to discuss a project.")}`}
							target="_blank"
							rel="noopener"
							className="handover-btn whatsapp-btn"
						>
							<i className="fa-brands fa-whatsapp" aria-hidden="true"></i> WhatsApp
						</a>
						<Link
							href="/contact"
							className="handover-btn meeting-btn"
							onClick={() => setIsOpen(false)}
						>
							<i className="fa-regular fa-calendar-check" aria-hidden="true"></i> Book Call
						</Link>
					</div>

					{/* Message Stream */}
					<div className="ai-chat-body" ref={chatBodyRef}>
						{messages.map((m) => (
							<div key={m.id} className={`chat-message ${m.role === 'user' ? 'is-user' : 'is-assistant'}`}>
								{m.role === 'assistant' && (
									<div className="msg-avatar">
										<i className="fa-solid fa-sparkles" aria-hidden="true"></i>
									</div>
								)}
								<div className="msg-bubble">
									{renderFormattedText(m.text)}
									<span className="msg-time">{m.timestamp}</span>
								</div>
							</div>
						))}

						{loading && (
							<div className="chat-message is-assistant">
								<div className="msg-avatar">
									<i className="fa-solid fa-sparkles" aria-hidden="true"></i>
								</div>
								<div className="msg-bubble is-loading">
									<span className="dot"></span>
									<span className="dot"></span>
									<span className="dot"></span>
								</div>
							</div>
						)}

						{/* Starter Chips (shown when few messages) */}
						{messages.length <= 2 && !loading && (
							<div className="ai-chat-chips">
								<p className="chips-title">Suggested questions:</p>
								<div className="chips-list">
									{STARTER_PROMPTS.map((prompt, idx) => (
										<button
											key={idx}
											type="button"
											className="chip-btn"
											onClick={() => sendMessage(prompt)}
										>
											{prompt}
										</button>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Chat Input Bar */}
					<form
						className="ai-chat-footer"
						onSubmit={(e) => {
							e.preventDefault();
							sendMessage();
						}}
					>
						<input
							ref={inputRef}
							type="text"
							className="ai-chat-input"
							placeholder="Ask about apps, web, pricing..."
							value={input}
							onChange={(e) => setInput(e.target.value)}
							disabled={loading}
							maxLength={1000}
						/>
						<button
							type="submit"
							className="ai-chat-send"
							disabled={!input.trim() || loading}
							aria-label="Send message"
						>
							<i className="fa-solid fa-paper-plane" aria-hidden="true"></i>
						</button>
					</form>
				</div>
			)}
		</>
	);
}
