import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCode } from 'react-qr-code';
import { HiOutlineDownload, HiOutlineEye, HiOutlineAcademicCap, HiOutlineX } from 'react-icons/hi';
import { useCertificates } from '../context/CertificateContext';
import { useAuth } from '../context/AuthContext';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const gradeColors = { Platinum: 'from-slate-400 to-slate-600', Gold: 'from-amber-400 to-amber-600', Silver: 'from-gray-300 to-gray-500' };
const gradeLabels = { Winner: '🥇 Winner', 'Runner-up': '🥈 1st Runner-up', '3rd Place': '🥉 2nd Runner-up', Participation: '👥 Participant', Completion: '✅ Completed' };

export default function CertificatesPage() {
  const { user } = useAuth();
  const { getCertificatesForStudent, getCertificatesByUserId, certificates: allCertificates } = useCertificates();
  const [viewCert, setViewCert] = useState(null);
  const canvasRef = useRef(null);

  // Students see their own certificates; admins see all
  const certificates = user?.role === 'admin' 
    ? allCertificates 
    : (user?.id ? getCertificatesByUserId(user.id, user.name) : getCertificatesForStudent(user?.name || ''));

  const handleDownload = useCallback((cert) => {
    if (!cert.templateUrl) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      // Overlay only student name (template already has event name, date, etc.)
      const fontSize = Math.max(Math.round(img.width / 18), 32);
      ctx.font = `bold ${fontSize}px 'Georgia', serif`;
      ctx.fillStyle = '#1a1a2e';
      ctx.textAlign = 'center';
      ctx.fillText(cert.studentName, img.width / 2, img.height * 0.52);
      // Download
      const link = document.createElement('a');
      link.download = `${cert.studentName}_${cert.eventName}_${cert.type}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = cert.templateUrl;
  }, []);

  return (
    <div className="space-y-6">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
          {user?.role === 'admin' ? 'All Certificates' : 'My Certificates'}
        </h1>
        <p className="text-dark-500 dark:text-dark-400 mt-1">View and download your event certificates</p>
      </motion.div>

      {certificates.length === 0 ? (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-dark-700 flex items-center justify-center mx-auto mb-4">
            <HiOutlineAcademicCap className="w-8 h-8 text-dark-400" />
          </div>
          <h3 className="text-lg font-semibold text-dark-700 dark:text-dark-300 mb-2">No Certificates Yet</h3>
          <p className="text-dark-400 text-sm max-w-md mx-auto">
            Certificates will appear here once an organizer declares results for an event you've participated in.
          </p>
        </motion.div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="grid md:grid-cols-2 gap-6">
          {certificates.map(cert => (
            <motion.div key={cert.id} variants={fadeUp} whileHover={{ y: -3 }} className="card overflow-hidden">
              {/* Certificate preview */}
              <div className="relative">
                {cert.templateUrl ? (
                  <div className="relative">
                    <img src={cert.templateUrl} alt="Certificate" className="w-full h-auto" />
                    {/* Name overlay — only student name, template has the rest */}
                    <div className="absolute inset-x-0 flex items-center justify-center" style={{ top: '52%' }}>
                      <p className="text-lg md:text-2xl font-bold text-gray-900 drop-shadow-sm" style={{ fontFamily: 'Georgia, serif' }}>
                        {cert.studentName}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-gu-50 to-blue-50 dark:from-dark-700 dark:to-dark-600 p-6">
                    <div className="border-2 border-gu-200 dark:border-gu-700 rounded-xl p-6 bg-white dark:bg-dark-800 text-center">
                      <div className="flex justify-center mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gu-600 to-gu-500 flex items-center justify-center">
                          <HiOutlineAcademicCap className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <p className="text-xs text-dark-400 uppercase tracking-wider mb-1">Certificate of {cert.type}</p>
                      <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-1">{cert.studentName}</h3>
                      <p className="text-sm text-dark-500 dark:text-dark-400 mb-3">has successfully participated in</p>
                      <p className="text-base font-bold text-gu-600 dark:text-gold-400 mb-3">{cert.eventName}</p>
                      <p className="text-xs text-dark-400">Date: {cert.date}</p>
                      <div className="mt-4 flex justify-center">
                        <QRCode value={cert.qrCode} size={64} level="M" bgColor="transparent" fgColor="#1e40af" />
                      </div>
                      <p className="text-xs text-dark-400 mt-2 font-mono">{cert.qrCode}</p>
                    </div>
                  </div>
                )}
                {/* Grade badge */}
                <div className="absolute top-3 right-3">
                  <span className={`badge bg-gradient-to-r ${gradeColors[cert.grade] || gradeColors.Silver} text-white`}>
                    {gradeLabels[cert.type] || cert.type}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 flex gap-2">
                <button onClick={() => handleDownload(cert)} className="btn-primary flex-1 flex items-center justify-center gap-2 !py-2.5 text-sm">
                  <HiOutlineDownload className="w-4 h-4" /> Download
                </button>
                <button onClick={() => setViewCert(cert)} className="btn-secondary flex items-center justify-center gap-2 !py-2.5 text-sm !px-4">
                  <HiOutlineEye className="w-4 h-4" /> View
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Full-screen certificate viewer */}
      <AnimatePresence>
        {viewCert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setViewCert(null)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-3xl w-full max-h-[90vh] overflow-auto bg-white dark:bg-dark-800 rounded-2xl shadow-2xl"
            >
              <button onClick={() => setViewCert(null)} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors">
                <HiOutlineX className="w-5 h-5" />
              </button>
              {viewCert.templateUrl ? (
                <div className="relative">
                  <img src={viewCert.templateUrl} alt="Certificate" className="w-full h-auto rounded-t-2xl" />
                  <div className="absolute inset-x-0 flex items-center justify-center" style={{ top: '52%' }}>
                    <p className="text-2xl md:text-4xl font-bold text-gray-900 drop-shadow-md" style={{ fontFamily: 'Georgia, serif' }}>
                      {viewCert.studentName}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center">
                  <HiOutlineAcademicCap className="w-16 h-16 mx-auto text-gu-500 mb-4" />
                  <p className="text-xs text-dark-400 uppercase tracking-wider mb-2">Certificate of {viewCert.type}</p>
                  <h3 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">{viewCert.studentName}</h3>
                  <p className="text-dark-500 dark:text-dark-400 mb-1">has successfully participated in</p>
                  <p className="text-xl font-bold text-gu-600 dark:text-gold-400 mb-4">{viewCert.eventName}</p>
                  <p className="text-sm text-dark-400 mb-6">Date: {viewCert.date}</p>
                  <div className="flex justify-center mb-3">
                    <QRCode value={viewCert.qrCode} size={100} level="M" bgColor="transparent" fgColor="#1e40af" />
                  </div>
                  <p className="text-xs text-dark-400 font-mono">{viewCert.qrCode}</p>
                </div>
              )}
              <div className="p-4 border-t border-dark-100 dark:border-dark-700 flex justify-center">
                <button onClick={() => handleDownload(viewCert)} className="btn-primary flex items-center gap-2 !px-6">
                  <HiOutlineDownload className="w-4 h-4" /> Download Certificate
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
