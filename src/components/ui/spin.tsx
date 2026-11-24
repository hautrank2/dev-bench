import { cn } from "~/lib/utils";
import { useLocale } from "~/providers/locale/context";

export type SpinProps = {
  className?: string;
  /** Đường kính px. Giữ nguyên mặc định 40 như bản cũ để không đổi bố cục. */
  size?: number;
  /** Độ dày vòng, px. MUI CircularProgress mặc định ~3.6 ở size 40. */
  thickness?: number;
  label?: string;
  /**
   * 0–100. Có giá trị = chế độ `determinate` của MUI (vòng chạy đúng tỷ lệ);
   * bỏ trống = vòng quay vô hạn như mặc định.
   */
  value?: number;
  style?: React.CSSProperties;
};

/**
 * Vòng quay loading, thuần CSS — thay cho <CircularProgress> của MUI.
 *
 * Bản cũ của file này bọc chính MuiCircularProgress nên không gỡ được MUI.
 *
 * Dùng border + animate-spin thay vì SVG stroke-dasharray: cùng hiệu ứng thị
 * giác nhưng không cần JS, và chạy trên compositor nên không tốn main thread —
 * đáng kể với trang có hàng chục ô camera cùng loading.
 */
export const Spin = ({
  className,
  size = 40,
  thickness,
  label = "Loading",
  value,
  style,
}: SpinProps) => {
  const { t } = useLocale();
  const border = thickness ?? Math.max(2, Math.round(size * 0.09));

  // Chế độ determinate không dùng được mẹo border: viền chỉ vẽ được nguyên
  // cạnh, không cắt được theo phần trăm. Dùng SVG + stroke-dasharray.
  if (value !== undefined) {
    const r = (size - border) / 2;
    const circumference = 2 * Math.PI * r;
    const pct = Math.min(100, Math.max(0, value));

    return (
      <svg
        data-slot="spin"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t(label)}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={cn("text-primary shrink-0 -rotate-90", className)}
        style={style}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={border}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct / 100)}
        />
      </svg>
    );
  }

  return (
    <span
      data-slot="spin"
      role="status"
      aria-label={t(label)}
      className={cn(
        "text-primary inline-block shrink-0 animate-spin rounded-full border-current border-t-transparent",
        className,
      )}
      style={{ width: size, height: size, borderWidth: border, ...style }}
    />
  );
};
