import { useState } from 'react';
import { motion } from 'framer-motion';
import { useVenues } from '../context/VenueContext';
import { HiOutlineLocationMarker, HiOutlineUsers, HiOutlineCalendar, HiOutlineWifi, HiOutlineDesktopComputer } from 'react-icons/hi';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

const statusColors = { available: 'badge-green', booked: 'badge-red', maintenance: 'badge-yellow' };

export default function VenuesPage() {
  const { venues, loading } = useVenues();
  const [selectedType, setSelectedType] = useState('All');
  
  const filteredVenues = selectedType === 'All' 
    ? venues 
    : venues.filter(v => v.type === selectedType);

  return (
    <div className="space-y-6">
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Venue Management</h1>
          <p className="text-dark-500 dark:text-dark-400 mt-1">Book and manage campus venues for events</p>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="badge-green">Available</span>
          <span className="badge-red">Booked</span>
          <span className="badge-yellow">Maintenance</span>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gu-600"></div>
        </div>
      ) : filteredVenues.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 dark:bg-dark-800 rounded-3xl border border-dashed border-dark-200 dark:border-dark-700">
          <h3 className="text-xl font-bold text-dark-900 dark:text-white">No venues found</h3>
          <p className="text-dark-500 mt-2">Try adjusting your filters.</p>
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredVenues.map(venue => (
          <motion.div key={venue.id} variants={fadeUp} whileHover={{ y: -5 }} className="card overflow-hidden group">
            <div className="relative h-48 overflow-hidden">
              <img src={venue.image} alt={venue.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute top-3 right-3">
                <span className={statusColors[venue.status]}>{venue.status}</span>
              </div>
              <div className="absolute bottom-3 left-3">
                <span className="badge bg-black/50 text-white backdrop-blur-sm">{venue.type}</span>
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-bold text-lg text-dark-900 dark:text-white mb-2">{venue.name}</h3>
              <div className="space-y-2 text-sm text-dark-500 dark:text-dark-400 mb-4">
                <p className="flex items-center gap-2"><HiOutlineUsers className="w-4 h-4" /> Capacity: {venue.capacity}</p>
                <p className="flex items-center gap-2"><HiOutlineLocationMarker className="w-4 h-4" /> {venue.floor}, {venue.building}</p>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {venue.amenities.map(a => (
                  <span key={a} className="px-2 py-1 bg-gray-100 dark:bg-dark-700 text-dark-500 dark:text-dark-400 text-xs rounded-lg">{a}</span>
                ))}
              </div>
              {venue.bookedBy && (
                <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-xl mb-3 text-sm">
                  <p className="text-red-600 dark:text-red-400 font-medium">Booked: {venue.bookedBy}</p>
                  <p className="text-red-400 text-xs">{venue.bookedDate}</p>
                </div>
              )}
              <button className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${venue.status === 'available' ? 'btn-primary' : 'bg-dark-100 dark:bg-dark-700 text-dark-400 cursor-not-allowed'}`}
                disabled={venue.status !== 'available'}>
                {venue.status === 'available' ? 'Book Venue' : venue.status === 'booked' ? 'Currently Booked' : 'Under Maintenance'}
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>
      )}
    </div>
  );
}
