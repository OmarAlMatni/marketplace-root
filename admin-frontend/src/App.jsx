import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import RequireStaff from './components/RequireStaff';
import RequireSuperAdmin from './components/RequireSuperAdmin';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import ModerationView from './views/ModerationView';
import UsersView from './views/UsersView';
import AdminAccountsView from './views/AdminAccountsView';
import ReportsView from './views/ReportsView';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginView />} />

      <Route
        element={
          <RequireStaff>
            <Layout />
          </RequireStaff>
        }
      >
        <Route path="/" element={<DashboardView />} />
        <Route path="/reports" element={<ReportsView />} />
        <Route path="/moderation" element={<ModerationView />} />
        <Route path="/users" element={<UsersView />} />
        <Route
          path="/accounts"
          element={
            <RequireSuperAdmin>
              <AdminAccountsView />
            </RequireSuperAdmin>
          }
        />
      </Route>
    </Routes>
  );
}
