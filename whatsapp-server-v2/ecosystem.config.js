/**
 * PM2 config — QuickZap WhatsApp server v2.
 * Fork mode, single instance: WhatsApp sessions are stateful and must live in
 * exactly ONE process (clustering/duplicate processes cause logouts).
 *
 *   pm2 start ecosystem.config.js --env production
 *   pm2 save && pm2 startup
 */
module.exports = {
  apps: [
    {
      name: 'quickzap-wa-v2',
      script: 'src/index.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      exp_backoff_restart_delay: 200,
      max_restarts: 30,
      min_uptime: '20s',
      node_args: '--max-old-space-size=1536',
      max_memory_restart: '1800M',
      kill_timeout: 8000,
      env: { NODE_ENV: 'development', UV_THREADPOOL_SIZE: '32' },
      env_production: { NODE_ENV: 'production', LOG_LEVEL: 'info', UV_THREADPOOL_SIZE: '64' },
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      merge_logs: true,
      time: true
    }
  ]
}
