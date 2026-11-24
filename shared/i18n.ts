import { vietnamese } from "./locales/vi";

export type Language = "en" | "vi";
export type TranslationParams = Record<string, string | number>;
export const languageStorageKey = "DEV_BENCH_LANGUAGE";
export const isLanguage = (value: unknown): value is Language =>
  value === "en" || value === "vi";

const interpolate = (message: string, params: TranslationParams) =>
  message.replace(/\{(\w+)\}/g, (match, key: string) =>
    String(params[key] ?? match),
  );

const patterns = Object.entries(vietnamese)
  .filter(([key]) => key.includes("{0}"))
  .map(([key, value]) => ({
    expression: new RegExp(
      `^${key
        .split(/(\{\d+\})/)
        .map((part) =>
          /^\{\d+\}$/.test(part)
            ? "(.+?)"
            : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        )
        .join("")}$`,
    ),
    value,
  }));

export const translate = (
  language: Language,
  message: string,
  params: TranslationParams = {},
): string => {
  if (language === "en") return interpolate(message, params);
  const key = message.trim();
  const direct = Object.hasOwn(vietnamese, key) ? vietnamese[key] : undefined;
  if (direct !== undefined) {
    const leading = message.slice(
      0,
      message.length - message.trimStart().length,
    );
    const trailing = message.slice(message.trimEnd().length);
    return leading + interpolate(direct, params) + trailing;
  }
  // Localize app-owned dynamic messages, keeping every captured name/path untouched.
  for (const pattern of patterns) {
    const match = key.match(pattern.expression);
    if (match)
      return interpolate(
        pattern.value,
        Object.fromEntries(
          match.slice(1).map((value, index) => [index, value]),
        ),
      );
  }
  const maximum = key.match(
    /^Too big: expected string to have <=([0-9]+) characters$/,
  );
  if (maximum) return `Tối đa ${maximum[1]} ký tự`;
  return interpolate(message, params);
};
