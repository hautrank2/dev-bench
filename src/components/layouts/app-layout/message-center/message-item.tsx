import {
  ChevronDown,
  ChevronRight,
  CircleCheck,
  CircleX,
  Trash2,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useLocale } from "~/providers/locale/context";

import type { MessageItemProps } from "./type";

export const MessageItem = (props: MessageItemProps) => {
  const { t, dateLocale } = useLocale();
  const { message } = props;
  const failed = message.level === "error";
  const Icon = failed ? CircleX : CircleCheck;
  const detailId = `${message.id}-detail`;
  return (
    <li data-message-id={message.id} className="layout-message-item">
      <div className="flex items-start gap-1 p-2">
        <button
          type="button"
          aria-expanded={props.open}
          aria-controls={props.open ? detailId : undefined}
          onClick={props.onToggle}
          className="flex min-w-0 flex-1 items-start gap-3 rounded-md p-2 text-left hover:bg-primary/10"
        >
          <Icon
            aria-hidden="true"
            className={cn(
              "mt-0.5 size-4 shrink-0",
              failed ? "text-destructive" : "text-success",
            )}
          />
          <span className="min-w-0 flex-1">
            <span className="sr-only">
              {failed ? t("Error") : t("Success")}:{" "}
            </span>
            <span
              className={cn(
                "block break-words font-medium",
                !props.open && "line-clamp-2",
              )}
            >
              {message.title}
            </span>
            <span className="block text-xs text-muted-foreground">
              {new Date(message.createdAt).toLocaleTimeString(dateLocale)}
              {message.count > 1 && ` · ×${message.count}`}
            </span>
          </span>
          {props.open ? (
            <ChevronDown className="mt-0.5 size-4 shrink-0" />
          ) : (
            <ChevronRight className="mt-0.5 size-4 shrink-0" />
          )}
        </button>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={t("Delete message: {0}", { 0: message.title })}
          title={t("Delete message")}
          onClick={props.onDelete}
        >
          <Trash2 />
        </Button>
      </div>
      {props.open && (
        <pre
          id={detailId}
          tabIndex={0}
          className="layout-message-detail mx-4 mb-3 max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-md bg-muted p-3 font-mono text-xs"
        >
          {message.detail ?? t("No further details.")}
        </pre>
      )}
    </li>
  );
};
