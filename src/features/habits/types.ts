export type HabitFrequency = "daily" | "weekly" | "custom";

export type HabitItem = {
  id: string;
  title: string;
  category: string;
  color: string;
  frequency: HabitFrequency;
  targetDaysPerWeek: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type HabitCompletion = {
  id: string;
  habitId: string;
  completionDate: string;
  completedAt: string;
  notes: string;
  synced: boolean;
};

export type HabitInput = {
  title: string;
  category: string;
  color: string;
  frequency: HabitFrequency;
  targetDaysPerWeek: number;
};
