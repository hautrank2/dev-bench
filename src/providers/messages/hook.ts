import { useCallback, useMemo, useRef, useState } from "react";

import type { Message, MessageInput, MessagesContextValue } from "./type";

export const MESSAGE_LIMIT = 200;
export const DETAIL_LIMIT = 20_000;

// Command output can be huge; keep its end, where the failure usually is.
const trim = (detail: string | undefined) =>
  detail && detail.length > DETAIL_LIMIT
    ? `…${detail.slice(-DETAIL_LIMIT)}`
    : detail || undefined;

/** In memory only on purpose: closing the app empties the list. */
export const useMessagesProvider = (): MessagesContextValue => {
  const [messages, setMessages] = useState<Message[]>([]);
  const sequence = useRef(0);
  const add = useCallback((input: MessageInput) => {
    sequence.current += 1;
    const next: Message = {
      ...input,
      detail: trim(input.detail),
      id: `message-${sequence.current}`,
      createdAt: Date.now(),
      count: 1,
      read: false,
    };
    setMessages((current) => {
      const same = current.find(
        (item) =>
          item.level === next.level &&
          item.title === next.title &&
          item.detail === next.detail,
      );
      return [
        { ...next, id: same?.id ?? next.id, count: (same?.count ?? 0) + 1 },
        ...current.filter((item) => item !== same),
      ].slice(0, MESSAGE_LIMIT);
    });
  }, []);
  const remove = useCallback(
    (id: string) =>
      setMessages((current) => current.filter((item) => item.id !== id)),
    [],
  );
  const clear = useCallback(() => setMessages([]), []);
  const markAllRead = useCallback(
    () =>
      setMessages((current) =>
        current.every((item) => item.read)
          ? current
          : current.map((item) => ({ ...item, read: true })),
      ),
    [],
  );
  return useMemo(
    () => ({ messages, add, remove, clear, markAllRead }),
    [messages, add, remove, clear, markAllRead],
  );
};
