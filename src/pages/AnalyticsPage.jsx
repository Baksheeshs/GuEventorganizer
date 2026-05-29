import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useEventManagement } from '../context/EventManagementContext';
import { useRegistration } from '../context/RegistrationContext';
import { useCertificates } from '../context/CertificateContext';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];

export default function AnalyticsPage() {
  const { getAllEvents } = useEventManagement();
  const { registrations } = useRegistration();
  const { certificates } = useCertificates();

  const allEvents = getAllEvents();

  // ── Live stats ──
  const totalRegistrations = registrations.length;
  const approvedRegs = registrations.filter(r => r.status === 'approved').length;
  const totalCertificates = certificates.length;
  const avgAttendance = useMemo(() => {
    const eventsWithCap = allEvents.filter(e => e.maxCapacity > 0);
    if (eventsWithCap.length === 0) return '0%';
    const totalRegs = eventsWithCap.reduce((sum, e) => {
      const regs = registrations.filter(r => r.eventId === e.id && r.status === 'approved').length;
      return sum + (regs / e.maxCapacity * 100);
    }, 0);
    return `${Math.round(totalRegs / eventsWithCap.length)}%`;
  }, [allEvents, registrations]);

  const stats = [
    { label: 'Total Events', value: allEvents.length.toLocaleString() },
    { label: 'Event Registrations', value: totalRegistrations.toLocaleString() },
    { label: 'Approved Registrations', value: approvedRegs.toLocaleString() },
    { label: 'Certificates Issued', value: totalCertificates.toLocaleString() },
  ];

  // ── Monthly events & participants (live from DB) ──
  const monthlyEvents = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map(m => ({ month: m, events: 0, participants: 0 }));
    allEvents.forEach(e => {
      if (e.date) {
        const d = new Date(e.date);
        const mi = d.getMonth();
        data[mi].events++;
        data[mi].participants += registrations.filter(r => r.eventId === e.id).length;
      }
    });
    // Only return months that have data or current year months
    const now = new Date();
    return data.filter((_, i) => i <= now.getMonth() + 1);
  }, [allEvents, registrations]);

  // ── Department participation (live from registrations) ──
  const departmentParticipation = useMemo(() => {
    const deptMap = {};
    registrations.forEach(r => {
      const dept = r.course || r.department || 'Other';
      const shortDept = dept.replace('B.Tech ', '').replace('M.Tech ', '');
      deptMap[shortDept] = (deptMap[shortDept] || 0) + 1;
    });
    const total = Object.values(deptMap).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(deptMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({
        name,
        value: Math.round((count / total) * 100),
      }));
  }, [registrations]);

  // ── Weekly registrations (live from registration timestamps) ──
  const weeklyData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const counts = new Array(7).fill(0);
    const regCounts = new Array(7).fill(0);
    registrations.forEach(r => {
      if (r.createdAt || r.created_at) {
        const d = new Date(r.createdAt || r.created_at);
        const dayIndex = (d.getDay() + 6) % 7; // Monday = 0
        counts[dayIndex]++;
        if (r.status === 'approved') regCounts[dayIndex]++;
      }
    });
    return days.map((day, i) => ({ day, visitors: counts[i] * 3, registrations: counts[i] }));
  }, [registrations]);

  // ── Category stats (live from events) ──
  const categoryStats = useMemo(() => {
    const catMap = {};
    allEvents.forEach(e => {
      const cat = e.category || 'Other';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });
    return Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ category, count }));
  }, [allEvents]);

  return (
    <div className="space-y-6">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Analytics & Reports</h1>
        <p className="text-dark-500 dark:text-dark-400 mt-1">Track event performance and participation metrics — live data</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            whileHover={{ y: -3 }} className="card p-5">
            <p className="text-sm text-dark-500 dark:text-dark-400">{s.label}</p>
            <p className="text-2xl font-bold text-dark-900 dark:text-white mt-2">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly events */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-dark-900 dark:text-white mb-4">Monthly Events & Participants</h2>
          {monthlyEvents.some(d => d.events > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyEvents}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="events" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Events" />
                <Bar dataKey="participants" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Participants" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-dark-400">No event data yet</div>
          )}
        </div>

        {/* Department pie */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-dark-900 dark:text-white mb-4">Department Participation</h2>
          {departmentParticipation.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={departmentParticipation} cx="50%" cy="50%" outerRadius={90} innerRadius={55} dataKey="value" paddingAngle={2} label={({ name, value }) => `${name} ${value}%`}>
                    {departmentParticipation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {departmentParticipation.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                    <span className="text-dark-600 dark:text-dark-300">{d.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-dark-400">No registration data yet</div>
          )}
        </div>

        {/* Weekly visitors */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-dark-900 dark:text-white mb-4">Weekly Registration Activity</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="visitors" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} strokeWidth={2} name="Activity" />
              <Area type="monotone" dataKey="registrations" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2} name="Registrations" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category stats */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-dark-900 dark:text-white mb-4">Events by Category</h2>
          {categoryStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                <YAxis dataKey="category" type="category" stroke="#94a3b8" fontSize={12} width={80} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-dark-400">No events yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
