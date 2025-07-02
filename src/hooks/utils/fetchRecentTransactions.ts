
import { buildInvoicesQuery, buildBillsQuery } from './transactionQueryBuilder';
import { mapInvoicesToTransactions, mapBillsToTransactions, combineAndSortTransactions } from './transactionDataMapper';
import type { UseRecentTransactionsProps } from '../types/useRecentTransactionsTypes';

export async function fetchRecentTransactions(
  companyId: string, 
  { projectId, dateRange, managerId }: UseRecentTransactionsProps
) {
  console.log("Fetching transactions for company:", companyId);
  console.log("Filters:", { projectId, dateRange, managerId });

  try {
    // Build and execute the queries
    const invoicesPromise = buildInvoicesQuery(companyId, projectId, managerId, dateRange);
    const billsPromise = buildBillsQuery(companyId, projectId, managerId, dateRange);

    const [invoicesResult, billsResult] = await Promise.all([invoicesPromise, billsPromise]);

    // Check for errors
    if (invoicesResult.error) {
      console.error("Error fetching invoices:", invoicesResult.error);
      throw invoicesResult.error;
    }

    if (billsResult.error) {
      console.error("Error fetching bills:", billsResult.error);
      throw billsResult.error;
    }

    console.log("Invoices fetched:", invoicesResult.data?.length || 0);
    console.log("Bills fetched:", billsResult.data?.length || 0);

    // Map data to Transaction type
    const invoices = mapInvoicesToTransactions(invoicesResult.data || []);
    const bills = mapBillsToTransactions(billsResult.data || []);

    // Combine and sort by date
    return combineAndSortTransactions(invoices, bills);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }
}
