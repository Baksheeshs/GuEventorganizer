import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineEye, HiOutlineEyeOff, HiOutlineAcademicCap, HiOutlineShieldCheck, HiOutlineIdentification, HiOutlineOfficeBuilding } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const slideImages = [
  { src: '/slide-1.jpg', caption: 'UniFest Live Performance' },
  { src: '/slide-2.jpg', caption: 'iOS Development Centre' },
  { src: '/slide-3.jpg', caption: 'Sur Tal — Classical Music' },
  { src: '/slide-4.jpg', caption: 'UniFest Cultural Showcase' },
];

export default function LoginPage() {
  const location = useLocation();
  const [portal, setPortal] = useState(location.state?.portal || 'student'); // 'student' or 'organizer'
  const [tab, setTab] = useState('login');
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [enrollmentId, setEnrollmentId] = useState('');
  const [department, setDepartment] = useState('B.Tech CSE');
  const [year, setYear] = useState('1st Year');
  const [orgRole, setOrgRole] = useState('organizer'); // organizer or admin
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { loginWithEmail, signup, user, isLoggedIn } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Slideshow timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Reset form when switching portals
  useEffect(() => {
    setTab('login');
    setEmail('');
    setPassword('');
    setName('');
    setEnrollmentId('');
    setError('');
  }, [portal]);

  // Navigate after successful login (when user state updates)
  useEffect(() => {
    if (isLoggedIn && user?.role) {
      const routes = { student: '/student', organizer: '/organizer', admin: '/admin' };
      navigate(routes[user.role] || '/student');
    }
  }, [isLoggedIn, user?.role, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (portal === 'student') {
        if (tab === 'signup') {
          // ── Student Signup ──
          if (!name.trim()) { setError('Please enter your full name'); setLoading(false); return; }
          if (!email.trim()) { setError('Please enter your email'); setLoading(false); return; }
          if (!enrollmentId.trim()) { setError('Please enter your admission NO'); setLoading(false); return; }
          if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }

          const { error: signupError } = await signup(email, password, {
            name: name.trim(),
            role: 'student',
            department,
            year,
            enrollment_id: enrollmentId.trim(),
            avatar: name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
          });

          if (signupError) {
            setError(signupError.message);
            setLoading(false);
            return;
          }

          addToast({
            icon: '📧',
            title: 'Check Your Email!',
            message: 'A confirmation link has been sent to your email. Please verify to login.',
            department: 'CSE'
          });
          setTab('login');
          setPassword('');
          setLoading(false);
          return;

        } else if (tab === 'forgot') {
          // ── Forgot Password (placeholder) ──
          addToast({
            icon: '📧',
            title: 'Reset Link Sent',
            message: 'If this email exists, a password reset link has been sent.',
            department: 'CSE'
          });
          setTab('login');
          setLoading(false);
          return;

        } else {
          // ── Student Login ──
          if (!email.trim() || !password.trim()) { setError('Please enter email and password'); setLoading(false); return; }

          const { error: loginError } = await loginWithEmail(email, password);
          if (loginError) {
            setError(loginError.message === 'Invalid login credentials' ? 'Invalid email or password. Please try again.' : loginError.message);
            setLoading(false);
            return;
          }

          addToast({
            icon: '👋',
            title: 'Welcome back!',
            message: 'You have been logged in successfully',
            department: 'CSE'
          });
          // Navigation happens via useEffect watching isLoggedIn
        }

      } else {
        // ── Organizer / Admin Login (no signup) ──
        if (!email.trim() || !password.trim()) { setError('Please enter your credentials'); setLoading(false); return; }

        const { error: loginError } = await loginWithEmail(email, password);
        if (loginError) {
          console.error('🔴 Organizer/Admin login error:', loginError);
          setError(loginError.message);
          setLoading(false);
          return;
        }

        const label = orgRole === 'admin' ? 'Admin' : 'Organizer';
        addToast({
          icon: '🔐',
          title: `${label} Portal`,
          message: `Logged in as ${label}. You have full event management access.`,
          department: 'Management'
        });
        // Navigation happens via useEffect watching isLoggedIn
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Left panel — Photo slideshow */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <img src={slideImages[currentSlide].src} alt={slideImages[currentSlide].caption} className="w-full h-full object-cover" />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/50 z-[1]" />

        <div className="relative z-10">
          <Link to="/">
            <img src="/gu-logo-full.png" alt="Galgotias University" className="h-14 sm:h-16 w-auto object-contain drop-shadow-lg" />
          </Link>
        </div>

        <div className="relative z-10">
          <AnimatePresence mode="wait">
            <motion.p key={currentSlide} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }} className="text-xl font-semibold text-white mb-4">
              {slideImages[currentSlide].caption}
            </motion.p>
          </AnimatePresence>
          <div className="flex gap-8 mb-6">
            {[{ value: '500+', label: 'Events' }, { value: '8,500+', label: 'Students' }, { value: '25+', label: 'Clubs' }].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl font-bold text-gold-400">{s.value}</p>
                <p className="text-sm text-white/60">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            {slideImages.map((_, i) => (
              <button key={i} onClick={() => setCurrentSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-8 bg-gold-400' : 'w-3 bg-white/40 hover:bg-white/60'}`} />
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/40 text-xs">© 2026 Galgotias University. All rights reserved.</p>
      </div>

      {/* Right panel — Login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-dark-900">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-block">
              <img src="/gu-logo-full.png" alt="Galgotias University" className="h-12 w-auto object-contain mx-auto" />
            </Link>
          </div>

          {/* Portal Toggle */}
          <div className="flex bg-white dark:bg-dark-800 rounded-xl p-1.5 mb-5 shadow-sm border border-dark-100 dark:border-dark-700">
            <button onClick={() => setPortal('student')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${portal === 'student' ? 'bg-gu-600 text-white shadow-md' : 'text-dark-500 dark:text-dark-400 hover:bg-gray-50 dark:hover:bg-dark-700'}`}>
              <HiOutlineAcademicCap className="w-5 h-5" /> Student Portal
            </button>
            <button onClick={() => setPortal('organizer')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${portal === 'organizer' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md' : 'text-dark-500 dark:text-dark-400 hover:bg-gray-50 dark:hover:bg-dark-700'}`}>
              <HiOutlineShieldCheck className="w-5 h-5" /> Organizer Portal
            </button>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-dark-100 dark:border-dark-700 p-8">
            <AnimatePresence mode="wait">
              <motion.div key={portal} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>

                {portal === 'student' ? (
                  /* ─── STUDENT PORTAL ─── */
                  <>
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-gu-700 dark:text-white">
                        {tab === 'login' ? 'Student Login' : tab === 'signup' ? 'Create Student Account' : 'Reset Password'}
                      </h2>
                      <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">
                        {tab === 'login' ? 'Sign in to register for events and view certificates' : tab === 'signup' ? 'Register with your university email' : 'Enter your email to reset password'}
                      </p>
                    </div>

                    {/* Tab switcher */}
                    <div className="flex bg-gray-100 dark:bg-dark-700 rounded-lg p-1 mb-6">
                      {[{ k: 'login', l: 'Login' }, { k: 'signup', l: 'Sign Up' }].map(t => (
                        <button key={t.k} onClick={() => { setTab(t.k); setError(''); }}
                          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${tab === t.k ? 'bg-gu-600 text-white shadow-sm' : 'text-dark-500 dark:text-dark-400 hover:text-dark-700'}`}>
                          {t.l}
                        </button>
                      ))}
                    </div>

                    {/* Error message */}
                    <AnimatePresence>
                      {error && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/40">
                          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {tab === 'signup' && (
                        <>
                          {/* Name */}
                          <div className="relative">
                            <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                            <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="input-field !pl-10" required />
                          </div>
                          {/* Admission NO */}
                          <div className="relative">
                            <HiOutlineIdentification className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                            <input type="text" placeholder="Admission NO (e.g. GU2024CSE0451)" value={enrollmentId} onChange={e => setEnrollmentId(e.target.value)} className="input-field !pl-10" required />
                          </div>
                          {/* Department & Year */}
                          <div className="grid grid-cols-2 gap-3">
                            <select value={department} onChange={e => setDepartment(e.target.value)} className="input-field text-sm">
                              <option>B.Tech CSE</option>
                              <option>B.Tech ECE</option>
                              <option>B.Tech ME</option>
                              <option>B.Tech IT</option>
                              <option>BCA</option>
                              <option>MBA</option>
                              <option>MCA</option>
                              <option>B.Com</option>
                              <option>BBA</option>
                            </select>
                            <select value={year} onChange={e => setYear(e.target.value)} className="input-field text-sm">
                              <option>1st Year</option>
                              <option>2nd Year</option>
                              <option>3rd Year</option>
                              <option>4th Year</option>
                            </select>
                          </div>
                        </>
                      )}

                      {tab !== 'forgot' && (
                        <>
                          <div className="relative">
                            <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                            <input type="email" placeholder="student@galgotiasuniversity.edu.in" value={email} onChange={e => setEmail(e.target.value)} className="input-field !pl-10" required />
                          </div>
                          <div className="relative">
                            <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                            <input type={showPass ? 'text' : 'password'} placeholder={tab === 'signup' ? 'Create password (min 6 chars)' : 'Password'} value={password} onChange={e => setPassword(e.target.value)} className="input-field !pl-10 !pr-10" required />
                            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600">
                              {showPass ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                            </button>
                          </div>
                        </>
                      )}

                      {tab === 'forgot' && (
                        <div className="relative">
                          <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                          <input type="email" placeholder="Enter your university email" value={email} onChange={e => setEmail(e.target.value)} className="input-field !pl-10" required />
                        </div>
                      )}

                      <button type="submit" disabled={loading} className="btn-primary w-full !py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {loading ? (
                          <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Please wait...</>
                        ) : (
                          tab === 'login' ? 'Sign In' : tab === 'signup' ? 'Create Account' : 'Reset Password'
                        )}
                      </button>

                      {tab === 'login' && (
                        <button type="button" onClick={() => { setTab('forgot'); setError(''); }} className="w-full text-center text-sm text-gu-500 hover:text-gu-700 dark:text-gold-400 dark:hover:text-gold-300 font-medium mt-2 transition-colors">
                          Forgot Password?
                        </button>
                      )}
                    </form>
                  </>
                ) : (
                  /* ─── ORGANIZER / ADMIN PORTAL ─── */
                  <>
                    <div className="mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4">
                        <HiOutlineShieldCheck className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-dark-900 dark:text-white">Organizer Login</h2>
                      <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">
                        Authorized club heads, coordinators, and admins only. Use your assigned credentials.
                      </p>
                    </div>

                    {/* Role selector for organizer/admin */}
                    <div className="flex bg-gray-100 dark:bg-dark-700 rounded-lg p-1 mb-6">
                      {[{ k: 'organizer', l: '🎯 Organizer', desc: 'Club heads & coordinators' }, { k: 'admin', l: '👑 Admin', desc: 'University administrators' }].map(r => (
                        <button key={r.k} onClick={() => { setOrgRole(r.k); setError(''); }}
                          className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all ${orgRole === r.k ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm' : 'text-dark-500 dark:text-dark-400'}`}>
                          {r.l}
                        </button>
                      ))}
                    </div>

                    {/* Error message */}
                    <AnimatePresence>
                      {error && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/40">
                          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="relative">
                        <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                        <input type="email" placeholder={orgRole === 'admin' ? 'admin@galgotias.edu.in' : 'organizer@galgotias.edu.in'} value={email} onChange={e => setEmail(e.target.value)} className="input-field !pl-10" required />
                      </div>
                      <div className="relative">
                        <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                        <input type={showPass ? 'text' : 'password'} placeholder="Enter assigned password" value={password} onChange={e => setPassword(e.target.value)} className="input-field !pl-10 !pr-10" required />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600">
                          {showPass ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                        </button>
                      </div>

                      <button type="submit" disabled={loading} className="w-full !py-3 text-base font-semibold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {loading ? (
                          <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Connecting to server...</>
                        ) : (
                          <>🔐 Sign In as {orgRole === 'admin' ? 'Admin' : 'Organizer'}</>
                        )}
                      </button>
                    </form>

                    {/* Info box */}
                    <div className="mt-5 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800">
                      <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                        <strong>⚠️ Authorized Access Only</strong><br />
                        This portal is for designated club organizers and university administrators. Credentials are provided by the Student Council. Contact <span className="font-semibold">admin@galgotias.edu.in</span> if you need access.
                      </p>
                    </div>
                  </>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

          {/* NAAC accreditation badge */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <span className="text-xs text-dark-400">NAAC A+ Accredited</span>
            <span className="text-dark-300">•</span>
            <span className="text-xs text-dark-400">UGC Approved</span>
            <span className="text-dark-300">•</span>
            <span className="text-xs text-dark-400">Established by UP Govt.</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
