import defaultFirebaseConfig from "../../firebase-applet-config.json";

const OAUTH_CLIENT_ID = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID || (defaultFirebaseConfig as any).oAuthClientId || "";

export interface IntegrationState {
  connected: boolean;
  connecting: boolean;
  token: string | null;
  error: string | null;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
}

export interface GoogleClassroomCourse {
  id: string;
  name: string;
  descriptionHeading?: string;
  alternateLink?: string;
}

export interface GoogleClassroomCourseWork {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  alternateLink?: string;
  creationTime?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

// Scopes associated with each service
export const WORKSPACE_SCOPES: Record<string, string[]> = {
  drive: ["https://www.googleapis.com/auth/drive.readonly"],
  docs: ["https://www.googleapis.com/auth/documents"],
  classroom: [
    "https://www.googleapis.com/auth/classroom.courses.readonly",
    "https://www.googleapis.com/auth/classroom.coursework.me.readonly"
  ],
  calendar: ["https://www.googleapis.com/auth/calendar.events"],
  sheets: ["https://www.googleapis.com/auth/spreadsheets"]
};

// Lazy script loader for Google Identity Services
export function loadGoogleGsi(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve();
    if ((window as any).google?.accounts?.oauth2) {
      return resolve();
    }
    const id = "google-gsi-client";
    if (document.getElementById(id)) {
      // Script is already appending, wait for it
      const interval = setInterval(() => {
        if ((window as any).google?.accounts?.oauth2) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

// Save & load helper for session tokens
export function getSavedToken(service: string): string | null {
  try {
    return sessionStorage.getItem(`google_token_${service}`);
  } catch {
    return null;
  }
}

export function saveToken(service: string, token: string) {
  try {
    sessionStorage.setItem(`google_token_${service}`, token);
  } catch (e) {
    console.error("Failed to save token to sessionStorage:", e);
  }
}

export function removeToken(service: string) {
  try {
    sessionStorage.removeItem(`google_token_${service}`);
  } catch (e) {
    console.error("Failed to remove token from sessionStorage:", e);
  }
}

// Request auth token via GIS Client Popup
export async function authorizeGoogleService(
  service: string,
  onSuccess: (token: string) => void,
  onFailure: (error: string) => void
) {
  try {
    await loadGoogleGsi();
    const scopes = WORKSPACE_SCOPES[service];
    if (!scopes) {
      throw new Error(`Unknown service: ${service}`);
    }

    const google = (window as any).google;
    if (!google?.accounts?.oauth2) {
      throw new Error("Google Identity Services script failed to initialize. Try refreshing.");
    }

    const client = google.accounts.oauth2.initTokenClient({
      client_id: OAUTH_CLIENT_ID,
      scope: scopes.join(" "),
      callback: (response: any) => {
        if (response.error) {
          onFailure(response.error_description || response.error);
        } else if (response.access_token) {
          saveToken(service, response.access_token);
          onSuccess(response.access_token);
        } else {
          onFailure("No access token returned from authorization.");
        }
      },
      error_callback: (err: any) => {
        onFailure(err?.message || "OAuth authorization failed.");
      }
    });

    client.requestAccessToken({ prompt: "consent" });
  } catch (err: any) {
    onFailure(err?.message || "Google client initial setup failed.");
  }
}

// Fetch helper with handling for token expiry/revocation
async function fetchWithGoogleAuth(url: string, token: string, options: RequestInit = {}): Promise<any> {
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    throw new Error("UNAUTHORIZED"); // Caller can catch and handle re-authorization
  }
  if (!response.ok) {
    const errText = await response.text();
    let parsedErr;
    try {
      parsedErr = JSON.parse(errText);
    } catch {
      parsedErr = { error: { message: errText } };
    }
    throw new Error(parsedErr?.error?.message || `Google API error: ${response.statusText}`);
  }
  return response.json();
}

// 1. GOOGLE DRIVE API FUNCTIONS
export async function fetchDriveFiles(token: string): Promise<GoogleDriveFile[]> {
  // Lists PDFs, text files, word files, spreadsheets, presentations, and folder filters
  const query = "mimeType != 'application/vnd.google-apps.folder' and trashed = false";
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size)&pageSize=50`;
  const data = await fetchWithGoogleAuth(url, token);
  return data.files || [];
}

export async function fetchFileContent(token: string, fileId: string, mimeType: string): Promise<string> {
  // If it is a native Google Doc, we must export it to text/plain
  if (mimeType === "application/vnd.google-apps.document") {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.status === 401) throw new Error("UNAUTHORIZED");
    if (!response.ok) throw new Error("Failed to export Google Doc");
    return response.text();
  }

  // If it is a Google Spreadsheet, export as text/csv
  if (mimeType === "application/vnd.google-apps.spreadsheet") {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/csv`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.status === 401) throw new Error("UNAUTHORIZED");
    if (!response.ok) throw new Error("Failed to export Google Sheet");
    return response.text();
  }
  
  // For standard files, try fetching their text content directly or return metadata summary
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.status === 401) throw new Error("UNAUTHORIZED");
    if (response.ok) {
      const text = await response.text();
      // Only keep readable characters or limit length to prevent huge binary payload
      if (text.length < 50000 && !text.includes("\u0000")) {
        return text;
      }
    }
  } catch {
    // Fall back to returning description/name if direct media download fails
  }
  
  return `[External File ID: ${fileId} | MimeType: ${mimeType}]`;
}

// 2. GOOGLE DOCS API FUNCTIONS
export async function createGoogleDoc(token: string, title: string, content: string): Promise<string> {
  const docUrl = "https://docs.googleapis.com/v1/documents";
  const newDoc = await fetchWithGoogleAuth(docUrl, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title })
  });

  const docId = newDoc.documentId;
  
  // Clean markdown or html syntax to make it highly polished text in Google Docs
  const cleanContent = content
    .replace(/[#*`~_]/g, "") // Remove standard simple markdown characters
    .trim();

  const updateUrl = `https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`;
  await fetchWithGoogleAuth(updateUrl, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            text: cleanContent,
            location: { index: 1 }
          }
        }
      ]
    })
  });

  return docId;
}

// 3. GOOGLE CLASSROOM API FUNCTIONS
export async function fetchClassroomCourses(token: string): Promise<GoogleClassroomCourse[]> {
  const url = "https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE";
  const data = await fetchWithGoogleAuth(url, token);
  return data.courses || [];
}

export async function fetchClassroomCourseWork(token: string, courseId: string): Promise<GoogleClassroomCourseWork[]> {
  const url = `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`;
  const data = await fetchWithGoogleAuth(url, token);
  return (data.courseWork || []).map((work: any) => ({
    id: work.id,
    courseId: work.courseId,
    title: work.title,
    description: work.description,
    alternateLink: work.alternateLink,
    creationTime: work.creationTime
  }));
}

// 4. GOOGLE CALENDAR API FUNCTIONS
export async function fetchCalendarEvents(token: string): Promise<GoogleCalendarEvent[]> {
  const nowISO = new Date().toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(nowISO)}&maxResults=15&singleEvents=true&orderBy=startTime`;
  const data = await fetchWithGoogleAuth(url, token);
  return data.items || [];
}

export async function createCalendarEvent(
  token: string,
  title: string,
  dateString: string,
  timeString: string,
  durationMinutes: number
): Promise<any> {
  const startDateTime = new Date(`${dateString}T${timeString}`);
  const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

  const url = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
  return fetchWithGoogleAuth(url, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      summary: title,
      description: "Automated study session scheduled via Ascend Study AI Tutor Workspace",
      start: { dateTime: startDateTime.toISOString() },
      end: { dateTime: endDateTime.toISOString() },
      reminders: { useDefault: true }
    })
  });
}

// 5. GOOGLE SHEETS API FUNCTIONS
export async function fetchSpreadsheets(token: string): Promise<GoogleDriveFile[]> {
  const query = "mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false";
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&pageSize=50`;
  const data = await fetchWithGoogleAuth(url, token);
  return data.files || [];
}

export async function fetchSpreadsheetValues(token: string, spreadsheetId: string, range: string): Promise<any[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const data = await fetchWithGoogleAuth(url, token);
  return data.values || [];
}

export async function appendSpreadsheetRow(token: string, spreadsheetId: string, range: string, values: any[][]): Promise<any> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;
  return fetchWithGoogleAuth(url, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ values })
  });
}
