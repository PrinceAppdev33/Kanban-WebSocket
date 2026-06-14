import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

const mockEmit = vi.fn();
const eventHandlers = {};

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => ({
    on: (event, handler) => {
      eventHandlers[event] = handler;
    },
    emit: mockEmit,
    disconnect: vi.fn(),
  })),
}));

import KanbanBoard from "../../components/KanbanBoard";
import { createTask } from "../../utils/taskUtils";

describe("WebSocket Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(eventHandlers).forEach((k) => delete eventHandlers[k]);
  });

  const connectAndSync = async (tasks = []) => {
    render(<KanbanBoard />);
    await act(async () => {
      eventHandlers.connect?.();
      eventHandlers["sync:tasks"]?.(tasks);
    });
  };

  test("WebSocket receives task update", async () => {
    await connectAndSync([]);
    expect(screen.getByText("Kanban Board")).toBeInTheDocument();
    expect(screen.getByTestId("add-task-form")).toBeInTheDocument();
  });

  test("sync:tasks populates board with tasks", async () => {
    const tasks = [
      createTask({ id: "t1", title: "Synced Task", column: "todo" }),
      createTask({ id: "t2", title: "Done Task", column: "done" }),
    ];
    await connectAndSync(tasks);
    expect(screen.getByText("Synced Task")).toBeInTheDocument();
    expect(screen.getByText("Done Task")).toBeInTheDocument();
  });

  test("task:create event adds task to board", async () => {
    await connectAndSync([]);
    const newTask = createTask({ id: "new-1", title: "Created via WS", column: "todo" });
    await act(async () => {
      eventHandlers["task:create"]?.(newTask);
    });
    expect(screen.getByText("Created via WS")).toBeInTheDocument();
  });

  test("task:move event updates task column", async () => {
    const tasks = [createTask({ id: "m1", title: "Movable Task", column: "todo" })];
    await connectAndSync(tasks);
    await act(async () => {
      eventHandlers["task:move"]?.({ ...tasks[0], column: "in-progress" });
    });
    const inProgressColumn = screen.getByTestId("column-content-in-progress");
    expect(inProgressColumn).toHaveTextContent("Movable Task");
  });

  test("task:delete event removes task from board", async () => {
    const tasks = [createTask({ id: "d1", title: "Delete Me", column: "todo" })];
    await connectAndSync(tasks);
    await act(async () => {
      eventHandlers["task:delete"]?.({ id: "d1" });
    });
    expect(screen.queryByText("Delete Me")).not.toBeInTheDocument();
  });

  test("progress chart updates when tasks move", async () => {
    const tasks = [
      createTask({ id: "p1", column: "todo" }),
      createTask({ id: "p2", column: "done" }),
    ];
    await connectAndSync(tasks);
    expect(screen.getByTestId("completion-percentage")).toHaveTextContent("50%");
    await act(async () => {
      eventHandlers["task:move"]?.({ ...tasks[0], column: "done" });
    });
    expect(screen.getByTestId("completion-percentage")).toHaveTextContent("100%");
  });
});
