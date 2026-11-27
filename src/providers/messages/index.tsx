import { MessagesContext } from "./context";
import { useMessagesProvider } from "./hook";
import type { MessagesProviderProps } from "./type";

export const MessagesProvider = (props: MessagesProviderProps) => {
  const value = useMessagesProvider();
  return <MessagesContext value={value}>{props.children}</MessagesContext>;
};
