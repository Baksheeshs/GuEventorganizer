import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CertificateContext = createContext();

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const TEMPLATE_TYPES = ['Winner', '1st Runner-up', '2nd Runner-up', 'Participation'];

// Direct fetch helper with automatic JWT refresh
import { supabaseFetch } from '../lib/supabaseFetch';


export function CertificateProvider({ children }) {
  const { user, isDemo } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [declaredEvents, setDeclaredEvents] = useState(new Set());
  const [eventTemplates, setEventTemplates] = useState({});

  // Fetch certificates and templates from Supabase when user logs in
  useEffect(() => {
    if (user && !isDemo) {
      fetchCertificatesFromDB();
      fetchTemplatesFromDB();
    } else {
      setCertificates([]);
    }
  }, [user, isDemo]);

  const fetchCertificatesFromDB = async () => {
    try {
      console.log('🔄 Fetching certificates from Supabase...');
      const data = await supabaseFetch('certificates?select=*&order=created_at.desc');

      if (data && data.length > 0) {
        const mapped = data.map(c => ({
          id: c.id,
          studentId: c.user_id,
          studentName: c.student_name,
          eventName: c.event_name,
          eventId: c.event_id,
          date: c.date,
          type: c.type,
          grade: c.grade,
          templateType: c.template_type,
          templateUrl: c.template_url,
          qrCode: c.qr_code,
        }));
        setCertificates(mapped);

        const declared = new Set(mapped.map(c => c.eventId).filter(Boolean));
        setDeclaredEvents(prev => new Set([...prev, ...declared]));
        console.log(`✅ Loaded ${mapped.length} certificates from Supabase`);
      } else {
        console.log('ℹ️ No certificates found in Supabase');
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch certificates:', err.message);
    }
  };

  // Fetch saved certificate templates from Supabase
  const fetchTemplatesFromDB = async () => {
    try {
      console.log('🔄 Fetching certificate templates from Supabase...');
      const data = await supabaseFetch('certificate_templates?select=*');
      if (data && data.length > 0) {
        const map = {};
        data.forEach(row => {
          if (!map[row.event_id]) map[row.event_id] = {};
          map[row.event_id][row.template_type] = row.template_data;
        });
        setEventTemplates(prev => ({ ...prev, ...map }));
        console.log(`✅ Loaded templates for ${Object.keys(map).length} events from Supabase`);
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch certificate templates:', err.message);
    }
  };

  /** Upload certificate templates for an event — saves to state + Supabase */
  const uploadTemplates = (eventId, templates) => {
    // Update local state immediately
    setEventTemplates(prev => ({ ...prev, [eventId]: { ...(prev[eventId] || {}), ...templates } }));

    // Persist each template to Supabase in background
    Object.entries(templates).forEach(async ([type, data]) => {
      try {
        await supabaseFetch('certificate_templates', {
          method: 'POST',
          body: { event_id: eventId, template_type: type, template_data: data },
          headers: { 'Prefer': 'resolution=merge-duplicates' },
        });
        console.log(`✅ Template "${type}" saved to Supabase for event ${eventId}`);
      } catch (err) {
        console.warn(`⚠️ Could not save template "${type}":`, err.message);
      }
    });
  };

  /** Get templates for a specific event */
  const getTemplates = (eventId) => eventTemplates[eventId] || {};

  /** Check if all 4 templates are uploaded for an event */
  const hasAllTemplates = (eventId) => {
    const t = eventTemplates[eventId];
    if (!t) return false;
    return TEMPLATE_TYPES.every(type => !!t[type]);
  };

  /** Map result type to template type */
  const getTemplateType = (resultType) => {
    if (resultType === 'Winner') return 'Winner';
    if (resultType === 'Runner-up') return '1st Runner-up';
    if (resultType === '3rd Place') return '2nd Runner-up';
    return 'Participation';
  };

  const issueCertificates = async (eventId, eventName, eventDate, results) => {
    const templates = eventTemplates[eventId] || {};

    // ── Step 1: Resolve missing user_ids by looking up profiles by email ──
    const emailsToLookup = results
      .filter(r => !r.studentId && r.studentEmail)
      .map(r => r.studentEmail);

    let emailToUserId = {};
    if (emailsToLookup.length > 0) {
      try {
        const uniqueEmails = [...new Set(emailsToLookup)];
        const emailFilter = uniqueEmails.map(e => `"${e}"`).join(',');
        const profiles = await supabaseFetch(`profiles?email=in.(${emailFilter})&select=id,email`);
        if (profiles && Array.isArray(profiles)) {
          profiles.forEach(p => { emailToUserId[p.email] = p.id; });
        }
        console.log(`🔍 Resolved ${Object.keys(emailToUserId).length} user IDs from ${uniqueEmails.length} emails`);
      } catch (err) {
        console.warn('⚠️ Could not resolve user IDs from profiles:', err.message);
      }
    }

    // ── Step 2: Build certificate objects with resolved user_ids ──
    const newCerts = results.map((r, i) => {
      const templateType = getTemplateType(r.type);
      const uniqueSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const resolvedUserId = r.studentId || emailToUserId[r.studentEmail] || null;
      return {
        id: Date.now() + i,
        studentId: resolvedUserId,
        studentName: r.studentName,
        eventName,
        eventId,
        date: eventDate,
        type: r.type,
        grade: r.grade,
        templateType,
        templateUrl: templates[templateType] || null,
        qrCode: `GU-CERT-${new Date().getFullYear()}-${uniqueSuffix}`,
      };
    });

    setCertificates(prev => [...prev, ...newCerts]);
    setDeclaredEvents(prev => new Set([...prev, eventId]));

    // ── Step 3: Save to Supabase ──
    const dbRows = newCerts.map(c => ({
      event_id: c.eventId,
      user_id: c.studentId, // Already a valid UUID or null
      student_name: c.studentName,
      event_name: c.eventName,
      date: c.date,
      type: c.type,
      grade: c.grade,
      template_type: c.templateType,
      template_url: c.templateUrl,
      qr_code: c.qrCode,
    }));
    await supabaseFetch('certificates', { method: 'POST', body: dbRows });
    console.log('✅ Certificates saved to Supabase');
  };

  const isEventDeclared = (eventId) => {
    return declaredEvents.has(eventId) || certificates.some(c => c.eventId === eventId);
  };

  const getCertificatesForStudent = (studentName) => {
    return certificates.filter(c => c.studentName === studentName);
  };

  const getCertificatesByUserId = (userId, userName) => {
    return certificates.filter(c => c.studentId === userId || (c.studentName === userName && userName));
  };

  return (
    <CertificateContext.Provider value={{
      certificates,
      issueCertificates,
      isEventDeclared,
      getCertificatesForStudent,
      getCertificatesByUserId,
      uploadTemplates,
      getTemplates,
      hasAllTemplates,
      TEMPLATE_TYPES,
    }}>
      {children}
    </CertificateContext.Provider>
  );
}

export const useCertificates = () => useContext(CertificateContext);
