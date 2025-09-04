import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: Request) {
  const { telegramId } = await req.json();
  const client = await clientPromise;
  const db = client.db("allsync");

  const user = await db.collection("history").findOne({ telegramId });
  return NextResponse.json(user?.rooms || []);
}
