import en from "./en";
import vi from "./vi";
import zh from "./zh";
import type { Locale } from "../config";

export const dicts: Record<Locale, Record<string, unknown>> = { en, vi, zh };
