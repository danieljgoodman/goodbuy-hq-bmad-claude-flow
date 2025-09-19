/**
 * Virtual scrolling table component for large datasets in Enterprise dashboard
 * Implements windowing to render only visible rows for optimal performance
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, SortAsc, SortDesc, TrendingUp, TrendingDown } from 'lucide-react';
import { performanceMonitor } from '@/lib/utils/performance-monitoring';

interface VirtualScrollTableColumn<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => any);
  sortable?: boolean;
  filterable?: boolean;
  width?: number;
  render?: (value: any, row: T) => React.ReactNode;
}

interface VirtualScrollTableProps<T> {
  data: T[];
  columns: VirtualScrollTableColumn<T>[];
  height?: number;
  itemHeight?: number;
  overscan?: number;
  searchKeys?: (keyof T)[];
  onRowClick?: (row: T, index: number) => void;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

function VirtualScrollTableComponent<T extends Record<string, any>>({
  data,
  columns,
  height = 400,
  itemHeight = 48,
  overscan = 5,
  searchKeys = [],
  onRowClick,
  emptyMessage = 'No data available',
  loading = false,
  className = ''
}: VirtualScrollTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const listRef = useRef<List>(null);

  useEffect(() => {
    performanceMonitor.markMilestone('virtual-table-mount');
  }, []);

  // Memoized search and filter logic
  const filteredData = useMemo(() => {
    performanceMonitor.markMilestone('virtual-table-filter-start');

    let filtered = data;

    // Apply search filter
    if (searchTerm && searchKeys.length > 0) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        searchKeys.some(key => {
          const value = item[key];
          return value && String(value).toLowerCase().includes(lowerSearchTerm);
        })
      );
    }

    // Apply column filters
    Object.entries(filters).forEach(([columnId, filterValue]) => {
      if (filterValue) {
        const column = columns.find(col => col.id === columnId);
        if (column) {
          filtered = filtered.filter(item => {
            const value = typeof column.accessor === 'function'
              ? column.accessor(item)
              : item[column.accessor];
            return value && String(value).toLowerCase().includes(filterValue.toLowerCase());
          });
        }
      }
    });

    performanceMonitor.markMilestone('virtual-table-filter-end');
    return filtered;
  }, [data, searchTerm, searchKeys, filters, columns]);

  // Memoized sorting logic
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    performanceMonitor.markMilestone('virtual-table-sort-start');

    const sorted = [...filteredData].sort((a, b) => {
      const column = columns.find(col => col.id === sortConfig.key);
      if (!column) return 0;

      const aValue = typeof column.accessor === 'function'
        ? column.accessor(a)
        : a[column.accessor];
      const bValue = typeof column.accessor === 'function'
        ? column.accessor(b)
        : b[column.accessor];

      if (aValue === bValue) return 0;

      const comparison = aValue > bValue ? 1 : -1;
      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });

    performanceMonitor.markMilestone('virtual-table-sort-end');
    return sorted;
  }, [filteredData, sortConfig, columns]);

  // Handle sorting
  const handleSort = useCallback((columnId: string) => {
    setSortConfig(current => {
      if (current?.key === columnId) {
        return current.direction === 'asc'
          ? { key: columnId, direction: 'desc' }
          : null;
      }
      return { key: columnId, direction: 'asc' };
    });
  }, []);

  // Handle column filter
  const handleFilter = useCallback((columnId: string, value: string) => {
    setFilters(current => ({ ...current, [columnId]: value }));
  }, []);

  // Render individual row
  const renderRow = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = sortedData[index];
    if (!row) return null;

    return (
      <div
        style={style}
        className={`flex items-center border-b hover:bg-muted/50 cursor-pointer ${
          onRowClick ? 'hover:bg-accent/10' : ''
        }`}
        onClick={() => onRowClick?.(row, index)}
      >
        {columns.map((column, colIndex) => {
          const value = typeof column.accessor === 'function'
            ? column.accessor(row)
            : row[column.accessor];

          const cellContent = column.render ? column.render(value, row) : value;

          return (
            <div
              key={column.id}
              className="px-4 py-2 flex-shrink-0 truncate"
              style={{ width: column.width || `${100 / columns.length}%` }}
            >
              {cellContent}
            </div>
          );
        })}
      </div>
    );
  }, [sortedData, columns, onRowClick]);

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-2 p-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          {columns.map((column, j) => (
            <div
              key={column.id}
              className="h-8 bg-muted rounded animate-pulse"
              style={{ width: column.width || `${100 / columns.length}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );

  // Empty state
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-muted-foreground mb-2">
        <Search className="h-12 w-12" />
      </div>
      <h3 className="text-lg font-medium">No data found</h3>
      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      {searchTerm && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSearchTerm('')}
          className="mt-4"
        >
          Clear search
        </Button>
      )}
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Search and Filters */}
      <div className="mb-4 space-y-4">
        {searchKeys.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Column filters */}
        <div className="flex flex-wrap gap-2">
          {columns
            .filter(col => col.filterable)
            .map(column => (
              <div key={column.id} className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Filter ${column.header}`}
                  value={filters[column.id] || ''}
                  onChange={(e) => handleFilter(column.id, e.target.value)}
                  className="w-32"
                  size={10}
                />
              </div>
            ))}
        </div>

        {/* Data statistics */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {sortedData.length.toLocaleString()} of {data.length.toLocaleString()} rows
          </span>
          {sortConfig && (
            <Badge variant="outline" className="flex items-center space-x-1">
              {sortConfig.direction === 'asc' ? (
                <SortAsc className="h-3 w-3" />
              ) : (
                <SortDesc className="h-3 w-3" />
              )}
              <span>
                Sorted by {columns.find(col => col.id === sortConfig.key)?.header}
              </span>
            </Badge>
          )}
        </div>
      </div>

      {/* Table Header */}
      <div className="border rounded-lg overflow-hidden">
        <div className="flex bg-muted/50 border-b font-medium">
          {columns.map((column) => (
            <div
              key={column.id}
              className={`px-4 py-3 flex-shrink-0 flex items-center space-x-2 ${
                column.sortable ? 'cursor-pointer hover:bg-muted' : ''
              }`}
              style={{ width: column.width || `${100 / columns.length}%` }}
              onClick={() => column.sortable && handleSort(column.id)}
            >
              <span>{column.header}</span>
              {column.sortable && (
                <div className="text-muted-foreground">
                  {sortConfig?.key === column.id ? (
                    sortConfig.direction === 'asc' ? (
                      <SortAsc className="h-4 w-4" />
                    ) : (
                      <SortDesc className="h-4 w-4" />
                    )
                  ) : (
                    <div className="h-4 w-4 opacity-0 hover:opacity-50">
                      <SortAsc className="h-4 w-4" />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Virtual List */}
        {sortedData.length === 0 ? (
          <EmptyState />
        ) : (
          <List
            ref={listRef}
            height={height}
            itemCount={sortedData.length}
            itemSize={itemHeight}
            overscanCount={overscan}
            width="100%"
          >
            {renderRow}
          </List>
        )}
      </div>
    </div>
  );
}

// Memoized export
export const VirtualScrollTable = React.memo(VirtualScrollTableComponent) as <T extends Record<string, any>>(
  props: VirtualScrollTableProps<T>
) => JSX.Element;

export default VirtualScrollTable;