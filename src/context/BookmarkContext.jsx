import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const BookmarkContext = createContext();

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

import { supabaseFetch } from '../lib/supabaseFetch';


export function BookmarkProvider({ children }) {
  const { user, isDemo } = useAuth();
  const [bookmarks, setBookmarks] = useState([]); // Array of event_id
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !isDemo && user.id) {
      loadBookmarks();
    } else {
      setBookmarks([]);
    }
  }, [user, isDemo]);

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      const data = await supabaseFetch(`bookmarks?user_id=eq.${user.id}&select=event_id`);
      if (data && Array.isArray(data)) {
        setBookmarks(data.map(b => b.event_id));
      }
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    }
    setLoading(false);
  };

  const toggleBookmark = async (eventId) => {
    if (!user || !user.id || isDemo) return;

    const isBookmarked = bookmarks.includes(eventId);
    
    // Optimistic UI update
    if (isBookmarked) {
      setBookmarks(prev => prev.filter(id => id !== eventId));
    } else {
      setBookmarks(prev => [...prev, eventId]);
    }

    try {
      if (isBookmarked) {
        await supabaseFetch(`bookmarks?user_id=eq.${user.id}&event_id=eq.${eventId}`, {
          method: 'DELETE'
        });
      } else {
        await supabaseFetch('bookmarks', {
          method: 'POST',
          body: { user_id: user.id, event_id: eventId }
        });
      }
    } catch (err) {
      console.error('Failed to toggle bookmark in Supabase:', err);
      // Revert on failure
      loadBookmarks();
    }
  };

  const isBookmarked = (eventId) => bookmarks.includes(eventId);

  return (
    <BookmarkContext.Provider value={{ bookmarks, loading, toggleBookmark, isBookmarked }}>
      {children}
    </BookmarkContext.Provider>
  );
}

export const useBookmarks = () => useContext(BookmarkContext);
