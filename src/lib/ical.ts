/**
 * RFC 5545 iCalendar Engine for Hotel Sherpa Soul PMS
 * 
 * Supports 2-way synchronization with:
 * - Booking.com
 * - Airbnb
 * - Agoda
 * - Expedia
 * - Trip.com
 * - Vrbo
 */

export interface IcalReservationInput {
  id: string;
  guestName?: string;
  source?: string;
  roomNumber: string;
  checkInDate: Date | string;
  checkOutDate: Date | string;
  status: string;
  otaReference?: string | null;
}

export interface ParsedIcalEvent {
  uid: string;
  summary: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: string;
  guestName?: string;
  otaReference?: string;
}

/**
 * Format a Date object to iCal DATE format: YYYYMMDD
 */
function formatDateToIcalDate(dateInput: Date | string): string {
  const d = new Date(dateInput);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Format Date to UTC timestamp: YYYYMMDDTHHmmssZ
 */
function formatDateToIcalTimestamp(dateInput: Date | string): string {
  const d = new Date(dateInput);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Clean text for iCalendar (escape commas, semicolons, backslashes, newlines)
 */
function escapeIcalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Generate standard RFC 5545 iCal (.ics) string for a room or all rooms
 */
export function generateIcalFeed(options: {
  roomNumber: string;
  roomType?: string;
  reservations: IcalReservationInput[];
  hotelName?: string;
}): string {
  const { roomNumber, roomType, reservations, hotelName = 'Hotel Sherpa Soul' } = options;
  const now = new Date();
  const dtstamp = formatDateToIcalTimestamp(now);

  const calName = roomNumber === 'ALL' 
    ? `${hotelName} - All Rooms Availability` 
    : `${hotelName} - Room ${roomNumber}${roomType ? ` (${roomType})` : ''}`;

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hotel Sherpa Soul PMS//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcalText(calName)}`,
    'X-WR-TIMEZONE:Asia/Kathmandu',
  ];

  for (const res of reservations) {
    const startStr = formatDateToIcalDate(res.checkInDate);
    const endStr = formatDateToIcalDate(res.checkOutDate);
    const uid = `res-${res.id}@hotelsherpasoul.com`;

    const guestLabel = res.guestName ? res.guestName : 'Reserved';
    const sourceLabel = res.source ? ` [${res.source}]` : '';
    const summary = `${guestLabel}${sourceLabel} (Room ${res.roomNumber})`;
    
    const descParts = [
      `Hotel: ${hotelName}`,
      `Room: ${res.roomNumber}${roomType ? ` (${roomType})` : ''}`,
      res.guestName ? `Guest: ${res.guestName}` : null,
      res.source ? `Source: ${res.source}` : null,
      res.otaReference ? `OTA Reference: ${res.otaReference}` : null,
      `Status: ${res.status}`,
    ].filter(Boolean);

    const description = escapeIcalText(descParts.join('\n'));

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART;VALUE=DATE:${startStr}`);
    lines.push(`DTEND;VALUE=DATE:${endStr}`);
    lines.push(`SUMMARY:${escapeIcalText(summary)}`);
    lines.push(`DESCRIPTION:${description}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('TRANSP:OPAQUE'); // Marks calendar time as busy/unavailable
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

/**
 * Unfold RFC 5545 multi-line strings
 */
function unfoldIcalLines(rawContent: string): string[] {
  const rawLines = rawContent.split(/\r\n|\n|\r/);
  const unfolded: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (line.startsWith(' ') || line.startsWith('\t')) {
      if (unfolded.length > 0) {
        unfolded[unfolded.length - 1] += line.slice(1);
      }
    } else {
      unfolded.push(line);
    }
  }

  return unfolded;
}

/**
 * Parse an iCal date string (YYYYMMDD or YYYYMMDDTHHmmssZ) into a Date
 */
function parseIcalDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const clean = dateStr.trim();

  // Handle YYYYMMDD (Date only)
  if (/^\d{8}$/.test(clean)) {
    const y = parseInt(clean.slice(0, 4), 10);
    const m = parseInt(clean.slice(4, 6), 10) - 1;
    const d = parseInt(clean.slice(6, 8), 10);
    return new Date(Date.UTC(y, m, d, 0, 0, 0));
  }

  // Handle YYYYMMDDTHHmmssZ or YYYYMMDDTHHmmss
  const match = clean.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (match) {
    const [, y, m, d, h, min, s] = match;
    return new Date(Date.UTC(+y, +m - 1, +d, +h, +min, +s));
  }

  // Fallback to standard Date parse
  const parsed = new Date(clean);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Extract guest name & reference number from Airbnb/Booking/Agoda summaries
 */
function extractGuestAndRef(summary: string, description: string = '') {
  let guestName = 'OTA Guest';
  let otaReference: string | undefined = undefined;

  // Airbnb format: "Reserved" or "Airbnb (HM12345)" or "John Doe (HM12345)"
  const airbnbMatch = summary.match(/([^(]+)\s*\((HM[A-Z0-9]+)\)/i);
  if (airbnbMatch) {
    guestName = airbnbMatch[1].trim();
    otaReference = airbnbMatch[2].trim();
  } else {
    // Check for "Reserved - [Name]" or "[Name]"
    const resMatch = summary.match(/Reserved\s*[-:]\s*(.+)/i);
    if (resMatch) {
      guestName = resMatch[1].trim();
    } else if (summary && !/^(Reserved|Not available|Blocked|Closed)$/i.test(summary.trim())) {
      guestName = summary.trim();
    }
  }

  // Check description for Booking Reference
  const refMatch = description.match(/(?:Reservation|Booking|Confirmation)\s*(?:Number|ID|#)?\s*[:=]\s*([A-Z0-9_-]+)/i);
  if (refMatch && !otaReference) {
    otaReference = refMatch[1].trim();
  }

  return { guestName, otaReference };
}

/**
 * Parse an external iCal feed into an array of events
 */
export function parseIcalFeed(icsContent: string): ParsedIcalEvent[] {
  const lines = unfoldIcalLines(icsContent);
  const events: ParsedIcalEvent[] = [];

  let inEvent = false;
  let currentEvent: Partial<ParsedIcalEvent> & { rawProps?: Record<string, string> } = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = { rawProps: {} };
      continue;
    }

    if (trimmed === 'END:VEVENT') {
      if (currentEvent.uid && currentEvent.startDate && currentEvent.endDate) {
        const { guestName, otaReference } = extractGuestAndRef(
          currentEvent.summary || 'Reserved',
          currentEvent.description || ''
        );

        events.push({
          uid: currentEvent.uid,
          summary: currentEvent.summary || 'Reserved',
          description: currentEvent.description || '',
          startDate: currentEvent.startDate,
          endDate: currentEvent.endDate,
          status: currentEvent.status || 'CONFIRMED',
          guestName: currentEvent.guestName || guestName,
          otaReference: currentEvent.otaReference || otaReference,
        });
      }
      inEvent = false;
      currentEvent = {};
      continue;
    }

    if (!inEvent) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const keyPart = trimmed.slice(0, colonIdx);
    const value = trimmed.slice(colonIdx + 1);

    const [propName] = keyPart.split(';');
    const upperProp = propName.toUpperCase();

    if (upperProp === 'UID') {
      currentEvent.uid = value.trim();
    } else if (upperProp === 'SUMMARY') {
      currentEvent.summary = value.replace(/\\([,;nN\\])/g, '$1').trim();
    } else if (upperProp === 'DESCRIPTION') {
      currentEvent.description = value.replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1').trim();
    } else if (upperProp === 'STATUS') {
      currentEvent.status = value.trim().toUpperCase();
    } else if (upperProp === 'DTSTART') {
      const d = parseIcalDate(value);
      if (d) currentEvent.startDate = d;
    } else if (upperProp === 'DTEND') {
      const d = parseIcalDate(value);
      if (d) currentEvent.endDate = d;
    }
  }

  return events;
}
