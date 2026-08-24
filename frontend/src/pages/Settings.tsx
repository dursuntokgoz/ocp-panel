import { useState } from 'react';
import { api } from '../api/client';
import { Loader2, User, Key, Bell, Save, Server, HardDrive, Shield } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { useToast } from '../components/ui/Toast';

interface Settings {
  general: {
    hostname: string;
    port: number;
    ssl: boolean;
  };
  auth: {
    sessionTimeout: number;
    maxLoginAttempts: number;
  };
  notifications: {
    emailEnabled: boolean;
    telegramEnabled: boolean;
  };
}

const tabs = [
  { id: 'general', label: 'General', icon: Server },
  { id: 'auth', label: 'Authentication', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Key },
];

function GeneralTab() {
  return (
    <Card>
      <CardHeader title="General Settings" subtitle="Panel hostname, port, and SSL" />
      <CardBody className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="x3-label">Hostname</label>
            <input type="text" className="x3-input" defaultValue="ocp-panel" />
          </div>
          <div>
            <label className="x3-label">Port</label>
            <input type="number" className="x3-input" defaultValue="2083" min="1" max="65535" />
          </div>
          <div>
            <label className="x3-label">SSL Enabled</label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" defaultChecked />
              <span>Enable HTTPS</span>
            </label>
          </div>
          <div>
            <label className="x3-label">Language</label>
            <select className="x3-input" defaultValue="en">
              <option value="en">English</option>
              <option value="tr">Turkish</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-x3-primary">Save General Settings</button>
        </div>
      </CardBody>
    </Card>
  );
}

function AuthTab() {
  return (
    <Card>
      <CardHeader title="Authentication Settings" subtitle="Session and login configuration" />
      <CardBody className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="x3-label">Session Timeout (minutes)</label>
            <input type="number" className="x3-input" defaultValue="1440" min="1" />
          </div>
          <div>
            <label className="x3-label">Max Login Attempts</label>
            <input type="number" className="x3-input" defaultValue="5" min="1" max="20" />
          </div>
          <div>
            <label className="x3-label">Two-Factor Authentication</label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span>Require 2FA for admin users</span>
            </label>
          </div>
          <div>
            <label className="x3-label">Password Min Length</label>
            <input type="number" className="x3-input" defaultValue="8" min="6" max="32" />
          </div>
        </div>
        <button className="btn-x3-primary">Save Auth Settings</button>
      </CardBody>
    </Card>
  );
}

function NotificationsTab() {
  return (
    <Card>
      <CardHeader title="Notification Settings" subtitle="Configure alert channels" />
      <CardBody className="space-y-4">
        <div className="space-y-4">
          <div className="p-4 border border-slate-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Bell className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-slate-500">Receive alerts via email</p>
              </div>
              <label className="flex items-center gap-2 ml-auto">
                <input type="checkbox" className="rounded" defaultChecked />
              </label>
            </div>
          </div>
          <div className="p-4 border border-slate-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Telegram Notifications</p>
                <p className="text-sm text-slate-500">Receive alerts via Telegram bot</p>
              </div>
              <label className="flex items-center gap-2 ml-auto">
                <input type="checkbox" className="rounded" />
              </label>
            </div>
          </div>
          <div className="p-4 border border-slate-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <HardDrive className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Webhook Notifications</p>
                <p className="text-sm text-slate-500">Send alerts to custom webhook URL</p>
              </div>
              <label className="flex items-center gap-2 ml-auto">
                <input type="checkbox" className="rounded" />
              </label>
            </div>
          </div>
        </div>
        <button className="btn-x3-primary">Save Notification Settings</button>
      </CardBody>
    </Card>
  );
}

function SecurityTab() {
  return (
    <Card>
      <CardHeader title="Security Settings" subtitle="SSL, firewall, and access control" />
      <CardBody className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-slate-200 rounded-lg">
            <h3 className="font-medium mb-2">SSL Certificate</h3>
            <p className="text-sm text-slate-500 mb-3">Current: Self-signed (auto-generated)</p>
            <div className="flex gap-2">
              <button className="btn-x3-secondary btn-x3-sm">Regenerate</button>
              <button className="btn-x3-secondary btn-x3-sm">Upload Custom</button>
            </div>
          </div>
          <div className="p-4 border border-slate-200 rounded-lg">
            <h3 className="font-medium mb-2">IP Access Control</h3>
            <p className="text-sm text-slate-500 mb-3">Restrict panel access to specific IPs</p>
            <div className="flex gap-2">
              <button className="btn-x3-secondary btn-x3-sm">Manage Allowed IPs</button>
              <button className="btn-x3-secondary btn-x3-sm">View Blocked</button>
            </div>
          </div>
          <div className="p-4 border border-slate-200 rounded-lg">
            <h3 className="font-medium mb-2">Audit Log</h3>
            <p className="text-sm text-slate-500 mb-3">View security events and login attempts</p>
            <button className="btn-x3-secondary btn-x3-sm">View Audit Log</button>
          </div>
          <div className="p-4 border border-slate-200 rounded-lg">
            <h3 className="font-medium mb-2">API Access</h3>
            <p className="text-sm text-slate-500 mb-3">Manage API tokens and permissions</p>
            <button className="btn-x3-secondary btn-x3-sm">Manage API Keys</button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export function Settings() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'general' | 'auth' | 'notifications' | 'security'>('general');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (settings: Partial<Settings>) => {
    setIsLoading(true);
    try {
      await api.post('/api/settings', settings);
      showToast('Settings saved successfully', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to save settings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralTab />;
      case 'auth':
        return <AuthTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'security':
        return <SecurityTab />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure panel settings</p>
        </div>
      </div>

      <div className="tabs mb-6" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {renderTab()}
    </div>
  );
}