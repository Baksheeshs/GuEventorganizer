import { useEffect, useRef, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { useEventManagement } from '../context/EventManagementContext';
import { useRegistration } from '../context/RegistrationContext';
import { useClubManagement } from '../context/ClubManagementContext';

/**
 * Generates live toast notifications from real database data.
 * Pulls from events, registrations, and clubs to build dynamic activity toasts.
 */
export function useLiveNotifications() {
  const { addToast } = useToast();
  const { managedEvents } = useEventManagement();
  const { registrations } = useRegistration();
  const { getAllClubs } = useClubManagement();
  const indexRef = useRef(0);
  const [liveMessages, setLiveMessages] = useState([]);

  // Build dynamic notifications from real data whenever events/registrations change
  useEffect(() => {
    const messages = [];
    const allClubs = getAllClubs();

    // 1. Upcoming events — "Registration open for..."
    const upcomingEvents = managedEvents.filter(
      e => e.status === 'upcoming' && e.approvalStatus === 'approved'
    );
    upcomingEvents.slice(0, 5).forEach(event => {
      const spotsLeft = (event.maxCapacity || 100) - (event.registrations || 0);
      if (spotsLeft > 0) {
        messages.push({
          icon: '🎟️',
          title: `${event.title} — Registration Open`,
          message: `${spotsLeft} spots remaining. Register now!`,
          department: event.department || event.category,
        });
      } else {
        messages.push({
          icon: '🔥',
          title: `${event.title} — Fully Booked!`,
          message: 'All spots taken. Check back for waitlist.',
          department: event.department || event.category,
        });
      }
    });

    // 2. Recently approved events — "New event just approved"
    const recentApproved = managedEvents
      .filter(e => e.approvalStatus === 'approved' && e.createdAt)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);
    recentApproved.forEach(event => {
      messages.push({
        icon: '✨',
        title: `New: ${event.title}`,
        message: `${event.category} event by ${event.organizer || 'Student Council'}. Check it out!`,
        department: event.department,
      });
    });

    // 3. Registration activity — "X students registered for Y"
    const eventRegCounts = {};
    registrations.forEach(reg => {
      eventRegCounts[reg.eventId] = (eventRegCounts[reg.eventId] || 0) + 1;
    });
    Object.entries(eventRegCounts).slice(0, 3).forEach(([eventId, count]) => {
      const event = managedEvents.find(e => e.id === parseInt(eventId));
      if (event && count > 0) {
        messages.push({
          icon: '📊',
          title: `${event.title} — Trending`,
          message: `${count} student${count > 1 ? 's' : ''} registered. Join them!`,
          department: event.department,
        });
      }
    });

    // 4. Club highlights
    if (allClubs.length > 0) {
      const topClubs = allClubs
        .sort((a, b) => (b.members || 0) - (a.members || 0))
        .slice(0, 2);
      topClubs.forEach(club => {
        messages.push({
          icon: '🏛️',
          title: `${club.name} is Active`,
          message: `${club.members || 0} members strong. ${club.eventsCount || 0} events organized.`,
          department: club.category || 'Campus',
        });
      });
    }

    // 5. Completed events — "Results declared"
    const completed = managedEvents.filter(e => e.status === 'completed').slice(0, 2);
    completed.forEach(event => {
      messages.push({
        icon: '🏆',
        title: `${event.title} — Results Out`,
        message: 'Check the Event Results page for certificates and rankings.',
        department: event.department,
      });
    });

    // Shuffle for variety
    const shuffled = messages.sort(() => Math.random() - 0.5);
    setLiveMessages(shuffled);
    indexRef.current = 0;
  }, [managedEvents, registrations, getAllClubs]);

  // Show notifications on a timer from the dynamic list
  useEffect(() => {
    if (liveMessages.length === 0) return;

    // Show first notification after 15 seconds
    const initialTimeout = setTimeout(() => {
      if (liveMessages.length > 0) {
        addToast(liveMessages[0]);
        indexRef.current = 1;
      }
    }, 15000);

    // Then show one every 60 seconds
    const interval = setInterval(() => {
      if (liveMessages.length === 0) return;
      const idx = indexRef.current % liveMessages.length;
      addToast(liveMessages[idx]);
      indexRef.current = idx + 1;
    }, 60000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [liveMessages, addToast]);
}
