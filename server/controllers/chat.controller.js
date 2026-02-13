import { sendEmail } from "../utils/email.js";
import { ChatInstance } from "../models/chat.model.js";
import mongoose from "mongoose";

function formatRequirementsFromChat(messages) {
	const userMessages = messages
		.filter((m) => m.sender === "user")
		.map((m) => m.text)
		.join("\n\n");

	return `Collected Requirements from Chat Conversation:\n\n${userMessages}`;
}

function extractTitleFromText(text) {
	if (!text) return 'New chat';
	const lower = text.toLowerCase();
	const keywords = [
		['web', 'Web development'],
		['website', 'Web development'],
		['mobile', 'Mobile app'],
		['e-commerce', 'E-commerce'],
		['ecommerce', 'E-commerce'],
		['shop', 'E-commerce'],
		['api', 'API integration'],
		['chatbot', 'Chatbot'],
		['design', 'Design'],
		['marketing', 'Marketing'],
	];

	for (const [key, name] of keywords) {
		if (lower.includes(key)) return name;
	}

	// fallback: first sentence or first 6 words
	const firstSentence = (text.split(/[\.\?\!]/)[0] || text).trim();
	const words = firstSentence.split(/\s+/).slice(0, 6).join(' ');
	let title = words || firstSentence;
	if (title.length > 60) title = title.slice(0, 57) + '...';
	return title;
}

export const chatHandler = async (req, res) => {
	try {
		const { messages, instanceId } = req.body;

		// attach user from middleware if available
		const user = req.user;

		if (!messages || !Array.isArray(messages)) {
			return res.status(400).json({ error: "Invalid request: messages array required" });
		}

		const apiKey = process.env.OPENROUTER_API_KEY;
		if (!apiKey) {
			console.error("OPENROUTER_API_KEY not configured");
			return res.status(500).json({
				error: "OpenRouter API key not configured. Please set OPENROUTER_API_KEY in your environment.",
			});
		}

		const systemPrompt = `You are a helpful, friendly assistant. At the start of a conversation you should:\n1) Greet the user and ask which service they'd like (for example: "Web development").\n2) If the user selects Web development, proceed to collect complete project requirements by asking clear, follow-up questions one at a time. Questions should include (but are not limited to): - Project name and purpose - Target audience and primary users - Key features and pages (e.g., authentication, dashboard, blog, e-commerce, admin) - Preferred technologies or tech stack (frontend, backend, database) - Integrations required (APIs, payment gateways, third-party services) - Authentication/authorization requirements and user roles - Design expectations (brand, responsive, accessibility) - Content and assets availability (text, images, logos) - Hosting, deployment, and runtime constraints - Timeline and budget constraints\n3) Confirm each requirement before moving on. After you have collected the complete set of requirements, explicitly ask: "Would you like me to proceed with AI-assisted development of this project based on the requirements you've provided?" Do NOT start implementing or producing code until the user confirms.\n\nIMPORTANT: When the user confirms they want to proceed (e.g., by saying "yes", "proceed", "go ahead", "let's do it", etc.): - Respond EXACTLY with: "Great! I'll start working on your project now." - Then on the next line, include this special marker: [CONFIRMED_PROCEED]`;
// additional instruction for navigating to Stripe
systemPrompt += "\n\nIf you need to send the user to a Stripe payment page after the conversation, append `[GO_STRIPE]` (for $50) or `[GO_STRIPE <cents>]` in your reply. This will automatically redirect the client to `/stripe?amount=<cents>` once the message is delivered.";

		const formattedMessages = [
			{ role: "system", content: systemPrompt },
			...messages.map((msg) => ({ role: msg.sender === "user" ? "user" : "assistant", content: msg.text })),
		];

		const requestBody = {
			model: "gpt-4o-mini",
			messages: formattedMessages,
			max_tokens: 800,
			temperature: 0.7,
		};

		// Call OpenRouter with basic retry/backoff for rate limits (429)
		let response;
		const maxAttempts = 4;
		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${apiKey}`,
					},
					body: JSON.stringify(requestBody),
				});

				if (response.ok) break; // success

				// If rate limited, retry with exponential backoff + jitter
				if (response.status === 429 && attempt < maxAttempts) {
					const jitter = Math.floor(Math.random() * 300);
					const delayMs = Math.pow(2, attempt) * 1000 + jitter; // 2s,4s,8s...
					console.warn(`OpenRouter 429 received, retrying in ${delayMs}ms (attempt ${attempt})`);
					await new Promise((r) => setTimeout(r, delayMs));
					continue;
				}

				// For other non-ok responses, break to handle below
				break;
			} catch (fetchErr) {
				console.error('Network error calling OpenRouter:', fetchErr);
				if (attempt < maxAttempts) {
					const jitter = Math.floor(Math.random() * 300);
					const delayMs = Math.pow(2, attempt) * 500 + jitter; // shorter backoff for network errors
					await new Promise((r) => setTimeout(r, delayMs));
					continue;
				}
				// exhausted retries
				return res.status(502).json({ error: 'Failed to contact AI service (network error).' });
			}
		}

		if (!response) {
			return res.status(502).json({ error: 'No response from AI provider.' });
		}

		if (!response.ok) {
			const text = await response.text();
			console.error("OpenRouter error response:", text);
			let parsed;
			try {
				parsed = JSON.parse(text);
			} catch (e) {
				return res.status(response.status).json({ error: `OpenRouter API error: ${text}` });
			}
			const errorMessage = parsed.error?.message || parsed.message || "OpenRouter API error";
			let userFriendly = errorMessage;
			if (response.status === 401) userFriendly = "Authentication failed: invalid API key.";
			else if (response.status === 429) userFriendly = "Rate limited: too many requests. Please try again later.";
			else if ([500,502,503].includes(response.status)) userFriendly = "OpenRouter service temporarily unavailable.";
			return res.status(response.status).json({ error: userFriendly });
		}

		const data = await response.json();
		let aiMessage = data.choices?.[0]?.message?.content || data.choices?.[0]?.message || data.choices?.[0]?.text;
		if (!aiMessage) {
			console.error("Empty OpenRouter response:", data);
			return res.status(500).json({ error: "No response from OpenRouter" });
		}

		if (typeof aiMessage === 'object') aiMessage = JSON.stringify(aiMessage);

		// navigation marker from assistant, optionally include cents amount
		let shouldNavigate = false;
		let navigateUrl = null;
		const navMatch = aiMessage.match(/\[GO_STRIPE(?:\s+(\d+))?\]/i);
		if (navMatch) {
			shouldNavigate = true;
			const cents = navMatch[1] ? parseInt(navMatch[1], 10) : 5000; // default $50
			navigateUrl = `/stripe?amount=${cents}`;
			aiMessage = aiMessage.replace(navMatch[0], "").trim();
		}

		const hasConfirmationMarker = aiMessage.includes("[CONFIRMED_PROCEED]");

		// Persist conversation: find or create chat instance for this user
		let chatInstance = null;
		try {
			if (instanceId && mongoose.isValidObjectId(instanceId)) {
				chatInstance = await ChatInstance.findOne({ _id: instanceId, user: user?._id });
			}
		} catch (e) {
			console.error('Chat instance lookup error:', e);
		}

		// If no instance found, create a new one for authenticated user or anonymous session
		if (!chatInstance) {
			const owner = user?._id || null;
			chatInstance = await ChatInstance.create({ user: owner, title: "New chat", messages: [] });
		}

		// Save user's last message (assumes last user message in messages array is the one to persist)
		const lastUser = [...messages].reverse().find((m) => m.sender === 'user');
		if (lastUser) {
			chatInstance.messages.push({ sender: 'user', text: lastUser.text });
			// If instance has default title, set it from the first user message/service
			const firstUser = messages.find((m) => m.sender === 'user');
			if (firstUser && (!chatInstance.title || chatInstance.title === 'New chat' || chatInstance.title === '')) {
				try {
					chatInstance.title = extractTitleFromText(firstUser.text);
				} catch (e) {
					// ignore title extraction errors
				}
			}
		}

		if (hasConfirmationMarker) {
			aiMessage = aiMessage.replace("[CONFIRMED_PROCEED]", "").trim();

			const projectNameMatch = messages.find((m) => /project|name/i.test(m.text))?.text || "Web Development Project";
			const requirements = formatRequirementsFromChat(messages);

			// send requirements email to team address (non-blocking)
			const to = process.env.EMAIL_FROM || process.env.SUPPORT_EMAIL || 'hello@demomailtrap.co';
			sendEmail({ to, subject: `Requirements: ${projectNameMatch}`, text: requirements }).catch((err) => {
				console.error('Failed to send requirements email:', err);
			});

			// Save assistant reply
			chatInstance.messages.push({ sender: 'bot', text: aiMessage });
			await chatInstance.save();

			return res.json({ message: aiMessage, shouldNavigate: true, navigateUrl: 'https://www.bembexlab.com/', instanceId: chatInstance._id });
		}
		// if a separate navigation marker was detected (e.g. GO_STRIPE)
		if (shouldNavigate && !hasConfirmationMarker) {
			// save the final bot response and tell client to navigate
			chatInstance.messages.push({ sender: 'bot', text: aiMessage });
			await chatInstance.save();
			return res.json({ message: aiMessage, shouldNavigate: true, navigateUrl, instanceId: chatInstance._id });
		}
		// Save assistant reply and return
		chatInstance.messages.push({ sender: 'bot', text: aiMessage });
		await chatInstance.save();

		return res.json({ message: aiMessage, instanceId: chatInstance._id });
	} catch (err) {
		console.error('Chat controller error:', err);
		const msg = err instanceof Error ? err.message : 'Internal server error';
		return res.status(500).json({ error: msg });
	}
};

export const createInstance = async (req, res) => {
	try {
		const user = req.user;
		const { title } = req.body;
		const instance = await ChatInstance.create({ user: user?._id, title: title || 'New chat', messages: [] });
		return res.json({ instanceId: instance._id, title: instance.title });
	} catch (err) {
		console.error('createInstance error:', err);
		return res.status(500).json({ error: 'Failed to create chat instance' });
	}
};

export const listInstances = async (req, res) => {
	try {
		const user = req.user;
		const instances = await ChatInstance.find({ user: user?._id }).select('title createdAt updatedAt messages').sort({ updatedAt: -1 });
		const result = instances.map((i) => ({ id: i._id, title: i.title || 'Untitled', createdAt: i.createdAt, updatedAt: i.updatedAt, messageCount: i.messages.length }));
		return res.json({ instances: result });
	} catch (err) {
		console.error('listInstances error:', err);
		return res.status(500).json({ error: 'Failed to list chat instances' });
	}
};

export const getInstance = async (req, res) => {
	try {
		const user = req.user;
		const { id } = req.params;
		if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid instance id' });
		const instance = await ChatInstance.findOne({ _id: id, user: user?._id });
		if (!instance) return res.status(404).json({ error: 'Chat instance not found' });
		return res.json({ instance });
	} catch (err) {
		console.error('getInstance error:', err);
		return res.status(500).json({ error: 'Failed to get chat instance' });
	}
};

export const deleteInstance = async (req, res) => {
	try {
		const user = req.user;
		const { id } = req.params;
		if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid instance id' });
		const inst = await ChatInstance.findOne({ _id: id, user: user?._id });
		if (!inst) return res.status(404).json({ error: 'Chat instance not found' });
		await ChatInstance.deleteOne({ _id: id });
		return res.json({ success: true, message: 'Chat instance deleted' });
	} catch (err) {
		console.error('deleteInstance error:', err);
		return res.status(500).json({ error: 'Failed to delete chat instance' });
	}
};

