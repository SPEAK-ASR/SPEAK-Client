import type { AdminName, AdminProfile } from './context';

// Re-export profiles for external use
import chirathImg from '../assets/profiles/chirath.png';
import rusiraImg from '../assets/profiles/rusira.png';
import kokilaImg from '../assets/profiles/kokila.png';
import sahanImg from '../assets/profiles/sahan.png';

export const ADMIN_PROFILES: AdminProfile[] = [
  { id: 'chirath', displayName: 'Chirath', imagePath: chirathImg },
  { id: 'rusira', displayName: 'Rusira', imagePath: rusiraImg },
  { id: 'kokila', displayName: 'Kokila', imagePath: kokilaImg },
  { id: 'sahan', displayName: 'Sahan', imagePath: sahanImg },
];

export function getAdminDisplayName(id: AdminName | null | undefined): string {
  if (!id) return '';
  const profile = ADMIN_PROFILES.find(p => p.id === id);
  return profile?.displayName ?? id;
}
