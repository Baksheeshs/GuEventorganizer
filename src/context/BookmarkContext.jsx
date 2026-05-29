import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const BookmarkContext = createContext();

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function supabaseFetch(path, options = {}) {
  const session = localStorage.getItem('gu_auth_session');
  let token = SUPABASE_ANON_KEY;
  if (session) {
    try { token = JSON.parse(session).access_token || token; } catch {}
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': options.prefer || 'return=representation',
        ...options.headers,
      },
      method: options.method || 'GET',
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || err.details || `HTTP ${response.status}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

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
