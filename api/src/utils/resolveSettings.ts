/**
 * Resolve effective settings for a branch.
 * Branch-level values override organization defaults.
 * If a branch field is null/undefined/empty, the org value is used.
 */

const SETTING_FIELDS = [
  'logo', 'website', 'taxId', 'taxLabel', 'currency', 'currencySymbol',
  'country', 'state', 'city', 'pincode', 'registrationNumber', 'footerText',
  'principalName'
] as const;

export interface ResolvedSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  website?: string;
  taxId?: string;
  taxLabel?: string;
  currency: string;
  currencySymbol?: string;
  country?: string;
  state?: string;
  city?: string;
  pincode?: string;
  registrationNumber?: string;
  footerText?: string;
  principalName?: string;
}

export function resolveSettings(org: any, branch?: any): ResolvedSettings {
  const resolved: any = {
    name: branch?.name || org?.name || '',
    address: branch?.address || org?.address || '',
    phone: branch?.phone || org?.phone || '',
    email: branch?.email || org?.email || '',
  };

  for (const field of SETTING_FIELDS) {
    // Use branch value if it exists and is non-empty, otherwise fall back to org
    const branchVal = branch?.[field];
    const orgVal = org?.[field];
    resolved[field] = (branchVal != null && branchVal !== '') ? branchVal : (orgVal || undefined);
  }

  // Ensure currency always has a value
  if (!resolved.currency) resolved.currency = 'BHD';

  return resolved as ResolvedSettings;
}
