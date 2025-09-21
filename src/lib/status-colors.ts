// Centralized mapping for workflow status/conclusion to colors
// Exports a single source of truth for icon color (text color) and background (bg color classes)

export type StatusKey =
  | 'queued'
  | 'waiting'
  | 'in_progress'
  | 'completed_success'
  | 'completed_failure'
  | 'completed_cancelled'
  | 'completed_skipped'
  | 'completed_neutral'
  | 'completed_timed_out'
  | 'completed_stale'
  | 'other';

export interface StatusColor {
  key: StatusKey;
  label: string;
  textClass: string; // tailwind text color
  bgClass: string; // tailwind background color (with opacity usage e.g. bg-red-600/10)
  // icon background is a slightly stronger shade used behind icons to improve remote visibility
  iconBgClass: string;
}

const COLORS: Record<StatusKey, StatusColor> = {
  // Bright, vibrant colors that clearly indicate status at a glance
  queued: { 
    key: 'queued', 
    label: 'Queued', 
    textClass: 'text-white dark:text-amber-100', 
    bgClass: 'bg-gradient-to-br from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700', 
    iconBgClass: 'bg-white/30 dark:bg-amber-400/30' 
  },
  waiting: { 
    key: 'waiting', 
    label: 'Waiting', 
    textClass: 'text-white dark:text-yellow-100', 
    bgClass: 'bg-gradient-to-br from-yellow-500 to-amber-500 dark:from-yellow-600 dark:to-amber-600', 
    iconBgClass: 'bg-white/30 dark:bg-yellow-400/30' 
  },
  in_progress: { 
    key: 'in_progress', 
    label: 'In Progress', 
    textClass: 'text-white dark:text-blue-100', 
    bgClass: 'bg-gradient-to-br from-blue-500 to-cyan-600 dark:from-blue-600 dark:to-cyan-700', 
    iconBgClass: 'bg-white/30 dark:bg-blue-400/30' 
  },
  completed_success: { 
    key: 'completed_success', 
    label: 'Success', 
    textClass: 'text-white dark:text-green-100', 
    bgClass: 'bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700', 
    iconBgClass: 'bg-white/30 dark:bg-green-400/30' 
  },
  completed_failure: { 
    key: 'completed_failure', 
    label: 'Failure', 
    textClass: 'text-white dark:text-red-100', 
    bgClass: 'bg-gradient-to-br from-red-500 to-rose-600 dark:from-red-600 dark:to-rose-700', 
    iconBgClass: 'bg-white/30 dark:bg-red-400/30' 
  },
  completed_cancelled: { 
    key: 'completed_cancelled', 
    label: 'Cancelled', 
    textClass: 'text-white dark:text-gray-100', 
    bgClass: 'bg-gradient-to-br from-gray-500 to-slate-600 dark:from-gray-600 dark:to-slate-700', 
    iconBgClass: 'bg-white/30 dark:bg-gray-400/30' 
  },
  completed_skipped: { 
    key: 'completed_skipped', 
    label: 'Skipped', 
    textClass: 'text-white dark:text-purple-100', 
    bgClass: 'bg-gradient-to-br from-purple-500 to-violet-600 dark:from-purple-600 dark:to-violet-700', 
    iconBgClass: 'bg-white/30 dark:bg-purple-400/30' 
  },
  completed_neutral: { 
    key: 'completed_neutral', 
    label: 'Neutral', 
    textClass: 'text-white dark:text-indigo-100', 
    bgClass: 'bg-gradient-to-br from-indigo-500 to-blue-600 dark:from-indigo-600 dark:to-blue-700', 
    iconBgClass: 'bg-white/30 dark:bg-indigo-400/30' 
  },
  completed_timed_out: { 
    key: 'completed_timed_out', 
    label: 'Timed Out', 
    textClass: 'text-white dark:text-pink-100', 
    bgClass: 'bg-gradient-to-br from-pink-500 to-rose-600 dark:from-pink-600 dark:to-rose-700', 
    iconBgClass: 'bg-white/30 dark:bg-pink-400/30' 
  },
  completed_stale: { 
    key: 'completed_stale', 
    label: 'Stale', 
    textClass: 'text-white dark:text-stone-100', 
    bgClass: 'bg-gradient-to-br from-stone-500 to-gray-600 dark:from-stone-600 dark:to-gray-700', 
    iconBgClass: 'bg-white/30 dark:bg-stone-400/30' 
  },
  other: { 
    key: 'other', 
    label: 'Other', 
    textClass: 'text-white dark:text-slate-100', 
    bgClass: 'bg-gradient-to-br from-slate-500 to-gray-600 dark:from-slate-600 dark:to-gray-700', 
    iconBgClass: 'bg-white/30 dark:bg-slate-400/30' 
  },
};

// Given a status + possible conclusion, return the StatusColor
export function getStatusColor(status: string, conclusion?: string): StatusColor {
  if (!status) return COLORS.other;

  if (status === 'queued') return COLORS.queued;
  if (status === 'waiting') return COLORS.waiting;
  if (status === 'in_progress') return COLORS.in_progress;

  if (status === 'completed') {
    switch ((conclusion || '').toLowerCase()) {
      case 'success': return COLORS.completed_success;
      case 'failure': return COLORS.completed_failure;
      case 'cancelled': return COLORS.completed_cancelled;
      case 'skipped': return COLORS.completed_skipped;
      case 'neutral': return COLORS.completed_neutral;
      case 'timed_out': return COLORS.completed_timed_out;
      case 'stale': return COLORS.completed_stale;
      default: return COLORS.other;
    }
  }

  return COLORS.other;
}

export default COLORS;
