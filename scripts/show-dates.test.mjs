import test from "node:test";
import assert from "node:assert/strict";
import { partitionShows, showDateKey } from "../src/lib/show-dates.mjs";

test("display dates accept named months, ISO dates, and optional time without rolling invalid dates", () => {
  for (const date of ["Sep 4, 2026", "04 September 2026", "2026-09-04", "Sep 4, 2026 · 9 PM ET"]) {
    assert.equal(showDateKey(date), 20260904);
  }
  assert.equal(showDateKey("Feb 29, 2024"), 20240229);
  for (const date of ["Feb 29, 2025", "Apr 31, 2026", "Unknownmonth 4, 2026", "TBD", "Sep 4–5, 2026"]) {
    assert.equal(showDateKey(date), null);
  }
});

test("upcoming sorts forward, archive sorts backward, and unknown dates remain visible", () => {
  const shows = [
    { date: "Oct 5, 2026" }, { date: "TBD" }, { date: "Sep 4, 2026" },
    { date: "Oct 4, 2026" }, { date: "May 16, 2026" }, { date: "Date to follow" },
  ];
  const copy = [...shows];
  const result = partitionShows(shows, new Date("2026-10-04T16:00:00Z"));
  assert.deepEqual(result.upcoming.map((show) => show.date), ["Oct 4, 2026", "Oct 5, 2026", "TBD", "Date to follow"]);
  assert.deepEqual(result.past.map((show) => show.date), ["Sep 4, 2026", "May 16, 2026"]);
  assert.deepEqual(shows, copy);
});

test("archive cutoff follows New York midnight instead of the host timezone", () => {
  const shows = [{ date: "Oct 3, 2026" }];
  assert.equal(partitionShows(shows, new Date("2026-10-04T02:00:00Z")).upcoming.length, 1);
  assert.equal(partitionShows(shows, new Date("2026-10-04T04:00:00Z")).past.length, 1);
  const winterShow = [{ date: "Jan 3, 2026" }];
  assert.equal(partitionShows(winterShow, new Date("2026-01-04T04:30:00Z")).upcoming.length, 1);
  assert.equal(partitionShows(winterShow, new Date("2026-01-04T05:00:00Z")).past.length, 1);
});
