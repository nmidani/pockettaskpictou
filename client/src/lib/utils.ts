import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PICTOU_TOWNS = [
  "New Glasgow", "Stellarton", "Trenton", "Westville",
  "Pictou", "River John", "Abercrombie", "Scotsburn"
] as const;

export const TASK_CATEGORIES = [
  "Yard Work", "Moving & Heavy Lifting", "Cleaning", 
  "Delivery & Errands", "Handyman", "Tech Help", "Pet Care", "Other"
] as const;

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount);
}
