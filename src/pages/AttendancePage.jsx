import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineCheck, HiOutlineX, HiOutlineMail, HiOutlineClipboardCheck, HiOutlineSearch, HiOutlineUserGroup, HiOutlineExclamation, HiOutlineRefresh, HiOutlineShieldCheck } from 'react-icons/hi';
import { useEventManagement } from '../context/EventManagementContext';
import { useRegistration } from '../context/RegistrationContext';
import { useToast } from '../context/ToastContext';
import { sendAttendanceCodeEmail } from '../services/emailService';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function AttendancePage() {
  const { getApprovedEvents } = useEventManagement();
  const { getAttendanceCodes, verifyAttendance, getVerifiedAttendees, sendAttendanceCodes } = useRegistration();
  const { addToast } = useToast();

  const events = getApprovedEvents();
  const upcomingEvents = events.filter(e => e.status === 'upcoming');
  const [selectedEvent, setSelectedEvent] = useState(upcomingEvents[0] || events[0]);
  const [codeInput, setCodeInput] = useState('');
  const [verifyResult, setVerifyResult] = useState(null); // null | { success, student } | { success: false, message }
  const [codesSent, setCodesSent] = useState({});
  const [searchFilter, setSearchFilter] = useState('');
  const inputRef = useRef(null);

  const attendanceCodes = selectedEvent ? getAttendanceCodes(selectedEvent.id) : [];
  const verifiedAttendees = selectedEvent ? getVerifiedAttendees(selectedEvent.id) : [];

  // Auto-focus input after verification
  useEffect(() => {
    if (verifyResult && inputRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [verifyResult]);

  const handleSendCodes = async () => {
    if (!selectedEvent) return;
    const generatedCodes = await sendAttendanceCodes(selectedEvent.id);
    setCodesSent(prev => ({ ...prev, [selectedEvent.id]: true }));
    addToast({
      icon: '📧',
      title: 'Attendance Codes Generated!',
      message: `Unique attendance codes created for all registered students for "${selectedEvent.title}".`,
      department: selectedEvent.department
    });

    // Send attendance code email to each registered student
    if (generatedCodes && generatedCodes.length > 0) {
      let sentCount = 0;
      for (const student of generatedCodes) {
        if (student.email) {
          const result = await sendAttendanceCodeEmail({
            toName: student.name,
            toEmail: student.email,
            eventName: selectedEvent.title,
            eventDate: selectedEvent.date,
            eventTime: selectedEvent.time,
            eventVenue: selectedEvent.venue,
            attendanceCode: student.code,
          });
          if (result.success) sentCount++;
        }
      }
      if (sentCount > 0) {
        addToast({ icon: '✅', title: 'Emails Delivered!', message: `Attendance codes emailed to ${sentCount} students.`, department: selectedEvent.department });
      } else {
        addToast({ icon: '⚠️', title: 'No Emails Sent', message: 'None of the registered students have an email address on file.', department: selectedEvent.department });
      }
    } else {
      addToast({ icon: '⚠️', title: 'No Approved Students', message: 'No approved registrations found for this event. Approve student registrations first!', department: selectedEvent.department });
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    const trimmed = codeInput.trim().toUpperCase();
    if (!trimmed) return;

    const result = verifyAttendance(selectedEvent.id, trimmed);
    setVerifyResult(result);
    setCodeInput('');

    if (result.success) {
      addToast({
        icon: '✅',
        title: 'Attendance Verified!',
        message: `${result.student.name} — attendance marked for "${selectedEvent.title}".`,
        department: selectedEvent.department
      });
    }
  };

  const clearResult = () => {
    setVerifyResult(null);
    inputRef.current?.focus();
  };

  const filteredAttendees = verifiedAttendees.filter(a =>
    a.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    a.admissionNo?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const codesAlreadySent = codesSent[selectedEvent?.id] || (attendanceCodes.length > 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gu-600 to-gu-500 flex items-center justify-center">
            <HiOutlineClipboardCheck className="w-5 h-5 text-white" />
          </div>
          Code Attendance
        </h1>
        <p className="text-dark-500 dark:text-dark-400 mt-1 ml-[52px]">
          Send unique codes to registered students, then verify their attendance by entering the code
        </p>
      </motion.div>

      {/* Event selector */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.05 }} className="card p-5">
        <label className="text-sm font-semibold text-dark-700 dark:text-dark-300 mb-2 block">Select Event</label>
        <select
          value={selectedEvent?.id || ''}
          onChange={e => {
            const ev = events.find(ev => ev.id === parseInt(e.target.value));
            setSelectedEvent(ev);
            setVerifyResult(null);
            setCodeInput('');
          }}
          className="input-field"
        >
          {events.map(e => (
            <option key={e.id} value={e.id}>{e.title} — {e.date} • {e.venue}</option>
          ))}
        </select>
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left — Verification panel */}
        <div className="lg:col-span-3 space-y-5">

          {/* Step 1: Send Codes */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }} className="card overflow-hidden">
            <div className="p-5 border-b border-dark-100 dark:border-dark-700 flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-xs font-bold">1</span>
              <h2 className="font-bold text-dark-900 dark:text-white">Send Attendance Codes</h2>
            </div>
            <div className="p-5">
              {codesAlreadySent ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-800/40">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                    <HiOutlineCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Codes Sent Successfully</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {attendanceCodes.length} unique codes emailed to registered students
                    </p>
                  </div>
                  <button
                    onClick={handleSendCodes}
                    className="ml-auto p-2 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 transition-colors"
                    title="Resend codes"
                  >
                    <HiOutlineRefresh className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
                    <HiOutlineMail className="w-7 h-7 text-blue-500" />
                  </div>
                  <p className="text-sm text-dark-600 dark:text-dark-300 mb-1 font-medium">
                    Send unique attendance codes to all registered students
                  </p>
                  <p className="text-xs text-dark-400 mb-5">
                    Each student will receive a unique 8-character code via email that they must present at the event
                  </p>
                  <button onClick={handleSendCodes} className="btn-primary flex items-center gap-2 mx-auto">
                    <HiOutlineMail className="w-4 h-4" /> Send Codes to {selectedEvent?.registrations || 0} Students
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Step 2: Verify Codes */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.15 }} className="card overflow-hidden">
            <div className="p-5 border-b border-dark-100 dark:border-dark-700 flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-gu-100 dark:bg-gu-900/30 flex items-center justify-center text-gu-600 dark:text-gold-400 text-xs font-bold">2</span>
              <h2 className="font-bold text-dark-900 dark:text-white">Verify Student Code</h2>
            </div>
            <div className="p-5">
              <form onSubmit={handleVerify} className="flex gap-3">
                <div className="relative flex-1">
                  <HiOutlineShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={codeInput}
                    onChange={e => setCodeInput(e.target.value.toUpperCase())}
                    placeholder="Enter student's attendance code"
                    className="input-field !pl-11 font-mono tracking-wider uppercase text-lg"
                    maxLength={10}
                    autoFocus
                    disabled={!codesAlreadySent}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!codeInput.trim() || !codesAlreadySent}
                  className="px-6 py-3 bg-gu-600 hover:bg-gu-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors shadow-md shadow-gu-600/20 flex items-center gap-2"
                >
                  <HiOutlineCheck className="w-5 h-5" /> Verify
                </button>
              </form>

              {!codesAlreadySent && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 flex items-center gap-1.5">
                  <HiOutlineExclamation className="w-3.5 h-3.5" />
                  Send attendance codes first before verifying
                </p>
              )}

              {/* Verification result */}
              <AnimatePresence mode="wait">
                {verifyResult && (
                  <motion.div
                    key={verifyResult.success ? 'success' : 'error'}
                    initial={{ opacity: 0, y: 10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="mt-4"
                  >
                    {verifyResult.success ? (
                      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-800/40">
                        <div className="flex items-start gap-3">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', damping: 10, stiffness: 200 }}
                            className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0"
                          >
                            <HiOutlineCheck className="w-6 h-6 text-emerald-600" />
                          </motion.div>
                          <div className="flex-1">
                            <h3 className="font-bold text-emerald-700 dark:text-emerald-300 text-lg">Attendance Verified! ✅</h3>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                <strong>Student:</strong> {verifyResult.student.name}
                              </p>
                              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                <strong>Admission No:</strong> {verifyResult.student.admissionNo}
                              </p>
                              <p className="text-xs text-emerald-500 dark:text-emerald-500 mt-2">
                                ✓ Recorded at {new Date().toLocaleTimeString()} on {new Date().toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <button onClick={clearResult} className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 transition-colors">
                            <HiOutlineX className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/40">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                            <HiOutlineX className="w-6 h-6 text-red-500" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-red-700 dark:text-red-300">Verification Failed</h3>
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{verifyResult.message}</p>
                          </div>
                          <button onClick={clearResult} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors">
                            <HiOutlineX className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Right — Attendance log */}
        <div className="lg:col-span-2">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.2 }} className="card overflow-hidden h-fit">
            <div className="p-5 border-b border-dark-100 dark:border-dark-700">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-dark-900 dark:text-white flex items-center gap-2">
                  <HiOutlineUserGroup className="w-5 h-5 text-gu-600 dark:text-gold-400" />
                  Attendance Log
                </h2>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gu-50 dark:bg-gu-900/20 text-gu-600 dark:text-gold-400">
                  {verifiedAttendees.length} verified
                </span>
              </div>
              {verifiedAttendees.length > 3 && (
                <div className="relative">
                  <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    placeholder="Search verified students..."
                    className="input-field !pl-9 !py-2 text-sm"
                  />
                </div>
              )}
            </div>

            <div className="max-h-[500px] overflow-y-auto">
              {filteredAttendees.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-3xl mb-3">📋</p>
                  <p className="text-dark-400 text-sm font-medium">No attendance recorded yet</p>
                  <p className="text-dark-400 text-xs mt-1">Verified students will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-dark-100 dark:divide-dark-700">
                  {filteredAttendees.map((attendee, i) => (
                    <motion.div
                      key={attendee.admissionNo}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-dark-750 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gu-600 to-gu-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {attendee.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-dark-900 dark:text-white truncate">{attendee.name}</p>
                        <p className="text-[11px] text-dark-400 font-mono">{attendee.admissionNo}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                          <HiOutlineCheck className="w-3 h-3" /> Verified
                        </span>
                        <p className="text-[10px] text-dark-400 mt-0.5">{attendee.verifiedAt}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary footer */}
            {verifiedAttendees.length > 0 && (
              <div className="p-4 border-t border-dark-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-700/30">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-dark-500 dark:text-dark-400">Attendance Rate</span>
                  <span className="font-bold text-dark-900 dark:text-white">
                    {verifiedAttendees.length}/{attendanceCodes.length} ({attendanceCodes.length > 0 ? Math.round((verifiedAttendees.length / attendanceCodes.length) * 100) : 0}%)
                  </span>
                </div>
                <div className="h-2 bg-dark-200 dark:bg-dark-600 rounded-full mt-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-gu-500 to-gold-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${attendanceCodes.length > 0 ? (verifiedAttendees.length / attendanceCodes.length) * 100 : 0}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
