import { spawn } from "node:child_process";
import readline from "node:readline";

const child = spawn("node", ["server.js"], { stdio: ["pipe", "pipe", "inherit"] });
const send = (msg) => child.stdin.write(JSON.stringify(msg) + "\n");

readline.createInterface({ input: child.stdout }).on("line", (line) => {
  const msg = JSON.parse(line);
  console.log("\n<-- response id", msg.id);
  console.log(JSON.stringify(msg.result ?? msg.error, null, 2));
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const call = (id, name, args) =>
  send({ jsonrpc: "2.0", id, method: "tools/call", params: { name, arguments: args } });

send({
  jsonrpc: "2.0", id: 1, method: "initialize",
  params: {
    protocolVersion: "2025-11-25",
    capabilities: {},
    clientInfo: { name: "test-client", version: "0.0.1" },
  },
});
await wait(800);
send({ jsonrpc: "2.0", method: "notifications/initialized" });
send({ jsonrpc: "2.0", id: 2, method: "tools/list" });
call(3, "search_tickets", { status: "open", priority: "high" });
call(4, "create_ticket", { title: "Test ticket from client", priority: "low" });
call(5, "update_ticket_status", { id: 999, status: "closed" });
call(6, "create_ticket", { title: "ab" });
await wait(1500);
child.kill();