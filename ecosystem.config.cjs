module.exports = {
  apps: [{
    name: "draftmind",
    cwd: "/home/ubuntu/draftmind/.next/standalone",
    script: "server.js",
    env: {
      NODE_ENV: "production",
      PORT: "3000",
      HOSTNAME: "127.0.0.1"
    }
  }]
}
