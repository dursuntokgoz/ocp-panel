import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Loader2, Shield, Globe, Settings, Plus, ToggleLeft, Trash2, Edit } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import { clsx } from 'clsx';

interface FirewallRule {
  num: number;
  action: string;
  from: string;
  to: string;
  extra: string;
}

interface FirewallSettings {
  ufwEnabled: boolean;
  defaults: { incoming: string; outgoing: string; routed: string };
  logging: string;
}

interface GeoIPSettings {
  enabled: boolean;
  countries: string[];
}

export function SystemFirewall() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'rules' | 'settings' | 'geoip' | 'fail2ban'>('rules');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: rulesData } = useQuery({
    queryKey: ['firewall', 'rules'],
    queryFn: async () => {
      const response = await api.get('/api/firewall/rules');
      return response.data;
    },
  });

  const { data: settingsData } = useQuery({
    queryKey: ['firewall', 'settings'],
    queryFn: async () => {
      const response = await api.get('/api/firewall/settings');
      return response.data;
    },
  });

  const tabs = [
    { id: 'rules', label: 'UFW Rules', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'geoip', label: 'GeoIP', icon: Globe },
    { id: 'fail2ban', label: 'Fail2Ban', icon: Shield },
  ];

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Firewall Manager</h1>
          <p className="page-subtitle">Configure UFW, GeoIP blocking, and Fail2Ban</p>
        </div>
        {activeTab === 'rules' && (
          <button className="btn-x3-primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Rule
          </button>
        )}
      </div>

      <div className="tabs mb-6" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={clsx('tab', activeTab === tab.id && 'active')}
            onClick={() => setActiveTab(tab.id as any)}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'rules' && (
        <Card>
          <CardHeader title="UFW Rules" subtitle={`Status: ${rulesData?.status?.active ? 'Active' : 'Inactive'}`} />
          <CardBody>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Action</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Details</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rulesData?.rules?.map((rule: FirewallRule) => (
                    <tr key={rule.num}>
                      <td className="font-mono">{rule.num}</td>
                      <td>
                        <span className={clsx('badge', rule.action === 'ALLOW' ? 'badge-success' : 'badge-danger')}>
                          {rule.action}
                        </span>
                      </td>
                      <td className="font-mono text-sm">{rule.from}</td>
                      <td className="font-mono text-sm">{rule.to}</td>
                      <td className="text-sm text-slate-500">{rule.extra}</td>
                      <td className="text-right">
                        <button className="btn-x3-secondary btn-x3-sm mr-1" disabled><Edit className="w-4 h-4" /></button>
                        <button className="btn-x3-danger btn-x3-sm" disabled><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="UFW Status" />
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Firewall Status</p>
                  <p className="text-sm text-slate-500">{settingsData?.settings?.ufwEnabled ? 'Enabled' : 'Disabled'}</p>
                </div>
                <ToggleLeft
                  className={clsx('w-10 h-6', settingsData?.settings?.ufwEnabled ? 'bg-blue-600' : 'bg-slate-300')}
                  checked={settingsData?.settings?.ufwEnabled}
                  onChange={() => {}}
                  disabled
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="x3-label">Default Incoming</label>
                  <select className="x3-input" defaultValue={settingsData?.settings?.defaults?.incoming} disabled>
                    <option value="deny">Deny</option>
                    <option value="allow">Allow</option>
                    <option value="reject">Reject</option>
                  </select>
                </div>
                <div>
                  <label className="x3-label">Default Outgoing</label>
                  <select className="x3-input" defaultValue={settingsData?.settings?.defaults?.outgoing} disabled>
                    <option value="allow">Allow</option>
                    <option value="deny">Deny</option>
                    <option value="reject">Reject</option>
                  </select>
                </div>
                <div>
                  <label className="x3-label">Default Routed</label>
                  <select className="x3-input" defaultValue={settingsData?.settings?.defaults?.routed} disabled>
                    <option value="allow">Allow</option>
                    <option value="deny">Deny</option>
                    <option value="reject">Reject</option>
                  </select>
                </div>
                <div>
                  <label className="x3-label">Logging Level</label>
                  <select className="x3-input" defaultValue={settingsData?.settings?.logging} disabled>
                    <option value="off">Off</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="full">Full</option>
                  </select>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Open Ports" />
            <CardBody>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Protocol</th>
                      <th>Local Address</th>
                      <th>State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settingsData?.openPorts?.map((port: any) => (
                      <tr key={port.local}>
                        <td className="font-mono">{port.proto}</td>
                        <td className="font-mono">{port.local}</td>
                        <td>{port.state}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'geoip' && (
        <Card>
          <CardHeader title="GeoIP Blocking" subtitle="Block traffic from specific countries" />
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="font-medium">Enable GeoIP Blocking</span>
                </label>
                <span className="text-sm text-slate-500">Requires iptables geoip module</span>
              </div>
              <div>
                <label className="x3-label">Blocked Countries (ISO codes, comma-separated)</label>
                <input type="text" className="x3-input" placeholder="CN, RU, KP, IR" disabled />
                <p className="text-sm text-slate-500 mt-1">Example: CN, RU, KP, IR, SY</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === 'fail2ban' && (
        <Card>
          <CardHeader title="Fail2Ban Jails" subtitle="Intrusion prevention" />
          <CardBody>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Jail</th>
                    <th>Status</th>
                    <th>Currently Failed</th>
                    <th>Total Failed</th>
                    <th>Banned IPs</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>sshd</td>
                    <td><span className="badge badge-success">Active</span></td>
                    <td>0</td>
                    <td>5</td>
                    <td><span className="badge badge-gray">2</span></td>
                    <td className="text-right">
                      <button className="btn-x3-secondary btn-x3-sm mr-1" disabled>View</button>
                      <button className="btn-x3-secondary btn-x3-sm" disabled>Unban IP</button>
                    </td>
                  </tr>
                  <tr>
                    <td>nginx-http-auth</td>
                    <td><span className="badge badge-success">Active</span></td>
                    <td>1</td>
                    <td>12</td>
                    <td><span className="badge badge-gray">0</span></td>
                    <td className="text-right">
                      <button className="btn-x3-secondary btn-x3-sm mr-1" disabled>View</button>
                      <button className="btn-x3-secondary btn-x3-sm" disabled>Unban IP</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}