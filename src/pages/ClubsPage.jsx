import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HiOutlineSearch, HiOutlineUserGroup } from 'react-icons/hi';
import { useClubManagement } from '../context/ClubManagementContext';
import { useAuth } from '../context/AuthContext';
import JoinClubModal from '../components/JoinClubModal';
import ClubRegistrationStatusCard from '../components/ClubRegistrationStatusCard';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

const categoryFilters = ['All', 'Technical', 'Cultural', 'Management', 'Media', 'Literary', 'Social', 'Gaming', 'Knowledge'];

export default function ClubsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [joinClub, setJoinClub] = useState(null);
  const { getAllClubs, getClubRegistrationStatus } = useClubManagement();
  const { user } = useAuth();
  const clubs = getAllClubs();

  const filtered = clubs.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || c.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Clubs & Societies</h1>
        <p className="text-dark-500 dark:text-dark-400 mt-1">Explore {clubs.length} official student-led clubs at Galgotias University</p>
      </motion.div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input placeholder="Search clubs..." value={search} onChange={e => setSearch(e.target.value)} className="input-field !pl-10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categoryFilters.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 text-sm rounded-xl font-medium transition-all ${category === c ? 'bg-gu-600 text-white' : 'bg-white dark:bg-dark-800 text-dark-600 dark:text-dark-300 border border-dark-200 dark:border-dark-600 hover:border-gold-400'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-dark-500 dark:text-dark-400">{filtered.length} clubs found</p>

      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(club => {
          // Check if current user has applied to this club
          const myReg = user?.email ? getClubRegistrationStatus(club.id, user.email) : null;

          return (
            <motion.div key={club.id} variants={fadeUp} whileHover={{ y: -5 }} className="card overflow-hidden group">
              {/* Image header - matching event card style */}
              <div className={`relative h-56 overflow-hidden bg-gradient-to-br ${club.color} flex items-center justify-center`}>
                {club.logo ? (
                  <img src={club.logo} alt={club.name} className="absolute inset-0 w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <span className="text-white/80 font-bold text-4xl group-hover:scale-110 transition-transform duration-500">{club.abbr}</span>
                )}
                <div className="absolute top-3 right-3"><span className="badge-blue">{club.category}</span></div>
                <div className="absolute top-3 left-3">
                  <span className="badge-green">{club.members} members</span>
                </div>
                {/* Application status badge */}
                {myReg && (
                  <div className="absolute bottom-3 left-3">
                    <ClubRegistrationStatusCard registration={myReg} compact />
                  </div>
                )}
              </div>

              {/* Info section */}
              <div className="p-5">
                <h3 className="font-bold text-lg text-dark-900 dark:text-white mb-2 group-hover:text-gu-600 dark:group-hover:text-gold-400 transition-colors">{club.name}</h3>
                <p className="text-dark-500 dark:text-dark-400 text-sm line-clamp-2 mb-3">{club.description}</p>
                <div className="space-y-1.5 text-xs text-dark-400 mb-4">
                  <p><HiOutlineUserGroup className="inline w-4 h-4 mr-1" />{club.members} members</p>
                  <p>📅 {club.events} events organized</p>
                </div>

                {/* Upcoming events */}
                {club.upcomingEvents.length > 0 && (
                  <div className="border-t border-dark-100 dark:border-dark-700 pt-3 mb-4">
                    <p className="text-xs font-semibold text-dark-400 uppercase mb-2">Upcoming Events</p>
                    <div className="space-y-1.5">
                      {club.upcomingEvents.slice(0, 2).map(event => (
                        <Link key={event.id} to={`/events/${event.id}`} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                          <img src={event.poster} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-dark-900 dark:text-white truncate">{event.title}</p>
                            <p className="text-[10px] text-dark-400">{event.date}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Link to={`/clubs/${club.id}`} className="flex-1 text-center py-2 text-sm font-semibold rounded-xl border-2 border-gu-600 text-gu-600 dark:border-gold-400 dark:text-gold-400 hover:bg-gu-600 hover:text-white dark:hover:bg-gold-400 dark:hover:text-dark-900 transition-all">View Club</Link>
                  {myReg ? (
                    <Link to={`/clubs/${club.id}`} className="btn-primary flex-1 !py-2 text-sm opacity-80">
                      {myReg.status === 'audition_selected' ? '🎤 Audition' : myReg.status === 'approved' ? '✅ Member' : '📋 Applied'}
                    </Link>
                  ) : (
                    <button onClick={() => setJoinClub(club)} className="btn-primary flex-1 !py-2 text-sm">Join Club</button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <JoinClubModal club={joinClub} isOpen={!!joinClub} onClose={() => setJoinClub(null)} />
    </div>
  );
}
