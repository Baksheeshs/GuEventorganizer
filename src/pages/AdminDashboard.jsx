import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineCalendar, HiOutlineUserGroup, HiOutlineOfficeBuilding, HiOutlineChartBar, HiOutlineCheck, HiOutlineX, HiOutlineClock, HiOutlineSearch, HiOutlineEye, HiOutlineExclamation, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useEventManagement } from '../context/EventManagementContext';
import { useClubManagement } from '../context/ClubManagementContext';
import { useRegistration } from '../context/RegistrationContext';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };
const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];

const CLUB_COLORS = ['from-purple-600 to-blue-500','from-pink-500 to-rose-600','from-cyan-500 to-blue-600','from-emerald-500 to-teal-500','from-amber-500 to-orange-500','from-red-500 to-pink-500','from-indigo-500 to-purple-600','from-gray-700 to-gray-900'];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { getAllEvents, getPendingEvents, approveEvent, rejectEvent, requestDeleteEvent, confirmDeleteEvent, cancelDelete, deleteConfirm } = useEventManagement();
  const { getAllClubs, addClub, removeClub } = useClubManagement();
  const { registrations } = useRegistration();
  const { addToast } = useToast();

  const allEvents = getAllEvents();
  const pendingEvents = getPendingEvents();
  const approvedEvents = allEvents.filter(e => e.approvalStatus === 'approved');
  const rejectedEvents = allEvents.filter(e => e.approvalStatus === 'rejected');
  const allClubs = getAllClubs();

  // ── Fetch real profiles from Supabase ──
  const [profiles, setProfiles] = useState([]);
  const [profileSearch, setProfileSearch] = useState('');
  useEffect(() => {
    async function fetchProfiles() {
      try {
        const session = localStorage.getItem('gu_auth_session');
        let token = SUPABASE_ANON_KEY;
        if (session) { try { token = JSON.parse(session).access_token || token; } catch {} }
        const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&order=created_at.desc`, {
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (Array.isArray(data)) setProfiles(data);
      } catch (err) { console.warn('Could not fetch profiles:', err); }
    }
    fetchProfiles();
  }, []);

  // Club management state
  const [showAddClub, setShowAddClub] = useState(false);
  const [clubForm, setClubForm] = useState({ name: '', description: '', category: 'Technical', members: '' });
  const [clubToDelete, setClubToDelete] = useState(null);

  // ── Live analytics ──
  const totalStudents = profiles.filter(p => p.role === 'student').length;
  const totalRegistrations = registrations.length;

  // Monthly events chart (live)
  const monthlyEventsData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map(m => ({ month: m, events: 0, participants: 0 }));
    allEvents.forEach(e => {
      if (e.date) {
        const mi = new Date(e.date).getMonth();
        data[mi].events++;
        data[mi].participants += registrations.filter(r => r.eventId === e.id).length;
      }
    });
    const now = new Date();
    return data.filter((_, i) => i <= now.getMonth() + 1);
  }, [allEvents, registrations]);

  // Department participation (live)
  const departmentParticipation = useMemo(() => {
    const deptMap = {};
    registrations.forEach(r => {
      const dept = r.course || r.department || 'Other';
      const shortDept = dept.replace('B.Tech ', '').replace('M.Tech ', '');
      deptMap[shortDept] = (deptMap[shortDept] || 0) + 1;
    });
    const total = Object.values(deptMap).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(deptMap).sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([name, count]) => ({ name, value: Math.round((count / total) * 100) }));
  }, [registrations]);

  // Filtered profiles for user table
  const filteredProfiles = useMemo(() => {
    if (!profileSearch) return profiles;
    const q = profileSearch.toLowerCase();
    return profiles.filter(p => p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.enrollment_id?.toLowerCase().includes(q));
  }, [profiles, profileSearch]);

  const stats = [
    { label: 'Total Events', value: allEvents.length, icon: HiOutlineCalendar, color: 'from-blue-500 to-cyan-500', change: `${pendingEvents.length} pending` },
    { label: 'Total Users', value: profiles.length.toLocaleString(), icon: HiOutlineUserGroup, color: 'from-purple-500 to-pink-500', change: `${totalStudents} students` },
    { label: 'Active Clubs', value: allClubs.length, icon: HiOutlineOfficeBuilding, color: 'from-emerald-500 to-teal-500', change: `${approvedEvents.length} events approved` },
    { label: 'Total Registrations', value: totalRegistrations.toLocaleString(), icon: HiOutlineChartBar, color: 'from-amber-500 to-orange-500', change: `across ${allEvents.length} events` },
  ];

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'approvals', label: `Approvals (${pendingEvents.length})` },
    { key: 'all-events', label: 'All Events' },
    { key: 'clubs', label: `Clubs (${allClubs.length})` },
    { key: 'users', label: 'Users' },
  ];

  const handleApprove = (eventId) => {
    approveEvent(eventId);
    const event = allEvents.find(e => e.id === eventId);
    addToast({ icon: '✅', title: 'Event Approved!', message: `"${event?.title}" is now live and visible to students.`, department: event?.department });
  };

  const handleReject = (eventId) => {
    rejectEvent(eventId);
    const event = allEvents.find(e => e.id === eventId);
    addToast({ icon: '❌', title: 'Event Rejected', message: `"${event?.title}" has been rejected.`, department: event?.department });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-dark-500 dark:text-dark-400 mt-1">Manage university events, users, and analytics</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-dark-800 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === t.key ? 'bg-white dark:bg-dark-700 text-gu-600 dark:text-gold-400 shadow-sm' : 'text-dark-500 dark:text-dark-400 hover:text-dark-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={i} variants={fadeUp} whileHover={{ y: -3 }} className="card p-5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-dark-900 dark:text-white">{s.value}</p>
            <p className="text-sm text-dark-500 dark:text-dark-400">{s.label}</p>
            <p className="text-xs text-emerald-500 mt-1">{s.change}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ─── Approvals Tab ─── */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {pendingEvents.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-4xl mb-3">✅</p>
              <h3 className="text-lg font-bold text-dark-900 dark:text-white">All Caught Up!</h3>
              <p className="text-dark-400 text-sm mt-1">No events pending approval right now.</p>
            </div>
          ) : (
            pendingEvents.map((event) => (
              <motion.div key={event.id} variants={fadeUp} initial="hidden" animate="visible" className="card overflow-hidden">
                <div className="p-5 flex flex-col sm:flex-row items-start gap-4">
                  <img src={event.poster} alt="" className="w-full sm:w-32 h-24 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-dark-900 dark:text-white">{event.title}</h3>
                      <span className="badge-yellow text-[10px]">⏳ Pending</span>
                    </div>
                    <p className="text-sm text-dark-500 dark:text-dark-400 line-clamp-2 mb-2">{event.description}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-dark-400">
                      <span>📅 {event.date}</span>
                      <span>🕐 {event.time}</span>
                      <span>📍 {event.venue}</span>
                      <span>👤 {event.organizer}</span>
                      <span>🏷️ {event.category}</span>
                      <span>👥 Max: {event.maxCapacity}</span>
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2 flex-shrink-0 w-full sm:w-auto">
                    <button onClick={() => handleApprove(event.id)} className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                      <HiOutlineCheck className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => handleReject(event.id)} className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                      <HiOutlineX className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* ─── All Events Tab ─── */}
      {activeTab === 'all-events' && (
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-dark-100 dark:border-dark-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-dark-900 dark:text-white">All Events ({allEvents.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-dark-700">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-500 uppercase">Event</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-500 uppercase hidden md:table-cell">Organizer</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-500 uppercase hidden sm:table-cell">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-500 uppercase">Approval</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allEvents.map((event) => (
                  <tr key={event.id} className="border-b border-dark-100 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-750 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img src={event.poster} alt="" className="w-10 h-10 rounded-lg object-cover hidden sm:block" />
                        <div>
                          <p className="font-semibold text-dark-900 dark:text-white text-sm">{event.title}</p>
                          <p className="text-xs text-dark-400">{event.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-dark-600 dark:text-dark-300 hidden md:table-cell">{event.organizer}</td>
                    <td className="py-3 px-4 text-sm text-dark-600 dark:text-dark-300 hidden sm:table-cell">{event.date}</td>
                    <td className="py-3 px-4">
                      <span className={
                        event.approvalStatus === 'approved' ? 'badge-green' :
                        event.approvalStatus === 'rejected' ? 'badge-red' :
                        'badge-yellow'
                      }>
                        {event.approvalStatus === 'approved' ? '✅ Approved' :
                         event.approvalStatus === 'rejected' ? '❌ Rejected' :
                         '⏳ Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Link to={`/events/${event.id}`} className="p-1.5 rounded-lg hover:bg-gu-50 dark:hover:bg-gu-900/20 text-gu-600 dark:text-gold-400" title="View">
                          <HiOutlineEye className="w-4 h-4" />
                        </Link>
                        {event.approvalStatus === 'pending' && (
                          <>
                            <button onClick={() => handleApprove(event.id)} className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600" title="Approve">
                              <HiOutlineCheck className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleReject(event.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500" title="Reject">
                              <HiOutlineX className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button onClick={() => handleDeleteEvent(event.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-dark-300 hover:text-red-500" title="Delete">
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Overview & Users Tab ─── */}
      {(activeTab === 'overview' || activeTab === 'users') && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Monthly events chart */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-dark-900 dark:text-white mb-4">Monthly Events & Participation</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyEventsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="events" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Events" />
                  <Bar dataKey="participants" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Participants" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pending approvals quick view */}
            <div className="card overflow-hidden">
              <div className="p-6 border-b border-dark-100 dark:border-dark-700 flex items-center justify-between">
                <h2 className="text-lg font-bold text-dark-900 dark:text-white">Pending Approvals</h2>
                <span className="badge-yellow">{pendingEvents.length} pending</span>
              </div>
              <div className="divide-y divide-dark-100 dark:divide-dark-700">
                {pendingEvents.length === 0 ? (
                  <div className="p-6 text-center text-dark-400 text-sm">No pending events 🎉</div>
                ) : (
                  pendingEvents.slice(0, 4).map((event) => (
                    <div key={event.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-dark-750 transition-colors">
                      <img src={event.poster} alt="" className="w-12 h-12 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-dark-900 dark:text-white text-sm">{event.title}</p>
                        <p className="text-xs text-dark-400 mt-0.5">{event.organizer} • {event.date} • {event.venue}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(event.id)} className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors">
                          <HiOutlineCheck className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleReject(event.id)} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg hover:bg-red-100 transition-colors">
                          <HiOutlineX className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* User management */}
            <div className="card overflow-hidden">
              <div className="p-6 border-b border-dark-100 dark:border-dark-700 flex items-center justify-between">
                <h2 className="text-lg font-bold text-dark-900 dark:text-white">User Management</h2>
                <div className="relative">
                  <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input placeholder="Search users..." value={profileSearch} onChange={e => setProfileSearch(e.target.value)} className="pl-9 pr-4 py-2 text-sm bg-gray-100 dark:bg-dark-700 rounded-lg border-0 focus:ring-2 focus:ring-gu-500" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-dark-700">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-dark-500 uppercase">Student</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-dark-500 uppercase hidden md:table-cell">Department</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-dark-500 uppercase hidden sm:table-cell">Events</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-dark-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfiles.slice(0, 6).map((s) => (
                      <tr key={s.id} className="border-b border-dark-100 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-750">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gu-600 to-gu-500 flex items-center justify-center text-white text-xs font-semibold">{s.avatar || s.name?.substring(0,2).toUpperCase()}</div>
                            <div>
                              <p className="font-medium text-dark-900 dark:text-white text-sm">{s.name}</p>
                              <p className="text-xs text-dark-400">{s.enrollment_id || s.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-dark-600 dark:text-dark-300 hidden md:table-cell">{s.department || '—'}</td>
                        <td className="py-3 px-4 text-sm text-dark-600 dark:text-dark-300 hidden sm:table-cell">{s.role}</td>
                        <td className="py-3 px-4"><span className="badge-green">Active</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-bold text-dark-900 dark:text-white mb-4">Department Participation</h2>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={departmentParticipation} cx="50%" cy="50%" outerRadius={80} innerRadius={50} dataKey="value" paddingAngle={2}>
                    {departmentParticipation.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {departmentParticipation.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-dark-600 dark:text-dark-300">{d.name} ({d.value}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Event status breakdown */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-dark-900 dark:text-white mb-4">Event Status</h2>
              <div className="space-y-3">
                {[
                  { label: 'Approved', count: approvedEvents.length, color: 'bg-emerald-500', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20' },
                  { label: 'Pending', count: pendingEvents.length, color: 'bg-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-900/20' },
                  { label: 'Rejected', count: rejectedEvents.length, color: 'bg-red-500', bgColor: 'bg-red-50 dark:bg-red-900/20' },
                ].map((s, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${s.bgColor}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${s.color}`} />
                      <span className="text-sm font-medium text-dark-700 dark:text-dark-300">{s.label}</span>
                    </div>
                    <span className="text-lg font-bold text-dark-900 dark:text-white">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Active clubs */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-dark-900 dark:text-white">Active Clubs</h2>
                <button onClick={() => setActiveTab('clubs')} className="text-xs text-gu-600 dark:text-gold-400 font-medium hover:underline">View all</button>
              </div>
              <div className="space-y-3">
                {allClubs.slice(0, 4).map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                    {c.logo ? (
                      <img src={c.logo} alt={c.name} className="w-8 h-8 rounded-lg object-contain bg-white p-0.5" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gu-600 flex items-center justify-center text-white text-xs font-bold">{c.abbr}</div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-dark-900 dark:text-white">{c.name}</p>
                      <p className="text-xs text-dark-400">{c.members} members</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Clubs Management Tab ─── */}
      {activeTab === 'clubs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-dark-900 dark:text-white">Club Management</h2>
            <button onClick={() => setShowAddClub(true)} className="px-4 py-2.5 bg-gu-600 hover:bg-gu-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-md">
              <HiOutlinePlus className="w-4 h-4" /> Add New Club
            </button>
          </div>

          {/* Add Club Modal */}
          <AnimatePresence>
            {showAddClub && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddClub(false)} />
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md bg-white dark:bg-dark-800 rounded-2xl shadow-2xl p-6">
                  <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-4">Add New Club</h3>
                  <form onSubmit={handleAddClub} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Club Name *</label>
                      <input value={clubForm.name} onChange={e => setClubForm({...clubForm, name: e.target.value})} required className="input-field" placeholder="e.g. AI Research Club" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Description</label>
                      <textarea value={clubForm.description} onChange={e => setClubForm({...clubForm, description: e.target.value})} rows={3} className="input-field" placeholder="Brief description of the club..." />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Category</label>
                        <select value={clubForm.category} onChange={e => setClubForm({...clubForm, category: e.target.value})} className="input-field">
                          {['Technical','Cultural','Sports','Literary','Media','Social','Management','Gaming','General'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Members</label>
                        <input type="number" value={clubForm.members} onChange={e => setClubForm({...clubForm, members: e.target.value})} className="input-field" placeholder="0" />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button type="submit" className="flex-1 py-2.5 bg-gu-600 hover:bg-gu-700 text-white text-sm font-semibold rounded-xl transition-colors">Add Club</button>
                      <button type="button" onClick={() => setShowAddClub(false)} className="flex-1 py-2.5 bg-gray-100 dark:bg-dark-700 text-dark-700 dark:text-dark-300 text-sm font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors">Cancel</button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Delete Club Confirmation */}
          <AnimatePresence>
            {clubToDelete && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setClubToDelete(null)} />
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
                  <div className="w-14 h-14 mx-auto bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-4">
                    <HiOutlineExclamation className="w-7 h-7 text-red-500" />
                  </div>
                  <h3 className="font-bold text-dark-900 dark:text-white text-lg">Remove Club?</h3>
                  <p className="text-sm text-dark-400 mt-2">Are you sure you want to remove <strong className="text-dark-700 dark:text-dark-200">"{clubToDelete.name}"</strong>? This cannot be undone.</p>
                  <div className="flex gap-2 mt-5">
                    <button onClick={() => handleRemoveClub(clubToDelete.id)} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors">Yes, Remove</button>
                    <button onClick={() => setClubToDelete(null)} className="flex-1 py-2.5 bg-gray-100 dark:bg-dark-700 text-dark-700 dark:text-dark-300 text-sm font-semibold rounded-xl transition-colors">Cancel</button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Clubs Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allClubs.map((club) => (
              <motion.div key={club.id} variants={fadeUp} initial="hidden" animate="visible" className="card p-5 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {club.logo ? (
                      <img src={club.logo} alt={club.name} className="w-10 h-10 rounded-xl object-contain bg-white p-0.5 border border-dark-100 dark:border-dark-600" />
                    ) : (
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${club.color} flex items-center justify-center text-white text-xs font-bold`}>{club.abbr}</div>
                    )}
                    <div>
                      <h3 className="font-semibold text-dark-900 dark:text-white text-sm">{club.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gu-50 dark:bg-gu-900/20 text-gu-600 dark:text-gold-400 font-medium">{club.category}</span>
                    </div>
                  </div>
                  <button onClick={() => setClubToDelete(club)} className="p-1.5 rounded-lg text-dark-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all" title="Remove club">
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-dark-400 line-clamp-2 mb-3">{club.description}</p>
                <div className="flex items-center gap-3 text-xs text-dark-500">
                  <span>👥 {club.members} members</span>
                  <span>📅 {club.events} events</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Event Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={cancelDelete} />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
              <div className="w-14 h-14 mx-auto bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-4">
                <HiOutlineExclamation className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="font-bold text-dark-900 dark:text-white text-lg">Delete Event?</h3>
              <p className="text-sm text-dark-400 mt-2">Are you sure you want to delete <strong className="text-dark-700 dark:text-dark-200">"{deleteConfirm.title}"</strong>?</p>
              <div className="flex gap-2 mt-5">
                <button onClick={() => { confirmDeleteEvent(); addToast({ icon: '🗑️', title: 'Event Deleted', message: `"${deleteConfirm.title}" has been removed.` }); }} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors">Yes, Delete</button>
                <button onClick={cancelDelete} className="flex-1 py-2.5 bg-gray-100 dark:bg-dark-700 text-dark-700 dark:text-dark-300 text-sm font-semibold rounded-xl transition-colors">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
