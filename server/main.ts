import { connectDatabase } from "./database";
import { createServer } from "./app";
import { googleProvider } from "./google";

const required = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing ${key}. See server/.env.example`);
  return value;
};
const origin = new URL(required("PUBLIC_API_ORIGIN"));
if (
  origin.protocol !== "https:" &&
  !["localhost", "127.0.0.1"].includes(origin.hostname)
) {
  throw new Error("PUBLIC_API_ORIGIN must use HTTPS outside localhost");
}
const { client, db } = await connectDatabase(
  required("MONGODB_URI"),
  process.env.MONGODB_DB ?? "dev_bench",
);
const app = await createServer(
  db,
  googleProvider(
    required("GOOGLE_CLIENT_ID"),
    required("GOOGLE_CLIENT_SECRET"),
    new URL("/auth/google/callback", origin).toString(),
  ),
);
await app.listen({
  host: process.env.HOST ?? "127.0.0.1",
  port: Number(process.env.PORT ?? 4318),
});
console.log(`Dev Bench backup API listening on ${origin.origin}`);
const close = async () => {
  await app.close();
  await client.close();
};
process.once("SIGINT", () => {
  void close();
});
process.once("SIGTERM", () => {
  void close();
});
