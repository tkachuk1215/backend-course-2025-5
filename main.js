const { Command } = require("commander");
const http = require("http");
const fs = require("fs/promises");
const path = require("path");

// ---------- 1. Налаштування командного рядка ----------
const program = new Command();

program
  .requiredOption("-h, --host <host>", "Host address")
  .requiredOption("-p, --port <port>", "Port number")
  .requiredOption("-c, --cache <path>", "Cache directory path");

program.parse(process.argv);
const options = program.opts();

// ---------- 2. Створення директорії кешу ----------
const cacheDir = path.resolve(options.cache);
fs.mkdir(cacheDir, { recursive: true })
  .then(() => {
    console.log("Host:", options.host);
    console.log("Port:", options.port);
    console.log("Cache directory:", cacheDir);

    // ---------- 3. Запуск простого веб-сервера ----------
    const server = http.createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Proxy server is running. Use further steps to implement caching.\n");
    });

    server.listen(options.port, options.host, () => {
      console.log(`✅ Server is running at http://${options.host}:${options.port}/`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to create cache directory:", err);
  });
