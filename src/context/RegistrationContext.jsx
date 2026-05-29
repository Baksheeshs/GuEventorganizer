import { createContext, useContext, useState, useEffect } from 'react';

import { useAuth } from './AuthContext';

const RegistrationContext = createContext();

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Helper: make authenticated Supabase REST API calls via direct fetch
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

// Generate a unique 8-character alphanumeric code
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function RegistrationProvider({ children }) {
  const { user, isDemo } = useAuth();
  
  // Store an array of registration objects
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);

  // Attendance codes: { [eventId]: [ { studentId, name, email, admissionNo, code, verified, verifiedAt } ] }
  const [attendanceCodes, setAttendanceCodes] = useState({});

  // ── Load registrations + attendance codes from Supabase on mount & when user changes ──
  useEffect(() => {
    if (user && !isDemo) {
      loadRegistrationsFromDB();
      loadAttendanceCodesFromDB();
    }
  }, [user, isDemo]);

  const loadRegistrationsFromDB = async () => {
    setLoadingRegistrations(true);
    try {
      console.log('🔄 Loading registrations from Supabase...');
      const data = await supabaseFetch('registrations?select=*&order=created_at.desc');
      
      if (data && Array.isArray(data)) {
        // Map DB rows to the format our components expect
        const mapped = data.map(row => ({
          reqId: row.id,
          eventId: row.event_id,
          userId: row.user_id,
          name: row.name,
          email: row.email,
          admissionNo: row.admission_no,
          year: row.year,
          course: row.course,
          status: row.status,
        }));
        setRegistrations(mapped);
        console.log(`✅ Loaded ${mapped.length} registrations from Supabase`);
      }
    } catch (err) {
      console.error('🔴 Failed to load registrations:', err);
    }
    setLoadingRegistrations(false);
  };

  // ── Load attendance codes from Supabase so they persist across tab changes ──
  const loadAttendanceCodesFromDB = async () => {
    try {
      console.log('🔄 Loading attendance codes from Supabase...');
      const data = await supabaseFetch('attendance_codes?select=*&order=created_at.desc');
      
      if (data && Array.isArray(data) && data.length > 0) {
        // Group by event_id
        const grouped = {};
        data.forEach(row => {
          const eventId = row.event_id;
          if (!grouped[eventId]) grouped[eventId] = [];
          grouped[eventId].push({
            studentId: row.user_id || row.id,
            name: row.name,
            email: row.email,
            admissionNo: row.admission_no,
            code: row.code,
            verified: row.verified || false,
            verifiedAt: row.verified_at ? new Date(row.verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
          });
        });
        setAttendanceCodes(prev => ({ ...prev, ...grouped }));
        console.log(`✅ Loaded attendance codes for ${Object.keys(grouped).length} events from Supabase`);
      }
    } catch (err) {
      console.error('🔴 Failed to load attendance codes:', err);
    }
  };

  // Submit a new registration request (uses direct fetch)
  const submitRegistrationRequest = async (requestData) => {
    // Optimistic: add to local state immediately
    const tempId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newRequest = {
      ...requestData,
      reqId: tempId,
      status: 'pending'
    };
    setRegistrations(prev => [...prev, newRequest]);

    // Sync to Supabase via direct fetch
    try {
      const isValidUUID = typeof requestData.userId === 'string' && requestData.userId.length > 20;

      const insertData = {
        event_id: requestData.eventId,
        user_id: isValidUUID ? requestData.userId : null,
        name: requestData.name,
        email: requestData.email,
        admission_no: requestData.admissionNo,
        year: requestData.year,
        course: requestData.course,
        status: 'pending',
      };

      console.log('🔄 Saving registration to Supabase...', insertData);

      const result = await supabaseFetch('registrations', {
        method: 'POST',
        body: insertData,
      });

      if (result && result[0]) {
        // Update the local state with the real DB id
        setRegistrations(prev => prev.map(r => 
          r.reqId === tempId ? { ...r, reqId: result[0].id } : r
        ));
        console.log('✅ Registration saved to Supabase! ID:', result[0].id);

        if (isValidUUID) {
          await supabaseFetch('notifications', {
            method: 'POST',
            body: {
              user_id: requestData.userId,
              type: 'event_registration',
              title: 'Registration Submitted',
              message: `Your registration for the event is pending approval.`,
              icon: '📨',
            }
          });
        }
      }
    } catch (err) {
      console.error('🔴 Supabase Registration Error:', err);
    }
  };

  // Organizer Actions
  const approveRegistration = async (reqId) => {
    setRegistrations(prev => prev.map(req =>
      req.reqId === reqId ? { ...req, status: 'approved' } : req
    ));

    try {
      const targetReq = registrations.find(r => r.reqId === reqId);
      await supabaseFetch(`registrations?id=eq.${reqId}`, {
        method: 'PATCH',
        body: { status: 'approved' },
      });
      console.log('✅ Registration approved in Supabase');

      if (targetReq && targetReq.userId && targetReq.userId.length > 20) {
        await supabaseFetch('notifications', {
          method: 'POST',
          body: {
            user_id: targetReq.userId,
            type: 'event_approval',
            title: 'Registration Approved!',
            message: `Your registration for the event has been approved by the organizer.`,
            icon: '✅',
          }
        });
      }
    } catch (err) {
      console.error('🔴 Failed to approve in Supabase:', err);
    }
  };

  const rejectRegistration = async (reqId) => {
    setRegistrations(prev => prev.map(req =>
      req.reqId === reqId ? { ...req, status: 'rejected' } : req
    ));

    try {
      const targetReq = registrations.find(r => r.reqId === reqId);
      await supabaseFetch(`registrations?id=eq.${reqId}`, {
        method: 'PATCH',
        body: { status: 'rejected' },
      });
      console.log('✅ Registration rejected in Supabase');

      if (targetReq && targetReq.userId && targetReq.userId.length > 20) {
        await supabaseFetch('notifications', {
          method: 'POST',
          body: {
            user_id: targetReq.userId,
            type: 'event_rejection',
            title: 'Registration Declined',
            message: `Your registration for the event was not approved.`,
            icon: '❌',
          }
        });
      }
    } catch (err) {
      console.error('🔴 Failed to reject in Supabase:', err);
    }
  };

  // Student Helpers — match by studentId, email, or name (Supabase rows may not have studentId)
  const getRegistrationStatus = (eventId, studentIdOrEmail, userName) => {
    const req = registrations.find(r => 
      r.eventId === eventId && (
        r.studentId === studentIdOrEmail ||
        r.email === studentIdOrEmail ||
        (userName && r.name === userName)
      )
    );
    return req ? req.status : null;
  };

  const cancelRegistration = async (eventId, studentIdOrEmail) => {
    const reg = registrations.find(r => 
      r.eventId === eventId && (
        r.studentId === studentIdOrEmail ||
        r.email === studentIdOrEmail
      )
    );
    setRegistrations(prev => prev.filter(r => 
      !(r.eventId === eventId && (
        r.studentId === studentIdOrEmail ||
        r.email === studentIdOrEmail
      ))
    ));

    if (reg?.reqId) {
      try {
        await supabaseFetch(`registrations?id=eq.${reg.reqId}`, { method: 'DELETE' });
        console.log('✅ Registration cancelled in Supabase');
      } catch (err) {
        console.error('🔴 Failed to cancel in Supabase:', err);
      }
    }
  };

  // Organizer Helpers
  const getPendingRequestsForEvent = (eventId) => {
    return registrations.filter(r => r.eventId === eventId && r.status === 'pending');
  };

  const getApprovedRequestsForEvent = (eventId) => {
    return registrations.filter(r => r.eventId === eventId && r.status === 'approved');
  };

  // ── Attendance Code System ──

  const sendAttendanceCodes = async (eventId) => {
    // Use REAL approved registrations, not mock students
    const approvedRegs = registrations.filter(r => r.eventId === eventId && r.status === 'approved');
    
    const registeredStudents = approvedRegs.map(r => ({
      studentId: r.studentId || r.reqId,
      name: r.name,
      email: r.email,
      admissionNo: r.admissionNo || r.studentId || '',
      code: generateCode(),
      verified: false,
      verifiedAt: null,
    }));

    console.log(`📧 Generating attendance codes for ${registeredStudents.length} approved students for event ${eventId}`);

    setAttendanceCodes(prev => ({
      ...prev,
      [eventId]: registeredStudents,
    }));

    try {
      const dbRows = registeredStudents.map(s => ({
        event_id: eventId,
        name: s.name,
        email: s.email,
        admission_no: s.admissionNo,
        code: s.code,
        verified: false,
      }));
      if (dbRows.length > 0) {
        await supabaseFetch('attendance_codes', {
          method: 'POST',
          body: dbRows,
          headers: { 'Prefer': 'resolution=merge-duplicates' },
        });
      }
    } catch (err) {
      console.error('🔴 Failed to save attendance codes:', err);
    }

    return registeredStudents;
  };

  const getAttendanceCodes = (eventId) => {
    return attendanceCodes[eventId] || [];
  };

  const verifyAttendance = (eventId, code) => {
    const codes = attendanceCodes[eventId];
    if (!codes || codes.length === 0) {
      return { success: false, message: 'No attendance codes have been sent for this event yet.' };
    }

    const entry = codes.find(c => c.code === code);
    if (!entry) {
      return { success: false, message: 'Invalid code. This code does not match any registered student for this event.' };
    }

    if (entry.verified) {
      return { success: false, message: `This code has already been verified for ${entry.name} (${entry.admissionNo}).` };
    }

    const now = new Date();
    const verifiedAt = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAttendanceCodes(prev => ({
      ...prev,
      [eventId]: prev[eventId].map(c =>
        c.code === code ? { ...c, verified: true, verifiedAt } : c
      ),
    }));

    try {
      supabaseFetch(`attendance_codes?event_id=eq.${eventId}&code=eq.${code}`, {
        method: 'PATCH',
        body: { verified: true, verified_at: now.toISOString() },
      });
    } catch { /* ignore */ }

    return {
      success: true,
      student: { name: entry.name, admissionNo: entry.admissionNo, email: entry.email },
    };
  };

  const getVerifiedAttendees = (eventId) => {
    const codes = attendanceCodes[eventId] || [];
    return codes.filter(c => c.verified);
  };

  return (
    <RegistrationContext.Provider value={{
      registrations,
      loadingRegistrations,
      submitRegistrationRequest,
      approveRegistration,
      rejectRegistration,
      getRegistrationStatus,
      cancelRegistration,
      getPendingRequestsForEvent,
      getApprovedRequestsForEvent,
      loadRegistrationsFromDB,
      // Attendance code system
      sendAttendanceCodes,
      getAttendanceCodes,
      verifyAttendance,
      getVerifiedAttendees,
      attendanceCodes,
    }}>
      {children}
    </RegistrationContext.Provider>
  );
}

export const useRegistration = () => useContext(RegistrationContext);
