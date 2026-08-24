import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/dashboard/Dashboard';
import { WHMAccounts } from './pages/whm/Accounts';
import { WHMPackages } from './pages/whm/Packages';
import { WHMResellers } from './pages/whm/Resellers';
import { WHMDNS } from './pages/whm/DNS';
import { WHMEmail } from './pages/whm/Email';
import { WHMFTP } from './pages/whm/FTP';
import { SystemTerminal } from './pages/system/Terminal';
import { SystemFileManager } from './pages/system/FileManager';
import { SystemProcesses } from './pages/system/Processes';
import { SystemCron } from './pages/system/Cron';
import { SystemLogs } from './pages/system/Logs';
import { SystemMySQL } from './pages/system/MySQL';
import { SystemSSL } from './pages/system/SSL';
import { SystemPHPSelector } from './pages/system/PHPSelector';
import { SystemFirewall } from './pages/system/Firewall';
import { SystemMonitoring } from './pages/system/Monitoring';
import { SystemBackups } from './pages/system/Backups';
import { Settings } from './pages/Settings';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ToastContainer } from './components/ui/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              {/* WHM Routes */}
              <Route path="/whm/accounts" element={<WHMAccounts />} />
              <Route path="/whm/packages" element={<WHMPackages />} />
              <Route path="/whm/resellers" element={<WHMResellers />} />
              <Route path="/whm/dns" element={<WHMDNS />} />
              <Route path="/whm/email" element={<WHMEmail />} />
              <Route path="/whm/ftp" element={<WHMFTP />} />
              {/* System Routes */}
              <Route path="/system/terminal" element={<SystemTerminal />} />
              <Route path="/system/files" element={<SystemFileManager />} />
              <Route path="/system/processes" element={<SystemProcesses />} />
              <Route path="/system/cron" element={<SystemCron />} />
              <Route path="/system/logs" element={<SystemLogs />} />
              <Route path="/system/mysql" element={<SystemMySQL />} />
              <Route path="/system/ssl" element={<SystemSSL />} />
              <Route path="/system/php-selector" element={<SystemPHPSelector />} />
              <Route path="/system/firewall" element={<SystemFirewall />} />
              <Route path="/system/monitoring" element={<SystemMonitoring />} />
              <Route path="/system/backups" element={<SystemBackups />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
          <ToastContainer />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function AppLayout() {
  return (
    <div className="x3-frame flex h-screen overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="main-content flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default App;