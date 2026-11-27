import type { Message } from "~/providers/messages/type";

export type MessageItemProps = {
  message: Message;
  open: boolean;
  onToggle: () => void;
  onDelete: () => void;
};
