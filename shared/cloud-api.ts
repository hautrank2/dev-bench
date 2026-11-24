import { z } from "zod";

export const loginStartSchema = z.object({
  challenge: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  deviceId: z.uuid(),
  deviceName: z.string().trim().min(1).max(100),
});
export const loginCompleteSchema = z.object({
  loginId: z.uuid(),
  verifier: z.string().regex(/^[A-Za-z0-9_-]{43,128}$/),
});
export type LoginStart = z.infer<typeof loginStartSchema>;
export type LoginComplete = z.infer<typeof loginCompleteSchema>;
