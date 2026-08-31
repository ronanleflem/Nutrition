export interface WeekDay {
  date: string;
  dayName: string;
  dayNumber: number;
}

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'] as const;

export function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function parseLocalIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getMondayOfWeek(date: Date): Date {
  const monday = new Date(date);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function getWeekDays(weekStartMonday: Date): WeekDay[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStartMonday, index);

    return {
      date: toLocalIsoDate(date),
      dayName: DAY_NAMES[date.getDay()],
      dayNumber: date.getDate(),
    };
  });
}

export function getIsoWeekLabel(weekStartMonday: Date): string {
  const thursday = addDays(weekStartMonday, 3);
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((thursday.getTime() - yearStart.getTime()) / 86_400_000 + yearStart.getDay() + 1) / 7,
  );

  return `Sem. ${weekNumber}`;
}
