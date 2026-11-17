import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';

export function useWebSockets({ onNewMessage, listenNotifications = true }) {
  const socketRef = useRef(null);
  const token = useAuthStore((state) => state.token);
  const incrementNotif = useNotificationStore((state) => state.incrementCount);
 // const resetUnreadMessages = useNotificationStore((state) => state.resetUnreadMessages); // Add this
  const incrementUnreadMessages = useNotificationStore((state) => state.incrementUnreadMessages); // Add this

  useEffect(() => {
    if (!token) return;
    socketRef.current = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000', { 
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => console.log('✅ Socket connected'));

    if (listenNotifications) {
      socketRef.current.on('new_notification', (data) => {
        incrementNotif();
        // If it's a chat notification, also increment unread messages
        if (data.type === 'chat') {
          incrementUnreadMessages();
        }
      });
    }

    return () => { 
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token, listenNotifications, incrementNotif, incrementUnreadMessages]);

  const joinRoom = (roomId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_room', { room_id: roomId });
    }
  };

  const sendMessage = (roomId, text) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('send_message', { room_id: roomId, text });
    }
  };

  useEffect(() => {
    if (!socketRef.current || !onNewMessage) return;
    socketRef.current.on('new_message', onNewMessage);
    return () => socketRef.current?.off('new_message', onNewMessage);
  }, [onNewMessage]);

  return { joinRoom, sendMessage };
}