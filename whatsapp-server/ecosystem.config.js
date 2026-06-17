/**
 * PM2 process manager config for the QuickZap WhatsApp server.
 *
 * Usage:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 save && pm2 startup        # survive server reboots
 *   pm2 logs quickzap-whatsapp     # tail logs
 *
 * Fork mode (NOT cluster): WhatsApp/Baileys sessions live in memory and must
 * stay in a single process — clustering would corrupt sessions.
 */
module.exports = {
	apps: [
		{
			name: "quickzap-whatsapp",
			script: "server.js",
			exec_mode: "fork",
			instances: 1,
			autorestart: true,
			watch: false,
			// Recover from crashes without hammering: exponential backoff between restarts.
			exp_backoff_restart_delay: 200,
			max_restarts: 20,
			min_uptime: "15s",
			// Allow a larger V8 heap so many concurrent sessions don't OOM.
			node_args: "--max-old-space-size=1536",
			// Restart cleanly only well past the heap cap (guards true leaks).
			max_memory_restart: "1800M",
			kill_timeout: 8000,
			listen_timeout: 10000,
			env: {
				NODE_ENV: "development",
				UV_THREADPOOL_SIZE: "32",
			},
			env_production: {
				NODE_ENV: "production",
				LOG_LEVEL: "info",
				// Bigger libuv pool for crypto + session file I/O under load.
				UV_THREADPOOL_SIZE: "64",
			},
			out_file: "./whatsapp-server.log",
			error_file: "./whatsapp-server.error.log",
			merge_logs: true,
			time: true,
		},
	],
};
