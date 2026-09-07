import { useEffect, useState, useMemo } from 'react';
import { 
  Bell, CheckCheck, CheckCircle, XCircle, 
  MessageSquare, Package, Info, Loader2 
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useNotificationStore } from '../store/useNotificationStore';

// Helper to get icon and color based on notification type
const getNotificationStyle = (type) => {
  switch (type) {
    case 'listing_approved': return { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' };
    case 'listing_rejected': return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' };
    case 'new_message': return { icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-100' };
    case 'order_update': return { icon: Package, color: 'text-purple-600', bg: 'bg-purple-100' };
    default: return { icon: Info, color: 'text-gray-600', bg: 'bg-gray-100' };
  }
};

// Helper for relative time formatting
const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

export default function NotificationsView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const clear = useNotificationStore((state) => state.clear);

  useEffect(() => {
    setLoading(true);
    axiosClient.get('/api/notifications')
      .then(async ({ data }) => {
        // Adjust 'data.items' to 'data.notifications' if your API returns that key
        const notifications = data.items || data.notifications || [];
        setItems(notifications);
        
        if (data.unreadCount > 0) {
          await axiosClient.post('/api/notifications/read-all');
          setItems((current) => 
            current.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() }))
          );
          clear();
        }
      })
      .catch(err => console.error('Failed to load notifications', err))
      .finally(() => setLoading(false));
  }, [clear]);

  async function markRead() { 
    await axiosClient.post('/api/notifications/read-all'); 
    setItems((current) => current.map((item) => ({ ...item, read_at: new Date().toISOString() }))); 
    clear(); 
  }

  // Group notifications by date
  const groupedItems = useMemo(() => {
    const groups = { Today: [], Yesterday: [], Earlier: [] };
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    items.forEach(item => {
      const itemDate = new Date(item.created_at).toDateString();
      if (itemDate === today) groups.Today.push(item);
      else if (itemDate === yesterday) groups.Yesterday.push(item);
      else groups.Earlier.push(item);
    });

    return groups;
  }, [items]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gray-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-700">
            <Bell size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Updates</p>
            <h1 className="text-3xl font-extrabold text-slate-950">Notifications</h1>
          </div>
        </div>
        {items.some((item) => !item.read_at) && (
          <button 
            onClick={markRead} 
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <CheckCheck size={18} /> Mark all read
          </button>
        )}
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">
          <div className="mb-4 rounded-full bg-slate-100 p-4">
            <Bell className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">You're all caught up!</h3>
          <p className="mt-1 text-sm text-slate-500">No new notifications at this time.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([group, groupItems]) => 
            groupItems.length > 0 && (
              <div key={group}>
                <h3 className="mb-3 px-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                  {group}
                </h3>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
                  {groupItems.map((item) => (
                    <NotificationItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </main>
  );
}

// Individual Notification Item Component
function NotificationItem({ item }) {
  const { icon: Icon, color, bg } = getNotificationStyle(item.type);
  const isUnread = !item.read_at;

  return (
    <article className={`relative p-5 transition-colors hover:bg-slate-50 ${isUnread ? 'bg-indigo-50/30' : 'bg-white'}`}>
      {/* Unread indicator bar */}
      {isUnread && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-2xl"></div>}
      
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`flex-shrink-0 rounded-xl p-2.5 ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h2 className={`text-sm leading-tight ${isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
              {item.title}
            </h2>
            <time className="shrink-0 text-xs text-slate-400">
              {getRelativeTime(item.created_at)}
            </time>
          </div>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed line-clamp-2">
            {item.body}
          </p>
        </div>
      </div>
    </article>
  );
}