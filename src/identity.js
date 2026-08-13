// src/identity.js
//
// Pseudo-auth. On first visit the user picks a display name; we generate a
// UUID, insert a profile through the API layer, and keep it in localStorage.
// See docs/encore-spec.md §6.

import { createProfile } from './api/profiles';

const KEY = 'encore.user';

export function readLocalUser() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? null;
  } catch {
    return null; // corrupted value — treat as a new visitor
  }
}

export async function createLocalUser(displayName) {
  const profile = await createProfile(displayName);
  localStorage.setItem(KEY, JSON.stringify(profile));
  return profile;
}
