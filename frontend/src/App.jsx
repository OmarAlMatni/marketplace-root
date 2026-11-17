import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProductCatalog from './views/ProductCatalog';
import ProductDetail from './views/ProductDetail';
import LoginView from './views/LoginView';
import RegisterView from './views/RegisterView';
import VerifyEmailView from './views/VerifyEmailView';
import CartView from './views/CartView';
import CheckoutView from './views/CheckoutView';
import LiveChatView from './views/LiveChatView';
import SellerDashboard from './views/SellerDashboard';
import AccountView from './views/AccountView';
import OrdersView from './views/OrdersView';
import NotificationsView from './views/NotificationsView';
import SettingsView from './views/SettingsView';
import SavedItemsView from './views/SavedItemsView';
import HelpView from './views/HelpView';
import { useAuthStore } from './store/useAuthStore';
import { useWebSockets } from './hooks/useWebSockets';

export default function App() {
  const preferences = useAuthStore((state) => state.user?.preferences);
// Add this inside the App component, right after 'const preferences = ...'
// This keeps the socket alive for notifications
useWebSockets({ onNewMessage: () => {}, listenNotifications: true }); 
  useEffect(() => {
    const theme = preferences?.theme || 'system';
    const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.lang = preferences?.language || 'en';
  }, [preferences?.theme, preferences?.language]);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />
      <Routes>
        <Route path="/" element={<ProductCatalog />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<CartView />} />
        <Route path="/checkout" element={<CheckoutView />} />
        <Route path="/chat" element={<LiveChatView />} />
        <Route path="/sell" element={<SellerDashboard />} />
        <Route path="/login" element={<LoginView />} />
        <Route path="/register" element={<RegisterView />} />
        <Route path="/verify-email" element={<VerifyEmailView />} />
        <Route path="/account" element={<AccountView />} />
        <Route path="/orders" element={<OrdersView />} />
        <Route path="/notifications" element={<NotificationsView />} />
        <Route path="/settings/:section?" element={<SettingsView />} />
        <Route path="/saved-items" element={<SavedItemsView />} />
        <Route path="/help" element={<HelpView />} />

      </Routes>
    </div>
  );
}