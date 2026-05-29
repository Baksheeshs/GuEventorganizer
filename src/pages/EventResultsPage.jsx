import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineStar, HiOutlineAcademicCap, HiOutlineCheck, HiOutlineUserGroup, HiOutlineClipboardCheck, HiOutlineChevronDown, HiOutlineSparkles, HiOutlineSearch, HiOutlinePhotograph, HiOutlineUpload } from 'react-icons/hi';
import { useCertificates } from '../context/CertificateContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useEventManagement } from '../context/EventManagementContext';
import { useRegistration } from '../context/RegistrationContext';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.05 } } };

const resultOptions = [
  { value: '', label: 'Not Assigned', grade: null },
  { value: 'Winner', label: '🥇 Winner (1st Place)', grade: 'Platinum' },
  { value: 'Runner-up', label: '🥈 1st Runner-up (2nd Place)', grade: 'Gold' },
  { value: '3rd Place', label: '🥉 2nd Runner-up (3rd Place)', grade: 'Gold' },
  { value: 'Participation', label: '👥 Participant', grade: 'Silver' },
  { value: 'Completion', label: '✅ Completed', grade: 'Silver' },
];

export default function EventResultsPage() {
  const { getAllEvents } = useEventManagement();
  const events = getAllEvents();
  const completedEvents = useMemo(() => events.filter(e => e.status === 'completed'), [events]);
  const [selectedEventId, setSelectedEventId] = useState(completedEvents[0]?.id || null);
  const [results, setResults] = useState({});
  const [issued, setIssued] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { issueCertificates, isEventDeclared, uploadTemplates, getTemplates, hasAllTemplates, TEMPLATE_TYPES } = useCertificates();
  const { user } = useAuth();
  const { getApprovedRequestsForEvent } = useRegistration();
  const isOrganizer = user?.role === 'organizer' || user?.role === 'admin';
  const { addToast } = useToast();
  const fileInputRefs = useRef({});

  const selectedEvent = completedEvents.find(e => e.id === selectedEventId);
  const eventStudents = useMemo(() => {
    if (!selectedEvent) return [];
    // Get real registered students who are approved
    const approved = getApprovedRequestsForEvent(selectedEvent.id);
    return approved.map(req => ({
      id: req.reqId || Math.random().toString(), // Used as React key and unique ID for UI
      userId: req.userId || null, // The actual user ID from profiles, if available
      email: req.email || null, // Email for looking up user_id from profiles
      name: req.name,
      enrollment: req.admissionNo || 'N/A',
      department: req.course || 'N/A',
      avatar: req.name.substring(0, 2).toUpperCase()
    }));
  }, [selectedEvent, getApprovedRequestsForEvent]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return eventStudents;
    const q = searchQuery.toLowerCase();
    return eventStudents.filter(s => s.name.toLowerCase().includes(q) || s.enrollment.toLowerCase().includes(q));
  }, [eventStudents, searchQuery]);

  const alreadyDeclared = selectedEvent ? isEventDeclared(selectedEvent.id) : false;
  const currentTemplates = selectedEvent ? getTemplates(selectedEvent.id) : {};
  const templatesReady = selectedEvent ? hasAllTemplates(selectedEvent.id) : false;

  const eventResults = results[selectedEventId] || {};
  const assignedCount = Object.values(eventResults).filter(r => r).length;
  const allAssigned = assignedCount === eventStudents.length && eventStudents.length > 0;

  const setStudentResult = (studentId, value) => {
    const prizeTypes = ['Winner', 'Runner-up', '3rd Place'];
    setResults(prev => {
      const current = { ...(prev[selectedEventId] || {}), [studentId]: value };
      // Auto-fill unassigned students with Participation when a prize is assigned
      if (prizeTypes.includes(value)) {
        eventStudents.forEach(s => {
          if (!current[s.id]) current[s.id] = 'Participation';
        });
      }
      return { ...prev, [selectedEventId]: current };
    });
  };

  const markAllAsParticipant = () => {
    const bulk = {};
    eventStudents.forEach(s => { bulk[s.id] = 'Participation'; });
    setResults(prev => ({ ...prev, [selectedEventId]: { ...(prev[selectedEventId] || {}), ...bulk } }));
  };

  const handleTemplateUpload = (type, file) => {
    if (!file || !selectedEvent) return;
    // Validate: only images, max 5MB
    if (!file.type.startsWith('image/')) {
      addToast({ icon: '⚠️', title: 'Invalid File', message: 'Please upload an image file (JPG, PNG, etc.)' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast({ icon: '⚠️', title: 'File Too Large', message: 'Template image must be under 5MB' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadTemplates(selectedEvent.id, { [type]: e.target.result });
      addToast({ icon: '✅', title: 'Template Uploaded', message: `${type} certificate template uploaded successfully.` });
    };
    reader.readAsDataURL(file);
  };

  const handleIssueCertificates = async () => {
    const certResults = eventStudents
      .filter(s => eventResults[s.id])
      .map(s => {
        const resultValue = eventResults[s.id];
        const option = resultOptions.find(o => o.value === resultValue);
        return {
          studentId: s.userId, // The UUID from profiles (or null)
          studentEmail: s.email, // Email to look up user_id if studentId is null
          studentName: s.name,
          type: resultValue,
          grade: option?.grade || 'Silver',
        };
      });

    if (certResults.length === 0) return;
    
    try {
      await issueCertificates(selectedEvent.id, selectedEvent.title, selectedEvent.date, certResults);
      setIssued(true);
      addToast({ icon: '🎓', title: 'Certificates Issued!', message: `${certResults.length} certificates issued for "${selectedEvent.title}"`, department: selectedEvent.department });
    } catch (err) {
      if (err.message?.includes('42501') || err.message?.includes('violates row-level security policy')) {
        addToast({ icon: '❌', title: 'Permission Denied', message: 'You must log in with a real organizer account to issue certificates. Demo accounts cannot save to the database.', department: 'System' });
      } else {
        addToast({ icon: '⚠️', title: 'Failed to issue', message: err.message || 'An error occurred while saving to the database.', department: 'System' });
      }
    }
  };

  const handleEventChange = (eventId) => {
    setSelectedEventId(eventId);
    setIssued(false);
    setSearchQuery('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <HiOutlineStar className="w-5 h-5 text-white" />
          </div>
          {isOrganizer ? 'Declare Results & Issue Certificates' : 'Event Results'}
        </h1>
        <p className="text-dark-500 dark:text-dark-400 mt-2">
          {isOrganizer
            ? 'Select a completed event, assign results to students, and issue certificates'
            : 'View results and standings for completed events'}
        </p>
      </motion.div>

      {/* Event Selector */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }} className="card p-5">
        <label className="text-sm font-semibold text-dark-700 dark:text-dark-300 mb-2 block">Select Completed Event</label>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {completedEvents.map(event => {
            const declared = isEventDeclared(event.id);
            const isSelected = event.id === selectedEventId;
            return (
              <motion.button
                key={event.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleEventChange(event.id)}
                className={`relative text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-gu-500 bg-gu-50 dark:bg-gu-900/20 shadow-md'
                    : 'border-dark-200 dark:border-dark-600 hover:border-dark-300 dark:hover:border-dark-500 bg-white dark:bg-dark-800'
                }`}
              >
                {declared && (
                  <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <HiOutlineCheck className="w-3.5 h-3.5 text-emerald-600" />
                  </span>
                )}
                <p className="font-semibold text-dark-900 dark:text-white text-sm mb-1 pr-6">{event.title}</p>
                <p className="text-xs text-dark-400">{event.date} • {event.category}</p>
                <p className="text-xs text-dark-400 mt-1">{event.registeredStudents?.length || 0} students registered</p>
                {declared && <span className="inline-block mt-2 text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">Results Declared</span>}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Certificate Templates Upload */}
      {selectedEvent && isOrganizer && !alreadyDeclared && !issued && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.15 }} className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <HiOutlinePhotograph className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-dark-900 dark:text-white">Certificate Templates</h2>
              <p className="text-xs text-dark-400">Upload 4 certificate templates (recommended: 1600×1131px landscape)</p>
            </div>
            <div className="ml-auto">
              <span className={`badge text-[10px] ${templatesReady ? 'badge-green' : 'badge-yellow'}`}>
                {Object.keys(currentTemplates).length}/4 uploaded
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {TEMPLATE_TYPES.map((type) => {
              const icon = type === 'Winner' ? '🥇' : type === '1st Runner-up' ? '🥈' : type === '2nd Runner-up' ? '🥉' : '👥';
              return (
                <div key={type} className="relative group">
                  <input
                    type="file"
                    accept="image/*"
                    ref={el => fileInputRefs.current[type] = el}
                    onChange={e => handleTemplateUpload(type, e.target.files[0])}
                    className="hidden"
                  />
                  {currentTemplates[type] ? (
                    <div
                      onClick={() => fileInputRefs.current[type]?.click()}
                      className="relative rounded-xl overflow-hidden border-2 border-emerald-300 dark:border-emerald-600 cursor-pointer group"
                    >
                      <img src={currentTemplates[type]} alt={type} className="w-full h-28 object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-medium">Replace</span>
                      </div>
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                        <HiOutlineCheck className="w-3 h-3 text-white" />
                      </div>
                      <div className="p-2 bg-white dark:bg-dark-800 text-center">
                        <p className="text-[10px] font-semibold text-dark-700 dark:text-dark-300">{icon} {type}</p>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRefs.current[type]?.click()}
                      className="w-full h-40 rounded-xl border-2 border-dashed border-dark-200 dark:border-dark-600 hover:border-gu-400 dark:hover:border-gold-500 flex flex-col items-center justify-center gap-2 transition-colors bg-gray-50 dark:bg-dark-750 hover:bg-gu-50 dark:hover:bg-gu-900/10"
                    >
                      <HiOutlineUpload className="w-6 h-6 text-dark-300 dark:text-dark-500" />
                      <span className="text-xs font-semibold text-dark-500 dark:text-dark-400">{icon} {type}</span>
                      <span className="text-[10px] text-dark-400">Click to upload</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {!templatesReady && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 flex items-center gap-1.5">
              ⚠️ Upload all 4 templates before issuing certificates
            </p>
          )}
        </motion.div>
      )}

      {/* Students Table */}
      {selectedEvent && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.2 }} className="card overflow-hidden">
          {/* Table header */}
          <div className="p-5 border-b border-dark-100 dark:border-dark-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-dark-900 dark:text-white flex items-center gap-2">
                  <HiOutlineUserGroup className="w-5 h-5 text-gu-500" />
                  {selectedEvent.title} — Attendees
                </h2>
                <p className="text-sm text-dark-400 mt-0.5">
                  {assignedCount} of {eventStudents.length} results assigned
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {isOrganizer && !alreadyDeclared && !issued && (
                  <button onClick={markAllAsParticipant} className="btn-secondary !text-xs !px-3 !py-2 flex items-center gap-1.5">
                    <HiOutlineClipboardCheck className="w-4 h-4" />
                    Mark All Participant
                  </button>
                )}
              </div>
            </div>
            {/* Search */}
            <div className="relative mt-3">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="text"
                placeholder="Search by name or enrollment..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-field !pl-9 !py-2 text-sm"
              />
            </div>
          </div>

          {/* Already declared banner */}
          {(alreadyDeclared || issued) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-200 dark:border-emerald-800 px-5 py-3 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                <HiOutlineCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  Certificates Issued Successfully!
                </p>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/60">
                  Students can now view and download their certificates from the Certificates page.
                </p>
              </div>
            </motion.div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-dark-700">
                  <th className="text-left py-3 px-5 text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase">Student</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase hidden md:table-cell">Enrollment</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase hidden sm:table-cell">Department</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase">Result</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase hidden sm:table-cell">Grade</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredStudents.map((student, idx) => {
                    const result = eventResults[student.id] || '';
                    const option = resultOptions.find(o => o.value === result);
                    const gradeColors = {
                      Platinum: 'bg-gradient-to-r from-slate-400 to-slate-600 text-white',
                      Gold: 'bg-gradient-to-r from-amber-400 to-amber-600 text-white',
                      Silver: 'bg-gradient-to-r from-gray-300 to-gray-500 text-white',
                    };
                    return (
                      <motion.tr
                        key={student.id}
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: idx * 0.03 }}
                        className="border-b border-dark-100 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-750 transition-colors"
                      >
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gu-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                              {student.avatar}
                            </div>
                            <div>
                              <p className="font-semibold text-dark-900 dark:text-white text-sm">{student.name}</p>
                              <p className="text-xs text-dark-400 sm:hidden">{student.enrollment}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-5 text-sm text-dark-600 dark:text-dark-300 font-mono hidden md:table-cell">{student.enrollment}</td>
                        <td className="py-3 px-5 text-sm text-dark-600 dark:text-dark-300 hidden sm:table-cell">{student.department}</td>
                        <td className="py-3 px-5">
                          {alreadyDeclared || issued || !isOrganizer ? (
                            <span className="text-sm font-medium text-dark-700 dark:text-dark-300">
                              {result ? (resultOptions.find(o => o.value === result)?.label || result) : '—'}
                            </span>
                          ) : (
                            <div className="relative">
                              <select
                                value={result}
                                onChange={e => setStudentResult(student.id, e.target.value)}
                                className="input-field !py-2 !pr-8 !text-sm appearance-none cursor-pointer min-w-[160px]"
                              >
                                {resultOptions.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                              <HiOutlineChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 pointer-events-none" />
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-5 hidden sm:table-cell">
                          {option?.grade ? (
                            <span className={`badge text-[11px] font-bold ${gradeColors[option.grade]}`}>
                              {option.grade}
                            </span>
                          ) : (
                            <span className="text-xs text-dark-400">—</span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Issue button — organizer only */}
          {isOrganizer && !alreadyDeclared && !issued && (
            <div className="p-5 border-t border-dark-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-800/50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-sm text-dark-500 dark:text-dark-400">
                  <span className="font-semibold text-dark-700 dark:text-dark-300">{assignedCount}</span> of {eventStudents.length} students assigned results
                  {assignedCount > 0 && templatesReady && <span className="text-emerald-500 ml-2">✓ Ready to issue</span>}
                  {assignedCount > 0 && !templatesReady && <span className="text-amber-500 ml-2">⚠ Upload all templates first</span>}
                </div>
                <button
                  onClick={handleIssueCertificates}
                  disabled={assignedCount === 0 || !templatesReady}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    assignedCount > 0 && templatesReady
                      ? 'bg-gradient-to-r from-gu-600 to-gu-500 text-white shadow-lg hover:shadow-xl hover:from-gu-700 hover:to-gu-600'
                      : 'bg-dark-200 dark:bg-dark-600 text-dark-400 cursor-not-allowed'
                  }`}
                >
                  <HiOutlineSparkles className="w-5 h-5" />
                  Issue {assignedCount} Certificate{assignedCount !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
