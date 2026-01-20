import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Label } from '@/components/ui/label';

import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Trash2, Loader2, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useCurrentReceiptConfig,
  useCreateReceiptConfig,
  useUpdateReceiptConfig, 
  useDeleteReceiptConfig 
} from '@/hooks/useReceiptConfig';
import { CreateReceiptConfigData, ReceiptConfig } from '@/types/receipt';
import { receiptService } from '@/services/receiptService';

const ReceiptConfigPage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Get current user's branch ID for API calls
  const currentBranchId = user?.branchId || '';

  // Debug: Log user and branch info

  // Get receipt config for current user's branch
  const { data: configResponse, isLoading, error } = useCurrentReceiptConfig();
  const createMutation = useCreateReceiptConfig();
  const updateMutation = useUpdateReceiptConfig();
  const deleteMutation = useDeleteReceiptConfig();

  // Get config from response
  const config = configResponse?.data || null;

  // Debug: Log config loading

  const [formData, setFormData] = useState<CreateReceiptConfigData>({
    schoolName: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logo: '',
    taxNumber: '',
    registrationNumber: '',
    footerText: '',
    isActive: true,
  });

  // Initialize form data when config is loaded
  useEffect(() => {
    if (config) {
      setIsEditing(false); // Set to view mode when config exists
      setFormData({
        schoolName: config.schoolName,
        address: config.address,
        phone: config.phone,
        email: config.email,
        website: config.website || '',
        logo: config.logo || '',
        taxNumber: config.taxNumber || '',
        registrationNumber: config.registrationNumber || '',
        footerText: config.footerText || '',
        isActive: config.isActive,
      });
      if (config.logo) {
        setLogoPreview(config.logo);
      }
      // Clear any selected file when loading existing config
      setLogoFile(null);
    } else {
      setIsEditing(true); // Set to edit mode when no config exists (first time)
    }
  }, [config]);

  const resetForm = () => {
    setFormData({
      schoolName: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      logo: '',
      taxNumber: '',
      registrationNumber: '',
      footerText: '',
      isActive: true,
    });
    setLogoFile(null);
    setLogoPreview('');
  };

  // Handle logo file selection
  const handleLogoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file (PNG, JPG, etc.)',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 2MB',
          variant: 'destructive',
        });
        return;
      }

      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };



  // Upload logo file
  const uploadLogo = async (): Promise<string> => {
    if (!logoFile) return formData.logo;

    setIsUploading(true);
    try {
      const result = await receiptService.uploadLogo(logoFile, currentBranchId);
      const logoPath = result.data.logoPath;
      return logoPath;
    } catch (error: any) {
      console.error('Logo upload error:', error);
      console.error('Error details:', error.response?.data);
      
      // Show specific error message if available
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload logo';
      
      toast({
        title: 'Logo upload failed',
        description: `${errorMessage}. Configuration will be saved without logo update.`,
        variant: 'destructive',
      });
      
      // Return current logo path instead of throwing
      return formData.logo;
    } finally {
      setIsUploading(false);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setFormData({ ...formData, logo: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate branch ID
    if (!currentBranchId) {
      toast({
        title: 'Error',
        description: 'No branch ID found. Please contact your administrator.',
        variant: 'destructive',
      });
      return;
    }

    // Validate user permissions
    if (!user) {
      toast({
        title: 'Error',
        description: 'User not authenticated. Please login again.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Upload logo if a new file is selected (errors handled gracefully in uploadLogo)
      let logoPath = formData.logo;
      if (logoFile) {
        logoPath = await uploadLogo();
      }

      const submitData = {
        branchId: currentBranchId, // Include branch ID for API
        schoolName: formData.schoolName,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        logo: logoPath,
        taxNumber: formData.taxNumber,
        registrationNumber: formData.registrationNumber,
        footerText: formData.footerText,
        isActive: formData.isActive,
      };

      if (config) {
        // Update existing config
        await updateMutation.mutateAsync({
          id: config._id,
          data: submitData
        });
        setIsEditing(false); // Exit edit mode after successful update
      } else {
        // Create new config
        await createMutation.mutateAsync(submitData);
        setIsEditing(false); // Exit edit mode after successful creation
      }

      // Clear the selected file and update preview to show CDN image
      setLogoFile(null);
      if (logoPath && logoPath !== formData.logo) {
        // Validate that we received a CDN URL, not a local path
        if (logoPath.startsWith('/uploads/') || logoPath.startsWith('uploads/') || logoPath.includes('localhost')) {
          console.error('Received local path instead of CDN URL');
          toast({
            title: 'Upload Error',
            description: 'Received local path instead of CDN URL. Please check backend CDN configuration.',
            variant: 'destructive',
          });
          return; // Don't update preview with invalid path
        }
        
        // Update preview to show the uploaded image from CDN
        setLogoPreview(logoPath);
      }
    } catch (error: any) {
      // Enhanced error handling
      console.error('Submit error:', error);
      
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        toast({
          title: 'Configuration Already Exists',
          description: 'A receipt configuration already exists for your branch. The page will refresh to load it.',
          variant: 'default',
        });
        // Refresh to load the existing config
        setTimeout(() => window.location.reload(), 2000);
      } else if (error.response?.status === 403) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to perform this action. Please contact your administrator.',
          variant: 'destructive',
        });
      } else if (error.response?.status === 401) {
        toast({
          title: 'Authentication Error',
          description: 'Your session has expired. Please login again.',
          variant: 'destructive',
        });
      }
    }
  }; 

  const handleDelete = async () => {
    if (config && window.confirm('Are you sure you want to delete this receipt configuration?')) {
      try {
        await deleteMutation.mutateAsync(config._id);
        resetForm();
        setIsEditing(true); // Enable editing after delete
      } catch (error) {
        // Error handling is done in the mutation hook
      }
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to original config values
    if (config) {
      setFormData({
        schoolName: config.schoolName,
        address: config.address,
        phone: config.phone,
        email: config.email,
        website: config.website || '',
        logo: config.logo || '',
        taxNumber: config.taxNumber || '',
        registrationNumber: config.registrationNumber || '',
        footerText: config.footerText || '',
        isActive: config.isActive,
      });
      setLogoPreview(config.logo || '');
      setLogoFile(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Receipt Configuration</h1>
          <p className="text-muted-foreground mt-1">
            {config 
              ? 'Update your receipt template settings below' 
              : 'Create your receipt template - you can update it anytime after creation'
            }
          </p>
        </div>

        {/* Info Card */}
        {!config && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="text-blue-600 mt-0.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-1">First Time Setup</h3>
                  <p className="text-sm text-blue-800">
                    You're creating your receipt configuration for the first time. After saving, you can update these settings anytime - no need to delete and recreate.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="schoolName">School Name *</Label>
                <Input
                  id="schoolName"
                  value={formData.schoolName}
                  onChange={e => setFormData({ ...formData, schoolName: e.target.value })}
                  required
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  required
                  rows={3}
                  disabled={!isEditing}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    required
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://www.example.com"
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxNumber">Tax Number</Label>
                  <Input
                    id="taxNumber"
                    value={formData.taxNumber}
                    onChange={e => setFormData({ ...formData, taxNumber: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationNumber">Registration Number</Label>
                <Input
                  id="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              {/* Logo Upload Section */}
              <div className="space-y-3">
                <Label>School Logo</Label>
                <div className="space-y-4">
                  {/* Logo Preview */}
                  {logoPreview && (
                    <div className="relative inline-block">
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="h-24 w-24 object-contain border rounded-lg bg-gray-50 p-2"
                        onError={(e) => {
                          console.error('Image failed to load');
                        }}
                      />
                      {isEditing && (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={removeLogo}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {/* Upload Button */}
                  {isEditing && (
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="gap-2"
                      >
                        {isUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        {logoPreview ? 'Change Logo' : 'Upload Logo'}
                      </Button>

                      <span className="text-sm text-gray-500">
                        PNG, JPG up to 2MB
                      </span>
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoSelect}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="footerText">Footer Text</Label>
                <Textarea
                  id="footerText"
                  value={formData.footerText}
                  onChange={e => setFormData({ ...formData, footerText: e.target.value })}
                  placeholder="Thank you for your payment..."
                  rows={3}
                  disabled={!isEditing}
                />
              </div>

              <div className="flex items-center space-x-3">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  disabled={!isEditing}
                />
                <Label htmlFor="isActive" className="text-sm font-medium">
                  Active Configuration
                </Label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                {config && !isEditing ? (
                  // View mode - show Edit button
                  <Button 
                    type="button" 
                    onClick={handleEdit}
                  >
                    Edit Configuration
                  </Button>
                ) : (
                  // Edit mode - show Update/Save and Cancel buttons
                  <>
                    {config && (
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending || isUploading || !currentBranchId}
                      className="min-w-[120px]"
                    >
                      {(createMutation.isPending || updateMutation.isPending || isUploading) && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      {isUploading ? 'Uploading...' : (config ? 'Update Configuration' : 'Save Configuration')}
                    </Button>
                  </>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}

        {!currentBranchId && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="text-red-600 mb-4">
                  <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-red-800">No Branch Access</h3>
                <p className="text-red-600 mb-4">
                  No branch is associated with your account. Please contact your administrator.
                </p>
                <p className="text-sm text-gray-600">
                  Please contact your administrator if you believe this is an error.
                </p>
              </div>
            </CardContent>
          </Card>
        )}



        {error && currentBranchId && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="text-yellow-600 mb-4">
                  <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-yellow-800">Loading Issue</h3>
                <p className="text-yellow-600 mb-4">
                  {error?.response?.data?.message || 'Unable to load receipt configurations. You can still create a new configuration.'}
                </p>
                <p className="text-sm text-gray-600">
                  The form above is still available for creating your receipt configuration.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default ReceiptConfigPage;