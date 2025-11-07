const { Command } = require("commander");
const http = require("http");
const fs = require("fs/promises");
const path = require("path");

const program = new Command();

program
  .requiredOption("-h, --host <host>", "Host address")
  .requiredOption("-p, --port <port>", "Port number")
  .requiredOption("-c, --cache <path>", "Cache directory path");

program.parse(process.argv);
const options = program.opts();

const cacheDir = path.resolve(options.cache);

fs.mkdir(cacheDir, { recursive: true })
  .then(() => {
    const server = http.createServer(async (req, res) => {
      const method = req.method;
      const code = req.url.slice(1); // Наприклад, "/200" → "200"
      const filePath = path.join(cacheDir, `${code}.jpg`);

      if (method === "GET") {
        try {
          const image = await fs.readFile(filePath);
          res.writeHead(200, { "Content-Type": "image/jpeg" });
          res.end(image);
        } catch (err) {
          if (err.code === "ENOENT") {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Not Found\n");
          } else {
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Internal Server Error\n");
          }
        }
      } else {
        res.writeHead(405, { "Content-Type": "text/plain" });
        res.end("Method Not Allowed\n");
      }
    });

    server.listen(options.port, options.host, () => {
      console.log(`✅ Server running at http://${options.host}:${options.port}/`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to create cache directory:", err);
  });
