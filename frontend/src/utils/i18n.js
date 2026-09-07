import { useAuthStore } from '../store/useAuthStore';

const translations = {
  en: {
    marketplace: 'Marketplace', searchProducts: 'Search products...', notifications: 'Notifications', messages: 'Messages', cart: 'Cart', myListings: 'My Listings', signIn: 'Sign in', signUp: 'Sign up', myAccount: 'My Account', myOrders: 'My Orders', savedItems: 'Saved Items', settings: 'Settings', helpSupport: 'Help & Support', adminDashboard: 'Admin Dashboard', signOut: 'Sign Out',
    preferences: 'Preferences', settingsTitle: 'Settings', payouts: 'Payouts & Banking', privacy: 'Privacy & Security', appearance: 'Appearance & Accessibility', dataAccount: 'Data & Account Management', searchListings: 'Search listings...', allCategories: 'All categories', newest: 'Newest', noListings: 'No listings match your filters.',
  },
  fr: {
    marketplace: 'Marché', searchProducts: 'Rechercher des produits...', notifications: 'Notifications', messages: 'Messages', cart: 'Panier', myListings: 'Mes annonces', signIn: 'Se connecter', signUp: "S'inscrire", myAccount: 'Mon compte', myOrders: 'Mes commandes', savedItems: 'Articles enregistrés', settings: 'Paramètres', helpSupport: 'Aide et assistance', adminDashboard: 'Tableau de bord', signOut: 'Se déconnecter',
    preferences: 'Préférences', settingsTitle: 'Paramètres', payouts: 'Paiements et banque', privacy: 'Confidentialité et sécurité', appearance: 'Apparence et accessibilité', dataAccount: 'Données et compte', searchListings: 'Rechercher des annonces...', allCategories: 'Toutes les catégories', newest: 'Plus récent', noListings: 'Aucune annonce ne correspond à vos filtres.',
  },
  es: {
    marketplace: 'Mercado', searchProducts: 'Buscar productos...', notifications: 'Notificaciones', messages: 'Mensajes', cart: 'Carrito', myListings: 'Mis anuncios', signIn: 'Iniciar sesión', signUp: 'Registrarse', myAccount: 'Mi cuenta', myOrders: 'Mis pedidos', savedItems: 'Artículos guardados', settings: 'Configuración', helpSupport: 'Ayuda y soporte', adminDashboard: 'Panel de administración', signOut: 'Cerrar sesión',
    preferences: 'Preferencias', settingsTitle: 'Configuración', payouts: 'Pagos y banca', privacy: 'Privacidad y seguridad', appearance: 'Apariencia y accesibilidad', dataAccount: 'Datos y cuenta', searchListings: 'Buscar anuncios...', allCategories: 'Todas las categorías', newest: 'Más recientes', noListings: 'Ningún anuncio coincide con tus filtros.',
  },
};

export function useTranslation() {
  const language = useAuthStore((state) => state.user?.preferences?.language || 'en');
  const dictionary = translations[language] || translations.en;
  return (key) => dictionary[key] || translations.en[key] || key;
}
