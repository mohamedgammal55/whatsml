/**
 * Durable Baileys tuning for QuickZap.
 *
 * The WhatsApp engine (Baileys) ships defaults that hurt this use-case:
 *   - a 20s "AwaitingInitialSync" wait before the socket is usable  → slow first send
 *   - markOnlineOnConnect: true → the number is announced "online" on every
 *     connect, a strong spam/ban signal for automated senders
 *   - a 30s keep-alive → silent drops linger longer before reconnect kicks in
 *
 * This script re-applies safe tweaks after every `npm install` (wired into
 * postinstall), so they survive dependency reinstalls and ship with deploys.
 * It is idempotent and never throws the install — it only logs.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const base = path.join(__dirname, "..", "node_modules", "baileys", "lib");

const patches = [
	{
		file: path.join(base, "Defaults", "index.js"),
		edits: [
			// Don't broadcast "online" on connect (anti-ban).
			{ from: "markOnlineOnConnect: true,", to: "markOnlineOnConnect: false," },
			// Detect dropped connections faster so reconnect fires sooner.
			{ from: "keepAliveIntervalMs: 30000,", to: "keepAliveIntervalMs: 20000," },
		],
	},
	{
		file: path.join(base, "Socket", "chats.js"),
		edits: [
			// Cap the AwaitingInitialSync wait: 20s -> 5s (much faster first send).
			{ from: "}, 20000);", to: "}, 5000);" },
		],
	},
];

let applied = 0;
let skipped = 0;
for (const p of patches) {
	if (!fs.existsSync(p.file)) {
		console.warn("[patch-baileys] file not found, skipping:", p.file);
		continue;
	}
	let src = fs.readFileSync(p.file, "utf8");
	let changed = false;
	for (const e of p.edits) {
		if (src.includes(e.to) && !src.includes(e.from)) {
			skipped++;
			continue; // already patched
		}
		if (src.includes(e.from)) {
			src = src.split(e.from).join(e.to);
			changed = true;
			applied++;
		} else {
			console.warn("[patch-baileys] pattern not found (baileys version changed?):", e.from);
		}
	}
	if (changed) fs.writeFileSync(p.file, src);
}
console.log(`[patch-baileys] done. applied=${applied} already-patched=${skipped}`);
