import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { exportToExcel, exportToCSV, ExportColumn } from '@/utils/exportUtils';
import { useToast } from '@/hooks/use-toast';

interface ExportButtonProps {
  data: any[];
  columns: ExportColumn[];
  filename: string;
  disabled?: boolean;
  className?: string;
  fetchAllData?: () => Promise<any[]>;
}

export const ExportButton = ({ data, columns, filename, disabled = false, className, fetchAllData }: ExportButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format: 'excel' | 'csv') => {
    setIsExporting(true);
    
    try {
      // Use fetchAllData if provided, otherwise use current data
      let exportData = data;
      
      if (fetchAllData) {
        toast({
          title: 'Preparing Export',
          description: 'Fetching all filtered data for export...',
        });
        exportData = await fetchAllData();
      }

      if (!exportData || exportData.length === 0) {
        toast({
          title: 'No Data',
          description: 'No data available to export',
          variant: 'destructive',
        });
        return;
      }

      const result = format === 'excel' 
        ? exportToExcel({ filename, columns, data: exportData })
        : exportToCSV({ filename, columns, data: exportData });

      if (result.success) {
        toast({
          title: 'Export Successful',
          description: `${exportData.length} records exported to ${result.filename}`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export data',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={disabled || isExporting}
          className={className}
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export as Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileText className="w-4 h-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};