import type { ReactNode } from "react";

export type MessageLevel = "error" | "success";
export type MessageInput = {
  level: MessageLevel;
  title: string;
  detail?: string;
};
export type Message = MessageInput & {
  id: string;
  createdAt: number;
  /** How many times the same message arrived; repeats share one entry. */
  count: number;
  read: boolean;
};
export type MessagesContextValue = {
  /** Newest first. */
  messages: Message[];
  add: (input: MessageInput) => void;
  remove: (id: string) => void;
  clear: () => void;
  markAllRead: () => void;
};
export type MessagesProviderProps = { children: ReactNode };
