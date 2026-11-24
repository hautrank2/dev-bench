import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";
import { Slot } from "radix-ui";
import { Spin } from "~/components/ui/spin";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-primary-foreground hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        /**
         * Như `ghost` nhưng icon màu nhạt — dành cho `<IconButton>` của MUI khi
         * KHÔNG truyền `color`.
         *
         * MUI đặt `color: palette.mutedForeground` cho IconButton mặc định, tức
         * rgba(0,0,0,0.54) ở light theme — nhạt hơn hẳn `foreground` (#111a27).
         * Dùng `ghost` trơn cho 51 icon button trong app sẽ làm tất cả đậm lên
         * một bậc, nên giữ token cũ ở đây thay vì rắc class ở từng callsite.
         */
        "ghost-muted":
          "text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",

        /*
          BỐN BIẾN THỂ "GHOST CÓ TÔNG" — dành cho nút icon mang ý nghĩa.

          Trước đây các callsite viết `color: "warning"` / `color: "error"`.
          Thứ đó KHÔNG BAO GIỜ chạy: `color` là thuộc tính HTML cũ, TypeScript
          nhận vì `ComponentProps<"button">` có khai nó, rồi React đẩy thẳng
          xuống DOM thành `<button color="warning">` — không đổi gì cả. Có 48
          chỗ trong app dính lỗi này mà không ai thấy, kể cả `color: "primary"`
          (trùng màu mặc định nên càng khó nhận ra).

          Nền dùng /10 khi rê chuột và /20 khi nhấn: đủ để thấy phản hồi mà
          không chọi với màu chữ, giống cách `ghost` dùng `accent`.

          `destructive` ở đây KHÁC biến thể `destructive` phía trên: cái kia là
          nút đặc màu đỏ cho hành động chính, cái này là nút icon trong bảng.
        */
        "ghost-primary":
          "text-primary hover:bg-primary/10 hover:text-primary active:bg-primary/20 focus-visible:ring-primary/20",
        "ghost-success":
          "text-success hover:bg-success/10 hover:text-success active:bg-success/20 focus-visible:ring-success/20",
        "ghost-warning":
          "text-warning-ink hover:bg-warning/10 hover:text-warning-ink active:bg-warning/20 focus-visible:ring-warning/20",
        "ghost-destructive":
          "text-destructive hover:bg-destructive/10 hover:text-destructive active:bg-destructive/20 focus-visible:ring-destructive/20",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  children,
  disabled,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /**
     * Đang xử lý: tự disable và hiện vòng quay.
     *
     * Bắt chước `loading` của `<Button>` MUI v7 với `loadingPosition="center"`
     * (mặc định của MUI): nhãn được GIỮ trong DOM nhưng ẩn thị giác, nên bề
     * rộng nút không đổi lúc bấm — nút không bị "nhảy" và không đẩy layout
     * xung quanh. Đừng thay bằng cách render thẳng Spin thế cho children.
     *
     * Không dùng được cùng `asChild`: khi đó Slot chỉ nhận đúng một child.
     */
    loading?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  if (asChild) {
    return (
      <Comp
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled}
        {...props}
      >
        {children}
      </Comp>
    );
  }

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      className={cn(
        buttonVariants({ variant, size, className }),
        loading && "relative",
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <Spin size={16} className="text-current" />
        </span>
      )}
      <span className={cn("contents", loading && "invisible")}>{children}</span>
    </Comp>
  );
}

export { Button, buttonVariants };
