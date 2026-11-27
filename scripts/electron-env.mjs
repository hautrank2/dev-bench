import { loadEnv } from "vite";

export const electronEnvDefines = (mode) => {
  const env = loadEnv(mode, process.cwd(), "DEV_BENCH_API_ORIGIN");
  const configured = env.DEV_BENCH_API_ORIGIN?.trim() ?? "";
  let origin = "";
  if (configured) {
    let url;
    try {
      url = new URL(configured);
    } catch {
      throw new Error(
        "DEV_BENCH_API_ORIGIN must be an HTTPS origin, or HTTP localhost for development.",
      );
    }
    if (
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/" ||
      !(
        url.protocol === "https:" ||
        (url.protocol === "http:" &&
          ["localhost", "127.0.0.1"].includes(url.hostname))
      )
    ) {
      throw new Error(
        "DEV_BENCH_API_ORIGIN must be an HTTPS origin, or HTTP localhost for development.",
      );
    }
    origin = url.origin;
  }
  return { "process.env.DEV_BENCH_API_ORIGIN": JSON.stringify(origin) };
};
