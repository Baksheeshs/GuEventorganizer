import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  // Store auth tokens for API calls
  const [authToken, setAuthToken] = useState(null);

  // Demo users — exactly matching the original mock data
  const demoUsers = {
    student: { id: 1, name: 'Aarav Sharma', email: 'aarav.sharma@galgotiasuniversity.edu.in', role: 'student', department: 'B.Tech CSE', year: '3rd Year', avatar: 'AS', enrollmentId: 'GU2023CSE0451' },
    organizer: { id: 2, name: 'Priya Verma', email: 'priya.verma@galgotiasuniversity.edu.in', role: 'organizer', department: 'Student Council', avatar: 'PV', club: 'Technical Society' },
    admin: { id: 3, name: 'Dr. Rajesh Kumar', email: 'admin@galgotiasuniversity.edu.in', role: 'admin', department: 'Administration', avatar: 'RK', designation: 'Dean of Student Affairs' },
  };

  // On mount: check if we have a saved session in localStorage
  useEffect(() => {
    const restoreSession = async () => {
      const savedSession = localStorage.getItem('gu_auth_session');
      if (!savedSession) {
        setLoading(false);
        return;
      }

      try {
        const session = JSON.parse(savedSession);
        if (!session.access_token || !session.user_id) {
          setLoading(false);
          return;
        }

        setAuthToken(session.access_token);

        try {
          // Try fetching profile with current token
          await fetchProfileDirect(session.user_id, session.access_token);
        } catch {
          // Token likely expired — try refreshing
          console.warn('⚠️ Access token expired, attempting refresh...');
          if (session.refresh_token) {
            try {
              const refreshResponse = await fetch(
                `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
                {
                  method: 'POST',
                  headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ refresh_token: session.refresh_token }),
                }
              );

              if (refreshResponse.ok) {
                const result = await refreshResponse.json();
                if (result.access_token) {
                  const newSession = {
                    access_token: result.access_token,
                    refresh_token: result.refresh_token || session.refresh_token,
                    user_id: result.user?.id || session.user_id,
                  };
                  localStorage.setItem('gu_auth_session', JSON.stringify(newSession));
                  setAuthToken(result.access_token);
                  console.log('🔄 Token refreshed successfully on mount');
                  await fetchProfileDirect(newSession.user_id, result.access_token);
                } else {
                  throw new Error('No access_token in refresh response');
                }
              } else {
                throw new Error('Refresh request failed');
              }
            } catch (refreshErr) {
              console.error('🔴 Token refresh failed:', refreshErr);
              localStorage.removeItem('gu_auth_session');
              setAuthToken(null);
            }
          } else {
            // No refresh token available
            localStorage.removeItem('gu_auth_session');
            setAuthToken(null);
          }
        }
      } catch {
        /* ignore parse errors */
        localStorage.removeItem('gu_auth_session');
      }

      setLoading(false);
    };

    restoreSession();
  }, []);

  // Fetch profile using DIRECT fetch (bypasses Supabase JS client completely)
  const fetchProfileDirect = async (userId, token) => {
    console.log('🔄 Fetching profile via direct fetch for:', userId);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      const profiles = await response.json();

      if (profiles && profiles.length > 0) {
        const data = profiles[0];
        console.log('✅ Profile loaded:', data.name, '- Role:', data.role);
        setUser({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          department: data.department,
          year: data.year,
          avatar: data.avatar || data.name?.split(' ').map(w => w[0]).join('').slice(0, 2) || 'U',
          enrollmentId: data.enrollment_id,
          club: data.club,
          designation: data.designation,
        });
        setIsDemo(false);
      } else {
        console.warn('⚠️ No profile found for user. Creating default student profile...');
        
        // Auto-create missing profile
        const newProfile = {
          id: userId,
          email: 'unknown@example.com', // Will be updated eventually
          name: 'New Student',
          role: 'student',
        };
        
        // Insert directly via REST
        await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newProfile),
        });

        setUser({
          ...newProfile,
          avatar: 'N',
          admissionNo: '',
          enrollmentId: '',
          department: '',
          year: '',
        });
        setIsDemo(false);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('🔴 Profile fetch failed:', err);
      throw err;
    }
  };

  // ── Demo login (keeps existing LoginPage working identically) ──
  const login = (role) => {
    setUser(demoUsers[role] || demoUsers.student);
    setIsDemo(true);
  };

  // ── Real Supabase signup using DIRECT FETCH (bypasses proxy hangs) ──
  const signup = async (email, password, metadata = {}) => {
    console.log('🔄 Attempting direct fetch signup for:', email);
    try {
      const response = await fetch(
        `${SUPABASE_URL}/auth/v1/signup`,
        {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            data: metadata
          }),
        }
      );
      
      const result = await response.json();
      if (!response.ok) {
        return { data: null, error: new Error(result.msg || result.message || 'Signup failed') };
      }
      return { data: result, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  // ── Real Supabase login using DIRECT FETCH (bypasses Supabase JS client) ──
  const loginWithEmail = async (email, password) => {
    console.log('🔄 Attempting direct fetch login for:', email);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(
        `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
        {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result?.error_description || result?.msg || result?.message || 'Invalid login credentials';
        console.error('🔴 Login failed:', errorMsg);
        return { data: null, error: new Error(errorMsg) };
      }

      console.log('✅ Login successful! User ID:', result.user?.id);

      // Save session to localStorage (skip supabase.auth.setSession which hangs)
      const sessionData = {
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        user_id: result.user?.id,
      };
      localStorage.setItem('gu_auth_session', JSON.stringify(sessionData));
      setAuthToken(result.access_token);

      // Fetch profile using direct fetch too
      if (result.user?.id) {
        await fetchProfileDirect(result.user.id, result.access_token);
      }

      return { data: result, error: null };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        console.error('🔴 Login request timed out');
        return { data: null, error: new Error('Login timed out. Your network may be slow — please try again.') };
      }
      console.error('🔴 Login exception:', err);
      return { data: null, error: err };
    }
  };

  // ── Logout ──
  const logout = async () => {
    localStorage.removeItem('gu_auth_session');
    setAuthToken(null);
    setUser(null);
    setIsDemo(false);
    // Try to sign out from Supabase in background (don't await)
    supabase.auth.signOut().catch(() => {});
  };

  // ── Update Profile ──
  const updateProfile = async (updates) => {
    if (!user?.id || isDemo) return { error: new Error('Cannot update in demo mode') };

    const session = localStorage.getItem('gu_auth_session');
    let token = SUPABASE_ANON_KEY;
    if (session) {
      try { token = JSON.parse(session).access_token || token; } catch {}
    }

    // Map camelCase → snake_case for DB
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.year !== undefined) dbUpdates.year = updates.year;
    if (updates.department !== undefined) dbUpdates.department = updates.department;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;

    const patchProfile = async (body) => {
      return fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(body),
      });
    };

    try {
      let response = await patchProfile(dbUpdates);

      // If it fails because phone/bio columns don't exist, retry without them
      if (!response.ok) {
        const errText = await response.text();
        if (errText.includes('column') && (errText.includes('bio') || errText.includes('phone'))) {
          console.warn('⚠️ phone/bio columns not found, retrying with core fields only');
          const coreUpdates = { ...dbUpdates };
          delete coreUpdates.phone;
          delete coreUpdates.bio;
          response = await patchProfile(coreUpdates);
          if (!response.ok) {
            const retryErr = await response.text();
            return { error: new Error(retryErr) };
          }
        } else {
          return { error: new Error(errText) };
        }
      }

      // Update local user state
      setUser(prev => ({
        ...prev,
        ...updates,
        avatar: updates.name
          ? updates.name.split(' ').map(w => w[0]).join('').slice(0, 2)
          : prev.avatar,
      }));

      console.log('✅ Profile updated in Supabase');
      return { error: null };
    } catch (err) {
      console.error('🔴 Profile update exception:', err);
      return { error: err };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isDemo,
      authToken,
      login,           // Demo login — keeps existing flow working
      loginWithEmail,   // Real Supabase login
      signup,           // Real Supabase signup
      logout,
      updateProfile,    // Update profile in Supabase
      isLoggedIn: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
