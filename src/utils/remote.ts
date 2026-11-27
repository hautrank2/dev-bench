import { FolderGit2, Github, Gitlab } from "lucide-react";

import type { GitRemoteWeb } from "@shared/contracts";

/** English label (translate at the call site) and icon per remote host. */
export const REMOTE_LINKS = {
  github: { label: "Open GitHub", Icon: Github },
  gitlab: { label: "Open GitLab", Icon: Gitlab },
  other: { label: "Open repository", Icon: FolderGit2 },
} satisfies Record<GitRemoteWeb["provider"], object>;
