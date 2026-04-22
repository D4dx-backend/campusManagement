import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { featureService } from '@/services/featureService';
import { FeatureKey, FeatureRegistryItem, ALL_FEATURE_KEYS } from '@/types';
import { Loader2, Settings2, Building2, Save } from 'lucide-react';
import { apiClient } from '@/lib/api';

const OrganizationFeatureSettings = () => {
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [registry, setRegistry] = useState<FeatureRegistryItem[]>([]);
  const [enabledFeatures, setEnabledFeatures] = useState<Set<FeatureKey>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  // Load organizations list
  useEffect(() => {
    apiClient.get<any[]>('/organizations').then((res) => {
      setOrganizations(res.data?.data || []);
    }).catch(() => {}).finally(() => setLoadingOrgs(false));

    featureService.getRegistry().then((res) => {
      setRegistry(res.data?.data || []);
    }).catch(() => {});
  }, []);

  // Load org features when org changes
  useEffect(() => {
    if (!selectedOrgId) return;
    setLoading(true);
    featureService.getOrgFeatures(selectedOrgId).then((res) => {
      const data = res.data?.data;
      if (data?.enabledFeatures) {
        setEnabledFeatures(new Set(data.enabledFeatures));
      }
    }).catch(() => {
      toast({ title: 'Error', description: 'Something went wrong while loading. Please try again organization features', variant: 'destructive' });
    }).finally(() => setLoading(false));
  }, [selectedOrgId]);

  const toggleFeature = (key: FeatureKey) => {
    setEnabledFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleAll = (enabled: boolean) => {
    setEnabledFeatures(enabled ? new Set(ALL_FEATURE_KEYS) : new Set());
  };

  const handleSave = async () => {
    if (!selectedOrgId) return;
    setSaving(true);
    try {
      await featureService.updateOrgFeatures(selectedOrgId, [...enabledFeatures] as FeatureKey[]);
      toast({ title: 'Success', description: 'Organization features updated successfully' });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Something went wrong while updating. Please try again features',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Settings2 className="h-6 w-6" />
              Organization Feature Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Control which features/modules are available to each organization
            </p>
          </div>
        </div>

        {/* Organization Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Select Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingOrgs ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading organizations...
              </div>
            ) : (
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                <SelectTrigger className="max-w-md">
                  <SelectValue placeholder="Choose an organization..." />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org: any) => (
                    <SelectItem key={org._id || org.id} value={org._id || org.id}>
                      {org.name} ({org.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {/* Feature Toggles */}
        {selectedOrgId && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Feature Modules</CardTitle>
                <CardDescription>Toggle features on/off for this organization. Changes affect all branches.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{enabledFeatures.size}/{registry.length} enabled</Badge>
                <Button size="sm" variant="outline" onClick={() => toggleAll(true)}>Enable All</Button>
                <Button size="sm" variant="outline" onClick={() => toggleAll(false)}>Disable All</Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {registry.map((feature) => (
                    <div
                      key={feature.key}
                      className={`flex items-start justify-between rounded-lg border p-4 transition-colors ${
                        enabledFeatures.has(feature.key) ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30'
                      }`}
                    >
                      <div className="space-y-1 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{feature.label}</span>
                          <Badge variant={enabledFeatures.has(feature.key) ? 'default' : 'secondary'} className="text-[10px]">
                            {enabledFeatures.has(feature.key) ? 'ON' : 'OFF'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                      <Switch
                        checked={enabledFeatures.has(feature.key)}
                        onCheckedChange={() => toggleFeature(feature.key)}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Save */}
              <div className="mt-6 flex justify-end">
                <Button onClick={handleSave} disabled={saving || loading}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default OrganizationFeatureSettings;
