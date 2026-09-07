import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Bell, Box, Heart, HelpCircle, LogOut, MessageCircle, Package, Search, Settings, ShoppingBag, ShoppingCart, User } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { API_BASE_URL } from '../api/axiosClient';
import { useTranslation } from '../utils/i18n';

function Badge({ count }) {
  if (!count) return null;
  return <span aria-label={`${count} unread notifications`} className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-black" />;
}

function Avatar({ user, small = false }) {
  const initials = (user?.display_name || user?.email || 'U').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const avatarUrl = user?.avatar_url?.startsWith('/') ? `${API_BASE_URL}${user.avatar_url}` : user?.avatar_url;
  return <span className={`${small ? 'h-9 w-9 text-xs' : 'h-12 w-12 text-sm'} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 font-bold text-white shadow-sm`}>{avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initials}</span>;
}

function MenuLink({ to, icon: Icon, label, close }) {
  return <Link to={to} onClick={close} className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-transparent hover:text-slate-700 dark:text-slate-200 dark:hover:border-slate-300 dark:hover:bg-transparent dark:hover:text-white"><Icon size={19} strokeWidth={1.8} />{label}</Link>;
}

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const items = useCartStore((state) => state.items);
  const notifCount = useNotificationStore((state) => state.count);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const isStaff = user && ['admin', 'super_admin'].includes(user.role);
  const t = useTranslation();

  useEffect(() => {
    function closeMenu(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, []);

  function submitSearch(event) {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);
    search ? next.set('search', search) : next.delete('search');
    next.set('page', '1');
    setSearchParams(next);
    navigate(`/?${next.toString()}`);
  }

  function signOut() {
    logout();
    setMenuOpen(false);
    navigate('/');
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-[0_2px_12px_rgba(15,23,42,0.04)] backdrop-blur dark:border-slate-800 dark:bg-black dark:shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
      <div className="mx-auto flex min-h-[76px] max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200"><ShoppingBag size={23} /></span><span className="hidden bg-gradient-to-r from-slate-950 via-indigo-700 to-purple-600 bg-clip-text text-xl font-extrabold tracking-tight text-transparent dark:from-white dark:via-indigo-200 dark:to-purple-300 sm:inline">{t('marketplace')}</span></Link>
        {user && <form onSubmit={submitSearch} className="mx-auto hidden max-w-md flex-1 md:flex"><label className="flex w-full items-center rounded-full bg-slate-100 px-4 text-slate-400 focus-within:ring-2 focus-within:ring-indigo-100 dark:bg-slate-900 dark:text-slate-400"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('searchProducts')} className="w-full bg-transparent py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200" /><button type="submit" aria-label={t('searchProducts')}><Search size={20} /></button></label></form>}
        <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
          {user ? <>
            <Link to="/notifications" aria-label={t('notifications')} className="relative rounded-xl p-2.5 text-slate-700 hover:bg-transparent hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-transparent dark:hover:text-indigo-300"><Bell size={22} /><Badge count={notifCount} /></Link>
            <Link to="/chat" aria-label={t('messages')} className="relative rounded-xl p-2.5 text-slate-700 hover:bg-transparent hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-transparent dark:hover:text-indigo-300"><MessageCircle size={22} /></Link>
            <Link to="/cart" aria-label={t('cart')} className="relative rounded-xl p-2.5 text-slate-700 hover:bg-transparent hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-transparent dark:hover:text-indigo-300"><ShoppingCart size={22} /><Badge count={cartCount} /></Link>
            <Link to="/sell" aria-label={t('myListings')} className="hidden rounded-xl p-2.5 text-slate-700 hover:bg-transparent hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-transparent dark:hover:text-indigo-300 sm:block"><Package size={22} /></Link>
            <span className="mx-1 hidden h-9 w-px bg-slate-200 dark:bg-slate-800 sm:block" />
            <div ref={menuRef} className="relative"><button onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label={t('myAccount')} className="rounded-full p-0.5 hover:ring-2 hover:ring-indigo-200"><Avatar user={user} /></button>{menuOpen && <div className="absolute right-0 top-[calc(100%+14px)] w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-300/40 dark:border-slate-800 dark:bg-black"><div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800"><Avatar user={user} small /><div className="min-w-0"><p className="truncate font-bold text-slate-900 dark:text-white">{user.display_name || t('myAccount')}</p><p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p></div></div><div className="p-2"><MenuLink to="/account" icon={User} label={t('myAccount')} close={() => setMenuOpen(false)} /><MenuLink to="/orders" icon={Box} label={t('myOrders')} close={() => setMenuOpen(false)} /><MenuLink to="/saved" icon={Heart} label={t('savedItems')} close={() => setMenuOpen(false)} /><MenuLink to="/settings" icon={Settings} label={t('settings')} close={() => setMenuOpen(false)} /><MenuLink to="/help" icon={HelpCircle} label={t('helpSupport')} close={() => setMenuOpen(false)} />{isStaff && <MenuLink to="/admin" icon={Package} label={t('adminDashboard')} close={() => setMenuOpen(false)} />}</div><div className="border-t border-slate-100 p-3 dark:border-slate-800"><button onClick={signOut} className="flex w-full items-center justify-center gap-2 rounded-full bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600"><LogOut size={17} /> {t('signOut')}</button></div></div>}</div>
          </> : <><Link to="/login" className="px-3 py-2 text-sm font-semibold text-slate-600 hover:text-indigo-600">{t('signIn')}</Link><Link to="/register" className="rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">{t('signUp')}</Link></>}
        </div>
      </div>
      {user && <form onSubmit={submitSearch} className="px-4 pb-3 md:hidden"><label className="flex items-center rounded-full bg-slate-100 px-4 text-slate-400 dark:bg-slate-900"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products..." className="w-full bg-transparent py-2.5 text-sm outline-none dark:text-slate-200" /><button type="submit" aria-label="Search products"><Search size={19} /></button></label></form>}
    </nav>
  );
}
