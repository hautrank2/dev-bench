import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { Appearance, ImportPreview } from "@shared/workspace";
import { projectsApi } from "~/api/api-list/projects";
import { useLocale } from "~/providers/locale/context";
import { useTheme } from "~/providers/theme/context";

import { serverFormSchema, setFormSchema, type UseSettingsProps } from "./type";

export const useSettings = (_props: UseSettingsProps) => {
  const { t } = useLocale();

  const theme = useTheme();
  const client = useQueryClient();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [restoreAppearance, setRestoreAppearance] = useState(false);
  const [section, setSection] = useState("language");
  const workspace = useQuery({
    queryKey: ["workspace"],
    queryFn: projectsApi.workspace,
  });
  const cloud = useQuery({
    queryKey: ["cloud-status"],
    queryFn: projectsApi.cloudStatus,
    refetchInterval: (query) => (query.state.data?.signingIn ? 1500 : false),
  });
  const backups = useQuery({
    queryKey: ["backups", cloud.data?.apiUrl, cloud.data?.account?.id],
    queryFn: projectsApi.cloudBackups,
    enabled: !!cloud.data?.account,
  });
  const serverForm = useForm({
    resolver: zodResolver(serverFormSchema),
    defaultValues: { apiUrl: "" },
  });
  const setForm = useForm({
    resolver: zodResolver(setFormSchema),
    defaultValues: { name: "" },
  });
  useEffect(() => {
    if (cloud.data?.apiUrl && !serverForm.formState.isDirty)
      serverForm.reset({ apiUrl: cloud.data.apiUrl });
  }, [cloud.data?.apiUrl, serverForm]);
  useEffect(() => {
    try {
      return projectsApi.subscribe(() => {
        void client.invalidateQueries({ queryKey: ["workspace"] });
        void client.invalidateQueries({ queryKey: ["cloud-status"] });
      });
    } catch {
      return undefined;
    }
  }, [client]);
  const appearance: Appearance = {
    theme: theme.theme,
    terminalTheme: theme.terminalTheme,
  };
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["workspace"] }),
      client.invalidateQueries({ queryKey: ["projects"] }),
      client.invalidateQueries({ queryKey: ["cloud-status"] }),
      client.invalidateQueries({ queryKey: ["backups"] }),
    ]);
  };
  const perform = async (
    key: string,
    action: () => Promise<unknown>,
    success?: string,
  ) => {
    if (busy) return;
    setBusy(key);
    setError("");
    try {
      await action();
      if (success) toast.success(success);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
    } finally {
      setBusy("");
      await refresh();
    }
  };
  const saveServer = serverForm.handleSubmit(async ({ apiUrl }) => {
    await perform(
      "server",
      async () => {
        await projectsApi.configureCloud(apiUrl);
        serverForm.reset({ apiUrl });
      },
      t("Backup server saved"),
    );
  });
  const createSet = setForm.handleSubmit(async ({ name }) => {
    await perform(
      "create",
      async () => {
        await projectsApi.createSet(name);
        setForm.reset({ name: "" });
      },
      t("Project set created"),
    );
  });
  const renameSet = setForm.handleSubmit(async ({ name }) => {
    await perform(
      "rename",
      async () => {
        await projectsApi.renameSet(name);
        setForm.reset({ name: "" });
      },
      t("Project set renamed"),
    );
  });
  const importFile = () =>
    perform("import-file", async () => {
      const result = await projectsApi.previewImport();
      setPreview(result);
      setRestoreAppearance(false);
    });
  const restore = (id: string) =>
    perform("restore", async () => {
      setPreview(await projectsApi.previewRestore(id));
      setRestoreAppearance(false);
    });
  const confirmImport = () =>
    perform(
      "confirm-import",
      async () => {
        await projectsApi.confirmImport();
        if (restoreAppearance && preview) {
          theme.setTheme(preview.snapshot.appearance.theme);
          theme.setTerminalTheme(preview.snapshot.appearance.terminalTheme);
        }
        setPreview(null);
      },
      t("Configuration imported as a new project set"),
    );
  return {
    theme,
    workspace,
    cloud,
    backups,
    serverForm,
    setForm,
    saveServer,
    createSet,
    renameSet,
    busy,
    error,
    preview,
    setPreview,
    restoreAppearance,
    setRestoreAppearance,
    perform,
    importFile,
    restore,
    confirmImport,
    section,
    scrollTo: (id: string) => {
      setSection(id);
      document
        .getElementById(`settings-${id}`)
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
    },
    exportFile: () =>
      perform("export", async () => {
        const file = await projectsApi.exportSet(appearance);
        if (file)
          toast.success(t("Project set exported"), { description: file });
      }),
    signIn: () =>
      perform(
        "sign-in",
        () => projectsApi.signIn(),
        t("Signed in with Google"),
      ),
    cancelSignIn: async () => {
      await projectsApi.cancelSignIn();
      await cloud.refetch();
    },
    signOut: () =>
      perform("sign-out", () => projectsApi.signOut(), t("Signed out")),
    selectSet: (id: string) =>
      perform("select-set", () => projectsApi.selectSet(id)),
    backup: () =>
      perform(
        "backup",
        () => projectsApi.backupSet(appearance),
        t("Project set backed up"),
      ),
  };
};
