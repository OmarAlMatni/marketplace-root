import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import axiosClient from '../api/axiosClient';

function KpiCard({ label, value, sub }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

const money = (cents) => `$${(cents / 100).toFixed(2)}`;

export default function DashboardView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axiosClient
      .get('/api/admin/dashboard', { params: { days: 14, limit: 5 } })
      .then(({ data }) => setData(data))
      .catch((err) => setError(err.response?.data?.error || 'Could not load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="max-w-6xl mx-auto px-6 py-10 skeleton h-96" />;
  }
  if (error || !data) {
    return <p className="text-center py-16 text-gray-500">{error || 'Could not load dashboard data.'}</p>;
  }

  const { summary, salesOverTime, topProducts, topSellers } = data;

  const chartData = salesOverTime.map((d) => ({
    date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    revenue: d.total / 100,
  }));

  const productChartData = topProducts.map((p) => ({
    name: p.title.length > 14 ? `${p.title.slice(0, 14)}…` : p.title,
    units: p.units_sold,
  }));

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-gray-500 text-sm">Live snapshot of marketplace performance.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard label="Sales today" value={money(summary.today_sales)} sub={`${summary.today_order_count} orders`} />
        <KpiCard label="Total revenue" value={money(summary.total_revenue)} sub={`${summary.total_paid_orders} paid orders`} />
        <KpiCard label="Total users" value={summary.total_users} sub={`${summary.banned_users} banned`} />
        <KpiCard label="Total products" value={summary.total_products} />
        <KpiCard label="Pending review" value={summary.pending_products} />
        <KpiCard label="Paid orders" value={summary.total_paid_orders} />
      </div>

      <div className="border border-gray-200 rounded-xl p-4 bg-white">
        <h2 className="font-semibold mb-4">Revenue — last 14 days</h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis fontSize={12} tickFormatter={(v) => `$${v}`} />
            <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, 'Revenue']} />
            <Line type="monotone" dataKey="revenue" stroke="#5b4bff" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-xl p-4 bg-white">
          <h2 className="font-semibold mb-4">Most popular products</h2>
          {productChartData.length === 0 ? (
            <p className="text-gray-400 text-sm">No sales yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={productChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={11} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, 'Units sold']} />
                <Bar dataKey="units" fill="#5b4bff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="border border-gray-200 rounded-xl p-4 bg-white">
          <h2 className="font-semibold mb-4">Best-selling accounts</h2>
          {topSellers.length === 0 ? (
            <p className="text-gray-400 text-sm">No sales yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="pb-2">Seller</th>
                  <th className="pb-2">Units sold</th>
                  <th className="pb-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topSellers.map((s) => (
                  <tr key={s.id} className="border-t border-gray-100">
                    <td className="py-2">{s.display_name || s.email}</td>
                    <td className="py-2">{s.units_sold}</td>
                    <td className="py-2 font-medium">{money(s.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
