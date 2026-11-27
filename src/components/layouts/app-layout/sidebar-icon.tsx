import {
  Activity,
  BarChart3,
  Files,
  FolderGit2,
  Globe,
  Icon,
  LayoutDashboard,
  Network,
  Settings2,
  Sparkles,
  type IconNode,
} from "lucide-react";

import type { SidebarIconName, SidebarIconProps } from "./type";

const outlineIcons = {
  dashboard: LayoutDashboard,
  projects: FolderGit2,
  processes: Activity,
  ports: Network,
  stats: BarChart3,
  utilities: Sparkles,
  hosts: Globe,
  "config-files": Files,
  settings: Settings2,
};

// Solid companions preserve the Lucide silhouettes; cutouts keep interior details legible.
const solidIcons: Record<SidebarIconName, IconNode> = {
  dashboard: [
    [
      "rect",
      { x: "3", y: "3", width: "7", height: "9", rx: "1", key: "top-left" },
    ],
    [
      "rect",
      { x: "14", y: "3", width: "7", height: "5", rx: "1", key: "top-right" },
    ],
    [
      "rect",
      { x: "3", y: "16", width: "7", height: "5", rx: "1", key: "bottom-left" },
    ],
    [
      "rect",
      {
        x: "14",
        y: "12",
        width: "7",
        height: "9",
        rx: "1",
        key: "bottom-right",
      },
    ],
  ],
  projects: [
    [
      "path",
      {
        d: "M4 3h4l3 3h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z",
        key: "folder",
      },
    ],
    [
      "path",
      {
        d: "M10 10v6m0-3h6v3",
        fill: "none",
        stroke: "var(--sidebar-accent)",
        strokeWidth: "2",
        key: "branch",
      },
    ],
    [
      "circle",
      {
        cx: "10",
        cy: "10",
        r: "1.5",
        fill: "var(--sidebar-accent)",
        key: "source",
      },
    ],
    [
      "circle",
      {
        cx: "16",
        cy: "16",
        r: "1.5",
        fill: "var(--sidebar-accent)",
        key: "target",
      },
    ],
  ],
  processes: [
    [
      "path",
      { d: "m9 2 6 16 2-7h5v2h-3.5L15 23 9 7 7 13H2v-2h3.5Z", key: "pulse" },
    ],
  ],
  ports: [
    ["rect", { x: "8", y: "2", width: "8", height: "7", rx: "1", key: "root" }],
    [
      "rect",
      { x: "2", y: "16", width: "8", height: "6", rx: "1", key: "left" },
    ],
    [
      "rect",
      { x: "14", y: "16", width: "8", height: "6", rx: "1", key: "right" },
    ],
    [
      "path",
      {
        d: "M12 9v4H6v3m6-3h6v3",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        key: "connections",
      },
    ],
  ],
  stats: [
    [
      "rect",
      { x: "3", y: "12", width: "4", height: "9", rx: "1", key: "short" },
    ],
    [
      "rect",
      { x: "10", y: "3", width: "4", height: "18", rx: "1", key: "tall" },
    ],
    [
      "rect",
      { x: "17", y: "8", width: "4", height: "13", rx: "1", key: "medium" },
    ],
  ],
  utilities: [
    [
      "path",
      {
        d: "m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Zm8-2 1.2 2.8L24 4l-2.8 1.2L20 8l-1.2-2.8L16 4l2.8-1.2ZM4 16l1.2 2.8L8 20l-2.8 1.2L4 24l-1.2-2.8L0 20l2.8-1.2Z",
        key: "sparkles",
      },
    ],
  ],
  hosts: [
    ["circle", { cx: "12", cy: "12", r: "10", key: "globe" }],
    [
      "ellipse",
      {
        cx: "12",
        cy: "12",
        rx: "4",
        ry: "10",
        fill: "none",
        stroke: "var(--sidebar-accent)",
        strokeWidth: "1.5",
        key: "longitude",
      },
    ],
    [
      "path",
      {
        d: "M2 12h20",
        stroke: "var(--sidebar-accent)",
        strokeWidth: "1.5",
        key: "equator",
      },
    ],
  ],
  "config-files": [
    [
      "path",
      {
        d: "M5 2h9l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm10 1v5h5",
        key: "front",
      },
    ],
    ["path", { d: "M8 22h12a2 2 0 0 0 2-2V9h-2v11H8Z", key: "back" }],
    [
      "path",
      {
        d: "M14 2v6h5",
        fill: "none",
        stroke: "var(--sidebar-accent)",
        strokeWidth: "1.5",
        key: "fold",
      },
    ],
  ],
  settings: [
    ["circle", { cx: "7", cy: "7", r: "4", key: "top-knob" }],
    ["circle", { cx: "17", cy: "17", r: "4", key: "bottom-knob" }],
    ["path", { d: "M11 6h11v2H11ZM2 16h11v2H2Z", key: "tracks" }],
  ],
};

export const SidebarIcon = ({ name, active }: SidebarIconProps) => {
  const OutlineIcon = outlineIcons[name];
  return active ? (
    <Icon
      iconNode={solidIcons[name]}
      className="size-4 shrink-0"
      fill="currentColor"
      strokeWidth={0}
      aria-hidden="true"
      data-variant="solid"
    />
  ) : (
    <OutlineIcon className="size-4 shrink-0" aria-hidden="true" />
  );
};
