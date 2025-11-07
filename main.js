const { Command } = require("commander");
const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const superagent = require("superagent");

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

      if (req.method === "GET") {
        // Функція для відправки картинки
        const sendImage = (buffer) => {
          res.writeHead(200, { "Content-Type": "image/jpeg" });
          res.end(buffer);
        };

        // Перевіряємо кеш
        try {
          const data = await fs.readFile(filePath);
          return sendImage(data);
        } catch (err) {
          if (err.code !== "ENOENT") {
            res.writeHead(500, { "Content-Type": "text/plain" });
            return res.end("Internal Server Error\n");
          }
          // Якщо немає файлу в кеші — запитуємо http.cat
          try {
            const response = await superagent.get(`https://http.cat/${code}`).responseType("buffer");
            const buffer = Buffer.from(response.body);
            await fs.writeFile(filePath, buffer); // кешуємо
            return sendImage(buffer);
          } catch (err) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            return res.end("Not Found\n");
          }
        }
      }

      // --- PUT ---
      else if (req.method === "PUT") {
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", async () => {
          const body = Buffer.concat(chunks);
          await fs.writeFile(filePath, body);
          res.writeHead(201, { "Content-Type": "text/plain" });
          res.end("✅ Image saved successfully\n");
        });
      }

      // --- DELETE ---
      else if (req.method === "DELETE") {
        try {
          await fs.unlink(filePath);
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("🗑️ Image deleted successfully\n");
        } catch (err) {
          if (err.code === "ENOENT") {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Not Found\n");
          } else {
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Internal Server Error\n");
          }
        }
      }

      // --- Інші методи ---
      else {
        res.writeHead(405, { "Content-Type": "text/plain" });
        res.end("Method Not Allowed\n");
      }
    });

    server.listen(options.port, options.host, () => {
      console.log(`🚀 Server running at http://${options.host}:${options.port}/`);
    });
  })
  .catch((err) => console.error("❌ Cache dir error:", err));
