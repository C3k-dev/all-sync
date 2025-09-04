// lib/mongodb.ts
import { MongoClient } from "mongodb";

// Используем переменные окружения
const user = process.env.MONGO_USER;
const password = process.env.MONGO_PASSWORD;
const cluster = process.env.MONGO_CLUSTER;

if (!password) {
  throw new Error("Не указан MONGO_PASSWORD в .env файле");
}

const uri = `mongodb+srv://${user}:${encodeURIComponent(password)}@${cluster}/?retryWrites=true&w=majority`;
const options = {};

let client: MongoClient;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient>;
}

// создаём клиент, если глобально ещё не создано
if (!global._mongoClientPromise) {
  client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect();
}

// используем const, так как присваиваем только один раз
const clientPromise: Promise<MongoClient> = global._mongoClientPromise;

export default clientPromise;
