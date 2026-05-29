import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HiOutlinePlusCircle, HiOutlineCalendar, HiOutlineUserGroup, HiOutlineChartBar, HiOutlineEye, HiOutlinePencil, HiOutlineTrash, HiOutlineCheck, HiOutlineClock, HiOutlineStar, HiOutlineChatAlt2, HiOutlineX, HiOutlineExclamation, HiOutlineSave } from 'react-icons/hi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useFeedback } from '../context/FeedbackContext';
import { useEventManagement } from '../context/EventManagementContext';
import { useRegistration } from '../context/RegistrationContext';
import { useToast } from '../context/ToastContext';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const { isFeedbackEnabled, toggleFeedback, feedbackData } = useFeedback();
  const { getOrganizerEvents, updateEvent, requestDeleteEvent, confirmDeleteEvent, cancelDelete, deleteConfirm } = useEventManagement();
  const { getApprovedRequestsForEvent, registrations } = useRegistration();
  const { addToast } = useToast();

  const myEventsRaw = getOrganizerEvents();
  const myEvents = myEventsRaw.map(e => ({
    ...e,
    currentRegistrations: (e.registrations || 0) + getApprovedRequestsForEvent(e.id).length
  }));
  
  const [editingEvent, setEditingEvent] = useState(null); // Event being edited
  const [editForm, setEditForm] = useState({});

  const approvedCount = myEvents.filter(e => e.approvalStatus === 'approved').length;
  const pendingCount = myEvents.filter(e => e.approvalStatus === 'pending').length;
  const totalRegs = myEvents.reduce((sum, e) => sum + (e.currentRegistrations || 0), 0);
  const completedEvents = myEvents.filter(e => e.status === 'completed');

  // ── Live analytics ──
  const avgAttendance = useMemo(() => {
    if (myEvents.length === 0) return '0%';
    const eventsWithCap = myEvents.filter(e => e.maxCapacity > 0);
    if (eventsWithCap.length === 0) return '0%';
    const avg = eventsWithCap.reduce((sum, e) => sum + ((e.currentRegistrations || 0) / e.maxCapacity * 100), 0) / eventsWithCap.length;
    return `${Math.round(avg)}%`;
  }, [myEvents]);

  const feedbackScore = useMemo(() => {
    if (!feedbackData || feedbackData.length === 0) return 'N/A';
    const myEventIds = new Set(myEvents.map(e => e.id));
    const myFeedback = feedbackData.filter(f => myEventIds.has(f.eventId || f.event_id));
    if (myFeedback.length === 0) return 'N/A';
    const avg = myFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / myFeedback.length;
    return `${avg.toFixed(1)}★`;
  }, [feedbackData, myEvents]);

  // Live registration trend (by day of week from actual registrations)
  const registrationData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = new Array(7).fill(0);
    const myEventIds = new Set(myEvents.map(e => e.id));
    registrations.filter(r => myEventIds.has(r.eventId)).forEach(r => {
      if (r.createdAt || r.created_at) {
        const d = new Date(r.createdAt || r.created_at);
        counts[d.getDay()]++;
      }
    });
    // Reorder to start from Monday
    return [
      { day: 'Mon', count: counts[1] }, { day: 'Tue', count: counts[2] }, { day: 'Wed', count: counts[3] },
      { day: 'Thu', count: counts[4] }, { day: 'Fri', count: counts[5] }, { day: 'Sat', count: counts[6] }, { day: 'Sun', count: counts[0] },
    ];
  }, [registrations, myEvents]);

  // Live feedback from real data
  const recentFeedback = useMemo(() => {
    if (!feedbackData || feedbackData.length === 0) return [];
    const myEventIds = new Set(myEvents.map(e => e.id));
    return feedbackData
      .filter(f => myEventIds.has(f.eventId || f.event_id))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 3)
      .map(f => ({
        name: f.userName || f.user_name || 'Anonymous',
        event: myEvents.find(e => e.id === (f.eventId || f.event_id))?.title || 'Event',
        rating: f.rating || 0,
        comment: f.comment || f.text || 'No comment',
      }));
  }, [feedbackData, myEvents]);

  const stats = [
    { label: 'Total Events', value: myEvents.length, icon: HiOutlineCalendar, color: 'from-blue-500 to-cyan-500', change: `${pendingCount} pending approval` },
    { label: 'Total Registrations', value: totalRegs.toLocaleString(), icon: HiOutlineUserGroup, color: 'from-purple-500 to-pink-500', change: `${approvedCount} events live` },
    { label: 'Avg Fill Rate', value: avgAttendance, icon: HiOutlineChartBar, color: 'from-emerald-500 to-teal-500', change: `${completedEvents.length} completed` },
    { label: 'Feedback Score', value: feedbackScore, icon: HiOutlineEye, color: 'from-amber-500 to-orange-500', change: feedbackData?.length ? `${feedbackData.length} reviews` : 'No reviews yet' },
  ];

  const startEditing = (event) => {
    setEditingEvent(event.id);
    setEditForm({
      title: event.title,
      date: event.date,
      time: event.time,
      venue: event.venue,
      description: event.description,
      maxCapacity: event.maxCapacity,
    });
  };

  const saveEdit = () => {
    const result = updateEvent(editingEvent, editForm);
    if (result.changes.length > 0) {
      addToast({ icon: '✏️', title: 'Event Updated!', message: `"${editForm.title}" has been updated. Notifications sent to registered students.`, department: 'CSE' });
    } else {
      addToast({ icon: 'ℹ️', title: 'No Changes', message: 'No changes were detected.', department: 'CSE' });
    }
    setEditingEvent(null);
    setEditForm({});
  };

  const handleDelete = (eventId) => {
    requestDeleteEvent(eventId);
  };

  const handleConfirmDelete = () => {
    const title = deleteConfirm?.title;
    confirmDeleteEvent();
    addToast({ icon: '🗑️', title: 'Event Cancelled', message: `"${title}" has been cancelled. All registered students have been notified.`, department: 'CSE' });
  };

  const markCompleted = async (event) => {
    await updateEvent(event.id, { status: 'completed' });
    addToast({ icon: '✅', title: 'Event Completed', message: `"${event.title}" has been marked as completed. You can now declare results.`, department: event.category });
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <span className="badge-green text-[10px]">✅ Live</span>;
      case 'pending': return <span className="badge-yellow text-[10px]">⏳ Pending</span>;
      case 'rejected': return <span className="badge-red text-[10px]">❌ Rejected</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Organizer Dashboard</h1>
          <p className="text-dark-500 dark:text-dark-400 mt-1">Welcome back, {user?.name} • {user?.club}</p>
        </div>
        <Link to="/create-event" className="btn-primary flex items-center gap-2">
          <HiOutlinePlusCircle className="w-5 h-5" /> Create Event
        </Link>
      </motion.div>

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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Events table */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="p-6 border-b border-dark-100 dark:border-dark-700">
            <h2 className="text-lg font-bold text-dark-900 dark:text-white">Manage Events</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-dark-700">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase">Event</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase hidden md:table-cell">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase hidden sm:table-cell">Registrations</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {myEvents.slice(0, 8).map((event) => (
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
                    <td className="py-3 px-4 text-sm text-dark-600 dark:text-dark-300 hidden md:table-cell">{event.date}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <span className={event.status === 'upcoming' ? 'badge-green' : 'badge-blue'}>{event.status}</span>
                        {getStatusBadge(event.approvalStatus)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-dark-600 dark:text-dark-300 hidden sm:table-cell">{event.currentRegistrations}/{event.maxCapacity}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Link to={`/events/${event.id}`} className="p-1.5 rounded-lg hover:bg-gu-50 dark:hover:bg-gu-900/20 text-gu-600 dark:text-gold-400" title="View Details">
                          <HiOutlineEye className="w-4 h-4" />
                        </Link>
                        {event.status === 'upcoming' && (
                          <Link to={`/manage-registrations/${event.id}`} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400" title="Manage Registrations">
                            <HiOutlineUserGroup className="w-4 h-4" />
                          </Link>
                        )}
                        <button onClick={() => startEditing(event)} className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400" title="Edit Event">
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>
                        {event.status === 'completed' && (
                          <Link to="/event-results" className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" title="Declare Results">
                            <HiOutlineStar className="w-4 h-4" />
                          </Link>
                        )}
                        <button
                          onClick={() => toggleFeedback(event.id)}
                          className={`p-1.5 rounded-lg transition-colors ${isFeedbackEnabled(event.id) ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'hover:bg-gray-100 dark:hover:bg-dark-700 text-dark-400'}`}
                          title={isFeedbackEnabled(event.id) ? 'Feedback Enabled — Click to Disable' : 'Enable Feedback Collection'}
                        >
                          <HiOutlineChatAlt2 className="w-4 h-4" />
                        </button>
                        {event.status === 'upcoming' && (
                          <button
                            onClick={() => markCompleted(event)}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                            title="Mark as Completed"
                          >
                            <HiOutlineCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(event.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500" title="Cancel/Delete Event">
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

        {/* Right side */}
        <div className="space-y-6">
          {/* Registration trend */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-dark-900 dark:text-white mb-4">Registration Trend</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={registrationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Feedback */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-dark-900 dark:text-white mb-4">Recent Feedback</h2>
            <div className="space-y-3">
              {recentFeedback.length === 0 ? (
                <p className="text-sm text-dark-400 text-center py-4">No feedback received yet</p>
              ) : (
                recentFeedback.map((fb, i) => (
                  <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-dark-700">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-dark-900 dark:text-white">{fb.name}</p>
                      <span className="text-amber-500 text-sm">{'★'.repeat(fb.rating)}</span>
                    </div>
                    <p className="text-xs text-dark-400">{fb.event}</p>
                    <p className="text-sm text-dark-600 dark:text-dark-300 mt-1">"{fb.comment}"</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Edit Event Modal ─── */}
      <AnimatePresence>
        {editingEvent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditingEvent(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-dark-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-dark-100 dark:border-dark-700">
                <h3 className="text-lg font-bold text-dark-900 dark:text-white">✏️ Edit Event</h3>
                <button onClick={() => setEditingEvent(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-dark-500"><HiOutlineX className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Event Title</label>
                  <input value={editForm.title || ''} onChange={e => setEditForm({...editForm, title: e.target.value})} className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Date</label>
                    <input type="date" value={editForm.date || ''} onChange={e => setEditForm({...editForm, date: e.target.value})} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Time</label>
                    <input value={editForm.time || ''} onChange={e => setEditForm({...editForm, time: e.target.value})} className="input-field" placeholder="10:00 AM" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Venue</label>
                  <select value={editForm.venue || ''} onChange={e => setEditForm({...editForm, venue: e.target.value})} className="input-field">
                    <option value="">Select venue</option>
                    {['AIDS Library', 'New Auditorium', 'Old Auditorium', 'Open Concert Area', 'Main Ground', 'Cricket Ground', 'iOS Lab', 'Code Arena'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Max Capacity</label>
                  <input type="number" value={editForm.maxCapacity || ''} onChange={e => setEditForm({...editForm, maxCapacity: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Description</label>
                  <textarea rows={3} value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} className="input-field resize-none" />
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-3">
                  <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <HiOutlineExclamation className="w-4 h-4 flex-shrink-0" />
                    All registered students will be notified of any changes immediately.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 p-6 border-t border-dark-100 dark:border-dark-700">
                <button onClick={() => setEditingEvent(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={saveEdit} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <HiOutlineSave className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Delete Confirmation Modal ─── */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={cancelDelete}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-dark-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                  <HiOutlineExclamation className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-dark-900 dark:text-white mb-2">Cancel Event?</h3>
                <p className="text-dark-500 dark:text-dark-400 text-sm mb-1">Are you sure you want to cancel</p>
                <p className="font-bold text-dark-900 dark:text-white text-lg mb-4">"{deleteConfirm.title}"</p>
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl p-4 mb-6 text-left">
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium mb-2">⚠️ This action will:</p>
                  <ul className="text-xs text-red-600 dark:text-red-400 space-y-1 ml-4 list-disc">
                    <li>Permanently remove this event</li>
                    <li>Cancel all existing registrations</li>
                    <li>Notify all registered students</li>
                    <li>This action cannot be undone</li>
                  </ul>
                </div>
                <div className="flex gap-3">
                  <button onClick={cancelDelete} className="btn-secondary flex-1 !py-3">Keep Event</button>
                  <button onClick={handleConfirmDelete} className="flex-1 !py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors">
                    Yes, Cancel Event
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
