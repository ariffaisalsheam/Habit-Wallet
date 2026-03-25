import type { HabitCompletion } from "@/features/habits/types";

export function isHabitCompletedForDate(
  completions: HabitCompletion[],
  habitId: string,
  date: string
) {
  return completions.some(
    (completion) => completion.habitId === habitId && completion.completionDate === date
  );
}

export function getHabitStreakDays(completions: HabitCompletion[], habitId: string, today: string) {
  const dates = new Set(
    completions
      .filter((completion) => completion.habitId === habitId)
      .map((completion) => completion.completionDate)
  );

  let streak = 0;
  const cursor = new Date(`${today}T00:00:00`);

  while (true) {
    const dateKey = cursor.toISOString().slice(0, 10);
    if (!dates.has(dateKey)) {
      break;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
