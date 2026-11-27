import { createContext, useContext } from "react";

import type { MessagesContextValue } from "./type";

// Without a provider (isolated components) messages are simply not kept.
export const MessagesContext = createContext<MessagesContextValue>({
  messages: [],
  add: () => undefined,
  remove: () => undefined,
  clear: () => undefined,
  markAllRead: () => undefined,
});
export const useMessages = () => useContext(MessagesContext);
