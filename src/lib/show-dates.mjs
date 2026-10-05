const months = new Map([
  ["jan", 1], ["january", 1], ["feb", 2], ["february", 2],
  ["mar", 3], ["march", 3], ["apr", 4], ["april", 4], ["may", 5],
  ["jun", 6], ["june", 6], ["jul", 7], ["july", 7],
  ["aug", 8], ["august", 8], ["sep", 9], ["sept", 9], ["september", 9],
  ["oct", 10], ["october", 10], ["nov", 11], ["november", 11],
  ["dec", 12], ["december", 12],
]);

/** Parse the display date only, leaving optional " · time" text untouched. */
export function showDateKey(value) {
  const date = value.split("·", 1)[0].trim();
  let year, month, day;
  let match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (match) {
    [, year, month, day] = match;
  } else if ((match = /^([a-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})$/i.exec(date))) {
    month = months.get(match[1].toLowerCase());
    day = match[2];
    year = match[3];
  } else if ((match = /^(\d{1,2})\s+([a-z]+)\.?\s+(\d{4})$/i.exec(date))) {
    day = match[1];
    month = months.get(match[2].toLowerCase());
    year = match[3];
  } else {
    return null;
  }

  year = Number(year);
  month = Number(month);
  day = Number(day);
  if (year < 1000 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const validated = new Date(Date.UTC(year, month - 1, day));
  if (validated.getUTCFullYear() !== year || validated.getUTCMonth() + 1 !== month || validated.getUTCDate() !== day) return null;
  return year * 10000 + month * 100 + day;
}

function todayInNewYork(now) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (name) => Number(parts.find((entry) => entry.type === name).value);
  return part("year") * 10000 + part("month") * 100 + part("day");
}

/** Unknown dates stay visible in Upcoming; known dates sort by calendar day. */
export function partitionShows(shows, now = new Date()) {
  const today = todayInNewYork(now);
  const entries = shows.map((show, index) => ({ show, index, date: showDateKey(show.date) }));
  const upcoming = entries
    .filter((entry) => entry.date === null || entry.date >= today)
    .sort((a, b) => (a.date ?? Infinity) - (b.date ?? Infinity) || a.index - b.index)
    .map((entry) => entry.show);
  const past = entries
    .filter((entry) => entry.date !== null && entry.date < today)
    .sort((a, b) => b.date - a.date || a.index - b.index)
    .map((entry) => entry.show);
  return { upcoming, past };
}
