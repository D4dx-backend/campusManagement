import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Globe, Trash2, CheckCircle, AlertCircle, Clock, Star, RefreshCw, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { domainService, DomainMapping } from '@/services/domainService';
import { useConfirmation } from '@/hooks/useConfirmation';
import { ExportButton } from '@/components/ui/export-button';
import { formatters } from '@/utils/exportUtils';
import { pageConfigurations } from '@/utils/pageTemplates';

const DomainManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ domain: '', domainType: 'subdomain' as const, isPrimary: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const { confirm, ConfirmationComponent } = useConfirmation();

  const isPlatformAdmin = user?.role === 'platform_admin';

  // Fetch domains
  const { data: domains = [], isLoading } = useQuery({
    queryKey: ['domains'],
    queryFn: () => domainService.getDomains(),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: domainService.createDomain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      setDialogOpen(false);
      setForm({ domain: '', domainType: 'subdomain', isPrimary: false });
      toast({ title: 'Domain added successfully' });
    },
    onError: (err: any) => {
      toast({
        title: 'Something went wrong while adding the domain. Please try again.',
        description: err?.response?.data?.message || err.message,
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: domainService.deleteDomain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      toast({ title: 'Domain removed' });
    },
    onError: (err: any) => {
      toast({ title: 'Something went wrong while deleting. Please try again.', description: err?.response?.data?.message || err.message, variant: 'destructive' });
    },
  });

  // Verify mutation
  const verifyMutation = useMutation({
    mutationFn: domainService.verifyDomain,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      toast({
        title: result.success ? 'Domain verified!' : 'Verification failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
    },
  });

  // Set primary mutation
  const setPrimaryMutation = useMutation({
    mutationFn: (id: string) => domainService.updateDomain(id, { isPrimary: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      toast({ title: 'Primary domain updated' });
    },
  });

  const handleCreate = () => {
    if (!form.domain.trim()) return;
    createMutation.mutate({
      domain: form.domain.trim(),
      domainType: form.domainType,
      organizationId: user?.organizationId,
      isPrimary: form.isPrimary,
    });
  };

  const handleDelete = async (d: DomainMapping) => {
    const ok = await confirm({
      title: 'Delete Domain Mapping',
      message: `Remove "${d.domain}" mapping? This will affect users accessing via this domain.`,
    });
    if (ok) deleteMutation.mutate(d._id);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
      active: { icon: CheckCircle, color: 'text-green-600 bg-green-50', label: 'Active' },
      inactive: { icon: AlertCircle, color: 'text-gray-500 bg-gray-50', label: 'Inactive' },
      pending_verification: { icon: Clock, color: 'text-yellow-600 bg-yellow-50', label: 'Pending' },
    };
    const c = config[status] || config.inactive;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${c.color}`}>
        <Icon className="w-3 h-3" />
        {c.label}
      </span>
    );
  };

  const getSslBadge = (ssl: string) => {
    if (ssl === 'active') return <span className="text-xs text-green-600">SSL Active</span>;
    if (ssl === 'error') return <span className="text-xs text-red-600">SSL Error</span>;
    return <span className="text-xs text-yellow-600">SSL Pending</span>;
  };

  const getOrgName = (orgId: DomainMapping['organizationId']) => {
    if (typeof orgId === 'object' && orgId !== null) return orgId.name;
    return orgId;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Domain Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Map custom domains or subdomains to {isPlatformAdmin ? 'organizations' : 'your organization'}
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Domain
          </Button>
        </div>

        {/* Info card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            How Domain Mapping Works
          </h3>
          <ol className="text-sm text-blue-800 mt-2 space-y-1 list-decimal list-inside">
            <li><strong>Add</strong> your domain or subdomain here (e.g. <code>school.campuswise.in</code> or <code>myschool.edu</code>)</li>
            <li><strong>Point DNS</strong> — In Cloudflare (or your DNS provider), create a CNAME record pointing to <code>{window.location.hostname}</code></li>
            <li><strong>Verify</strong> — Click verify to confirm DNS is configured correctly</li>
            <li>Once verified, anyone accessing your domain will see your organization's branding and logo</li>
          </ol>
        </div>

        {/* Search + Filters + Export */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search domains..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType || '__all__'} onValueChange={v => setFilterType(v === '__all__' ? '' : v)}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Types</SelectItem>
              <SelectItem value="subdomain">Subdomain</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus || '__all__'} onValueChange={v => setFilterStatus(v === '__all__' ? '' : v)}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending_verification">Pending</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <ExportButton
            data={domains}
            filename="domains"
            columns={pageConfigurations.domains.exportColumns.map(col => ({
              ...col,
              formatter: col.formatter ? formatters[col.formatter] : undefined
            }))}
          />
        </div>

        {/* Domain table */}
        {(() => {
          const filteredDomains = domains.filter(d => {
            const matchSearch = !searchTerm || d.domain.toLowerCase().includes(searchTerm.toLowerCase());
            const matchStatus = !filterStatus || d.status === filterStatus;
            const matchType = !filterType || d.domainType === filterType;
            return matchSearch && matchStatus && matchType;
          });

          return (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Type</TableHead>
                {isPlatformAdmin && <TableHead>Organization</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead>SSL</TableHead>
                <TableHead>Primary</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={isPlatformAdmin ? 7 : 6} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredDomains.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isPlatformAdmin ? 7 : 6} className="text-center py-8 text-muted-foreground">
                    No domains found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDomains.map((d) => (
                  <TableRow key={d._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{d.domain}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded ${d.domainType === 'subdomain' ? 'bg-purple-50 text-purple-700' : 'bg-indigo-50 text-indigo-700'}`}>
                        {d.domainType === 'subdomain' ? 'Subdomain' : 'Custom Domain'}
                      </span>
                    </TableCell>
                    {isPlatformAdmin && <TableCell className="text-sm">{getOrgName(d.organizationId)}</TableCell>}
                    <TableCell>{getStatusBadge(d.status)}</TableCell>
                    <TableCell>{getSslBadge(d.sslStatus)}</TableCell>
                    <TableCell>
                      {d.isPrimary ? (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => setPrimaryMutation.mutate(d._id)}
                        >
                          Set Primary
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => verifyMutation.mutate(d._id)}
                          disabled={verifyMutation.isPending}
                          title="Verify DNS"
                        >
                          <RefreshCw className={`w-4 h-4 ${verifyMutation.isPending ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(d)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
          );
        })()}
      </div>

      {/* Add Domain Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Domain Mapping</DialogTitle>
            <DialogDescription>Map a domain or subdomain to your organization</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Domain Type</Label>
              <Select
                value={form.domainType}
                onValueChange={(v) => setForm((f) => ({ ...f, domainType: v as 'subdomain' | 'custom' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subdomain">Subdomain (e.g. school.campuswise.in)</SelectItem>
                  <SelectItem value="custom">Custom Domain (e.g. myschool.edu)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Domain</Label>
              <Input
                value={form.domain}
                onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
                placeholder={
                  form.domainType === 'subdomain'
                    ? 'myschool.campuswise.in'
                    : 'www.myschool.edu'
                }
              />
              <p className="text-xs text-muted-foreground">
                {form.domainType === 'subdomain'
                  ? 'Enter the full subdomain (e.g. schoolname.campuswise.in)'
                  : 'Enter your custom domain (e.g. admin.myschool.edu)'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrimary"
                checked={form.isPrimary}
                onChange={(e) => setForm((f) => ({ ...f, isPrimary: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isPrimary" className="text-sm font-normal">
                Set as primary domain
              </Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!form.domain.trim() || createMutation.isPending}>
                {createMutation.isPending ? 'Adding...' : 'Add Domain'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationComponent />
    </AppLayout>
  );
};

export default DomainManagement;
