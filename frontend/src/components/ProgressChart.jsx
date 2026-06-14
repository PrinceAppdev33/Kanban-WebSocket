import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getColumnCounts, getCompletionPercentage } from "../utils/taskUtils";

const COLORS = ["#6366f1", "#f59e0b", "#22c55e"];

function ProgressChart({ tasks }) {
  const data = getColumnCounts(tasks);
  const completion = getCompletionPercentage(tasks);

  return (
    <div className="progress-chart" data-testid="progress-chart">
      <h3>Task Progress</h3>
      <p className="completion-text" data-testid="completion-percentage">
        {completion}% Complete ({tasks.filter((t) => t.column === "done").length} of {tasks.length} tasks done)
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" name="Tasks" data-testid="chart-bar">
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ProgressChart;
