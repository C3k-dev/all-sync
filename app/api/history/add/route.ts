import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: Request) {
  const { telegramId, roomId, role } = await req.json();
  const client = await clientPromise;
  const db = client.db("allsync");

  await db.collection("history").updateOne(
    { telegramId },
    { $push: { rooms: { roomId, role, joinedAt: Date.now() } } },
    { upsert: true }
  );

  return NextResponse.json({ ok: true });
}
