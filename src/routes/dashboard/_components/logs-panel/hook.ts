import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { projectsApi } from "~/api/api-list/projects";
import { useTheme } from "~/providers/theme/context";

import type { UseLogsPanelProps } from "./type";

export const useLogsPanel = (props: UseLogsPanelProps) => {
  const { terminalTheme } = useTheme();
  const query = useQuery({
    queryKey: ["logs", props.project.id],
    queryFn: () => projectsApi.logs(props.project.id),
    enabled: props.open,
    refetchInterval: 800,
  });
  const [follow, setFollow] = useState(true);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (follow) end.current?.scrollIntoView({ block: "end" });
  }, [query.data, follow]);
  return { query, follow, setFollow, end, terminalTheme };
};
