import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineUserGroup, HiOutlineSearch, HiOutlineCheck, HiOutlineX, HiOutlineEye,
  HiOutlineSparkles, HiOutlineMail, HiOutlineAcademicCap, HiOutlineFilter,
  HiOutlineChevronDown, HiOutlineChevronUp
} from 'react-icons/hi';
import { useClubManagement } from '../context/ClubManagementContext';
import { useToast } from '../context/ToastContext';
import { sendClubAuditionSelectedEmail, sendClubRejectionEmail, sendClubApprovalEmail } from '../services/emailService';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const statusColors = {
  pending: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/40', label: '⏳ Pending' },
  audition_selected: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800/40', label: '🎤 Audition' },
  approved: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/40', label: '✅ Approved' },
  rejected: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-800/40', label: '❌ Rejected' },
};

export default function ManageClubRegistrationsPage() {
  const { getAllClubRegistrations, getAllClubs, updateClubRegistrationStatus } = useClubManagement();
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clubFilter, setClubFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const allRegistrations = getAllClubRegistrations();
  const clubs = getAllClubs();

  // Get unique club names from registrations
  const clubNames = [...new Set(allRegistrations.map(r => r.clubName))].sort();

  // Filter
  const filtered = allRegistrations.filter(r => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.regNo?.toLowerCase().includes(search.toLowerCase()) ||
      r.clubName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchClub = clubFilter === 'all' || r.clubName === clubFilter;
    return matchSearch && matchStatus && matchClub;
  });

  // Stats
  const pendingCount = allRegistrations.filter(r => r.status === 'pending').length;
  const auditionCount = allRegistrations.filter(r => r.status === 'audition_selected').length;
  const approvedCount = allRegistrations.filter(r => r.status === 'approved').length;

  const handleSelectForAudition = async (reg) => {
    setActionLoading(reg.id);
    await updateClubRegistrationStatus(reg.id, 'audition_selected');
    
    // Send email
    if (reg.email) {
      await sendClubAuditionSelectedEmail({
        toName: reg.name,
        toEmail: reg.email,
        clubName: reg.clubName,
      });
    }
    
    addToast({
      icon: '🎤',
      title: 'Selected for Audition!',
      message: `${reg.name} has been selected for audition at ${reg.clubName}. Email notification sent.`,
      department: reg.clubName,
    });
    setActionLoading(null);
  };

  const handleReject = async (reg) => {
    setActionLoading(reg.id);
    await updateClubRegistrationStatus(reg.id, 'rejected');

    if (reg.email) {
      await sendClubRejectionEmail({
        toName: reg.name,
        toEmail: reg.email,
        clubName: reg.clubName,
      });
    }

    addToast({
      icon: '❌',
      title: 'Application Rejected',
      message: `${reg.name}'s application to ${reg.clubName} has been rejected.`,
      department: reg.clubName,
    });
    setActionLoading(null);
  };

  const handleApprove = async (reg) => {
    setActionLoading(reg.id);
    await updateClubRegistrationStatus(reg.id, 'approved');

    // Send approval email
    if (reg.email) {
      await sendClubApprovalEmail({
        toName: reg.name,
        toEmail: reg.email,
        clubName: reg.clubName,
      });
    }

    addToast({
      icon: '✅',
      title: 'Membership Approved!',
      message: `${reg.name} is now a member of ${reg.clubName}! Approval email sent.`,
      department: reg.clubName,
    });
    setActionLoading(null);
  };

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-500 flex items-center justify-center">
            <HiOutlineUserGroup className="w-5 h-5 text-white" />
          </div>
          Club Registrations
        </h1>
        <p className="text-dark-500 dark:text-dark-400 mt-1 ml-[52px]">
          Review and manage student club membership applications
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.05 }} className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">{pendingCount}</p>
          <p className="text-xs text-dark-400 mt-1">Pending Review</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-purple-500">{auditionCount}</p>
          <p className="text-xs text-dark-400 mt-1">Audition Selected</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-500">{approvedCount}</p>
          <p className="text-xs text-dark-400 mt-1">Approved</p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }} className="card p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, reg no, or club..."
              className="input-field !pl-9 !py-2.5 text-sm"
            />
          </div>
          {/* Status filter */}
          <div className="flex items-center gap-2">
            <HiOutlineFilter className="w-4 h-4 text-dark-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field !py-2 text-sm min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="pending">⏳ Pending</option>
              <option value="audition_selected">🎤 Audition</option>
              <option value="approved">✅ Approved</option>
              <option value="rejected">❌ Rejected</option>
            </select>
          </div>
          {/* Club filter */}
          <select
            value={clubFilter}
            onChange={(e) => setClubFilter(e.target.value)}
            className="input-field !py-2 text-sm min-w-[160px]"
          >
            <option value="all">All Clubs</option>
            {clubNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Results count */}
      <p className="text-sm text-dark-400">{filtered.length} application{filtered.length !== 1 ? 's' : ''} found</p>

      {/* Registration List */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.15 }} className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-dark-500 dark:text-dark-400 font-medium">No club registrations found</p>
            <p className="text-dark-400 text-sm mt-1">Applications will appear here when students apply to join clubs</p>
          </div>
        ) : (
          filtered.map((reg, i) => {
            const isExpanded = expandedId === reg.id;
            const sc = statusColors[reg.status] || statusColors.pending;
            const isLoading = actionLoading === reg.id;
            const appliedDate = reg.appliedAt
              ? new Date(reg.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'N/A';

            return (
              <motion.div
                key={reg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="card overflow-hidden"
              >
                {/* Summary Row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-750 transition-colors"
                  onClick={() => toggleExpand(reg.id)}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gu-600 to-gu-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {reg.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-dark-900 dark:text-white truncate">{reg.name}</p>
                      <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text} ${sc.border} border`}>
                        {sc.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-xs text-dark-400 truncate">{reg.email}</p>
                      <span className="text-xs text-dark-400">•</span>
                      <p className="text-xs text-dark-500 dark:text-dark-400 font-medium">{reg.clubName}</p>
                    </div>
                  </div>

                  {/* Applied date */}
                  <p className="text-[11px] text-dark-400 hidden sm:block">{appliedDate}</p>

                  {/* Expand toggle */}
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <HiOutlineChevronUp className="w-4 h-4 text-dark-400" />
                    ) : (
                      <HiOutlineChevronDown className="w-4 h-4 text-dark-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-dark-100 dark:border-dark-700 p-5 bg-gray-50/50 dark:bg-dark-700/20">
                        {/* Student Details Grid */}
                        <h4 className="text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase mb-3 flex items-center gap-1.5">
                          <HiOutlineEye className="w-3.5 h-3.5" /> Student Details
                        </h4>
                        <div className="grid sm:grid-cols-2 gap-3 mb-4">
                          <div className="p-3 rounded-xl bg-white dark:bg-dark-800 border border-dark-100 dark:border-dark-600">
                            <p className="text-[10px] text-dark-400 uppercase font-semibold">Full Name</p>
                            <p className="text-sm font-medium text-dark-900 dark:text-white mt-0.5">{reg.name}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white dark:bg-dark-800 border border-dark-100 dark:border-dark-600">
                            <p className="text-[10px] text-dark-400 uppercase font-semibold flex items-center gap-1"><HiOutlineMail className="w-3 h-3" /> Email</p>
                            <p className="text-sm font-medium text-dark-900 dark:text-white mt-0.5">{reg.email}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white dark:bg-dark-800 border border-dark-100 dark:border-dark-600">
                            <p className="text-[10px] text-dark-400 uppercase font-semibold">Registration No.</p>
                            <p className="text-sm font-medium text-dark-900 dark:text-white font-mono mt-0.5">{reg.regNo || 'N/A'}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white dark:bg-dark-800 border border-dark-100 dark:border-dark-600">
                            <p className="text-[10px] text-dark-400 uppercase font-semibold flex items-center gap-1"><HiOutlineAcademicCap className="w-3 h-3" /> Course & Year</p>
                            <p className="text-sm font-medium text-dark-900 dark:text-white mt-0.5">{reg.course || 'N/A'} • {reg.year || 'N/A'}</p>
                          </div>
                        </div>

                        {/* About section */}
                        {reg.about && (
                          <div className="p-4 rounded-xl bg-white dark:bg-dark-800 border border-dark-100 dark:border-dark-600 mb-4">
                            <p className="text-[10px] text-dark-400 uppercase font-semibold mb-2">Why they want to join</p>
                            <p className="text-sm text-dark-600 dark:text-dark-300 leading-relaxed">{reg.about}</p>
                          </div>
                        )}

                        {/* Club info */}
                        <div className="flex items-center gap-2 mb-4">
                          <p className="text-[10px] text-dark-400 uppercase font-semibold">Applying to:</p>
                          <span className="text-xs font-semibold text-gu-600 dark:text-gold-400 bg-gu-50 dark:bg-gu-900/20 px-2.5 py-1 rounded-lg">
                            {reg.clubName}
                          </span>
                          <span className="text-[10px] text-dark-400 ml-auto">Applied {appliedDate}</span>
                        </div>

                        {/* Action Buttons */}
                        {(reg.status === 'pending' || reg.status === 'audition_selected') && (
                          <div className="flex gap-2 pt-3 border-t border-dark-200 dark:border-dark-600">
                            {reg.status === 'pending' && (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleSelectForAudition(reg); }}
                                  disabled={isLoading}
                                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                                >
                                  <HiOutlineSparkles className="w-4 h-4" />
                                  {isLoading ? 'Processing...' : 'Select for Audition'}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleReject(reg); }}
                                  disabled={isLoading}
                                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white dark:bg-dark-700 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-semibold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                                >
                                  <HiOutlineX className="w-4 h-4" />
                                  Reject
                                </button>
                              </>
                            )}
                            {reg.status === 'audition_selected' && (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleApprove(reg); }}
                                  disabled={isLoading}
                                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                                >
                                  <HiOutlineCheck className="w-4 h-4" />
                                  {isLoading ? 'Processing...' : 'Approve Membership'}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleReject(reg); }}
                                  disabled={isLoading}
                                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white dark:bg-dark-700 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-semibold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                                >
                                  <HiOutlineX className="w-4 h-4" />
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        {/* Completed status display */}
                        {reg.status === 'approved' && (
                          <div className="flex items-center gap-2 pt-3 border-t border-dark-200 dark:border-dark-600">
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-800/40 w-full">
                              <HiOutlineCheck className="w-4 h-4 text-emerald-600" />
                              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Member approved — now part of {reg.clubName}</p>
                            </div>
                          </div>
                        )}
                        {reg.status === 'rejected' && (
                          <div className="flex items-center gap-2 pt-3 border-t border-dark-200 dark:border-dark-600">
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/40 w-full">
                              <HiOutlineX className="w-4 h-4 text-red-500" />
                              <p className="text-sm font-medium text-red-700 dark:text-red-300">Application rejected</p>
                            </div>
                          </div>
                        )}
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
