import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getPathFromUrl = (url: string) => {
  if (!url) return null;
  try {
    const urlObject = new URL(url);
    const path = urlObject.pathname.split('/musicfiles/')[1];
    return path;
  } catch (e) {
    console.error("Invalid URL for storage object:", url);
    return null;
  }
};

export const sanitizeFileName = (fileName: string): string => {
  // Normaliza a la forma NFD de Unicode y elimina los diacríticos (p. ej., ô -> o)
  const withoutDiacritics = fileName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Reemplaza espacios y otros caracteres problemáticos con guiones bajos
  // Permite letras, números, guion bajo, guion y punto
  const sanitized = withoutDiacritics.replace(/[^a-zA-Z0-9._-]/g, '_');
  return sanitized;
};