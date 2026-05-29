import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineCalendar, HiOutlineLocationMarker, HiOutlineClock, HiOutlineUserGroup, HiOutlineTag, HiOutlineShare, HiOutlineBookmark, HiBookmark, HiOutlineArrowLeft, HiOutlineCheck, HiOutlineX, HiOutlineClock as HiClock, HiOutlinePhone, HiOutlineMail, HiOutlineStar, HiOutlineShieldCheck, HiOutlineAcademicCap } from 'react-icons/hi';
import { eventDetails as staticEventDetails } from '../data/eventDetails';
import { useRegistration } from '../context/RegistrationContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useFeedback } from '../context/FeedbackContext';
import { useEventManagement } from '../context/EventManagementContext';
import { useBookmarks } from '../context/BookmarkContext';
import { sendRegistrationEmail, sendApprovalEmail } from '../services/emailService';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function EventDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { getApprovedEvents, getAllEvents, getEventById, updateEvent, getEventDetails } = useEventManagement();
  const allEvents = getAllEvents();
  // Use getEventById for proper matching (handles both string and number IDs)
  const event = getEventById(id) || allEvents[0];
  // Fetch details from Supabase via context, fall back to static file for seed data
  const dbDetails = event ? getEventDetails(event.id) : {};
  const fallbackDetails = event ? (staticEventDetails[event.id] || {}) : {};
  const details = (dbDetails && Object.keys(dbDetails).length > 0) ? dbDetails : fallbackDetails;
  const approvedEvents = getApprovedEvents();
  const related = approvedEvents.filter(e => e.category === event?.category && e.id !== event?.id).slice(0, 3);
  const { addToast } = useToast();
  const { toggleBookmark, isBookmarked } = useBookmarks();
  
  const { submitRegistrationRequest, cancelRegistration, getRegistrationStatus, getApprovedRequestsForEvent } = useRegistration();
  
  const studentId = user?.admissionNo || user?.email || 'GU20230001';
  const regStatus = event ? getRegistrationStatus(event.id, studentId, user?.name) : null;
  const approvedCount = event ? getApprovedRequestsForEvent(event.id).length : 0;
  const currentRegistrations = (event?.registrations || 0) + approvedCount;

  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    admissionNo: user?.admissionNo || '',
    year: '1st Year',
    course: 'B.Tech CSE'
  });

  /* Feedback */
  const { isFeedbackEnabled, submitFeedback, hasUserSubmitted, getEventFeedback, getAverageRatings } = useFeedback();
  const feedbackEnabled = isFeedbackEnabled(event.id);
  const alreadySubmitted = hasUserSubmitted(event.id, studentId);
  const existingFeedback = getEventFeedback(event.id);
  const avgRatings = getAverageRatings(event.id);
  const [fbVenue, setFbVenue] = useState(0);
  const [fbFacilitator, setFbFacilitator] = useState(0);
  const [fbEvent, setFbEvent] = useState(0);
  const [fbExperience, setFbExperience] = useState('');
  const [fbSubmitted, setFbSubmitted] = useState(false);

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    submitFeedback(event.id, {
      studentId,
      name: user?.name || 'Student',
      venueRating: fbVenue,
      facilitatorRating: fbFacilitator,
      eventRating: fbEvent,
      experience: fbExperience,
    });
    setFbSubmitted(true);
    addToast({ icon: '✅', title: 'Feedback Submitted!', message: `Thank you for your feedback on "${event.title}".`, department: event.department });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setSendingEmail(true);
    submitRegistrationRequest({ eventId: event.id, studentId, userId: user?.id, ...formData });
    setShowModal(false);
    addToast({ icon: '📨', title: 'Registration Submitted!', message: `Your request for "${event.title}" has been sent for approval.`, department: event.department });

    // Send registration confirmation email
    if (formData.email) {
      const emailResult = await sendRegistrationEmail({
        toName: formData.name,
        toEmail: formData.email,
        eventName: event.title,
        eventDate: event.date,
        eventTime: event.time,
        eventVenue: event.venue,
        admissionNo: formData.admissionNo,
      });
      if (emailResult.success) {
        addToast({ icon: '📧', title: 'Email Sent!', message: `Registration confirmation sent to ${formData.email}`, department: event.department });
      }
    }
    setSendingEmail(false);

    // Real approval happens when organizer clicks Approve in their dashboard
  };

  const tabs = [
    { id: 'about', label: 'About' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'prizes', label: 'Prizes' },
    { id: 'rules', label: 'Rules' },
    { id: 'feedback', label: 'Feedback' },
  ];

  return (
    <div className="space-y-6">
      <Link to="/events" className="inline-flex items-center gap-2 text-gu-600 dark:text-gold-400 font-medium hover:gap-3 transition-all">
        <HiOutlineArrowLeft className="w-5 h-5" /> Back to Events
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
            <div className="relative h-64 md:h-80">
              <img src={event.poster} alt={event.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={event.status === 'upcoming' ? 'badge-green' : 'badge-blue'}>{event.status}</span>
                  <span className="badge-blue">{event.category}</span>
                  {event.featured && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-400/20 text-gold-400 border border-gold-400/30 font-medium">⭐ Featured</span>}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">{event.title}</h1>
                <p className="text-white/60 text-sm mt-1">Organized by {event.organizer} • {event.department}</p>
              </div>
            </div>

            {/* Quick info bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-dark-100 dark:divide-dark-700 border-b border-dark-100 dark:border-dark-700">
              {[
                { icon: '📅', label: event.date },
                { icon: '🕐', label: event.time },
                { icon: '📍', label: event.venue },
                { icon: '👥', label: `${currentRegistrations}/${event.maxCapacity}` },
              ].map((item, i) => (
                <div key={i} className="p-3 text-center">
                  <span className="text-sm">{item.icon}</span>
                  <p className="text-xs font-medium text-dark-700 dark:text-dark-300 mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="border-b border-dark-100 dark:border-dark-700 px-4 flex gap-0">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-gu-600 text-gu-600 dark:text-gold-400 dark:border-gold-400'
                      : 'border-transparent text-dark-400 hover:text-dark-600 dark:hover:text-dark-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'about' && (
                <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
                  <p className="text-dark-600 dark:text-dark-300 leading-relaxed">{details.longDescription || event.description}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {(Array.isArray(event.tags) ? event.tags : []).map(t => <span key={t} className="badge-blue">#{t}</span>)}
                  </div>

                  {/* Eligibility */}
                  {details.eligibility && (
                    <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/15 border border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-2">
                        <HiOutlineShieldCheck className="w-4 h-4" /> Eligibility
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-400">{details.eligibility}</p>
                    </div>
                  )}

                  {/* Coordinator */}
                  {details.coordinator && (
                    <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-dark-700/50 border border-dark-100 dark:border-dark-600">
                      <h4 className="font-semibold text-sm text-dark-900 dark:text-white mb-3 flex items-center gap-2">
                        <HiOutlineUserGroup className="w-4 h-4 text-gu-600" /> Event Coordinator
                      </h4>
                      <div className="space-y-2">
                        <p className="text-sm text-dark-700 dark:text-dark-300 font-medium">{details.coordinator.name}</p>
                        <div className="flex items-center gap-2 text-xs text-dark-400">
                          <HiOutlinePhone className="w-3.5 h-3.5" /> {details.coordinator.phone}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-dark-400">
                          <HiOutlineMail className="w-3.5 h-3.5" /> {details.coordinator.email}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'schedule' && (
                <motion.div variants={fadeUp} initial="hidden" animate="visible">
                  {details.schedule ? (
                    <div className="relative">
                      <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-dark-100 dark:bg-dark-700" />
                      <div className="space-y-4">
                        {details.schedule.map((item, i) => (
                          <div key={i} className="flex items-start gap-4 relative">
                            <div className="w-9 h-9 rounded-full bg-gu-50 dark:bg-gu-900/20 flex items-center justify-center flex-shrink-0 z-10 border-2 border-white dark:border-dark-800">
                              <HiOutlineClock className="w-4 h-4 text-gu-600 dark:text-gold-400" />
                            </div>
                            <div className="flex-1 pb-2">
                              <p className="text-xs font-semibold text-gu-600 dark:text-gold-400">{item.time}</p>
                              <p className="text-sm text-dark-700 dark:text-dark-300 font-medium">{item.activity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-dark-400 text-sm">Schedule will be announced soon.</p>
                  )}
                </motion.div>
              )}

              {activeTab === 'prizes' && (
                <motion.div variants={fadeUp} initial="hidden" animate="visible">
                  {details.prizes ? (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {details.prizes.map((prize, i) => (
                        <div key={i} className={`p-4 rounded-xl border ${i === 0 ? 'border-gold-400/30 bg-gold-400/5' : 'border-dark-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700/30'}`}>
                          <p className="font-bold text-dark-900 dark:text-white text-sm">{prize.place}</p>
                          <p className="text-gu-600 dark:text-gold-400 font-semibold text-sm mt-1">{prize.reward}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-dark-400 text-sm">Prize details coming soon.</p>
                  )}
                </motion.div>
              )}

              {activeTab === 'rules' && (
                <motion.div variants={fadeUp} initial="hidden" animate="visible">
                  {details.rules ? (
                    <ul className="space-y-3">
                      {details.rules.map((rule, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-dark-600 dark:text-dark-300">
                          <span className="w-6 h-6 rounded-full bg-gu-50 dark:bg-gu-900/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gu-600 dark:text-gold-400 mt-0.5">{i + 1}</span>
                          {rule}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-dark-400 text-sm">Rules will be announced soon.</p>
                  )}
                </motion.div>
              )}

              {activeTab === 'feedback' && (
                <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-6">
                  {/* Feedback disabled state */}
                  {!feedbackEnabled ? (
                    <div className="text-center py-10">
                      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-dark-700 flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🔒</span>
                      </div>
                      <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-2">Feedback Not Available</h3>
                      <p className="text-dark-400 text-sm max-w-sm mx-auto">Feedback collection for this event has not been opened yet. The organizer will enable it during or after the event.</p>
                    </div>
                  ) : (
                    <>
                      {/* Feedback form */}
                      {(alreadySubmitted || fbSubmitted) ? (
                        <div className="text-center py-6">
                          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-3">
                            <HiOutlineCheck className="w-7 h-7 text-emerald-600" />
                          </div>
                          <h3 className="font-bold text-dark-900 dark:text-white mb-1">Thank You!</h3>
                          <p className="text-dark-400 text-sm">Your feedback has been submitted for this event.</p>
                        </div>
                      ) : (
                        <form onSubmit={handleFeedbackSubmit} className="space-y-5">
                          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl p-3">
                            <p className="text-sm text-blue-700 dark:text-blue-300">📝 Share your honest feedback to help us improve future events.</p>
                          </div>

                          {/* Star rating fields */}
                          {[
                            { label: 'Rate the Venue', desc: 'Location, seating, facilities', value: fbVenue, set: setFbVenue },
                            { label: 'Rate the Facilitator', desc: 'Knowledge, communication, engagement', value: fbFacilitator, set: setFbFacilitator },
                            { label: 'How was the Event?', desc: 'Content, organization, value', value: fbEvent, set: setFbEvent },
                          ].map((field, fi) => (
                            <div key={fi}>
                              <label className="block text-sm font-semibold text-dark-900 dark:text-white mb-0.5">{field.label}</label>
                              <p className="text-xs text-dark-400 mb-2">{field.desc}</p>
                              <div className="flex gap-1">
                                {[1,2,3,4,5].map(star => (
                                  <button key={star} type="button" onClick={() => field.set(star)}
                                    className={`w-10 h-10 rounded-lg text-lg transition-all ${star <= field.value ? 'bg-amber-400 text-white shadow-md scale-105' : 'bg-gray-100 dark:bg-dark-700 text-dark-300 dark:text-dark-500 hover:bg-amber-100 dark:hover:bg-amber-900/20'}`}>
                                    ★
                                  </button>
                                ))}
                                <span className="ml-2 self-center text-sm text-dark-400">{field.value > 0 ? ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][field.value] : 'Select'}</span>
                              </div>
                            </div>
                          ))}

                          {/* Experience text */}
                          <div>
                            <label className="block text-sm font-semibold text-dark-900 dark:text-white mb-1">Describe Your Experience</label>
                            <textarea required value={fbExperience} onChange={e => setFbExperience(e.target.value)}
                              className="input-field !min-h-[100px] resize-none" placeholder="What did you enjoy? What can be improved?" />
                          </div>

                          <button type="submit" disabled={fbVenue === 0 || fbFacilitator === 0 || fbEvent === 0}
                            className="btn-primary w-full !py-3 disabled:opacity-50 disabled:cursor-not-allowed">
                            Submit Feedback
                          </button>
                        </form>
                      )}

                      {/* Existing reviews */}
                      {existingFeedback.length > 0 && (
                        <div>
                          <h4 className="font-bold text-dark-900 dark:text-white text-sm mb-3">Recent Reviews ({existingFeedback.length})</h4>
                          <div className="space-y-3">
                            {existingFeedback.slice(0, 5).map((fb, i) => (
                              <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-dark-700/50 border border-dark-100 dark:border-dark-600">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm font-semibold text-dark-900 dark:text-white">{fb.name}</p>
                                  <div className="flex gap-0.5">
                                    {[1,2,3,4,5].map(s => <span key={s} className={`text-xs ${s <= Math.round((fb.venueRating + fb.facilitatorRating + fb.eventRating) / 3) ? 'text-amber-400' : 'text-dark-200 dark:text-dark-600'}`}>★</span>)}
                                  </div>
                                </div>
                                <p className="text-sm text-dark-600 dark:text-dark-300 mt-1">"{fb.experience}"</p>
                                <p className="text-[10px] text-dark-400 mt-1.5">Submitted on {fb.submittedAt}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Details grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { icon: HiOutlineCalendar, label: 'Start Date', value: event.date },
              { icon: HiOutlineCalendar, label: 'End Date', value: event.endDate },
              { icon: HiOutlineClock, label: 'Time', value: event.time },
              { icon: HiOutlineLocationMarker, label: 'Venue', value: event.venue },
              { icon: HiOutlineTag, label: 'Category', value: event.category },
              { icon: HiOutlineUserGroup, label: 'Organizer', value: event.organizer },
            ].map((d, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gu-50 dark:bg-gu-900/20 flex items-center justify-center flex-shrink-0">
                  <d.icon className="w-5 h-5 text-gu-600 dark:text-gold-400" />
                </div>
                <div>
                  <p className="text-xs text-dark-400">{d.label}</p>
                  <p className="font-semibold text-dark-900 dark:text-white text-sm">{d.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Gallery */}
          {event.gallery && event.gallery.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-6">
              <h2 className="text-lg font-bold text-dark-900 dark:text-white mb-4">📸 Event Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {event.gallery.map((img, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden aspect-[4/3] group cursor-pointer">
                    <img src={img} alt={`${event.title} photo ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:scrollbar-thin">
          {/* Registration card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
            {event.status === 'completed' ? (
              <>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Event Completed</span>
                </div>
                <div className="text-center mb-4">
                  <p className="text-3xl font-bold text-dark-900 dark:text-white">{event.registrations}</p>
                  <p className="text-sm text-dark-500 dark:text-dark-400">total participants</p>
                </div>
                <div className="h-3 bg-dark-100 dark:bg-dark-700 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: `${(event.registrations / event.maxCapacity) * 100}%` }} />
                </div>
                <div className="bg-gray-50 dark:bg-dark-700 rounded-xl p-4 mb-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark-500 dark:text-dark-400">Capacity</span>
                    <span className="font-semibold text-dark-900 dark:text-white">{event.registrations}/{event.maxCapacity}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark-500 dark:text-dark-400">Ended on</span>
                    <span className="font-semibold text-dark-900 dark:text-white">{event.endDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark-500 dark:text-dark-400">Status</span>
                    <span className="badge-green text-xs">Completed</span>
                  </div>
                </div>
                <Link to="/event-results" className="btn-primary w-full !py-3.5 text-base mb-3 text-center block">View Results</Link>
                {feedbackEnabled ? (
                  (alreadySubmitted || fbSubmitted) ? (
                    <button className="w-full !py-3 text-base mb-3 font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2 cursor-default">
                      <HiOutlineCheck className="w-5 h-5" /> Feedback Submitted
                    </button>
                  ) : (
                    <button onClick={() => setActiveTab('feedback')} className="w-full !py-3 text-base mb-3 font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-2 transition-colors shadow-md shadow-amber-500/20">
                      <HiOutlineStar className="w-5 h-5" /> Share Feedback
                    </button>
                  )
                ) : (
                  <button disabled className="w-full !py-3 text-base mb-3 font-semibold rounded-xl bg-gray-100 dark:bg-dark-700 text-dark-400 flex items-center justify-center gap-2 cursor-not-allowed opacity-50">
                    <HiOutlineStar className="w-5 h-5" /> Share Feedback
                  </button>
                )}
                <div className="flex gap-2">
                  <button onClick={() => toggleBookmark(event.id)} className={`btn-secondary flex-1 flex items-center justify-center gap-2 !py-2.5 ${isBookmarked(event.id) ? '!bg-amber-50 dark:!bg-amber-900/20 !border-amber-200 dark:!border-amber-800 !text-amber-600 dark:!text-amber-400' : ''}`}>
                    {isBookmarked(event.id) ? <HiBookmark className="w-4 h-4" /> : <HiOutlineBookmark className="w-4 h-4" />} {isBookmarked(event.id) ? 'Saved' : 'Save'}
                  </button>
                  <button className="btn-secondary flex-1 flex items-center justify-center gap-2 !py-2.5"><HiOutlineShare className="w-4 h-4" /> Share</button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-4">
                  <p className="text-3xl font-bold text-dark-900 dark:text-white">{currentRegistrations}</p>
                  <p className="text-sm text-dark-500 dark:text-dark-400">of {event.maxCapacity} spots filled</p>
                </div>
                <div className="h-3 bg-dark-100 dark:bg-dark-700 rounded-full overflow-hidden mb-4">
                  <motion.div className="h-full bg-gradient-to-r from-gu-500 to-gold-400 rounded-full" initial={{ width: 0 }}
                    animate={{ width: `${(currentRegistrations / event.maxCapacity) * 100}%` }}
                    transition={{ duration: 1.5, ease: 'easeOut' }} />
                </div>
                <p className="text-center text-sm text-dark-400 mb-6">{event.maxCapacity - currentRegistrations} spots remaining</p>
                
                {user?.role === 'student' || !user?.role ? (
                  <>
                    {regStatus === 'approved' ? (
                      <div className="space-y-2 mb-3">
                        <div className="w-full !py-3.5 text-base font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2">
                          <HiOutlineCheck className="w-5 h-5" /> Registered ✅
                        </div>
                        <button 
                          onClick={() => { 
                            cancelRegistration(event.id, studentId); 
                            if (regStatus === 'approved' && event.registrations > 0) {
                              updateEvent(event.id, { registrations: event.registrations - 1 });
                            }
                            addToast({ icon: '🗑️', title: 'Registration Cancelled', message: `Your registration for "${event.title}" has been cancelled.`, department: event.department }); 
                          }}
                          className="w-full !py-2.5 text-sm font-medium rounded-xl border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center gap-2 transition-colors"
                        >
                          <HiOutlineX className="w-4 h-4" /> Cancel Registration
                        </button>
                      </div>
                    ) : regStatus === 'pending' ? (
                      <button 
                        onClick={() => cancelRegistration(event.id, studentId)}
                        className="w-full !py-3.5 text-base mb-3 font-semibold rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 group transition-colors"
                      >
                        <HiClock className="w-5 h-5 group-hover:hidden" />
                        <span className="group-hover:hidden">Pending Approval</span>
                        <span className="hidden group-hover:block">Cancel Request</span>
                      </button>
                    ) : regStatus === 'rejected' ? (
                      <button className="w-full !py-3.5 text-base mb-3 font-semibold rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center gap-2 cursor-not-allowed opacity-80">
                        <HiOutlineX className="w-5 h-5" /> Registration Declined
                      </button>
                    ) : (
                      <button onClick={() => setShowModal(true)} className="btn-primary w-full !py-3.5 text-base mb-3">Register Now</button>
                    )}
                  </>
                ) : (
                  <div className="w-full !py-3.5 text-base mb-3 font-semibold rounded-xl bg-dark-100 dark:bg-dark-700 text-dark-500 dark:text-dark-400 flex items-center justify-center gap-2">
                    <HiOutlineShieldCheck className="w-5 h-5" /> View Only — {user?.role === 'organizer' ? 'Organizers' : 'Admins'} cannot register
                  </div>
                )}

                {/* Share Feedback - always visible, disabled until organizer enables */}
                {feedbackEnabled ? (
                  (alreadySubmitted || fbSubmitted) ? (
                    <button className="w-full !py-3 text-base mb-3 font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2 cursor-default">
                      <HiOutlineCheck className="w-5 h-5" /> Feedback Submitted
                    </button>
                  ) : (
                    <button onClick={() => setActiveTab('feedback')} className="w-full !py-3 text-base mb-3 font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-2 transition-colors shadow-md shadow-amber-500/20">
                      <HiOutlineStar className="w-5 h-5" /> Share Feedback
                    </button>
                  )
                ) : (
                  <button disabled className="w-full !py-3 text-base mb-3 font-semibold rounded-xl bg-gray-100 dark:bg-dark-700 text-dark-400 flex items-center justify-center gap-2 cursor-not-allowed opacity-50">
                    <HiOutlineStar className="w-5 h-5" /> Share Feedback
                  </button>
                )}
                
                <div className="flex gap-2">
                  <button onClick={() => toggleBookmark(event.id)} className={`btn-secondary flex-1 flex items-center justify-center gap-2 !py-2.5 ${isBookmarked(event.id) ? '!bg-amber-50 dark:!bg-amber-900/20 !border-amber-200 dark:!border-amber-800 !text-amber-600 dark:!text-amber-400' : ''}`}>
                    {isBookmarked(event.id) ? <HiBookmark className="w-4 h-4" /> : <HiOutlineBookmark className="w-4 h-4" />} {isBookmarked(event.id) ? 'Saved' : 'Save'}
                  </button>
                  <button className="btn-secondary flex-1 flex items-center justify-center gap-2 !py-2.5"><HiOutlineShare className="w-4 h-4" /> Share</button>
                </div>
              </>
            )}
          </motion.div>

          {/* Related events */}
          {related.length > 0 && (
            <div className="card p-6">
              <h3 className="font-bold text-dark-900 dark:text-white mb-4">Related Events</h3>
              <div className="space-y-3">
                {related.map(e => (
                  <Link key={e.id} to={`/events/${e.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                    <img src={e.poster} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-dark-900 dark:text-white truncate">{e.title}</p>
                      <p className="text-xs text-dark-400">{e.date}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Registration Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-dark-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-dark-100 dark:border-dark-700">
                <h3 className="text-lg font-bold text-dark-900 dark:text-white">Event Registration</h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-dark-500"><HiOutlineX className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Full Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Email Address</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="input-field" placeholder="yourname@galgotiasuniversity.edu.in" />
                  <p className="text-[11px] text-dark-400 mt-1">📧 Confirmation & approval emails will be sent here</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Admission Number</label>
                  <input required type="text" value={formData.admissionNo} onChange={e => setFormData({...formData, admissionNo: e.target.value})} className="input-field" placeholder="GU2023CSE0001" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Year</label>
                    <select value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} className="input-field">
                      <option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Course</label>
                    <select value={formData.course} onChange={e => setFormData({...formData, course: e.target.value})} className="input-field">
                      <option>B.Tech CSE</option><option>B.Tech ECE</option><option>BBA</option><option>MBA</option><option>BCA</option>
                    </select>
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 mt-6">
                  <p className="text-sm text-blue-800 dark:text-blue-300">By submitting, a registration request will be sent to the organizer for approval. A confirmation email will be sent to your email address.</p>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={sendingEmail} className="btn-primary flex-1 disabled:opacity-70">
                    {sendingEmail ? 'Sending...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
