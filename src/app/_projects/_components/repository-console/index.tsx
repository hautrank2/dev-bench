import { ScrollText, SquareTerminal } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useLocale } from "~/providers/locale/context";

import { LogsPanel } from "../logs-panel";
import { TerminalPanel } from "../terminal-panel";
import type { RepositoryConsoleProps } from "./type";

export const RepositoryConsole = (props: RepositoryConsoleProps) => {
  const { t } = useLocale();
  return (
    <Tabs defaultValue="logs" className="repository-console gap-3">
      <TabsList aria-label={t("Repository output")}>
        <TabsTrigger value="logs">
          <ScrollText />
          {t("Logs")}
        </TabsTrigger>
        <TabsTrigger value="terminal">
          <SquareTerminal />
          Terminal
        </TabsTrigger>
      </TabsList>
      <TabsContent value="logs">
        <LogsPanel project={props.project} open inline />
      </TabsContent>
      <TabsContent value="terminal">
        <TerminalPanel project={props.project} />
      </TabsContent>
    </Tabs>
  );
};
