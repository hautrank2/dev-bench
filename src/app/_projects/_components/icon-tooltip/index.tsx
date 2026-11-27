import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";

import type { IconTooltipProps } from "./type";

export const IconTooltip = ({ label, children }: IconTooltipProps) => (
  <Tooltip>
    {/* Disabled buttons ignore pointer events, so the wrapper receives hover. */}
    <TooltipTrigger asChild>
      <span className="projects-icon-tooltip inline-flex">{children}</span>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);
