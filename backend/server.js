const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { randomUUID } = require("crypto");

const app = express();
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const tasks = new Map();

app.post("/test/reset", (_req, res) => {
  tasks.clear();
  io.emit("sync:tasks", []);
  res.json({ ok: true });
});

const COLUMNS = ["todo", "in-progress", "done"];

function getAllTasks() {
  return Array.from(tasks.values());
}

function broadcastTasks() {
  io.emit("sync:tasks", getAllTasks());
}

io.on("connection", (socket) => {
  console.log("A user connected");
  socket.emit("sync:tasks", getAllTasks());

  socket.on("task:create", (taskData, callback) => {
    const task = {
      id: randomUUID(),
      title: taskData.title || "Untitled Task",
      description: taskData.description || "",
      column: COLUMNS.includes(taskData.column) ? taskData.column : "todo",
      priority: taskData.priority || "Medium",
      category: taskData.category || "Feature",
      attachments: taskData.attachments || [],
    };
    tasks.set(task.id, task);
    io.emit("task:create", task);
    if (typeof callback === "function") callback({ success: true, task });
  });

  socket.on("task:update", (taskData, callback) => {
    const existing = tasks.get(taskData.id);
    if (!existing) {
      if (typeof callback === "function") callback({ success: false, error: "Task not found" });
      return;
    }
    const updated = {
      ...existing,
      title: taskData.title ?? existing.title,
      description: taskData.description ?? existing.description,
      priority: taskData.priority ?? existing.priority,
      category: taskData.category ?? existing.category,
      attachments: taskData.attachments ?? existing.attachments,
    };
    tasks.set(updated.id, updated);
    io.emit("task:update", updated);
    if (typeof callback === "function") callback({ success: true, task: updated });
  });

  socket.on("task:move", (taskData, callback) => {
    const existing = tasks.get(taskData.id);
    if (!existing) {
      if (typeof callback === "function") callback({ success: false, error: "Task not found" });
      return;
    }
    if (!COLUMNS.includes(taskData.column)) {
      if (typeof callback === "function") callback({ success: false, error: "Invalid column" });
      return;
    }
    const moved = { ...existing, column: taskData.column };
    tasks.set(moved.id, moved);
    io.emit("task:move", moved);
    if (typeof callback === "function") callback({ success: true, task: moved });
  });

  socket.on("task:delete", (taskData, callback) => {
    const existing = tasks.get(taskData.id);
    if (!existing) {
      if (typeof callback === "function") callback({ success: false, error: "Task not found" });
      return;
    }
    tasks.delete(taskData.id);
    io.emit("task:delete", { id: taskData.id });
    if (typeof callback === "function") callback({ success: true });
  });

  socket.on("sync:tasks", () => {
    socket.emit("sync:tasks", getAllTasks());
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(5001, () => console.log("Server running on port 5001"));
