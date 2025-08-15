import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { crawlAndClone } from "../src/crawler.js";
import { startServer } from "../src/server.js";

const argv = yargs(hideBin(process.argv))
  .scriptName("siteclone")
  .usage("$0 <url> [options]")
  .positional("url", { describe: "Website URL to clone", type: "string" })
  .option("out", {
    alias: "o",
    describe: "Output directory",
    type: "string",
    default: "dist/site",
  })
  .option("max-pages", {
    describe: "Max number of pages to crawl",
    type: "number",
    default: 100,
  })
  .option("same-origin", {
    describe: "Only download same-origin assets",
    type: "boolean",
    default: true,
  })
  .option("concurrency", {
    describe: "Download concurrency",
    type: "number",
    default: 10,
  })
  .option("timeout", {
    describe: "HTTP timeout (ms)",
    type: "number",
    default: 20000,
  })
  .option("respect-robots", {
    describe: "Respect robots.txt (best effort)",
    type: "boolean",
    default: true,
  })
  .option("serve", {
    describe: "Start a local HTTP server on port",
    type: "number",
  })
  .option("open", {
    describe: "Open default browser after serving",
    type: "boolean",
    default: false,
  })
  .example(
    "$0 https://code.visualstudio.com --out dist/vscode --max-pages 50 --serve 4173 --open",
    "Clone VS Code site and serve locally"
  )
  .demandCommand(1)
  .help().argv;

const url = argv._[0];
const outDir = path.resolve(argv.out);

await crawlAndClone({
  startUrl: url,
  outDir,
  maxPages: argv["max-pages"],
  sameOriginOnly: argv["same-origin"],
  concurrency: argv.concurrency,
  timeout: argv.timeout,
  respectRobots: argv["respect-robots"],
});

if (argv.serve) {
  const port = argv.serve;
  await startServer({ root: outDir, port, openBrowser: argv.open });
}
