import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";
import db from "./db.js";

const server = new McpServer({ name: "helpdesk-server", version: "1.0.0" });

// 1. A read-only tool
server.registerTool(
  "search_tickets",
  {
    description: "Search support tickets. Optionally filter by status or priority.",
    inputSchema: z.object({
      status: z.enum(["open", "in_progress", "closed"]).optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      limit: z.number().int().min(1).max(50).default(10),
    }),
    annotations: { readOnlyHint: true },
  },
  async ({ status, priority, limit }) => {
    const rows = db
      .prepare(
        `SELECT id, title, status, priority FROM tickets
         WHERE (? IS NULL OR status = ?) AND (? IS NULL OR priority = ?)
         ORDER BY id DESC LIMIT ?`
      )
      .all(status ?? null, status ?? null, priority ?? null, priority ?? null, limit);

    return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] };
  }
);

// 2. A write tool
server.registerTool(
  "create_ticket",
  {
    description: "Create a new support ticket.",
    inputSchema: z.object({
      title: z.string().min(3).max(120),
      priority: z.enum(["low", "medium", "high"]).default("medium"),
    }),
  },
  async ({ title, priority }) => {
    const info = db
      .prepare("INSERT INTO tickets (title, priority) VALUES (?, ?)")
      .run(title, priority);
    return { content: [{ type: "text", text: `Created ticket #${info.lastInsertRowid}` }] };
  }
);

// 3. A tool that reports errors the model can understand
server.registerTool(
  "update_ticket_status",
  {
    description: "Change the status of an existing ticket.",
    inputSchema: z.object({
      id: z.number().int().positive(),
      status: z.enum(["open", "in_progress", "closed"]),
    }),
  },
  async ({ id, status }) => {
    const info = db.prepare("UPDATE tickets SET status = ? WHERE id = ?").run(status, id);
    if (info.changes === 0) {
      return { isError: true, content: [{ type: "text", text: `No ticket found with id ${id}` }] };
    }
    return { content: [{ type: "text", text: `Ticket #${id} is now ${status}` }] };
  }
);

await server.connect(new StdioServerTransport());
console.error("helpdesk-server running on stdio");