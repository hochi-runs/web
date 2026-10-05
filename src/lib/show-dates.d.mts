export function showDateKey(value: string): number | null;
export function partitionShows<T extends { date: string }>(shows: T[], now?: Date): {
  upcoming: T[];
  past: T[];
};
