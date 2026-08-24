import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';

interface Package {
  name: string;
  diskGB: number;
  domains: number;
  emails: number;
  bandwidthGB: number;
  subdomains: number;
  price: number;
  created: string;
}

interface ApiResponse<T> {
  ok: boolean;
  packages: T[];
}

export function WHMPackages() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Package>>('/api/whm/packages');
      return response.data.packages || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (pkg: Omit<Package, 'created'>) => api.post('/api/whm/packages', pkg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      showToast('Package created successfully', 'success');
      setShowCreateModal(false);
    },
    onError: (err: any) => showToast(err.response?.data?.error || 'Failed to create package', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: (pkg: Package) => api.put(`/api/whm/packages/${pkg.name}`, pkg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      showToast('Package updated successfully', 'success');
      setEditingPackage(null);
    },
    onError: (err: any) => showToast(err.response?.data?.error || 'Failed to update package', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (name: string) => api.delete(`/api/whm/packages/${name}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      showToast('Package deleted successfully', 'success');
    },
    onError: (err: any) => showToast(err.response?.data?.error || 'Failed to delete package', 'error'),
  });

  const handleSubmit = (pkg: Package) => {
    if (editingPackage) {
      updateMutation.mutate(pkg);
    } else {
      createMutation.mutate(pkg);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Packages</h1>
          <p className="page-subtitle">Manage hosting packages</p>
        </div>
        <button
          className="btn-x3-primary"
          onClick={() => { setEditingPackage(null); setShowCreateModal(true); }}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Package
        </button>
      </div>

      <Card>
        <CardHeader title="Packages List" subtitle={`${data?.packages?.length || 0} packages`} />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Disk (GB)</th>
                  <th>Domains</th>
                  <th>Emails</th>
                  <th>Bandwidth (GB)</th>
                  <th>Subdomains</th>
                  <th>Price</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.packages?.map((pkg) => (
                  <tr key={pkg.name}>
                    <td className="font-medium">{pkg.name}</td>
                    <td>{pkg.diskGB} GB</td>
                    <td>{pkg.domains}</td>
                    <td>{pkg.emails}</td>
                    <td>{pkg.bandwidthGB} GB</td>
                    <td>{pkg.subdomains}</td>
                    <td>{pkg.price > 0 ? `₺${pkg.price}` : 'Free'}</td>
                    <td className="text-sm text-slate-500">{new Date(pkg.created).toLocaleDateString()}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
                          onClick={() => { setEditingPackage(pkg); setShowCreateModal(true); }}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                          onClick={() => {
                            if (confirm(`Delete package ${pkg.name}?`)) {
                              deleteMutation.mutate(pkg.name);
                            }
                          }}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {(showCreateModal || editingPackage) && (
        <div className="modal-overlay" onClick={() => { setShowCreateModal(false); setEditingPackage(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingPackage ? 'Edit Package' : 'Add Package'}</h3>
              <button className="p-1 text-slate-400 hover:text-slate-600" onClick={() => { setShowCreateModal(false); setEditingPackage(null); }}>
                ✕
              </button>
            </div>
            <PackageForm
              initialData={editingPackage}
              onSubmit={handleSubmit}
              onCancel={() => { setShowCreateModal(false); setEditingPackage(null); }}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface PackageFormProps {
  initialData: Package | null;
  onSubmit: (pkg: Package) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function PackageForm({ initialData, onSubmit, onCancel, isLoading }: PackageFormProps) {
  const [form, setForm] = useState({
    name: '',
    diskGB: 5,
    domains: 3,
    emails: 5,
    bandwidthGB: 10,
    subdomains: 5,
    price: 0,
  });

  useState(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        diskGB: initialData.diskGB,
        domains: initialData.domains,
        emails: initialData.emails,
        bandwidthGB: initialData.bandwidthGB,
        subdomains: initialData.subdomains,
        price: initialData.price,
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="x3-label">Package Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="x3-input"
            disabled={!!initialData}
            placeholder="e.g., Basic"
            required
          />
        </div>
        <div>
          <label className="x3-label">Disk (GB)</label>
          <input
            type="number"
            value={form.diskGB}
            onChange={(e) => setForm({ ...form, diskGB: parseInt(e.target.value) || 0 })}
            className="x3-input"
            min="0"
            required
          />
        </div>
        <div>
          <label className="x3-label">Domains</label>
          <input
            type="number"
            value={form.domains}
            onChange={(e) => setForm({ ...form, domains: parseInt(e.target.value) || 0 })}
            className="x3-input"
            min="0"
            required
          />
        </div>
        <div>
          <label className="x3-label">Emails</label>
          <input
            type="number"
            value={form.emails}
            onChange={(e) => setForm({ ...form, emails: parseInt(e.target.value) || 0 })}
            className="x3-input"
            min="0"
            required
          />
        </div>
        <div>
          <label className="x3-label">Bandwidth (GB)</label>
          <input
            type="number"
            value={form.bandwidthGB}
            onChange={(e) => setForm({ ...form, bandwidthGB: parseInt(e.target.value) || 0 })}
            className="x3-input"
            min="0"
            required
          />
        </div>
        <div>
          <label className="x3-label">Subdomains</label>
          <input
            type="number"
            value={form.subdomains}
            onChange={(e) => setForm({ ...form, subdomains: parseInt(e.target.value) || 0 })}
            className="x3-input"
            min="0"
            required
          />
        </div>
        <div>
          <label className="x3-label">Price (₺)</label>
          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
            className="x3-input"
            min="0"
            step="0.01"
          />
        </div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn-x3-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-x3-primary" disabled={isLoading}>
          {isLoading ? 'Saving...' : initialData ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}