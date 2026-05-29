import { createContext, useContext, useState, useEffect } from 'react';

const FeedbackContext = createContext();

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Direct fetch helper
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
      throw new Error(err.message || `HTTP ${response.status}`);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export function FeedbackProvider({ children }) {
  // Track which events have feedback enabled (organizer controls this)
  const [enabledEvents, setEnabledEvents] = useState({});

  // Store submitted feedback — starts empty, populated from Supabase
  const [feedbacks, setFeedbacks] = useState({});

  // Fetch feedback settings + data from Supabase on mount
  useEffect(() => {
    fetchFeedbackData();
  }, []);

  const fetchFeedbackData = async () => {
    try {
      // Fetch feedback settings
      const settings = await supabaseFetch('feedback_settings?select=*');

      if (settings && settings.length > 0) {
        const settingsMap = {};
        settings.forEach(s => { settingsMap[s.event_id] = s.enabled; });
        setEnabledEvents(prev => ({ ...prev, ...settingsMap }));
      }

      // Fetch existing feedback entries
      const fbData = await supabaseFetch('feedback?select=*&order=submitted_at.desc');

      if (fbData && fbData.length > 0) {
        const grouped = {};
        fbData.forEach(fb => {
          const eid = fb.event_id;
          if (!grouped[eid]) grouped[eid] = [];
          grouped[eid].push({
            studentId: fb.student_id,
            name: fb.name,
            venueRating: fb.venue_rating,
            facilitatorRating: fb.facilitator_rating,
            eventRating: fb.event_rating,
            experience: fb.experience,
            submittedAt: fb.submitted_at,
          });
        });
        setFeedbacks(prev => ({ ...prev, ...grouped }));
      }
      console.log('✅ Feedback data loaded from Supabase');
    } catch (err) {
      console.warn('⚠️ Could not fetch feedback:', err.message);
    }
  };

  const isFeedbackEnabled = (eventId) => !!enabledEvents[eventId];

  const toggleFeedback = async (eventId) => {
    const newValue = !enabledEvents[eventId];
    setEnabledEvents(prev => ({ ...prev, [eventId]: newValue }));

    try {
      await supabaseFetch('feedback_settings', {
        method: 'POST',
        body: { event_id: eventId, enabled: newValue },
        headers: { 'Prefer': 'resolution=merge-duplicates' },
      });
    } catch { /* ignore */ }
  };

  const submitFeedback = async (eventId, feedback) => {
    const entry = { ...feedback, submittedAt: new Date().toISOString().split('T')[0] };
    setFeedbacks(prev => ({
      ...prev,
      [eventId]: [...(prev[eventId] || []), entry],
    }));

    try {
      await supabaseFetch('feedback', {
        method: 'POST',
        body: {
          event_id: eventId,
          student_id: feedback.studentId,
          name: feedback.name,
          venue_rating: feedback.venueRating,
          facilitator_rating: feedback.facilitatorRating,
          event_rating: feedback.eventRating,
          experience: feedback.experience,
        },
      });
      console.log('✅ Feedback saved to Supabase');
    } catch (err) {
      console.error('🔴 Failed to save feedback:', err);
    }
  };

  const getEventFeedback = (eventId) => feedbacks[eventId] || [];

  const hasUserSubmitted = (eventId, studentId) => {
    return (feedbacks[eventId] || []).some(f => f.studentId === studentId);
  };

  const getAverageRatings = (eventId) => {
    const fb = feedbacks[eventId] || [];
    if (fb.length === 0) return null;
    const avg = (key) => (fb.reduce((s, f) => s + f[key], 0) / fb.length).toFixed(1);
    return {
      venue: avg('venueRating'),
      facilitator: avg('facilitatorRating'),
      event: avg('eventRating'),
      overall: ((parseFloat(avg('venueRating')) + parseFloat(avg('facilitatorRating')) + parseFloat(avg('eventRating'))) / 3).toFixed(1),
      count: fb.length,
    };
  };

  return (
    <FeedbackContext.Provider value={{ isFeedbackEnabled, toggleFeedback, submitFeedback, getEventFeedback, hasUserSubmitted, getAverageRatings }}>
      {children}
    </FeedbackContext.Provider>
  );
}

export const useFeedback = () => useContext(FeedbackContext);
