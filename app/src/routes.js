const express = require('express');
const { nanoid } = require('nanoid');
const { pool } = require('./db');

const router = express.Router();

const HOME_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>URL Shortener — DevOps Demo</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; max-width: 640px; margin: 4rem auto; padding: 0 1rem; color: #222; }
    h1 { margin-bottom: 0.25rem; }
    .sub { color: #666; margin-top: 0; }
    form { display: flex; gap: 0.5rem; margin-top: 1.5rem; }
    input { flex: 1; padding: 0.6rem; font-size: 1rem; border: 1px solid #ccc; border-radius: 4px; }
    button { padding: 0.6rem 1rem; font-size: 1rem; background: #111; color: white; border: 0; border-radius: 4px; cursor: pointer; }
    .footer { margin-top: 3rem; color: #888; font-size: 0.85rem; }
    code { background: #f3f3f3; padding: 0.15rem 0.35rem; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>URL Shortener</h1>
  <p class="sub">A small demo app showing a full Dockerized + CI/CD-deployed Node.js service.</p>
  <form action="/shorten" method="POST">
    <input name="url" placeholder="https://example.com/very/long/path" required />
    <button type="submit">Shorten</button>
  </form>
  <p class="footer">
    Health: <a href="/health"><code>/health</code></a> · Source on GitHub
  </p>
</body>
</html>`;

router.get('/', (req, res) => res.send(HOME_HTML));

router.post('/shorten', async (req, res) => {
  const { url } = req.body;
  if (!url || !/^https?:\/\//i.test(url)) {
    return res.status(400).send('Invalid URL — must start with http:// or https://');
  }
  const code = nanoid(7);
  await pool.query(
    'INSERT INTO urls (short_code, original_url) VALUES ($1, $2)',
    [code, url]
  );
  const shortUrl = `${req.protocol}://${req.get('host')}/${code}`;
  res.send(`<p>Shortened: <a href="${shortUrl}">${shortUrl}</a></p><p><a href="/">← back</a></p>`);
});

router.get('/:code', async (req, res) => {
  const result = await pool.query(
    'UPDATE urls SET hits = hits + 1 WHERE short_code = $1 RETURNING original_url',
    [req.params.code]
  );
  if (!result.rows.length) return res.status(404).send('Not found');
  res.redirect(result.rows[0].original_url);
});

module.exports = router;
