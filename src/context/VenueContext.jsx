import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const VenueContext = createContext();

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Helper: make authenticated Supabase REST API calls via direct fetch
async function supabaseFetch(endpoint, options = {}) {
  const session = localStorage.getItem('gu_auth_session');
  let token = SUPABASE_ANON_KEY;
  if (session) {
    try {
      const parsed = JSON.parse(session);
      token = parsed.access_token || token;
    } catch (e) {
      console.warn('Could not parse gu_auth_session', e);
    }
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Supabase error on ${endpoint}:`, res.status, errText);
    throw new Error(`Supabase error ${res.status}: ${errText}`);
  }

  // Handle 204 No Content
  if (res.status === 204) return null;

  return res.json();
}

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
