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
import {
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  ShoppingCart,
  MessageSquare,
  Flag,
  Shield,
  ArrowUpRight,
  RefreshCw,
  MoreHorizontal,
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

// Stat Card Component with Trends
function StatCard({ label, value, sub, change, icon: Icon, color, alert = false }) {
  const colorClasses = {
    indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-xl border ${
        alert ? 'border-amber-400 ring-2 ring-amber-100' : 'border-gray-200 dark:border-slate-800'
      } p-5 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{sub}</p>}
          {change !== undefined && (
            <div
              className={`mt-2 flex items-center gap-1 text-xs font-medium ${
                change >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>
                {change >= 0 ? '+' : ''}
                {change}%
              </span>
              <span className="text-gray-400 ml-1">vs last week</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}

// Quick Action Button
function QuickActionButton({ icon: Icon, label, count, color, onClick }) {
  const colors = {
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  };

  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full p-3 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white">
          {label}
        </span>
      </div>
      {count > 0 && (
        <span className="px-2 py-0.5 text-xs font-bold bg-gray-200 text-gray-700 rounded-full dark:bg-slate-700 dark:text-slate-300">
          {count}
        </span>
      )}
    </button>
  );
}

// Activity Item
function ActivityItem({ activity }) {
  const icons = {
    user_registered: Users,
    product_created: Package,
    order_completed: ShoppingCart,
    product_approved: CheckCircle,
    product_rejected: AlertCircle,
  };

  const colors = {
    user_registered: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    product_created: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    order_completed: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    product_approved: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    product_rejected: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  };

  const Icon = icons[activity.type] || MoreHorizontal;
  const colorClass = colors[activity.type] || colors.product_created;

  return (
    <div className="p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className={`p-2 rounded-lg ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.message}</p>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
          {new Date(activity.timestamp).toLocaleString()}
        </p>
      </div>
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

  const handleRefresh = () => {
    setLoading(true);
    axiosClient
      .get('/api/admin/dashboard', { params: { days: 14, limit: 5 } })
      .then(({ data }) => setData(data))
      .catch((err) => setError(err.response?.data?.error || 'Could not load dashboard data.'))
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-slate-800 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-slate-800 rounded-xl" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-64 bg-gray-200 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="text-center py-16">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-500 dark:text-slate-400 mb-4">{error || 'Could not load dashboard data.'}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
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

  // Mock recent activity (you can replace this with real API data)
  const recentActivity = [
    { type: 'product_created', message: 'New listing created: "Vintage Camera"', timestamp: new Date().toISOString() },
    { type: 'user_registered', message: 'New user registered: john@example.com', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { type: 'order_completed', message: 'Order #1234 completed', timestamp: new Date(Date.now() - 7200000).toISOString() },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-gray-600 dark:text-slate-400">Live snapshot of marketplace performance.</p>
        </div>
        <button
  onClick={handleRefresh}
  className="p-2.5 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
  title="Refresh Data"
>
  <RefreshCw className="h-5 w-5" />
</button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Sales Today"
          value={money(summary.today_sales)}
          sub={`${summary.today_order_count} orders`}
          icon={ShoppingCart}
          color="indigo"
        />
        <StatCard
          label="Total Revenue"
          value={money(summary.total_revenue)}
          sub={`${summary.total_paid_orders} paid orders`}
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          label="Total Users"
          value={summary.total_users}
          sub={`${summary.banned_users} banned`}
          icon={Users}
          color="blue"
        />
        <StatCard
          label="Total Products"
          value={summary.total_products}
          icon={Package}
          color="purple"
        />
        <StatCard
          label="Pending Review"
          value={summary.pending_products}
          sub="Listings"
          icon={Clock}
          color="amber"
          alert={summary.pending_products > 0}
        />
        <StatCard
          label="Paid Orders"
          value={summary.total_paid_orders}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Revenue — Last 14 Days</h2>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" fontSize={12} stroke="#6b7280" />
              <YAxis fontSize={12} stroke="#6b7280" tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(v) => [`$${v.toFixed(2)}`, 'Revenue']}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions & Alerts - Takes 1 column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <QuickActionButton
                icon={Package}
                label="Review Pending Listings"
                count={summary.pending_products}
                color="amber"
                onClick={() => (window.location.href = '/moderation')}
              />
              <QuickActionButton
                icon={Users}
                label="Manage Users"
                color="blue"
                onClick={() => (window.location.href = '/users')}
              />
              <QuickActionButton
                icon={MessageSquare}
                label="View Support Tickets"
                count={0}
                color="purple"
                onClick={() => {}}
              />
              <QuickActionButton
                icon={Flag}
                label="Reported Content"
                count={0}
                color="red"
                onClick={() => {}}
              />
            </div>
          </div>

          {/* System Alerts */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">System Status</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                <Shield className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium">All systems operational</span>
              </div>
              {summary.pending_products > 5 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-medium">{summary.pending_products} listings awaiting review</span>
                </div>
              )}
              {summary.banned_users > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-medium">{summary.banned_users} banned users</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Popular Products */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Most Popular Products</h2>
          {productChartData.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-slate-400">No sales yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={productChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  fontSize={11}
                  stroke="#6b7280"
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis fontSize={12} stroke="#6b7280" allowDecimals={false} />
                <Tooltip
                  formatter={(v) => [v, 'Units sold']}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="units" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Sellers */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Top Performing Sellers</h2>
          {topSellers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-slate-400">No sales data yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="pb-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                      Seller
                    </th>
                    <th className="pb-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                      Units
                    </th>
                    <th className="pb-3 text-right text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {topSellers.map((s, index) => (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                          <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-400">
                            {(s.display_name || s.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {s.display_name || s.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-sm text-gray-600 dark:text-slate-400">{s.units_sold}</td>
                      <td className="py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        {money(s.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}