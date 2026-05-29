import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useClubManagement } from '../context/ClubManagementContext';
import { useEventManagement } from '../context/EventManagementContext';
import { useAuth } from '../context/AuthContext';
import { HiOutlineUserGroup, HiOutlineCalendar, HiOutlineArrowLeft, HiOutlineGlobeAlt, HiOutlineMail, HiOutlineLocationMarker } from 'react-icons/hi';
import JoinClubModal from '../components/JoinClubModal';
import ClubRegistrationStatusCard from '../components/ClubRegistrationStatusCard';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

export default function ClubDetailsPage() {
  const { id } = useParams();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const { getAllClubs, getClubRegistrationStatus } = useClubManagement();
  const { user } = useAuth();
  const clubs = getAllClubs();
  const club = clubs.find(c => c.id === parseInt(id) || c.id === id);

  if (!club) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">Club Not Found</h2>
          <p className="text-dark-500 dark:text-dark-400 mb-4">The club you're looking for doesn't exist.</p>
          <Link to="/clubs" className="btn-primary">← Back to Clubs</Link>
        </div>
      </div>
    );
  }

  const { getApprovedEvents } = useEventManagement();
  const events = getApprovedEvents();

  // Check if current user has applied to this club
  const myRegistration = user?.email ? getClubRegistrationStatus(club.id, user.email) : null;

  // Separate upcoming and past events from the global events list
  const clubUpcoming = club.upcomingEvents || [];
  const pastEvents = events.filter(e => e.status === 'completed').slice(0, 4);
  const allRelatedEvents = [...clubUpcoming, ...pastEvents.filter(pe => !clubUpcoming.find(ue => ue.id === pe.id))];

  return (
    <>
    <div className="space-y-8">
      {/* Back button */}
      <Link to="/clubs" className="inline-flex items-center gap-2 text-dark-500 dark:text-dark-400 hover:text-gu-600 dark:hover:text-gold-400 transition-colors text-sm font-medium">
        <HiOutlineArrowLeft className="w-4 h-4" /> Back to Clubs
      </Link>

      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${club.color} p-8 md:p-12`}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          {/* Logo */}
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center overflow-hidden p-3 border border-white/20 flex-shrink-0">
            {club.logo ? (
              <img src={club.logo} alt={club.name} className="w-full h-full object-contain" />
            ) : (
              <span className="text-white font-bold text-4xl">{club.abbr}</span>
            )}
          </div>

          {/* Info */}
          <div className="text-center md:text-left">
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
              <span className="badge-blue">{club.category}</span>
              <span className="badge-green">{club.members} members</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{club.name}</h1>
            <p className="text-white/70 text-base md:text-lg max-w-2xl">{club.description}</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { icon: HiOutlineUserGroup, label: 'Total Members', value: club.members, color: 'text-blue-500' },
          { icon: HiOutlineCalendar, label: 'Events Organized', value: club.events, color: 'text-emerald-500' },
          { icon: HiOutlineGlobeAlt, label: 'Category', value: club.category, color: 'text-purple-500' },
          { icon: HiOutlineLocationMarker, label: 'Upcoming Events', value: clubUpcoming.length, color: 'text-amber-500' },
        ].map((stat, i) => (
          <motion.div key={i} variants={fadeUp} className="card p-5 text-center">
            <stat.icon className={`w-7 h-7 mx-auto mb-2 ${stat.color}`} />
            <p className="text-2xl font-bold text-dark-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-dark-400 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Two column layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="card p-6">
            <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-gu-600 rounded-full"></span> About
            </h2>
            <p className="text-dark-600 dark:text-dark-300 leading-relaxed">{club.description}</p>
            <div className="mt-6 grid sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-dark-700/50">
                <HiOutlineMail className="w-5 h-5 text-gu-600" />
                <div>
                  <p className="text-[10px] text-dark-400 uppercase">Contact</p>
                  <p className="text-sm text-dark-900 dark:text-white font-medium">{club.name.toLowerCase().replace(/\s+/g, '')}@galgotias.edu.in</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-dark-700/50">
                <HiOutlineGlobeAlt className="w-5 h-5 text-gu-600" />
                <div>
                  <p className="text-[10px] text-dark-400 uppercase">Founded</p>
                  <p className="text-sm text-dark-900 dark:text-white font-medium">Galgotias University</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Upcoming Events */}
          {clubUpcoming.length > 0 && (
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="card p-6">
              <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-emerald-500 rounded-full"></span> Upcoming Events
              </h2>
              <div className="space-y-3">
                {clubUpcoming.map(event => (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors group border border-transparent hover:border-dark-200 dark:hover:border-dark-600"
                  >
                    <img src={event.poster} alt="" className="w-16 h-12 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-dark-900 dark:text-white text-sm group-hover:text-gu-600 dark:group-hover:text-gold-400 transition-colors">{event.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-dark-400 mt-1">
                        <span>📅 {event.date}</span>
                        <span>📍 {event.venue}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 hidden sm:block">
                      <span className="badge-green text-[10px]">{event.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {/* Past Events */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="card p-6">
            <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-amber-500 rounded-full"></span> Past Events
            </h2>
            {pastEvents.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {pastEvents.map(event => (
                  <Link key={event.id} to={`/events/${event.id}`} className="group rounded-xl overflow-hidden border border-dark-200 dark:border-dark-700 hover:border-gu-400 dark:hover:border-gold-400 transition-all">
                    <div className="relative h-32 overflow-hidden">
                      <img src={event.poster} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <span className="badge-blue text-[10px]">{event.status}</span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="font-semibold text-sm text-dark-900 dark:text-white group-hover:text-gu-600 dark:group-hover:text-gold-400 transition-colors">{event.title}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-dark-400 mt-1">
                        <span>📅 {event.date}</span>
                        <span>👥 {event.registrations}/{event.maxCapacity}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-dark-400 text-sm">No past events recorded yet.</p>
            )}
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Application Status (if applied) */}
          {myRegistration && (
            <motion.div variants={fadeUp} initial="hidden" animate="visible">
              <h3 className="font-bold text-sm text-dark-500 dark:text-dark-400 uppercase mb-3 flex items-center gap-1.5">
                📋 My Application Status
              </h3>
              <ClubRegistrationStatusCard registration={myRegistration} />
            </motion.div>
          )}

          {/* Join Card */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="card p-6 border-t-4 border-t-gu-600">
            <h3 className="font-bold text-lg text-dark-900 dark:text-white mb-2">Join {club.name}</h3>
            <p className="text-dark-500 dark:text-dark-400 text-sm mb-4">Be part of an amazing community of {club.members} members.</p>
            {myRegistration ? (
              <div className="text-center">
                <p className="text-xs text-dark-400 mb-2">You've already applied to this club</p>
                <button disabled className="btn-primary w-full !py-3 text-sm font-semibold opacity-50 cursor-not-allowed">
                  ✅ Application Submitted
                </button>
              </div>
            ) : (
              <button onClick={() => setShowJoinModal(true)} className="btn-primary w-full !py-3 text-sm font-semibold">🎉 Join Club</button>
            )}
          </motion.div>

          {/* Quick Stats */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="card p-6">
            <h3 className="font-bold text-dark-900 dark:text-white mb-4">Quick Info</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-dark-400">Category</span>
                <span className="font-medium text-dark-900 dark:text-white">{club.category}</span>
              </div>
              <div className="h-px bg-dark-100 dark:bg-dark-700" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-dark-400">Members</span>
                <span className="font-medium text-dark-900 dark:text-white">{club.members}</span>
              </div>
              <div className="h-px bg-dark-100 dark:bg-dark-700" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-dark-400">Events Hosted</span>
                <span className="font-medium text-dark-900 dark:text-white">{club.events}</span>
              </div>
              <div className="h-px bg-dark-100 dark:bg-dark-700" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-dark-400">Upcoming</span>
                <span className="font-medium text-dark-900 dark:text-white">{clubUpcoming.length} events</span>
              </div>
            </div>
          </motion.div>

          {/* Member Growth (decorative) */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="card p-6">
            <h3 className="font-bold text-dark-900 dark:text-white mb-4">Activity</h3>
            <div className="space-y-3">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May'].map((month, i) => {
                const width = [45, 60, 72, 85, 95][i];
                return (
                  <div key={month} className="flex items-center gap-3">
                    <span className="text-xs text-dark-400 w-8">{month}</span>
                    <div className="flex-1 h-2 bg-dark-100 dark:bg-dark-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${width}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className="h-full bg-gradient-to-r from-gu-500 to-gold-400 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>

    <JoinClubModal club={club} isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} />
    </>
  );
}
