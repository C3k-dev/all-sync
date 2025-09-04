// pages/api/download-vk.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Метод не поддерживается" });
  }

  const { url, roomId } = req.body;
  if (!url || !roomId) {
    return res.status(400).json({ error: "Нет ссылки или roomId" });
  }

  try {
    // Отправляем POST-запрос на твой локальный сервер через ngrok
    const response = await fetch(`${process.env.LOCAL_NODE_SERVER}/download-vk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, roomId }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (err) {
    console.error("Ошибка при обращении к локальному серверу через ngrok:", err);
    res.status(500).json({ error: "Ошибка при обращении к локальному серверу" });
  }
}
