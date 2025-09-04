import clientPromise from "@/lib/mongodb";

interface UserDoc {
  telegramId: string;
  rooms?: {
    roomId: string;
    role: "owner" | "guest";
    joinedAt: number;
  }[];
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const telegramId = url.searchParams.get("telegramId");
  if (!telegramId) return new Response("Missing telegramId", { status: 400 });

  try {
    const client = await clientPromise;
    const db = client.db("allsync");
    const user = await db.collection<UserDoc>("users").findOne({ telegramId });
    return new Response(JSON.stringify(user?.rooms || []), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  const { telegramId, roomId, role } = await req.json();
  if (!telegramId || !roomId || !role) return new Response("Missing params", { status: 400 });

  try {
    const client = await clientPromise;
    const db = client.db("allsync");

    await db.collection<UserDoc>("users").updateOne(
      { telegramId: telegramId.toString() },
      {
        $setOnInsert: { telegramId: telegramId.toString() },
        $push: { rooms: { roomId, role, joinedAt: Date.now() } }
      },
      { upsert: true }
    );

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
