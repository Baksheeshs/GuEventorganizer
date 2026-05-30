import { createContext, useContext, useState, useEffect, useCallback } from 'react';


const EventManagementContext = createContext();

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Direct fetch helper with automatic JWT refresh (shared utility)
import { supabaseFetch } from '../lib/supabaseFetch';


/**
 * Event approval statuses:
 * - 'pending'  → Organizer created, waiting for Admin approval
 * - 'approved' → Admin approved, visible to students
 * - 'rejected' → Admin rejected, not visible to students
 */

// Map Supabase snake_case row → camelCase fields that pages expect
function mapEventFromDB(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    venue: row.venue,
    date: row.date,
    endDate: row.end_date,
    time: row.time,
    organizer: row.organizer,
    department: row.department,
    registrations: row.registrations || 0,
    maxCapacity: row.max_capacity || 100,
    status: row.status || 'upcoming',
    approvalStatus: row.approval_status || 'approved',
    featured: row.featured || false,
    poster: row.poster,
    gallery: row.gallery || [],
    tags: row.tags || [],
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

// Map a Supabase event_details row → camelCase object
function mapDetailsFromDB(row) {
  return {
    longDescription: row.long_description || '',
    eligibility: row.eligibility || '',
    schedule: row.schedule || [],
    prizes: row.prizes || [],
    rules: row.rules || [],
    coordinator: (row.coordinator_name) ? {
      name: row.coordinator_name,
      phone: row.coordinator_phone || '',
      email: row.coordinator_email || '',
    } : null,
    whatsappGroup: row.whatsapp_group || '',
  };
}

// Map camelCase fields → snake_case for DB writes
function mapEventToDB(data) {
  const mapped = {};
  if (data.title !== undefined) mapped.title = data.title;
  if (data.description !== undefined) mapped.description = data.description;
  if (data.category !== undefined) mapped.category = data.category;
  if (data.venue !== undefined) mapped.venue = data.venue;
  if (data.date !== undefined) mapped.date = data.date;
  if (data.endDate !== undefined) mapped.end_date = data.endDate;
  if (data.time !== undefined) mapped.time = data.time;
  if (data.organizer !== undefined) mapped.organizer = data.organizer;
  if (data.department !== undefined) mapped.department = data.department;
  if (data.registrations !== undefined) mapped.registrations = data.registrations;
  if (data.maxCapacity !== undefined) mapped.max_capacity = parseInt(data.maxCapacity);
  if (data.status !== undefined) mapped.status = data.status;
  if (data.approvalStatus !== undefined) mapped.approval_status = data.approvalStatus;
  if (data.featured !== undefined) mapped.featured = data.featured;
  if (data.poster !== undefined) mapped.poster = data.poster;
  if (data.gallery !== undefined) mapped.gallery = data.gallery;
  if (data.tags !== undefined) mapped.tags = data.tags;
  mapped.updated_at = new Date().toISOString();
  return mapped;
}

export function EventManagementProvider({ children }) {
  const [managedEvents, setManagedEvents] = useState([]);
  const [supabaseReady, setSupabaseReady] = useState(false);

  // Event details map: { [eventId]: { longDescription, schedule, prizes, ... } }
  const [eventDetailsMap, setEventDetailsMap] = useState({});

  // Notification log for event changes (visible to students)
  const [eventNotifications, setEventNotifications] = useState([]);

  // Track deleted event IDs for confirmation flow
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch events + event details from Supabase on mount
  useEffect(() => {
    fetchEventsFromDB();
    fetchEventDetailsFromDB();
  }, []);

  const fetchEventsFromDB = async () => {
    try {
      console.log('🔄 Fetching events from Supabase...');
      const data = await supabaseFetch('events?select=*&order=created_at.desc');

      if (data && data.length > 0) {
        setManagedEvents(data.map(mapEventFromDB));
        setSupabaseReady(true);
        console.log(`✅ Loaded ${data.length} events from Supabase`);
      } else {
        console.log('ℹ️ No events in Supabase, using mock data');
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch events from Supabase, using mock data:', err.message);
    }
  };

  // Fetch all event_details rows and build a lookup map
  const fetchEventDetailsFromDB = async () => {
    try {
      console.log('🔄 Fetching event details from Supabase...');
      const data = await supabaseFetch('event_details?select=*');
      if (data && data.length > 0) {
        const map = {};
        data.forEach(row => {
          map[row.event_id] = mapDetailsFromDB(row);
        });
        setEventDetailsMap(map);
        console.log(`✅ Loaded details for ${data.length} events from Supabase`);
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch event details:', err.message);
    }
  };

  /** Get details for a specific event (schedule, prizes, rules, coordinator) */
  const getEventDetails = useCallback((eventId) => {
    return eventDetailsMap[eventId] || {};
  }, [eventDetailsMap]);

  /** Save event details to Supabase (used after creating an event) */
  const saveEventDetails = useCallback(async (eventId, detailsData) => {
    if (!eventId || !detailsData) return;
    const dbRow = {
      event_id: eventId,
      long_description: detailsData.longDescription || null,
      eligibility: detailsData.eligibility || null,
      schedule: detailsData.schedule || null,
      prizes: detailsData.prizes || null,
      rules: detailsData.rules || null,
      coordinator_name: detailsData.coordinator?.name || null,
      coordinator_phone: detailsData.coordinator?.phone || null,
      coordinator_email: detailsData.coordinator?.email || null,
      whatsapp_group: detailsData.whatsappGroup || null,
    };
    try {
      await supabaseFetch('event_details', {
        method: 'POST',
        body: dbRow,
        headers: { 'Prefer': 'resolution=merge-duplicates' },
      });
      // Update local map
      setEventDetailsMap(prev => ({ ...prev, [eventId]: detailsData }));
      console.log('✅ Event details saved to Supabase for event', eventId);
    } catch (err) {
      console.error('🔴 Failed to save event details:', err);
    }
  }, []);

  // ─── Organizer Actions ─────────────────────────────────────────

  /** Create a new event (status = pending until admin approves) */
  const createEvent = useCallback(async (eventData, organizerName) => {
    // Normalize tags
    let tags = eventData.tags || [];
    if (typeof tags === 'string') {
      tags = tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    // Get the current user's ID from session for RLS
    let currentUserId = null;
    try {
      const session = localStorage.getItem('gu_auth_session');
      if (session) currentUserId = JSON.parse(session).user_id;
    } catch {}

    const newEvent = {
      title: eventData.title || 'Untitled Event',
      description: eventData.description || 'No description provided.',
      category: eventData.category || 'Technical',
      venue: eventData.venue || 'TBA',
      date: eventData.date || new Date().toISOString().split('T')[0],
      endDate: eventData.endDate || eventData.date || '',
      time: eventData.time || 'TBA',
      department: eventData.department || 'All Departments',
      tags,
      organizer: eventData.organizer || organizerName || 'Unknown Organizer',
      registrations: 0,
      maxCapacity: parseInt(eventData.maxCapacity) || 200,
      status: 'upcoming',
      approvalStatus: 'pending',
      featured: false,
      poster: eventData.poster || '/gu-campus.png',
      createdBy: currentUserId,
    };

    // Try saving to Supabase via direct fetch
    if (supabaseReady) {
      try {
        const dbData = mapEventToDB(newEvent);
        const result = await supabaseFetch('events', {
          method: 'POST',
          body: dbData,
        });

        if (result && result[0]) {
          const mapped = mapEventFromDB(result[0]);
          setManagedEvents(prev => [mapped, ...prev]);
          console.log('✅ Event created in Supabase:', mapped.title);
          return mapped;
        }
      } catch (err) {
        console.error('🔴 Failed to create event in Supabase:', err);
      }
    }

    // Fallback: local only
    const localEvent = {
      ...newEvent,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      registeredStudents: [],
    };
    setManagedEvents(prev => [localEvent, ...prev]);
    return localEvent;
  }, [supabaseReady]);

  /** Update an existing event (generates notification for registered students) */
  const updateEvent = useCallback(async (eventId, updatedFields) => {
    let changedEvent = null;
    let changes = [];

    setManagedEvents(prev => prev.map(e => {
      if (e.id === eventId) {
        Object.keys(updatedFields).forEach(key => {
          if (e[key] !== undefined && e[key] !== updatedFields[key] && updatedFields[key]) {
            changes.push({ field: key, from: e[key], to: updatedFields[key] });
          }
        });
        changedEvent = { ...e, ...updatedFields };
        return changedEvent;
      }
      return e;
    }));

    // Sync to Supabase via direct fetch
    if (supabaseReady) {
      try {
        await supabaseFetch(`events?id=eq.${eventId}`, {
          method: 'PATCH',
          body: mapEventToDB(updatedFields),
        });
        console.log('✅ Event updated in Supabase');
      } catch (err) {
        console.error('🔴 Failed to update event in Supabase:', err);
      }
    }

    // Generate notification if there were meaningful changes
    if (changes.length > 0 && changedEvent) {
      const changeDescriptions = changes.map(c => {
        const fieldLabels = { date: 'Date', time: 'Time', venue: 'Venue', title: 'Title', description: 'Description', maxCapacity: 'Capacity' };
        return `${fieldLabels[c.field] || c.field}: ${c.from} → ${c.to}`;
      });

      const notification = {
        id: `notif-${Date.now()}`,
        type: 'event_update',
        eventId,
        eventTitle: changedEvent.title,
        message: `Event "${changedEvent.title}" has been updated`,
        changes: changeDescriptions,
        timestamp: new Date().toISOString(),
        read: false,
      };
      setEventNotifications(prev => [notification, ...prev]);
    }

    return { changedEvent, changes };
  }, [supabaseReady]);

  /** Request to delete/cancel an event — sets confirmation state */
  const requestDeleteEvent = useCallback((eventId) => {
    const event = managedEvents.find(e => e.id === eventId);
    if (event) {
      setDeleteConfirm({ eventId, title: event.title });
    }
  }, [managedEvents]);

  /** Confirm deletion of event */
  const confirmDeleteEvent = useCallback(async () => {
    if (!deleteConfirm) return;
    const { eventId, title } = deleteConfirm;

    // Generate cancellation notification
    const notification = {
      id: `notif-${Date.now()}`,
      type: 'event_cancelled',
      eventId,
      eventTitle: title,
      message: `Event "${title}" has been cancelled by the organizer`,
      changes: [],
      timestamp: new Date().toISOString(),
      read: false,
    };
    setEventNotifications(prev => [notification, ...prev]);

    setManagedEvents(prev => prev.filter(e => e.id !== eventId));
    setDeleteConfirm(null);

    // Sync to Supabase via direct fetch
    if (supabaseReady) {
      try {
        await supabaseFetch(`events?id=eq.${eventId}`, { method: 'DELETE' });
        console.log('✅ Event deleted from Supabase');
      } catch (err) {
        console.error('🔴 Failed to delete event from Supabase:', err);
      }
    }

    return true;
  }, [deleteConfirm, supabaseReady]);

  /** Cancel deletion */
  const cancelDelete = useCallback(() => {
    setDeleteConfirm(null);
  }, []);

  // ─── Admin Actions ─────────────────────────────────────────────

  /** Approve an event (makes it visible to students) */
  const approveEvent = useCallback(async (eventId) => {
    setManagedEvents(prev => prev.map(e =>
      e.id === eventId ? { ...e, approvalStatus: 'approved' } : e
    ));

    const event = managedEvents.find(e => e.id === eventId);
    if (event) {
      const notification = {
        id: `notif-${Date.now()}`,
        type: 'event_approved',
        eventId,
        eventTitle: event.title,
        message: `New event "${event.title}" is now live!`,
        changes: [],
        timestamp: new Date().toISOString(),
        read: false,
      };
      setEventNotifications(prev => [notification, ...prev]);
    }

    // Sync to Supabase via direct fetch
    if (supabaseReady) {
      try {
        await supabaseFetch(`events?id=eq.${eventId}`, {
          method: 'PATCH',
          body: { approval_status: 'approved' },
        });
        console.log('✅ Event approved in Supabase');
      } catch (err) {
        console.error('🔴 Failed to approve event in Supabase:', err);
      }
    }
  }, [managedEvents, supabaseReady]);

  /** Reject an event */
  const rejectEvent = useCallback(async (eventId) => {
    setManagedEvents(prev => prev.map(e =>
      e.id === eventId ? { ...e, approvalStatus: 'rejected' } : e
    ));

    // Sync to Supabase via direct fetch
    if (supabaseReady) {
      try {
        await supabaseFetch(`events?id=eq.${eventId}`, {
          method: 'PATCH',
          body: { approval_status: 'rejected' },
        });
        console.log('✅ Event rejected in Supabase');
      } catch (err) {
        console.error('🔴 Failed to reject event in Supabase:', err);
      }
    }
  }, [supabaseReady]);

  // ─── Getters ───────────────────────────────────────────────────

  /** All events (for admin) */
  const getAllEvents = useCallback(() => managedEvents, [managedEvents]);

  /** Only approved events (for students/events page) */
  const getApprovedEvents = useCallback(() =>
    managedEvents.filter(e => e.approvalStatus === 'approved'),
    [managedEvents]
  );

  /** Pending events (for admin approval queue) */
  const getPendingEvents = useCallback(() =>
    managedEvents.filter(e => e.approvalStatus === 'pending'),
    [managedEvents]
  );

  /** Organizer's events (all statuses) */
  const getOrganizerEvents = useCallback((organizerName) => {
    if (!organizerName) return managedEvents;
    return managedEvents;
  }, [managedEvents]);

  /** Get a single event by ID */
  const getEventById = useCallback((id) =>
    managedEvents.find(e => e.id === parseInt(id) || e.id === id),
    [managedEvents]
  );

  /** Get unread notifications */
  const getUnreadNotifications = useCallback(() =>
    eventNotifications.filter(n => !n.read),
    [eventNotifications]
  );

  /** Mark notification as read */
  const markNotificationRead = useCallback((notifId) => {
    setEventNotifications(prev => prev.map(n =>
      n.id === notifId ? { ...n, read: true } : n
    ));
  }, []);

  return (
    <EventManagementContext.Provider value={{
      // Events
      managedEvents,
      getAllEvents,
      getApprovedEvents,
      getPendingEvents,
      getOrganizerEvents,
      getEventById,

      // Event Details (schedule, prizes, rules, coordinator)
      getEventDetails,
      saveEventDetails,

      // Organizer Actions
      createEvent,
      updateEvent,
      requestDeleteEvent,
      confirmDeleteEvent,
      cancelDelete,
      deleteConfirm,

      // Admin Actions
      approveEvent,
      rejectEvent,

      // Notifications
      eventNotifications,
      getUnreadNotifications,
      markNotificationRead,
    }}>
      {children}
    </EventManagementContext.Provider>
  );
}

export const useEventManagement = () => useContext(EventManagementContext);
