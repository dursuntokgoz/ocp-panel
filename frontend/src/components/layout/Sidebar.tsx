import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  Globe,
  Mail,
  HardDrive,
  Terminal,
  FolderOpen,
  Activity,
  Calendar,
  FileText,
  Database,
  Shield,
  Cpu,
  BarChart2,
  Download,
  Settings,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';

interface NavItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    title: 'WHM',
    icon: Settings,
    children: [
      { title: 'Account Functions', icon: Users, path: '/whm/accounts' },
      { title: 'Packages', icon: Package, path: '/whm/packages' },
      { title: 'Resellers', icon: Users, path: '/whm/resellers' },
      { title: 'DNS Functions', icon: Globe, path: '/whm/dns' },
      { title: 'Email Functions', icon: Mail, path: '/whm/email' },
      { title: 'FTP Functions', icon: HardDrive, path: '/whm/ftp' },
    ],
  },
  {
    title: 'System',
    icon: Cpu,
    children: [
      { title: 'Terminal', icon: Terminal, path: '/system/terminal' },
      { title: 'File Manager', icon: FolderOpen, path: '/system/files' },
      { title: 'Process Manager', icon: Activity, path: '/system/processes' },
      { title: 'Cron Jobs', icon: Calendar, path: '/system/cron' },
      { title: 'Error Logs', icon: FileText, path: '/system/logs' },
      { title: 'MySQL', icon: Database, path: '/system/mysql' },
      { title: 'SSL/TLS Manager', icon: Shield, path: '/system/ssl' },
      { title: 'PHP Selector', icon: Cpu, path: '/system/php-selector' },
      { title: 'Firewall', icon: Shield, path: '/system/firewall' },
      { title: 'Monitoring', icon: BarChart2, path: '/system/monitoring' },
      { title: 'Backups', icon: Download, path: '/system/backups' },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<string[]>(['WHM', 'System']);

  const toggleSection = (title: string) => {
    setExpandedSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  return (
    <aside className="sidebar-nav flex-shrink-0 overflow-y-auto">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">OCP</span>
          </div>
          <span className="font-semibold text-slate-900">Panel v2</span>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1" aria-label="Main navigation">
        {navigation.map((section) => {
          const hasChildren = !!section.children;
          const isExpanded = expandedSections.includes(section.title);
          const isActive = hasChildren
            ? section.children!.some((child) => location.pathname.startsWith(child.path!))
            : location.pathname === section.path;

          if (!hasChildren) {
            return (
              <NavLink
                key={section.title}
                to={section.path!}
                className={({ isActive }) =>
                  clsx(
                    'sidebar-item',
                    isActive && 'active'
                  )
                }
                title={section.title}
              >
                <section.icon className="sidebar-item-icon" aria-hidden="true" />
                {section.title}
              </NavLink>
            );
          }

          return (
            <div key={section.title}>
              <button
                className={clsx(
                  'sidebar-item flex justify-between',
                  isActive && 'active'
                )}
                onClick={() => toggleSection(section.title)}
                aria-expanded={isExpanded}
              >
                <span className="flex items-center gap-2">
                  <section.icon className="sidebar-item-icon" aria-hidden="true" />
                  {section.title}
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>
              {isExpanded && (
                <div className="ml-6 mt-1 space-y-0.5 animate-slide-down">
                  {section.children!.map((child) => (
                    <NavLink
                      key={child.title}
                      to={child.path!}
                      className={({ isActive }) =>
                        clsx(
                          'sidebar-item text-sm',
                          isActive && 'active'
                        )
                      }
                      title={child.title}
                    >
                      <child.icon className="w-4 h-4" aria-hidden="true" />
                      {child.title}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="p-3 border-t border-slate-200">
        <NavLink
          to="/settings"
          className="sidebar-item"
          title="Settings"
        >
          <Settings className="sidebar-item-icon" aria-hidden="true" />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}