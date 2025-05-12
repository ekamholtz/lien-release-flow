
import { getStartDateFromTimeRange, createDateSegments, findSegmentIndex } from './timeRangeUtils';

/**
 * Transforms invoice and bill data into cash flow chart format
 */
export function transformCashFlowData(invoices: any[], bills: any[], timeRange: string): any[] {
  const segments = createDateSegments(timeRange);
  
  const result = segments.map(segment => ({
    name: segment.label,
    Incoming: 0,
    Outgoing: 0
  }));
  
  invoices.forEach(invoice => {
    const invoiceDate = new Date(invoice.created_at);
    const segmentIndex = findSegmentIndex(invoiceDate, segments);
    
    if (segmentIndex !== -1 && invoice.status === 'paid') {
      result[segmentIndex].Incoming += Number(invoice.amount);
    }
  });
  
  bills.forEach(bill => {
    const billDate = new Date(bill.created_at);
    const segmentIndex = findSegmentIndex(billDate, segments);
    
    if (segmentIndex !== -1 && bill.status === 'paid') {
      result[segmentIndex].Outgoing += Number(bill.amount);
    }
  });
  
  return result;
}

/**
 * Calculates expenses by category
 */
export function calculateExpensesByCategory(expenses: any[]): any[] {
  const vendorTotals: Record<string, number> = {};
  let grandTotal = 0;
  
  expenses.forEach(expense => {
    const vendor = expense.vendor_name || 'Other';
    vendorTotals[vendor] = (vendorTotals[vendor] || 0) + Number(expense.amount);
    grandTotal += Number(expense.amount);
  });
  
  const result = Object.entries(vendorTotals)
    .map(([name, total]) => ({
      name,
      value: Math.round((total / grandTotal) * 100) || 0
    }))
    .sort((a, b) => b.value - a.value);
  
  if (result.length > 4) {
    const top4 = result.slice(0, 4);
    const others = result.slice(4).reduce(
      (acc, curr) => acc + curr.value,
      0
    );
    
    return [
      ...top4,
      { name: 'Others', value: others }
    ];
  }
  
  return result.length > 0 ? result : getMockExpensesData();
}
