/** PM2 — cwd: /var/www/r9host/app */
const appRoot = __dirname + "/..";

module.exports = {
  apps: [
    {
      name: "r9host-web",
      cwd: appRoot,
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 3000",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "900M",
      kill_timeout: 10000,
      exp_backoff_restart_delay: 1000,
      time: true,
    },
    {
      name: "r9host-worker",
      cwd: appRoot,
      script: "node_modules/.bin/tsx",
      args: "workers/fulfillment-worker.ts",
      env: {
        NODE_ENV: "production",
      },
      autorestart: true,
      max_memory_restart: "512M",
      kill_timeout: 10000,
      exp_backoff_restart_delay: 1000,
      time: true,
    },
  ],
};
