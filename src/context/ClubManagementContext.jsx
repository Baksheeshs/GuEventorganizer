import { createContext, useContext, useState, useEffect, useCallback } from 'react';


const ClubManagementContext = createContext();

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Direct fetch helper (bypasses Supabase JS client)
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

// Map Supabase row → the field names pages expect
function mapClubFromDB(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    members: row.members || 0,
    logo: row.logo,
    abbr: row.abbr,
    color: row.color,
    events: row.events_count || 0,
    category: row.category,
    upcomingEvents: [],
  };
}

// Map club registration row from Supabase → frontend shape
function mapClubRegistrationFromDB(row) {
  return {
    id: row.id,
    clubId: row.club_id,
    clubName: row.club_name,
    name: row.name,
    email: row.email,
    regNo: row.reg_no,
    course: row.course,
    year: row.year,
    about: row.about,
    status: row.status,
    appliedAt: row.created_at,
  };
}

export function ClubManagementProvider({ children }) {
  const [managedClubs, setManagedClubs] = useState([]);
  const [supabaseReady, setSupabaseReady] = useState(false);
  const [clubRegistrations, setClubRegistrations] = useState([]);
  const [clubRegDbReady, setClubRegDbReady] = useState(false);

  // Fetch clubs + club registrations from Supabase on mount
  useEffect(() => {
    fetchClubsFromDB();
    loadClubRegistrationsFromDB();
  }, []);

  const fetchClubsFromDB = async () => {
    try {
      console.log('🔄 Fetching clubs from Supabase...');
      const data = await supabaseFetch('clubs?select=*&order=id.asc');

      if (data && data.length > 0) {
        setManagedClubs(data.map(mapClubFromDB));
        setSupabaseReady(true);
        console.log(`✅ Loaded ${data.length} clubs from Supabase`);
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch clubs from Supabase:', err.message);
    }
  };

  // ── Club Registrations (Audition Workflow) — Supabase Only ──

  const loadClubRegistrationsFromDB = async () => {
    try {
      console.log('🔄 Loading club registrations from Supabase...');
      const data = await supabaseFetch('club_registrations?select=*&order=created_at.desc');
      if (data && Array.isArray(data)) {
        setClubRegistrations(data.map(mapClubRegistrationFromDB));
        setClubRegDbReady(true);
        console.log(`✅ Loaded ${data.length} club registrations from Supabase`);
      }
    } catch (err) {
      console.error('🔴 club_registrations table not found in Supabase!', err.message);
      console.error('👉 Run the SQL from supabase/club_registrations.sql in your Supabase Dashboard → SQL Editor');
      setClubRegDbReady(false);
    }
  };

  /** Submit a new club registration — saves directly to Supabase */
  const submitClubRegistration = useCallback(async (data) => {
    const insertData = {
      club_id: data.clubId,
      club_name: data.clubName,
      name: data.name,
      email: data.email,
      reg_no: data.regNo,
      course: data.course,
      year: data.year,
      about: data.about,
      status: 'pending',
    };

    try {
      const result = await supabaseFetch('club_registrations', {
        method: 'POST',
        body: insertData,
      });

      if (result && result[0]) {
        const mapped = mapClubRegistrationFromDB(result[0]);
        setClubRegistrations(prev => [mapped, ...prev]);
        setClubRegDbReady(true);
        console.log('✅ Club registration saved to Supabase:', result[0].id);

        // Fetch user ID to send notification
        try {
          const profile = await supabaseFetch(`profiles?email=eq.${data.email}&select=id`);
          if (profile && profile[0]) {
            await supabaseFetch('notifications', {
              method: 'POST',
              body: {
                user_id: profile[0].id,
                type: 'club_registration',
                title: 'Club Application Submitted',
                message: `Your application to join ${data.clubName} is under review.`,
                icon: '📨',
              }
            });
          }
        } catch (e) {
          console.warn('⚠️ Could not send submit notification:', e.message);
        }

        return mapped;
      }
    } catch (err) {
      console.error('🔴 Failed to save club registration to Supabase:', err.message);
      console.error('👉 Make sure the club_registrations table exists. Run: supabase/club_registrations.sql');
      throw err; // Let the caller know it failed
    }
  }, []);

  /** Get all club registrations for a specific club */
  const getClubRegistrations = useCallback((clubId) => {
    return clubRegistrations.filter(r => r.clubId === clubId);
  }, [clubRegistrations]);

  /** Get all club registrations for a student (by email) */
  const getMyClubRegistrations = useCallback((email) => {
    if (!email) return [];
    return clubRegistrations.filter(r => r.email === email);
  }, [clubRegistrations]);

  /** Get a single club registration status for a student + club */
  const getClubRegistrationStatus = useCallback((clubId, email) => {
    if (!email) return null;
    const reg = clubRegistrations.find(r => r.clubId === clubId && r.email === email);
    return reg || null;
  }, [clubRegistrations]);

  /** Update club registration status (organizer action) — Supabase */
  const updateClubRegistrationStatus = useCallback(async (registrationId, newStatus) => {
    const reg = clubRegistrations.find(r => r.id === registrationId);

    try {
      await supabaseFetch(`club_registrations?id=eq.${registrationId}`, {
        method: 'PATCH',
        body: { status: newStatus },
      });
      console.log(`✅ Club registration ${registrationId} updated to ${newStatus} in Supabase`);

      // Update local state after successful DB update
      setClubRegistrations(prev => prev.map(r =>
        r.id === registrationId ? { ...r, status: newStatus } : r
      ));

      // Insert in-app notification for the student
      if (reg) {
        const notifMessages = {
          audition_selected: { title: '🎤 Selected for Audition!', message: `You've been shortlisted for the audition round at "${reg.clubName}"! Check your email for details.`, icon: '🎤' },
          approved: { title: '✅ Club Membership Approved!', message: `Congratulations! You are now an official member of "${reg.clubName}"!`, icon: '✅' },
          rejected: { title: '❌ Application Update', message: `Your application to "${reg.clubName}" was not selected this time. You can reapply next cycle.`, icon: '❌' },
        };
        const notif = notifMessages[newStatus];
        if (notif) {
          try {
            // Find user id from profile using email
            const profile = await supabaseFetch(`profiles?email=eq.${reg.email}&select=id`);
            if (profile && profile[0]) {
              await supabaseFetch('notifications', {
                method: 'POST',
                body: { 
                  user_id: profile[0].id,
                  type: 'club_registration', 
                  title: notif.title, 
                  message: notif.message, 
                  icon: notif.icon, 
                  read: false 
                },
                prefer: 'return=minimal',
              });
            }
          } catch (notifErr) {
            console.warn('⚠️ Could not insert notification:', notifErr.message);
          }
        }
      }
    } catch (err) {
      console.error('🔴 Failed to update club registration in Supabase:', err.message);
    }
  }, [clubRegistrations]);

  /** Get all club registrations (for organizer management page) */
  const getAllClubRegistrations = useCallback(() => {
    return clubRegistrations;
  }, [clubRegistrations]);

  /** Refresh club registrations from Supabase */
  const refreshClubRegistrations = useCallback(async () => {
    await loadClubRegistrationsFromDB();
  }, []);

  /** Get all clubs */
  const getAllClubs = useCallback(() => managedClubs, [managedClubs]);

  /** Add a new club */
  const addClub = useCallback(async (clubData) => {
    const newClubData = {
      name: clubData.name || 'New Club',
      description: clubData.description || '',
      members: parseInt(clubData.members) || 0,
      logo: clubData.logo || null,
      abbr: clubData.abbr || clubData.name?.substring(0, 2).toUpperCase() || 'NC',
      color: clubData.color || 'from-blue-500 to-cyan-600',
      category: clubData.category || 'General',
    };

    if (supabaseReady) {
      try {
        const result = await supabaseFetch('clubs', {
          method: 'POST',
          body: { ...newClubData, events_count: 0 },
        });
        if (result && result[0]) {
          const mapped = mapClubFromDB(result[0]);
          setManagedClubs(prev => [mapped, ...prev]);
          console.log('✅ Club created in Supabase:', mapped.name);
          return mapped;
        }
      } catch (err) {
        console.error('🔴 Failed to create club:', err);
      }
    }

    // Fallback: local
    const newClub = { ...newClubData, id: Date.now(), events: 0, upcomingEvents: [] };
    setManagedClubs(prev => [newClub, ...prev]);
    return newClub;
  }, [supabaseReady]);

  /** Remove a club by ID */
  const removeClub = useCallback(async (clubId) => {
    setManagedClubs(prev => prev.filter(c => c.id !== clubId));

    if (supabaseReady) {
      try {
        await supabaseFetch(`clubs?id=eq.${clubId}`, { method: 'DELETE' });
      } catch { /* ignore */ }
    }
  }, [supabaseReady]);

  /** Update a club */
  const updateClub = useCallback(async (clubId, updatedFields) => {
    setManagedClubs(prev => prev.map(c =>
      c.id === clubId ? { ...c, ...updatedFields } : c
    ));

    if (supabaseReady) {
      try {
        const dbFields = {};
        if (updatedFields.name !== undefined) dbFields.name = updatedFields.name;
        if (updatedFields.description !== undefined) dbFields.description = updatedFields.description;
        if (updatedFields.members !== undefined) dbFields.members = updatedFields.members;
        if (updatedFields.logo !== undefined) dbFields.logo = updatedFields.logo;
        if (updatedFields.category !== undefined) dbFields.category = updatedFields.category;
        await supabaseFetch(`clubs?id=eq.${clubId}`, { method: 'PATCH', body: dbFields });
      } catch { /* ignore */ }
    }
  }, [supabaseReady]);

  return (
    <ClubManagementContext.Provider value={{
      managedClubs,
      getAllClubs,
      addClub,
      removeClub,
      updateClub,
      // Club Registration (Audition Workflow)
      clubRegistrations,
      clubRegDbReady,
      submitClubRegistration,
      getClubRegistrations,
      getMyClubRegistrations,
      getClubRegistrationStatus,
      updateClubRegistrationStatus,
      getAllClubRegistrations,
      loadClubRegistrationsFromDB,
      refreshClubRegistrations,
    }}>
      {children}
    </ClubManagementContext.Provider>
  );
}

export const useClubManagement = () => useContext(ClubManagementContext);
