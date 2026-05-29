import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineCamera, HiOutlineMail, HiOutlinePhone, HiOutlineAcademicCap, HiOutlineMoon, HiOutlineSun, HiOutlineBell, HiOutlineGlobe, HiOutlineCheck } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

export default function ProfilePage() {
  const { user, updateProfile, isDemo } = useAuth();
  const { dark, toggle } = useTheme();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('personal');
  const [saving, setSaving] = useState(false);

  // Controlled form state — initialized from user profile
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    year: user?.year || '',
    bio: user?.bio || '',
  });

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (isDemo) {
      addToast({ icon: '⚠️', title: 'Demo Mode', message: 'Profile changes are not saved in demo mode. Sign up for a real account!' });
      return;
    }

    setSaving(true);
    const { error } = await updateProfile(form);
    setSaving(false);

    if (error) {
      addToast({ icon: '❌', title: 'Update Failed', message: error.message || 'Could not update profile. Please try again.' });
    } else {
      addToast({ icon: '✅', title: 'Profile Updated!', message: 'Your changes have been saved successfully.' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Profile Settings</h1>
        <p className="text-dark-500 dark:text-dark-400 mt-1">Manage your account and preferences</p>
      </motion.div>

      {/* Profile header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-r from-gu-600 to-gu-500 flex items-center justify-center text-white text-3xl font-bold">{user?.avatar}</div>
          <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-white dark:bg-dark-700 border-2 border-dark-200 dark:border-dark-600 rounded-full flex items-center justify-center shadow-lg">
            <HiOutlineCamera className="w-4 h-4 text-dark-500" />
          </button>
        </div>
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-bold text-dark-900 dark:text-white">{user?.name}</h2>
          <p className="text-dark-500 dark:text-dark-400">{user?.email}</p>
          <p className="text-sm text-gu-600 dark:text-gold-400 capitalize mt-1">{user?.role} • {user?.department}</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-dark-800 p-1 rounded-xl w-fit">
        {['personal', 'preferences', 'notifications'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all ${activeTab === t ? 'bg-white dark:bg-dark-700 text-gu-600 shadow-sm' : 'text-dark-500 hover:text-dark-700'}`}>
            {t}
          </button>
        ))}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        {activeTab === 'personal' && (
          <div className="space-y-5">
            <h3 className="text-lg font-bold text-dark-900 dark:text-white">Personal Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5 block">Full Name</label>
                <input value={form.name} onChange={e => update('name', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5 block">Email</label>
                <input defaultValue={user?.email} className="input-field" disabled />
              </div>
              <div>
                <label className="text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5 block">Phone</label>
                <input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+91 98765 43210" className="input-field" />
              </div>
              <div>
                <label className="text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5 block">Enrollment ID</label>
                <input defaultValue={user?.enrollmentId || ''} className="input-field" disabled />
              </div>
              <div>
                <label className="text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5 block">Department</label>
                <input defaultValue={user?.department} className="input-field" disabled />
              </div>
              <div>
                <label className="text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5 block">Year</label>
                <input value={form.year} onChange={e => update('year', e.target.value)} placeholder="3rd Year" className="input-field" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5 block">Bio</label>
              <textarea value={form.bio} onChange={e => update('bio', e.target.value)} placeholder="Tell us about yourself..." rows={3} className="input-field resize-none" />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Saving...
                </>
              ) : (
                <>
                  <HiOutlineCheck className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-5">
            <h3 className="text-lg font-bold text-dark-900 dark:text-white">Preferences</h3>
            {[
              { icon: dark ? HiOutlineSun : HiOutlineMoon, label: 'Dark Mode', desc: 'Toggle dark/light theme', checked: dark, onChange: toggle },
              { icon: HiOutlineGlobe, label: 'Language', desc: 'English (India)', checked: true },
              { icon: HiOutlineBell, label: 'Email Notifications', desc: 'Receive event updates via email', checked: true },
            ].map((pref, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-dark-700">
                <div className="flex items-center gap-3">
                  <pref.icon className="w-5 h-5 text-gu-600 dark:text-gold-400" />
                  <div>
                    <p className="font-medium text-dark-900 dark:text-white text-sm">{pref.label}</p>
                    <p className="text-xs text-dark-400">{pref.desc}</p>
                  </div>
                </div>
                <button onClick={pref.onChange} className={`w-11 h-6 rounded-full transition-colors ${pref.checked ? 'bg-gu-500' : 'bg-dark-300'} relative`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${pref.checked ? 'translate-x-5.5 left-0.5' : 'left-0.5'}`}
                    style={{ transform: pref.checked ? 'translateX(20px)' : 'translateX(0)' }} />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-5">
            <h3 className="text-lg font-bold text-dark-900 dark:text-white">Notification Settings</h3>
            {['Event Reminders', 'Registration Confirmations', 'New Events in My Interests', 'Certificate Availability', 'Club Updates', 'System Announcements'].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-dark-700">
                <p className="font-medium text-dark-900 dark:text-white text-sm">{item}</p>
                <button className={`w-11 h-6 rounded-full transition-colors ${i < 4 ? 'bg-gu-500' : 'bg-dark-300'} relative`}>
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                    style={{ transform: i < 4 ? 'translateX(20px)' : 'translateX(2px)' }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
