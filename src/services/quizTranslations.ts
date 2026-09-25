export type QuizLanguage = 'en' | 'hi' | 'hinglish' | 'marathi' | 'tamil' | 'bengali';

export interface QuizLanguageOption {
  id: QuizLanguage;
  label: string;
  nativeLabel: string;
  flag: string;
  description: string;
}

export const QUIZ_LANGUAGES: QuizLanguageOption[] = [
  {
    id: 'en',
    label: 'English',
    nativeLabel: 'English',
    flag: '🇬🇧',
    description: '100% in English (Questions, choices, hints & scorecard)'
  },
  {
    id: 'hi',
    label: 'Hindi',
    nativeLabel: 'हिंदी',
    flag: '🇮🇳',
    description: 'शुद्ध हिंदी में (सभी प्रश्न, विकल्प, व्याख्या व स्कोरकार्ड)'
  },
  {
    id: 'hinglish',
    label: 'Hinglish',
    nativeLabel: 'हिंग्लिश',
    flag: '🗣️',
    description: 'Casual mix (Questions aur scorecard Hinglish me)'
  },
  {
    id: 'marathi',
    label: 'Marathi',
    nativeLabel: 'मराठी',
    flag: '🚩',
    description: 'मराठीत प्रश्न, पर्याय आणि तपशीलवार निकाल'
  },
  {
    id: 'tamil',
    label: 'Tamil',
    nativeLabel: 'தமிழ்',
    flag: '🪔',
    description: 'தமிழில் வினாக்கள், விளக்கங்கள் மற்றும் முடிவுகள்'
  },
  {
    id: 'bengali',
    label: 'Bengali',
    nativeLabel: 'বাংলা',
    flag: '🌿',
    description: 'বাংলায় প্রশ্ন, বিকল্প ও ফলাফল বিশ্লেষণ'
  }
];

export const SUBJECT_TRANSLATIONS: Record<string, Record<QuizLanguage, string>> = {
  Mathematics: {
    en: 'Mathematics',
    hi: 'गणित',
    hinglish: 'Mathematics',
    marathi: 'गणित',
    tamil: 'கணிதம்',
    bengali: 'গণিত'
  },
  Physics: {
    en: 'Physics',
    hi: 'भौतिकी',
    hinglish: 'Physics',
    marathi: 'भौतिकशास्त्र',
    tamil: 'இயற்பியல்',
    bengali: 'পদার্থবিজ্ঞান'
  },
  Chemistry: {
    en: 'Chemistry',
    hi: 'रसायन विज्ञान',
    hinglish: 'Chemistry',
    marathi: 'रसायनशास्त्र',
    tamil: 'வேதியியல்',
    bengali: 'রসায়ন'
  },
  Biology: {
    en: 'Biology',
    hi: 'जीव विज्ञान',
    hinglish: 'Biology',
    marathi: 'जीवशास्त्र',
    tamil: 'உயிரியல்',
    bengali: 'জীববিজ্ঞান'
  },
  English: {
    en: 'English',
    hi: 'अंग्रेजी',
    hinglish: 'English',
    marathi: 'इंग्रजी',
    tamil: 'ஆங்கிலம்',
    bengali: 'ইংরেজি'
  },
  Science: {
    en: 'General Science',
    hi: 'सामान्य विज्ञान',
    hinglish: 'General Science',
    marathi: 'सामान्य विज्ञान',
    tamil: 'பொது அறிவியல்',
    bengali: 'সাধারণ বিজ্ঞান'
  }
};

export const QUIZ_TRANSLATIONS: Record<string, Record<QuizLanguage, string>> = {
  // CONFIRMATION BANNER
  langConfirmTitle: {
    en: 'Exam Language & Format',
    hi: 'परीक्षा की भाषा व स्वरूप',
    hinglish: 'Exam Language & Format',
    marathi: 'परीक्षेची भाषा आणि स्वरूप',
    tamil: 'தேர்வு மொழி மற்றும் வடிவம்',
    bengali: 'পরীক্ষার ভাষা ও কাঠামো'
  },
  langConfirmSub: {
    en: 'All questions, options, step-by-step solutions, and your final scorecard will be presented in this language.',
    hi: 'सभी प्रश्न, विकल्प, चरणबद्ध समाधान और अंतिम स्कोरकार्ड इसी भाषा में प्रस्तुत किए जाएंगे।',
    hinglish: 'Sabhi questions, options, step-by-step solutions aur final scorecard isi language me aayenge.',
    marathi: 'सर्व प्रश्न, पर्याय, सविस्तर स्पष्टीकरण आणि अंतिम निकाल याच भाषेत सादर केले जातील.',
    tamil: 'அனைத்து கேள்விகள், விருப்பங்கள், விளக்கங்கள் மற்றும் இறுதி மதிப்பெண் அட்டை இந்த மொழியிலேயே இருக்கும்.',
    bengali: 'সমস্ত প্রশ্ন, বিকল্প, ধাপে ধাপে সমাধান এবং চূড়ান্ত ফলাফল এই ভাষাতেই প্রদর্শিত হবে।'
  },
  selectedLangBadge: {
    en: 'Active Exam Language',
    hi: 'सक्रिय परीक्षा भाषा',
    hinglish: 'Active Exam Language',
    marathi: 'सक्रिय परीक्षा भाषा',
    tamil: 'செயலில் உள்ள தேர்வு மொழி',
    bengali: 'সক্রিয় পরীক্ষার ভাষা'
  },

  // SETUP STEPS
  stepSubject: {
    en: '1. Choose Subject',
    hi: '1. विषय चुनें',
    hinglish: '1. Subject Chunein',
    marathi: '१. विषय निवडा',
    tamil: '1. பாடத்தைத் தேர்ந்தெடுக்கவும்',
    bengali: '১. বিষয় নির্বাচন করুন'
  },
  subjectsAvailable: {
    en: 'Subjects Available',
    hi: 'विषय उपलब्ध',
    hinglish: 'Subjects Available',
    marathi: 'उपलब्ध विषय',
    tamil: 'கிடைக்கும் பாடங்கள்',
    bengali: 'উপলব্ধ বিষয়'
  },
  stepTopic: {
    en: '2. Select or Enter Topic',
    hi: '2. टॉपिक चुनें या लिखें',
    hinglish: '2. Topic Chunein ya Enter Karein',
    marathi: '२. विषय किंवा घटक निवडा',
    tamil: '2. தலைப்பைத் தேர்ந்தெடுக்கவும்',
    bengali: '২. টপিক নির্বাচন করুন বা লিখুন'
  },
  topicSub: {
    en: 'Pick a suggested syllabus topic or type any chapter, equation, or formula below.',
    hi: 'सुझाए गए पाठ्यक्रम का विषय चुनें या नीचे कोई भी अध्याय, समीकरण अथवा सूत्र लिखें।',
    hinglish: 'Syllabus ka topic select karein ya koi specific chapter/concept type karein.',
    marathi: 'खाली सुचवलेला घटक निवडा किंवा कोणताही विशिष्ट धडा किंवा सूत्र टाइप करा.',
    tamil: 'பரிந்துரைக்கப்பட்ட தலைப்பைத் தேர்வுசெய்யவும் அல்லது உங்கள் விருப்பப்படி உள்ளிடவும்.',
    bengali: 'প্রস্তাবিত টপিক নির্বাচন করুন অথবা যেকোনো নির্দিষ্ট অধ্যায় বা সূত্র লিখুন।'
  },
  topicPlaceholder: {
    en: 'e.g. Organic Isomerism, Photosynthesis, Limits & Continuity, Thermodynamics...',
    hi: 'उदा. त्रिकोणमिति के सूत्र, प्रकाश संश्लेषण, ऊष्मागतिकी, कार्बनिक यौगिक...',
    hinglish: 'e.g. Trigonometry Formulas, Photosynthesis, Thermodynamics, Cell Structure...',
    marathi: 'उदा. त्रिकोणमिती, प्रकाशसंश्लेषण, गतिचे नियम, रासायनिक अभिक्रिया...',
    tamil: 'எ.கா. ஒளிச்சேர்க்கை, முக்கோணவியல், வெப்ப இயக்கவியல்...',
    bengali: 'যেমন- ত্রিকোণমিতি, সালোকসংশ্লেষ, তাপগতিবিদ্যা...'
  },
  stepQuestions: {
    en: '3. Number of Questions',
    hi: '3. प्रश्नों की संख्या',
    hinglish: '3. Number of Questions',
    marathi: '३. प्रश्नांची संख्या',
    tamil: '3. வினாக்களின் எண்ணிக்கை',
    bengali: '৩. প্রশ্নের সংখ্যা'
  },
  questionsSub: {
    en: 'Choose your desired test length. Correct answers will be distributed completely randomly across A, B, C, and D.',
    hi: 'अपनी पसंद के अनुसार प्रश्नों की संख्या चुनें। सही उत्तर A, B, C, D में पूरी तरह रैंडम तरीके से वितरित होंगे।',
    hinglish: 'Apni pasand ke mutabiq sawal chunein. Correct answers completely random A, B, C, D positions par aayenge.',
    marathi: 'आवश्यक प्रश्नांची संख्या निवडा. अचूक उत्तरे A, B, C, D पर्यायांमध्ये यादृच्छिकपणे विभागली जातील.',
    tamil: 'வினாக்களின் எண்ணிக்கையைத் தேர்ந்தெடுக்கவும். சரியான விடைகள் சமமாக விநியோகிக்கப்படும்.',
    bengali: 'প্রশ্নের সংখ্যা নির্বাচন করুন। সঠিক উত্তরগুলি সম্পূর্ণ দৈবচয়ন পদ্ধতিতে সাজানো হবে।'
  },
  stepDifficulty: {
    en: '4. Difficulty Level',
    hi: '4. कठिनाई स्तर',
    hinglish: '4. Difficulty Level',
    marathi: '४. काठिण्य पातळी',
    tamil: '4. கடினத்தன்மை நிலை',
    bengali: '৪. কাঠিন্য স্তর'
  },
  stepMode: {
    en: '5. Quiz Mode',
    hi: '5. परीक्षा मोड',
    hinglish: '5. Quiz Mode',
    marathi: '५. परीक्षेचा प्रकार',
    tamil: '5. தேர்வு முறை',
    bengali: '৫. পরীক্ষার মোড'
  },
  timedMode: {
    en: '30s Timed Round',
    hi: '30 सेकंड समय सीमा',
    hinglish: '30s Timed Round',
    marathi: '३० सेकंद वेळ मर्यादा',
    tamil: '30 வினாடி நேர வரம்பு',
    bengali: '৩০ সেকেন্ড সময়সীমা'
  },
  relaxedMode: {
    en: '🧘 Relaxed Study',
    hi: '🧘 शांत अध्ययन (नो टाइमर)',
    hinglish: '🧘 Relaxed Study (No Timer)',
    marathi: '🧘 शांत अभ्यास (वेळ मर्यादा नाही)',
    tamil: '🧘 நிதானமான ஆய்வு',
    bengali: '🧘 ধীরেসুস্থে অনুশীলন'
  },
  instantFeedbackLabel: {
    en: 'Instant Answer Analysis',
    hi: 'तुरंत उत्तर विश्लेषण',
    hinglish: 'Instant Answer Analysis',
    marathi: 'झटपट उत्तर विश्लेषण',
    tamil: 'உடனடி விடை பகுப்பாய்வு',
    bengali: 'তাত্ক্ষণিক উত্তর বিশ্লেষণ'
  },
  enabled: {
    en: '✓ Enabled',
    hi: '✓ सक्रिय',
    hinglish: '✓ Enabled',
    marathi: '✓ सुरू',
    tamil: '✓ இயக்கப்பட்டது',
    bengali: '✓ সক্রিয়'
  },
  off: {
    en: 'Off',
    hi: 'बंद',
    hinglish: 'Off',
    marathi: 'बंद',
    tamil: 'முடக்கப்பட்டது',
    bengali: 'বন্ধ'
  },
  pastResults: {
    en: 'Past Results',
    hi: 'पुराने परिणाम',
    hinglish: 'Past Results',
    marathi: 'मागील निकाल',
    tamil: 'முந்தைய முடிவுகள்',
    bengali: 'পূর্ববর্তী ফলাফল'
  },
  launchQuiz: {
    en: 'Launch Practice Quiz',
    hi: 'मॉक टेस्ट शुरू करें',
    hinglish: 'Practice Quiz Shuru Karein',
    marathi: 'सराव परीक्षा सुरू करा',
    tamil: 'பயிற்சித் தேர்வைத் தொடங்கவும்',
    bengali: 'মক টেস্ট শুরু করুন'
  },

  // LOADING VIEW
  loadingTitle: {
    en: 'Generating Customized Exam',
    hi: 'आपकी परीक्षा तैयार हो रही है',
    hinglish: 'Custom Exam Generate Ho Rahi Hai',
    marathi: 'आपली परीक्षा तयार केली जात आहे',
    tamil: 'தனிப்பயன் தேர்வு உருவாக்கப்படுகிறது',
    bengali: 'কাস্টমাইজড পরীক্ষা তৈরি হচ্ছে'
  },
  loadingSub: {
    en: 'AI Tutor is formulating multiple choice questions with randomized answer distribution and verified rationale...',
    hi: 'एआई ट्यूटर रैंडम उत्तर विकल्पों और प्रामाणिक व्याख्या के साथ बहुविकल्पीय प्रश्न तैयार कर रहा है...',
    hinglish: 'AI Tutor randomized answer positions aur authentic explanations ke sath questions bana raha hai...',
    marathi: 'एआय ट्यूटर अचूक स्पष्टीकरण आणि योग्य पर्यायांसह प्रश्न तयार करत आहे...',
    tamil: 'AI ஆசிரியர் கேள்விகளை உருவாக்கி வருகிறது...',
    bengali: 'এআই শিক্ষক যথাযথ ব্যাখ্যা সহ প্রশ্নপত্র তৈরি করছে...'
  },
  verifyingSyllabus: {
    en: 'Verifying syllabus accuracy & explanations',
    hi: 'पाठ्यक्रम प्रामाणिकता व समाधानों की जांच',
    hinglish: 'Syllabus accuracy aur explanations check ho rahe hain',
    marathi: 'अभ्यासक्रम अचूकतेची पडताळणी केली जात आहे',
    tamil: 'பாடத்திட்ட துல்லியம் சரிபார்க்கப்படுகிறது',
    bengali: 'পাঠ্যক্রমের নির্ভুলতা পরীক্ষা করা হচ্ছে'
  },

  // ACTIVE ARENA
  questionOf: {
    en: 'Question',
    hi: 'प्रश्न',
    hinglish: 'Question',
    marathi: 'प्रश्न',
    tamil: 'வினா',
    bengali: 'প্রশ্ন'
  },
  ofText: {
    en: 'of',
    hi: 'में से',
    hinglish: 'of',
    marathi: 'पैकी',
    tamil: 'இல்',
    bengali: 'এর মধ্যে'
  },
  completeText: {
    en: 'Complete',
    hi: 'पूर्ण',
    hinglish: 'Complete',
    marathi: 'पूर्ण',
    tamil: 'முடிந்தது',
    bengali: 'সম্পন্ন'
  },
  singleChoice: {
    en: 'Single Choice',
    hi: 'एकल विकल्प',
    hinglish: 'Single Choice',
    marathi: 'एक पर्याय निवडा',
    tamil: 'ஒற்றைத் தேர்வு',
    bengali: 'একক বিকল্প'
  },
  streakText: {
    en: 'Streak!',
    hi: 'स्ट्रीक!',
    hinglish: 'Streak!',
    marathi: 'स्ट्रीक!',
    tamil: 'தொடர்ச்சி!',
    bengali: 'ধারাবাহিকতা!'
  },
  conceptExplanation: {
    en: 'Conceptual Explanation',
    hi: 'अवधारणा और स्पष्टीकरण',
    hinglish: 'Conceptual Explanation',
    marathi: 'संकल्पना आणि स्पष्टीकरण',
    tamil: 'கோட்பாட்டு விளக்கம்',
    bengali: 'ধারণাগত ব্যাখ্যা'
  },
  nextQuestion: {
    en: 'Next Question',
    hi: 'अगला प्रश्न',
    hinglish: 'Next Question',
    marathi: 'पुढील प्रश्न',
    tamil: 'அடுத்த வினா',
    bengali: 'পরবর্তী প্রশ্ন'
  },
  viewFinalScore: {
    en: 'View Final Score 🏆',
    hi: 'अंतिम स्कोर देखें 🏆',
    hinglish: 'Final Score Dekhein 🏆',
    marathi: 'अंतिम निकाल पहा 🏆',
    tamil: 'இறுதி மதிப்பெண் பார்க்க 🏆',
    bengali: 'চূড়ান্ত স্কোর দেখুন 🏆'
  },
  exitPrompt: {
    en: 'Exit this quiz session? Progress will not be recorded.',
    hi: 'क्या आप इस परीक्षा सत्र से बाहर निकलना चाहते हैं? प्रगति सहेजी नहीं जाएगी।',
    hinglish: 'Kya aap quiz session exit karna chahte hain? Progress save nahi hogi.',
    marathi: 'परीक्षेतून बाहेर पडायचे आहे का? प्रगती नोंदवली जाणार नाही.',
    tamil: 'இந்த தேர்விலிருந்து வெளியேற விரும்புகிறீர்களா?',
    bengali: 'আপনি কি পরীক্ষা থেকে প্রস্থান করতে চান?'
  },

  // RESULTS & SCORECARD
  examCompleted: {
    en: 'Examination Completed!',
    hi: 'मॉक टेस्ट सफलतापूर्वक पूर्ण!',
    hinglish: 'Examination Completed! 🏆',
    marathi: 'परीक्षा यशस्वीरीत्या पूर्ण झाली!',
    tamil: 'தேர்வு வெற்றிகரமாக முடிந்தது!',
    bengali: 'মক টেস্ট সফলভাবে সম্পন্ন হয়েছে!'
  },
  accuracyLabel: {
    en: 'Accuracy',
    hi: 'सटीकता',
    hinglish: 'Accuracy',
    marathi: 'अचूकता',
    tamil: 'துல்லியம்',
    bengali: 'নির্ভুলতা'
  },
  correctText: {
    en: 'Correct',
    hi: 'सही उत्तर',
    hinglish: 'Sahi',
    marathi: 'बरोबर',
    tamil: 'சரி',
    bengali: 'সঠিক'
  },
  missedText: {
    en: 'Missed',
    hi: 'छूटे / गलत',
    hinglish: 'Missed',
    marathi: 'चुकलेले',
    tamil: 'தவறானது',
    bengali: 'ভুল / বাকি'
  },
  solvedCorrectly: {
    en: 'Solved Correctly',
    hi: 'प्रश्न सही',
    hinglish: 'Solved Correctly',
    marathi: 'अचूक उत्तरे',
    tamil: 'சரியாக விடையளிக்கப்பட்டது',
    bengali: 'সঠিক সমাধান'
  },
  xpAwarded: {
    en: 'XP Awarded',
    hi: 'अर्जित एक्सपी',
    hinglish: 'XP Awarded',
    marathi: 'प्राप्त XP',
    tamil: 'பெற்ற XP',
    bengali: 'অর্জিত XP'
  },
  timeAndPace: {
    en: 'Time & Pace',
    hi: 'समय व गति',
    hinglish: 'Time & Pace',
    marathi: 'वेळ आणि गती',
    tamil: 'நேரம் மற்றும் வேகம்',
    bengali: 'সময় ও গতি'
  },
  perQuestionAvg: {
    en: 'per question avg',
    hi: 'प्रति प्रश्न औसत',
    hinglish: 'per question avg',
    marathi: 'प्रति प्रश्न सरासरी',
    tamil: 'சராசரியாக ஒரு கேள்விக்கு',
    bengali: 'প্রশ্ন প্রতি গড় সময়'
  },
  maxStreakLabel: {
    en: 'Max Streak',
    hi: 'अधिकतम स्ट्रीक',
    hinglish: 'Max Streak',
    marathi: 'कमाल स्ट्रीक',
    tamil: 'அதிகபட்ச தொடர்ச்சி',
    bengali: 'সর্বোচ্চ ধারাবাহিকতা'
  },
  focusedFlow: {
    en: 'Focused Flow',
    hi: 'एकाग्रता राउंड',
    hinglish: 'Focused Flow',
    marathi: 'एकाग्रता सत्र',
    tamil: 'கவனம் செலுத்திய அமர்வு',
    bengali: 'মনোযোগ পর্ব'
  },
  streakMultiplier: {
    en: '+20 Streak Multiplier',
    hi: '+20 स्ट्रीक बोनस',
    hinglish: '+20 Streak Multiplier',
    marathi: '+२० स्ट्रीक गुणक',
    tamil: '+20 தொடர்ச்சி பெருக்கி',
    bengali: '+২০ ধারাবাহিকতা বোনাস'
  },
  accuracyBonus: {
    en: '+25 Accuracy Bonus',
    hi: '+25 सटीकता बोनस',
    hinglish: '+25 Accuracy Bonus',
    marathi: '+२५ अचूकता बोनस',
    tamil: '+25 துல்லிய போனஸ்',
    bengali: '+২৫ নির্ভুলতা বোনাস'
  },
  standardRound: {
    en: 'Standard Round',
    hi: 'मानक राउंड',
    hinglish: 'Standard Round',
    marathi: 'सामान्य फेरी',
    tamil: 'நிலையான சுற்று',
    bengali: 'সাধারণ পর্ব'
  },

  // QUESTION REVIEW
  reviewHeader: {
    en: 'Question-by-Question Review',
    hi: 'प्रश्नोत्तर विस्तृत समीक्षा',
    hinglish: 'Question-by-Question Review',
    marathi: 'प्रश्नानुसार सविस्तर आढावा',
    tamil: 'கேள்வி வாரியான முழுமையான ஆய்வு',
    bengali: 'প্রশ্নোত্তর বিস্তারিত পর্যালোচনা'
  },
  reviewSub: {
    en: 'Review step-by-step logic, correct answers, and concept rationale for every challenge.',
    hi: 'प्रत्येक प्रश्न के चरणबद्ध तर्क, सही उत्तर और अवधारणा के स्पष्टीकरण की समीक्षा करें।',
    hinglish: 'Har question ka step-by-step logic, correct answer aur concept rationale check karein.',
    marathi: 'प्रत्येक आव्हानाचे चरणबद्ध तर्क आणि अचूक उत्तरे तपासा.',
    tamil: 'ஒவ்வொரு வினாவின் தர்க்கம் மற்றும் சரியான தீர்வுகளை மறுஆய்வு செய்யவும்.',
    bengali: 'প্রতিটি প্রশ্নের ধাপে ধাপে যুক্তি ও সঠিক সমাধান পর্যালোচনা করুন।'
  },
  filterAll: {
    en: 'All',
    hi: 'सभी',
    hinglish: 'All',
    marathi: 'सर्व',
    tamil: 'அனைத்தும்',
    bengali: 'সব'
  },
  filterCorrect: {
    en: 'Correct',
    hi: 'सही',
    hinglish: 'Correct',
    marathi: 'बरोबर',
    tamil: 'சரி',
    bengali: 'সঠিক'
  },
  filterIncorrect: {
    en: 'Review',
    hi: 'समीक्षा',
    hinglish: 'Review',
    marathi: 'पुनरावलोकन',
    tamil: 'மறுஆய்வு',
    bengali: 'পর্যালোচনা'
  },
  noFilterMatch: {
    en: 'No questions match the selected filter.',
    hi: 'इस फ़िल्टर में कोई प्रश्न नहीं मिला।',
    hinglish: 'Is filter me koi question nahi mila.',
    marathi: 'या फिल्टरमध्ये कोणताही प्रश्न आढळला नाही.',
    tamil: 'கேள்விகள் எதுவும் பொருந்தவில்லை.',
    bengali: 'এই ফিল্টারে কোনো প্রশ্ন পাওয়া যায়নি।'
  },
  correctStatus: {
    en: 'Correct',
    hi: 'सही उत्तर',
    hinglish: 'Correct Solution',
    marathi: 'अचूक उत्तर',
    tamil: 'சரியான விடை',
    bengali: 'সঠিক উত্তর'
  },
  incorrectStatus: {
    en: 'Incorrect',
    hi: 'सुधार आवश्यक',
    hinglish: 'Incorrect / Needs Revision',
    marathi: 'चूक / सुधारणा आवश्यक',
    tamil: 'தவறானது',
    bengali: 'ভুল / সংশোধন প্রয়োজন'
  },
  yourAnswerLabel: {
    en: 'Your Answer:',
    hi: 'आपका उत्तर:',
    hinglish: 'Aapka Answer:',
    marathi: 'तुमचे उत्तर:',
    tamil: 'உங்கள் விடை:',
    bengali: 'আপনার উত্তর:'
  },
  correctSolutionLabel: {
    en: 'Correct Solution:',
    hi: 'सही समाधान:',
    hinglish: 'Correct Solution:',
    marathi: 'योग्य उत्तर:',
    tamil: 'சரியான தீர்வு:',
    bengali: 'সঠিক সমাধান:'
  },
  conceptRationaleLabel: {
    en: 'Concept Rationale:',
    hi: 'अवधारणा और कारण:',
    hinglish: 'Concept Rationale:',
    marathi: 'संकल्पना आणि स्पष्टीकरण:',
    tamil: 'கோட்பாட்டு விளக்கம்:',
    bengali: 'ধারণা ও কার্যকারণ:'
  },
  timedOutLabel: {
    en: 'Timed Out / Unanswered',
    hi: 'समय समाप्त / अनुत्तरित',
    hinglish: 'Timed Out / Unanswered',
    marathi: 'वेळ संपली / अनुत्तरित',
    tamil: 'நேரம் முடிந்தது / விடையளிக்கவில்லை',
    bengali: 'সময় উত্তীর্ণ / উত্তর দেওয়া হয়নি'
  },
  hideBtn: {
    en: 'Hide',
    hi: 'छिपाएं',
    hinglish: 'Hide',
    marathi: 'लपवा',
    tamil: 'மறைக்க',
    bengali: 'লুকান'
  },
  explainBtn: {
    en: 'Explain',
    hi: 'विस्तार',
    hinglish: 'Explain',
    marathi: 'स्पष्टीकरण',
    tamil: 'விளக்கம்',
    bengali: 'ব্যাখ্যা'
  },

  // FOOTER ACTIONS
  returnSetup: {
    en: 'Return to Setup',
    hi: 'मुख्य सेटअप पर लौटें',
    hinglish: 'Return to Setup',
    marathi: 'मुख्य पानावर परत या',
    tamil: 'அமைப்பிற்குத் திரும்பு',
    bengali: 'সেটআপে ফিরে যান'
  },
  retakeTopic: {
    en: 'Retake This Topic',
    hi: 'इस विषय का पुनः टेस्ट लें',
    hinglish: 'Retake This Topic',
    marathi: 'हा घटक पुन्हा सोडवा',
    tamil: 'மீண்டும் இந்த தலைப்பில் தேர்வு எழுதவும்',
    bengali: 'এই টপিকে পুনরায় পরীক্ষা দিন'
  },
  copyReport: {
    en: 'Copy Score Report',
    hi: 'रिपोर्ट कॉपी करें',
    hinglish: 'Copy Score Report',
    marathi: 'गुणपत्रिका कॉपी करा',
    tamil: 'மதிப்பெண் அறிக்கையை நகலெடு',
    bengali: 'স্কোর রিপোর্ট কপি করুন'
  },
  reportCopied: {
    en: 'Report Copied!',
    hi: 'कॉपी हो गया',
    hinglish: 'Report Copied!',
    marathi: 'कॉपी झाले!',
    tamil: 'நகலெடுக்கப்பட்டது!',
    bengali: 'কপি করা হয়েছে!'
  },
  reportToast: {
    en: 'Exam report copied to clipboard! 📋',
    hi: 'परीक्षा परिणाम क्लिपबोर्ड पर कॉपी किया गया! 📋',
    hinglish: 'Exam report clipboard par copy ho gaya! 📋',
    marathi: 'परीक्षेचा निकाल क्लिपबोर्डवर कॉपी झाला! 📋',
    tamil: 'தேர்வு அறிக்கை நகலெடுக்கப்பட்டது! 📋',
    bengali: 'পরীক্ষার রিপোর্ট কপি করা হয়েছে! 📋'
  }
};

export function getQuizText(key: string, lang: QuizLanguage = 'en'): string {
  const item = QUIZ_TRANSLATIONS[key];
  if (!item) return key;
  return item[lang] || item['en'] || key;
}

export function getSubjectDisplayName(subjectId: string, lang: QuizLanguage = 'en'): string {
  const item = SUBJECT_TRANSLATIONS[subjectId];
  if (!item) return subjectId;
  return item[lang] || item['en'] || subjectId;
}

export interface BadgeTierInfo {
  rank: string;
  desc: string;
  icon: string;
  glow: string;
  pill: string;
}

export function getQuizBadgeTier(scorePercentage: number, lang: QuizLanguage = 'en'): BadgeTierInfo {
  if (scorePercentage >= 90) {
    if (lang === 'hi') {
      return {
        rank: 'एस-रैंक • विशेषज्ञ प्रवीणता 👑',
        desc: 'शानदार सटीकता! आपने इस विषय की बुनियादी और जटिल दोनों अवधारणाओं में असाधारण महारत सिद्ध की है।',
        icon: '👑',
        glow: 'rgba(245, 158, 11, 0.25)',
        pill: 'bg-amber-500/20 text-amber-300 border-amber-400/40'
      };
    }
    if (lang === 'hinglish') {
      return {
        rank: 'S-TIER • MASTER SCHOLAR 👑',
        desc: 'Zabardast accuracy! Aapne basic aur advanced dono concepts ko deep mastery ke sath solve kiya hai.',
        icon: '👑',
        glow: 'rgba(245, 158, 11, 0.25)',
        pill: 'bg-amber-500/20 text-amber-300 border-amber-400/40'
      };
    }
    if (lang === 'marathi') {
      return {
        rank: 'एस-रँक • तज्ज्ञ नैपुण्य 👑',
        desc: 'उत्कृष्ट अचूकता! आपण मूलभूत आणि प्रगत दोन्ही संकल्पनांवर असामान्य प्रभुत्व सिद्ध केले आहे.',
        icon: '👑',
        glow: 'rgba(245, 158, 11, 0.25)',
        pill: 'bg-amber-500/20 text-amber-300 border-amber-400/40'
      };
    }
    if (lang === 'tamil') {
      return {
        rank: 'எஸ்-ரேங்க் • முதன்மை நிபுணர் 👑',
        desc: 'சிறந்த துல்லியம்! பாடத்தின் அனைத்து கடினமான பகுதிகளிலும் நீங்கள் சிறந்து விளங்குகிறீர்கள்.',
        icon: '👑',
        glow: 'rgba(245, 158, 11, 0.25)',
        pill: 'bg-amber-500/20 text-amber-300 border-amber-400/40'
      };
    }
    if (lang === 'bengali') {
      return {
        rank: 'এস-র‍্যাঙ্ক • বিশেষজ্ঞ দক্ষতা 👑',
        desc: 'চমৎকার নির্ভুলতা! আপনি এই বিষয়ের মৌলিক ও জটিল উভয় ধারণাতেই অসাধারণ পারদর্শিতা দেখিয়েছেন।',
        icon: '👑',
        glow: 'rgba(245, 158, 11, 0.25)',
        pill: 'bg-amber-500/20 text-amber-300 border-amber-400/40'
      };
    }
    return {
      rank: 'S-TIER • MASTER SCHOLAR 👑',
      desc: 'Outstanding precision! You demonstrate deep mastery of core principles and problem-solving intuition.',
      icon: '👑',
      glow: 'rgba(245, 158, 11, 0.25)',
      pill: 'bg-amber-500/20 text-amber-300 border-amber-400/40'
    };
  } else if (scorePercentage >= 75) {
    if (lang === 'hi') {
      return {
        rank: 'ए-रैंक • उत्कृष्ट प्रदर्शन 🚀',
        desc: 'बेहतरीन समझ! आपने अधिकांश प्रश्नों को मजबूत तर्क और आत्मविश्वास के साथ हल किया।',
        icon: '🚀',
        glow: 'rgba(99, 102, 241, 0.25)',
        pill: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40'
      };
    }
    if (lang === 'hinglish') {
      return {
        rank: 'A-TIER • HIGH PERFORMER 🚀',
        desc: 'Behtareen conceptual grasp! Aapne majority questions ko solid reasoning ke sath solve kiya.',
        icon: '🚀',
        glow: 'rgba(99, 102, 241, 0.25)',
        pill: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40'
      };
    }
    if (lang === 'marathi') {
      return {
        rank: 'ए-रँक • उत्कृष्ट कामगिरी 🚀',
        desc: 'उत्कृष्ट समज! आपण बहुतांश आव्हाने मजबूत तर्काने आणि आत्मविश्वासाने सोडवली आहेत.',
        icon: '🚀',
        glow: 'rgba(99, 102, 241, 0.25)',
        pill: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40'
      };
    }
    if (lang === 'tamil') {
      return {
        rank: 'ஏ-ரேங்க் • சிறந்த செயல்திறன் 🚀',
        desc: 'சிறந்த புரிதல்! பெரும்பாலான வினாக்களை நம்பிக்கையுடன் தீர்த்துள்ளீர்கள்.',
        icon: '🚀',
        glow: 'rgba(99, 102, 241, 0.25)',
        pill: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40'
      };
    }
    if (lang === 'bengali') {
      return {
        rank: 'এ-র‍্যাঙ্ক • চমৎকার ফলাফল 🚀',
        desc: 'দারুণ বোঝাপড়া! আপনি বেশিরভাগ প্রশ্নের উত্তর আত্মবিশ্বাসের সাথে দিয়েছেন।',
        icon: '🚀',
        glow: 'rgba(99, 102, 241, 0.25)',
        pill: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40'
      };
    }
    return {
      rank: 'A-TIER • HIGH PERFORMER 🚀',
      desc: 'Excellent conceptual grasp! You solved the majority of challenges with solid reasoning and confidence.',
      icon: '🚀',
      glow: 'rgba(99, 102, 241, 0.25)',
      pill: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40'
    };
  } else if (scorePercentage >= 50) {
    if (lang === 'hi') {
      return {
        rank: 'बी-रैंक • उत्तम समझ 🎯',
        desc: 'सराहनीय प्रयास! छूटे हुए प्रश्नों के विश्लेषण को देखकर अपनी पकड़ को और अधिक मजबूत करें।',
        icon: '🎯',
        glow: 'rgba(16, 185, 129, 0.25)',
        pill: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
      };
    }
    if (lang === 'hinglish') {
      return {
        rank: 'B-TIER • SOLID PROFICIENCY 🎯',
        desc: 'Good attempt! Niche diye gaye review notes padhein aur missed topics ko master karein.',
        icon: '🎯',
        glow: 'rgba(16, 185, 129, 0.25)',
        pill: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
      };
    }
    if (lang === 'marathi') {
      return {
        rank: 'बी-रँक • उत्तम प्रयत्न 🎯',
        desc: 'चांगला प्रयत्न! चुकलेल्या प्रश्नांचे स्पष्टीकरण पाहून संकल्पना अधिक पक्की करा.',
        icon: '🎯',
        glow: 'rgba(16, 185, 129, 0.25)',
        pill: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
      };
    }
    if (lang === 'tamil') {
      return {
        rank: 'பி-ரேங்க் • நல்ல முயற்சி 🎯',
        desc: 'பாராட்டுக்குரிய முயற்சி! தவறவிட்ட கேள்விகளை மீண்டும் ஒருமுறை சரிபார்க்கவும்.',
        icon: '🎯',
        glow: 'rgba(16, 185, 129, 0.25)',
        pill: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
      };
    }
    if (lang === 'bengali') {
      return {
        rank: 'বি-র‍্যাঙ্ক • ভালো প্রচেষ্টা 🎯',
        desc: 'প্রশংসনীয় চেষ্টা! ভুল হওয়া প্রশ্নগুলির বিশদ ব্যাখ্যা দেখে প্রস্তুতি আরও মজবুত করুন।',
        icon: '🎯',
        glow: 'rgba(16, 185, 129, 0.25)',
        pill: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
      };
    }
    return {
      rank: 'B-TIER • SOLID PROFICIENCY 🎯',
      desc: 'Strong effort with promising intuition! Review the step-by-step notes below to master missed topics.',
      icon: '🎯',
      glow: 'rgba(16, 185, 129, 0.25)',
      pill: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
    };
  } else {
    if (lang === 'hi') {
      return {
        rank: 'ग्रोथ टियर • निरंतर प्रयास 🌱',
        desc: 'हर गलती सीखने का सबसे बड़ा अवसर है। नीचे दिए गए नोट्स को पढ़ें और पुनः प्रयास करें!',
        icon: '🌱',
        glow: 'rgba(6, 182, 212, 0.25)',
        pill: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
      };
    }
    if (lang === 'hinglish') {
      return {
        rank: 'GROWTH TIER • STEADY PROGRESS 🌱',
        desc: 'Har mistake seekhne ka mauka hai. Step-by-step solutions padhein aur dobara test dein!',
        icon: '🌱',
        glow: 'rgba(6, 182, 212, 0.25)',
        pill: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
      };
    }
    if (lang === 'marathi') {
      return {
        rank: 'ग्रोथ टियर • सातत्यपूर्ण सराव 🌱',
        desc: 'प्रत्येक चूक शिकण्याची संधी असते. खालील स्पष्टीकरणे वाचा आणि पुन्हा प्रयत्न करा!',
        icon: '🌱',
        glow: 'rgba(6, 182, 212, 0.25)',
        pill: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
      };
    }
    if (lang === 'tamil') {
      return {
        rank: 'வளர்ச்சி நிலை • தொடர் பயிற்சி 🌱',
        desc: 'தவறுகள் கற்றலின் முதல்படி. விளக்கங்களைப் படித்து மீண்டும் முயற்சிக்கவும்!',
        icon: '🌱',
        glow: 'rgba(6, 182, 212, 0.25)',
        pill: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
      };
    }
    if (lang === 'bengali') {
      return {
        rank: 'গ্রোথ টিয়ার • নিরন্তর সাধনা 🌱',
        desc: 'প্রতিটি ভুল থেকেই নতুন শিক্ষা হয়। নিচের বিশ্লেষণগুলো মনোযোগ দিয়ে পড়ুন ও পুনরায় চেষ্টা করুন!',
        icon: '🌱',
        glow: 'rgba(6, 182, 212, 0.25)',
        pill: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
      };
    }
    return {
      rank: 'GROWTH TIER • STEADY PROGRESS 🌱',
      desc: 'Every challenge is an opportunity to learn. Study the concept notes below and retake for a higher score!',
      icon: '🌱',
      glow: 'rgba(6, 182, 212, 0.25)',
      pill: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
    };
  }
}
