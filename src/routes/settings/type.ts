import { z } from "zod";

import { cloudUrlSchema, setNameSchema } from "@shared/workspace";

export const serverFormSchema = z.object({ apiUrl: cloudUrlSchema });
export const setFormSchema = z.object({ name: setNameSchema });
export type SettingsProps = Record<string, never>;
export type UseSettingsProps = SettingsProps;
