// Job type (reusable)
export interface Job {
  id: number;
  title: string;
  description?: string;
  hourly_rate?: number;
  fixed_price?: number;
  duration?: number;
  area_text?: string;
  location?: string;
  start_time?: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  hourly_or_fixed?: 'hourly' | 'fixed';
  status?: string;
  category?: { id?: number; name_en?: string; name_nl?: string };
  street?: string;
  house_number?: string;
  postal_code?: string;
  city?: string;
}

export const JOB_CATEGORIES = [
  { id: 1, key: 'cleaning', name_nl: 'Schoonmaak', name_fr: 'Nettoyage', name_en: 'Cleaning' },
  { id: 2, key: 'garden', name_nl: 'Tuinwerk', name_fr: 'Jardinage', name_en: 'Gardening' },
  { id: 3, key: 'repair', name_nl: 'Reparatie', name_fr: 'Réparation', name_en: 'Repair' },
  { id: 4, key: 'moving', name_nl: 'Verhuizing', name_fr: 'Déménagement', name_en: 'Moving' },
  { id: 5, key: 'handyman', name_nl: 'Klusjeswerk', name_fr: 'Bricolage', name_en: 'Handyman' },
  { id: 6, key: 'petcare', name_nl: 'Dierenverzorging', name_fr: 'Soins pour animaux', name_en: 'Pet care' },
];

/**
 * Group jobs by day using nl-BE formatted date string
 * @param jobs - Array of jobs to group
 * @returns Object with date keys and job arrays as values
 */
export function groupJobsByDay(jobs: Job[]): Record<string, Job[]> {
  const grouped: Record<string, Job[]> = {};

  jobs.forEach((job) => {
    let dateKey = 'Datum onbekend';

    if (job.start_time) {
      try {
        const date = new Date(job.start_time);
        if (!isNaN(date.getTime())) {
          dateKey = date.toLocaleDateString('nl-BE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        }
      } catch {
        dateKey = 'Datum onbekend';
      }
    }

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(job);
  });

  return grouped;
}

/**
 * Format job address from structured fields
 * @param job - Job object with address fields
 * @returns Formatted address string
 */
export function formatJobAddress(job: Job): string {
  const parts: string[] = [];

  if (job.street) {
    parts.push(job.street);
  }

  if (job.house_number) {
    parts[0] = `${parts[0]} ${job.house_number}`;
  }

  if (job.postal_code) {
    parts.push(job.postal_code);
  }

  if (job.city) {
    parts.push(job.city);
  }

  if (parts.length === 0 && job.location) {
    return job.location;
  }

  return parts.join(', ');
}

/**
 * Format date with nl-BE locale
 * @param dateString - ISO date string or timestamp
 * @param format - 'short', 'long', or 'time'. Defaults to 'short'
 * @returns Formatted date string
 */
export function formatDate(dateString: string, format: 'short' | 'long' | 'time' = 'short'): string {
  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return dateString;
    }

    if (format === 'short') {
      // "5 mrt 2026, 14:30"
      const datePart = date.toLocaleDateString('nl-BE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const timePart = date.toLocaleTimeString('nl-BE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      return `${datePart}, ${timePart}`;
    }

    if (format === 'long') {
      // "maandag 5 maart 2026"
      return date.toLocaleDateString('nl-BE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }

    if (format === 'time') {
      // "14:30"
      return date.toLocaleTimeString('nl-BE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }

    return dateString;
  } catch {
    return dateString;
  }
}

/**
 * Calculate haversine distance between two coordinates
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Format price display for a job
 * @param job - Job object with pricing information
 * @returns Formatted price string or empty string
 */
export function formatPrice(job: Job): string {
  if (job.hourly_or_fixed === 'hourly' && job.hourly_rate) {
    return `€${job.hourly_rate}/uur`;
  }

  if (job.hourly_or_fixed === 'fixed' && job.fixed_price) {
    return `€${job.fixed_price} vast`;
  }

  if (job.hourly_rate && !job.hourly_or_fixed) {
    return `€${job.hourly_rate}/uur`;
  }

  if (job.fixed_price && !job.hourly_or_fixed) {
    return `€${job.fixed_price} vast`;
  }

  return '';
}
