import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import axiosClient from '../api/axiosClient';

/**
 * Sets up a single Socket.io connection for the whole app: joins the
 * user's personal notification room automatically, and exposes helpers
 * for joining a specific chat room and sending/receiving messages.
 */
export function useWebSockets({ onNewMessage, listenNotifications = true } = {}) {
  const token = useAuthStore((s) => s.token);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const setCount = useNotificationStore((s) => s.setCount);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return undefined;

    if (listenNotifications) {
      axiosClient.get('/api/notifications').then(({ data }) => setCount(data.unreadCount)).catch(() => {});
    }

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000', {
      auth: { token },
    });
    socketRef.current = socket;

    if (listenNotifications) {
      socket.on('new_notification', (notification) => {
        addNotification(notification);
      });
    }

    if (onNewMessage) {
      socket.on('new_message', onNewMessage);
    }

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function joinRoom(roomId) {
    socketRef.current?.emit('join_room', { room_id: roomId });
  }

  function sendMessage(roomId, text) {
    socketRef.current?.emit('send_message', { room_id: roomId, text });
  }

  return { socket: socketRef.current, joinRoom, sendMessage };
}
