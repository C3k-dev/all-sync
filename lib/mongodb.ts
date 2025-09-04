import { MongoClient } from "mongodb";

// Прямое подключение без env
const uri = "mongodb+srv://Culture3k:Wn1lkSGplj2vgs1@allsync.1o965vk.mongodb.net/?retryWrites=true&w=majority";
const options = {};

let client: MongoClient;

declare global {
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
