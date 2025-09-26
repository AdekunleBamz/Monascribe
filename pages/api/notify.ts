import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { email } = req.body || {}
    if (!email || typeof email !== 'string') return res.status(400).send('Invalid email')
    // In production, integrate your mail provider here (e.g., SendGrid/Postmark)
    console.log('Webinar notify signup:', email)
    return res.status(200).json({ ok: true })
  } catch (e) {
    return res.status(500).send('Failed')
  }
}


