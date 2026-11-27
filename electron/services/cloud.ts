import { safeStorage, shell } from "electron";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import {
  accountSchema,
  backupInfoSchema,
  backupSchema,
  cloudSettingsSchema,
  cloudUrlSchema,
  fromCloudBackup,
  toCloudBackup,
  type Account,
  type Backup,
  type CloudStatus,
  type WorkspaceInfo,
} from "../../shared/workspace";

const sessionSchema = z.object({
  token: z.string().min(20),
  account: accountSchema,
});
const startSchema = z.object({ loginId: z.uuid(), authorizationUrl: z.url() });
export class CloudService {
  private apiUrl = "";
  private session: { token: string; account: Account } | null = null;
  private controller?: AbortController;
  private loginTask?: Promise<CloudStatus>;

  constructor(
    private directory: string,
    private changed: () => void,
    defaultApiUrl = "",
  ) {
    if (defaultApiUrl)
      this.apiUrl = new URL(cloudUrlSchema.parse(defaultApiUrl)).origin;
  }

  private async write(file: string, data: string | Buffer) {
    await mkdir(this.directory, { recursive: true });
    const target = path.join(this.directory, file);
    await writeFile(`${target}.tmp`, data);
    await rename(`${target}.tmp`, target);
  }

  async load() {
    try {
      const config = cloudSettingsSchema.parse(
        JSON.parse(
          await readFile(path.join(this.directory, "cloud.json"), "utf8"),
        ),
      );
      this.apiUrl = config.apiUrl;
    } catch (error) {
      if (!(
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      ))
        throw error;
    }
    if (!this.apiUrl) return;
    try {
      const encrypted = await readFile(
        path.join(this.directory, "cloud-session.bin"),
      );
      const stored = sessionSchema
        .extend({ apiUrl: cloudUrlSchema })
        .parse(JSON.parse(safeStorage.decryptString(encrypted)));
      this.session = stored.apiUrl === this.apiUrl ? stored : null;
    } catch {
      // Credentials are intentionally not portable across a reset or another OS.
      this.session = null;
    }
  }

  status(): CloudStatus {
    return {
      apiUrl: this.apiUrl,
      account: this.session?.account ?? null,
      signingIn: !!this.loginTask,
    };
  }

  async configure(apiUrl: string) {
    const config = cloudSettingsSchema.parse({
      apiUrl: new URL(apiUrl).origin,
    });
    if (this.loginTask)
      throw new Error("Cancel sign-in before changing the server.");
    if (this.session && this.apiUrl !== config.apiUrl) await this.signOut();
    await this.write("cloud.json", JSON.stringify(config));
    this.apiUrl = config.apiUrl;
    this.changed();
    return this.status();
  }

  private async request(
    route: string,
    options: RequestInit = {},
    auth = true,
    signal?: AbortSignal,
  ) {
    if (!this.apiUrl)
      throw new Error("Configure your backup API URL in Settings first.");
    if (auth && !this.session) throw new Error("Sign in with Google first.");
    const response = await fetch(`${this.apiUrl}${route}`, {
      ...options,
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(15000)])
        : AbortSignal.timeout(15000),
      redirect: "error",
      headers: {
        "content-type": "application/json",
        ...options.headers,
        ...(auth && this.session
          ? { authorization: `Bearer ${this.session.token}` }
          : {}),
      },
    });
    if (response.status === 401) {
      this.session = null;
      await unlink(path.join(this.directory, "cloud-session.bin")).catch(
        () => undefined,
      );
      this.changed();
    }
    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      const message = z.object({ error: z.string() }).safeParse(body);
      throw new Error(
        message.success
          ? message.data.error
          : `Backup API returned HTTP ${response.status}`,
      );
    }
    return response;
  }

  signIn(device: WorkspaceInfo): Promise<CloudStatus> {
    if (this.loginTask) return this.loginTask;
    const controller = new AbortController();
    this.controller = controller;
    const task = (async () => {
      try {
        const verifier = randomBytes(32).toString("base64url");
        const challenge = createHash("sha256")
          .update(verifier)
          .digest("base64url");
        const startResponse = await this.request(
          "/auth/desktop/start",
          {
            method: "POST",
            body: JSON.stringify({
              challenge,
              deviceId: device.deviceId,
              deviceName: device.deviceName,
            }),
          },
          false,
          controller.signal,
        );
        const start = startSchema.parse(await startResponse.json());
        const authUrl = new URL(start.authorizationUrl);
        if (
          authUrl.protocol !== "https:" ||
          authUrl.hostname !== "accounts.google.com"
        )
          throw new Error("The server returned an invalid Google sign-in URL.");
        await shell.openExternal(authUrl.toString());
        const deadline = Date.now() + 5 * 60000;
        while (Date.now() < deadline && !controller.signal.aborted) {
          const response = await this.request(
            "/auth/desktop/complete",
            {
              method: "POST",
              body: JSON.stringify({ loginId: start.loginId, verifier }),
            },
            false,
            controller.signal,
          );
          if (response.status !== 202) {
            const session = sessionSchema.parse(await response.json());
            if (!safeStorage.isEncryptionAvailable())
              throw new Error(
                "OS credential encryption is unavailable. Unlock your keychain and try again.",
              );
            await this.write(
              "cloud-session.bin",
              safeStorage.encryptString(
                JSON.stringify({ ...session, apiUrl: this.apiUrl }),
              ),
            );
            this.session = session;
            return this.status();
          }
          await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => {
              controller.signal.removeEventListener("abort", abort);
              resolve();
            }, 1500);
            const abort = () => {
              clearTimeout(timer);
              reject(new Error("Sign-in cancelled"));
            };
            controller.signal.addEventListener("abort", abort, { once: true });
          });
        }
        throw new Error("Sign-in timed out. Try again.");
      } finally {
        this.loginTask = undefined;
        this.controller = undefined;
        this.changed();
      }
    })();
    this.loginTask = task;
    this.changed();
    return task;
  }

  cancelSignIn() {
    this.controller?.abort();
  }

  async signOut() {
    this.cancelSignIn();
    // Local sign-out is immediate even if the server is temporarily offline.
    try {
      if (this.session) await this.request("/auth/logout", { method: "POST" });
    } finally {
      this.session = null;
      await unlink(path.join(this.directory, "cloud-session.bin")).catch(
        () => undefined,
      );
      this.changed();
    }
  }

  async listBackups() {
    const response = await this.request("/backups");
    return z.array(backupInfoSchema).parse(await response.json());
  }
  async backup(snapshot: Backup) {
    const response = await this.request("/backups", {
      method: "POST",
      body: JSON.stringify(toCloudBackup(snapshot)),
    });
    return backupInfoSchema.parse(await response.json());
  }
  async restore(id: string) {
    const response = await this.request(`/backups/${z.uuid().parse(id)}`);
    return backupSchema.parse(fromCloudBackup(await response.json()));
  }
}
