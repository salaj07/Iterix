import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3000" : "");

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false,
});
