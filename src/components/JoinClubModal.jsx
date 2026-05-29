import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineX, HiOutlineCheckCircle, HiOutlineClock } from 'react-icons/hi';
import { useToast } from '../context/ToastContext';
import { useClubManagement } from '../context/ClubManagementContext';
import { sendClubApplicationEmail } from '../services/emailService';

export default function JoinClubModal({ club, isOpen, onClose }) {
  const [form, setForm] = useState({ name: '', email: '', regNo: '', course: '', year: '', about: '' });
  const [submitted, setSubmitted] = useState(false);
  const { addToast } = useToast();
  const { submitClubRegistration } = useClubManagement();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Save registration to Supabase
    try {
      await submitClubRegistration({
        clubId: club.id,
        clubName: club.name,
        name: form.name,
        email: form.email,
        regNo: form.regNo,
        course: form.course,
        year: form.year,
        about: form.about,
      });
    } catch (err) {
      addToast({
        icon: '❌',
        title: 'Registration Failed',
        message: 'Could not save to database. Please make sure the club_registrations table exists in Supabase.',
        department: club.category,
      });
      return; // Don't show success
    }

    setSubmitted(true);

    addToast({
      icon: '📨',
      title: 'Club Application Sent!',
      message: `Your request to join "${club.name}" is being reviewed. Wait for audition details!`,
      department: club.category,
    });

    // Send "wait for audition" email
    if (form.email) {
      const result = await sendClubApplicationEmail({
        toName: form.name,
        toEmail: form.email,
        clubName: club.name,
      });
      if (result.success) {
        addToast({
          icon: '📧',
          title: 'Email Sent!',
          message: `Application confirmation sent to ${form.email}`,
          department: club.category,
        });
      }
    }

    setTimeout(() => {
      setSubmitted(false);
      setForm({ name: '', email: '', regNo: '', course: '', year: '', about: '' });
      onClose();
    }, 3000);
  };

  if (!club) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white dark:bg-dark-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className={`relative p-6 bg-gradient-to-br ${club.color}`}>
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center overflow-hidden p-1.5 border border-white/20">
                    {club.logo ? (
                      <img src={club.logo} alt={club.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-white font-bold text-lg">{club.abbr}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Join {club.name}</h3>
                    <p className="text-white/60 text-xs">{club.members} members • {club.category}</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                  <HiOutlineX className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6"
                >
                  <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                    <HiOutlineClock className="w-8 h-8 text-amber-500" />
                  </div>
                  <h4 className="text-xl font-bold text-dark-900 dark:text-white mb-2">Application Submitted! 📨</h4>
                  <p className="text-dark-500 dark:text-dark-400 text-sm mb-3">
                    Your application to join <strong>{club.name}</strong> is under review.
                  </p>
                  <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/40">
                    <p className="text-sm text-amber-700 dark:text-amber-300 font-medium flex items-center justify-center gap-2">
                      <HiOutlineClock className="w-4 h-4 flex-shrink-0" />
                      Wait for club audition — we will mail you the date and time
                    </p>
                  </div>
                  <p className="text-xs text-dark-400 mt-3">You can check your application status in the Clubs section.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 dark:text-dark-300 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                    <input
                      name="name" value={form.name} onChange={handleChange} required
                      placeholder="Enter your full name"
                      className="input-field"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 dark:text-dark-300 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                    <input
                      name="email" type="email" value={form.email} onChange={handleChange} required
                      placeholder="your.email@galgotias.edu.in"
                      className="input-field"
                    />
                  </div>

                  {/* Registration No */}
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 dark:text-dark-300 mb-1.5">Registration No. <span className="text-red-500">*</span></label>
                    <input
                      name="regNo" value={form.regNo} onChange={handleChange} required
                      placeholder="e.g. GU2024CSE0451"
                      className="input-field"
                    />
                  </div>

                  {/* Course & Year row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-dark-700 dark:text-dark-300 mb-1.5">Course <span className="text-red-500">*</span></label>
                      <select
                        name="course" value={form.course} onChange={handleChange} required
                        className="input-field"
                      >
                        <option value="">Select Course</option>
                        <option value="B.Tech CSE">B.Tech CSE</option>
                        <option value="B.Tech ECE">B.Tech ECE</option>
                        <option value="B.Tech ME">B.Tech ME</option>
                        <option value="B.Tech IT">B.Tech IT</option>
                        <option value="BCA">BCA</option>
                        <option value="MBA">MBA</option>
                        <option value="MCA">MCA</option>
                        <option value="B.Sc">B.Sc</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-dark-700 dark:text-dark-300 mb-1.5">Year <span className="text-red-500">*</span></label>
                      <select
                        name="year" value={form.year} onChange={handleChange} required
                        className="input-field"
                      >
                        <option value="">Select Year</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                        <option value="5th Year">5th Year</option>
                      </select>
                    </div>
                  </div>

                  {/* About */}
                  <div>
                    <label className="block text-sm font-semibold text-dark-700 dark:text-dark-300 mb-1.5">Tell us about yourself <span className="text-red-500">*</span></label>
                    <textarea
                      name="about" value={form.about} onChange={handleChange} required
                      rows={3}
                      placeholder="Why do you want to join this club? What skills or interests do you bring?"
                      className="input-field resize-none"
                    />
                  </div>

                  {/* Audition note */}
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/15 border border-blue-200 dark:border-blue-800/40">
                    <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                      <HiOutlineClock className="w-3.5 h-3.5 flex-shrink-0" />
                      After submission, your application will be reviewed. If shortlisted, you'll receive audition details via email.
                    </p>
                  </div>

                  {/* Submit */}
                  <button type="submit" className="btn-primary w-full !py-3 text-sm font-semibold mt-2">
                    🚀 Submit Application
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
