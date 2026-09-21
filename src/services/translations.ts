export type Language = 'en' | 'hi' | 'hinglish' | 'marathi' | 'tamil' | 'bengali';

export const TRANSLATIONS: Record<string, Record<Language, string>> = {
  appName: {
    en: 'StudyHelper',
    hi: 'स्टडी हेल्पर',
    hinglish: 'StudyHelper',
    marathi: 'स्टडी हेल्पर',
    tamil: 'ஸ்டடி ஹெல்ப்பர்',
    bengali: 'স্টাডি হেল্পার'
  },
  appSub: {
    en: 'AI Study Companion',
    hi: 'एआई स्टडी साथी',
    hinglish: 'AI Study Companion',
    marathi: 'एआय स्टडी साथी',
    tamil: 'AI ஆய்வு தோழன்',
    bengali: 'এআই স্টাডি সঙ্গী'
  },
  home: {
    en: 'Home',
    hi: 'मुख्य पृष्ठ',
    hinglish: 'Home Screen',
    marathi: 'मुख्य पृष्ठ',
    tamil: 'முகப்பு',
    bengali: 'হোম পেজ'
  },
  groupChat: {
    en: 'Study Rooms',
    hi: 'अध्ययन कक्ष',
    hinglish: 'Study Rooms',
    marathi: 'अभ्यास कक्ष',
    tamil: 'ஆய்வு அறைகள்',
    bengali: 'স্টাডি রুম'
  },
  aiTutor: {
    en: 'AI Tutor',
    hi: 'एआई ट्यूटर',
    hinglish: 'AI Tutor',
    marathi: 'एआय ट्यूटर',
    tamil: 'AI ஆசிரியர்',
    bengali: 'এআই টিউটর'
  },
  toolkit: {
    en: 'Tools',
    hi: 'उपकरण',
    hinglish: 'Tools',
    marathi: 'साधने',
    tamil: 'கருவிகள்',
    bengali: 'সরঞ্জাম'
  },
  whiteboard: {
    en: 'Collaboration Canvas',
    hi: 'सहयोग कैनवास',
    hinglish: 'Drawing Board',
    marathi: 'सहयोग कॅनव्हास',
    tamil: 'கூட்டு கேன்வாஸ்',
    bengali: 'সহযোগ ক্যানভাস'
  },
  mockExam: {
    en: 'AI Mock Exams',
    hi: 'एआई मॉक परीक्षाएं',
    hinglish: 'AI Mock Test',
    marathi: 'एआय मॉक परीक्षा',
    tamil: 'AI மாதிரி தேர்வுகள்',
    bengali: 'এআই মক পরীক্ষা'
  },
  studyDocs: {
    en: 'Study Notes & Summaries',
    hi: 'अध्ययन नोट्स और सारांश',
    hinglish: 'Notes & Summaries',
    marathi: 'अभ्यास नोट्स आणि सारांश',
    tamil: 'ஆய்வு குறிப்புகள் & சுருக்கம்',
    bengali: 'স্টাডি নোটস ও সারসংক্ষেপ'
  },
  petCompanion: {
    en: 'Virtual Study Pet',
    hi: 'आभासी अध्ययन पालतू जीव',
    hinglish: 'Virtual Study Pet',
    marathi: 'व्हर्च्युअल अभ्यास पाळीव प्राणी',
    tamil: 'மெய்நிகர் ஆய்வு செல்லப்பிராணி',
    bengali: 'ভার्चুয়াল স্টাডি পেট'
  },
  languageToggle: {
    en: 'हिंदी',
    hi: 'English',
    hinglish: 'English',
    marathi: 'English',
    tamil: 'English',
    bengali: 'English'
  },
  level: {
    en: 'Student Level',
    hi: 'छात्र स्तर',
    hinglish: 'Student Level',
    marathi: 'विद्यार्थी पातळी',
    tamil: 'மாணவர் நிலை',
    bengali: 'ছাত্র स्तर'
  },
  xp: {
    en: 'XP Points',
    hi: 'एक्सपी अंक',
    hinglish: 'XP Points',
    marathi: 'एक्सपी गुण',
    tamil: 'எக்ஸ்பि புள்ளிகள்',
    bengali: 'एक्सपी पॉइंट'
  },
  streak: {
    en: 'Study Streak',
    hi: 'अध्ययन निरंतरता',
    hinglish: 'Daily Streak',
    marathi: 'अभ्यास स्ट्रीक',
    tamil: 'தினசரி ஆய்வுத் தொடர்ச்சி',
    bengali: 'স্টাডি স্ট্রিপ'
  },
  petStatus: {
    en: 'Pet Companion Status',
    hi: 'पालतू साथी की स्थिति',
    hinglish: 'Companion Status',
    marathi: 'पाळीव प्राण्याची स्थिती',
    tamil: 'செல்லப்பிராணி நிலை',
    bengali: 'পোষা প্রাণীর অবস্থা'
  },
  feedPet: {
    en: 'Feed Pet (+50 XP)',
    hi: 'पालतू को खिलाएं (+50 एक्सपी)',
    hinglish: 'Pet ko feed karein (+50 XP)',
    marathi: 'पाळीव प्राण्याला खायला द्या (+५० XP)',
    tamil: 'செல்லப்பிராணிக்கு உணவளிக்கவும் (+50 XP)',
    bengali: 'পোষা প্রাণীকে খাওয়ান (+50 XP)'
  },
  trainPet: {
    en: 'Train Companion (+100 XP)',
    hi: 'साथी को प्रशिक्षित करें (+100 एक्सपी)',
    hinglish: 'Pet ko train karein (+100 XP)',
    marathi: 'पाळीव प्राण्याला प्रशिक्षित करा (+१०० XP)',
    tamil: 'செல்லப்பிராணிக்கு பயிற்சி அளிக்கவும் (+100 XP)',
    bengali: 'পোষा প্রাণীকে প্রশিক্ষণ দিন (+100 XP)'
  },
  chatRoomsList: {
    en: 'Available Study Rooms',
    hi: 'उपलब्ध अध्ययन कक्ष',
    hinglish: 'Available Study Rooms',
    marathi: 'उपलब्ध अभ्यास कक्ष',
    tamil: 'கிடைக்கக்கூடிய ஆய்வு அறைகள்',
    bengali: 'উপলব্ধ স্টাডি रूम'
  },
  enterRoom: {
    en: 'Enter Room',
    hi: 'कक्ष में प्रवेश करें',
    hinglish: 'Room me enter karein',
    marathi: 'कक्षात प्रवेश करा',
    tamil: 'அறையில் நுழையவும்',
    bengali: 'রুমে প্রবেশ করুন'
  },
  sendMessage: {
    en: 'Send',
    hi: 'भेजें',
    hinglish: 'Send',
    marathi: 'पाठवा',
    tamil: 'அனுப்பு',
    bengali: 'পাঠান'
  },
  typeMessagePlaceholder: {
    en: 'Type your message...',
    hi: 'अपना संदेश लिखें...',
    hinglish: 'Message type karein...',
    marathi: 'तुमचा संदेश टाइप करा...',
    tamil: 'உங்கள் செய்தியை தட்டச்சு செய்யவும்...',
    bengali: 'আপনার বার্তা লিখুন...'
  },
  generateExam: {
    en: 'Generate AI Mock Exam',
    hi: 'एआई मॉक परीक्षा उत्पन्न करें',
    hinglish: 'AI Mock Test generate karein',
    marathi: 'एआय मॉक परीक्षा तयार करा',
    tamil: 'AI மாதிரி தேர்வை உருவாக்கவும்',
    bengali: 'এআই মক পরীক্ষা তৈরি করুন'
  },
  subject: {
    en: 'Subject',
    hi: 'विषय',
    hinglish: 'Subject',
    marathi: 'विषय',
    tamil: 'பாடம்',
    bengali: 'বিষয়'
  },
  topic: {
    en: 'Topic',
    hi: 'विषय',
    hinglish: 'Topic',
    marathi: 'विषय',
    tamil: 'தலைப்பு',
    bengali: 'টপিক'
  },
  submitting: {
    en: 'Submitting...',
    hi: 'जमा किया जा रहा है...',
    hinglish: 'Submit ho raha hai...',
    marathi: 'सबमिट करत आहे...',
    tamil: 'சமர்ப்பிக்கிறது...',
    bengali: 'জমা দেওয়া হচ্ছে...'
  },
  generating: {
    en: 'AI is generating...',
    hi: 'एआई उत्पन्न कर रहा है...',
    hinglish: 'AI generate kar raha hai...',
    marathi: 'एआय तयार करत आहे...',
    tamil: 'AI உருவாக்குகிறது...',
    bengali: 'এআই তৈরি করছে...'
  },
  startExam: {
    en: 'Start Exam',
    hi: 'परीक्षा शुरू करें',
    hinglish: 'Exam start karein',
    marathi: 'परीक्षा सुरू करा',
    tamil: 'தேர்வைத் தொடங்கவும்',
    bengali: 'পরীক্ষা শুরু করুন'
  },
  submitExam: {
    en: 'Submit Exam',
    hi: 'परीक्षा जमा करें',
    hinglish: 'Exam submit karein',
    marathi: 'परीक्षा सबमिट करा',
    tamil: 'தேர்வை சமர்ப்பிக்கவும்',
    bengali: 'পরীক্ষা জমা দিন'
  },
  score: {
    en: 'Your Score',
    hi: 'आपका स्कोर',
    hinglish: 'Aapka Score',
    marathi: 'तुमचा स्कोअर',
    tamil: 'உங்கள் மதிப்பெண்',
    bengali: 'আপনার স্কোর'
  },
  feedback: {
    en: 'AI Feedback',
    hi: 'एआई प्रतिक्रिया',
    hinglish: 'AI Feedback',
    marathi: 'एआय अभिप्राय',
    tamil: 'AI கருத்து',
    bengali: 'এআই মতামত'
  },
  uploadNotes: {
    en: 'Upload or Paste Study Material',
    hi: 'अध्ययन सामग्री अपलोड करें या पेस्ट करें',
    hinglish: 'Study material upload ya paste karein',
    marathi: 'अभ्यास साहित्य अपलोड किंवा पेस्ट करा',
    tamil: 'ஆய்வுப் பொருளைப் பதிவேற்றவும் அல்லது ஒட்டவும்',
    bengali: 'স্টাডি উপাদান আপলোড বা পেস্ট করুন'
  },
  summarizeNotes: {
    en: 'Analyze & Summarize with AI',
    hi: 'एआई के साथ विश्लेषण और संक्षेप करें',
    hinglish: 'AI se analyze aur summarize karein',
    marathi: 'एआय सह विश्लेषण आणि सारांश करा',
    tamil: 'AI உடன் பகுப்பாய்வு செய்து சுருக்கவும்',
    bengali: 'এআই দিয়ে বিশ্লেষণ ও সারসংক্ষেপ করুন'
  },
  summaryResult: {
    en: 'AI Summary & Insights',
    hi: 'एआई सारांश और अंतर्दृष्टि',
    hinglish: 'AI Summary & Insights',
    marathi: 'एआय सारांश आणि अंतर्दृष्टी',
    tamil: 'AI சுருக்கம் & நுண்ணறிவு',
    bengali: 'এআই সারসংক্ষেপ ও অন্তর্দৃষ্টি'
  },
  whiteboardTools: {
    en: 'Whiteboard Tools',
    hi: 'व्हाइटबोर्ड उपकरण',
    hinglish: 'Board Tools',
    marathi: 'व्हाइटबोर्ड साधने',
    tamil: 'வெள்ளை பலகை கருவிகள்',
    bengali: 'হোয়াইটবোর্ড সরঞ্জাম'
  },
  clearCanvas: {
    en: 'Clear Canvas',
    hi: 'कैनवास साफ करें',
    hinglish: 'Board clean karein',
    marathi: 'कॅनव्हास साफ करा',
    tamil: 'கேள்வித்தாள் அழிக்கவும்',
    bengali: 'ক্যানভাস মুছুন'
  },
  brushColor: {
    en: 'Color',
    hi: 'रंग',
    hinglish: 'Color',
    marathi: 'रंग',
    tamil: 'நிறம்',
    bengali: 'রং'
  },
  brushSize: {
    en: 'Size',
    hi: 'आकार',
    hinglish: 'Brush Size',
    marathi: 'आकार',
    tamil: 'அளவு',
    bengali: 'आकार'
  },
  noDocumentsYet: {
    en: 'No study notes available yet.',
    hi: 'अभी तक कोई अध्ययन नोट्स उपलब्ध नहीं हैं।',
    hinglish: 'Abhi koi study notes nahi hain.',
    marathi: 'अद्याप कोणतेही अभ्यास नोट्स उपलब्ध नाहीत.',
    tamil: 'இன்னும் ஆய்வு குறிப்புகள் எதுவும் கிடைக்கவில்லை.',
    bengali: 'এখনও কোনো স্টাডি নোট নেই।'
  },
  noExamsYet: {
    en: 'No mock exams taken yet.',
    hi: 'अभी तक कोई मॉक परीक्षा नहीं ली गई है।',
    hinglish: 'Abhi tak koi mock test nahi diya.',
    marathi: 'अद्याप कोणतीही मॉक परीक्षा घेतलेली नाही.',
    tamil: 'இன்னும் மாதிரி தேர்வுகள் எதுவும் எடுக்கப்படவில்லை.',
    bengali: 'এখনও কোনো মক পরীক্ষা নেওয়া হয়নি।'
  },
  welcomeBack: {
    en: 'Welcome back, Student!',
    hi: 'वापसी पर स्वागत है, छात्र!',
    hinglish: 'Welcome back, Student!',
    marathi: 'पुन्हा स्वागत आहे, विद्यार्थ्या!',
    tamil: 'மீண்டும் வருக, மாணவரே!',
    bengali: 'স্বাগতম, ছাত্র!'
  },
  dailyQuests: {
    en: 'Daily Quests',
    hi: 'दैनिक कार्य',
    hinglish: 'Daily Quests',
    marathi: 'दैनिक शोध',
    tamil: 'தினசரி தேடல்கள்',
    bengali: 'দৈনিক অনুসন্ধান'
  },
  quest1: {
    en: 'Complete 1 Mock Exam (+150 XP)',
    hi: '1 मॉक परीक्षा पूरी करें (+150 एक्सपी)',
    hinglish: '1 Mock test complete karein (+150 XP)',
    marathi: '१ मॉक परीक्षा पूर्ण करा (+१५० XP)',
    tamil: '1 மாதிரி தேர்வை முடிக்கவும் (+150 XP)',
    bengali: '১টি মक পরীক্ষা সম্পন্ন করুন (+১৫০ XP)'
  },
  quest2: {
    en: 'Summarize 1 Study Note (+100 XP)',
    hi: '1 अध्ययन नोट का संक्षेप करें (+100 एक्सपी)',
    hinglish: '1 Note summarize karein (+100 XP)',
    marathi: '१ अभ्यास नोट सारांशित करा (+१०० XP)',
    tamil: '1 ஆய்வு குறிப்பைச் சுருக்கவும் (+100 XP)',
    bengali: '১টি স্টাডি নোট সারসংক্ষেপ করুন (+১০০ XP)'
  },
  quest3: {
    en: 'Draw on Whiteboard (+50 XP)',
    hi: 'व्हाइटबोर्ड पर चित्र बनाएं (+50 एक्सपी)',
    hinglish: 'Board pe draw karein (+50 XP)',
    marathi: 'व्हाइटबोर्डवर चित्र काढा (+५० XP)',
    tamil: 'வெள்ளை பலகையில் வரையவும் (+50 XP)',
    bengali: 'হোয়াইটবোর্ডে আঁকুন (+৫০ XP)'
  },
  signIn: {
    en: 'Sign In',
    hi: 'साइन इन करें',
    hinglish: 'Sign In',
    marathi: 'साइन इन करा',
    tamil: 'உள்நுழைய',
    bengali: 'সাইন ইন করুন'
  },
  signUp: {
    en: 'Create Account',
    hi: 'नया खाता बनाएं',
    hinglish: 'Create Account',
    marathi: 'खाते तयार करा',
    tamil: 'கணக்கை உருவாக்கு',
    bengali: 'অ্যাকাউন্ট তৈরি করুন'
  },
  continueWithGoogle: {
    en: 'Continue with Google',
    hi: 'गूगल के साथ जारी रखें',
    hinglish: 'Google se continue karein',
    marathi: 'गूगल सह सुरू ठेवा',
    tamil: 'கூகிள் மூலம் தொடரவும்',
    bengali: 'গুগল দিয়ে এগিয়ে যান'
  },
  signOut: {
    en: 'Sign Out',
    hi: 'लॉग आउट करें',
    hinglish: 'Sign Out',
    marathi: 'लॉग आउट करा',
    tamil: 'வெளியேறு',
    bengali: 'লগ আউট করুন'
  },
  account: {
    en: 'Account',
    hi: 'खाता',
    hinglish: 'Profile',
    marathi: 'खाते',
    tamil: 'கணக்கு',
    bengali: 'অ্যাকাউন্ট'
  }
};

export function t(key: string, lang: Language): string {
  const transKey = TRANSLATIONS[key] || TRANSLATIONS['appName'];
  return transKey?.[lang] || transKey?.['en'] || String(key);
}
