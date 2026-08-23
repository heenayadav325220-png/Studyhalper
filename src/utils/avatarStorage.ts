// Simple avatar persistence util using localStorage
const AVATAR_KEY = 'studybuddy_avatar';

export function saveAvatarBase64(base64Data: string) {
  try {
    localStorage.setItem(AVATAR_KEY, base64Data);
  } catch (e) {
    console.error('Could not save avatar to localStorage', e);
  }
}

export function loadAvatarBase64(): string | null {
  try {
    return localStorage.getItem(AVATAR_KEY);
  } catch (e) {
    console.error('Could not read avatar from localStorage', e);
    return null;
  }
}

export function clearSavedAvatar() {
  try {
    localStorage.removeItem(AVATAR_KEY);
  } catch (e) {
    console.error('Could not remove avatar from localStorage', e);
  }
}
