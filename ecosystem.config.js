module.exports = {
  apps: [
    {
      name: "cymor-whatsapp-bot",
      script: "index.js",
      watch: false,
      autorestart: true,
      max_restarts: 50,
      restart_delay: 3000,
      exp_backoff_restart_delay: 2000,
      kill_timeout: 10000,
      node_args: "--max-old-space-size=256"
    }
  ]
};
