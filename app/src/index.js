const express = require('express');
const { initDb } = require('./db');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check — used by Docker healthcheck and CI deploy verification
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/', routes);

async function start() {
  try {
    await initDb();
    const server = app.listen(PORT, () => {
      console.log(`Listening on port ${PORT}`);
    });

    // Graceful shutdown — important when running under Docker/orchestrators
    const shutdown = (signal) => {
      console.log(`${signal} received, closing server...`);
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(1), 10000).unref();
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('Startup failed:', err);
    process.exit(1);
  }
}

if (require.main === module) start();

module.exports = app;
