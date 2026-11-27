import * as React from "react";
import { cn } from "~/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-field-border placeholder:text-muted-foreground hover:border-field-hover-border focus-visible:border-ring focus-visible:ring-ring/15 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 flex field-sizing-content min-h-16 w-full rounded-md border bg-field-background px-3 py-2 text-base text-foreground shadow-field transition-[background-color,border-color,color,box-shadow] outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
