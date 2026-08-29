const { exec } = require("child_process");

const url = "http://localhost:3000/login";

console.log("");
console.log("Starting Next.js development server...");
console.log("");

const next = exec("npx next dev");

next.stdout.pipe(process.stdout);
next.stderr.pipe(process.stderr);

let browserOpened = false;

function checkServer() {
  exec(
    'curl -I -s -o NUL -w "%{http_code}" http://localhost:3000',
    (error, stdout) => {
      if (!error && stdout.trim()) {
        if (!browserOpened) {
          browserOpened = true;

          console.log("");
          console.log(`Opening ${url}`);
          console.log("");

          exec(`start "" "${url}"`);
        }

        return;
      }

      setTimeout(checkServer, 1000);
    }
  );
}

setTimeout(checkServer, 1500);

next.on("exit", (code) => {
  process.exit(code ?? 0);
});

process.on("SIGINT", () => {
  next.kill();
  process.exit();
});