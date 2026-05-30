import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const VenueContext = createContext();

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Helper: make authenticated Supabase REST API calls with automatic JWT refresh
import { supabaseFetch } from '../lib/supabaseFetch';


export function VenueProvider({ children }) {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVenuesFromDB();
  }, []);

  const fetchVenuesFromDB = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching venues from Supabase...');
      const data = await supabaseFetch('venues?select=*&order=name.asc');
      
      if (data && data.length > 0) {
        setVenues(data.map(mapVenueFromDB));
        console.log(`✅ Loaded ${data.length} venues from Supabase`);
      } else {
        console.log('ℹ️ No venues found in Supabase');
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch venues from Supabase:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const mapVenueFromDB = (v) => ({
    id: v.id,
    name: v.name,
    capacity: v.capacity,
    type: v.type,
    status: v.status || 'available',
    image: v.image,
    amenities: v.amenities || [],
    floor: v.floor,
    building: v.building,
    bookedBy: v.booked_by,
    bookedDate: v.booked_date
  });

  return (
    <VenueContext.Provider value={{
      venues,
      loading,
      refreshVenues: fetchVenuesFromDB
    }}>
      {children}
    </VenueContext.Provider>
  );
}

export const useVenues = () => useContext(VenueContext);
