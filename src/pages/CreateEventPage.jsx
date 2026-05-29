import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePhotograph, HiOutlineCalendar, HiOutlineClock, HiOutlineLocationMarker, HiOutlineTag, HiOutlineUserGroup, HiOutlineX, HiOutlineExclamation, HiOutlineCheck } from 'react-icons/hi';
import { categories } from '../data/constants';
import { useEventManagement } from '../context/EventManagementContext';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Poster dimension requirements
const POSTER_CONFIG = {
  minWidth: 800,
  minHeight: 450,
  maxWidth: 2400,
  maxHeight: 1350,
  maxFileSizeMB: 5,
  aspectRatio: 16 / 9,     // 16:9 landscape
  aspectTolerance: 0.15,    // Allow slight deviation
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
};

export default function CreateEventPage() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { createEvent, saveEventDetails } = useEventManagement();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [form, setForm] = useState({ title: '', description: '', category: '', venue: '', date: '', time: '', endDate: '', maxCapacity: '', department: '', tags: '' });
  const [created, setCreated] = useState(false);

  // Event details state (Step 4)
  const [eligibility, setEligibility] = useState('');
  const [schedule, setSchedule] = useState([{ time: '', activity: '' }]);
  const [prizes, setPrizes] = useState([{ place: '', reward: '' }]);
  const [rulesText, setRulesText] = useState('');
  const [coordinator, setCoordinator] = useState({ name: '', phone: '', email: '' });

  // Poster upload state
  const [posterPreview, setPosterPreview] = useState(null);
  const [posterFile, setPosterFile] = useState(null);
  const [posterError, setPosterError] = useState('');
  const [posterDimensions, setPosterDimensions] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const totalSteps = 4;

  // Schedule helpers
  const addScheduleRow = () => setSchedule(prev => [...prev, { time: '', activity: '' }]);
  const removeScheduleRow = (i) => setSchedule(prev => prev.filter((_, idx) => idx !== i));
  const updateSchedule = (i, field, value) => setSchedule(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row));

  // Prize helpers
  const addPrizeRow = () => setPrizes(prev => [...prev, { place: '', reward: '' }]);
  const removePrizeRow = (i) => setPrizes(prev => prev.filter((_, idx) => idx !== i));
  const updatePrize = (i, field, value) => setPrizes(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row));

  const validateAndSetPoster = (file) => {
    setPosterError('');
    setPosterDimensions(null);

    // Check file type
    if (!POSTER_CONFIG.allowedTypes.includes(file.type)) {
      setPosterError('Only JPG, PNG, and WebP images are allowed.');
      return;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > POSTER_CONFIG.maxFileSizeMB) {
      setPosterError(`File size (${fileSizeMB.toFixed(1)}MB) exceeds the ${POSTER_CONFIG.maxFileSizeMB}MB limit.`);
      return;
    }

    // Check dimensions
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const { width, height } = img;
      const ratio = width / height;
      const expectedRatio = POSTER_CONFIG.aspectRatio;
      const ratioDiff = Math.abs(ratio - expectedRatio) / expectedRatio;

      setPosterDimensions({ width, height, ratio: ratio.toFixed(2) });

      // Check minimum dimensions
      if (width < POSTER_CONFIG.minWidth || height < POSTER_CONFIG.minHeight) {
        setPosterError(`Image too small (${width}×${height}px). Minimum required: ${POSTER_CONFIG.minWidth}×${POSTER_CONFIG.minHeight}px.`);
        URL.revokeObjectURL(objectUrl);
        return;
      }

      // Check maximum dimensions
      if (width > POSTER_CONFIG.maxWidth || height > POSTER_CONFIG.maxHeight) {
        setPosterError(`Image too large (${width}×${height}px). Maximum allowed: ${POSTER_CONFIG.maxWidth}×${POSTER_CONFIG.maxHeight}px.`);
        URL.revokeObjectURL(objectUrl);
        return;
      }

      // Check aspect ratio
      if (ratioDiff > POSTER_CONFIG.aspectTolerance) {
        setPosterError(`Aspect ratio (${ratio.toFixed(2)}) doesn't match 16:9 (1.78). Please crop your poster to landscape 16:9 format.`);
        URL.revokeObjectURL(objectUrl);
        return;
      }

      // All checks passed
      // Convert to Base64 so it can be saved in the database directly
      const reader = new FileReader();
      reader.onloadend = () => {
        setPosterPreview(reader.result); // This is now a base64 string, not a temporary blob
        setPosterFile(file);
        setPosterError('');
        URL.revokeObjectURL(objectUrl); // Clean up the temporary blob
      };
      reader.readAsDataURL(file);
    };

    img.onerror = () => {
      setPosterError('Failed to load image. Please try another file.');
      URL.revokeObjectURL(objectUrl);
    };

    img.src = objectUrl;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) validateAndSetPoster(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSetPoster(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removePoster = () => {
    if (posterPreview) URL.revokeObjectURL(posterPreview);
    setPosterPreview(null);
    setPosterFile(null);
    setPosterError('');
    setPosterDimensions(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Create New Event</h1>
        <p className="text-dark-500 dark:text-dark-400 mt-1">Fill in the details to create a new campus event</p>
      </motion.div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-gradient-to-r from-gu-600 to-gu-500 text-white' : 'bg-dark-100 dark:bg-dark-700 text-dark-400'}`}>{s}</div>
            <div className={`flex-1 h-1 rounded-full ${s < totalSteps ? (step > s ? 'bg-gu-500' : 'bg-dark-200 dark:bg-dark-700') : 'hidden'}`} />
          </div>
        ))}
      </div>

      <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card p-6 md:p-8 space-y-5">
        {step === 1 && (
          <>
            <h2 className="text-lg font-bold text-dark-900 dark:text-white">Basic Information</h2>
            <div>
              <label className="text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5 block">Event Title</label>
              <input value={form.title} onChange={e => update('title', e.target.value)} placeholder="Enter event title" className="input-field" />
            </div>
            <div>
              <label className="text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5 block">Description</label>
              <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={4} placeholder="Describe your event..." className="input-field resize-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5 block">Category</label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map(c => (
                  <button key={c.name} type="button" onClick={() => update('category', c.name)}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${form.category === c.name ? 'border-gu-500 bg-gu-50 dark:bg-gu-900/20 text-gu-700 dark:text-gu-300' : 'border-dark-200 dark:border-dark-600 text-dark-500 hover:border-dark-300'}`}>
                    <span className="text-xl block mb-1">{c.icon}</span>{c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Poster Upload ─── */}
            <div>
              <label className="text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5 block">
                Event Poster <span className="text-red-500">*</span>
              </label>

              {/* Dimension requirements banner */}
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-xl p-3 mb-3">
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">📐 Poster Requirements:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-blue-600 dark:text-blue-400">
                  <span>📏 Ratio: <strong>16:9</strong></span>
                  <span>↔️ Min: <strong>800×450px</strong></span>
                  <span>↔️ Max: <strong>2400×1350px</strong></span>
                  <span>📁 Max size: <strong>5MB</strong></span>
                </div>
                <p className="text-[10px] text-blue-500 dark:text-blue-400/70 mt-1">Recommended: <strong>1920×1080px</strong> (Full HD) for best quality</p>
              </div>

              {/* Upload area or preview */}
              {posterPreview ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-emerald-300 dark:border-emerald-700">
                  {/* Preview image in 16:9 */}
                  <div className="relative aspect-video bg-dark-900">
                    <img src={posterPreview} alt="Poster preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  </div>

                  {/* Success info bar */}
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HiOutlineCheck className="w-4 h-4 text-emerald-600" />
                      <div>
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Poster uploaded successfully</p>
                        {posterDimensions && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-500">
                            {posterDimensions.width}×{posterDimensions.height}px • Ratio: {posterDimensions.ratio}
                            {posterFile && ` • ${(posterFile.size / (1024 * 1024)).toFixed(1)}MB`}
                          </p>
                        )}
                      </div>
                    </div>
                    <button onClick={removePoster} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors" title="Remove poster">
                      <HiOutlineX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                    isDragging
                      ? 'border-gu-500 bg-gu-50 dark:bg-gu-900/10 scale-[1.01]'
                      : posterError
                        ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/5'
                        : 'border-dark-200 dark:border-dark-600 hover:border-gold-400 dark:hover:border-gold-500'
                  }`}
                >
                  {/* Aspect ratio guide frame */}
                  <div className="max-w-xs mx-auto mb-4">
                    <div className="aspect-video bg-dark-100 dark:bg-dark-700 rounded-lg flex items-center justify-center border border-dashed border-dark-300 dark:border-dark-600">
                      <div className="text-center">
                        <HiOutlinePhotograph className="w-8 h-8 text-dark-300 dark:text-dark-500 mx-auto mb-1" />
                        <p className="text-[10px] text-dark-400">16:9 preview</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-dark-600 dark:text-dark-300">
                    {isDragging ? '📥 Drop your poster here' : 'Click or drag to upload poster'}
                  </p>
                  <p className="text-xs text-dark-400 mt-1">JPG, PNG, or WebP • 16:9 landscape • Up to 5MB</p>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Error message */}
              <AnimatePresence>
                {posterError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl flex items-start gap-2"
                  >
                    <HiOutlineExclamation className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-red-700 dark:text-red-400">{posterError}</p>
                      <button onClick={() => fileInputRef.current?.click()} className="text-xs text-red-600 dark:text-red-400 underline mt-1 hover:text-red-800">
                        Try another image
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-lg font-bold text-dark-900 dark:text-white">Date & Venue</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5 block">Start Date</label>
                <input type="date" value={form.date} onChange={e => update('date', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5 block">End Date</label>
                <input type="date" value={form.endDate} onChange={e => update('endDate', e.target.value)} className="input-field" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5 block">Start Time</label>
              <input type="time" value={form.time} onChange={e => update('time', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5 block">Venue</label>
              <select value={form.venue} onChange={e => update('venue', e.target.value)} className="input-field">
                <option value="">Select venue</option>
                {['AIDS Library', 'New Auditorium', 'Old Auditorium', 'Open Concert Area', 'Main Ground', 'Cricket Ground', 'iOS Lab', 'Code Arena'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5 block">Max Capacity</label>
              <input type="number" value={form.maxCapacity} onChange={e => update('maxCapacity', e.target.value)} placeholder="200" className="input-field" />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-lg font-bold text-dark-900 dark:text-white">Additional Details</h2>
            <div>
              <label className="text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5 block">Department</label>
              <select value={form.department} onChange={e => update('department', e.target.value)} className="input-field">
                <option value="">Select department</option>
                {['CSE', 'ECE', 'ME', 'MBA', 'BCA', 'All Departments'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5 block">Tags (comma separated)</label>
              <input value={form.tags} onChange={e => update('tags', e.target.value)} placeholder="coding, hackathon, prizes" className="input-field" />
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-lg font-bold text-dark-900 dark:text-white">Event Details <span className="text-sm font-normal text-dark-400">(optional)</span></h2>
            <p className="text-xs text-dark-400 -mt-3">These details appear on your event's detail page. You can skip and add later.</p>

            {/* Eligibility */}
            <div>
              <label className="text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5 block">Eligibility</label>
              <textarea value={eligibility} onChange={e => setEligibility(e.target.value)} placeholder="e.g. Open to all students. Teams of 2-4 members." rows={2} className="input-field resize-none" />
            </div>

            {/* Schedule */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-dark-700 dark:text-dark-300">Schedule / Timeline</label>
                <button type="button" onClick={addScheduleRow} className="text-xs text-gu-600 dark:text-gold-400 font-medium flex items-center gap-1 hover:underline">
                  <HiOutlinePlus className="w-3.5 h-3.5" /> Add Row
                </button>
              </div>
              <div className="space-y-2">
                {schedule.map((row, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input value={row.time} onChange={e => updateSchedule(i, 'time', e.target.value)} placeholder="10:00 AM" className="input-field w-32 text-sm" />
                    <input value={row.activity} onChange={e => updateSchedule(i, 'activity', e.target.value)} placeholder="Activity description" className="input-field flex-1 text-sm" />
                    {schedule.length > 1 && (
                      <button type="button" onClick={() => removeScheduleRow(i)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Prizes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-dark-700 dark:text-dark-300">Prizes</label>
                <button type="button" onClick={addPrizeRow} className="text-xs text-gu-600 dark:text-gold-400 font-medium flex items-center gap-1 hover:underline">
                  <HiOutlinePlus className="w-3.5 h-3.5" /> Add Prize
                </button>
              </div>
              <div className="space-y-2">
                {prizes.map((row, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input value={row.place} onChange={e => updatePrize(i, 'place', e.target.value)} placeholder="🥇 1st Place" className="input-field w-36 text-sm" />
                    <input value={row.reward} onChange={e => updatePrize(i, 'reward', e.target.value)} placeholder="₹50,000 + Trophy" className="input-field flex-1 text-sm" />
                    {prizes.length > 1 && (
                      <button type="button" onClick={() => removePrizeRow(i)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Rules */}
            <div>
              <label className="text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5 block">Rules <span className="text-xs text-dark-400 font-normal">(one per line)</span></label>
              <textarea value={rulesText} onChange={e => setRulesText(e.target.value)} placeholder={"Teams of 2-4 only\nAll code must be original\nJudges decision is final"} rows={3} className="input-field resize-none text-sm" />
            </div>

            {/* Coordinator */}
            <div>
              <label className="text-sm font-medium text-dark-700 dark:text-dark-300 mb-2 block">Event Coordinator</label>
              <div className="grid sm:grid-cols-3 gap-3">
                <input value={coordinator.name} onChange={e => setCoordinator(prev => ({ ...prev, name: e.target.value }))} placeholder="Name" className="input-field text-sm" />
                <input value={coordinator.phone} onChange={e => setCoordinator(prev => ({ ...prev, phone: e.target.value }))} placeholder="Phone" className="input-field text-sm" />
                <input value={coordinator.email} onChange={e => setCoordinator(prev => ({ ...prev, email: e.target.value }))} placeholder="Email" className="input-field text-sm" />
              </div>
            </div>

            {/* Preview */}
            <div className="mt-4 p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
              <h3 className="font-semibold text-dark-900 dark:text-white mb-3">Preview</h3>
              {posterPreview && (
                <div className="relative aspect-video rounded-xl overflow-hidden mb-4 max-w-sm">
                  <img src={posterPreview} alt="Event poster" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <p className="text-white text-sm font-bold">{form.title || 'Event Title'}</p>
                  </div>
                </div>
              )}
              <div className="space-y-1 text-sm text-dark-600 dark:text-dark-300">
                <p><strong>Title:</strong> {form.title || '—'}</p>
                <p><strong>Category:</strong> {form.category || '—'}</p>
                <p><strong>Date:</strong> {form.date || '—'} to {form.endDate || '—'}</p>
                <p><strong>Venue:</strong> {form.venue || '—'}</p>
                <p><strong>Capacity:</strong> {form.maxCapacity || '—'}</p>
                <p><strong>Poster:</strong> {posterPreview ? '✅ Uploaded' : '❌ Not uploaded'}</p>
                <p><strong>Schedule:</strong> {schedule.filter(s => s.time && s.activity).length} items</p>
                <p><strong>Prizes:</strong> {prizes.filter(p => p.place && p.reward).length} prizes</p>
                <p><strong>Rules:</strong> {rulesText.split('\n').filter(Boolean).length} rules</p>
                <p><strong>Coordinator:</strong> {coordinator.name || '—'}</p>
              </div>
            </div>
          </>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <button onClick={() => setStep(s => Math.max(1, s - 1))} className={`btn-secondary ${step === 1 ? 'invisible' : ''}`}>Previous</button>
          {step < totalSteps ? (
            <button onClick={() => setStep(s => s + 1)} className="btn-primary">Next Step</button>
          ) : (
            <button onClick={async () => {
              // Step 1: Create the event
              const newEvent = await createEvent({
                ...form,
                poster: posterPreview || '/gu-campus.png',
                organizer: user?.club || user?.name || 'Student Council',
              }, user?.name);

              // Step 2: Save event details if any were filled in
              const filteredSchedule = schedule.filter(s => s.time && s.activity);
              const filteredPrizes = prizes.filter(p => p.place && p.reward);
              const rules = rulesText.split('\n').map(r => r.trim()).filter(Boolean);
              const hasDetails = eligibility || filteredSchedule.length > 0 || filteredPrizes.length > 0 || rules.length > 0 || coordinator.name;

              if (newEvent?.id && hasDetails) {
                await saveEventDetails(newEvent.id, {
                  longDescription: form.description || '',
                  eligibility,
                  schedule: filteredSchedule,
                  prizes: filteredPrizes,
                  rules,
                  coordinator: coordinator.name ? coordinator : null,
                });
              }

              setCreated(true);
              addToast({ icon: '🎉', title: 'Event Created!', message: `"${form.title}" has been submitted for admin approval.`, department: form.department });
              setTimeout(() => navigate('/organizer'), 2000);
            }} className="btn-primary" disabled={created}>
              {created ? '✅ Event Submitted!' : 'Create Event'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
