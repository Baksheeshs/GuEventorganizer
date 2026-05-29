import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineCalendar, HiOutlineTicket, HiOutlineBookmark, HiOutlineAcademicCap, HiOutlineChevronRight, HiOutlineChevronLeft, HiOutlineX } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useEventManagement } from '../context/EventManagementContext';
import { useRegistration } from '../context/RegistrationContext';
import { sendEventReminderEmail } from '../services/emailService';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

/* helpers for the deadlines widget */
const MONTHS_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
function parseDate(d){ const p=new Date(d); return { day:p.getDate(), month:MONTHS_SHORT[p.getMonth()], raw:p }; }
function daysUntil(d){ const now=new Date(); const t=new Date(d); return Math.max(0,Math.ceil((t-now)/(1000*60*60*24))); }

import { useCertificates } from '../context/CertificateContext';
import { useBookmarks } from '../context/BookmarkContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { getApprovedEvents, eventNotifications } = useEventManagement();
  const events = getApprovedEvents(); // Only admin-approved events
  const upcoming = events.filter(e => e.status === 'upcoming').slice(0, 4);
  const recommended = events.filter(e => e.category === 'Technical' || e.category === 'Hackathons').slice(0, 3);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date(2026, 4, 1));
  const [selectedDay, setSelectedDay] = useState(null);
  const { registrations, attendanceCodes } = useRegistration();

  // ── Event Reminder System (1 day before) ──
  useEffect(() => {
    if (!user?.email || !registrations) return;

    // Get all user's registered events (approved)
    const myRegistrations = registrations.filter(r => 
      (r.studentId === user.admissionNo || r.email === user.email) && 
      r.status === 'approved'
    );

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    myRegistrations.forEach(async (reg) => {
      const event = events.find(e => e.id === reg.eventId);
      if (event && event.date === tomorrowStr) {
        // Check if we already sent a reminder for this event+user
        const sentKey = `reminder_sent_${event.id}_${user.email}`;
        if (!localStorage.getItem(sentKey)) {
          const result = await sendEventReminderEmail({
            toName: user.name,
            toEmail: user.email,
            eventName: event.title,
            eventDate: event.date,
            eventTime: event.time,
            eventVenue: event.venue,
          });
          if (result.success) {
            localStorage.setItem(sentKey, 'true');
            console.log(`✅ Sent reminder for ${event.title}`);
          }
        }
      }
    });
  }, [user, events, registrations]);

  /* Build deadlines from upcoming events, sorted by date */
  const deadlines = events
    .filter(e => e.status === 'upcoming')
    .sort((a,b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4)
    .map(e => {
      const { day, month } = parseDate(e.date);
      const left = daysUntil(e.date);
      return { id: e.id, title: e.title, day, month, time: e.time, department: e.department, daysLeft: left };
    });

  // Compute live data
  const { certificates: allCertificates } = useCertificates();
  const { bookmarks } = useBookmarks();
  
  // 1. Registered Events (Approved or Pending - we will just count approved)
  const myRegistrations = registrations.filter(r => 
    (r.studentId === user?.admissionNo || r.email === user?.email) && 
    r.status === 'approved'
  );
  const registeredCount = myRegistrations.length;

  // 2. Events Attended (from attendance codes)
  const attendedCount = Object.values(attendanceCodes || {})
    .flat()
    .filter(c => (c.admissionNo === user?.admissionNo || c.email === user?.email) && c.verified).length;

  // 3. Certificates Earned
  const myCertificates = allCertificates.filter(c => 
    c.studentId === user?.id || c.studentName === user?.name || c.admissionNo === user?.admissionNo
  );
  const certificatesCount = myCertificates.length;

  // 4. Bookmarks
  const bookmarkedCount = bookmarks.length;

  const stats = [
    { label: 'Registered Events', value: registeredCount, icon: HiOutlineTicket, color: 'from-blue-500 to-cyan-500' },
    { label: 'Events Attended', value: attendedCount, icon: HiOutlineCalendar, color: 'from-purple-500 to-pink-500' },
    { label: 'Certificates Earned', value: certificatesCount, icon: HiOutlineAcademicCap, color: 'from-emerald-500 to-teal-500' },
    { label: 'Bookmarked', value: bookmarkedCount, icon: HiOutlineBookmark, color: 'from-amber-500 to-orange-500' },
  ];

  const activityTimeline = useMemo(() => {
    const timeline = [];
    myRegistrations.forEach(r => {
      const e = events.find(ev => ev.id === r.eventId);
      if (e) timeline.push({ time: new Date(r.createdAt || r.created_at || Date.now()).toLocaleDateString(), text: `Registered for ${e.title}`, type: 'register', rawTime: new Date(r.createdAt || r.created_at || Date.now()).getTime() });
    });
    myCertificates.forEach(c => {
      timeline.push({ time: new Date(c.created_at || Date.now()).toLocaleDateString(), text: `Earned ${c.type} certificate for ${c.eventName}`, type: 'certificate', rawTime: new Date(c.created_at || Date.now()).getTime() });
    });
    return timeline.sort((a, b) => b.rawTime - a.rawTime).slice(0, 5);
  }, [myRegistrations, myCertificates, events]);

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const counts = new Array(12).fill(0);
    Object.values(attendanceCodes || {}).flat().forEach(c => {
      if ((c.admissionNo === user?.admissionNo || c.email === user?.email) && c.verified) {
        // find the event
        const eventId = Object.keys(attendanceCodes).find(key => attendanceCodes[key].some(ac => ac.code === c.code));
        const event = events.find(e => String(e.id) === String(eventId));
        if (event && event.date) {
          counts[new Date(event.date).getMonth()]++;
        }
      }
    });
    const now = new Date();
    return months.map((m, i) => ({ month: m, attended: counts[i] })).filter((_, i) => i <= now.getMonth() + 1);
  }, [attendanceCodes, user, events]);

  return (
    <>
    <div className="space-y-6">
      {/* Welcome banner */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="relative rounded-2xl overflow-hidden border border-blue-100 dark:border-dark-700 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-dark-800 dark:via-dark-800 dark:to-dark-700 shadow-sm">
        {/* Decorative blobs */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-100/60 dark:bg-blue-900/20 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-indigo-100/40 dark:bg-indigo-900/10 rounded-full blur-xl" />

        <div className="relative z-10 flex items-center justify-between p-6 md:p-8">
          {/* Left content */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-dark-900 dark:text-white">
              Welcome Back, {user?.name} 👋
            </h1>
            <p className="text-dark-500 dark:text-dark-400 mt-2 text-sm md:text-base max-w-md">
              Stay updated with upcoming events, deadlines, and campus activities. Don't miss out on what's happening!
            </p>
            <div className="flex gap-3 mt-5">
              <Link to="/events" className="px-5 py-2.5 bg-gu-600 text-white font-semibold rounded-xl text-sm hover:bg-gu-700 transition-colors shadow-md shadow-gu-600/20">Browse Events</Link>
              <Link to="/certificates" className="px-5 py-2.5 bg-white dark:bg-dark-700 text-dark-700 dark:text-dark-200 font-semibold rounded-xl text-sm border border-dark-200 dark:border-dark-600 hover:border-gu-400 dark:hover:border-gu-500 transition-colors">My Certificates</Link>
            </div>
          </div>

          {/* Right illustration */}
          <div className="hidden md:block flex-shrink-0 ml-6">
            <img src="/welcome-illustration.png" alt="" className="h-44 lg:h-52 object-contain drop-shadow-md" />
          </div>
        </div>
      </motion.div>

      {/* Stats cards */}
      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={i} variants={fadeUp} whileHover={{ y: -3 }} className="card p-5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-dark-900 dark:text-white">{stat.value}</p>
            <p className="text-sm text-dark-500 dark:text-dark-400">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming events */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-dark-900 dark:text-white">Upcoming Registered Events</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowCalendar(true)} className="p-2 rounded-xl bg-gu-600 text-white hover:bg-gu-700 transition-colors shadow-sm" title="Event Calendar">
                  <HiOutlineCalendar className="w-5 h-5" />
                </button>
                <Link to="/events" className="text-gu-600 dark:text-gold-400 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">View all <HiOutlineChevronRight /></Link>
              </div>
            </div>
            <div className="space-y-3">
              {upcoming.map((event) => (
                <motion.div key={event.id} whileHover={{ x: 4 }} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors cursor-pointer">
                  <img src={event.poster} alt={event.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-dark-900 dark:text-white text-sm truncate">{event.title}</h3>
                    <p className="text-xs text-dark-500 dark:text-dark-400 mt-0.5">📍 {event.venue} • 📅 {event.date}</p>
                  </div>
                  <span className="badge-blue flex-shrink-0">{event.category}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Participation chart */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-dark-900 dark:text-white mb-4">Participation History</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="attended" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">

          {/* ── Upcoming Deadlines ── */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="card overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-5 pt-5 pb-3">
              <span className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500 text-sm">📋</span>
              <h2 className="text-lg font-bold text-dark-900 dark:text-white">Upcoming Deadlines</h2>
            </div>

            {/* Red accent line */}
            <div className="mx-5 h-[3px] rounded-full bg-gradient-to-r from-red-500 to-red-400 mb-4" />

            {/* Deadline items */}
            <div className="px-5 space-y-4 pb-2">
              {deadlines.map((dl, i) => (
                <motion.div
                  key={dl.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 group"
                >
                  {/* Calendar badge */}
                  <div className="flex-shrink-0 w-12 h-14 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50/60 dark:bg-red-900/20 flex flex-col items-center justify-center transition-transform group-hover:scale-105">
                    <span className="text-lg font-bold leading-tight text-red-600 dark:text-red-400">{dl.day}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400 dark:text-red-500">{dl.month}</span>
                  </div>

                  {/* Info */}
                  <div className="min-w-0 pt-0.5">
                    <p className="text-sm font-semibold text-dark-900 dark:text-white leading-snug truncate">{dl.title}</p>
                    <p className="text-xs text-dark-500 dark:text-dark-400 mt-0.5">
                      {dl.daysLeft === 0
                        ? <span className="text-red-500 font-medium">Due today at {dl.time}</span>
                        : <>Due in <span className="font-medium text-red-500">{dl.daysLeft} day{dl.daysLeft > 1 ? 's' : ''}</span> at {dl.time}</>
                      }
                    </p>
                    <p className="text-[11px] text-dark-400 dark:text-dark-500 mt-0.5">{dl.department}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* View Calendar button */}
            <div className="px-5 pb-5 pt-3">
              <button
                onClick={() => setShowCalendar(true)}
                className="block w-full text-center py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-sm font-semibold text-dark-700 dark:text-dark-200 hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors cursor-pointer"
              >
                View Calendar
              </button>
            </div>
          </motion.div>

          {/* Activity timeline */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-dark-900 dark:text-white mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {activityTimeline.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-gu-500 mt-1.5" />
                    {i < activityTimeline.length - 1 && <div className="w-0.5 flex-1 bg-dark-200 dark:bg-dark-600 mt-1" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm text-dark-800 dark:text-dark-200">{item.text}</p>
                    <p className="text-xs text-dark-400 dark:text-dark-500 mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-dark-900 dark:text-white mb-4">Recommended</h2>
            <div className="space-y-3">
              {recommended.map((event) => (
                <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 cursor-pointer transition-colors">
                  <img src={event.poster} alt={event.title} className="w-10 h-10 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-dark-900 dark:text-white truncate">{event.title}</p>
                    <p className="text-xs text-dark-400">{event.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Calendar Modal Popup */}
    <CalendarModal
      isOpen={showCalendar}
      onClose={() => setShowCalendar(false)}
      calMonth={calMonth}
      setCalMonth={setCalMonth}
      selectedDay={selectedDay}
      setSelectedDay={setSelectedDay}
      events={events}
    />
    </>
  );
}

/* ── Calendar Modal (shared with EventsPage) ── */
function CalendarModal({ isOpen, onClose, calMonth, setCalMonth, selectedDay, setSelectedDay, events }) {
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const monthEvents = events.filter(e => { const d = new Date(e.date); return d.getMonth() === month && d.getFullYear() === year; });
  const getEventsForDay = (day) => { const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`; return monthEvents.filter(e => e.date === ds); };
  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-dark-800 rounded-2xl shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-dark-100 dark:border-dark-700 bg-white dark:bg-dark-800">
              <h2 className="text-xl font-bold text-dark-900 dark:text-white flex items-center gap-2">
                <HiOutlineCalendar className="w-6 h-6 text-gu-600" /> Event Calendar
              </h2>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors">
                <HiOutlineX className="w-5 h-5 text-dark-500" />
              </button>
            </div>
            <div className="p-5 grid lg:grid-cols-3 gap-5">
              {/* Calendar grid */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-5">
                  <button onClick={() => setCalMonth(new Date(year, month - 1, 1))} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"><HiOutlineChevronLeft className="w-5 h-5 text-dark-600 dark:text-dark-300" /></button>
                  <h3 className="text-lg font-bold text-dark-900 dark:text-white">{monthNames[month]} {year}</h3>
                  <button onClick={() => setCalMonth(new Date(year, month + 1, 1))} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"><HiOutlineChevronRight className="w-5 h-5 text-dark-600 dark:text-dark-300" /></button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {dayNames.map(d => <div key={d} className="text-center text-xs font-semibold text-dark-400 py-2">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} className="h-12 sm:h-14" />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dayEvents = getEventsForDay(day);
                    const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                    const isSelected = selectedDay === day;
                    const hasEvents = dayEvents.length > 0;
                    return (
                      <button key={day} onClick={() => setSelectedDay(isSelected ? null : day)}
                        className={`h-12 sm:h-14 rounded-xl text-sm font-medium transition-all
                          ${isSelected ? 'bg-gu-600 text-white shadow-lg scale-105' :
                            isToday ? 'bg-gold-400/15 text-gold-600 dark:text-gold-400 border border-gold-400/30' :
                            hasEvents ? 'bg-gray-50 dark:bg-dark-700/50 text-dark-900 dark:text-white hover:bg-gu-50 dark:hover:bg-dark-700' :
                            'text-dark-500 dark:text-dark-400 hover:bg-gray-50 dark:hover:bg-dark-800'}
                        `}>
                        <span>{day}</span>
                        {hasEvents && (
                          <div className="flex justify-center gap-0.5 mt-0.5">
                            {dayEvents.slice(0, 3).map((_, ei) => (
                              <span key={ei} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-gu-500'}`} />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-dark-100 dark:border-dark-700">
                  <div className="flex items-center gap-1.5 text-xs text-dark-400"><span className="w-2 h-2 rounded-full bg-gu-500" /> Event day</div>
                  <div className="flex items-center gap-1.5 text-xs text-dark-400"><span className="w-2 h-2 rounded-full bg-gold-400" /> Today</div>
                </div>
              </div>
              {/* Sidebar */}
              <div className="bg-gray-50 dark:bg-dark-700/30 rounded-xl p-4">
                <h3 className="font-bold text-dark-900 dark:text-white mb-3 text-sm">
                  {selectedDay ? `${monthNames[month]} ${selectedDay}` : `${monthNames[month]} Overview`}
                </h3>
                {selectedDay && selectedEvents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedEvents.map(event => (
                      <Link key={event.id} to={`/events/${event.id}`} onClick={onClose} className="flex items-start gap-3 p-2.5 rounded-xl bg-white dark:bg-dark-800 hover:shadow-md transition-all group border border-dark-100 dark:border-dark-600">
                        <img src={event.poster} alt="" className="w-12 h-9 rounded-lg object-cover flex-shrink-0" />
                        <div className="min-w-0">
                          <h4 className="font-semibold text-xs text-dark-900 dark:text-white group-hover:text-gu-600 transition-colors truncate">{event.title}</h4>
                          <p className="text-[10px] text-dark-400 mt-0.5">🕐 {event.time} • 📍 {event.venue}</p>
                          <span className={`inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded-full font-medium ${event.status === 'upcoming' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                            {event.status}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : selectedDay ? (
                  <div className="text-center py-6"><p className="text-3xl mb-2">📭</p><p className="text-dark-400 text-xs">No events on this day</p></div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-center py-4"><p className="text-3xl mb-2">👈</p><p className="text-dark-400 text-xs">Click a day to see events</p></div>
                    <div className="border-t border-dark-200 dark:border-dark-600 pt-3 space-y-2">
                      <div className="flex justify-between text-xs"><span className="text-dark-400">Total Events</span><span className="font-bold text-dark-900 dark:text-white">{monthEvents.length}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-dark-400">Upcoming</span><span className="font-bold text-emerald-500">{monthEvents.filter(e => e.status === 'upcoming').length}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-dark-400">Completed</span><span className="font-bold text-blue-500">{monthEvents.filter(e => e.status === 'completed').length}</span></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
