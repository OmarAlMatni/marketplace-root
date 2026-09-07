import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuthStore } from '../store/useAuthStore';
import { useWebSockets } from '../hooks/useWebSockets';

export default function LiveChatView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeRoomId = searchParams.get('room');
  const user = useAuthStore((s) => s.user);

  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef(null);

  const handleNewMessage = useCallback(
    (message) => {
      if (message.room_id === activeRoomId) {
        setMessages((prev) => [...prev, message]);
      }
    },
    [activeRoomId]
  );

  const { joinRoom, sendMessage } = useWebSockets({ onNewMessage: handleNewMessage, listenNotifications: false });

  useEffect(() => {
    axiosClient.get('/api/chat/rooms').then(({ data }) => setRooms(data));
  }, []);

  useEffect(() => {
    if (!activeRoomId) return;
    joinRoom(activeRoomId);
    axiosClient.get(`/api/chat/rooms/${activeRoomId}/messages`).then(({ data }) => setMessages(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend(e) {
    e.preventDefault();
    if (!draft.trim() || !activeRoomId) return;
    sendMessage(activeRoomId, draft.trim());
    setDraft('');
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      <aside className="md:col-span-1 border border-gray-200 rounded-xl overflow-y-auto bg-white">
        <h2 className="p-4 font-semibold border-b border-gray-200">Conversations</h2>
        {rooms.length === 0 && <p className="p-4 text-sm text-gray-400">No conversations yet.</p>}
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => setSearchParams({ room: room.id })}
            className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
              room.id === activeRoomId ? 'bg-brand-50' : ''
            }`}
          >
            <p className="font-medium truncate">{room.product_title}</p>
            <p className="text-xs text-gray-400">
              {room.buyer_id === user?.id ? 'You are buying' : 'You are selling'}
            </p>
          </button>
        ))}
      </aside>

      <section className="md:col-span-2 border border-gray-200 rounded-xl flex flex-col bg-white">
        {!activeRoomId ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a conversation
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    m.sender_id === user?.id
                      ? 'bg-brand-600 text-white ml-auto'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {m.message_text}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={handleSend} className="border-t border-gray-200 p-3 flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
              />
              <button className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700">
                Send
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
