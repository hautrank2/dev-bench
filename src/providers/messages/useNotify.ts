import { useMemo } from "react";
import { toast } from "sonner";

import { useMessages } from "./context";

// A toast shows the first lines only; the message list keeps the whole text.
const summary = (detail: string | undefined) => {
  if (!detail) return undefined;
  const text = detail
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join("\n");
  return text.length > 160 ? `${text.slice(0, 160)}…` : text;
};

/** Toast plus a saved message. Pass text that is already translated. */
export const useNotify = () => {
  const { add } = useMessages();
  return useMemo(
    () => ({
      success: (title: string, detail?: string) => {
        toast.success(title, { description: summary(detail) });
        // A plain confirmation has nothing to open later.
        if (detail) add({ level: "success", title, detail });
      },
      error: (title: string, detail?: string) => {
        toast.error(title, { description: summary(detail) });
        add({ level: "error", title, detail });
      },
    }),
    [add],
  );
};
