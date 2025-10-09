import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { ProductFilters as ProductFiltersType } from '@/types/product';

interface ProductFiltersProps {
  filters: ProductFiltersType;
  categories: string[];
  onSearchChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  categories,
  onSearchChange,
  onCategoryFilterChange,
  onStatusFilterChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Search Input */}
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-white border-gray-300"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="w-full sm:w-48">
        <Select value={filters.category} onValueChange={onCategoryFilterChange}>
          <SelectTrigger className="w-full sm:w-40 bg-white border-gray-300 text-black">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-black">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category} className="text-black">
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Filter */}
      <div className="w-full sm:w-48">
        <Select value={filters.status} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-40 bg-white border-gray-300 text-black">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-black">All Status</SelectItem>
            <SelectItem value="active" className="text-black">Active</SelectItem>
            <SelectItem value="inactive" className="text-black">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
