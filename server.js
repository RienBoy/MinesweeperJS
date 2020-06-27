const http = require("http");
const fs = require("fs").promises;
const url = require("url");
const netinfs = require("os").networkInterfaces();

const port = 8080;

const associations = {
  html: "text/html",
  css: "text/css",
  js: "text/javascript",
  png: "image/png",
  json: "application/json",
  ico: "image/vnd.microsoft.icon",
};

http
  .createServer((req, res) => {
    const pathname = url.parse(req.url, true).pathname;

    if (req.method == "POST") {
      console.log("POST " + pathname);
      var body = "";
      req.on("data", (data) => {
        body += data;
      });
      req.on("end", () => {
        fs.readFile("." + pathname)
          .then((data) => {
            var highscores = JSON.parse(data);
            const new_highscores = JSON.parse(body);
            for (let difficulty of ["beginner", "intermediate", "expert"]) {
              if (
                new_highscores[difficulty].score < highscores[difficulty].score
              ) {
                highscores[difficulty].score = new_highscores[difficulty].score;
                highscores[difficulty].name = new_highscores[difficulty].name;
              }
            }
            body = JSON.stringify(highscores);
            fs.writeFile("." + pathname, body);
          })
          .then(() => {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.write(body);
            body = "";
            return res.end();
          });
      });
      return;
    }

    if (pathname === "/") {
      // index.html
      fs.readFile("index.html")
        .then((data) => {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.write(data);
          res.end();
        })
        .catch((err) => {
          console.log(err);
          res.writeHead(404, { "Content-Type": "text/html" });
          res.end("Not Found");
        });
      return;
    }
    const extension = pathname.slice(pathname.lastIndexOf(".") + 1);
    console.log("GET " + pathname + " " + extension);
    fs.readFile("." + pathname)
      .then((data) => {
        res.writeHead(200, { "Content-Type": associations[extension] });
        res.write(data);
        res.end();
      })
      .catch((err) => {
        console.log(err);
        res.writeHead(404);
        res.end();
      });
  })
  .listen(port);

console.log("Server running on:");
console.log(" - localhost:" + port);
for (let interface in netinfs) {
  for (let ip of netinfs[interface]) {
    if (ip.family === "IPv4") {
      console.log(" - " + ip.address + ":" + port);
    }
  }
}
