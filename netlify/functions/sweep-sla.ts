import { schedule } from '@netlify/functions';

// Netlify's equivalent of the Vercel Cron config in requirements.md §9.7 —
// this project deploys to Netlify (see netlify.toml), which has no
// vercel.json-style cron config. Every 10 minutes, hits the CRON_SECRET
// -protected sweep endpoint that does the actual work.
const handler = schedule('*/10 * * * *', async () => {
  const baseUrl = process.env.URL || process.env.DEPLOY_URL;
  const secret = process.env.CRON_SECRET;

  if (!baseUrl || !secret) {
    console.error('sweep-sla: missing URL/DEPLOY_URL or CRON_SECRET env var, skipping run');
    return { statusCode: 200 };
  }

  const res = await fetch(`${baseUrl}/api/v1/internal/service-requests/sweep-sla`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}` },
  });

  if (!res.ok) {
    console.error(`sweep-sla: internal endpoint returned ${res.status}`);
  }

  return { statusCode: 200 };
});

export { handler };
