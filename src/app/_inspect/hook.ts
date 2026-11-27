import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { projectsApi } from "~/api/api-list/projects";
import { useActionNotify } from "~/hooks/useActionNotify";

import type { UseInspectProps } from "./type";

export const useInspect = (props: UseInspectProps) => {
  const report = useActionNotify();
  const [search, setSearch] = useState("");
  const [showSystem, setShowSystem] = useState(false);
  const workspace = useQuery({
    queryKey: ["workspace"],
    queryFn: projectsApi.workspace,
  });
  const repositories = useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.list,
  });
  const ports = useQuery({
    queryKey: ["ports", workspace.data?.activeSetId],
    queryFn: projectsApi.ports,
    enabled: props.kind === "ports",
    refetchInterval: 10000,
  });
  const system = useQuery({
    queryKey: ["system"],
    queryFn: projectsApi.systemInfo,
    enabled: props.kind === "utilities",
  });
  const hosts = useQuery({
    queryKey: ["hosts"],
    queryFn: projectsApi.hosts,
    enabled: props.kind === "hosts",
  });
  const files = useQuery({
    queryKey: ["config-files", workspace.data?.activeSetId],
    queryFn: projectsApi.configFiles,
    enabled: props.kind === "config-files",
  });
  const refresh = () => {
    void repositories.refetch();
    if (props.kind === "ports") void ports.refetch();
    if (props.kind === "utilities") void system.refetch();
    if (props.kind === "hosts") void hosts.refetch();
    if (props.kind === "config-files") void files.refetch();
  };
  return {
    workspace,
    repositories,
    ports,
    system,
    hosts,
    files,
    search,
    setSearch,
    showSystem,
    setShowSystem,
    refresh,
    filteredPorts:
      ports.data?.filter(
        (port) =>
          (showSystem || port.source !== "System") &&
          `${port.port} ${port.projectName} ${port.repositoryName}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ) ?? [],
    filteredFiles:
      files.data?.filter((file) =>
        `${file.repositoryName} ${file.fileName} ${file.path}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ) ?? [],
    openFile: async (repositoryId: string, fileName: string) => {
      try {
        await projectsApi.openConfigFile({ repositoryId, fileName });
      } catch (error) {
        report.error("Could not open the file", error);
      }
    },
  };
};
