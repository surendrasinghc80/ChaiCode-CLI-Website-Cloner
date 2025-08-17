import express from "express";
import { spawn } from "child_process";

function openUrl(url) {
  try {
    if (process.platform === "win32") {
      // Windows: use start via cmd
      spawn("cmd", ["/c", "start", '""', url], {
        detached: true,
        stdio: "ignore",
      });
    } else if (process.platform === "darwin") {
      spawn("open", [url], { detached: true, stdio: "ignore" });
    } else {
      spawn("xdg-open", [url], { detached: true, stdio: "ignore" });
    }
  } catch (e) {
    // best-effort; ignore
  }
}

export async function startServer({ root, port = 4173, openBrowser = false }) {
  const app = express();
  app.use((req, _res, next) => {
    if (req.url === "/") req.url = "/index.html";
    next();
  });
  app.use(express.static(root, { extensions: ["html"] }));
  const server = await new Promise((resolve) => {
    const s = app.listen(port, () => resolve(s));
  });
  const url = `http://localhost:${port}/`;
  if (openBrowser) {
    try {
      openUrl(url);
    } catch {}
  }
  process.on("SIGINT", () => server.close(() => process.exit(0)));
  console.log(`Serving ${root} at ${url}`);
}
