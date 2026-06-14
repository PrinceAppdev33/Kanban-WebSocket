import TaskCard from "./TaskCard";

function TaskColumn({ column, tasks, onUpdate, onDelete, onMove }) {
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      onMove(taskId, column.id);
    }
  };

  return (
    <div className="kanban-column" data-testid={`column-${column.id}`}>
      <h3 className="column-title">{column.title}</h3>
      <div
        className="column-content"
        data-testid={`column-content-${column.id}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onUpdate={onUpdate} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

export default TaskColumn;
