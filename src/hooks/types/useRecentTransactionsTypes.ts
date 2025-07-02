
export interface UseRecentTransactionsProps {
  projectId?: string | null;
  dateRange?: { from: Date | null, to: Date | null } | null;
  managerId?: string | null;
}
