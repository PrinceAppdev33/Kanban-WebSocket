import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  createTask,
  addTask,
  updateTask,
  deleteTask,
  moveTask,
  getTasksByColumn,
  getColumnCounts,
  getCompletionPercentage,
  validateFile,
  applySocketEvent,
} from "../../utils/taskUtils";

describe("taskUtils", () => {
  const sampleTask = createTask({ id: "1", title: "Test Task", column: "todo" });

  test("createTask returns task with defaults", () => {
    const task = createTask({ title: "New" });
    expect(task.title).toBe("New");
    expect(task.priority).toBe("Medium");
    expect(task.category).toBe("Feature");
    expect(task.column).toBe("todo");
  });

  test("addTask adds a task to the list", () => {
    const result = addTask([], sampleTask);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Test Task");
  });

  test("updateTask updates an existing task", () => {
    const tasks = [sampleTask];
    const updated = updateTask(tasks, { id: "1", title: "Updated" });
    expect(updated[0].title).toBe("Updated");
  });

  test("deleteTask removes a task", () => {
    const tasks = [sampleTask, createTask({ id: "2", title: "Other" })];
    const result = deleteTask(tasks, "1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  test("moveTask changes task column", () => {
    const tasks = [sampleTask];
    const result = moveTask(tasks, "1", "done");
    expect(result[0].column).toBe("done");
  });

  test("getTasksByColumn filters tasks", () => {
    const tasks = [
      createTask({ id: "1", column: "todo" }),
      createTask({ id: "2", column: "done" }),
    ];
    expect(getTasksByColumn(tasks, "todo")).toHaveLength(1);
  });

  test("getColumnCounts returns correct counts", () => {
    const tasks = [
      createTask({ id: "1", column: "todo" }),
      createTask({ id: "2", column: "todo" }),
      createTask({ id: "3", column: "done" }),
    ];
    const counts = getColumnCounts(tasks);
    expect(counts.find((c) => c.columnId === "todo").count).toBe(2);
    expect(counts.find((c) => c.columnId === "done").count).toBe(1);
  });

  test("getCompletionPercentage calculates correctly", () => {
    const tasks = [
      createTask({ id: "1", column: "done" }),
      createTask({ id: "2", column: "todo" }),
    ];
    expect(getCompletionPercentage(tasks)).toBe(50);
    expect(getCompletionPercentage([])).toBe(0);
  });

  test("validateFile rejects invalid types", () => {
    const file = { type: "text/plain", size: 100 };
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid file type");
  });

  test("validateFile accepts valid image", () => {
    const file = { type: "image/png", size: 1000 };
    expect(validateFile(file).valid).toBe(true);
  });

  test("applySocketEvent handles sync:tasks", () => {
    const synced = [sampleTask];
    expect(applySocketEvent([], "sync:tasks", synced)).toEqual(synced);
  });

  test("applySocketEvent handles task:create", () => {
    const result = applySocketEvent([], "task:create", sampleTask);
    expect(result).toHaveLength(1);
  });

  test("applySocketEvent handles task:delete", () => {
    const tasks = [sampleTask];
    const result = applySocketEvent(tasks, "task:delete", { id: "1" });
    expect(result).toHaveLength(0);
  });
});

const mockEmit = vi.fn();
const mockOn = vi.fn();
const mockDisconnect = vi.fn();

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => ({
    on: mockOn,
    emit: mockEmit,
    disconnect: mockDisconnect,
  })),
}));

import KanbanBoard from "../../components/KanbanBoard";

describe("KanbanBoard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOn.mockImplementation((event, handler) => {
      if (event === "sync:tasks") {
        setTimeout(() => handler([]), 0);
      }
      if (event === "connect") {
        setTimeout(() => handler(), 0);
      }
    });
  });

  test("renders Kanban board title", async () => {
    render(<KanbanBoard />);
    expect(screen.getByText("Kanban Board")).toBeInTheDocument();
  });

  test("shows loading indicator initially", () => {
    mockOn.mockImplementation(() => {});
    render(<KanbanBoard />);
    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
  });

  test("renders add task form after sync", async () => {
    render(<KanbanBoard />);
    expect(await screen.findByTestId("add-task-form")).toBeInTheDocument();
  });

  test("creates a task on form submit", async () => {
    render(<KanbanBoard />);
    await screen.findByTestId("add-task-form");
    fireEvent.change(screen.getByTestId("task-title-input"), { target: { value: "New Task" } });
    fireEvent.click(screen.getByTestId("add-task-btn"));
    expect(mockEmit).toHaveBeenCalledWith("task:create", expect.objectContaining({ title: "New Task" }));
  });
});
