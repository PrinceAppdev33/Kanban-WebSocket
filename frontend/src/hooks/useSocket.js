import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { applySocketEvent } from "../utils/taskUtils";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://kanban-websocket.onrender.com";

export function useSocket() {
  const socketRef = useRef(null);
  const [tasks, setTasks] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("sync:tasks");
    });

    socket.on("connect_error", () => {
      setConnected(false);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("sync:tasks", (syncedTasks) => {
      setTasks(syncedTasks);
      setLoading(false);
    });

    socket.on("task:create", (task) => {
      setTasks((prev) => applySocketEvent(prev, "task:create", task));
    });

    socket.on("task:update", (task) => {
      setTasks((prev) => applySocketEvent(prev, "task:update", task));
    });

    socket.on("task:move", (task) => {
      setTasks((prev) => applySocketEvent(prev, "task:move", task));
    });

    socket.on("task:delete", ({ id }) => {
      setTasks((prev) => applySocketEvent(prev, "task:delete", { id }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { tasks, setTasks, connected, loading, emit, socket: socketRef };
}
