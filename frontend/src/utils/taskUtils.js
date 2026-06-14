export const COLUMNS = [
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

export const PRIORITIES = ["Low", "Medium", "High"];
export const CATEGORIES = ["Bug", "Feature", "Enhancement"];
export const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "application/pdf"];

export function createTask(overrides = {}) {
  const id =
    overrides.id ||
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `task-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  return {
    id,
    title: overrides.title || "Untitled Task",
    description: overrides.description || "",
    column: overrides.column || "todo",
    priority: overrides.priority || "Medium",
    category: overrides.category || "Feature",
    attachments: overrides.attachments || [],
  };
}

export function addTask(tasks, task) {
  return [...tasks, task];
}

export function updateTask(tasks, updatedTask) {
  return tasks.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t));
}

export function deleteTask(tasks, taskId) {
  return tasks.filter((t) => t.id !== taskId);
}

export function moveTask(tasks, taskId, column) {
  return tasks.map((t) => (t.id === taskId ? { ...t, column } : t));
}

export function getTasksByColumn(tasks, columnId) {
  return tasks.filter((t) => t.column === columnId);
}

export function getColumnCounts(tasks) {
  return COLUMNS.map((col) => ({
    name: col.title,
    columnId: col.id,
    count: tasks.filter((t) => t.column === col.id).length,
  }));
}

export function getCompletionPercentage(tasks) {
  if (tasks.length === 0) return 0;
  const doneCount = tasks.filter((t) => t.column === "done").length;
  return Math.round((doneCount / tasks.length) * 100);
}

export function validateFile(file) {
  if (!file) return { valid: false, error: "No file selected" };
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: "Invalid file type. Allowed: images (JPEG, PNG, GIF, WebP) and PDF." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: "File size must be under 5MB." };
  }
  return { valid: true };
}

export function applySocketEvent(tasks, event, payload) {
  switch (event) {
    case "sync:tasks":
      return payload;
    case "task:create":
      return tasks.some((t) => t.id === payload.id) ? tasks : addTask(tasks, payload);
    case "task:update":
    case "task:move":
      return updateTask(tasks, payload);
    case "task:delete":
      return deleteTask(tasks, payload.id);
    default:
      return tasks;
  }
}
