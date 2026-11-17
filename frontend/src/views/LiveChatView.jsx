import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom'; // Added useNavigate
import axiosClient from '../api/axiosClient';
import { useAuthStore } from '../store/useAuthStore';
import { useWebSockets } from '../hooks/useWebSockets';
import { useNotificationStore } from '../store/useNotificationStore';
import { 
  Send, Package, ChevronLeft, MoreVertical, 
  CheckCheck, Image as ImageIcon, Smile,
  Ban, Trash2, Shield, X // Added new icons
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

export default function LiveChatView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate(); // Added navigate
  const activeRoomId = searchParams.get('room');
  const user = useAuthStore((s) => s.user);
  const resetUnreadMessages = useNotificationStore((state) => state.resetUnreadMessages);

  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [activeRoomDetails, setActiveRoomDetails] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // New states for the menu and report modal
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (activeRoomId) {
      resetUnreadMessages();
    }
  }, [activeRoomId, resetUnreadMessages]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNewMessage = useCallback((message) => {
    if (message.room_id === activeRoomId) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        const tempIndex = prev.findIndex(
          (m) => m.id.startsWith('temp-') && m.sender_id === message.sender_id && m.message_text === message.message_text
        );
        if (tempIndex !== -1) {
          const newMessages = [...prev];
          newMessages[tempIndex] = message;
          return newMessages;
        }
        return [...prev, message];
      });
      setRooms((prevRooms) => 
        prevRooms.map(r => r.id === activeRoomId ? { ...r, last_message: message.message_text, last_message_at: message.created_at } : r)
      );
    }
  }, [activeRoomId]);

  const { joinRoom, sendMessage } = useWebSockets({ onNewMessage: handleNewMessage, listenNotifications: false });

  useEffect(() => {
    axiosClient.get('/api/chat/rooms').then(({ data }) => {
      setRooms(data);
      if (activeRoomId) {
        const room = data.find(r => r.id === activeRoomId);
        setActiveRoomDetails(room);
      }
    });
  }, [activeRoomId]);

  useEffect(() => {
    if (!activeRoomId) return;
    joinRoom(activeRoomId);
    axiosClient.get(`/api/chat/rooms/${activeRoomId}/messages`).then(({ data }) => setMessages(data));
  }, [activeRoomId, joinRoom]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [draft]);

  function formatTime(dateString) {
    if (!dateString) return '';
    const isoString = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    const isoString = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString();
  }

  function handleSend(e) {
    e.preventDefault();
    if (!draft.trim() || !activeRoomId) return;
    const messageText = draft.trim();
    const tempMessage = { id: `temp-${Date.now()}`, room_id: activeRoomId, sender_id: user.id, message_text: messageText, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, tempMessage]);
    setDraft('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setShowEmojiPicker(false);
    sendMessage(activeRoomId, messageText);
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !activeRoomId) return;
    setIsUploading(true);
    const tempImageMessage = { id: `temp-img-${Date.now()}`, room_id: activeRoomId, sender_id: user.id, message_text: URL.createObjectURL(file), created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, tempImageMessage]);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await axiosClient.post('/api/chat/upload-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      sendMessage(activeRoomId, data.imageUrl);
    } catch (err) { console.error(err); } finally { setIsUploading(false); e.target.value = ''; }
  }

  // --- NEW HANDLERS ---
  async function handleBlockUser() {
    if (!activeRoomDetails?.other_user_id) return;
    if (window.confirm(`Block ${activeRoomDetails.other_user_name}? They won't be able to message you anymore.`)) {
      try {
        await axiosClient.post('/api/chat/block-user', { userId: activeRoomDetails.other_user_id });
        alert('User blocked successfully');
        setMenuOpen(false);
        navigate('/chat');
      } catch (err) {
        console.error('Failed to block user:', err);
        alert('Failed to block user');
      }
    }
  }

  async function handleDeleteChat() {
    if (!activeRoomId) return;
    if (window.confirm('Delete this conversation? This cannot be undone.')) {
      try {
        await axiosClient.delete(`/api/chat/rooms/${activeRoomId}`);
        alert('Conversation deleted');
        setMenuOpen(false);
        navigate('/chat');
      } catch (err) {
        console.error('Failed to delete chat:', err);
        alert('Failed to delete conversation');
      }
    }
  }

  function openReportModal() {
    setReportReason('');
    setShowReportModal(true);
    setMenuOpen(false);
  }

  async function submitReport() {
    if (!reportReason.trim()) {
      alert('Please provide a reason for reporting');
      return;
    }
    try {
      await axiosClient.post('/api/chat/report', { 
        roomId: activeRoomId,
        reason: reportReason,
        reportedUserId: activeRoomDetails?.other_user_id
      });
      alert('Report submitted successfully. Our team will review it.');
      setShowReportModal(false);
      setReportReason('');
    } catch (err) {
      console.error('Failed to report chat:', err);
      alert('Failed to submit report');
    }
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-5rem)] overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Sidebar */}
        <aside className={`md:col-span-1 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 h-full overflow-hidden ${activeRoomId ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {rooms.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-400">No conversations yet.</p>
              </div>
            ) : (
              rooms.map((room) => (
                <button key={room.id} onClick={() => { setSearchParams({ room: room.id }); setActiveRoomDetails(room); }} className={`w-full text-left p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 ${room.id === activeRoomId ? 'bg-white dark:bg-slate-800 border-l-4 border-l-indigo-500' : 'border-l-4 border-l-transparent'}`}>
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {room.other_user_avatar ? <img src={room.other_user_avatar} className="w-full h-full object-cover" /> : <span className="text-indigo-700 dark:text-indigo-300 font-bold">{(room.other_user_name || 'U').charAt(0).toUpperCase()}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{room.other_user_name || 'User'}</p>
                        {room.last_message_at && <span className="text-[10px] text-slate-400">{formatTime(room.last_message_at)}</span>}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 truncate">{room.product_title}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{room.last_message || 'No messages yet'}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Main Chat Area */}
        <section className={`md:col-span-2 flex flex-col bg-white dark:bg-slate-900 h-full overflow-hidden ${!activeRoomId ? 'hidden md:flex' : 'flex'}`}>
          {!activeRoomId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <Send className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Select a conversation</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSearchParams({})} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {activeRoomDetails?.other_user_avatar ? <img src={activeRoomDetails.other_user_avatar} className="w-full h-full object-cover" /> : <span className="text-indigo-700 dark:text-indigo-300 font-bold">{(activeRoomDetails?.other_user_name || 'U').charAt(0).toUpperCase()}</span>}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{activeRoomDetails?.other_user_name || 'User'}</h3>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span>Online</p>
                  </div>
                </div>
                
                {/* Three dots menu button with Icons */}
                <div className="relative" ref={menuRef}>
                  <button 
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-2 z-50">
                      <button onClick={handleBlockUser} className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3">
                        <Ban className="w-4 h-4 text-red-500" /> Block User
                      </button>
                      <button onClick={handleDeleteChat} className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3">
                        <Trash2 className="w-4 h-4" /> Delete Chat
                      </button>
                      <button onClick={openReportModal} className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3">
                        <Shield className="w-4 h-4 text-amber-500" /> Report Chat
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-950/50">
                {messages.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((m, index) => {
                    const isMe = m.sender_id === user?.id;
                    const showDate = index === 0 || formatDate(m.created_at) !== formatDate(messages[index - 1]?.created_at);
                    const isImage = m.message_text && m.message_text.match(/\.(jpeg|jpg|png|webp|gif)$/i);
                    return (
                      <div key={m.id}>
                        {showDate && <div className="flex justify-center my-4"><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full">{formatDate(m.created_at)}</span></div>}
                        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] md:max-w-[60%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'}`}>
                            {isImage && !m.message_text.startsWith('blob:') ? <img src={m.message_text} className="max-w-full rounded-lg" /> : <p className="leading-relaxed">{m.message_text}</p>}
                            <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                              <span className="text-[10px]">{formatTime(m.created_at)}</span>
                              {isMe && <CheckCheck className="w-3 h-3" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input Area */}
              <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <form onSubmit={handleSend} className="flex items-end gap-2 bg-slate-100 dark:bg-slate-800 rounded-2xl p-2 border border-transparent focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/jpeg,image/png,image/webp,image/gif" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50">
                    {isUploading ? <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                  </button>
                  <textarea ref={textareaRef} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }} placeholder="Type a message..." rows={1} className="flex-1 bg-transparent border-0 focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 resize-none py-2.5 max-h-32" />
                  <div className="relative">
                    <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"><Smile className="w-5 h-5" /></button>
                    {showEmojiPicker && <div className="absolute bottom-12 right-0 z-10"><EmojiPicker onEmojiClick={(e) => setDraft(prev => prev + e.emoji)} theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'} /></div>}
                  </div>
                  <button type="submit" disabled={!draft.trim() || isUploading} className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl transition-all shadow-sm disabled:shadow-none"><Send className="w-5 h-5" /></button>
                </form>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Report Conversation</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">With: {activeRoomDetails?.other_user_name}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowReportModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Why are you reporting this conversation?
              </label>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Describe the issue (spam, harassment, scam, etc.)..."
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Your report will be sent to our moderation team for review.
              </p>
            </div>
            
            <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitReport}
                disabled={!reportReason.trim()}
                className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-semibold rounded-xl transition-colors disabled:cursor-not-allowed"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}