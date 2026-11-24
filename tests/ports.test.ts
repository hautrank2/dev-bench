import { describe, expect, it } from "vitest";

import { mapPorts } from "../electron/services/inspector";
import { projectAt } from "./helpers";

describe("TCP port ownership", () => {
  it("maps descendant PIDs, configured ports, conflicts and unmanaged listeners", () => {
    const web = {
      ...projectAt("D:\\Web", { url: "http://localhost:3000" }),
      runtime: { status: "Running" as const, pid: 100 },
      git: {},
    };
    const api = {
      ...projectAt("D:\\API", { url: "http://localhost:3003" }),
      runtime: { status: "Stopped" as const },
      git: {},
    };
    const empty = {
      ...projectAt("D:\\Worker", { url: "http://localhost:4000" }),
      runtime: { status: "Stopped" as const },
      git: {},
    };
    const network = {
      processes: [
        { pid: 100, ppid: 1, name: "cmd" },
        { pid: 101, ppid: 100, name: "pnpm" },
        { pid: 102, ppid: 101, name: "node" },
        { pid: 555, ppid: 1, name: "external" },
      ],
      listeners: [
        { pid: 102, port: 3000, address: "127.0.0.1" },
        { pid: 102, port: 4100, address: "::" },
        { pid: 555, port: 3003, address: "127.0.0.1" },
        { pid: 555, port: 9000, address: "0.0.0.0" },
      ],
    };
    const ports = mapPorts(network, [web, api, empty], []);
    expect(ports.find((port) => port.port === 3000)).toMatchObject({
      status: "Listening",
      repositoryId: web.id,
    });
    expect(ports.find((port) => port.port === 3003)).toMatchObject({
      status: "Conflict",
      repositoryId: api.id,
    });
    expect(ports.find((port) => port.port === 4000)?.status).toBe("Available");
    expect(ports.find((port) => port.port === 4100)).toMatchObject({
      source: "Detected",
      repositoryId: web.id,
    });
    expect(ports.find((port) => port.port === 9000)?.source).toBe("System");
  });
});
