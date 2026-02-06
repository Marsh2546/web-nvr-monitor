// Common types used across the application

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  searchTerm: string;
  selectedDistrict: string;
  selectedIssueType: string;
}

export interface StatusCounts {
  total: number;
  healthy: number;
  critical: number;
  attention: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

export type ComponentStatus = 'normal' | 'affected' | 'failed';
export type IssueType = 'onu' | 'nvr' | 'hdd' | 'view' | 'login' | 'healthy';
