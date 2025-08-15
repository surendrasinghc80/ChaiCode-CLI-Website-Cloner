import express from "express";
import open from "open";

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
      await open(url);
    } catch {}
  }
  process.on("SIGINT", () => server.close(() => process.exit(0)));
  console.log(`Serving ${root} at ${url}`);
}
