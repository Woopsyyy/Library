export interface LoanRemainingInfo {
  days: number;
  label: string;
  shortLabel: string;
  isOverdue: boolean;
  isDueToday: boolean;
  isReturned: boolean;
  colorClass: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export function getLoanRemainingInfo(dueDateStr: string, status?: string): LoanRemainingInfo {
  const isReturned = status === 'Returned';
  if (isReturned) {
    return {
      days: 0,
      label: 'Returned',
      shortLabel: 'Returned',
      isOverdue: false,
      isDueToday: false,
      isReturned: true,
      colorClass: 'text-blue-700',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-700',
      badgeBorder: 'border-blue-200',
    };
  }

  const now = new Date();
  const due = new Date(dueDateStr);

  // Time difference in milliseconds
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    const label = overdueDays === 1 ? '1 day overdue' : `${overdueDays} days overdue`;
    return {
      days: diffDays,
      label,
      shortLabel: `${overdueDays}d overdue`,
      isOverdue: true,
      isDueToday: false,
      isReturned: false,
      colorClass: 'text-rose-600',
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-700',
      badgeBorder: 'border-rose-200',
    };
  }

  if (diffDays === 0) {
    return {
      days: 0,
      label: 'Due today',
      shortLabel: 'Due today',
      isOverdue: false,
      isDueToday: true,
      isReturned: false,
      colorClass: 'text-amber-600',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      badgeBorder: 'border-amber-200',
    };
  }

  const label = diffDays === 1 ? '1 day remaining' : `${diffDays} days remaining`;
  return {
    days: diffDays,
    label,
    shortLabel: `${diffDays}d remaining`,
    isOverdue: false,
    isDueToday: false,
    isReturned: false,
    colorClass: diffDays <= 2 ? 'text-amber-600' : 'text-emerald-700',
    badgeBg: diffDays <= 2 ? 'bg-amber-50' : 'bg-emerald-50',
    badgeText: diffDays <= 2 ? 'text-amber-800' : 'text-emerald-800',
    badgeBorder: diffDays <= 2 ? 'border-amber-200' : 'border-emerald-200',
  };
}

