import { motion } from 'framer-motion';
import { HiOutlineClock, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineSparkles, HiOutlineMail } from 'react-icons/hi';

const statusConfig = {
  pending: {
    icon: HiOutlineClock,
    title: 'Application Under Review',
    message: 'Wait for club audition — we will mail you the date and time once you are shortlisted.',
    color: 'amber',
    bgClass: 'bg-amber-50 dark:bg-amber-900/15',
    borderClass: 'border-amber-200 dark:border-amber-800/40',
    iconBgClass: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-500',
    titleColor: 'text-amber-700 dark:text-amber-300',
    msgColor: 'text-amber-600 dark:text-amber-400',
    badgeClass: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    badgeText: '⏳ Pending Review',
  },
  audition_selected: {
    icon: HiOutlineSparkles,
    title: 'Selected for Audition Round! 🎉',
    message: 'You have been selected for the audition round! Check your email for the date, time, and venue details.',
    color: 'purple',
    bgClass: 'bg-purple-50 dark:bg-purple-900/15',
    borderClass: 'border-purple-200 dark:border-purple-800/40',
    iconBgClass: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-500',
    titleColor: 'text-purple-700 dark:text-purple-300',
    msgColor: 'text-purple-600 dark:text-purple-400',
    badgeClass: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    badgeText: '🎤 Audition Selected',
  },
  approved: {
    icon: HiOutlineCheckCircle,
    title: 'Welcome to the Club! 🎊',
    message: 'Your membership has been approved. You are now an official member!',
    color: 'emerald',
    bgClass: 'bg-emerald-50 dark:bg-emerald-900/15',
    borderClass: 'border-emerald-200 dark:border-emerald-800/40',
    iconBgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-500',
    titleColor: 'text-emerald-700 dark:text-emerald-300',
    msgColor: 'text-emerald-600 dark:text-emerald-400',
    badgeClass: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    badgeText: '✅ Approved',
  },
  rejected: {
    icon: HiOutlineXCircle,
    title: 'Application Not Selected',
    message: 'Unfortunately, your application was not accepted at this time. You can reapply during the next recruitment cycle.',
    color: 'red',
    bgClass: 'bg-red-50 dark:bg-red-900/15',
    borderClass: 'border-red-200 dark:border-red-800/40',
    iconBgClass: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-500',
    titleColor: 'text-red-700 dark:text-red-300',
    msgColor: 'text-red-600 dark:text-red-400',
    badgeClass: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    badgeText: '❌ Rejected',
  },
};

export default function ClubRegistrationStatusCard({ registration, compact = false }) {
  if (!registration) return null;

  const config = statusConfig[registration.status] || statusConfig.pending;
  const StatusIcon = config.icon;
  const appliedDate = registration.appliedAt
    ? new Date(registration.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${config.badgeClass}`}>
        {config.badgeText}
      </span>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${config.borderClass} ${config.bgClass} overflow-hidden`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
            className={`w-10 h-10 rounded-xl ${config.iconBgClass} flex items-center justify-center flex-shrink-0`}
          >
            <StatusIcon className={`w-5 h-5 ${config.iconColor}`} />
          </motion.div>
          <div className="flex-1 min-w-0">
            <h4 className={`font-bold text-sm ${config.titleColor}`}>{config.title}</h4>
            <p className={`text-xs mt-1 ${config.msgColor} leading-relaxed`}>{config.message}</p>
            {registration.status === 'audition_selected' && (
              <div className="flex items-center gap-1.5 mt-2">
                <HiOutlineMail className={`w-3.5 h-3.5 ${config.iconColor}`} />
                <span className={`text-[11px] font-medium ${config.msgColor}`}>Check your email for details</span>
              </div>
            )}
          </div>
        </div>
        {appliedDate && (
          <p className={`text-[10px] mt-3 pt-2 border-t ${config.borderClass} ${config.msgColor}`}>
            Applied on {appliedDate}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// Export for external use
export { statusConfig };
