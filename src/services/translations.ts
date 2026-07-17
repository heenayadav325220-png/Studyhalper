export type Language = 'en' | 'hi';

export const TRANSLATIONS = {
  appName: {
    en: 'ASCEND STUDY',
    hi: 'असेंड स्टडी'
  },
  appSub: {
    en: 'Remix Study Buddy',
    hi: 'रेमिक्स स्टडी बडी'
  },
  home: {
    en: 'Dashboard',
    hi: 'डैशबोर्ड'
  },
  groupChat: {
    en: 'Study Rooms',
    hi: 'अध्ययन कक्ष'
  },
  whiteboard: {
    en: 'Collaboration Canvas',
    hi: 'सहयोग कैनवास'
  },
  mockExam: {
    en: 'AI Mock Exams',
    hi: 'एआई मॉक परीक्षाएं'
  },
  studyDocs: {
    en: 'Study Notes & Summaries',
    hi: 'अध्ययन नोट्स और सारांश'
  },
  petCompanion: {
    en: 'Virtual Study Pet',
    hi: 'आभासी अध्ययन पालतू जीव'
  },
  languageToggle: {
    en: 'हिंदी',
    hi: 'English'
  },
  level: {
    en: 'Student Level',
    hi: 'छात्र स्तर'
  },
  xp: {
    en: 'XP Points',
    hi: 'एक्सपी अंक'
  },
  streak: {
    en: 'Study Streak',
    hi: 'अध्ययन निरंतरता'
  },
  petStatus: {
    en: 'Pet Companion Status',
    hi: 'पालतू साथी की स्थिति'
  },
  feedPet: {
    en: 'Feed Pet (+50 XP)',
    hi: 'पालतू को खिलाएं (+50 एक्सपी)'
  },
  trainPet: {
    en: 'Train Companion (+100 XP)',
    hi: 'साथी को प्रशिक्षित करें (+100 एक्सपी)'
  },
  chatRoomsList: {
    en: 'Available Study Rooms',
    hi: 'उपलब्ध अध्ययन कक्ष'
  },
  enterRoom: {
    en: 'Enter Room',
    hi: 'कक्ष में प्रवेश करें'
  },
  sendMessage: {
    en: 'Send',
    hi: 'भेजें'
  },
  typeMessagePlaceholder: {
    en: 'Type your message...',
    hi: 'अपना संदेश लिखें...'
  },
  generateExam: {
    en: 'Generate AI Mock Exam',
    hi: 'एआई मॉक परीक्षा उत्पन्न करें'
  },
  subject: {
    en: 'Subject',
    hi: 'विषय'
  },
  topic: {
    en: 'Topic',
    hi: 'विषय'
  },
  submitting: {
    en: 'Submitting...',
    hi: 'जमा किया जा रहा है...'
  },
  generating: {
    en: 'AI is generating...',
    hi: 'एआई उत्पन्न कर रहा है...'
  },
  startExam: {
    en: 'Start Exam',
    hi: 'परीक्षा शुरू करें'
  },
  submitExam: {
    en: 'Submit Exam',
    hi: 'परीक्षा जमा करें'
  },
  score: {
    en: 'Your Score',
    hi: 'आपका स्कोर'
  },
  feedback: {
    en: 'AI Feedback',
    hi: 'एआई प्रतिक्रिया'
  },
  uploadNotes: {
    en: 'Upload or Paste Study Material',
    hi: 'अध्ययन सामग्री अपलोड करें या पेस्ट करें'
  },
  summarizeNotes: {
    en: 'Analyze & Summarize with AI',
    hi: 'एआई के साथ विश्लेषण और संक्षेप करें'
  },
  summaryResult: {
    en: 'AI Summary & Insights',
    hi: 'एआई सारांश और अंतर्दृष्टि'
  },
  whiteboardTools: {
    en: 'Whiteboard Tools',
    hi: 'व्हाइटबोर्ड उपकरण'
  },
  clearCanvas: {
    en: 'Clear Canvas',
    hi: 'कैनवास साफ करें'
  },
  brushColor: {
    en: 'Color',
    hi: 'रंग'
  },
  brushSize: {
    en: 'Size',
    hi: 'आकार'
  },
  noDocumentsYet: {
    en: 'No study notes available yet.',
    hi: 'अभी तक कोई अध्ययन नोट्स उपलब्ध नहीं हैं।'
  },
  noExamsYet: {
    en: 'No mock exams taken yet.',
    hi: 'अभी तक कोई मॉक परीक्षा नहीं ली गई है।'
  },
  welcomeBack: {
    en: 'Welcome back, Student!',
    hi: 'वापसी पर स्वागत है, छात्र!'
  },
  dailyQuests: {
    en: 'Daily Quests',
    hi: 'दैनिक कार्य'
  },
  quest1: {
    en: 'Complete 1 Mock Exam (+150 XP)',
    hi: '1 मॉक परीक्षा पूरी करें (+150 एक्सपी)'
  },
  quest2: {
    en: 'Summarize 1 Study Note (+100 XP)',
    hi: '1 अध्ययन नोट का संक्षेप करें (+100 एक्सपी)'
  },
  quest3: {
    en: 'Draw on Whiteboard (+50 XP)',
    hi: 'व्हाइटबोर्ड पर चित्र बनाएं (+50 एक्सपी)'
  }
};

export function t(key: keyof typeof TRANSLATIONS, lang: Language): string {
  return TRANSLATIONS[key]?.[lang] || TRANSLATIONS[key]?.['en'] || String(key);
}
