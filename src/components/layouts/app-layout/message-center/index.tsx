import { Bell, Trash2 } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { cn } from "~/lib/utils";
import { useLocale } from "~/providers/locale/context";

import { useMessageCenter } from "./hook";
import { MessageItem } from "./message-item";

export const MessageCenter = () => {
  const { t } = useLocale();
  const state = useMessageCenter();
  const label = state.unread
    ? t("Messages, {0} unread", { 0: state.unread })
    : t("Messages");
  return (
    <Sheet open={state.open} onOpenChange={state.setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          title={label}
          className="layout-message-trigger relative text-header-muted hover:bg-header-border hover:text-header-foreground"
        >
          <Bell />
          {state.unread > 0 && (
            <span
              aria-hidden="true"
              className={cn(
                "absolute -right-1 -top-1 min-w-4 rounded-full px-1 text-[10px] leading-4",
                state.unreadError
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-primary text-primary-foreground",
              )}
            >
              {state.unread > 99 ? "99+" : state.unread}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="layout-message-center w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b pr-12">
          <SheetTitle>{t("Messages")}</SheetTitle>
          <SheetDescription>
            {t("Kept in memory until DevBench closes.")}
          </SheetDescription>
        </SheetHeader>
        {state.messages.length === 0 ? (
          <p className="p-10 text-center text-muted-foreground">
            {t("No messages yet.")}
          </p>
        ) : (
          <>
            <div className="layout-message-toolbar flex items-center justify-between gap-3 border-b px-4 py-2">
              <span className="text-xs text-muted-foreground">
                {t("{0} saved messages", { 0: state.messages.length })}
              </span>
              <Button variant="text" size="sm" onClick={state.clear}>
                <Trash2 />
                {t("Clear all")}
              </Button>
            </div>
            <ul className="layout-message-list min-h-0 flex-1 divide-y overflow-y-auto">
              {state.messages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  open={state.openId === message.id}
                  onToggle={() => state.toggle(message.id)}
                  onDelete={() => state.remove(message.id)}
                />
              ))}
            </ul>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
