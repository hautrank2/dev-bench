import { Link } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Files,
  FolderGit2,
  Globe,
  LayoutDashboard,
  Menu,
  Monitor,
  Moon,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  Sparkles,
  Sun,
  Terminal,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { cn } from "~/lib/utils";

import { useAppLayout } from "./hook";
import type { AppLayoutProps } from "./type";

export const AppLayout = (props: AppLayoutProps) => {
  const state = useAppLayout(props);
  const brand = (collapsed = false) => (
    <Link
      to="/"
      aria-label="Dev Bench home"
      title="Dev Bench"
      className={cn(
        "layout-brand flex items-center gap-3 font-semibold",
        collapsed && "justify-center",
      )}
    >
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Terminal className="size-4" />
      </span>
      <span className={collapsed ? "sr-only" : undefined}>Dev Bench</span>
    </Link>
  );
  const navigation = (collapsed = false) => (
    <nav
      className="layout-navigation flex min-h-0 flex-1 flex-col gap-1.5"
      aria-label="Main navigation"
    >
      <Link
        to="/"
        aria-label="Dashboard"
        title={collapsed ? "Dashboard" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5",
          collapsed && "justify-center px-0",
          state.pathname === "/"
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-muted",
        )}
      >
        <LayoutDashboard className="size-4" />
        <span className={collapsed ? "sr-only" : undefined}>Dashboard</span>
      </Link>
      <div
        className={cn(
          "flex items-center rounded-lg",
          state.pathname.startsWith("/projects")
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-muted",
        )}
      >
        <Link
          to="/projects"
          aria-label="Projects"
          title={collapsed ? "Projects" : undefined}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5",
            collapsed && "justify-center px-0",
          )}
        >
          <FolderGit2 className="size-4" />
          <span className={collapsed ? "sr-only" : undefined}>Projects</span>
          {!collapsed && (
            <span className="ml-auto text-xs">
              {state.workspace.data?.groups.length ?? 0}
            </span>
          )}
        </Link>
        {!collapsed && (
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Expand projects"
            aria-expanded={state.projectsOpen}
            onClick={() => state.setProjectsOpen(!state.projectsOpen)}
          >
            {state.projectsOpen ? <ChevronDown /> : <ChevronRight />}
          </Button>
        )}
      </div>
      {!collapsed && state.projectsOpen && (
        <div className="layout-project-tree ml-4 space-y-1 border-l pl-2">
          {state.workspace.data?.groups.map((group) => (
            <div key={group.id} data-project-id={group.id}>
              <div className="flex min-w-0 items-center gap-1">
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label={`Expand ${group.name}`}
                  aria-expanded={state.expanded.includes(group.id)}
                  onClick={() => state.toggleProject(group.id)}
                >
                  {state.expanded.includes(group.id) ? (
                    <ChevronDown />
                  ) : (
                    <ChevronRight />
                  )}
                </Button>
                <Link
                  to={`/projects/${group.id}`}
                  className={cn(
                    "min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-xs",
                    state.pathname.endsWith(group.id)
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {group.name}
                </Link>
              </div>
              {state.expanded.includes(group.id) && (
                <div className="ml-6 space-y-1 border-l pl-3">
                  {state.repositories.data
                    ?.filter((repo) => repo.groupId === group.id)
                    .map((repo) => (
                      <Link
                        key={repo.id}
                        to={`/projects/${group.id}`}
                        className="flex min-w-0 items-center gap-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <span
                          className={cn(
                            "size-1.5 shrink-0 rounded-full",
                            repo.runtime.status === "Running"
                              ? "bg-success"
                              : "bg-muted-foreground/40",
                          )}
                        />
                        <span className="truncate">{repo.name}</span>
                      </Link>
                    ))}
                </div>
              )}
            </div>
          ))}
          {state.workspace.data?.groups.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              No projects yet
            </p>
          )}
        </div>
      )}
      {[
        { path: "/processes", label: "Processes", icon: Activity },
        { path: "/ports", label: "Ports", icon: Network },
        { path: "/stats", label: "Stats", icon: BarChart3 },
        { path: "/utilities", label: "Utilities", icon: Sparkles },
      ].map(({ path, label, icon: Icon }) => (
        <Link
          key={path}
          to={path}
          aria-label={label}
          title={collapsed ? label : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5",
            collapsed && "justify-center px-0",
            state.pathname === path
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-muted",
          )}
        >
          <Icon className="size-4" />
          <span className={collapsed ? "sr-only" : undefined}>{label}</span>
        </Link>
      ))}
      {collapsed ? (
        <div className="my-3 border-t" />
      ) : (
        <h6 className="mb-1 mt-7 px-3 text-muted-foreground">System</h6>
      )}
      {[
        { path: "/hosts", label: "Hosts", icon: Globe },
        { path: "/config-files", label: "Config Files", icon: Files },
      ].map(({ path, label, icon: Icon }) => (
        <Link
          key={path}
          to={path}
          aria-label={label}
          title={collapsed ? label : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5",
            collapsed && "justify-center px-0",
            state.pathname === path
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-muted",
          )}
        >
          <Icon className="size-4" />
          <span className={collapsed ? "sr-only" : undefined}>{label}</span>
        </Link>
      ))}
      <div className="mt-auto space-y-1.5 pt-8">
        {!collapsed && (
          <h6 className="mb-2 px-3 text-muted-foreground">Preferences</h6>
        )}
        <Link
          to="/settings"
          aria-label="Settings"
          title={collapsed ? "Settings" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5",
            collapsed && "justify-center px-0",
            state.pathname === "/settings"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-muted",
          )}
        >
          <Settings2 className="size-4" />
          <span className={collapsed ? "sr-only" : undefined}>Settings</span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              aria-label={`Theme: ${state.theme.theme}`}
              title={`Theme: ${state.theme.theme}`}
              className={cn(
                "layout-theme-trigger h-10 w-full justify-start gap-3 rounded-lg px-3 text-sidebar-foreground",
                collapsed && "justify-center px-0",
              )}
            >
              {state.theme.theme === "system" ? (
                <Monitor />
              ) : state.theme.theme === "dark" ? (
                <Moon />
              ) : (
                <Sun />
              )}
              <span className={collapsed ? "sr-only" : "capitalize"}>
                {state.theme.theme}
              </span>
              {!collapsed && (
                <ChevronDown className="ml-auto size-3.5 text-muted-foreground" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="end"
            sideOffset={12}
            className="layout-theme-menu min-w-44 rounded-xl p-1.5"
          >
            <DropdownMenuRadioGroup
              value={state.theme.theme}
              onValueChange={state.selectTheme}
            >
              <DropdownMenuRadioItem value="light">
                <Sun />
                Light
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <Moon />
                Dark
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <Monitor />
                System
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
  return (
    <div className="layout-root relative flex h-full overflow-clip bg-background">
      <aside
        id="desktop-sidebar"
        data-collapsed={state.collapsed}
        className={cn(
          "layout-sidebar relative hidden shrink-0 flex-col border-r bg-sidebar lg:flex",
          state.collapsed ? "w-[76px]" : "w-60",
        )}
      >
        <div className="layout-sidebar-brand flex h-[50px] shrink-0 items-center justify-center border-b px-4">
          <div className="w-full">{brand(state.collapsed)}</div>
        </div>
        <div
          className={cn(
            "layout-sidebar-content relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain",
            state.collapsed ? "p-3" : "p-4",
          )}
        >
          {navigation(state.collapsed)}
        </div>
      </aside>
      <div className="layout-content flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="layout-header flex h-[50px] shrink-0 items-center justify-between gap-4 border-b bg-card px-5">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={
                state.collapsed ? "Expand sidebar" : "Collapse sidebar"
              }
              aria-expanded={!state.collapsed}
              aria-controls="desktop-sidebar"
              title={state.collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={state.toggleCollapsed}
              className="layout-sidebar-toggle hidden text-muted-foreground lg:inline-flex"
            >
              {state.collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            </Button>
            <Button
              className="lg:hidden"
              variant="ghost"
              size="icon-sm"
              aria-label="Open navigation"
              onClick={() => state.setMobileOpen(true)}
            >
              <Menu />
            </Button>
            <span className="truncate text-xs font-medium text-muted-foreground">
              {state.workspace.data?.deviceName ?? "Local workspace"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:block">
              {state.cloud.data?.account?.email ?? "Local mode"}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Open settings"
              onClick={state.openSettings}
            >
              <Settings2 />
            </Button>
          </div>
        </header>
        <div
          className="layout-page relative min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain"
          id="page-scroll"
        >
          {props.children}
        </div>
      </div>
      <Sheet open={state.mobileOpen} onOpenChange={state.setMobileOpen}>
        <SheetContent side="left" className="w-72 gap-3 overflow-y-auto p-4">
          <SheetHeader className="p-0">
            <SheetTitle asChild>{brand()}</SheetTitle>
          </SheetHeader>
          {navigation()}
        </SheetContent>
      </Sheet>
    </div>
  );
};
