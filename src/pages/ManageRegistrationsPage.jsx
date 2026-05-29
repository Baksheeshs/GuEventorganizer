import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineCheck, HiOutlineX, HiOutlineArrowLeft, HiOutlineUserGroup, HiOutlineClock } from 'react-icons/hi';
import { useRegistration } from '../context/RegistrationContext';
import { useEventManagement } from '../context/EventManagementContext';
import { useToast } from '../context/ToastContext';
import { sendApprovalEmail } from '../services/emailService';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function ManageRegistrationsPage() {
  const { eventId } = useParams();
  const { getAllEvents, updateEvent } = useEventManagement();
  const event = getAllEvents().find(e => e.id === parseInt(eventId));
  
  const { 
    getPendingRequestsForEvent, 
    getApprovedRequestsForEvent, 
    approveRegistration, 
    rejectRegistration 
  } = useRegistration();
  const { addToast } = useToast();

  const handleApprove = async (req) => {
    approveRegistration(req.reqId);
    
    // Increment the event's registration counter
    const newCount = (event.registrations || 0) + 1;
    updateEvent(event.id, { registrations: newCount });
    
    addToast({ icon: '✅', title: 'Registration Approved', message: `${req.name} has been approved for ${event.title}`, department: event.department });
    
    // Send approval email
    if (req.email) {
      const emailResult = await sendApprovalEmail({
        toName: req.name,
        toEmail: req.email,
        eventName: event.title,
        eventDate: event.date,
        eventTime: event.time,
        eventVenue: event.venue,
      });
      if (emailResult.success) {
        addToast({ icon: '📧', title: 'Email Sent!', message: `Approval confirmation sent to ${req.email}`, department: event.department });
      } else {
        addToast({ icon: '⚠️', title: 'Email Failed', message: `Could not send confirmation to ${req.email}. Have you configured your EmailJS keys in src/services/emailService.js?`, department: 'System' });
      }
    }
  };

  const handleReject = (req) => {
    rejectRegistration(req.reqId);
    
    // Decrement if they were previously counted (optional, but safe)
    if (req.status === 'approved' && event.registrations > 0) {
      updateEvent(event.id, { registrations: event.registrations - 1 });
    }
    
    addToast({ icon: '❌', title: 'Registration Rejected', message: `${req.name}'s request for ${event.title} was declined`, department: event.department });
  };

  if (!event) return <div className="p-8">Event not found</div>;

  const pendingRequests = getPendingRequestsForEvent(event.id);
  const approvedCount = getApprovedRequestsForEvent(event.id).length;
  const currentRegistrations = event.registrations + approvedCount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link to="/organizer" className="inline-flex items-center gap-2 text-gu-600 dark:text-gold-400 font-medium hover:gap-3 transition-all mb-2">
            <HiOutlineArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Manage Registrations</h1>
          <p className="text-dark-500 dark:text-dark-400 mt-1">Review pending requests for <span className="font-semibold text-dark-900 dark:text-white">{event.title}</span></p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-gray-50 dark:bg-dark-800 px-4 py-2 rounded-xl flex items-center gap-3 border border-dark-100 dark:border-dark-700">
            <HiOutlineUserGroup className="w-5 h-5 text-gu-600 dark:text-gold-400" />
            <div>
              <p className="text-xs text-dark-500">Filled Spots</p>
              <p className="font-bold text-dark-900 dark:text-white">{currentRegistrations} / {event.maxCapacity}</p>
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-xl flex items-center gap-3 border border-amber-200 dark:border-amber-800">
            <HiOutlineClock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-xs text-amber-700 dark:text-amber-500">Pending Requests</p>
              <p className="font-bold text-amber-800 dark:text-amber-400">{pendingRequests.length}</p>
            </div>
          </div>
        </div>
      </div>

      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="card overflow-hidden">
        <div className="p-6 border-b border-dark-100 dark:border-dark-700">
          <h2 className="text-lg font-bold text-dark-900 dark:text-white">Pending Requests</h2>
        </div>
        
        {pendingRequests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 dark:bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineCheck className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-medium text-dark-900 dark:text-white mb-1">All caught up!</h3>
            <p className="text-dark-500 dark:text-dark-400">There are no pending registration requests for this event.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-dark-700">
                  <th className="text-left py-3 px-6 text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider">Student Name</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider">Admission No.</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider hidden sm:table-cell">Course & Year</th>
                  <th className="text-right py-3 px-6 text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100 dark:divide-dark-700">
                {pendingRequests.map(req => (
                  <tr key={req.reqId} className="hover:bg-gray-50 dark:hover:bg-dark-750 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-medium text-dark-900 dark:text-white">{req.name}</p>
                    </td>
                    <td className="py-4 px-6 text-sm text-dark-600 dark:text-dark-300">
                      {req.admissionNo}
                    </td>
                    <td className="py-4 px-6 text-sm text-dark-600 dark:text-dark-300 hidden sm:table-cell">
                      {req.course} • {req.year}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleApprove(req)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 font-medium text-sm transition-colors"
                        >
                          <HiOutlineCheck className="w-4 h-4" /> Approve
                        </button>
                        <button 
                          onClick={() => handleReject(req)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 font-medium text-sm transition-colors"
                        >
                          <HiOutlineX className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
