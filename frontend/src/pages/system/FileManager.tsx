import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, apiEndpoints } from '../../api/client';
import { Loader2, HardDrive, FolderOpen, FileText } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';

interface FileItem {
  name: string;
  path: string;
  size: number;
  type: 'file' | 'directory';
  modified: string;
  permissions: string;
}

export function SystemFileManager() {
  const [currentPath, setCurrentPath] = useState('/home');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['files', currentPath],
    queryFn: async () => {
      const response = await api.get<{ ok: boolean; files: FileItem[]; path: string }>(`${apiEndpoints.system.files}?path=${encodeURIComponent(currentPath)}`);
      return response.data;
    },
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    setSelectedItems([]);
  };

  const goUp = () => {
    if (currentPath !== '/') {
      const parent = currentPath.split('/').slice(0, -1).join('/') || '/';
      navigateTo(parent);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        Failed to load directory: {(error as any).response?.data?.error || 'Unknown error'}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">File Manager</h1>
          <p className="page-subtitle">Browse and manage server files</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-x3-secondary btn-x3-sm" onClick={goUp} disabled={currentPath === '/'}>
            <FolderOpen className="w-4 h-4 mr-1" /> Up
          </button>
          <button className="btn-x3-primary btn-x3-sm">
            <FileText className="w-4 h-4 mr-1" /> New File
          </button>
          <button className="btn-x3-secondary btn-x3-sm">
            <FolderOpen className="w-4 h-4 mr-1" /> New Folder
          </button>
        </div>
      </div>

      <div className="mb-4 p-3 bg-slate-50 rounded-lg">
        <span className="text-sm text-slate-600">Path: </span>
        <span className="font-mono text-sm text-slate-900">{currentPath}</span>
      </div>

      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-10"><input type="checkbox" /></th>
                  <th>Name</th>
                  <th>Size</th>
                  <th>Permissions</th>
                  <th>Modified</th>
                </tr>
              </thead>
              <tbody>
                {currentPath !== '/' && (
                  <tr>
                    <td colSpan={5} className="p-3">
                      <button className="flex items-center gap-2 text-slate-600 hover:text-slate-900" onClick={goUp}>
                        <FolderOpen className="w-4 h-4" />
                        <span>.. (Parent Directory)</span>
                      </button>
                    </td>
                  </tr>
                )}
                {data?.files?.map((file) => (
                  <tr key={file.path}>
                    <td className="p-3">
                      <input type="checkbox" value={file.path} onChange={(e) => {
                        if (e.target.checked) setSelectedItems((s) => [...s, file.path]);
                        else setSelectedItems((s) => s.filter((p) => p !== file.path));
                      }} />
                    </td>
                    <td className="p-3">
                      <button
                        className="flex items-center gap-2 text-slate-700 hover:text-slate-900"
                        onClick={() => file.type === 'directory' ? navigateTo(file.path) : {}}
                      >
                        {file.type === 'directory' ? (
                          <FolderOpen className="w-4 h-4 text-yellow-600" />
                        ) : (
                          <FileText className="w-4 h-4 text-slate-400" />
                        )}
                        <span>{file.name}</span>
                      </button>
                    </td>
                    <td className="p-3 text-slate-500 text-sm">{file.type === 'file' ? formatBytes(file.size) : '—'}</td>
                    <td className="p-3 font-mono text-sm text-slate-500">{file.permissions}</td>
                    <td className="p-3 text-slate-500 text-sm">{new Date(file.modified).toLocaleString()}</td>
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