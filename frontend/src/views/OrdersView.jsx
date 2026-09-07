import { useEffect, useState } from 'react';
import { Box } from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function OrdersView() {
  const [orders, setOrders] = useState([]);
  useEffect(() => { axiosClient.get('/api/orders/mine').then(({ data }) => setOrders(data)); }, []);
  return <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6"><div className="mb-8 flex items-center gap-4"><span className="rounded-2xl bg-indigo-100 p-3 text-indigo-700"><Box size={25} /></span><div><p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Purchase history</p><h1 className="text-3xl font-extrabold text-slate-950">My Orders</h1></div></div>{orders.length === 0 ? <Empty text="Your order history is empty." /> : <div className="space-y-3">{orders.map((order) => <article key={order.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div><p className="font-bold text-slate-900">Order {order.id.slice(0, 8)}</p><p className="text-sm text-slate-500">{new Date(order.created_at).toLocaleDateString()} · {order.items?.length || 0} items</p></div><div className="text-right"><p className="font-bold text-indigo-700">${(order.total_amount / 100).toFixed(2)}</p><p className="text-xs font-semibold uppercase text-slate-400">{order.status}</p></div></article>)}</div>}</main>;
}
function Empty({ text }) { return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">{text}</div>; }
