import { PRIORITIES, CATEGORIES, validateFile } from "../utils/taskUtils";
import { useState } from "react";

function TaskCard({ task, onUpdate, onDelete }) {
  const [fileError, setFileError] = useState("");

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    const validation = validateFile(file);
    if (!validation.valid) {
      setFileError(validation.error);
      return;
    }
    setFileError("");
    const reader = new FileReader();
    reader.onload = () => {
      const attachment = {
        name: file.name,
        url: reader.result,
        type: file.type,
      };
      onUpdate({ ...task, attachments: [...task.attachments, attachment] });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div
      className="task-card"
      data-testid={`task-card-${task.id}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("taskId", task.id);
        e.dataTransfer.effectAllowed = "move";
      }}
    >
      <div className="task-card-header">
        <h4 data-testid="task-title">{task.title}</h4>
        <button
          type="button"
          className="delete-btn"
          onClick={() => onDelete(task.id)}
          aria-label="Delete task"
          data-testid="delete-task-btn"
        >
          ×
        </button>
      </div>
      {task.description && <p className="task-description">{task.description}</p>}

      <div className="task-selects">
        <label>
          Priority
          <select
            value={task.priority}
            onChange={(e) => onUpdate({ ...task, priority: e.target.value })}
            data-testid="priority-select"
            aria-label="Priority"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label>
          Category
          <select
            value={task.category}
            onChange={(e) => onUpdate({ ...task, category: e.target.value })}
            data-testid="category-select"
            aria-label="Category"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="task-meta">
        <span className={`priority-badge priority-${task.priority.toLowerCase()}`} data-testid="priority-badge">
          {task.priority}
        </span>
        <span className="category-badge" data-testid="category-badge">
          {task.category}
        </span>
      </div>

      <div className="file-upload-section">
        <label className="file-upload-label">
          Attach file
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,application/pdf"
            onChange={handleFileUpload}
            data-testid="file-upload-input"
          />
        </label>
        {fileError && (
          <p className="file-error" data-testid="file-error">
            {fileError}
          </p>
        )}
        {task.attachments.length > 0 && (
          <div className="attachments" data-testid="attachments-list">
            {task.attachments.map((att, i) => (
              <div key={i} className="attachment" data-testid="attachment-item">
                {att.type.startsWith("image/") ? (
                  <img src={att.url} alt={att.name} data-testid="attachment-preview" />
                ) : (
                  <a href={att.url} download={att.name} data-testid="attachment-link">
                    {att.name}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskCard;
