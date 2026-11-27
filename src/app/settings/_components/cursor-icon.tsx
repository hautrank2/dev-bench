import type { TerminalCursor } from "@shared/workspace";

// Where each shape sits beside the prompt, in a 24 x 24 box.
const SHAPES: Record<
  TerminalCursor,
  { x: number; y: number; width: number; height: number }
> = {
  bar: { x: 13, y: 4, width: 2.5, height: 16 },
  block: { x: 12, y: 4, width: 9, height: 16 },
  underline: { x: 12, y: 17, width: 10, height: 3 },
};

type CursorIconProps = { cursor: TerminalCursor };

/** A prompt followed by the cursor shape that the option selects. */
export const CursorIcon = ({ cursor }: CursorIconProps) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    data-cursor-icon={cursor}
    className="settings-cursor-icon size-5"
  >
    <path
      d="M2.5 7.5 7 12l-4.5 4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.55"
    />
    <rect {...SHAPES[cursor]} rx="0.75" fill="currentColor" />
  </svg>
);
