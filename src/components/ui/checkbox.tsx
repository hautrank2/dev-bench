"use client";

import * as React from "react";
import { cn } from "~/lib/utils";
import { CheckIcon, MinusIcon } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";

/* Dùng chung cho bản tương tác và bản chỉ-để-nhìn, để hai cái không lệch nhau. */
const checkboxBoxClass =
  "peer border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:bg-input/30 dark:aria-invalid:ring-destructive/40 dark:data-[state=checked]:bg-primary size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50";

const checkboxIndicatorClass =
  "grid place-content-center text-current transition-none";

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        checkboxBoxClass,
        "data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className={checkboxIndicatorClass}
      >
        {props.checked === "indeterminate" ? (
          <MinusIcon className="size-3.5" />
        ) : (
          <CheckIcon className="size-3.5" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

/**
 * Ô đánh dấu CHỈ ĐỂ NHÌN — không bắt bấm, không vào thứ tự tab.
 *
 * Dùng khi cả HÀNG mới là thứ bấm được, còn ô đánh dấu chỉ hiển thị trạng
 * thái. `Checkbox` của Radix render ra <button> thật, đặt nó trong một
 * <button> khác là HTML không hợp lệ (trình duyệt tự tách thẻ, React báo lỗi
 * hydration). Bản này là <span> nên lồng thoải mái.
 *
 * Hàng chứa nó nên mang `role="checkbox"` + `aria-checked` để vẫn đúng ngữ
 * nghĩa cho trình đọc màn hình.
 */
function CheckboxBox({
  checked,
  className,
}: {
  checked: boolean | "indeterminate";
  className?: string;
}) {
  const state =
    checked === "indeterminate"
      ? "indeterminate"
      : checked
        ? "checked"
        : "unchecked";

  return (
    <span
      aria-hidden="true"
      data-slot="checkbox"
      data-state={state}
      className={cn(checkboxBoxClass, "inline-block", className)}
    >
      {checked !== false && (
        <span data-slot="checkbox-indicator" className={checkboxIndicatorClass}>
          <CheckIcon className="size-3.5" />
        </span>
      )}
    </span>
  );
}

/** `aria-checked` nhận "mixed" cho trạng thái lửng, không phải "indeterminate". */
function ariaChecked(checked: boolean | "indeterminate") {
  return checked === "indeterminate" ? "mixed" : checked;
}

export { Checkbox, CheckboxBox, ariaChecked };
