import { useState } from 'react';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Mail, 
  Lock, 
  Database, 
  Camera, 
  Mic, 
  FileText, 
  Globe, 
  UserCheck, 
  CheckCircle2, 
  EyeOff
} from 'lucide-react';

interface PrivacyPolicyProps {
  onBack?: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const isHi = lang === 'hi';

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Header / Navigation Bar */}
      <header className="sticky top-0 z-30 bg-slate-950  border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Back to application"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isHi ? 'ऐप पर वापस जाएं' : 'Back to App'}</span>
          </button>
          <div className="h-4 w-px bg-slate-800 hidden sm:block" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs sm:text-sm font-bold tracking-tight text-white">Ascend Study</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                lang === 'en' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLang('hi')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                lang === 'hi' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              हिंदी
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Title Section */}
        <div className="mb-10 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>{isHi ? 'गोपनीयता और डेटा सुरक्षा' : 'Trust, Privacy & Data Protection'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {isHi ? 'गोपनीयता नीति (Privacy Policy)' : 'Privacy Policy'}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            {isHi 
              ? 'प्रभावी तिथि: 28 सितंबर, 2026 · Ascend Study (StudyHelper)'
              : 'Effective Date: September 28, 2026 · Application: Ascend Study (StudyHelper)'}
          </p>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed">
            {isHi
              ? 'Ascend Study (जिसे "StudyHelper" भी कहा जाता है) में हम छात्रों और शिक्षकों की व्यक्तिगत डेटा गोपनीयता का पूरा सम्मान करते हैं। यह नीति पारदर्शी रूप से बताती है कि जब आप हमारी शैक्षिक वेब सेवा या एंड्रॉइड ऐप का उपयोग करते हैं, तो कौन सी जानकारी एकत्र की जाती है, उसका उपयोग कैसे किया जाता है, और आपकी सुरक्षा कैसे सुनिश्चित की जाती है।'
              : 'At Ascend Study (also referred to as "StudyHelper"), we are deeply committed to protecting the privacy, security, and digital safety of our student and educator community. This Privacy Policy openly explains what data is collected, how it is processed to deliver educational features, how it is safeguarded, and how you retain full control over your personal information.'}
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-slate-300">
          
          {/* Section 1: Data We Collect */}
          <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 sm:p-7 space-y-4">
            <div className="flex items-center gap-2.5 text-white font-bold text-base sm:text-lg">
              <Database className="w-5 h-5 text-indigo-400 shrink-0" />
              <h2>{isHi ? '1. हम कौन सा डेटा एकत्र करते हैं' : '1. Information We Collect'}</h2>
            </div>
            <p>
              {isHi
                ? 'हम केवल वही जानकारी एकत्र करते हैं जो आपको उन्नत एआई ट्यूटरिंग, क्विज, और अध्ययन उपकरण प्रदान करने के लिए आवश्यक है:'
                : 'We collect only the information strictly necessary to provide an advanced, adaptive educational assistant and study toolkit:'}
            </p>
            <ul className="space-y-3 pl-1 sm:pl-2">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-semibold">
                    {isHi ? 'पहचान और प्रोफ़ाइल जानकारी: ' : 'Identity & Profile Information: '}
                  </strong>
                  {isHi
                    ? 'आपका नाम, ईमेल पता, और यदि आप "Continue with Google" चुनते हैं, तो आपके बुनियादी Google प्रोफ़ाइल क्रेडेंशियल्स (जैसे सार्वजनिक प्रोफ़ाइल चित्र और ईमेल)। यदि आप चाहें तो कक्षा/ग्रेड, स्कूल का नाम, और शैक्षणिक लक्ष्य (जैसे बोर्ड परीक्षा या प्रतियोगी परीक्षा) भी जोड़ सकते हैं।'
                    : 'Your name, email address, and basic Google account profile information (such as display name, avatar, and email) if you sign in with Google. You may also optionally provide your grade/class level, school name, and academic target goals.'}
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-semibold">
                    {isHi ? 'अध्ययन और शैक्षणिक प्रगति डेटा: ' : 'Study & Progress Data: '}
                  </strong>
                  {isHi
                    ? 'आपके द्वारा बनाए गए नोट्स, अध्ययन दस्तावेज़, अध्ययन सत्र अवधि, पोमोडोरो टाइमर रिकॉर्ड, अभ्यास क्विज व मॉक टेस्ट स्कोर, दैनिक अध्ययन स्ट्रीक (streak), अनुभव अंक (XP), और आभासी साथी (Pet Level)।'
                    : 'Study notes and documents you create, study session durations, Pomodoro focus logs, quiz and mock exam results, daily study streaks, earned Experience Points (XP), and study companion pet levels.'}
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-semibold">
                    {isHi ? 'अपलोड की गई शिक्षण सामग्री: ' : 'Uploaded Study Materials: '}
                  </strong>
                  {isHi
                    ? 'पीडीएफ बुक्स, होमवर्क की तस्वीरें, और पाठ्यपुस्तक के पन्ने जिन्हें आप अध्याय सारांश या समाधान के लिए "PDF / Book Scanner" में अपलोड करते हैं।'
                    : 'PDF documents, textbook photos, and homework problem images you voluntarily upload to the Chapter Scanner or AI Tutor for step-by-step solutions and summaries.'}
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-semibold">
                    {isHi ? 'लोकल ब्राउज़र स्टोरेज (localStorage): ' : 'Local Device Storage (localStorage): '}
                  </strong>
                  {isHi
                    ? 'आपकी भाषा पसंद (अंग्रेजी या हिंदी), डार्क/लाइट थीम सेटिंग, यूआई अनुकूलन, और ऑफलाइन उपलब्धता के लिए एक स्थानीय सुरक्षित कैश।'
                    : 'Your theme preference (Dark/Light mode), language selection (English/Hindi), interface layout customizations, and local offline cache to maintain rapid loading speeds without continuous network queries.'}
                </div>
              </li>
            </ul>
          </section>

          {/* Section 2: Device Permissions */}
          <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 sm:p-7 space-y-4">
            <div className="flex items-center gap-2.5 text-white font-bold text-base sm:text-lg">
              <Camera className="w-5 h-5 text-indigo-400 shrink-0" />
              <h2>{isHi ? '2. डिवाइस अनुमतियाँ (Camera & Microphone)' : '2. Device Hardware Permissions'}</h2>
            </div>
            <p>
              {isHi
                ? 'Ascend Study केवल तब ही हार्डवेयर अनुमतियों का अनुरोध करता है जब आप संबंधित सुविधा को सक्रिय रूप से शुरू करते हैं। हम कभी भी बैकग्राउंड में कैमरा या माइक्रोफोन का उपयोग नहीं करते:'
                : 'Ascend Study requests hardware device permissions only in direct response to your explicit user action. We never activate cameras or microphones in the background:'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold text-xs sm:text-sm">
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span>{isHi ? 'कैमरा (Camera)' : 'Camera Access'}</span>
                </div>
                <p className="text-xs text-slate-400">
                  {isHi
                    ? 'केवल तब सक्रिय होता है जब आप पाठ्यपुस्तक के पृष्ठ, आरेख या हस्तलिखित समीकरण को स्कैन करने के लिए "Take Photo" पर टैप करते हैं।'
                    : 'Used exclusively when you tap the camera capture button in the PDF Scanner or AI Tutor to photograph a textbook diagram, equation, or homework problem for instant analysis.'}
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold text-xs sm:text-sm">
                  <Mic className="w-4 h-4 text-emerald-400" />
                  <span>{isHi ? 'माइक्रोफ़ोन (Microphone)' : 'Microphone Access'}</span>
                </div>
                <p className="text-xs text-slate-400">
                  {isHi
                    ? 'केवल तब सक्रिय होता है जब आप वॉइस ट्यूटर या माइक बटन दबाकर बोलकर सवाल पूछते हैं (Web Speech / getUserMedia के माध्यम से)।'
                    : 'Used exclusively when you activate the Voice Tutor or press the microphone icon to ask a study question aloud via browser speech recognition.'}
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Third-Party Services & AI Providers */}
          <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 sm:p-7 space-y-4">
            <div className="flex items-center gap-2.5 text-white font-bold text-base sm:text-lg">
              <Globe className="w-5 h-5 text-indigo-400 shrink-0" />
              <h2>{isHi ? '3. तीसरे पक्ष की सेवाएँ और एआई प्रदाता' : '3. Third-Party Services & AI Providers'}</h2>
            </div>
            <p>
              {isHi
                ? 'ऐप की विश्वसनीयता और गति सुनिश्चित करने के लिए हम प्रमुख उद्योग-मानक क्लाउड सेवाओं का उपयोग करते हैं:'
                : 'To deliver educational responses and cloud sync, we integrate with industry-leading cloud and artificial intelligence infrastructure:'}
            </p>
            <ul className="space-y-3 pl-1 sm:pl-2">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-semibold">Google Firebase: </strong>
                  {isHi
                    ? 'उपयोगकर्ता प्रमाणीकरण (Firebase Auth), एन्क्रिप्टेड डेटाबेस (Firestore), रीयल-टाइम अध्ययन समूह (Realtime Database), और दस्तावेज़ स्टोरेज (Cloud Storage) के लिए उपयोग किया जाता है।'
                    : 'Used for identity authentication (Firebase Auth), encrypted study record storage (Cloud Firestore), peer collaboration rooms (Realtime Database), and uploaded study document storage (Firebase Storage).'}
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-semibold">
                    {isHi ? 'एआई प्रदाता (AI Inference Providers): ' : 'AI Intelligence Providers: '}
                  </strong>
                  {isHi
                    ? 'आपके प्रश्नों का समाधान खोजने के लिए आपके प्रश्न हमारे सर्वर-साइड प्रॉक्सी रूट (/api/gemini/answer) के माध्यम से Google Gemini API (@google/genai), Groq Llama, Groq Qwen, और OpenRouter को भेजे जाते हैं। आपकी API कुंजियाँ कभी भी ब्राउज़र में उजागर नहीं होती हैं और हमारे सर्वर पर सुरक्षित रहती हैं।'
                    : "When you ask a study question, the text prompt and images are forwarded via our secure server-side proxy endpoint (/api/gemini/answer) to advanced generative AI providers including Google Gemini (@google/genai), Groq (Llama & Qwen), and OpenRouter. All API keys and secrets are strictly retained on our backend server and are never exposed to browser bundles or client devices."}
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-semibold">Google Workspace (Optional): </strong>
                  {isHi
                    ? 'यदि आप "Google Workspace" एकीकरण जोड़ते हैं, तो Google Identity Services (GIS) का उपयोग केवल आपकी स्पष्ट अनुमति से Google Drive, Docs, Sheets, Classroom, और Calendar से अध्ययन सामग्री पढ़ने के लिए किया जाता है।'
                    : 'If you choose to link Google Workspace in the Integrations Hub, client-side Google Identity Services (GIS) tokens are used solely with your explicit consent to read classroom courses or export study guides directly to your own Google Docs or Drive. Tokens reside only in transient browser session storage.'}
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-semibold">
                    {isHi ? 'मीडिया और ऑडियो CDN: ' : 'Media & Ambient Assets: '}
                  </strong>
                  {isHi
                    ? 'पोमोडोरो एकाग्रता के लिए अध्ययन ध्वनियाँ (जैसे बारिश, कैफ़े, लो-फ़ाई संगीत) सुरक्षित सार्वजनिक CDN (जैसे Mixkit) से स्ट्रीम होती हैं। अवतार के लिए DiceBear का उपयोग किया जाता है।'
                    : 'Relaxing study background sounds (Rain, Cafe, Lofi, Forest) stream from verified media CDNs (Mixkit). Student avatars can be selected from DiceBear public SVG services.'}
                </div>
              </li>
            </ul>
          </section>

          {/* Section 4: Data Use & Non-Sale Commitment */}
          <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 sm:p-7 space-y-4">
            <div className="flex items-center gap-2.5 text-white font-bold text-base sm:text-lg">
              <EyeOff className="w-5 h-5 text-indigo-400 shrink-0" />
              <h2>{isHi ? '4. डेटा का उपयोग और गैर-बिक्री प्रतिबद्धता' : '4. How We Use Data & Non-Sale Commitment'}</h2>
            </div>
            <p>
              {isHi
                ? 'हम आपके डेटा का उपयोग केवल ऐप की कार्यक्षमता संचालित करने, आपकी अध्ययन स्ट्रीक को सिंक करने, आपकी गलतियों के आधार पर अध्ययन सामग्री अनुकूलित करने, और उच्च-गुणवत्ता वाले उत्तर तैयार करने के लिए करते हैं।'
                : 'We process your data exclusively to run Ascend Study features, sync progress across devices, tailor step-by-step explanations to your learning goals, and track your revision milestones.'}
            </p>
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 text-emerald-200">
              <p className="font-semibold text-emerald-100 flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{isHi ? 'हम आपका व्यक्तिगत डेटा कभी नहीं बेचते' : 'We Never Sell or Rent Your Data'}</span>
              </p>
              <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed">
                {isHi
                  ? 'हम आपके किसी भी व्यक्तिगत विवरण, ईमेल, अध्ययन नोट्स, या चैट इतिहास को डेटा ब्रोकरों, विज्ञापन कंपनियों, या तीसरे पक्ष के विपणक को कभी भी नहीं बेचते, किराए पर नहीं देते और न ही मुद्रीकृत करते हैं।'
                  : 'We do not sell, rent, trade, or monetize your personal information, study documents, quiz answers, or chat history to third-party data brokers or advertising networks under any circumstance.'}
              </p>
            </div>
          </section>

          {/* Section 5: Data Retention & Account Deletion */}
          <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 sm:p-7 space-y-4">
            <div className="flex items-center gap-2.5 text-white font-bold text-base sm:text-lg">
              <Lock className="w-5 h-5 text-indigo-400 shrink-0" />
              <h2>{isHi ? '5. डेटा प्रतिधारण और खाता हटाना' : '5. Data Retention & Account Deletion'}</h2>
            </div>
            <p>
              {isHi
                ? 'आपके पास अपने व्यक्तिगत डेटा पर पूरा नियंत्रण है:'
                : 'You have full ownership and sovereignty over your data:'}
            </p>
            <ul className="space-y-2.5 pl-1 sm:pl-2">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  {isHi
                    ? 'आप ऐप के भीतर किसी भी समय अपने नोट्स और मॉक टेस्ट सीधे डिलीट कर सकते हैं।'
                    : 'You can delete individual study notes, documents, and mock exam records directly inside the application.'}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  {isHi
                    ? 'यदि आप अपने पूरे खाते और उससे जुड़े सभी डेटा को स्थायी रूप से हटाना चाहते हैं, तो कृपया नीचे दिए गए ईमेल पर अनुरोध भेजें। आपके अनुरोध की पुष्टि के बाद 7 कार्य दिवसों के भीतर आपका प्रोफ़ाइल, नोट्स और रिकॉर्ड डेटाबेस से पूरी तरह मिटा दिए जाएंगे।'
                    : 'To request permanent deletion of your account and all associated cloud database records, email our developer address below. Upon verification, your profile, notes, and records will be irrevocably purged within 7 business days.'}
                </span>
              </li>
            </ul>
          </section>

          {/* Section 6: Children and Student Safety */}
          <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 sm:p-7 space-y-4">
            <div className="flex items-center gap-2.5 text-white font-bold text-base sm:text-lg">
              <UserCheck className="w-5 h-5 text-indigo-400 shrink-0" />
              <h2>{isHi ? '6. छात्र और बाल सुरक्षा नीति' : '6. Children & Student Safety Policy'}</h2>
            </div>
            <p>
              {isHi
                ? 'Ascend Study विशेष रूप से स्कूली और कॉलेज के छात्रों के शैक्षणिक लाभ के लिए बनाया गया है। यदि छात्र अपने देश के कानून के अनुसार डिजिटल सहमति की न्यूनतम आयु (जैसे अमेरिका में 13 वर्ष से कम COPPA, या अन्य देशों में निर्धारित आयु) से कम है, तो इस ऐप का उपयोग केवल माता-पिता, अभिभावक, या अधिकृत शिक्षक की अनुमति और देखरेख में ही किया जाना चाहिए।'
                : 'Ascend Study is designed to empower students of various learning stages. If a user is under the age required by applicable law in their jurisdiction to consent to online services (such as under 13 under COPPA in the United States, or under 16 in certain European regions), use of this service must occur with the consent and guidance of a parent, legal guardian, or authorized school authority.'}
            </p>
          </section>

          {/* Section 7: Security & Encryption */}
          <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 sm:p-7 space-y-4">
            <div className="flex items-center gap-2.5 text-white font-bold text-base sm:text-lg">
              <Lock className="w-5 h-5 text-indigo-400 shrink-0" />
              <h2>{isHi ? '7. सुरक्षा और एन्क्रिप्शन' : '7. Security Architecture'}</h2>
            </div>
            <p>
              {isHi
                ? 'हम आपके डेटा को सुरक्षित रखने के लिए कड़े उपाय लागू करते हैं:'
                : 'We implement rigorous technological controls to prevent unauthorized access or disclosure:'}
            </p>
            <ul className="space-y-2 pl-1 sm:pl-2 text-xs sm:text-sm">
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">·</span>
                <span>
                  {isHi 
                    ? 'सभी नेटवर्क संचार उद्योग-मानक HTTPS/TLS 1.3 एन्क्रिप्शन के साथ स्थानांतरित होते हैं।'
                    : 'All communication between your device and our servers is strictly encrypted in transit via HTTPS/TLS 1.3.'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">·</span>
                <span>
                  {isHi 
                    ? 'सर्वर-साइड इनपुट सैनिटाइजेशन और रेट-लिमिटिंग बॉट्स और दुरुपयोग को रोकते हैं।'
                    : 'Backend rate-limiting and payload sanitization protect against automated abuse and injection.'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">·</span>
                <span>
                  {isHi 
                    ? 'क्लाउड फायरस्टोर सुरक्षा नियम यह सुनिश्चित करते हैं कि छात्र केवल अपने स्वयं के व्यक्तिगत दस्तावेज़ पढ़ और संशोधित कर सकें।'
                    : 'Cloud database security rules enforce strict ownership validation so only you can access or modify your personal notes.'}
                </span>
              </li>
            </ul>
          </section>

          {/* Section 8: Policy Changes */}
          <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 sm:p-7 space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-base sm:text-lg">
              <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
              <h2>{isHi ? '8. नीति में संशोधन' : '8. Changes to This Policy'}</h2>
            </div>
            <p className="text-xs sm:text-sm">
              {isHi
                ? 'हम समय-समय पर नई सुविधाओं या विनियामक आवश्यकताओं के अनुसार इस नीति को अपडेट कर सकते हैं। महत्वपूर्ण परिवर्तनों की स्थिति में प्रभावी तिथि को इस पृष्ठ के शीर्ष पर अपडेट किया जाएगा।'
                : 'We may revise this Privacy Policy periodically to reflect enhancements in our study tools or evolving legal standards. Any updates will be published on this page with a revised effective date.'}
            </p>
          </section>

          {/* Section 9: Developer Contact Information */}
          <section className="bg-gradient-to-br from-indigo-950/40 via-slate-900/50 to-slate-900/40 border border-indigo-500/30 rounded-2xl p-5 sm:p-7 space-y-4">
            <div className="flex items-center gap-2.5 text-white font-bold text-base sm:text-lg">
              <Mail className="w-5 h-5 text-indigo-400 shrink-0" />
              <h2>{isHi ? '9. संपर्क विवरण (Developer Contact)' : '9. Contact the Developer'}</h2>
            </div>
            <p>
              {isHi
                ? 'यदि आपके पास इस गोपनीयता नीति, डेटा सुरक्षा, या अपने खाते को हटाने से संबंधित कोई प्रश्न या सुझाव हैं, तो कृपया सीधे डेवलपर से संपर्क करें:'
                : 'If you have questions, feedback, or data deletion inquiries regarding this Privacy Policy or your personal study records, please reach out directly:'}
            </p>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 text-xs sm:text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-slate-400 text-xs block">{isHi ? 'डेवलपर / डेटा नियंत्रक' : 'Developer & Creator'}</span>
                  <span className="text-white font-bold text-sm">Rohit Yadav</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">{isHi ? 'आधिकारिक ईमेल' : 'Official Contact Email'}</span>
                  <a 
                    href="mailto:yadavrohityadav331@gmail.com" 
                    className="text-indigo-400 hover:text-indigo-300 font-bold underline underline-offset-2 transition"
                  >
                    yadavrohityadav331@gmail.com
                  </a>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-400">
                <span>Application: Ascend Study (StudyHelper)</span>
                <span>Website: <a href="https://studyhalper.vercel.app" className="text-indigo-400 hover:underline">studyhalpar.vercel.app</a></span>
              </div>
            </div>
          </section>

        </div>

        {/* Bottom Back Button */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex justify-center">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition active:scale-98 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isHi ? 'वापस मुख्य ऐप पर जाएं' : 'Return to Ascend Study'}</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-400 px-4">
        <p>© {new Date().getFullYear()} Ascend Study · Created by Rohit Yadav (yadavrohityadav331@gmail.com). All rights reserved.</p>
      </footer>
    </div>
  );
}
