import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { domainService, DomainBranding } from '@/services/domainService';

interface OrgBrandingContextType {
  branding: DomainBranding;
  isLoading: boolean;
  isDomainMapped: boolean;
}

const defaultBranding: DomainBranding = {
  resolved: false,
  organizationId: null,
  organizationName: 'CampusWise',
  organizationLogo: null,
  tagline: 'Institution Management System',
};

const OrgBrandingContext = createContext<OrgBrandingContextType>({
  branding: defaultBranding,
  isLoading: true,
  isDomainMapped: false,
});

export const useOrgBranding = () => useContext(OrgBrandingContext);

export const OrgBrandingProvider = ({ children }: { children: ReactNode }) => {
  const [branding, setBranding] = useState<DomainBranding>(defaultBranding);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const resolve = async () => {
      try {
        const hostname = window.location.hostname;
        // Skip resolution for plain localhost
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          setBranding(defaultBranding);
          setIsLoading(false);
          return;
        }
        const data = await domainService.resolveDomain(hostname);
        setBranding(data);
      } catch {
        setBranding(defaultBranding);
      } finally {
        setIsLoading(false);
      }
    };
    resolve();
  }, []);

  return (
    <OrgBrandingContext.Provider
      value={{
        branding,
        isLoading,
        isDomainMapped: branding.resolved,
      }}
    >
      {children}
    </OrgBrandingContext.Provider>
  );
};
