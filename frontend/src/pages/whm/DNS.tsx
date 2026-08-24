import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Loader2, Globe, Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { useState } from 'react';

interface DNSZone {
  domain: string;
  serial: number;
  records: { type: string; name: string; value: string }[];
}

interface ApiResponse<T> {
  ok: boolean;
  zones: T[];
}

export function WHMDNS() {
  const { data, isLoading } = useQuery({
    queryKey: ['dns'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<DNSZone>>('/api/whm/dns-zones');
      return response.data.zones || [];
    },
  });

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
          <h1 className="page-title">DNS Functions</h1>
          <p className="page-subtitle">Manage DNS zones and records</p>
        </div>
        <button className="btn-x3-primary" disabled>
          <Plus className="w-4 h-4 mr-2" /> Add Zone
        </button>
      </div>

      <Card>
        <CardHeader title="DNS Zone Manager" subtitle={`${data?.zones?.length || 0} zones`} />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>Serial</th>
                  <th>Records</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.zones?.map((zone: any) => (
                  <tr key={zone.domain}>
                    <td className="font-medium">{zone.domain}</td>
                    <td>{zone.serial}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {zone.records?.map((r: any) => (
                          <span key={r.type} className="badge badge-gray">{r.type}: {r.name}</span>
                        ))}
                      </div>
                    </td>
                    <td className="text-right">
                      <button className="btn-x3-secondary btn-x3-sm mr-1" disabled>Edit</button>
                      <button className="btn-x3-danger btn-x3-sm" disabled>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}