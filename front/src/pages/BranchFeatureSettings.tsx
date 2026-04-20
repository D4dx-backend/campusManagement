import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { featureService } from '@/services/featureService';
import { FeatureKey, FeatureRegistryItem } from '@/types';
import { Loader2, Settings2, GitBranch, Save, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchContext } from '@/contexts/BranchContext';
import { useFeatureAccess } from '@/contexts/FeatureContext';

const BranchFeatureSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { branches } = useBranchContext();
  const { refetch: refetchFeatures } = useFeatureAccess();

  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [registry, setRegistry] = useState<FeatureRegistryItem[]>([]);
  const [orgEnabledFeatures, setOrgEnabledFeatures] = useState<Set<FeatureKey>>(new Set());
  const [branchEnabledFeatures, setBranchEnabledFeatures] = useState<Set<FeatureKey>>(new Set());
  const [inheritsAll, setInheritsAll] = useState(true); // true = branch doesn't override, uses org defaults
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load registry
  useEffect(() => {
    featureService.getRegistry().then((res) => {
      setRegistry(res.data?.data || []);
    }).catch(() => {});
  }, []);

  // Load branch features when selection changes
  useEffect(() => {
    if (!selectedBranchId) return;
    setLoading(true);
    featureService.getBranchFeatures(selectedBranchId).then((res) => {
      const data = res.data?.data;
      if (data) {
        setOrgEnabledFeatures(new Set(data.orgEnabledFeatures));
        if (data.branchEnabledFeatures) {
          setBranchEnabledFeatures(new Set(data.branchEnabledFeatures));
          setInheritsAll(false);
        } else {
          setBranchEnabledFeatures(new Set(data.orgEnabledFeatures));
          setInheritsAll(true);
        }
      }
    }).catch(() => {
      toast({ title: 'Error', description: 'Failed to load branch features', variant: 'destructive' });
    }).finally(() => setLoading(false));
  }, [selectedBranchId]);

  const toggleFeature = (key: FeatureKey) => {
    if (!orgEnabledFeatures.has(key)) return; // can't enable features org doesn't have
    setBranchEnabledFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    setInheritsAll(false);
  };

  const resetToOrgDefaults = () => {
    setBranchEnabledFeatures(new Set(orgEnabledFeatures));
    setInheritsAll(true);
  };

  const handleSave = async () => {
    if (!selectedBranchId) return;
    setSaving(true);
    try {
      const features = inheritsAll
        ? [...orgEnabledFeatures] as FeatureKey[]
        : ([...branchEnabledFeatures] as FeatureKey[]);
      await featureService.updateBranchFeatures(selectedBranchId, features);
      toast({ title: 'Success', description: 'Branch features updated successfully' });
      refetchFeatures();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update features',
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
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings2 className="h-6 w-6" />
            Branch Feature Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Control which features are available per branch. Branches can only access features enabled at the organization level.
          </p>
        </div>

        {/* Branch Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Select Branch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Choose a branch..." />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b._id || b.id} value={b._id || b.id || ''}>
                    {b.name} ({b.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Feature Toggles */}
        {selectedBranchId && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Feature Modules</CardTitle>
                <CardDescription>
                  {inheritsAll
                    ? 'This branch inherits all features from the organization.'
                    : 'This branch has custom feature settings.'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {branchEnabledFeatures.size}/{orgEnabledFeatures.size} available
                </Badge>
                <Button size="sm" variant="outline" onClick={resetToOrgDefaults}>
                  Reset to Org Defaults
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {registry.map((feature) => {
                    const isOrgEnabled = orgEnabledFeatures.has(feature.key);
                    const isBranchEnabled = branchEnabledFeatures.has(feature.key);

                    return (
                      <div
                        key={feature.key}
                        className={`flex items-start justify-between rounded-lg border p-4 transition-colors ${
                          !isOrgEnabled
                            ? 'border-border bg-muted/50 opacity-60'
                            : isBranchEnabled
                              ? 'border-primary/30 bg-primary/5'
                              : 'border-border bg-muted/30'
                        }`}
                      >
                        <div className="space-y-1 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{feature.label}</span>
                            {!isOrgEnabled ? (
                              <Badge variant="secondary" className="text-[10px] gap-1">
                                <Lock className="h-2.5 w-2.5" /> Not in plan
                              </Badge>
                            ) : (
                              <Badge variant={isBranchEnabled ? 'default' : 'secondary'} className="text-[10px]">
                                {isBranchEnabled ? 'ON' : 'OFF'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{feature.description}</p>
                        </div>
                        <Switch
                          checked={isBranchEnabled}
                          onCheckedChange={() => toggleFeature(feature.key)}
                          disabled={!isOrgEnabled}
                        />
                      </div>
                    );
                  })}
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

export default BranchFeatureSettings;
