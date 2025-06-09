import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

//this function should return a color even if the category is not in the list
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    "All": "#9ca3af",               // neutral gray
    "Technology": "#8b5cf6",        // violet
    "test": "#6b7280",              // gray (fallback/test)
    "Australia news": "#1e88e5",    // blue
    "Sport": "#f44336",             // red
    "Football": "#d32f2f",          // darker red
    "Society": "#43a047",           // green
    "Politics": "#3b82f6",          // blue
    "US news": "#0d47a1",           // deep blue
    "World news": "#6366f1",        // indigo
    "Business": "#ff5722",          // deep orange
    "Education": "#3f51b5",         // indigo
    "Books": "#6d4c41",             // brown
    "Crosswords": "#546e7a",        // blue gray
    "Opinion": "#ff9800",           // orange
    "Life and style": "#4caf50",    // green
    "UK news": "#1e3a8a",           // navy
    "Stage": "#ab47bc",             // purple
    "Music": "#ec407a",             // pink
    "Media": "#00838f",             // teal
    "Global development": "#00695c",// teal dark
    "Culture": "#e91e63",           // pink
    "Environment": "#2e7d32",       // green dark
    "News": "#2196f3",              // blue
    "Television & radio": "#f06292",// pink light
    "Law": "#5e35b1",               // deep purple
    "Travel": "#00acc1",            // cyan
    "Money": "#2e7d32",             // green dark
    "Food": "#ff7043",              // orange
    "The Filter": "#455a64",        // blue gray
    "Art and design": "#9c27b0",    // purple
  };

  return colors[category] || "#6b7280"; // default gray
}


export function getReadingTime(content: string): string {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  const minutes = Math.ceil(words / wordsPerMinute)
  return `${minutes} min read`
}

// Utility to format date in user's local timezone
export function formatDateInUserTimezone(dateString: string) {
  if (!dateString) return '';
  try {
    let date: Date;
    // Try ISO and date-only first
    if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateString)) {
      date = new Date(dateString);
    } else if (/\d{4}-\d{2}-\d{2}/.test(dateString)) {
      date = new Date(dateString + 'T00:00:00Z');
    } else {
      // Try to parse format: May 21, 2025 at 2:22:39 AM EDT
      const match = dateString.match(/([A-Za-z]+ \d{1,2}, \d{4}) at (\d{1,2}:\d{2}:\d{2} [AP]M) ([A-Z]{2,4})/);
      if (match) {
        const [_, datePart, timePart, tzAbbr] = match;
        // Map common US timezones to offsets
        const tzOffsets: Record<string, string> = {
          'EST': '-05:00',
          'EDT': '-04:00',
          'CST': '-06:00',
          'CDT': '-05:00',
          'MST': '-07:00',
          'MDT': '-06:00',
          'PST': '-08:00',
          'PDT': '-07:00',
        };
        const offset = tzOffsets[tzAbbr] || '-04:00'; // Default to EDT if unknown
        // Convert to ISO string: 2025-05-21T02:22:39-04:00
        const usLocale = 'en-US';
        const parsed = new Date(Date.parse(`${datePart} ${timePart}`));
        if (!isNaN(parsed.getTime())) {
          // Build ISO string manually
          const yyyy = parsed.getFullYear();
          const mm = String(parsed.getMonth() + 1).padStart(2, '0');
          const dd = String(parsed.getDate()).padStart(2, '0');
          const [hms, ampm] = timePart.split(' ');
          let [hh, mi, ss] = hms.split(':').map(Number);
          if (ampm === 'PM' && hh !== 12) hh += 12;
          if (ampm === 'AM' && hh === 12) hh = 0;
          const HH = String(hh).padStart(2, '0');
          const MI = String(mi).padStart(2, '0');
          const SS = String(ss).padStart(2, '0');
          const isoString = `${yyyy}-${mm}-${dd}T${HH}:${MI}:${SS}${offset}`;
          date = new Date(isoString);
        } else {
          date = new Date(dateString);
        }
      } else {
        date = new Date(dateString);
      }
    }
    if (isNaN(date.getTime())) {
      return dateString;
    }
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const formatted = date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: userTimeZone,
      timeZoneName: 'short',
    });
    return formatted.replace(',', '');
  } catch (e) {
    return dateString;
  }
}
