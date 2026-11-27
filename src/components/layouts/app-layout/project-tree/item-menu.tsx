import { Fragment } from "react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";

import type { MenuAction, TreeItemMenuProps } from "./type";

const item = (action: MenuAction) => (
  <ContextMenuItem
    key={action.key ?? action.label}
    variant={action.destructive ? "destructive" : "default"}
    disabled={action.disabled}
    onSelect={action.onSelect}
  >
    {action.Icon && <action.Icon />}
    <span className="truncate">{action.label}</span>
  </ContextMenuItem>
);

export const TreeItemMenu = (props: TreeItemMenuProps) => (
  <ContextMenu>
    <ContextMenuTrigger asChild>{props.children}</ContextMenuTrigger>
    <ContextMenuContent className="layout-sidebar-menu min-w-48">
      {props.entries.map((entry, index) => {
        if (entry === "separator")
          return <ContextMenuSeparator key={`separator-${index}`} />;
        if (!("items" in entry)) return item(entry);
        return (
          <ContextMenuSub key={entry.label}>
            <ContextMenuSubTrigger disabled={entry.disabled}>
              <entry.Icon />
              {entry.label}
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="layout-sidebar-submenu max-w-64">
              {entry.items.map((action) => (
                <Fragment key={action.key ?? action.label}>
                  {item(action)}
                </Fragment>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        );
      })}
    </ContextMenuContent>
  </ContextMenu>
);
