// Priority is derived from the student's stated reason for the request.
const HIGH_CAUSES   = ['Medical Emergency', 'Blood Donation'];
const MEDIUM_CAUSES = ['Family Meeting', 'Other'];

export function getPriority(cause) {
  if (HIGH_CAUSES.includes(cause))   return 'high';
  if (MEDIUM_CAUSES.includes(cause)) return 'medium';
  return 'low';
}

export const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };
