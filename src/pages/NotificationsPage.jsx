import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineBell, HiOutlineCheck, HiOutlineTrash } from 'react-icons/hi';
import { useNotifications } from '../context/NotificationContext';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function NotificationsPage() {
  const [filter, setFilter] = useState('all');
  const { notifications: items, unreadCount, markAllAsRead, markAsRead } = useNotifications();

  const filtered = filter === 'all' ? items : filter === 'unread' ? items.filter(n => !n.read) : items.filter(n => n.read);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Notifications</h1>
          <p className="text-dark-500 dark:text-dark-400 mt-1">{unreadCount} unread notifications</p>
        </div>
        <button onClick={markAllAsRead} className="btn-ghost text-sm flex items-center gap-2">
          <HiOutlineCheck className="w-4 h-4" /> Mark all read
        </button>
      </motion.div>

      <div className="flex gap-2">
        {['all', 'unread', 'read'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm rounded-xl font-medium capitalize transition-all ${filter === f ? 'bg-gu-600 text-white' : 'bg-white dark:bg-dark-800 text-dark-500 border border-dark-200 dark:border-dark-600'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((n, i) => (
          <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            onClick={() => !n.read && markAsRead(n.id)}
            className={`card p-4 flex items-start gap-4 cursor-pointer transition-all hover:shadow-md ${!n.read ? 'border-l-4 border-l-gu-500 bg-gu-50/50 dark:bg-gu-900/10' : ''}`}>
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-dark-700 flex items-center justify-center text-xl flex-shrink-0">{n.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className={`font-semibold text-sm ${!n.read ? 'text-dark-900 dark:text-white' : 'text-dark-600 dark:text-dark-300'}`}>{n.title}</h3>
                {!n.read && <div className="w-2.5 h-2.5 rounded-full bg-gu-500 flex-shrink-0 mt-1.5" />}
              </div>
              <p className="text-sm text-dark-500 dark:text-dark-400 mt-0.5">{n.message}</p>
              <p className="text-xs text-dark-400 mt-2">{n.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
