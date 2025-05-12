
/**
 * Utility functions for handling time ranges in reports
 */

/**
 * Gets the start date based on the selected time range
 */
export function getStartDateFromTimeRange(timeRange: string): Date {
  const now = new Date();
  switch (timeRange) {
    case 'week':
      return new Date(now.setDate(now.getDate() - 7));
    case 'month':
      return new Date(now.setMonth(now.getMonth() - 1));
    case 'quarter':
      return new Date(now.setMonth(now.getMonth() - 3));
    case 'year':
      return new Date(now.setFullYear(now.getFullYear() - 1));
    default:
      return new Date(now.setMonth(now.getMonth() - 1));
  }
}

/**
 * Creates date segments based on the selected time range
 */
export function createDateSegments(timeRange: string): Array<{start: Date, end: Date, label: string}> {
  const now = new Date();
  const segments = [];
  
  switch (timeRange) {
    case 'week':
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        segments.push({
          start: dayStart,
          end: dayEnd,
          label: date.toLocaleDateString('en-US', { weekday: 'short' })
        });
      }
      break;
    case 'month':
      for (let i = 4; i >= 0; i--) {
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() - (i * 7));
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6);
        segments.push({
          start: startDate,
          end: endDate,
          label: `Week ${4-i+1}`
        });
      }
      break;
    case 'quarter':
    case 'year':
      const monthCount = timeRange === 'quarter' ? 3 : 12;
      for (let i = monthCount - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        segments.push({
          start: monthStart,
          end: monthEnd,
          label: date.toLocaleDateString('en-US', { month: 'short' })
        });
      }
      break;
    default:
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        segments.push({
          start: monthStart,
          end: monthEnd,
          label: date.toLocaleDateString('en-US', { month: 'short' })
        });
      }
  }
  
  return segments;
}

/**
 * Finds the index of a segment where a date belongs
 */
export function findSegmentIndex(date: Date, segments: Array<{start: Date, end: Date, label: string}>): number {
  return segments.findIndex(segment => 
    date >= segment.start && date <= segment.end
  );
}
