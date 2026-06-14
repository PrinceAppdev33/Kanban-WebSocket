import { useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { COLUMNS, getTasksByColumn } from "../utils/taskUtils";
import TaskColumn from "./TaskColumn";
import ProgressChart from "./ProgressChart";
import "./KanbanBoard.css";

function KanbanBoard() {
  const { tasks, loading, connected, emit } = useSocket();
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    emit("task:create", {
      title: newTitle.trim(),
      description: newDescription.trim(),
      column: "todo",
      priority: "Medium",
      category: "Feature",
    });
    setNewTitle("");
    setNewDescription("");
  };

  const handleUpdateTask = (updatedTask) => {
    emit("task:update", updatedTask);
  };

  const handleDeleteTask = (taskId) => {
    emit("task:delete", { id: taskId });
  };

  const handleMoveTask = (taskId, column) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.column !== column) {
      emit("task:move", { id: taskId, column });
    }
  };

  return (
    <div className="kanban-board">
      <h2>Kanban Board</h2>

      {!connected && (
        <div className="connection-status disconnected" data-testid="connection-status">
          Disconnected from server. Reconnecting...
        </div>
      )}

      {loading ? (
        <div className="loading-indicator" data-testid="loading-indicator">
          <div className="spinner" />
          <p>Syncing tasks with server...</p>
        </div>
      ) : (
        <>
          <ProgressChart tasks={tasks} />

          <form className="add-task-form" onSubmit={handleCreateTask} data-testid="add-task-form">
            <input
              type="text"
              placeholder="Task title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              data-testid="task-title-input"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              data-testid="task-description-input"
            />
            <button type="submit" data-testid="add-task-btn">
              Add Task
            </button>
          </form>

          <div className="kanban-columns" data-testid="kanban-columns">
            {COLUMNS.map((column) => (
              <TaskColumn
                key={column.id}
                column={column}
                tasks={getTasksByColumn(tasks, column.id)}
                onUpdate={handleUpdateTask}
                onDelete={handleDeleteTask}
                onMove={handleMoveTask}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default KanbanBoard;
