import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineCalendar, HiOutlineUserGroup, HiOutlineAcademicCap, HiOutlineStar, HiOutlineArrowRight, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineMoon, HiOutlineSun, HiOutlineMenu, HiOutlineX, HiOutlineChip, HiOutlineSparkles, HiOutlineFire, HiOutlineLightBulb, HiOutlinePresentationChartBar, HiOutlineCode, HiOutlinePlay, HiOutlinePhotograph } from 'react-icons/hi';
import { useTheme } from '../context/ThemeContext';
import { useRegistration } from '../context/RegistrationContext';
import { testimonials, categories } from '../data/constants';
import { useEventManagement } from '../context/EventManagementContext';
import { useClubManagement } from '../context/ClubManagementContext';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

function Navbar() {
  const { dark, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { const fn = () => setScrolled(window.scrollY > 20); window.addEventListener('scroll', fn); return () => window.removeEventListener('scroll', fn); }, []);

  return (
    <motion.nav initial={{ y: -100 }} animate={{ y: 0 }} className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-gu-900 backdrop-blur-md shadow-lg shadow-black/20' : 'bg-gu-800/90 backdrop-blur-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center">
          <img src="/gu-logo-full.png" alt="Galgotias University" className="h-10 object-contain transition-all duration-300" />
        </Link>
        <div className="hidden md:flex items-center gap-6">
          {['Events', 'Clubs', 'About'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium transition-colors hover:text-gold-400 text-white/80">{item}</a>
          ))}
          <button onClick={toggle} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            {dark ? <HiOutlineSun className="w-5 h-5 text-gold-400" /> : <HiOutlineMoon className="w-5 h-5 text-white" />}
          </button>
          <Link to="/login" className="btn-gold text-sm !px-5 !py-2">Get Started</Link>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2">
          {menuOpen ? <HiOutlineX className="w-6 h-6 text-white" /> : <HiOutlineMenu className="w-6 h-6 text-white" />}
        </button>
      </div>
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden bg-white dark:bg-dark-800 border-t dark:border-dark-700 px-4 py-4 space-y-3">
            {['Events', 'Clubs', 'About'].map(i => <a key={i} href={`#${i.toLowerCase()}`} className="block text-dark-700 dark:text-dark-200 py-2 font-medium">{i}</a>)}
            <Link to="/login" className="btn-gold block text-center text-sm">Get Started</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

function AnnouncementTicker() {
  return (
    <div className="bg-gold-400 text-gu-800 py-2 overflow-hidden mt-16">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...Array(2)].map((_, j) => (
          <div key={j} className="flex items-center gap-8 mr-8">
            <span className="font-semibold text-sm">📢 HackGU 2026 Registrations Open!</span>
            <span className="text-gu-600">|</span>
            <span className="font-semibold text-sm">🎭 Crescendo Cultural Fest — June 5-7</span>
            <span className="text-gu-600">|</span>
            <span className="font-semibold text-sm">🏆 18 Students Won Apple's Swift Challenge</span>
            <span className="text-gu-600">|</span>
            <span className="font-semibold text-sm">📅 AI/ML Workshop — May 15</span>
            <span className="text-gu-600">|</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Campus background image */}
      <div className="absolute inset-0">
        <img src="/gu-campus.png" alt="Galgotias University Campus" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 bg-gold-400/20 backdrop-blur-sm px-4 py-1.5 rounded-full mb-6 border border-gold-400/30">
              <span className="w-2 h-2 bg-gold-400 rounded-full animate-pulse" />
              <span className="text-gold-300 text-sm font-medium">Live Events Available</span>
            </div>
            <h1 className="leading-tight mb-6">
              <img src="/gu-logo-full.png" alt="Galgotias University" className="h-16 sm:h-20 lg:h-24 w-auto object-contain object-left mb-4" />
              <span className="text-2xl sm:text-3xl font-bold text-gold-400 mt-2 block font-sans">Event Management Platform</span>
            </h1>
            <p className="text-lg text-white/70 max-w-lg mb-8">Discover, organize, and participate in campus events. Hackathons, cultural fests, workshops, sports tournaments and more.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/login" className="btn-gold text-center text-lg !px-8 !py-3.5">Explore Events</Link>
              <Link to="/login" state={{ portal: 'organizer' }} className="px-8 py-3.5 text-white font-semibold rounded-lg border-2 border-white/30 hover:bg-white/10 transition-all text-lg text-center">Organize Event</Link>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="hidden lg:grid grid-cols-2 gap-4">
            {[
              { value: '500+', label: 'Events Organized', icon: HiOutlineCalendar },
              { value: '8,500+', label: 'Active Students', icon: HiOutlineUserGroup },
              { value: '25+', label: 'Clubs & Societies', icon: HiOutlineAcademicCap },
              { value: '4.8★', label: 'Average Rating', icon: HiOutlineStar },
            ].map((s, i) => (
              <motion.div key={i} whileHover={{ y: -4 }} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 text-center">
                <s.icon className="w-8 h-8 text-gold-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-sm text-white/60">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function NewsSlideshow() {
  const newsSlides = [
    {
      image: '/news-slide-1.jpg',
      title: 'Prompt Engineering Workshop',
      subtitle: 'By Ishpreet Singh — TEDx Speaker',
      description: 'Learn cutting-edge AI prompt techniques from industry expert Ishpreet Singh. Hosted by GU Student Council & Tech XPO.',
      date: 'Feb 15 • 1:30 PM – 5 PM',
      venue: 'C Block, Old Auditorium',
      badge: 'Workshop',
    },
    {
      image: '/news-slide-2.jpg',
      title: 'Social Scribe 3.0',
      subtitle: 'Content Writing & Social Media Workshop',
      description: 'Lingo Freaks & OP Club present the ultimate content creation workshop. Master storytelling, branding, and viral content strategies.',
      date: 'Coming Soon',
      venue: 'TBA',
      badge: 'Coming Soon',
    },
    {
      image: '/news-slide-3.jpg',
      title: 'Canon Photography Workshop',
      subtitle: 'By Virendra Adhikari — Pro Photographer',
      description: 'Cam Circle presents an exclusive hands-on photography workshop. Learn composition, lighting, and post-processing with Canon gear.',
      date: 'Coming Soon',
      venue: 'TBA',
      badge: 'Workshop',
    },
  ];

  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive(c => (c + 1) % newsSlides.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="py-14 bg-gray-50 dark:bg-dark-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-8">
          <h2 className="section-title">📰 Event News & Updates</h2>
          <div className="section-divider" />
          <p className="section-subtitle mt-3">What's buzzing on campus right now</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-dark-800 border border-dark-100 dark:border-dark-700"
        >
          <div className="grid lg:grid-cols-12">
            {/* Left: Poster image - narrower, portrait-oriented */}
            <div className="relative lg:col-span-5 h-72 sm:h-96 lg:h-[520px] overflow-hidden bg-dark-900">
              <AnimatePresence mode="wait">
                <motion.img
                  key={active}
                  src={newsSlides[active].image}
                  alt={newsSlides[active].title}
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  className="absolute inset-0 w-full h-full object-cover object-top"
                />
              </AnimatePresence>

              {/* Nav arrows */}
              <button onClick={() => setActive(c => (c - 1 + newsSlides.length) % newsSlides.length)} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/50 transition-colors z-10">
                <HiOutlineChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button onClick={() => setActive(c => (c + 1) % newsSlides.length)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/50 transition-colors z-10">
                <HiOutlineChevronRight className="w-5 h-5 text-white" />
              </button>

              {/* NEW badge */}
              <div className="absolute top-4 left-4 z-10">
                <span className="inline-flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                  🔴 New
                </span>
              </div>
            </div>

            {/* Right: Content */}
            <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-gu-600 text-white">{newsSlides[active].badge}</span>
                    <span className="text-[10px] font-medium text-dark-400">📅 {newsSlides[active].date}</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-dark-900 dark:text-white leading-tight">{newsSlides[active].title}</h3>
                  <p className="text-gu-600 dark:text-gold-400 font-semibold text-sm">{newsSlides[active].subtitle}</p>
                  <p className="text-dark-500 dark:text-dark-400 text-sm leading-relaxed">{newsSlides[active].description}</p>
                  {newsSlides[active].venue !== 'TBA' && (
                    <p className="text-xs text-dark-400 flex items-center gap-1">📍 {newsSlides[active].venue}</p>
                  )}
                  <Link to="/login" className="btn-primary inline-flex items-center gap-2 !px-6 !py-2.5 text-sm mt-2">
                    Learn More <HiOutlineArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              </AnimatePresence>

              {/* Dots nav */}
              <div className="flex gap-2 mt-6">
                {newsSlides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${i === active ? 'w-8 bg-gu-600 dark:bg-gold-400' : 'w-2 bg-dark-200 dark:bg-dark-600 hover:bg-dark-300'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function EventCarousel() {
  const { getAllEvents } = useEventManagement();
  const { getApprovedRequestsForEvent } = useRegistration();
  const events = getAllEvents();
  const featured = events.filter(e => e.featured).map(e => ({
    ...e,
    currentRegistrations: (e.registrations || 0) + getApprovedRequestsForEvent(e.id).length
  }));
  const [current, setCurrent] = useState(0);
  useEffect(() => { const t = setInterval(() => setCurrent(c => (c + 1) % featured.length), 4000); return () => clearInterval(t); }, [featured.length]);
  return (
    <section id="events" className="py-16 bg-white dark:bg-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-10">
          <h2 className="section-title">Featured Events</h2>
          <div className="section-divider" />
          <p className="section-subtitle mt-3">Don't miss these trending events on campus</p>
        </motion.div>
        <div className="relative overflow-hidden rounded-xl shadow-xl">
          <AnimatePresence mode="popLayout">
            <motion.div key={current} initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ duration: 0.5, ease: 'easeInOut' }} className="relative h-[400px] md:h-[480px]">
              <img src={featured[current]?.poster} alt={featured[current]?.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-gu-900/90 via-gu-900/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                <span className="badge-gold mb-3 inline-block">{featured[current]?.category}</span>
                <h3 className="text-2xl md:text-4xl font-bold text-white mb-2">{featured[current]?.title}</h3>
                <p className="text-white/70 mb-4 max-w-xl">{featured[current]?.description}</p>
                <div className="flex items-center gap-4 text-white/80 text-sm">
                  <span>📍 {featured[current]?.venue}</span>
                  <span>📅 {featured[current]?.date}</span>
                  <span>👥 {featured[current]?.currentRegistrations} registered</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          <button onClick={() => setCurrent(c => (c - 1 + featured.length) % featured.length)} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/40 transition-colors"><HiOutlineChevronLeft className="w-6 h-6 text-white" /></button>
          <button onClick={() => setCurrent(c => (c + 1) % featured.length)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/40 transition-colors"><HiOutlineChevronRight className="w-6 h-6 text-white" /></button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {featured.map((_, i) => (<button key={i} onClick={() => setCurrent(i)} className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? 'bg-gold-400 w-7' : 'bg-white/40'}`} />))}
          </div>
        </div>
      </div>
    </section>
  );
}

const sihImages = [
  { src: '/sih-1.jpg', label: 'Team with KRITRIM Robot' },
  { src: '/sih-2.jpg', label: 'Grand Audience at Galgotias' },
  { src: '/sih-3.jpg', label: 'Winner — ₹75,000 Prize' },
  { src: '/sih-4.jpg', label: 'Victory Celebration' },
  { src: '/sih-5.jpg', label: 'Participants on Stage' },
  { src: '/sih-6.jpg', label: 'Judges Panel' },
  { src: '/sih-7.jpg', label: 'Wellness Session at Campus' },
  { src: '/sih-8.jpg', label: 'Hardware Project Demo' },
];

function SIHShowcase() {
  const [sihActive, setSihActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSihActive(c => (c + 1) % sihImages.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="py-16 bg-gray-50 dark:bg-dark-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-10">
          <h2 className="section-title">🏆 Event Spotlight</h2>
          <div className="section-divider" />
          <p className="section-subtitle mt-3">Great events we've proudly hosted</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-white/10 shadow-2xl"
        >
          {/* Pin icon */}
          <div className="absolute top-3 right-4 z-20 flex items-center gap-1.5 bg-amber-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg" style={{ transform: 'rotate(3deg)' }}>
            <span className="text-lg leading-none">📌</span>
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Pinned</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-0">
            {/* Left: Image Carousel */}
            <div className="relative h-72 sm:h-80 lg:h-[420px] overflow-hidden">
              <AnimatePresence mode="popLayout">
                <motion.img
                  key={sihActive}
                  src={sihImages[sihActive].src}
                  alt={sihImages[sihActive].label}
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0f172a]/80 hidden lg:block" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent lg:hidden" />

              {/* Carousel controls */}
              <button onClick={() => setSihActive(c => (c - 1 + sihImages.length) % sihImages.length)} className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60 transition-colors z-10">
                <HiOutlineChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button onClick={() => setSihActive(c => (c + 1) % sihImages.length)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60 transition-colors z-10">
                <HiOutlineChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Right: Info */}
            <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 bg-gold-400/15 px-3 py-1 rounded-full mb-4 w-fit border border-gold-400/30">
                <HiOutlineStar className="w-4 h-4 text-gold-400" />
                <span className="text-gold-400 text-xs font-semibold uppercase tracking-wider">Past Event Highlight</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight">
                Smart India Hackathon 2025
                <span className="block text-lg sm:text-xl text-gold-400 font-semibold mt-1">Hardware Edition — Grand Finale</span>
              </h2>

              <p className="text-white/60 text-sm sm:text-base leading-relaxed mb-6">
                Galgotias University proudly hosted the <strong className="text-white/90">SIH 2025 Hardware Edition Grand Finale</strong>,
                where Team <strong className="text-gold-400">OuroBonics</strong> won ₹75,000 with their humanoid robot
                <strong className="text-white/90"> KRITRIM</strong> — a fully 3D-printed AI-powered robot that stunned judges and audiences alike.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { value: '500+', label: 'Participants' },
                  { value: '₹75K', label: 'Prize Won' },
                  { value: '36hrs', label: 'Non-stop' },
                  { value: 'Dec 2025', label: 'Grand Finale' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                    <p className="text-white font-bold text-sm">{stat.value}</p>
                    <p className="text-white/40 text-[10px]">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20 font-medium">🤖 Robotics</span>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-medium">🏆 National Winner</span>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/20 font-medium">🧠 AI/ML</span>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 font-medium">⚙️ Hardware</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function UniFestShowcase() {
  const [showVideo, setShowVideo] = useState(false);
  const galleryImages = [
    { src: '/slide-1.jpg', label: 'Live Performance' },
    { src: '/slide-3.jpg', label: 'Sur Tal Classical' },
    { src: '/slide-4.jpg', label: 'Cultural Showcase' },
    { src: '/tt-hustle-1.jpg', label: 'TT Hustle 2.0' },
  ];
  const [activeImg, setActiveImg] = useState(0);

  return (
    <section className="relative overflow-hidden">
      {/* Main Hero Background */}
      <div className="relative min-h-[70vh] md:min-h-[80vh] flex items-center">
        {/* Background image with Ken Burns effect */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={activeImg}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <img
              src={galleryImages[activeImg].src}
              alt="UniFest"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* Overlay gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-gu-900/85 via-gu-900/60 to-gu-900/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-gu-900/80 via-transparent to-gu-900/40" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 bg-gold-400/20 backdrop-blur-sm px-4 py-1.5 rounded-full mb-6 border border-gold-400/30">
                <HiOutlineSparkles className="w-4 h-4 text-gold-400" />
                <span className="text-gold-300 text-sm font-semibold">Our Success Story</span>
              </div>

              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                Life at{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-amber-300">
                  UniFest
                </span>
              </h2>

              <p className="text-xl text-white/60 italic mb-2 font-serif">
                "Welcome to Our World — Embrace Your Future"
              </p>

              <p className="text-white/70 text-lg mb-8 max-w-lg leading-relaxed">
                Experience the electrifying energy of Galgotias University's biggest cultural extravaganza.
                From soul-stirring classical performances to high-energy stage shows, UniFest brings
                together art, music, dance, and innovation under one roof.
              </p>

              {/* Stats row */}
              <div className="flex flex-wrap gap-6 mb-8">
                {[
                  { value: '5,000+', label: 'Attendees' },
                  { value: '50+', label: 'Events' },
                  { value: '25+', label: 'Clubs' },
                  { value: '3 Days', label: 'Festival' },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="text-center"
                  >
                    <p className="text-2xl sm:text-3xl font-bold text-gold-400">{stat.value}</p>
                    <p className="text-white/50 text-sm">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              <Link to="/login" className="btn-gold text-lg !px-8 !py-3.5 inline-flex items-center gap-2">
                Explore UniFest <HiOutlineArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>

            {/* Right: Play button + Gallery */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="flex flex-col items-center gap-6"
            >
              {/* Play button circle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowVideo(true)}
                className="relative group"
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center group-hover:bg-gold-400/30 group-hover:border-gold-400/60 transition-all duration-300">
                  <HiOutlinePlay className="w-10 h-10 sm:w-12 sm:h-12 text-white ml-1" />
                </div>
                {/* Pulsing rings */}
                <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute -inset-3 rounded-full border border-white/10 animate-ping" style={{ animationDuration: '3s' }} />
              </motion.button>
              <p className="text-white/60 text-sm font-medium">Watch UniFest Highlights</p>

              {/* Mini gallery thumbnails */}
              <div className="flex gap-3 mt-2">
                {galleryImages.map((img, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ y: -4, scale: 1.05 }}
                    onClick={() => setActiveImg(i)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                      i === activeImg
                        ? 'border-gold-400 shadow-lg shadow-gold-400/30'
                        : 'border-white/20 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.src} alt={img.label} className="w-full h-full object-cover" />
                    {i === activeImg && (
                      <div className="absolute inset-0 bg-gold-400/20" />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Wavy bottom edge */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" className="w-full h-auto block fill-gray-50 dark:fill-dark-950">
          <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z" />
        </svg>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setShowVideo(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-4xl w-full aspect-video rounded-2xl overflow-hidden bg-dark-900 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <video
                controls
                autoPlay
                className="w-full h-full object-contain bg-black"
                src="/unifest-video.mp4"
              >
                Your browser does not support the video tag.
              </video>
              <button
                onClick={() => setShowVideo(false)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <HiOutlineX className="w-6 h-6 text-white" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function CoreTeam() {
  const team = [
    { name: 'Saksham Saxena', role: 'President', image: '/core-saksham.png' },
    { name: 'Saurav Kumar', role: 'Vice President (Social Media)', image: '/core-saurav.png' },
    { name: 'Viraj Singh', role: 'Vice President (Cultural)', image: '/core-viraj.png' },
    { name: 'Sarvagya Kumar', role: 'Vice President (Operations)', image: '/core-sarvagya-updated.png' },
    { name: 'Priyanshu', role: 'Vice President', image: '/core-sarvagya.png' },
    { name: 'Dakshita Gupta', role: 'Vice President (Outreach & Sponsorship)', image: '/core-dakshita.png' }
  ];

  return (
    <section className="py-24 bg-[#0a0a0a] relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">Core Organizers</h2>
          <div className="w-24 h-1.5 bg-gold-400 mx-auto rounded-full" />
        </motion.div>

        <div className="overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
          <div className="flex gap-4 md:gap-6 w-max mx-auto">
            {team.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center group flex-shrink-0 w-32 sm:w-36 lg:w-40"
              >
                {/* Card Container */}
                <div className="w-full aspect-[3/4] rounded-xl bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] overflow-hidden mb-3 border border-white/5 group-hover:border-white/10 transition-colors shadow-xl">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                
                {/* Text */}
                <h3 className="text-white font-semibold text-sm sm:text-base text-center">{member.name}</h3>
                <p className="text-white/60 text-[10px] sm:text-xs text-center mt-0.5 font-medium">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Categories() {
  const categoryCards = [
    { name: 'Technical', count: 28, color: 'bg-blue-500', glow: 'bg-blue-400', icon: HiOutlineChip, desc: 'Coding contests, tech talks & dev sprints' },
    { name: 'Cultural', count: 22, color: 'bg-rose-500', glow: 'bg-pink-400', icon: HiOutlineSparkles, desc: 'Fests, music nights & creative showcases' },
    { name: 'Sports', count: 15, color: 'bg-emerald-500', glow: 'bg-green-400', icon: HiOutlineFire, desc: 'Tournaments, matches & athletic events' },
    { name: 'Workshops', count: 18, color: 'bg-amber-500', glow: 'bg-orange-400', icon: HiOutlineLightBulb, desc: 'Hands-on learning & skill-building sessions' },
    { name: 'Seminars', count: 12, color: 'bg-violet-500', glow: 'bg-purple-400', icon: HiOutlinePresentationChartBar, desc: 'Guest lectures, panels & keynotes' },
    { name: 'Hackathons', count: 8, color: 'bg-cyan-500', glow: 'bg-sky-400', icon: HiOutlineCode, desc: 'Build, hack & ship in 24-48 hours' },
  ];

  return (
    <section className="py-20 bg-gray-50 dark:bg-dark-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12 relative">
          <h2 className="section-title">Explore Categories</h2><div className="section-divider" />
          <p className="section-subtitle mt-3">Find events that match your interests</p>
        </motion.div>
        
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {categoryCards.map((cat, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              whileHover={{ y: -6, scale: 1.02 }}
              className={`relative rounded-2xl overflow-hidden cursor-pointer group bg-white dark:bg-dark-800 border border-dark-100 dark:border-dark-700 shadow-sm hover:shadow-xl transition-all duration-300 ${i < 2 ? 'row-span-1' : ''}`}
            >
              {/* Animated Background Elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 group-hover:opacity-100 transition-opacity duration-500">
                <motion.div 
                  animate={{ 
                    x: [0, 20, -20, 0],
                    y: [0, -20, 20, 0],
                    scale: [1, 1.2, 0.8, 1]
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl ${cat.glow}`} 
                />
                <motion.div 
                  animate={{ 
                    x: [0, -30, 30, 0],
                    y: [0, 30, -30, 0],
                    scale: [0.8, 1.2, 1, 0.8]
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: 1 }}
                  className={`absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl ${cat.color} opacity-50`} 
                />
              </div>
              
              <div className="relative z-10 p-6 md:p-7 flex flex-col justify-between min-h-[160px] md:min-h-[180px]">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm ${cat.color} bg-opacity-10 dark:bg-opacity-20 text-gu-700 dark:text-white group-hover:bg-opacity-100 group-hover:text-white`}>
                    <cat.icon className="w-6 h-6" />
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${cat.color} bg-opacity-10 text-gu-700 dark:text-gray-300 dark:bg-opacity-20 group-hover:bg-opacity-20 group-hover:text-white transition-colors backdrop-blur-sm border border-dark-100 dark:border-dark-600`}>
                    {cat.count} events
                  </span>
                </div>
                <div className="mt-6">
                  <h3 className="text-xl font-bold text-gu-800 dark:text-white mb-1 group-hover:text-gu-600 dark:group-hover:text-gold-400 transition-all">{cat.name}</h3>
                  <p className="text-dark-500 dark:text-dark-400 text-sm leading-snug group-hover:text-dark-600 dark:group-hover:text-dark-300 transition-colors">{cat.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function UpcomingEvents() {
  const { getAllEvents } = useEventManagement();
  const { getApprovedRequestsForEvent } = useRegistration();
  const events = getAllEvents();
  const upcoming = events.filter(e => e.status === 'upcoming').slice(0, 6).map(e => ({
    ...e,
    currentRegistrations: (e.registrations || 0) + getApprovedRequestsForEvent(e.id).length
  }));
  return (
    <section className="py-16 bg-white dark:bg-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex items-end justify-between mb-10">
          <div><h2 className="section-title">Upcoming Events</h2><div className="section-divider !mx-0 mt-2" /><p className="section-subtitle mt-3">Register before spots fill up!</p></div>
          <Link to="/login" className="hidden md:flex items-center gap-2 text-gu-600 dark:text-gold-400 font-semibold hover:gap-3 transition-all">View All <HiOutlineArrowRight /></Link>
        </motion.div>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcoming.map(event => (
            <motion.div key={event.id} variants={fadeUp} whileHover={{ y: -4 }} className="card overflow-hidden group">
              <div className="relative h-48 overflow-hidden">
                <img src={event.poster} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 right-3"><span className="badge-gold">{event.category}</span></div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg text-gu-700 dark:text-white mb-2 group-hover:text-gold-500 dark:group-hover:text-gold-400 transition-colors">{event.title}</h3>
                <p className="text-dark-500 dark:text-dark-400 text-sm line-clamp-2 mb-3">{event.description}</p>
                <div className="flex items-center gap-3 text-xs text-dark-400 mb-4"><span>📍 {event.venue}</span><span>📅 {event.date}</span></div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-500">👥 {event.currentRegistrations}/{event.maxCapacity}</span>
                  <Link to="/login" className="text-gu-600 dark:text-gold-400 text-sm font-semibold hover:underline">Register →</Link>
                </div>
                <div className="mt-3 h-1.5 bg-dark-100 dark:bg-dark-700 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-gu-500 to-gold-400 rounded-full" initial={{ width: 0 }} whileInView={{ width: `${(event.currentRegistrations / event.maxCapacity) * 100}%` }} viewport={{ once: true }} transition={{ duration: 1 }} />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function EventCalendar() {
  const { getAllEvents } = useEventManagement();
  const events = getAllEvents();
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 4, 1)); // May 2026
  const [selectedDate, setSelectedDate] = useState(null);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  // Get events for current month
  const monthEvents = events.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const getEventsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return monthEvents.filter(e => e.date === dateStr);
  };

  const selectedEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  return (
    <section className="py-16 bg-white dark:bg-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-10">
          <h2 className="section-title">📅 Event Calendar</h2>
          <div className="section-divider" />
          <p className="section-subtitle mt-3">See what's happening this month</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid lg:grid-cols-3 gap-6"
        >
          {/* Calendar */}
          <div className="lg:col-span-2 card p-6">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors">
                <HiOutlineChevronLeft className="w-5 h-5 text-dark-600 dark:text-dark-300" />
              </button>
              <h3 className="text-xl font-bold text-dark-900 dark:text-white">{monthNames[month]} {year}</h3>
              <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors">
                <HiOutlineChevronRight className="w-5 h-5 text-dark-600 dark:text-dark-300" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-dark-400 py-2">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before month start */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-14 sm:h-16" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayEvents = getEventsForDay(day);
                const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                const isSelected = selectedDate === day;
                const hasEvents = dayEvents.length > 0;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(isSelected ? null : day)}
                    className={`relative h-14 sm:h-16 rounded-xl text-sm font-medium transition-all
                      ${isSelected ? 'bg-gu-600 text-white shadow-lg scale-105' :
                        isToday ? 'bg-gold-400/15 text-gold-600 dark:text-gold-400 border border-gold-400/30' :
                        hasEvents ? 'bg-gray-50 dark:bg-dark-700/50 text-dark-900 dark:text-white hover:bg-gu-50 dark:hover:bg-dark-700' :
                        'text-dark-500 dark:text-dark-400 hover:bg-gray-50 dark:hover:bg-dark-800'}
                    `}
                  >
                    <span className="block">{day}</span>
                    {hasEvents && (
                      <div className="flex justify-center gap-0.5 mt-0.5">
                        {dayEvents.slice(0, 3).map((_, ei) => (
                          <span key={ei} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-gu-500'}`} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-dark-100 dark:border-dark-700">
              <div className="flex items-center gap-1.5 text-xs text-dark-400">
                <span className="w-2 h-2 rounded-full bg-gu-500"></span> Event day
              </div>
              <div className="flex items-center gap-1.5 text-xs text-dark-400">
                <span className="w-2 h-2 rounded-full bg-gold-400"></span> Today
              </div>
            </div>
          </div>

          {/* Events sidebar */}
          <div className="card p-6">
            <h3 className="font-bold text-lg text-dark-900 dark:text-white mb-4">
              {selectedDate
                ? `Events on ${monthNames[month]} ${selectedDate}`
                : `${monthNames[month]} Overview`}
            </h3>

            {selectedDate && selectedEvents.length > 0 ? (
              <div className="space-y-3">
                {selectedEvents.map(event => (
                  <Link key={event.id} to="/login" className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors group border border-dark-100 dark:border-dark-700">
                    <img src={event.poster} alt="" className="w-14 h-10 rounded-lg object-cover flex-shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm text-dark-900 dark:text-white group-hover:text-gu-600 dark:group-hover:text-gold-400 transition-colors truncate">{event.title}</h4>
                      <p className="text-[11px] text-dark-400 mt-0.5">🕐 {event.time} • 📍 {event.venue}</p>
                      <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${event.status === 'upcoming' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        {event.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : selectedDate ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-dark-400 text-sm">No events on this day</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <p className="text-4xl mb-3">👈</p>
                  <p className="text-dark-400 text-sm">Click a day to see events</p>
                </div>
                <div className="border-t border-dark-100 dark:border-dark-700 pt-4">
                  <p className="text-xs font-semibold text-dark-400 uppercase mb-3">This month</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-500 dark:text-dark-400">Total Events</span>
                      <span className="font-bold text-dark-900 dark:text-white">{monthEvents.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-500 dark:text-dark-400">Upcoming</span>
                      <span className="font-bold text-emerald-500">{monthEvents.filter(e => e.status === 'upcoming').length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-500 dark:text-dark-400">Completed</span>
                      <span className="font-bold text-blue-500">{monthEvents.filter(e => e.status === 'completed').length}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FeaturedClubs() {
  const { getAllClubs } = useClubManagement();
  const clubs = getAllClubs();
  const featured = clubs.filter(c => c.logo).slice(0, 6);
  return (
    <section id="clubs" className="py-16 bg-gray-50 dark:bg-dark-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-10">
          <h2 className="section-title">Clubs & Societies</h2><div className="section-divider" />
          <p className="section-subtitle mt-3">Join a community that shares your passion — {clubs.length} clubs at Galgotias</p>
        </motion.div>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map(club => (
            <motion.div key={club.id} variants={fadeUp} whileHover={{ y: -4 }} className="card p-6 text-center border-t-4 border-t-gu-500">
              <div className="w-20 h-20 rounded-xl bg-white dark:bg-dark-700 shadow-md flex items-center justify-center mx-auto mb-4 overflow-hidden p-2 border border-dark-100 dark:border-dark-600"><img src={club.logo} alt={club.name} className="w-full h-full object-contain" /></div>
              <h3 className="font-bold text-lg text-gu-700 dark:text-white mb-2">{club.name}</h3>
              <p className="text-dark-500 dark:text-dark-400 text-sm mb-4 line-clamp-2">{club.description}</p>
              <div className="flex justify-center gap-6 text-sm text-dark-500 dark:text-dark-400"><span>👥 {club.members}</span><span>📅 {club.events} events</span></div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="py-16 bg-white dark:bg-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-10">
          <h2 className="section-title">What People Say</h2><div className="section-divider" /><p className="section-subtitle mt-3">Trusted by students and faculty</p>
        </motion.div>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-3 gap-6">
          {testimonials.map(t => (
            <motion.div key={t.id} variants={fadeUp} whileHover={{ y: -4 }} className="card p-6 border-t-4 border-t-gold-400">
              <div className="flex items-center gap-1 mb-4">{[...Array(t.rating)].map((_, i) => <HiOutlineStar key={i} className="w-5 h-5 text-gold-400 fill-gold-400" />)}</div>
              <p className="text-dark-600 dark:text-dark-300 mb-4 italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gu-600 flex items-center justify-center text-white font-semibold text-sm">{t.avatar}</div>
                <div><p className="font-semibold text-gu-700 dark:text-white text-sm">{t.name}</p><p className="text-dark-500 dark:text-dark-400 text-xs">{t.role}</p></div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-16 gradient-hero relative overflow-hidden">
      <div className="absolute inset-0"><div className="absolute w-96 h-96 rounded-full bg-gold-400/5 top-0 right-0" /><div className="absolute w-64 h-64 rounded-full bg-white/5 bottom-0 left-20" /></div>
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Organize Your Next Event?</h2>
          <p className="text-gu-100/70 text-lg mb-8">Join thousands of students and organizers on Galgotias University's premier event platform.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login" className="btn-gold text-lg !px-8 !py-3.5">Get Started Free</Link>
            <Link to="/login" className="px-8 py-3.5 text-white font-semibold rounded-lg border-2 border-white/30 hover:bg-white/10 transition-all text-lg">Learn More</Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="about" className="bg-gu-800 dark:bg-gu-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-lg overflow-hidden bg-white flex items-center justify-center"><img src="/gu-logo.png" alt="GU" className="w-full h-full object-contain p-0.5" /></div>
              <div><span className="text-white block leading-none tracking-wide" style={{fontFamily: "'Playfair Display', serif"}}><span className="text-sm font-bold">GALGOTIAS</span><br/><span className="text-[9px] font-semibold tracking-[0.2em]">UNIVERSITY</span></span><span className="text-gold-400 text-[10px] block mt-0.5">Event Management</span></div>
            </div>
            <p className="text-gu-200/60 text-sm">Plot No.2, Sector 17-A, Yamuna Expressway, Greater Noida, UP 203201</p>
            <div className="mt-4 flex gap-2"><span className="badge bg-gold-400/20 text-gold-400 text-[10px]">NAAC A+</span><span className="badge bg-gold-400/20 text-gold-400 text-[10px]">UGC</span></div>
          </div>
          {[
            { title: 'Quick Links', links: ['Events', 'Clubs', 'Venues', 'Analytics'] },
            { title: 'Resources', links: ['Help Center', 'Guidelines', 'Contact Us', 'FAQs'] },
            { title: 'University', links: ['About GU', 'Admissions', 'Campus Life', 'Placements'] },
          ].map(col => (
            <div key={col.title}><h4 className="font-bold mb-4 text-gold-400 text-sm uppercase tracking-wider">{col.title}</h4>
              <ul className="space-y-2">{col.links.map(l => <li key={l}><a href="#" className="text-gu-200/60 hover:text-gold-400 text-sm transition-colors">{l}</a></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="border-t border-gu-600 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gu-200/40 text-sm">© 2026 Galgotias University. All rights reserved.</p>
          <div className="flex gap-4 text-gu-200/40">{['Privacy', 'Terms', 'Support'].map(l => <a key={l} href="#" className="text-sm hover:text-gold-400 transition-colors">{l}</a>)}</div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <AnnouncementTicker />
      <Hero />
      <NewsSlideshow />
      <EventCarousel />
      <Categories />
      <UpcomingEvents />
      <SIHShowcase />
      <UniFestShowcase />
      <FeaturedClubs />
      <CoreTeam />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}
