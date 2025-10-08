const { getSubscriptionData } = require('../../lib/fetchers');

export default async function handler(req, res) {
  try {
    const subs = await getSubscriptionData();

    return res.status(200).json({
      status: "ok",
      data: subs,
      count: subs.length,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Compact subscription API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
