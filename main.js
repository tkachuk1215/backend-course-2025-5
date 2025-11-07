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
    console.log(`✅ Cache directory: ${cacheDir}`);

    const server = http.createServer(async (req, res) => {
      const code = req.url.slice(1);
      const filePath = path.join(cacheDir, `${code}.jpg`);

      try {
        // GET — отримати зображення
        if (req.method === "GET") {
          const data = await fs.readFile(filePath);
          res.writeHead(200, { "Content-Type": "image/jpeg" });
          res.end(data);
        }

        // PUT — зберегти або замінити зображення
        else if (req.method === "PUT") {
          const chunks = [];
          req.on("data", (chunk) => chunks.push(chunk));
          req.on("end", async () => {
            const body = Buffer.concat(chunks);
            await fs.writeFile(filePath, body);
            res.writeHead(201, { "Content-Type": "text/plain" });
            res.end("Image saved successfully\n");
          });
        }

        // Якщо метод не підтримується
        else {
          res.writeHead(405, { "Content-Type": "text/plain" });
          res.end("Method Not Allowed\n");
        }
      } catch (err) {
        if (err.code === "ENOENT") {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Not Found\n");
        } else {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Internal Server Error\n");
        }
      }
    });

    server.listen(options.port, options.host, () => {
      console.log(`🚀 Server running at http://${options.host}:${options.port}/`);
    });
  })
  .catch((err) => console.error("❌ Cache dir error:", err));
