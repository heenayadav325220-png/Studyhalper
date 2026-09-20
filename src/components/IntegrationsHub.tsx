import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  HardDrive,
  FileText,
  GraduationCap,
  Calendar as CalendarIcon,
  Table,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  ChevronRight,
  X,
  Sparkles
} from "lucide-react";
import {
  authorizeGoogleService,
  getSavedToken,
  removeToken,
  fetchDriveFiles,
  fetchFileContent,
  fetchClassroomCourses,
  fetchClassroomCourseWork,
  fetchCalendarEvents,
  createCalendarEvent,
  fetchSpreadsheets,
  fetchSpreadsheetValues,
  GoogleDriveFile,
  GoogleClassroomCourse,
  GoogleClassroomCourseWork,
  GoogleCalendarEvent
} from "../services/googleWorkspace";
import { playUiSound } from "../services/soundEffects";

interface IntegrationsHubProps {
  appLanguage: string;
  audioFeedbackEnabled?: boolean;
  onAttachFile?: (file: { id: string; name: string; content: string; type: "drive" | "classroom" | "sheets" }) => void;
  attachedFiles?: Array<{ id: string; name: string; type: "drive" | "classroom" | "sheets" }>;
  onRemoveAttachedFile?: (id: string) => void;
}

export default function IntegrationsHub({
  appLanguage,
  audioFeedbackEnabled = true,
  onAttachFile,
  attachedFiles = [],
  onRemoveAttachedFile
}: IntegrationsHubProps) {
  const [tokens, setTokens] = useState<Record<string, string | null>>({
    drive: getSavedToken("drive"),
    docs: getSavedToken("docs"),
    classroom: getSavedToken("classroom"),
    calendar: getSavedToken("calendar"),
    sheets: getSavedToken("sheets")
  });

  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errorStates, setErrorStates] = useState<Record<string, string | null>>({});

  // Active integration errors check for developer observability
  if (Object.keys(errorStates).some(k => errorStates[k])) {
    console.warn("Active Google integration errors:", errorStates);
  }

  // Active sub-views for each card
  const [browsingDrive, setBrowsingDrive] = useState(false);
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [loadingDrive, setLoadingDrive] = useState(false);

  const [browsingClassroom, setBrowsingClassroom] = useState(false);
  const [courses, setCourses] = useState<GoogleClassroomCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<GoogleClassroomCourse | null>(null);
  const [coursework, setCoursework] = useState<GoogleClassroomCourseWork[]>([]);
  const [loadingClassroom, setLoadingClassroom] = useState(false);

  const [viewingCalendar, setViewingCalendar] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [newSessionDate, setNewSessionDate] = useState("");
  const [newSessionTime, setNewSessionTime] = useState("");
  const [newSessionDuration, setNewSessionDuration] = useState("60");
  const [scheduling, setScheduling] = useState(false);

  const [browsingSheets, setBrowsingSheets] = useState(false);
  const [sheetsFiles, setSheetsFiles] = useState<GoogleDriveFile[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<GoogleDriveFile | null>(null);
  const [sheetValues, setSheetValues] = useState<any[][]>([]);
  const [loadingSheets, setLoadingSheets] = useState(false);

  const t = {
    en: {
      title: "Google Workspace Hub",
      subtitle: "Elevate your learning with continuous Google workspace productivity tools",
      connected: "Connected",
      connecting: "Connecting...",
      notConnected: "Connect",
      reconnect: "Reconnect",
      disconnect: "Disconnect",
      error: "Authorization failed",
      driveDesc: "Access and attach study PDFs, files & textbooks to your AI Tutor",
      docsDesc: "Save generated notes, summaries and schedules instantly into Google Docs",
      classroomDesc: "Access active school courses and import course assignments",
      calendarDesc: "Schedule active study sessions and review upcoming sessions",
      sheetsDesc: "Analyze performance reports, marks & study progress spreadsheets",
      browse: "Browse",
      viewEvents: "View Events",
      schedule: "Schedule Session",
      select: "Select",
      attached: "Attached to Chat context",
      attaching: "Reading content...",
      attachmentReady: "Context loaded!",
      close: "Close"
    },
    hi: {
      title: "गूगल वर्कस्पेस हब",
      subtitle: "गूगल उत्पादकता टूल के साथ अपनी पढ़ाई को नया आयाम दें",
      connected: "जुड़ा हुआ",
      connecting: "कनेक्ट हो रहा है...",
      notConnected: "कनेक्ट करें",
      reconnect: "पुनः कनेक्ट करें",
      disconnect: "अलग करें",
      error: "सत्यापन विफल",
      driveDesc: "पढ़ाई के पीडीएफ, नोट्स और पाठ्यपुस्तकों को एआई ट्यूटर से जोड़ें",
      docsDesc: "एआई के उत्तरों, सारांश और समय सारिणी को गूगल डॉक्स में सहजता से सहेजें",
      classroomDesc: "अपने स्कूल के कोर्स और असाइनमेंट को यहाँ एक्सेस करें",
      calendarDesc: "स्टडी सेशन शेड्यूल करें और अपने कैलेंडर इवेंट देखें",
      sheetsDesc: "मार्क्स शीट, प्रोग्रेस रिपोर्ट और स्प्रेडशीट का विश्लेषण करें",
      browse: "ब्राउज़ करें",
      viewEvents: "इवेंट देखें",
      schedule: "सेशन शेड्यूल करें",
      select: "चुनें",
      attached: "चैट संदर्भ से जुड़ा",
      attaching: "सामग्री लोड हो रही है...",
      attachmentReady: "सामग्री तैयार है!",
      close: "बंद करें"
    }
  }[appLanguage === 'hi' ? 'hi' : 'en'];

  const handleConnect = (service: string) => {
    if (audioFeedbackEnabled) playUiSound("cyber_synth");
    setLoadingStates((prev) => ({ ...prev, [service]: true }));
    setErrorStates((prev) => ({ ...prev, [service]: null }));

    authorizeGoogleService(
      service,
      (token) => {
        setTokens((prev) => ({ ...prev, [service]: token }));
        setLoadingStates((prev) => ({ ...prev, [service]: false }));
      },
      (err) => {
        setErrorStates((prev) => ({ ...prev, [service]: err }));
        setLoadingStates((prev) => ({ ...prev, [service]: false }));
      }
    );
  };

  const handleDisconnect = (service: string) => {
    if (audioFeedbackEnabled) playUiSound("cyber_synth");
    removeToken(service);
    setTokens((prev) => ({ ...prev, [service]: null }));
    setErrorStates((prev) => ({ ...prev, [service]: null }));
  };

  // 1. DRIVE LOGIC
  const handleBrowseDrive = async () => {
    const token = tokens.drive;
    if (!token) return;
    setBrowsingDrive(true);
    setLoadingDrive(true);
    try {
      const files = await fetchDriveFiles(token);
      setDriveFiles(files);
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        handleDisconnect("drive");
        handleConnect("drive");
      } else {
        setErrorStates((prev) => ({ ...prev, drive: err.message }));
      }
    } finally {
      setLoadingDrive(false);
    }
  };

  const handleAttachDriveFile = async (file: GoogleDriveFile) => {
    const token = tokens.drive;
    if (!token || !onAttachFile) return;
    setLoadingDrive(true);
    try {
      const content = await fetchFileContent(token, file.id, file.mimeType);
      onAttachFile({
        id: file.id,
        name: file.name,
        content: content,
        type: "drive"
      });
      setBrowsingDrive(false);
    } catch (err) {
      alert("Could not load file content: " + err);
    } finally {
      setLoadingDrive(false);
    }
  };

  // 3. CLASSROOM LOGIC
  const handleBrowseClassroom = async () => {
    const token = tokens.classroom;
    if (!token) return;
    setBrowsingClassroom(true);
    setLoadingClassroom(true);
    try {
      const activeCourses = await fetchClassroomCourses(token);
      setCourses(activeCourses);
      setSelectedCourse(null);
      setCoursework([]);
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        handleDisconnect("classroom");
        handleConnect("classroom");
      } else {
        setErrorStates((prev) => ({ ...prev, classroom: err.message }));
      }
    } finally {
      setLoadingClassroom(false);
    }
  };

  const handleSelectCourse = async (course: GoogleClassroomCourse) => {
    const token = tokens.classroom;
    if (!token) return;
    setSelectedCourse(course);
    setLoadingClassroom(true);
    try {
      const work = await fetchClassroomCourseWork(token, course.id);
      setCoursework(work);
    } catch (err) {
      alert("Failed to load coursework: " + err);
    } finally {
      setLoadingClassroom(false);
    }
  };

  const handleAttachCourseWork = (work: GoogleClassroomCourseWork) => {
    if (!onAttachFile) return;
    onAttachFile({
      id: work.id,
      name: `Classroom: ${work.title}`,
      content: `[GOOGLE CLASSROOM ASSIGNMENT DETAILS]\nTitle: ${work.title}\nDescription: ${work.description || "None provided."}\nLink: ${work.alternateLink || "No link."}`,
      type: "classroom"
    });
    setBrowsingClassroom(false);
  };

  // 4. CALENDAR LOGIC
  const handleBrowseCalendar = async () => {
    const token = tokens.calendar;
    if (!token) return;
    setViewingCalendar(true);
    setLoadingCalendar(true);
    try {
      const items = await fetchCalendarEvents(token);
      setCalendarEvents(items);
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        handleDisconnect("calendar");
        handleConnect("calendar");
      } else {
        setErrorStates((prev) => ({ ...prev, calendar: err.message }));
      }
    } finally {
      setLoadingCalendar(false);
    }
  };

  const handleScheduleSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = tokens.calendar;
    if (!token || !newSessionTitle || !newSessionDate || !newSessionTime) return;

    setScheduling(true);
    try {
      await createCalendarEvent(
        token,
        newSessionTitle,
        newSessionDate,
        newSessionTime,
        parseInt(newSessionDuration)
      );
      alert("Study Session added to your Google Calendar!");
      setScheduleModal(false);
      setNewSessionTitle("");
      setNewSessionDate("");
      setNewSessionTime("");
      handleBrowseCalendar(); // refresh
    } catch (err) {
      alert("Scheduling failed: " + err);
    } finally {
      setScheduling(false);
    }
  };

  // 5. SHEETS LOGIC
  const handleBrowseSheets = async () => {
    const token = tokens.sheets;
    if (!token) return;
    setBrowsingSheets(true);
    setLoadingSheets(true);
    try {
      const spreadsheets = await fetchSpreadsheets(token);
      setSheetsFiles(spreadsheets);
      setSelectedSheet(null);
      setSheetValues([]);
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        handleDisconnect("sheets");
        handleConnect("sheets");
      } else {
        setErrorStates((prev) => ({ ...prev, sheets: err.message }));
      }
    } finally {
      setLoadingSheets(false);
    }
  };

  const handleSelectSheet = async (sheet: GoogleDriveFile) => {
    const token = tokens.sheets;
    if (!token) return;
    setSelectedSheet(sheet);
    setLoadingSheets(true);
    try {
      // Read values from the first sheet
      const values = await fetchSpreadsheetValues(token, sheet.id, "Sheet1!A1:Z100");
      setSheetValues(values);
    } catch (err) {
      alert("Could not read spreadsheet values: " + err);
    } finally {
      setLoadingSheets(false);
    }
  };

  const handleAttachSheet = () => {
    if (!selectedSheet || !onAttachFile) return;
    const formattedRows = sheetValues.map(row => row.join(" | ")).join("\n");
    onAttachFile({
      id: selectedSheet.id,
      name: `Sheets: ${selectedSheet.name}`,
      content: `[GOOGLE SPREADSHEET PROGRESS DATA]\nFilename: ${selectedSheet.name}\nData:\n${formattedRows}`,
      type: "sheets"
    });
    setBrowsingSheets(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 text-slate-100 p-1 sm:p-2 pb-16">
      
      {/* HEADER HERO */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-br from-slate-950 via-indigo-950/40 to-slate-950 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="space-y-2 text-center sm:text-left relative z-10 max-w-xl">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-black tracking-widest uppercase px-3 py-1 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Productivity Workspace</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent leading-tight">
            {t.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            {t.subtitle}
          </p>
        </div>

        {attachedFiles.length > 0 && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 min-w-[240px] text-left relative z-10 space-y-2 shadow-lg">
            <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase block">
              Active Context Attachments ({attachedFiles.length})
            </span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {attachedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between text-xs bg-slate-950/80 border border-slate-800 p-1.5 px-2 rounded-lg">
                  <span className="truncate max-w-[140px] font-mono text-slate-300">
                    {file.name}
                  </span>
                  <button
                    onClick={() => onRemoveAttachedFile?.(file.id)}
                    className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-rose-400"
                    title="Remove Context"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* INTEGRATIONS CARDS LIST */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* 1. GOOGLE DRIVE CARD */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4.5 space-y-3 flex flex-col justify-between group hover:border-indigo-500/40 transition duration-250 shadow-md">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition">
                <HardDrive className="w-5 h-5 text-blue-400" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                tokens.drive 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                  : "bg-slate-950/80 border-slate-800 text-slate-500"
              }`}>
                {tokens.drive ? t.connected : "Disconnected"}
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-100">Google Drive</h3>
              <p className="text-[11.5px] text-slate-400 font-medium leading-relaxed mt-0.5">
                {t.driveDesc}
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            {tokens.drive ? (
              <>
                <button
                  onClick={handleBrowseDrive}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-xs text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{t.browse}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDisconnect("drive")}
                  className="py-1.5 px-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-400 hover:text-rose-400 transition cursor-pointer"
                >
                  {t.disconnect}
                </button>
              </>
            ) : (
              <button
                onClick={() => handleConnect("drive")}
                disabled={loadingStates.drive}
                className="w-full py-1.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 font-bold text-xs text-slate-200 hover:text-white transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {loadingStates.drive && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{t.notConnected}</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. GOOGLE DOCS CARD */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4.5 space-y-3 flex flex-col justify-between group hover:border-indigo-500/40 transition duration-250 shadow-md">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition">
                <FileText className="w-5 h-5 text-cyan-400" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                tokens.docs 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                  : "bg-slate-950/80 border-slate-800 text-slate-500"
              }`}>
                {tokens.docs ? t.connected : "Disconnected"}
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-100">Google Docs</h3>
              <p className="text-[11.5px] text-slate-400 font-medium leading-relaxed mt-0.5">
                {t.docsDesc}
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            {tokens.docs ? (
              <>
                <div className="flex-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-1.5 text-center flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready for exporting!</span>
                </div>
                <button
                  onClick={() => handleDisconnect("docs")}
                  className="py-1.5 px-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-400 hover:text-rose-400 transition cursor-pointer"
                >
                  {t.disconnect}
                </button>
              </>
            ) : (
              <button
                onClick={() => handleConnect("docs")}
                disabled={loadingStates.docs}
                className="w-full py-1.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 font-bold text-xs text-slate-200 hover:text-white transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {loadingStates.docs && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{t.notConnected}</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. GOOGLE CLASSROOM CARD */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4.5 space-y-3 flex flex-col justify-between group hover:border-indigo-500/40 transition duration-250 shadow-md">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
                <GraduationCap className="w-5 h-5 text-emerald-400" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                tokens.classroom 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                  : "bg-slate-950/80 border-slate-800 text-slate-500"
              }`}>
                {tokens.classroom ? t.connected : "Disconnected"}
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-100">Google Classroom</h3>
              <p className="text-[11.5px] text-slate-400 font-medium leading-relaxed mt-0.5">
                {t.classroomDesc}
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            {tokens.classroom ? (
              <>
                <button
                  onClick={handleBrowseClassroom}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{t.browse}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDisconnect("classroom")}
                  className="py-1.5 px-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-400 hover:text-rose-400 transition cursor-pointer"
                >
                  {t.disconnect}
                </button>
              </>
            ) : (
              <button
                onClick={() => handleConnect("classroom")}
                disabled={loadingStates.classroom}
                className="w-full py-1.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 font-bold text-xs text-slate-200 hover:text-white transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {loadingStates.classroom && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{t.notConnected}</span>
              </button>
            )}
          </div>
        </div>

        {/* 4. GOOGLE CALENDAR CARD */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4.5 space-y-3 flex flex-col justify-between group hover:border-indigo-500/40 transition duration-250 shadow-md">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition">
                <CalendarIcon className="w-5 h-5 text-amber-400" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                tokens.calendar 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                  : "bg-slate-950/80 border-slate-800 text-slate-500"
              }`}>
                {tokens.calendar ? t.connected : "Disconnected"}
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-100">Google Calendar</h3>
              <p className="text-[11.5px] text-slate-400 font-medium leading-relaxed mt-0.5">
                {t.calendarDesc}
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            {tokens.calendar ? (
              <>
                <button
                  onClick={handleBrowseCalendar}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 font-bold text-xs text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{t.browse}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDisconnect("calendar")}
                  className="py-1.5 px-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-400 hover:text-rose-400 transition cursor-pointer"
                >
                  {t.disconnect}
                </button>
              </>
            ) : (
              <button
                onClick={() => handleConnect("calendar")}
                disabled={loadingStates.calendar}
                className="w-full py-1.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 font-bold text-xs text-slate-200 hover:text-white transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {loadingStates.calendar && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{t.notConnected}</span>
              </button>
            )}
          </div>
        </div>

        {/* 5. GOOGLE SHEETS CARD */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4.5 space-y-3 flex flex-col justify-between group hover:border-indigo-500/40 transition duration-250 shadow-md">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-105 transition">
                <Table className="w-5 h-5 text-teal-400" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                tokens.sheets 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                  : "bg-slate-950/80 border-slate-800 text-slate-500"
              }`}>
                {tokens.sheets ? t.connected : "Disconnected"}
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-100">Google Sheets</h3>
              <p className="text-[11.5px] text-slate-400 font-medium leading-relaxed mt-0.5">
                {t.sheetsDesc}
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            {tokens.sheets ? (
              <>
                <button
                  onClick={handleBrowseSheets}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 font-bold text-xs text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{t.browse}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDisconnect("sheets")}
                  className="py-1.5 px-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-400 hover:text-rose-400 transition cursor-pointer"
                >
                  {t.disconnect}
                </button>
              </>
            ) : (
              <button
                onClick={() => handleConnect("sheets")}
                disabled={loadingStates.sheets}
                className="w-full py-1.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 font-bold text-xs text-slate-200 hover:text-white transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {loadingStates.sheets && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{t.notConnected}</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* OVERLAY VIEWS FOR BROWSED CONTENT */}
      
      {/* 1. DRIVE FILE PICKER VIEW */}
      <AnimatePresence>
        {browsingDrive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-5 space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                  <HardDrive className="w-4 h-4 text-blue-400" />
                  <span>Google Drive Browser</span>
                </span>
                <button
                  onClick={() => setBrowsingDrive(false)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[300px]">
                {loadingDrive ? (
                  <div className="h-full flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                  </div>
                ) : driveFiles.length > 0 ? (
                  driveFiles.map((file) => (
                    <div key={file.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl hover:border-blue-500/50 flex items-center justify-between gap-3 group transition">
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-200 block truncate">
                          {file.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {file.mimeType.split(".").pop() || "File"}
                        </span>
                      </div>
                      <button
                        onClick={() => handleAttachDriveFile(file)}
                        className="py-1 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold cursor-pointer transition shrink-0"
                      >
                        Attach
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-16 text-center text-slate-500 text-xs italic">
                    No files found in Google Drive.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. CLASSROOM COURSES & COURSEWORK BROWSER */}
      <AnimatePresence>
        {browsingClassroom && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-5 space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4 text-emerald-400" />
                  <span>Google Classroom Manager</span>
                </span>
                <button
                  onClick={() => setBrowsingClassroom(false)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {loadingClassroom ? (
                <div className="flex-1 flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                </div>
              ) : !selectedCourse ? (
                // Course List View
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[300px]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Select active Course
                  </span>
                  {courses.length > 0 ? (
                    courses.map((course) => (
                      <div
                        key={course.id}
                        onClick={() => handleSelectCourse(course)}
                        className="p-3.5 bg-slate-950/60 border border-slate-800 hover:border-emerald-500/50 rounded-2xl cursor-pointer flex items-center justify-between group transition"
                      >
                        <div>
                          <span className="text-xs font-extrabold text-slate-200 block">
                            {course.name}
                          </span>
                          {course.descriptionHeading && (
                            <span className="text-[10px] text-slate-500">
                              {course.descriptionHeading}
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
                      </div>
                    ))
                  ) : (
                    <div className="py-16 text-center text-slate-500 text-xs italic">
                      No Google Classroom courses found.
                    </div>
                  )}
                </div>
              ) : (
                // Coursework / Assignments View
                <div className="flex-1 flex flex-col space-y-3 min-h-[300px] overflow-hidden">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCourse(null)}
                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300"
                    >
                      &larr; Back to Courses
                    </button>
                    <span className="text-slate-600">/</span>
                    <span className="text-xs font-extrabold text-slate-300 truncate">
                      {selectedCourse.name}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {coursework.length > 0 ? (
                      coursework.map((work) => (
                        <div key={work.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between gap-3 group transition">
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-200 block truncate">
                              {work.title}
                            </span>
                            {work.creationTime && (
                              <span className="text-[9.5px] text-slate-500">
                                Created: {new Date(work.creationTime).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleAttachCourseWork(work)}
                            className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer shrink-0 transition"
                          >
                            Attach Context
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="py-16 text-center text-slate-500 text-xs italic">
                        No assignments or coursework found in this class.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. CALENDAR EVENTS & STUDY SCHEDULE MODAL */}
      <AnimatePresence>
        {viewingCalendar && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-5 space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                  <CalendarIcon className="w-4 h-4 text-amber-400" />
                  <span>Google Calendar Study Sessions</span>
                </span>
                <button
                  onClick={() => setViewingCalendar(false)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Upcoming Events
                </span>
                <button
                  onClick={() => setScheduleModal(true)}
                  className="py-1 px-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] uppercase rounded-lg cursor-pointer flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{t.schedule}</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[250px]">
                {loadingCalendar ? (
                  <div className="h-full flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                  </div>
                ) : calendarEvents.length > 0 ? (
                  calendarEvents.map((ev) => (
                    <div key={ev.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex justify-between items-center gap-3">
                      <div>
                        <span className="text-xs font-bold text-slate-100 block">
                          {ev.summary}
                        </span>
                        {ev.start && (
                          <span className="text-[9.5px] font-mono text-amber-400">
                            {ev.start.dateTime 
                              ? new Date(ev.start.dateTime).toLocaleString()
                              : ev.start.date}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-16 text-center text-slate-500 text-xs italic">
                    No upcoming sessions found in your primary calendar.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SCHEDULE MODAL (CALENDAR WRITE) */}
      <AnimatePresence>
        {scheduleModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <form onSubmit={handleScheduleSession} className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs font-bold text-slate-200">
                  Schedule Study Session (Write Confirmation)
                </span>
                <button
                  type="button"
                  onClick={() => setScheduleModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Session Title</label>
                  <input
                    type="text"
                    required
                    value={newSessionTitle}
                    onChange={(e) => setNewSessionTitle(e.target.value)}
                    placeholder="e.g. Maths Trigonometry Revision"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date</label>
                    <input
                      type="date"
                      required
                      value={newSessionDate}
                      onChange={(e) => setNewSessionDate(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Time</label>
                    <input
                      type="time"
                      required
                      value={newSessionTime}
                      onChange={(e) => setNewSessionTime(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Duration</label>
                  <select
                    value={newSessionDuration}
                    onChange={(e) => setNewSessionDuration(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-hidden"
                  >
                    <option value="30">30 Minutes</option>
                    <option value="60">1 Hour</option>
                    <option value="90">1.5 Hours</option>
                    <option value="120">2 Hours</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setScheduleModal(false)}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl flex items-center space-x-1.5 cursor-pointer"
                >
                  {scheduling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm & Create</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. SHEETS VALUE ANALYZER VIEW */}
      <AnimatePresence>
        {browsingSheets && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-5 space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                  <Table className="w-4 h-4 text-teal-400" />
                  <span>Google Sheets Study Progress Tracker</span>
                </span>
                <button
                  onClick={() => setBrowsingSheets(false)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {loadingSheets ? (
                <div className="flex-1 flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                </div>
              ) : !selectedSheet ? (
                // Sheets List
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[300px]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Select spreadsheet
                  </span>
                  {sheetsFiles.length > 0 ? (
                    sheetsFiles.map((sheet) => (
                      <div
                        key={sheet.id}
                        onClick={() => handleSelectSheet(sheet)}
                        className="p-3.5 bg-slate-950/60 border border-slate-800 hover:border-teal-500/50 rounded-2xl cursor-pointer flex items-center justify-between group transition"
                      >
                        <div>
                          <span className="text-xs font-extrabold text-slate-200 block">
                            {sheet.name}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 group-hover:translate-x-0.5 transition" />
                      </div>
                    ))
                  ) : (
                    <div className="py-16 text-center text-slate-500 text-xs italic">
                      No Google Spreadsheets found in your Drive.
                    </div>
                  )}
                </div>
              ) : (
                // Sheet Values Preview
                <div className="flex-1 flex flex-col space-y-3 min-h-[300px] overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedSheet(null)}
                        className="text-xs font-bold text-teal-400 hover:text-teal-300"
                      >
                        &larr; Back to Sheets
                      </button>
                      <span className="text-slate-600">/</span>
                      <span className="text-xs font-extrabold text-slate-300 truncate">
                        {selectedSheet.name}
                      </span>
                    </div>

                    <button
                      onClick={handleAttachSheet}
                      className="py-1 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-bold cursor-pointer transition shrink-0"
                    >
                      Attach context to AI Tutor
                    </button>
                  </div>

                  <div className="flex-1 overflow-auto border border-slate-800 rounded-2xl bg-slate-950/50 p-2">
                    {sheetValues.length > 0 ? (
                      <table className="w-full text-left text-xs text-slate-300 font-mono">
                        <tbody>
                          {sheetValues.slice(0, 20).map((row, rIdx) => (
                            <tr key={rIdx} className="border-b border-slate-900/50">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="p-2 border-r border-slate-900/50 whitespace-nowrap">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="py-16 text-center text-slate-500 text-xs italic">
                        Spreadsheet is empty or values could not be displayed.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
