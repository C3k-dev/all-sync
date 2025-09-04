// lib/mongodb.ts
import { MongoClient } from "mongodb";

const user = process.env.MONGO_USER;
const password = process.env.MONGO_PASSWORD;
const cluster = process.env.MONGO_CLUSTER;

const uri =
  user && password && cluster
    ? `mongodb+srv://${encodeURIComponent(user)}:${encodeURIComponent(
        password
      )}@${cluster}/?retryWrites=true&w=majority`
    : undefined;

const options = {};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const client = uri ? new MongoClient(uri, options) : undefined;

if (!global._mongoClientPromise) {
  if (!client) {
    throw new Error(
      "Не заданы переменные окружения MONGO_USER / MONGO_PASSWORD / MONGO_CLUSTER"
    );
  }
  global._mongoClientPromise = client.connect();
}

const clientPromise: Promise<MongoClient> = global._mongoClientPromise!;

export default clientPromise;
