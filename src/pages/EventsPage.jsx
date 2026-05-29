import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineSearch, HiOutlineFilter, HiOutlineViewGrid, HiOutlineViewList, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineStar, HiOutlineUserGroup, HiOutlineSparkles, HiOutlineCalendar, HiOutlineX } from 'react-icons/hi';
import { categories } from '../data/constants';
import { useEventManagement } from '../context/EventManagementContext';
import { useRegistration } from '../context/RegistrationContext';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

const sihImages = [
  { src: '/sih-1.jpg', label: 'Team with KRITRIM Robot' },
  { src: '/sih-2.jpg', label: 'Grand Audience at Galgotias' },
  { src: '/sih-3.jpg', label: 'Winner — ₹75,000 Prize' },
  { src: '/sih-4.jpg', label: 'Victory Celebration' },
  { src: '/sih-5.jpg', label: 'Participants on Stage' },
  { src: '/sih-6.jpg', label: 'Judges Panel' },
  { src: '/sih-7.jpg', label: 'Wellness Session at Campus' },
  { src: '/sih-8.jpg', label: 'Hardware Project Demo' },
];

export default function EventsPage() {
  const { getApprovedEvents } = useEventManagement();
  const { getApprovedRequestsForEvent } = useRegistration();
  const events = getApprovedEvents(); // Students only see approved events
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [view, setView] = useState('grid');
  const [sihActive, setSihActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSihActive(c => (c + 1) % sihImages.length), 4000);
    return () => clearInterval(t);
  }, []);

  const filtered = events.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || e.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-white">All Events</h1>
        <p className="text-dark-500 dark:text-dark-400 mt-1">Discover and register for campus events</p>
      </motion.div>

      {/* SIH 2025 Showcase Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-white/10 shadow-2xl"
      >
        {/* Pin icon */}
        <div className="absolute top-3 right-4 z-20 flex items-center gap-1.5 bg-amber-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg" style={{ transform: 'rotate(3deg)' }}>
          <span className="text-lg leading-none">📌</span>
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">Pinned</span>
        </div>
        <div className="grid lg:grid-cols-2 gap-0">
          {/* Left: Image Carousel */}
          <div className="relative h-72 sm:h-80 lg:h-[420px] overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.img
                  key={sihActive}
                  src={sihImages[sihActive].src}
                  alt={sihImages[sihActive].label}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.8 }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0f172a]/80 hidden lg:block" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent lg:hidden" />
              
              {/* Carousel controls */}
              <button onClick={() => setSihActive(c => (c - 1 + sihImages.length) % sihImages.length)} className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60 transition-colors z-10">
                <HiOutlineChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button onClick={() => setSihActive(c => (c + 1) % sihImages.length)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60 transition-colors z-10">
                <HiOutlineChevronRight className="w-5 h-5 text-white" />
              </button>
          </div>

          {/* Right: Info */}
          <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 bg-gold-400/15 px-3 py-1 rounded-full mb-4 w-fit border border-gold-400/30">
              <HiOutlineStar className="w-4 h-4 text-gold-400" />
              <span className="text-gold-400 text-xs font-semibold uppercase tracking-wider">Past Event Highlight</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight">
              Smart India Hackathon 2025
              <span className="block text-lg sm:text-xl text-gold-400 font-semibold mt-1">Hardware Edition — Grand Finale</span>
            </h2>

            <p className="text-white/60 text-sm sm:text-base leading-relaxed mb-6">
              Galgotias University proudly hosted the <strong className="text-white/90">SIH 2025 Hardware Edition Grand Finale</strong>, 
              where Team <strong className="text-gold-400">OuroBonics</strong> won ₹75,000 with their humanoid robot 
              <strong className="text-white/90"> KRITRIM</strong> — a fully 3D-printed AI-powered robot that stunned judges and audiences alike.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { icon: HiOutlineUserGroup, value: '500+', label: 'Participants' },
                { icon: HiOutlineStar, value: '₹75K', label: 'Prize Won' },
                { icon: HiOutlineSparkles, value: '36hrs', label: 'Non-stop' },
                { icon: HiOutlineCalendar, value: 'Dec 2025', label: 'Grand Finale' },
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                  <stat.icon className="w-5 h-5 text-gold-400 mx-auto mb-1" />
                  <p className="text-white font-bold text-sm">{stat.value}</p>
                  <p className="text-white/40 text-[10px]">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20 font-medium">🤖 Robotics</span>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-medium">🏆 National Winner</span>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/20 font-medium">🧠 AI/ML</span>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 font-medium">⚙️ Hardware</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} className="input-field !pl-10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['All', ...categories.map(c => c.name)].map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-4 py-2 text-sm rounded-xl font-medium transition-all ${category === c ? 'bg-gu-600 text-white' : 'bg-white dark:bg-dark-800 text-dark-600 dark:text-dark-300 border border-dark-200 dark:border-dark-600 hover:border-gold-400'}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-dark-800 rounded-xl p-1">
          <button onClick={() => setView('grid')} className={`p-2 rounded-lg ${view === 'grid' ? 'bg-white dark:bg-dark-700 shadow-sm' : ''}`}><HiOutlineViewGrid className="w-5 h-5" /></button>
          <button onClick={() => setView('list')} className={`p-2 rounded-lg ${view === 'list' ? 'bg-white dark:bg-dark-700 shadow-sm' : ''}`}><HiOutlineViewList className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Results */}
      <p className="text-sm text-dark-500 dark:text-dark-400">{filtered.length} events found</p>

      {view === 'grid' ? (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(event => {
            const currentRegistrations = (event.registrations || 0) + getApprovedRequestsForEvent(event.id).length;
            return (
            <motion.div key={event.id} variants={fadeUp} whileHover={{ y: -5 }} className="card overflow-hidden group">
              <div className="relative h-48 overflow-hidden">
                <img src={event.poster} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-3 left-3"><span className={event.status === 'upcoming' ? 'badge-green' : 'badge-blue'}>{event.status}</span></div>
                <div className="absolute top-3 right-3"><span className="badge-blue">{event.category}</span></div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg text-dark-900 dark:text-white mb-2 group-hover:text-gu-600 dark:group-hover:text-gold-400 transition-colors">{event.title}</h3>
                <p className="text-dark-500 dark:text-dark-400 text-sm line-clamp-2 mb-3">{event.description}</p>
                <div className="space-y-1.5 text-xs text-dark-400 mb-4">
                  <p>📍 {event.venue}</p>
                  <p>📅 {event.date} at {event.time}</p>
                  <p>🏢 {event.organizer} • {event.department}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-500">👥 {currentRegistrations}/{event.maxCapacity}</span>
                  <Link to={`/events/${event.id}`} className="text-gu-600 dark:text-gold-400 text-sm font-semibold hover:underline">View Details →</Link>
                </div>
                <div className="mt-3 h-1.5 bg-dark-100 dark:bg-dark-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-gu-500 to-gold-400 rounded-full" style={{ width: `${(currentRegistrations / event.maxCapacity) * 100}%` }} />
                </div>
              </div>
            </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filtered.map(event => {
            const currentRegistrations = (event.registrations || 0) + getApprovedRequestsForEvent(event.id).length;
            return (
            <motion.div key={event.id} variants={fadeUp} initial="hidden" animate="visible" whileHover={{ x: 4 }}
              className="card p-4 flex items-center gap-4 cursor-pointer">
              <img src={event.poster} alt="" className="w-20 h-16 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-dark-900 dark:text-white">{event.title}</h3>
                  <span className={event.status === 'upcoming' ? 'badge-green' : 'badge-blue'}>{event.status}</span>
                </div>
                <p className="text-sm text-dark-500 dark:text-dark-400">📍 {event.venue} • 📅 {event.date} • 🏢 {event.organizer}</p>
              </div>
              <div className="text-right flex-shrink-0 hidden sm:block">
                <p className="text-sm font-semibold text-dark-900 dark:text-white">{currentRegistrations}/{event.maxCapacity}</p>
                <Link to={`/events/${event.id}`} className="text-gu-600 text-sm font-medium">Details →</Link>
              </div>
            </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

