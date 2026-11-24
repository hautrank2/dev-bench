import { MongoClient, type Db } from "mongodb";

import type { Account, Backup } from "../shared/workspace";

export type UserRecord = Account & { _id: string; googleSub: string };
export type SessionRecord = {
  _id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  tokenHash: string;
  expiresAt: Date;
};
export type LoginRecord = {
  _id: string;
  state: string;
  nonce: string;
  googleVerifier: string;
  challenge: string;
  deviceId: string;
  deviceName: string;
  expiresAt: Date;
  userId?: string;
};
export type BackupRecord = {
  _id: string;
  userId: string;
  createdAt: Date;
  snapshot: Backup;
};
export const collections = (db: Db) => ({
  users: db.collection<UserRecord>("users"),
  sessions: db.collection<SessionRecord>("sessions"),
  logins: db.collection<LoginRecord>("desktop_logins"),
  backups: db.collection<BackupRecord>("project_backups"),
});
export const initializeDatabase = async (db: Db) => {
  const tables = collections(db);
  await Promise.all([
    tables.users.createIndex({ googleSub: 1 }, { unique: true }),
    tables.sessions.createIndex({ tokenHash: 1 }, { unique: true }),
    tables.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    tables.logins.createIndex({ state: 1 }, { unique: true, sparse: true }),
    tables.logins.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    tables.backups.createIndex({ userId: 1, createdAt: -1 }),
  ]);
};
export const connectDatabase = async (uri: string, name: string) => {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  const db = client.db(name);
  await initializeDatabase(db);
  return { client, db };
};
