import { useEffect, useState } from "react";

import { useMessages } from "~/providers/messages/context";

export const useMessageCenter = () => {
  const { messages, remove, clear, markAllRead } = useMessages();
  const [open, setOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const unread = messages.filter((message) => !message.read);
  // Whatever is visible in the open panel counts as read.
  useEffect(() => {
    if (open) markAllRead();
  }, [open, messages, markAllRead]);
  return {
    messages,
    unread: unread.length,
    unreadError: unread.some((message) => message.level === "error"),
    open,
    setOpen,
    openId,
    toggle: (id: string) =>
      setOpenId((current) => (current === id ? null : id)),
    remove,
    clear,
  };
};
