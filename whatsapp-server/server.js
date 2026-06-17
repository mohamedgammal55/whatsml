/**
 * QuickZap WhatsApp server — resilient bootstrap.
 *
 * Wraps the compiled app (dist/main.js) with process-level safety so a single
 * unhandled error in one WhatsApp session can never take down the whole service.
 * Run this (npm start -> node server.js), ideally under PM2 (see ecosystem.config.js).
 */
"use strict";

// --- High-load tuning (must be set before libuv first uses the pool) ---
// Baileys does heavy crypto + per-session file I/O; the default 4-thread libuv
// pool becomes a bottleneck under concurrent sessions/messages. Lift it.
if (!process.env.UV_THREADPOOL_SIZE) {
	process.env.UV_THREADPOOL_SIZE = "32";
}

const events = require("events");
// Baileys + socket.io attach many listeners across sessions; lift the cap so we
// don't get false "possible memory leak" warnings or dropped listeners under load.
events.EventEmitter.defaultMaxListeners = 100;

const ts = () => new Date().toISOString();
const log = (level, msg, err) => {
	const base = `[${ts()}] [guard] ${level} ${msg}`;
	if (err && err.stack) console.error(base + "\n" + err.stack);
	else if (err) console.error(base, err);
	else console.error(base);
};

// Errors that mean the process genuinely cannot continue -> exit so the
// supervisor (PM2/systemd) restarts a clean instance.
const FATAL_CODES = new Set(["EADDRINUSE", "EACCES"]);

process.on("unhandledRejection", (reason) => {
	// Almost always a transient network / Baileys decode issue for one session.
	// Log and keep serving every other session.
	log(
		"unhandledRejection",
		"kept alive",
		reason instanceof Error ? reason : new Error(String(reason)),
	);
});

process.on("uncaughtException", (err) => {
	if (err && FATAL_CODES.has(err.code)) {
		log("uncaughtException", `FATAL (${err.code}) — exiting for restart`, err);
		process.exit(1);
	}
	// Non-fatal: log and stay up so active WhatsApp sessions are not dropped.
	log("uncaughtException", "kept alive", err);
});

process.on("warning", (w) => log("warning", w.name + ": " + w.message));

let shuttingDown = false;
const shutdown = (signal) => {
	if (shuttingDown) return;
	shuttingDown = true;
	log("signal", `${signal} received — shutting down gracefully`);
	// Give in-flight requests a moment, then exit.
	setTimeout(() => process.exit(0), 1500);
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Boot the real (compiled) application.
try {
	require("./dist/main.js");
	log("boot", "application started");
} catch (e) {
	log("boot", "failed to start application", e);
	process.exit(1);
}
