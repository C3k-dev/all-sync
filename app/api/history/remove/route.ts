import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: Request) {
  const { telegramId, roomId } = await req.json();
  const client = await clientPromise;
  const db = client.db("allsync");

  await db.collection("history").updateOne(
    { telegramId },
    { $pull: { rooms: { roomId } } }
  );

  return NextResponse.json({ ok: true });
}
