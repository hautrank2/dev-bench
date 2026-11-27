import { Link } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronRight,
  Menu,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  Sun,
} from "lucide-react";

import { CommitDialog } from "~/app/_projects/_components/commit-dialog";
import { GroupFormDialog } from "~/app/_projects/_components/group-form";
import { ProjectFormDialog } from "~/app/_projects/_components/project-form";
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
import { MessageCenter } from "./message-center";
import { ProjectTree } from "./project-tree";
import { SidebarIcon } from "./sidebar-icon";
import type { AppLayoutProps } from "./type";

export const AppLayout = (props: AppLayoutProps) => {
  const { t } = useLocale();

  const state = useAppLayout(props);
  const brand = (collapsed = false) => (
    <Link
      to="/projects"
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
      <div
        className={cn(
          "flex items-center rounded-md",
          state.pathname.startsWith("/projects")
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-primary/10",
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
          <SidebarIcon
            name="projects"
            active={state.pathname.startsWith("/projects")}
          />
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
            className={
              state.pathname.startsWith("/projects")
                ? "text-inherit hover:bg-sidebar-foreground/10 hover:text-inherit dark:hover:bg-sidebar-foreground/10"
                : undefined
            }
          >
            {state.projectsOpen ? <ChevronDown /> : <ChevronRight />}
          </Button>
        )}
      </div>
      {!collapsed && state.projectsOpen && (
        <ProjectTree
          groups={state.workspace.data?.groups ?? []}
          repositories={state.repositories.data ?? []}
          pathname={state.pathname}
          expanded={state.expanded}
          onToggle={state.toggleProject}
          onExpand={state.expandProject}
          onEditProject={state.editGroup}
          onEditRepository={state.editRepository}
          onAddRepository={state.addRepository}
          onCommit={state.commitRepository}
        />
      )}
      {(
        [
          { path: "/ports", label: t("Ports"), icon: "ports" },
          { path: "/stats", label: t("Stats"), icon: "stats" },
          { path: "/utilities", label: t("Utilities"), icon: "utilities" },
        ] as const
      ).map(({ path, label, icon }) => (
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
              : "text-sidebar-foreground hover:bg-primary/10",
          )}
        >
          <SidebarIcon name={icon} active={state.pathname === path} />
          <span className={collapsed ? "sr-only" : undefined}>{label}</span>
        </Link>
      ))}
      {collapsed ? (
        <div className="my-3 border-t" />
      ) : (
        <h6 className="mb-1 mt-7 px-3 text-muted-foreground">{t("System")}</h6>
      )}
      {(
        [
          { path: "/hosts", label: "Hosts", icon: "hosts" },
          {
            path: "/config-files",
            label: t("Config Files"),
            icon: "config-files",
          },
        ] as const
      ).map(({ path, label, icon }) => (
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
              : "text-sidebar-foreground hover:bg-primary/10",
          )}
        >
          <SidebarIcon name={icon} active={state.pathname === path} />
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
              : "text-sidebar-foreground hover:bg-primary/10",
          )}
        >
          <SidebarIcon
            name="settings"
            active={state.pathname === "/settings"}
          />
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
                "hover:bg-primary/10 dark:hover:bg-primary/10",
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
          "layout-sidebar relative z-10 hidden shrink-0 flex-col border-r bg-sidebar shadow-sidebar lg:flex",
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
            <MessageCenter />
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
        <SheetContent
          side="left"
          className="w-72 gap-3 overflow-y-auto p-4 shadow-sidebar"
        >
          <SheetHeader className="p-0">
            <SheetTitle asChild>{brand()}</SheetTitle>
          </SheetHeader>
          {navigation()}
        </SheetContent>
      </Sheet>
      {state.editingGroup && (
        <GroupFormDialog
          key={state.editingGroup.id}
          open
          isEdit
          defaultValues={state.editingGroup}
          onSubmit={state.saveGroup}
          onOpenChange={(open) => {
            if (!open) state.closeGroupEditor();
          }}
        />
      )}
      {state.repositoryEditor &&
        (!state.repositoryEditor.id || state.editingRepository) && (
          <ProjectFormDialog
            key={
              state.repositoryEditor.id ??
              `new-${state.repositoryEditor.groupId}`
            }
            open
            isEdit={!!state.editingRepository}
            groups={state.workspace.data?.groups}
            defaultValues={
              state.editingRepository ?? {
                groupId: state.repositoryEditor.groupId,
                name: "",
                folder: "",
                command: "",
                url: "",
                includeInRunAll: true,
              }
            }
            focusField={state.repositoryEditor.focusField}
            executionLocked={state.editingRepositoryActive}
            onSubmit={state.saveRepository}
            onOpenChange={(open) => {
              if (!open) state.closeRepositoryEditor();
            }}
          />
        )}
      {state.committingRepository && (
        <CommitDialog
          project={state.committingRepository}
          open
          onOpenChange={(open) => {
            if (!open) state.closeCommit();
          }}
        />
      )}
    </div>
  );
};
