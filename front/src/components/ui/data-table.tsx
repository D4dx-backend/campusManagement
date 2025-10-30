import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { ExportButton } from '@/components/ui/export-button';
import { DataFilters, FilterOption, FilterValues } from '@/components/ui/data-filters';
import { EnhancedPagination } from '@/components/ui/enhanced-pagination';

interface DataTableProps {
  title?: string;
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: FilterOption[];
  filterValues?: FilterValues;
  onFilterChange?: (values: FilterValues) => void;
  onFilterReset?: () => void;
  exportConfig?: {
    filename: string;
    columns: any[];
    fetchAllData?: () => Promise<any[]>;
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (itemsPerPage: number) => void;
  };
  data: any[];
  isLoading?: boolean;
  error?: any;
  emptyState?: {
    icon: React.ReactNode;
    message: string;
  };
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export const DataTable = ({
  title,
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  filters = [],
  filterValues = {},
  onFilterChange,
  onFilterReset,
  exportConfig,
  pagination,
  data,
  isLoading,
  error,
  emptyState,
  children,
  actions
}: DataTableProps) => {
  const hasActiveFilters = useMemo(() => {
    return Object.values(filterValues).some(value => 
      value !== '' && value !== null && value !== undefined
    );
  }, [filterValues]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={e => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              {filters.length > 0 && onFilterChange && onFilterReset && (
                <DataFilters
                  filters={filters}
                  values={filterValues}
                  onChange={onFilterChange}
                  onReset={onFilterReset}
                />
              )}
              
              {exportConfig && (
                <ExportButton
                  data={data}
                  columns={exportConfig.columns}
                  filename={exportConfig.filename}
                  disabled={isLoading}
                  fetchAllData={exportConfig.fetchAllData}
                />
              )}
              
              {actions}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {error ? (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">Failed to load data</p>
            <p className="text-sm text-muted-foreground">
              {error?.response?.data?.message || error?.message || 'Unknown error occurred'}
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-12">
            {emptyState?.icon}
            <p className="text-muted-foreground mt-4">{emptyState?.message || 'No data found'}</p>
            {hasActiveFilters && (
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your filters or search terms
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {children}
            
            {pagination && pagination.totalPages > 1 && (
              <EnhancedPagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                itemsPerPage={pagination.itemsPerPage}
                onPageChange={pagination.onPageChange}
                onItemsPerPageChange={pagination.onItemsPerPageChange}
                className="mt-6"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};