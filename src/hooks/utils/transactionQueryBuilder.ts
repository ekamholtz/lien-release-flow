
import { supabase } from '@/integrations/supabase/client';

export function buildInvoicesQuery(companyId: string, projectId?: string | null, managerId?: string | null, dateRange?: { from: Date | null, to: Date | null } | null) {
  let query = supabase
    .from('invoices')
    .select('id, invoice_number, amount, status, client_name, created_at, project_id')
    .eq('company_id', companyId);

  // Filter by project if specified
  if (projectId === 'unassigned') {
    query = query.is('project_id', null);
  } else if (projectId) {
    query = query.eq('project_id', projectId);
  }

  // Filter by project manager if specified
  if (managerId) {
    query = query.eq('project_manager_id', managerId);
  }

  // Filter by date range if specified
  if (dateRange?.from) {
    const fromDate = dateRange.from.toISOString();
    query = query.gte('created_at', fromDate);
  }

  if (dateRange?.to) {
    const toDate = dateRange.to.toISOString();
    query = query.lte('created_at', toDate);
  }

  return query.limit(10);
}

export function buildBillsQuery(companyId: string, projectId?: string | null, managerId?: string | null, dateRange?: { from: Date | null, to: Date | null } | null) {
  let query = supabase
    .from('bills')
    .select('id, bill_number, amount, status, vendor_name, created_at, project_id')
    .eq('company_id', companyId)
    .in('status', ['pending_payment', 'paid']); // Only include these statuses

  // Filter by project if specified
  if (projectId === 'unassigned') {
    query = query.is('project_id', null);
  } else if (projectId) {
    query = query.eq('project_id', projectId);
  }

  // Filter by project manager if specified
  if (managerId) {
    query = query.eq('project_manager_id', managerId);
  }

  // Filter by date range if specified
  if (dateRange?.from) {
    const fromDate = dateRange.from.toISOString();
    query = query.gte('created_at', fromDate);
  }

  if (dateRange?.to) {
    const toDate = dateRange.to.toISOString();
    query = query.lte('created_at', toDate);
  }

  return query.limit(10);
}
