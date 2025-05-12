
/**
 * Utilities for generating mock data for reports
 */

/**
 * Generates mock cash flow data
 */
export function getMockCashFlowData(timeRange: string) {
  const dataPoints = timeRange === 'week' ? 7 : 
                    timeRange === 'month' ? 30 :
                    timeRange === 'quarter' ? 12 : 
                    timeRange === 'year' ? 12 : 6;
  
  const result = [];
  
  for (let i = 0; i < dataPoints; i++) {
    const incoming = Math.floor(Math.random() * 50000) + 10000;
    const outgoing = Math.floor(Math.random() * 40000) + 8000;
    
    result.push({
      name: timeRange === 'week' ? `Day ${i+1}` : 
            timeRange === 'month' ? `Week ${Math.floor(i/7) + 1}` :
            timeRange === 'quarter' ? `Month ${i+1}` :
            timeRange === 'year' ? `Month ${i+1}` : `Period ${i+1}`,
      Incoming: incoming,
      Outgoing: outgoing
    });
  }
  
  return result;
}

/**
 * Generates mock expenses category data
 */
export function getMockExpensesData() {
  return [
    { name: 'Materials', value: 35 },
    { name: 'Labor', value: 40 },
    { name: 'Equipment', value: 15 },
    { name: 'Admin', value: 10 }
  ];
}

/**
 * Generates mock project profitability data
 */
export function getMockProjectData() {
  return [
    { name: 'Project A', profit: 12000 },
    { name: 'Project B', profit: 8500 },
    { name: 'Project C', profit: 15000 },
    { name: 'Project D', profit: 10200 },
    { name: 'Project E', profit: 7800 }
  ];
}
