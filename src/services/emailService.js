import emailjs from '@emailjs/browser';

// EmailJS Configuration
const EMAILJS_SERVICE_ID = 'service_del1alk';
const EMAILJS_TEMPLATE_ID = 'template_jmgam5i';
const EMAILJS_PUBLIC_KEY = '2nn49oSo9ccwq7aGP';

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

// ── Helper: Send email via EmailJS ──
async function sendEmail(templateParams) {
  try {
    const response = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
    console.log('✅ Email sent:', response.status);
    return { success: true };
  } catch (error) {
    console.error('🔴 Email send failed:', error);
    return { success: false, error };
  }
}

// ────────────────────────────────────────────────────────────
// 1. Registration Submitted — "Thank you for registering"
// ────────────────────────────────────────────────────────────
export async function sendRegistrationEmail({ toName, toEmail, eventName, eventDate, eventTime, eventVenue, admissionNo }) {
  return sendEmail({
    to_name: toName,
    to_email: toEmail,
    event_name: eventName,
    event_date: eventDate,
    event_time: eventTime,
    event_venue: eventVenue,
    admission_no: admissionNo || '',
    status_message: `Thank you for registering for "${eventName}"! 🎉\n\nYour registration request has been submitted successfully and is now pending approval from the organizer. You will receive another email once your registration is confirmed.`,
  });
}

// ────────────────────────────────────────────────────────────
// 2. Registration Approved — "Your registration is confirmed"
// ────────────────────────────────────────────────────────────
export async function sendApprovalEmail({ toName, toEmail, eventName, eventDate, eventTime, eventVenue }) {
  return sendEmail({
    to_name: toName,
    to_email: toEmail,
    event_name: eventName,
    event_date: eventDate,
    event_time: eventTime,
    event_venue: eventVenue,
    admission_no: '',
    status_message: `Congratulations! 🎊 Your registration for "${eventName}" has been APPROVED!\n\nYou are now officially registered. Please arrive at ${eventVenue} on ${eventDate} at ${eventTime}. Don't forget to bring your University ID card.\n\nSee you at the event!`,
  });
}

// ────────────────────────────────────────────────────────────
// 3. Event Reminder — "Your event is tomorrow!"
// ────────────────────────────────────────────────────────────
export async function sendEventReminderEmail({ toName, toEmail, eventName, eventDate, eventTime, eventVenue }) {
  return sendEmail({
    to_name: toName,
    to_email: toEmail,
    event_name: eventName,
    event_date: eventDate,
    event_time: eventTime,
    event_venue: eventVenue,
    admission_no: '',
    status_message: `⏰ Reminder: "${eventName}" is TOMORROW!\n\n📅 Date: ${eventDate}\n🕐 Time: ${eventTime}\n📍 Venue: ${eventVenue}\n\nPlease arrive 15 minutes early. Carry your University ID card and your attendance code (you will receive it separately).\n\nSee you there!`,
  });
}

// ────────────────────────────────────────────────────────────
// 4. Attendance Code — "Here is your attendance code"
// ────────────────────────────────────────────────────────────
export async function sendAttendanceCodeEmail({ toName, toEmail, eventName, eventDate, eventTime, eventVenue, attendanceCode }) {
  return sendEmail({
    to_name: toName,
    to_email: toEmail,
    event_name: eventName,
    event_date: eventDate,
    event_time: eventTime,
    event_venue: eventVenue,
    admission_no: '',
    status_message: `📋 Your Attendance Code for "${eventName}"\n\n🔑 Your unique code: ${attendanceCode}\n\nPlease show this code at the event venue to mark your attendance. Do NOT share this code with anyone — it is linked to your registration.\n\n📅 Date: ${eventDate}\n🕐 Time: ${eventTime}\n📍 Venue: ${eventVenue}`,
  });
}

// ────────────────────────────────────────────────────────────
// 5. Club Application Submitted — "Wait for audition"
// ────────────────────────────────────────────────────────────
export async function sendClubApplicationEmail({ toName, toEmail, clubName }) {
  return sendEmail({
    to_name: toName,
    to_email: toEmail,
    event_name: clubName,
    event_date: '',
    event_time: '',
    event_venue: '',
    admission_no: '',
    status_message: `Thank you for applying to join "${clubName}"! 🎉\n\nYour application has been submitted successfully and is currently under review by the club coordinators.\n\n⏳ Please wait for the club audition — we will mail you the date and time once you are shortlisted for the audition round.\n\nIn the meantime, feel free to explore other clubs and events on the platform!`,
  });
}

// ────────────────────────────────────────────────────────────
// 6. Club Audition Selected — "You've been selected for audition!"
// ────────────────────────────────────────────────────────────
export async function sendClubAuditionSelectedEmail({ toName, toEmail, clubName }) {
  return sendEmail({
    to_name: toName,
    to_email: toEmail,
    event_name: clubName,
    event_date: '',
    event_time: '',
    event_venue: '',
    admission_no: '',
    status_message: `🎉 Great News! You have been SELECTED for the audition round for "${clubName}"!\n\nThe club coordinators have reviewed your application and shortlisted you for the next stage. Please check your email and the platform for the audition date, time, and venue details.\n\nPrepare well and give your best! Good luck! 🍀`,
  });
}

// ────────────────────────────────────────────────────────────
// 7. Club Application Approved — "Welcome to the club!"
// ────────────────────────────────────────────────────────────
export async function sendClubApprovalEmail({ toName, toEmail, clubName }) {
  return sendEmail({
    to_name: toName,
    to_email: toEmail,
    event_name: clubName,
    event_date: '',
    event_time: '',
    event_venue: '',
    admission_no: '',
    status_message: `🎊 Congratulations! Your application to join "${clubName}" has been APPROVED!\n\nYou are now an official member of ${clubName}. Welcome to the team!\n\nStay tuned for upcoming club meetings, events, and announcements through the platform.`,
  });
}

// ────────────────────────────────────────────────────────────
// 8. Club Application Rejected
// ────────────────────────────────────────────────────────────
export async function sendClubRejectionEmail({ toName, toEmail, clubName }) {
  return sendEmail({
    to_name: toName,
    to_email: toEmail,
    event_name: clubName,
    event_date: '',
    event_time: '',
    event_venue: '',
    admission_no: '',
    status_message: `Dear ${toName},\n\nThank you for your interest in joining "${clubName}". Unfortunately, after careful review, your application was not selected at this time.\n\nDon't be discouraged! You can always reapply in the next recruitment cycle. In the meantime, feel free to explore other clubs and events on the platform.\n\nKeep exploring and growing! 💪`,
  });
}
