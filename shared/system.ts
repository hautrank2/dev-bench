export type PortListener = {
  pid: number;
  address: string;
  ownerRepositoryId?: string;
  processName: string;
};
export type PortRecord = {
  id: string;
  port: number;
  repositoryId?: string;
  groupId?: string;
  projectName: string;
  repositoryName: string;
  source: "Configured" | "Detected" | "System";
  status: "Listening" | "Available" | "Conflict";
  listeners: PortListener[];
};
export type ToolInfo = {
  name: string;
  available: boolean;
  version: string;
  error?: string;
};
export type SystemInfo = {
  platform: string;
  hostname: string;
  arch: string;
  tools: ToolInfo[];
};
export type HostsInfo = { file: string; content: string };
export type ConfigFileInfo = {
  repositoryId: string;
  repositoryName: string;
  fileName: string;
  path: string;
  size: number;
};
