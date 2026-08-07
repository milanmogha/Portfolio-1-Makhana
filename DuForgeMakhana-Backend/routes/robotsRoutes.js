import express from 'express';

const router = express.Router();

router.get('/robots.txt', (req, res) => {
  const baseUrl = (process.env.FRONTEND_URL || 'https://makhanahealthking.com').replace(/\/$/, '');
  const lines = [
    'User-agent: *',
    'Disallow:',
    `Sitemap: ${baseUrl}/sitemap.xml`,
    `Host: ${baseUrl}`,
  ];

  res.type('text/plain');
  // Cache robots for longer since it rarely changes
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(lines.join('\n'));
});

export default router;
