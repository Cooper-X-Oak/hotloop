import { spawn, type ChildProcess } from "node:child_process";

const commands = [
  { name: "server", args: ["--workspace", "apps/server", "run", "dev:demo"] },
  { name: "web", args: ["--workspace", "apps/web", "run", "dev"] }
];

const children: ChildProcess[] = [];

for (const command of commands) {
  const child = spawn("npm", command.args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      HOTLOOP_REPO_ROOT: process.cwd()
    }
  });
  children.push(child);

  child.on("exit", (code) => {
    if (code && code !== 0) {
      stopAll();
      process.exit(code);
    }
  });
}

console.log("HotLoop demo runtime starting...");
console.log("Server: http://127.0.0.1:8787");
console.log("Web:    http://127.0.0.1:5173");

process.on("SIGINT", () => {
  stopAll();
  process.exit(0);
});

process.on("SIGTERM", () => {
  stopAll();
  process.exit(0);
});

function stopAll() {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
}
