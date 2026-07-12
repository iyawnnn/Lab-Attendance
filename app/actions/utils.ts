export function getCurrentPHTimeInMinutes(): number {
  const timeZone = process.env.NEXT_PUBLIC_APP_TIMEZONE || "Asia/Manila";
  const phTimeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const timeParts = phTimeFormatter.formatToParts(new Date());
  let currentHour = 0;
  let currentMinute = 0;

  for (const part of timeParts) {
    if (part.type === "hour") currentHour = parseInt(part.value, 10);
    if (part.type === "minute") currentMinute = parseInt(part.value, 10);
  }
  return currentHour * 60 + currentMinute;
}

export function parseScheduleTime(timeStr: string): number {
  if (!timeStr) return 0;

  const match = timeStr.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const modifier = match[3].toUpperCase();

  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}