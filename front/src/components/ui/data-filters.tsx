import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Filter, X, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export interface FilterOption {
  key: string;
  label: string;
  type: 'select' | 'date' | 'dateRange' | 'text' | 'number';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface FilterValues {
  [key: string]: any;
}

interface DataFiltersProps {
  filters: FilterOption[];
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  onReset: () => void;
  className?: string;
}

export const DataFilters = ({ filters, values, onChange, onReset, className }: DataFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: string, value: any) => {
    // Convert "__all__" back to empty string for clearing filters
    const processedValue = value === "__all__" ? "" : value;
    onChange({ ...values, [key]: processedValue });
  };

  const handleReset = () => {
    onReset();
    setIsOpen(false);
  };

  const activeFiltersCount = Object.values(values).filter(value => 
    value !== '' && value !== null && value !== undefined
  ).length;

  const renderFilterInput = (filter: FilterOption) => {
    const value = values[filter.key] || '';

    switch (filter.type) {
      case 'select':
        return (
          <Select 
            value={value || "__all__"} 
            onValueChange={(val) => handleFilterChange(filter.key, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder={filter.placeholder || `Select ${filter.label}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
          />
        );

      case 'dateRange':
        return (
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              placeholder="From"
              value={values[`${filter.key}_from`] || ''}
              onChange={(e) => handleFilterChange(`${filter.key}_from`, e.target.value)}
            />
            <Input
              type="date"
              placeholder="To"
              value={values[`${filter.key}_to`] || ''}
              onChange={(e) => handleFilterChange(`${filter.key}_to`, e.target.value)}
            />
          </div>
        );

      case 'number':
        return (
          <Input
            type="number"
            placeholder={filter.placeholder || `Enter ${filter.label}`}
            value={value}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
          />
        );

      case 'text':
      default:
        return (
          <Input
            type="text"
            placeholder={filter.placeholder || `Enter ${filter.label}`}
            value={value}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
          />
        );
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Filters</h4>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <X className="w-4 h-4 mr-1" />
                Reset
              </Button>
            </div>
            
            <div className="space-y-4">
              {filters.map((filter) => (
                <div key={filter.key} className="space-y-2">
                  <Label htmlFor={filter.key}>{filter.label}</Label>
                  {renderFilterInput(filter)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};