import React from "react";
import KanbanBoard from "./components/KanbanBoard";
import "./components/KanbanBoard.css";

function App() {
  return (
    <div className="App">
      <h1>Real-time Kanban Board</h1>
      <KanbanBoard />
    </div>
  );
}

export default App;
