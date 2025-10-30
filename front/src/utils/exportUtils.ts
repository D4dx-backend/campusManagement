import * as XLSX from 'xlsx';

export interface ExportColumn {
  key: string;
  label: string;
  formatter?: (value: any) => string;
}

export interface ExportOptions {
  filename: string;
  columns: ExportColumn[];
  data: any[];
  sheetName?: string;
}

export const exportToExcel = ({ filename, columns, data, sheetName = 'Sheet1' }: ExportOptions) => {
  try {
    // Transform data according to columns configuration
    const transformedData = data.map(item => {
      const row: any = {};
      columns.forEach(column => {
        const value = getNestedValue(item, column.key);
        row[column.label] = column.formatter ? column.formatter(value) : value;
      });
      return row;
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(transformedData);

    // Auto-size columns
    const columnWidths = columns.map(column => ({
      wch: Math.max(column.label.length, 15)
    }));
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const finalFilename = `${filename}_${timestamp}.xlsx`;

    // Write file
    XLSX.writeFile(workbook, finalFilename);

    return { success: true, filename: finalFilename };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Export failed' };
  }
};

export const exportToCSV = ({ filename, columns, data }: ExportOptions) => {
  try {
    // Create CSV header
    const headers = columns.map(col => col.label).join(',');
    
    // Create CSV rows
    const rows = data.map(item => {
      return columns.map(column => {
        const value = getNestedValue(item, column.key);
        const formattedValue = column.formatter ? column.formatter(value) : value;
        // Escape commas and quotes in CSV
        return `"${String(formattedValue || '').replace(/"/g, '""')}"`;
      }).join(',');
    });

    // Combine header and rows
    const csvContent = [headers, ...rows].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];
    const finalFilename = `${filename}_${timestamp}.csv`;
    
    link.href = URL.createObjectURL(blob);
    link.download = finalFilename;
    link.click();

    return { success: true, filename: finalFilename };
  } catch (error) {
    console.error('CSV export error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'CSV export failed' };
  }
};

// Helper function to get nested object values
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

// Common formatters
export const formatters = {
  date: (value: any) => value ? new Date(value).toLocaleDateString() : '',
  currency: (value: any) => value ? `₹${Number(value).toLocaleString()}` : '₹0',
  phone: (value: any) => value || '',
  capitalize: (value: any) => value ? String(value).charAt(0).toUpperCase() + String(value).slice(1) : '',
  boolean: (value: any) => value ? 'Yes' : 'No',
};