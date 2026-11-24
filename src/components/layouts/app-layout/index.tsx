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
} from "lucide-react";

import appLogo from "~/assets/dev-bench.svg";
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
import { useLocale } from "~/providers/locale/context";

import { useAppLayout } from "./hook";
import type { AppLayoutProps } from "./type";

export const AppLayout = (props: AppLayoutProps) => {
  const { t } = useLocale();

  const state = useAppLayout(props);
  const brand = (collapsed = false) => (
    <Link
      to="/"
      aria-label="DevBench home"
      title="DevBench"
      className={cn(
        "layout-brand flex items-center gap-3 font-semibold",
        collapsed && "justify-center",
      )}
    >
      <img
        src={appLogo}
        alt=""
        aria-hidden="true"
        width={36}
        height={36}
        className="layout-brand-mark size-9 shrink-0"
      />
      <span
        className={
          collapsed ? "sr-only" : "text-base font-semibold tracking-tight"
        }
      >
        Dev<span className="font-normal">Bench</span>
      </span>
    </Link>
  );
  const navigation = (collapsed = false) => (
    <nav
      className="layout-navigation flex min-h-0 flex-1 flex-col gap-1"
      aria-label={t("Main navigation")}
    >
      <Link
        to="/"
        aria-label={t("Dashboard")}
        title={collapsed ? t("Dashboard") : undefined}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2",
          collapsed && "justify-center px-0",
          state.pathname === "/"
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-muted",
        )}
      >
        <LayoutDashboard className="size-4" />
        <span className={collapsed ? "sr-only" : undefined}>
          {t("Dashboard")}
        </span>
      </Link>
      <div
        className={cn(
          "flex items-center rounded-md",
          state.pathname.startsWith("/projects")
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-muted",
        )}
      >
        <Link
          to="/projects"
          aria-label={t("Projects")}
          title={collapsed ? t("Projects") : undefined}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-3 px-3 py-2",
            collapsed && "justify-center px-0",
          )}
        >
          <FolderGit2 className="size-4" />
          <span className={collapsed ? "sr-only" : undefined}>
            {t("Projects")}
          </span>
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
            aria-label={t("Expand projects")}
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
                  aria-label={t("Expand {0}", { 0: group.name })}
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
              {t("No projects yet")}
            </p>
          )}
        </div>
      )}
      {[
        { path: "/processes", label: t("Processes"), icon: Activity },
        { path: "/ports", label: t("Ports"), icon: Network },
        { path: "/stats", label: t("Stats"), icon: BarChart3 },
        { path: "/utilities", label: t("Utilities"), icon: Sparkles },
      ].map(({ path, label, icon: Icon }) => (
        <Link
          key={path}
          to={path}
          aria-label={label}
          title={collapsed ? label : undefined}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2",
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
        <h6 className="mb-1 mt-7 px-3 text-muted-foreground">{t("System")}</h6>
      )}
      {[
        { path: "/hosts", label: "Hosts", icon: Globe },
        { path: "/config-files", label: t("Config Files"), icon: Files },
      ].map(({ path, label, icon: Icon }) => (
        <Link
          key={path}
          to={path}
          aria-label={label}
          title={collapsed ? label : undefined}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2",
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
          <h6 className="mb-2 px-3 text-muted-foreground">
            {t("Preferences")}
          </h6>
        )}
        <Link
          to="/settings"
          aria-label={t("Settings")}
          title={collapsed ? t("Settings") : undefined}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2",
            collapsed && "justify-center px-0",
            state.pathname === "/settings"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-muted",
          )}
        >
          <Settings2 className="size-4" />
          <span className={collapsed ? "sr-only" : undefined}>
            {t("Settings")}
          </span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              aria-label={t("Theme: {0}", { 0: t(state.theme.theme) })}
              title={t("Theme: {0}", { 0: t(state.theme.theme) })}
              className={cn(
                "layout-theme-trigger h-10 w-full justify-start gap-3 rounded-md px-3 text-sidebar-foreground",
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
                {t(state.theme.theme)}
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
            className="layout-theme-menu min-w-44 rounded-md p-1.5"
          >
            <DropdownMenuRadioGroup
              value={state.theme.theme}
              onValueChange={state.selectTheme}
            >
              <DropdownMenuRadioItem value="light">
                <Sun />
                {t("Light")}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <Moon />
                {t("Dark")}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <Monitor />
                {t("System")}
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
        <div className="layout-sidebar-brand flex h-[50px] shrink-0 items-center justify-center border-b border-header-border bg-header px-4 text-header-foreground">
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
        <header className="layout-header flex h-[50px] shrink-0 items-center justify-between gap-4 border-b border-header-border bg-header px-5 text-header-foreground">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={
                state.collapsed ? t("Expand sidebar") : t("Collapse sidebar")
              }
              aria-expanded={!state.collapsed}
              aria-controls="desktop-sidebar"
              title={
                state.collapsed ? t("Expand sidebar") : t("Collapse sidebar")
              }
              onClick={state.toggleCollapsed}
              className="layout-sidebar-toggle hidden text-header-muted hover:bg-header-border hover:text-header-foreground lg:inline-flex"
            >
              {state.collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            </Button>
            <Button
              className="text-header-muted hover:bg-header-border hover:text-header-foreground lg:hidden"
              variant="ghost"
              size="icon-sm"
              aria-label={t("Open navigation")}
              onClick={() => state.setMobileOpen(true)}
            >
              <Menu />
            </Button>
            <span className="truncate text-sm text-header-muted">
              {state.workspace.data?.deviceName ?? t("Local workspace")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-header-muted sm:block">
              {state.cloud.data?.account?.email ?? t("Local mode")}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("Open settings")}
              onClick={state.openSettings}
              className="text-header-muted hover:bg-header-border hover:text-header-foreground"
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
