import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

interface Reseller {
  username: string;
  package: string;
  email: string;
  created: string;
  exists: boolean;
  diskUsed: number;
  diskUsedH: string;
  packageInfo: any;
  domainCount: number;
  emailCount: number;
  ftpCount: number;
}

interface Domain {
  name: string;
  reseller: string;
  root: string;
  php: string | null;
  ssl: boolean;
  created: string;
  vhost: boolean;
  diskUsed: number;
  diskUsedH: string;
  packageInfo: any;
}

interface WHMContextType {
  // Reseller context
  selectedReseller: string | null;
  resellers: Reseller[];
  setSelectedReseller: (username: string | null) => Promise<void>;
  
  // Domain context
  selectedDomain: string | null;
  domains: Domain[];
  setSelectedDomain: (domain: string | null) => Promise<void>;
  
  // Loading states
  isLoadingResellers: boolean;
  isLoadingDomains: boolean;
  isSwitching: boolean;
  
  // Refresh
  refreshResellers: () => Promise<void>;
  refreshDomains: () => Promise<void>;
}

const WHMContext = createContext<WHMContextType | undefined>(undefined);

export function WHMProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [selectedReseller, setSelectedResellerState] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomainState] = useState<string | null>(null);
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoadingResellers, setIsLoadingResellers] = useState(false);
  const [isLoadingDomains, setIsLoadingDomains] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // Load resellers when authenticated
  const refreshResellers = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingResellers(true);
    try {
      const response = await api.get('/api/whm/resellers');
      if (response.data.ok) {
        setResellers(response.data.resellers);
      }
    } catch (err) {
      console.error('Failed to load resellers:', err);
    } finally {
      setIsLoadingResellers(false);
    }
  }, [isAuthenticated]);

  // Load domains when authenticated and reseller changes
  const refreshDomains = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingDomains(true);
    try {
      const params = new URLSearchParams();
      if (selectedReseller) params.append('owner', selectedReseller);
      const response = await api.get(`/api/whm/domains?${params}`);
      if (response.data.ok) {
        setDomains(response.data.domains);
        // Auto-select first domain if none selected and domains exist
        if (!selectedDomain && response.data.domains.length > 0) {
          setSelectedDomainState(response.data.domains[0].name);
        }
      }
    } catch (err) {
      console.error('Failed to load domains:', err);
    } finally {
      setIsLoadingDomains(false);
    }
  }, [selectedReseller, isAuthenticated]);

  // Switch reseller context
  const setSelectedReseller = useCallback(async (username: string | null) => {
    if (!isAuthenticated) return;
    setIsSwitching(true);
    try {
      if (username) {
        const response = await api.get(`/api/whm/resellers/switch/${encodeURIComponent(username)}`);
        if (response.data.ok) {
          setSelectedResellerState(username);
          // Reset domain when reseller changes
          setSelectedDomainState(null);
        }
      } else {
        // Switch back to root (all)
        setSelectedResellerState(null);
        setSelectedDomainState(null);
      }
    } catch (err) {
      console.error('Failed to switch reseller:', err);
    } finally {
      setIsSwitching(false);
    }
  }, [isAuthenticated]);

  // Switch domain context
  const setSelectedDomain = useCallback(async (domain: string | null) => {
    if (!isAuthenticated) return;
    setIsSwitching(true);
    try {
      if (domain) {
        const response = await api.get(`/api/whm/domains/switch/${encodeURIComponent(domain)}`);
        if (response.data.ok) {
          setSelectedDomainState(domain);
        }
      } else {
        setSelectedDomainState(null);
      }
    } catch (err) {
      console.error('Failed to switch domain:', err);
    } finally {
      setIsSwitching(false);
    }
  }, [isAuthenticated]);

  // Load initial data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshResellers();
    } else {
      // Clear data when not authenticated
      setResellers([]);
      setDomains([]);
      setSelectedResellerState(null);
      setSelectedDomainState(null);
    }
  }, [isAuthenticated, refreshResellers]);

  // Load domains when reseller changes and authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (selectedReseller) {
        refreshDomains();
      } else {
        // Load all domains when no reseller selected
        const loadDomains = async () => {
          setIsLoadingDomains(true);
          try {
            const response = await api.get('/api/whm/domains');
            if (response.data.ok) {
              setDomains(response.data.domains);
            }
          } catch (err) {
            console.error('Failed to load domains:', err);
          } finally {
            setIsLoadingDomains(false);
          }
        };
        loadDomains();
      }
    }
  }, [selectedReseller, isAuthenticated, refreshDomains]);

  return (
    <WHMContext.Provider value={{
      selectedReseller,
      resellers,
      setSelectedReseller,
      selectedDomain,
      domains,
      setSelectedDomain,
      isLoadingResellers,
      isLoadingDomains,
      isSwitching,
      refreshResellers,
      refreshDomains,
    }}>
      {children}
    </WHMContext.Provider>
  );
}

export function useWHM() {
  const context = useContext(WHMContext);
  if (!context) {
    throw new Error('useWHM must be used within a WHMProvider');
  }
  return context;
}