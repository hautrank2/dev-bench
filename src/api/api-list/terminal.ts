import type {
  ShellEvent,
  ShellOpenRequest,
  ShellResizeRequest,
  ShellWriteRequest,
} from "@shared/terminal";

import { bridge, unwrap } from "./projects";

export const terminalApi = {
  open: (request: ShellOpenRequest) => unwrap(bridge().shellOpen(request)),
  write: (request: ShellWriteRequest) => unwrap(bridge().shellWrite(request)),
  resize: (request: ShellResizeRequest) =>
    unwrap(bridge().shellResize(request)),
  subscribe: (listener: (event: ShellEvent) => void) =>
    bridge().onShellEvent(listener),
};
