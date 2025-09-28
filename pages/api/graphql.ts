import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await fetch(process.env.ENVIO_GRAPHQL_URL as string, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
      },
      body: req.body ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error("GraphQL Proxy Error:", error);
    res.status(500).json({ error: "Failed to connect to Envio GraphQL" });
  }
}
