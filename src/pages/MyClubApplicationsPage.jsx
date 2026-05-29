import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  HiOutlineClipboardList, HiOutlineRefresh, HiOutlineCheckCircle,
  HiOutlineXCircle, HiOutlineSparkles, HiOutlineClock, HiOutlineMail,
  HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineUserGroup
} from 'react-icons/hi';
import { useClubManagement } from '../context/ClubManagementContext';
import { useAuth } from '../context/AuthContext';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

// Progress steps for the application workflow
const STEPS = [
  { key: 'submitted', label: 'Submitted', icon: '📨' },
  { key: 'under_review', label: 'Under Review', icon: '🔍' },
  { key: 'audition_selected', label: 'Audition Selected', icon: '🎤' },
  { key: 'final', label: 'Final Decision', icon: '🏆' },
];

// Map status → step index (0-based)
function getStepIndex(status) {
  switch (status) {
    case 'pending': return 1; // under review
    case 'audition_selected': return 2;
    case 'approved': return 3;
    case 'rejected': return 3;
    default: return 0;
  }
}

const statusMeta = {
  pending: {
    label: '⏳ Under Review',
    color: 'amber',
    bgClass: 'bg-amber-50 dark:bg-amber-900/15',
    borderClass: 'border-amber-200 dark:border-amber-800/40',
    textClass: 'text-amber-700 dark:text-amber-300',
    dotClass: 'bg-amber-500',
    message: 'Your application is being reviewed by the club coordinators. You will be notified once a decision is made.',
  },
  audition_selected: {
    label: '🎤 Audition Selected',
    color: 'purple',
    bgClass: 'bg-purple-50 dark:bg-purple-900/15',
    borderClass: 'border-purple-200 dark:border-purple-800/40',
    textClass: 'text-purple-700 dark:text-purple-300',
    dotClass: 'bg-purple-500',
    message: 'Congratulations! You have been shortlisted for the audition round. Check your email for the audition date, time, and venue.',
  },
  approved: {
    label: '✅ Approved',
    color: 'emerald',
    bgClass: 'bg-emerald-50 dark:bg-emerald-900/15',
    borderClass: 'border-emerald-200 dark:border-emerald-800/40',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    dotClass: 'bg-emerald-500',
    message: 'Welcome to the club! You are now an official member. Stay tuned for upcoming meetings and events.',
  },
  rejected: {
    label: '❌ Not Selected',
    color: 'red',
    bgClass: 'bg-red-50 dark:bg-red-900/15',
    borderClass: 'border-red-200 dark:border-red-800/40',
    textClass: 'text-red-700 dark:text-red-300',
    dotClass: 'bg-red-500',
    message: 'Unfortunately, your application was not selected this time. Don\'t be discouraged — you can reapply in the next cycle!',
  },
};

export default function MyClubApplicationsPage() {
  const { user } = useAuth();
  const { getMyClubRegistrations, refreshClubRegistrations, getAllClubs } = useClubManagement();
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('all');

  const clubs = getAllClubs();
  const myApplications = user?.email ? getMyClubRegistrations(user.email) : [];

  // Refresh from Supabase on mount
  useEffect(() => {
    refreshClubRegistrations();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshClubRegistrations();
    setTimeout(() => setRefreshing(false), 600);
  };

  // Filter
  const filtered = filter === 'all'
    ? myApplications
    : myApplications.filter(a => a.status === filter);

  // Stats
  const pendingCount = myApplications.filter(a => a.status === 'pending').length;
  const auditionCount = myApplications.filter(a => a.status === 'audition_selected').length;
  const approvedCount = myApplications.filter(a => a.status === 'approved').length;
  const rejectedCount = myApplications.filter(a => a.status === 'rejected').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-500 flex items-center justify-center">
              <HiOutlineClipboardList className="w-5 h-5 text-white" />
            </div>
            My Club Applications
          </h1>
          <p className="text-dark-500 dark:text-dark-400 mt-1 ml-[52px]">
            Track all your club membership applications in one place
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-600 rounded-xl text-sm font-semibold text-dark-700 dark:text-dark-200 hover:border-gu-400 dark:hover:border-gold-400 transition-all disabled:opacity-50"
        >
          <HiOutlineRefresh className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Status'}
        </button>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.05 }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Pending', count: pendingCount, color: 'amber', emoji: '⏳' },
          { label: 'Audition', count: auditionCount, color: 'purple', emoji: '🎤' },
          { label: 'Approved', count: approvedCount, color: 'emerald', emoji: '✅' },
          { label: 'Rejected', count: rejectedCount, color: 'red', emoji: '❌' },
        ].map(s => (
          <button
            key={s.label}
            onClick={() => setFilter(filter === s.label.toLowerCase() ? 'all' : s.label === 'Audition' ? 'audition_selected' : s.label.toLowerCase())}
            className={`card p-4 text-center transition-all hover:shadow-md ${
              (filter === s.label.toLowerCase() || (filter === 'audition_selected' && s.label === 'Audition'))
                ? `ring-2 ring-${s.color}-400`
                : ''
            }`}
          >
            <p className="text-2xl mb-1">{s.emoji}</p>
            <p className={`text-2xl font-bold text-${s.color}-500`}>{s.count}</p>
            <p className="text-xs text-dark-400 mt-0.5">{s.label}</p>
          </button>
        ))}
      </motion.div>

      {/* Filter indicator */}
      {filter !== 'all' && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-dark-400">Filtered by:</span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gu-50 dark:bg-gu-900/20 text-gu-600 dark:text-gold-400">
            {filter === 'audition_selected' ? 'Audition Selected' : filter.charAt(0).toUpperCase() + filter.slice(1)}
          </span>
          <button onClick={() => setFilter('all')} className="text-xs text-dark-400 hover:text-dark-600 underline">Clear</button>
        </div>
      )}

      {/* Applications List */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }} className="space-y-4">
        {filtered.length === 0 ? (
          <div className="card p-16 text-center">
            <p className="text-5xl mb-4">📋</p>
            <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-2">
              {filter === 'all' ? 'No Applications Yet' : 'No matching applications'}
            </h3>
            <p className="text-dark-400 text-sm mb-6">
              {filter === 'all'
                ? 'You haven\'t applied to any clubs yet. Explore clubs and submit your first application!'
                : 'Try clearing the filter to see all applications.'}
            </p>
            {filter === 'all' && (
              <Link to="/clubs" className="btn-primary inline-flex items-center gap-2">
                <HiOutlineUserGroup className="w-4 h-4" />
                Explore Clubs
              </Link>
            )}
          </div>
        ) : (
          filtered.map((app, i) => {
            const meta = statusMeta[app.status] || statusMeta.pending;
            const stepIdx = getStepIndex(app.status);
            const isExpanded = expandedId === app.id;
            const club = clubs.find(c => c.id === app.clubId);
            const appliedDate = app.appliedAt
              ? new Date(app.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'N/A';

            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card overflow-hidden"
              >
                {/* Card Header */}
                <div
                  className="flex items-center gap-4 p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-750 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : app.id)}
                >
                  {/* Club logo/abbr */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${club?.color || 'from-gu-600 to-gu-500'} flex items-center justify-center flex-shrink-0 overflow-hidden p-1.5`}>
                    {club?.logo ? (
                      <img src={club.logo} alt={app.clubName} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-white font-bold text-sm">{club?.abbr || app.clubName?.slice(0, 2)}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-dark-900 dark:text-white">{app.clubName}</h3>
                      <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.bgClass} ${meta.textClass} ${meta.borderClass} border`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-xs text-dark-400 mt-0.5">Applied {appliedDate}</p>
                  </div>

                  {/* Expand */}
                  <div className="flex-shrink-0">
                    {isExpanded
                      ? <HiOutlineChevronUp className="w-5 h-5 text-dark-400" />
                      : <HiOutlineChevronDown className="w-5 h-5 text-dark-400" />
                    }
                  </div>
                </div>

                {/* Expanded Content with Progress Tracker */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-dark-100 dark:border-dark-700 p-5 bg-gray-50/50 dark:bg-dark-700/20">

                        {/* ─── Visual Step Progress Bar ─── */}
                        <div className="mb-6">
                          <h4 className="text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase mb-4">Application Progress</h4>
                          <div className="flex items-center justify-between relative">
                            {/* Background line */}
                            <div className="absolute top-5 left-6 right-6 h-0.5 bg-dark-200 dark:bg-dark-600 z-0" />
                            {/* Active line */}
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (stepIdx / (STEPS.length - 1)) * 100)}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className={`absolute top-5 left-6 h-0.5 z-[1] rounded-full ${
                                app.status === 'rejected'
                                  ? 'bg-red-400'
                                  : app.status === 'approved'
                                    ? 'bg-emerald-400'
                                    : 'bg-gradient-to-r from-gu-500 to-purple-500'
                              }`}
                              style={{ maxWidth: 'calc(100% - 48px)' }}
                            />

                            {STEPS.map((step, si) => {
                              const isActive = si <= stepIdx;
                              const isCurrent = si === stepIdx;
                              // For rejected: only color last step red
                              const isRejectedFinal = app.status === 'rejected' && si === STEPS.length - 1;
                              const isApprovedFinal = app.status === 'approved' && si === STEPS.length - 1;

                              let dotColor = 'bg-dark-200 dark:bg-dark-600';
                              let ringColor = '';
                              if (isRejectedFinal) {
                                dotColor = 'bg-red-500';
                                ringColor = 'ring-2 ring-red-200 dark:ring-red-800/40';
                              } else if (isApprovedFinal) {
                                dotColor = 'bg-emerald-500';
                                ringColor = 'ring-2 ring-emerald-200 dark:ring-emerald-800/40';
                              } else if (isActive) {
                                dotColor = 'bg-gu-600 dark:bg-gold-400';
                                if (isCurrent) ringColor = 'ring-2 ring-gu-200 dark:ring-gold-400/30';
                              }

                              return (
                                <div key={step.key} className="flex flex-col items-center z-10 flex-1">
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: si * 0.1 + 0.2, type: 'spring', stiffness: 300 }}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${dotColor} ${ringColor} ${
                                      isActive ? 'shadow-md' : ''
                                    }`}
                                  >
                                    {isRejectedFinal ? '❌' : isApprovedFinal ? '✅' : isActive ? step.icon : (
                                      <div className="w-3 h-3 rounded-full bg-dark-300 dark:bg-dark-500" />
                                    )}
                                  </motion.div>
                                  <span className={`text-[10px] font-semibold mt-2 text-center leading-tight ${
                                    isRejectedFinal ? 'text-red-500' :
                                    isApprovedFinal ? 'text-emerald-500' :
                                    isActive ? 'text-dark-700 dark:text-white' : 'text-dark-400'
                                  }`}>
                                    {isRejectedFinal ? 'Rejected' : isApprovedFinal ? 'Approved' : step.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Status Message */}
                        <div className={`p-4 rounded-xl border ${meta.borderClass} ${meta.bgClass} mb-4`}>
                          <p className={`text-sm font-medium ${meta.textClass} mb-1`}>{meta.label}</p>
                          <p className={`text-xs leading-relaxed ${meta.textClass} opacity-80`}>{meta.message}</p>
                          {app.status === 'audition_selected' && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <HiOutlineMail className="w-3.5 h-3.5 text-purple-500" />
                              <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400">Check your email for audition details</span>
                            </div>
                          )}
                        </div>

                        {/* Application Details */}
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div className="p-3 rounded-xl bg-white dark:bg-dark-800 border border-dark-100 dark:border-dark-600">
                            <p className="text-[10px] text-dark-400 uppercase font-semibold">Club</p>
                            <p className="text-sm font-medium text-dark-900 dark:text-white mt-0.5">{app.clubName}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white dark:bg-dark-800 border border-dark-100 dark:border-dark-600">
                            <p className="text-[10px] text-dark-400 uppercase font-semibold">Applied On</p>
                            <p className="text-sm font-medium text-dark-900 dark:text-white mt-0.5">{appliedDate}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white dark:bg-dark-800 border border-dark-100 dark:border-dark-600">
                            <p className="text-[10px] text-dark-400 uppercase font-semibold">Course & Year</p>
                            <p className="text-sm font-medium text-dark-900 dark:text-white mt-0.5">{app.course || 'N/A'} • {app.year || 'N/A'}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white dark:bg-dark-800 border border-dark-100 dark:border-dark-600">
                            <p className="text-[10px] text-dark-400 uppercase font-semibold">Registration No.</p>
                            <p className="text-sm font-medium text-dark-900 dark:text-white font-mono mt-0.5">{app.regNo || 'N/A'}</p>
                          </div>
                        </div>

                        {/* About */}
                        {app.about && (
                          <div className="mt-3 p-3 rounded-xl bg-white dark:bg-dark-800 border border-dark-100 dark:border-dark-600">
                            <p className="text-[10px] text-dark-400 uppercase font-semibold mb-1">Your Statement</p>
                            <p className="text-xs text-dark-600 dark:text-dark-300 leading-relaxed">{app.about}</p>
                          </div>
                        )}

                        {/* View Club Link */}
                        <div className="mt-4 pt-3 border-t border-dark-200 dark:border-dark-600">
                          <Link
                            to={`/clubs/${app.clubId}`}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-gu-600 dark:text-gold-400 hover:underline"
                          >
                            <HiOutlineUserGroup className="w-4 h-4" />
                            View Club Page →
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </div>
  );
}
