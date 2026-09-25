/**
 * Ascend Academic Curriculum & Pedagogical Knowledge Engine
 * Provides instant, high-yield academic explanations, formulas, derivations,
 * and exam practice questions when offline or during API transition.
 */

export interface CurriculumStudyAnswerParams {
  prompt: string;
  language?: string;
  persona?: string;
  studentContext?: {
    name?: string;
    school?: string;
    className?: string;
    country?: string;
  };
  isApiKeyIssue?: boolean;
}

interface TopicKnowledge {
  title: string;
  subject: string;
  summaryEn: string;
  summaryHi: string;
  stepsEn: string[];
  stepsHi: string[];
  formulas?: string[];
  analogyEn: string;
  analogyHi: string;
  tipsEn: string[];
  tipsHi: string[];
  quizQuestionEn: string;
  quizQuestionHi: string;
}

const TOPIC_DATABASE: Record<string, TopicKnowledge> = {
  photosynthesis: {
    title: "Photosynthesis (प्रकाश संश्लेषण)",
    subject: "Biology / Science",
    summaryEn: "Photosynthesis is the fundamental biochemical process by which green plants, algae, and certain bacteria convert radiant solar energy into chemical energy stored in glucose molecules.",
    summaryHi: "प्रकाश संश्लेषण वह जैव-रासायनिक प्रक्रिया है जिसके द्वारा हरे पौधे सूर्य के प्रकाश और क्लोरोफिल की उपस्थिति में जल (H2O) और कार्बन डाइऑक्साइड (CO2) से ग्लूकोज (ऊर्जा) और ऑक्सीजन का निर्माण करते हैं।",
    stepsEn: [
      "Light Absorption: Chlorophyll pigments inside thylakoid membranes trap photon energy from sunlight.",
      "Light Reaction (Photolysis): Water molecules (H2O) are split into hydrogen ions, electrons, and free Oxygen (O2) gas.",
      "Energy Carrier Synthesis: ATP and NADPH are synthesized to power cellular processes.",
      "Dark Reaction (Calvin Cycle): In the stroma of chloroplasts, CO2 is fixed and reduced to produce high-energy glucose (C6H12O6)."
    ],
    stepsHi: [
      "प्रकाश अवशोषण: क्लोरोप्लास्ट की थायलाकोइड झिल्ली में मौजूद क्लोरोफिल सूर्य के प्रकाश की ऊर्जा को अवशोषित करता है।",
      "प्रकाशिक अभिक्रिया (जल का अपघटन): प्रकाश ऊर्जा द्वारा जल (H2O) के अणु टूटकर हाइड्रोजन और ऑक्सीजन गैस (O2) मुक्त करते हैं।",
      "ऊर्जा निर्माण: ATP और NADPH के रूप में ऊर्जा संचित होती है।",
      "अप्रकाशिक अभिक्रिया (केल्विन चक्र): स्ट्रोमा में CO2 का अपचयन होकर ग्लूकोज (C6H12O6) का संश्लेषण होता है।"
    ],
    formulas: [
      "Balanced Chemical Equation: 6CO₂ + 6H₂O + Sunlight → C₆H₁₂O₆ + 6O₂",
      "ADP + Pi + Light Energy → ATP (Photophosphorylation)"
    ],
    analogyEn: "Think of a plant leaf as a solar-powered organic bakery: Sunlight is the solar electricity, CO2 from the air and water from soil are raw ingredients, chlorophyll is the master chef, and glucose loaves with fresh oxygen are the final baked output!",
    analogyHi: "पौधे की पत्ती को एक सोलर बेकरी की तरह समझें: धूप बेकरी की बिजली है, हवा की CO2 और मिट्टी का पानी सामग्री है, क्लोरोफिल शेफ है, और ताजा ग्लूकोज और शुद्ध ऑक्सीजन अंतिम उत्पाद हैं!",
    tipsEn: [
      "Board Exam Favorite: Always mention both Light reaction (Thylakoids) and Dark reaction (Stroma).",
      "Balance the chemical equation correctly with 6CO2 and 6H2O."
    ],
    tipsHi: [
      "परीक्षा टिप: प्रकाशिक अभिक्रिया (थायलाकोइड) और डार्क रिएक्शन (स्ट्रोमा) दोनों का उल्लेख अवश्य करें।",
      "समीकरण को संतुलित लिखना कभी न भूलें (6CO2 + 6H2O -> C6H12O6 + 6O2)।"
    ],
    quizQuestionEn: "Where do the light-dependent reactions of photosynthesis take place inside the chloroplast?",
    quizQuestionHi: "प्रकाश संश्लेषण की प्रकाशिक अभिक्रिया क्लोरोप्लास्ट के किस भाग में संपन्न होती है?"
  },
  newton: {
    title: "Newton's Laws of Motion (न्यूटन के गति के नियम)",
    subject: "Physics",
    summaryEn: "Newton's three laws of motion establish the bedrock of classical mechanics, describing how external forces influence the movement, inertia, and momentum of physical bodies.",
    summaryHi: "न्यूटन के गति के तीन नियम शास्त्रीय भौतिकी (Classical Mechanics) का आधार हैं, जो बताते हैं कि बल (Force), द्रव्यमान (Mass), और त्वरण (Acceleration) एक-दूसरे से किस प्रकार संबंधित हैं।",
    stepsEn: [
      "First Law (Law of Inertia): An object remains at rest or in uniform motion unless acted upon by a non-zero external net force.",
      "Second Law (Fundamental Law): The rate of change of momentum of a body is directly proportional to the applied force: F = dp/dt = m · a.",
      "Third Law (Action & Reaction): To every action, there is always an equal and opposite reaction acting on two distinct interacting bodies."
    ],
    stepsHi: [
      "प्रथम नियम (जड़त्व का नियम): कोई वस्तु विराम अथवा समान गति में तब तक रहती है जब तक उस पर कोई बाहरी असंतुलित बल न लगाया जाए।",
      "द्वितीय नियम (संवेग का नियम): किसी वस्तु के संवेग परिवर्तन की दर लगाए गए बल के समानुपाती होती है: F = m × a।",
      "तृतीय नियम (क्रिया-प्रतिक्रिया नियम): प्रत्येक क्रिया के बराबर और विपरीत दिशा में प्रतिक्रिया होती है।"
    ],
    formulas: [
      "Second Law: F = m × a  (Force = Mass × Acceleration)",
      "Momentum: p = m × v  (Momentum = Mass × Velocity)",
      "Impulse: J = F · Δt = Δp (Change in Momentum)"
    ],
    analogyEn: "When a bus suddenly brakes, your body lurches forward because your upper body wants to maintain its forward velocity (Inertia). When you push against a swimming pool wall, the wall pushes you forward into the water with equal force (Action-Reaction)!",
    analogyHi: "जब बस अचानक रुकती है, तो आपका शरीर आगे की ओर झुक जाता है (जड़त्व)। जब आप तैराकी में दीवार को पीछे धकेलते हैं, तो दीवार आपको आगे की तरफ समान बल से धक्का देती है (क्रिया-प्रतिक्रिया)!",
    tipsEn: [
      "Always remember that Action and Reaction forces act on TWO DIFFERENT bodies, so they NEVER cancel each other out.",
      "Force SI unit is Newton (N = kg·m/s²)."
    ],
    tipsHi: [
      "याद रखें: क्रिया और प्रतिक्रिया बल दो अलग-अलग वस्तुओं पर कार्य करते हैं, इसलिए वे एक-दूसरे को निरस्त नहीं करते।",
      "बल का SI मात्रक न्यूटन (N = kg·m/s²) होता है।"
    ],
    quizQuestionEn: "If a 5 kg object accelerates at 4 m/s², what is the magnitude of the net applied force?",
    quizQuestionHi: "यदि 5 किग्रा की वस्तु पर 4 m/s² का त्वरण उत्पन्न होता है, तो लगाए गए कुल बल का मान क्या होगा?"
  },
  calculus: {
    title: "Calculus & Derivatives (कलन और अवकलन)",
    subject: "Mathematics",
    summaryEn: "Calculus is the mathematical study of continuous change. Differential calculus focuses on rates of change and slopes of curves, while integral calculus focuses on accumulation and areas.",
    summaryHi: "कलन (Calculus) निरंतर परिवर्तन का अध्ययन है। अवकलन (Differentiation) परिवर्तन की तात्कालिक दर (Instantaneous Rate) और वक्र के ढाल (Slope) को ज्ञात करता है।",
    stepsEn: [
      "First Principles Definition: f'(x) = lim(h→0) [f(x + h) - f(x)] / h.",
      "Power Rule: d/dx [xⁿ] = n · xⁿ⁻¹.",
      "Product Rule: d/dx [u · v] = u'v + uv'.",
      "Chain Rule: d/dx [f(g(x))] = f'(g(x)) · g'(x)."
    ],
    stepsHi: [
      "प्रथम सिद्धांत परिभाषा: f'(x) = lim(h→0) [f(x + h) - f(x)] / h।",
      "घात नियम (Power Rule): d/dx [xⁿ] = n · xⁿ⁻¹।",
      "गुणन नियम (Product Rule): d/dx [u · v] = u'v + uv'।",
      "श्रृंखला नियम (Chain Rule): d/dx [f(g(x))] = f'(g(x)) · g'(x)।"
    ],
    formulas: [
      "d/dx (sin x) = cos x",
      "d/dx (cos x) = -sin x",
      "d/dx (eˣ) = eˣ",
      "d/dx (ln x) = 1/x"
    ],
    analogyEn: "If a car speedometer shows 60 km/h right this second, that instantaneous speed is a derivative (dx/dt) of the position function. The total distance traveled across an entire journey is the integral (area under the curve)!",
    analogyHi: "कार का स्पीडोमीटर इस पल जो गति दिखा रहा है, वह स्थिति का अवकलन (dx/dt) है। और पूरी यात्रा में तय की गई कुल दूरी गति वक्र का समाकलन (Integral) है!",
    tipsEn: [
      "Never forget the chain rule when differentiating composite functions like sin(x²).",
      "Check points where f'(x) = 0 to find local maxima and minima."
    ],
    tipsHi: [
      "मिश्रित फलनों जैसे sin(x²) का अवकलन करते समय चेन रूल लगाना कभी न भूलें।",
      "उच्चिष्ठ (Maxima) और निम्निष्ठ (Minima) ज्ञात करने के लिए f'(x) = 0 हल करें।"
    ],
    quizQuestionEn: "What is the derivative of f(x) = 3x⁴ - 5x² + 7 with respect to x?",
    quizQuestionHi: "f(x) = 3x⁴ - 5x² + 7 का x के सापेक्ष अवकलन क्या होगा?"
  },
  gravity: {
    title: "Universal Gravitation (सार्वत्रिक गुरुत्वाकर्षण)",
    subject: "Physics",
    summaryEn: "Gravity is the universal attractive force that acts between all bodies possessing mass or energy, described classically by Newton's Universal Law of Gravitation.",
    summaryHi: "गुरुत्वाकर्षण ब्रह्मांड में किन्हीं भी दो द्रव्यमान वाली वस्तुओं के बीच लगने वाला एक सार्वत्रिक आकर्षण बल है।",
    stepsEn: [
      "Mutual Attraction: Every mass attracts every other mass directly proportional to the product of their masses.",
      "Inverse Square Law: Force decreases with the square of the separation distance: F ∝ 1/r².",
      "Acceleration due to gravity at surface: g = GM / R² (approx 9.8 m/s² on Earth)."
    ],
    stepsHi: [
      "परस्पर आकर्षण: किन्हीं दो पिंडों के बीच आकर्षण बल उनके द्रव्यमानों के गुणनफल के समानुपाती होता है।",
      "व्युत्क्रम वर्ग नियम: यह बल उनकी बीच की दूरी के वर्ग के व्युत्क्रमानुपाती होता है: F ∝ 1/r²।",
      "गुरुत्वीय त्वरण: पृथ्वी की सतह पर g = GM / R² (लगभग 9.8 m/s²)।"
    ],
    formulas: [
      "F = G · (m₁ · m₂) / r²",
      "Universal Constant G = 6.674 × 10⁻¹¹ N·m²/kg²",
      "Weight: W = m · g"
    ],
    analogyEn: "Imagine space as a stretched rubber sheet: a heavy bowling ball (the Sun or Earth) creates a dip, causing smaller marbles (moons or satellites) to orbit around it along curved paths!",
    analogyHi: "अंतरिक्ष को एक खिंची हुई रबर की चादर की तरह समझें: भारी गेंद (सूर्य या पृथ्वी) गड्ढा बनाती है, जिससे छोटी गेंदें (उपग्रह) उसके चारों ओर गोल चक्कर काटती हैं!",
    tipsEn: [
      "G is universal constant everywhere, while g varies with altitude, depth, and celestial body.",
      "If distance doubles, gravitational attraction drops to 1/4th of original value."
    ],
    tipsHi: [
      "सार्वत्रिक नियतांक G हर जगह समान रहता है, जबकि g ऊंचाई और गहराई के साथ बदलता है।",
      "यदि दूरी दोगुनी कर दी जाए, तो गुरुत्वाकर्षण बल घटकर एक चौथाई (1/4) रह जाता है।"
    ],
    quizQuestionEn: "How does the gravitational attraction between two objects change if the distance between their centers is tripled?",
    quizQuestionHi: "यदि दो वस्तुओं के बीच की दूरी तीन गुनी कर दी जाए, तो उनके बीच गुरुत्वाकर्षण बल कितना गुना हो जाएगा?"
  }
};

/**
 * Generates an intelligent, pedagogical curriculum response.
 */
export function generateCurriculumStudyAnswer(params: CurriculumStudyAnswerParams): string {
  const { prompt, language = "en", persona = "default", studentContext, isApiKeyIssue = false } = params;
  void persona; // preserved for persona context customizations
  const lowerPrompt = (prompt || "").toLowerCase();
  const isHi = language === "hi" || language === "Hindi";
  const isHinglish = language === "Hinglish" || language === "Mixed";

  // Identify matching topic
  let matchedTopic: TopicKnowledge | null = null;
  if (lowerPrompt.includes("photo") || lowerPrompt.includes("प्रकाश संश्लेषण") || lowerPrompt.includes("chlorophyll") || lowerPrompt.includes("plant food")) {
    matchedTopic = TOPIC_DATABASE.photosynthesis;
  } else if (lowerPrompt.includes("newton") || lowerPrompt.includes("न्यूटन") || lowerPrompt.includes("motion") || lowerPrompt.includes("inertia") || lowerPrompt.includes("force")) {
    matchedTopic = TOPIC_DATABASE.newton;
  } else if (lowerPrompt.includes("derivative") || lowerPrompt.includes("calculus") || lowerPrompt.includes("अवकलन") || lowerPrompt.includes("dx") || lowerPrompt.includes("integral") || lowerPrompt.includes("समाकलन")) {
    matchedTopic = TOPIC_DATABASE.calculus;
  } else if (lowerPrompt.includes("gravit") || lowerPrompt.includes("गुरुत्वाकर्षण") || lowerPrompt.includes("gravity") || lowerPrompt.includes("g = ")) {
    matchedTopic = TOPIC_DATABASE.gravity;
  }

  const studentSalutation = studentContext?.name 
    ? (isHi ? `नमस्ते **${studentContext.name}**! ` : isHinglish ? `Hello **${studentContext.name}**! ` : `Hello **${studentContext.name}**! `)
    : "";

  let output = "";

  if (matchedTopic) {
    const summary = isHi ? matchedTopic.summaryHi : matchedTopic.summaryEn;
    const steps = isHi ? matchedTopic.stepsHi : matchedTopic.stepsEn;
    const analogy = isHi ? matchedTopic.analogyHi : matchedTopic.analogyEn;
    const tips = isHi ? matchedTopic.tipsHi : matchedTopic.tipsEn;
    const quiz = isHi ? matchedTopic.quizQuestionHi : matchedTopic.quizQuestionEn;

    output = `### 💡 ${isHi ? "अवधारणा सारांश (Executive Summary)" : "Executive Summary"}: ${matchedTopic.title}
${studentSalutation}${summary}

---

### 📐 ${isHi ? "चरणबद्ध विधि एवं मुख्य नियम (Step-by-Step Logic & Derivation)" : "Step-by-Step Logic & Core Principles"}
${steps.map((step, idx) => `${idx + 1}. **${isHi ? `चरण ${idx + 1}` : `Step ${idx + 1}`}**: ${step}`).join("\n")}

${matchedTopic.formulas && matchedTopic.formulas.length > 0 ? `
#### 📝 ${isHi ? "महत्वपूर्ण सूत्र (Key Formulas)" : "Core Mathematical Formulas"}
${matchedTopic.formulas.map(f => `- \`${f}\``).join("\n")}
` : ""}

---

### 🌍 ${isHi ? "वास्तविक जीवन का उदाहरण (Everyday Analogy)" : "Real-World Analogy & Everyday Intuition"}
> ${analogy}

---

### 📌 ${isHi ? "परीक्षा के लिए उच्च-प्राथमिकता बिंदु (High-Yield Exam Tips)" : "High-Yield Exam Tips"}
${tips.map(t => `- 🎯 ${t}`).join("\n")}

---

### 🧠 ${isHi ? "अभ्यास प्रश्न (Quick Self-Check)" : "Quick Self-Check Question"}
**${quiz}**
*(Think about the core formulas above and solve this in your notebook!)*`;
  } else {
    // Dynamic general educational breakdown
    const topicHeading = prompt.length > 60 ? `${prompt.slice(0, 57)}...` : prompt;

    if (isHi) {
      output = `### 💡 अवधारणा सारांश (Executive Summary): ${topicHeading}
${studentSalutation}इस विषय को सरलता से समझने के लिए मुख्य बिंदुओं का क्रमबद्ध विश्लेषण नीचे दिया गया है:

---

### 📐 चरणबद्ध वैज्ञानिक एवं तार्किक दृष्टिकोण (Step-by-Step Logic)
1. **मूल सिद्धांत (Fundamental Principle)**: किसी भी विषय या समस्या को हल करने से पहले उसके मूलभूत नियमों, ज्ञात मानों (Given values) और अज्ञात लक्ष्यों को स्पष्ट रूप से सूचीबद्ध करें।
2. **पद्धति एवं अनुप्रयोग (Methodology)**:
   - मानक परिभाषाओं और सूत्रों का सटीक चयन करें।
   - जटिल समस्या को 2-3 छोटे आसान चरणों में विभाजित करें।
   - इकाई (Units) और आयामों (Dimensions) की शुद्धता की पुष्टि करें।
3. **सत्यापन (Verification)**: अंतिम उत्तर की तार्किक व्यावहारिकता और सीमाओं की जांच करें।

---

### 🌍 व्यावहारिक अनुप्रयोग (Everyday Intuition)
> सिद्धांत तभी याद रहता है जब हम उसे दैनिक जीवन से जोड़ते हैं। उदाहरण के लिए, किसी भी प्रणाली में संतुलन (Equilibrium) बनाए रखने के लिए इनपुट और आउटपुट का संरक्षण आवश्यक होता है।

---

### 📌 परीक्षा सफलता सूत्र (Exam Revision Tips)
- 🎯 परीक्षा में पूरे अंक प्राप्त करने के लिए मुख्य शब्दों (Keywords) को अंडरलाइन करें।
- 🎯 सूत्रों को लिखने के बाद हमेशा अंतिम उत्तर को बॉक्स (Box) में बंद करें।

---

### 🧠 त्वरित अभ्यास (Quick Self-Check)
**प्रश्न**: इस अवधारणा के आधार पर एक व्यावहारिक उदाहरण अपनी नोटबुक में लिखें और मुख्य सूत्र का अभ्यास करें!`;
    } else {
      output = `### 💡 Executive Concept Overview: ${topicHeading}
${studentSalutation}Here is a structured, high-yield academic breakdown of this topic:

---

### 📐 Step-by-Step Logic & Analytical Framework
1. **Core Foundation & Underlying Law**: Identify the primary governing law, theorem, or definitions associated with this topic.
2. **Systematic Problem Solving**:
   - Explicitly define given constraints, variables, and units.
   - Select the optimal formula or analytical model.
   - Compute intermediate steps systematically to prevent calculation drift.
3. **Boundary Condition & Unit Verification**: Ensure proper dimensional consistency and cross-verify with limiting cases.

---

### 🌍 Real-World Analogy & Practical Intuition
> Abstract concepts are best retained when mapped to practical systems: think of dynamic equilibrium like a balanced water tank where the inflow rate equals the outflow rate!

---

### 📌 High-Yield Exam Preparation Tips
- 🎯 Highlight key terms and always show step-by-step working to secure partial credit.
- 🎯 Box your final numerical or conceptual result with appropriate units.

---

### 🧠 Quick Self-Check Question
**Question**: What is the primary relationship between the independent and dependent variables in this concept? Try to formulate this in your study notes!`;
    }
  }

  if (isApiKeyIssue) {
    output += `\n\n> 💡 *Note: Rendered via the offline academic curriculum knowledge engine. You can configure your Gemini API key in AI Studio Settings to enable live generative queries.*`;
  }

  return output;
}

/**
 * Generates topic-aligned multiple choice questions for mock exams with dynamic options shuffling.
 */
export function generateSubjectMockQuestions(subject: string, topic: string, language: string = "en", requestedCount: number = 5): any[] {
  const isHi = language === "hi";
  const cleanSubject = subject || "Science";
  const cleanTopic = topic || "Core Principles";

  const rawQuestions = isHi ? [
    {
      questionText: `${cleanSubject} में "${cleanTopic}" का मुख्य मूलभूत नियम कौन सा है?`,
      correct: "संरक्षण और संतुलन का नियम",
      distractors: [
        "यादृच्छिक परिवर्तन का नियम",
        "अनिश्चितता और विसंगति का नियम",
        "शून्य द्रव्यमान व असीमित ऊर्जा का नियम"
      ],
      explanation: `"${cleanTopic}" के सभी मानक समीकरण संरक्षण और भौतिक-गणितीय संतुलन के नियमों पर आधारित होते हैं।`
    },
    {
      questionText: `दिए गए विकल्पों में से "${cleanTopic}" के सटीक अध्ययन के लिए सबसे आवश्यक चर (Variable) क्या है?`,
      correct: "समय, दर और भौतिक कारकों में परिवर्तन",
      distractors: [
        "केवल वस्तु का बाह्य रंग और रूप",
        "अपरिवर्तनीय व स्थिर वातावरण",
        "मनमाना काल्पनिक अनुमान"
      ],
      explanation: "प्रक्रिया की दर, समय और प्राथमिक घटकों का मात्रात्मक मापन इस विषय का आधार है।"
    },
    {
      questionText: `"${cleanTopic}" से संबंधित संख्यात्मक गणनाओं में किस पद्धति से त्रुटि की संभावना न्यूनतम होती है?`,
      correct: "चरणबद्ध विधि, सूत्र स्पष्टता और इकाई (Unit) सत्यापन",
      distractors: [
        "अंतिम परिणाम का तुक्का लगाना",
        "इकाइयों को अनदेखा करना",
        "सूत्रों और नियमों को छोड़ देना"
      ],
      explanation: "चरणबद्ध गणना, मानक सूत्रों का उपयोग और इकाइयों का सत्यापन सही उत्तर सुनिश्चित करता है।"
    },
    {
      questionText: `व्यावहारिक रूप से "${cleanTopic}" का अनुप्रयोग वास्तविक दुनिया में कहाँ सर्वाधिक देखा जाता है?`,
      correct: "आधुनिक इंजीनियरिंग, वैज्ञानिक सिमुलेशन एवं तकनीकी प्रणालियों में",
      distractors: [
        "केवल काल्पनिक किताबों में",
        "किसी भी प्रायोगिक कार्य में नहीं",
        "अज्ञात व अव्यावहारिक क्षेत्रों में"
      ],
      explanation: "यह सिद्धांत आधुनिक औद्योगिक तकनीकों और वास्तविक वैज्ञानिक अनुसंधान में व्यापक रूप से प्रयुक्त होता है।"
    },
    {
      questionText: `"${cleanTopic}" के गहन अध्ययन से विद्यार्थी में किस मुख्य क्षमता का विकास होता है?`,
      correct: "तार्किक, विश्लेषणात्मक एवं समस्या-समाधान चिंतन",
      distractors: [
        "बिना समझे केवल रटना",
        "त्रुटिपूर्ण निष्कर्ष निकालना",
        "समय व एकाग्रता का ह्रास"
      ],
      explanation: "वैज्ञानिक और गणितीय दृष्टिकोण से समस्याओं का सटीक विश्लेषण करने की क्षमता विकसित होती है।"
    },
    {
      questionText: `"${cleanTopic}" की किसी समस्या को हल करते समय पहला अनिवार्य चरण क्या होना चाहिए?`,
      correct: "दिए गए डेटा (Given Data) को चिन्हित कर उपयुक्त सूत्र चुनना",
      distractors: [
        "सीधे अंतिम उत्तर लिखना",
        "प्रश्न की शर्तों को अनदेखा करना",
        "कैलकुलेशन बीच में छोड़ देना"
      ],
      explanation: "समस्या का विश्लेषण करने के लिए सर्वप्रथम दिए गए आंकड़ों को सूचीबद्ध करना सर्वोत्तम वैज्ञानिक तरीका है।"
    },
    {
      questionText: `यदि "${cleanTopic}" में मुख्य पैरामीटर्स को दोगुना कर दिया जाए, तो सामान्यतः प्रणाली पर क्या प्रभाव पड़ेगा?`,
      correct: "शासी समीकरण के अनुपातिक या व्युत्क्रमानुपाती नियमानुसार परिवर्तन होगा",
      distractors: [
        "कोई भी प्रभाव नहीं पड़ेगा",
        "प्रणाली तुरंत नष्ट हो जाएगी",
        "अपरिमित रूप से अनियमित व्यवहार होगा"
      ],
      explanation: "प्रत्येक वैज्ञानिक सिद्धांत में राशियों के बीच एक पूर्व-निर्धारित गणितीय संबंध होता है।"
    },
    {
      questionText: `परीक्षा में "${cleanTopic}" से संबंधित प्रश्नों में पूरे अंक प्राप्त करने के लिए क्या आवश्यक है?`,
      correct: "सूत्र, चरणबद्ध हल, इकाइयाँ और अंतिम उत्तर को बॉक्स में स्पष्ट लिखना",
      distractors: [
        "केवल बिना गणना के उत्तर लिखना",
        "अस्पष्ट लिखावट और सूत्र छोड़ना",
        "गलत इकाई के साथ मान लिखना"
      ],
      explanation: "मूल्यांकनकर्ता चरणबद्ध तार्किक प्रवाह और स्पष्ट उत्तर प्रस्तुति पर पूर्ण अंक प्रदान करते हैं।"
    }
  ] : [
    {
      questionText: `What is the primary governing principle of "${cleanTopic}" in ${cleanSubject}?`,
      correct: "Conservation Laws and Dynamic Equilibrium",
      distractors: [
        "Random Fluctuations Principle",
        "Arbitrary Static Hypothesis",
        "Non-interacting Field Conjecture"
      ],
      explanation: `Foundational mechanisms of "${cleanTopic}" strictly adhere to conservation and mathematical equilibrium principles.`
    },
    {
      questionText: `When analyzing complex problem scenarios involving "${cleanTopic}", which step is considered essential?`,
      correct: "Verifying boundary conditions, formula applicability, and dimensional units",
      distractors: [
        "Relying purely on qualitative approximations without calculation",
        "Assuming zero initial states unconditionally",
        "Omitting intermediate analytical steps"
      ],
      explanation: "Dimensional consistency, explicit formula choice, and boundary checks ensure scientific validity."
    },
    {
      questionText: `How does a structured change in primary parameters typically influence "${cleanTopic}"?`,
      correct: "Follows a predictable, mathematically governed relationship",
      distractors: [
        "Causes purely chaotic, untestable variations",
        "Has absolutely no measurable physical or numerical effect",
        "Violates fundamental conservation principles"
      ],
      explanation: "Governing equations demonstrate direct or inverse relationships under specified physical constraints."
    },
    {
      questionText: `In standard competitive examinations, which practice guarantees top scoring on "${cleanTopic}"?`,
      correct: "Presenting sequential step derivations with explicit formulas and units",
      distractors: [
        "Writing only the final value without any supporting steps",
        "Skipping dimensional annotations and units",
        "Omitting necessary reference diagrams"
      ],
      explanation: "Examiners award marks for systematic methodology, formula clarity, and boxed final answers."
    },
    {
      questionText: `Which practical application best showcases the real-world utility of "${cleanTopic}"?`,
      correct: "System optimization, computational modeling, and industrial technology",
      distractors: [
        "Purely historical archival documentation",
        "Uncalibrated subjective observation",
        "Isolated abstract exercises with zero physical counterpart"
      ],
      explanation: "Modern engineering, computation, and scientific instruments rely heavily on these core principles."
    },
    {
      questionText: `What is the most effective approach for mastering difficult concepts in "${cleanTopic}"?`,
      correct: "Active problem-solving and connecting principles to real-world analogies",
      distractors: [
        "Passive rereading without solving practice questions",
        "Memorizing formulas without understanding derivations",
        "Avoiding analytical practice problems"
      ],
      explanation: "Active recall combined with rigorous question practice produces deep conceptual retention."
    },
    {
      questionText: `What role do fundamental assumptions play in the theoretical framework of "${cleanTopic}"?`,
      correct: "They establish valid boundary domains within which formulas hold true",
      distractors: [
        "They make the theory invalid for any real application",
        "They introduce uncontrolled mathematical errors",
        "They are completely arbitrary with no scientific basis"
      ],
      explanation: "Every scientific and mathematical model is formulated under well-defined boundary assumptions."
    },
    {
      questionText: `When cross-checking a solution in "${cleanTopic}", which method provides immediate verification?`,
      correct: "Dimensional analysis and testing limiting or extreme cases",
      distractors: [
        "Guessing whether the number looks reasonable",
        "Changing the formula midway",
        "Ignoring orders of magnitude"
      ],
      explanation: "Dimensional consistency checks and extreme condition testing immediately expose mathematical flaws."
    }
  ];

  // Dynamically shuffle options so the correct answer is RANDOMLY placed across A, B, C, or D (indices 0, 1, 2, 3)
  const countToReturn = Math.max(3, Math.min(requestedCount, 30));
  const selectedPool = [];

  // Pick questions from pool (cycling if count exceeds pool size)
  for (let i = 0; i < countToReturn; i++) {
    selectedPool.push(rawQuestions[i % rawQuestions.length]);
  }

  return selectedPool.map((item, idx) => {
    // 4 options: 1 correct + 3 distractors
    const allOptions = [item.correct, ...item.distractors];

    // Fisher-Yates shuffle with random placement
    for (let j = allOptions.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [allOptions[j], allOptions[k]] = [allOptions[k], allOptions[j]];
    }

    const correctIndex = allOptions.indexOf(item.correct);

    return {
      questionText: `${item.questionText}${idx >= rawQuestions.length ? ` (Variation ${Math.floor(idx / rawQuestions.length) + 1})` : ''}`,
      options: allOptions,
      correctOptionIndex: correctIndex >= 0 ? correctIndex : 0,
      explanation: item.explanation
    };
  });
}

/**
 * Intercepts creator/Rohit Yadav related questions to return highly accurate,
 * authoritative answers based on his official profile.
 */
export function checkCreatorQuestion(prompt: string, language: string = "English"): string | null {
  if (!prompt) return null;

  // 1. Clean the prompt by removing background workspace and student context strings prepended by the UI
  let cleaned = prompt;
  
  // Remove document context block
  cleaned = cleaned.replace(/\[Attached Document:[\s\S]*?\[Use the above attached document context to address the prompt below accurately\.\]/gi, "");
  
  // Remove bracketed info (e.g. [Student: Rohit Yadav ...], [Subject: Physics ...])
  cleaned = cleaned.replace(/\[[\s\S]*?\]/g, "");
  
  // Remove prefix styles
  cleaned = cleaned.replace(/Provide a strict step-by-step solution for[^:]*:/gi, "");
  cleaned = cleaned.replace(/Explain clearly with analogies suitable for[^:]*:/gi, "");
  cleaned = cleaned.replace(/Generate a 3-question practice quiz suitable for[^:]*:/gi, "");

  // Now normalize the actual question/query asked by the user
  const norm = cleaned.toLowerCase().trim();
  const isHi = language === "Hindi" || language === "hi" || norm.includes("hindi") || norm.includes("हिन्दी") || norm.includes("हिंदी");
  const isHinglish = language === "Hinglish" || language === "Mixed" || norm.includes("hinglish");

  // Strict guard: ONLY intercept if the query is explicitly about Rohit Yadav, the creator, developer, maker, or who built/made this AI/app
  // We do NOT want to intercept the user's name if they are named "Rohit Yadav" and are just saying general greetings or unrelated academic questions!
  const mentionsRohitDirectly = norm.includes("rohit") || norm.includes("yadav") || norm.includes("रोहित") || norm.includes("यादव");
  
  // Terms representing creator/owner/founder/CEO
  const hasCreatorTerm = (
    norm.includes("creator") || norm.includes("developer") || norm.includes("maker") || 
    norm.includes("owner") || norm.includes("founder") || norm.includes("ceo") || 
    norm.includes("malik") || norm.includes("मालिक") || norm.includes("बनाया") || 
    norm.includes("banya") || norm.includes("boss") || norm.includes("owner")
  );
  
  const refersToYou = (
    norm.includes("you") || norm.includes("your") || norm.includes("yourself") ||
    norm.includes(" u ") || norm.includes(" ur ") ||
    norm.includes("tutor") || norm.includes("buddy") || norm.includes("app") || norm.includes("ai") || norm.includes("bot") || 
    norm.includes("website") || norm.includes("tool") || norm.includes("software") || norm.includes("system") || norm.includes("application") ||
    norm.includes("tumhe") || norm.includes("aapko") || norm.includes("tujhe") || norm.includes("is app") || norm.includes("is ai") || norm.includes("is bot") ||
    norm.includes("apko") || norm.includes("tumhe")
  );

  const asksWhoMade = (
    norm.includes("who made") || norm.includes("who created") || norm.includes("who built") || norm.includes("who designed") || norm.includes("who developed") || norm.includes("who owns") ||
    norm.includes("kisne banaya") || norm.includes("kaun banaya") || norm.includes("kisne design") || norm.includes("kisne develop") || norm.includes("kisne code") ||
    norm.includes("kisne banaya hai") || norm.includes("kaun banaya hai") ||
    norm === "तुम्हें किसने बनाया?" || norm === "तुम्हें किसने बनाया" || norm === "creator कौन है" || norm === "creator कौन है?" ||
    norm.includes("kisne design") || norm.includes("who is founder") || norm.includes("who is ceo") || norm.includes("who is owner") ||
    norm.includes("malik kaun") || norm.includes("kisne banya") || norm.includes("owner kaun")
  );

  let isAboutCreator = false;

  // If the query specifically mentions Rohit/Yadav AND is asking "who is he", "tell me about him" or similar:
  if (mentionsRohitDirectly) {
    // Only intercept if we actually ask ABOUT Rohit, not if a student named Rohit is saying "hi" or general questions!
    // Since we stripped the student metadata, any mentions of Rohit left must be from the user's actual typed query.
    // If the query is just "rohit" or "rohit yadav" or questions about him, yes:
    const generalGreetings = ["hi", "hello", "hey", "hola", "namaste", "pranam", "sup", "yo", "हाय", "नमस्ते", "हेलो"];
    const isJustGreeting = generalGreetings.includes(norm);
    if (!isJustGreeting) {
      isAboutCreator = true;
    }
  } else if (hasCreatorTerm && refersToYou) {
    isAboutCreator = true;
  } else if (asksWhoMade && refersToYou) {
    isAboutCreator = true;
  } else if ((hasCreatorTerm || asksWhoMade) && norm.length < 35) {
    isAboutCreator = true;
  }

  // Strict exception: if there is an academic subject or other known entity mentioned (e.g. "gravity", "motion", "universe"),
  // DO NOT intercept unless they explicitly mention "rohit" or "yadav"
  if (isAboutCreator && !mentionsRohitDirectly) {
    const academicSubjects = [
      "motion", "gravity", "universe", "world", "earth", "country", "india", "car", "concept", "theory", "formula", "laws", "law",
      "cell", "biology", "physics", "chemistry", "periodic", "table", "element", "atom", "molecule", "science", "math", "calculus",
      "derivative", "integral", "equation", "history", "war", "book", "author", "play", "movie", "song", "language", "grammar",
      "sentence", "word", "code", "programming", "python", "javascript", "react", "html", "css", "computer", "internet", "google",
      "facebook", "microsoft", "apple", "tesla", "spacex", "amazon", "netflix", "twitter", "electricity", "magnet", "sound", "light",
      "energy", "work", "power", "speed", "velocity", "acceleration", "force", "mass", "weight", "friction", "heat", "temperature",
      "pressure", "density", "volume", "area", "length", "time", "distance", "displacement", "vector", "scalar", "newton", "galileo",
      "einstein", "darwin", "mendel", "pasteur", "curie", "tesla", "edison", "bell", "bohr", "rutheford", "dalton", "avogadro", "boyle",
      "charles", "gay-lussac", "dalton", "graham", "henry", "raoult", "faraday", "ampere", "volt", "ohm", "joule", "watt", "hertz"
    ];

    const hasAcademicSubject = academicSubjects.some(sub => norm.includes(sub));
    if (hasAcademicSubject) {
      isAboutCreator = false;
    }
  }

  if (!isAboutCreator) {
    return null;
  }

  // Key matching criteria for simple creator questions
  const matchCreatorSimple = (
    (norm.includes("who") && (norm.includes("created") || norm.includes("made") || norm.includes("built") || norm.includes("designed") || norm.includes("developed")) && norm.includes("you")) ||
    (norm.includes("kisne") && (norm.includes("banaya") || norm.includes("banya") || norm.includes("design") || norm.includes("develop")) && (norm.includes("tumhe") || norm.includes("tujhe") || norm.includes("aapko") || norm.includes("you") || norm.includes("ai"))) ||
    (norm.includes("kaun") && norm.includes("banaya") && (norm.includes("tumhe") || norm.includes("aapko") || norm.includes("app") || norm.includes("tutor"))) ||
    (norm.includes("who is") && norm.includes("creator") && (norm.includes("your") || norm.includes("app") || norm.includes("ai"))) ||
    (norm.includes("creator") && (norm.includes("who") || norm.includes("kisne")) && (norm.includes("you") || norm.includes("tutor") || norm.includes("study buddy"))) ||
    (norm.includes("app") && norm.includes("kisne") && norm.includes("banaya")) ||
    (norm.includes("malik") || norm.includes("owner") || norm.includes("founder") || norm.includes("ceo")) ||
    (norm === "creator कौन है" || norm === "creator कौन है?" || norm === "तुम्हें किसने बनाया?" || norm === "तुम्हें किसने बनाया")
  );

  // Specific Query Handling to avoid dumping the whole profile when user asks a targeted question
  const hasAge = norm.includes("age") || norm.includes("umar") || norm.includes("saal") || norm.includes("old") || norm.includes("उम्र");
  const hasWhere = norm.includes("where") || norm.includes("kahan") || norm.includes("location") || norm.includes("city") || norm.includes("address") || norm.includes("shehar") || norm.includes("gaon") || norm.includes("from") || norm.includes("रहते") || norm.includes("कहाँ") || norm.includes("रहता") || norm.includes("रहती");
  const hasSchool = norm.includes("school") || norm.includes("college") || norm.includes("padhta") || norm.includes("padhti") || norm.includes("study") || norm.includes("education") || norm.includes("class") || norm.includes("grade") || norm.includes("pcm") || norm.includes("स्कूल") || norm.includes("क्लास") || norm.includes("पढ़ते");
  const hasGithub = norm.includes("github") || norm.includes("portfolio") || norm.includes("link") || norm.includes("git");
  const hasProjects = norm.includes("project") || norm.includes("built") || norm.includes("banaya") || norm.includes("product") || norm.includes("apps") || norm.includes("बनाया") || norm.includes("प्रोजेक्ट");
  const hasInterests = norm.includes("interest") || norm.includes("hobby") || norm.includes("hobbies") || norm.includes("sports") || norm.includes("cricket") || norm.includes("astronomy") || norm.includes("pasand") || norm.includes("रुचि") || norm.includes("क्रिकेट") || norm.includes("पसंद");
  const hasSkills = norm.includes("skills") || norm.includes("tech") || norm.includes("python") || norm.includes("react") || norm.includes("languages") || norm.includes("कौशल") || norm.includes("तकनीकी");

  // If age is requested, explicitly say it's not in the profile
  if (hasAge) {
    if (isHi || isHinglish) {
      return "मेरे Creator Profile में **उम्र (Age)** की जानकारी का उल्लेख नहीं है।";
    }
    return "My Creator Profile does not mention his **age**.";
  }

  // Where is he from / city
  if (hasWhere) {
    if (isHi) {
      return "रोहित यादव **महेशपुर, छबड़ा तहसील, बारां जिला, राजस्थान, भारत** के रहने वाले हैं।";
    } else if (isHinglish) {
      return "Rohit Yadav **Maheshpur, Chhabra Tehsil, Baran District, Rajasthan, India** ke rehne wale hain.";
    } else {
      return "Rohit Yadav belongs to **Maheshpur, Chhabra Tehsil, Baran District, Rajasthan, India**.";
    }
  }

  // School / Education
  if (hasSchool) {
    if (isHi) {
      return "रोहित **स्वामी विवेकानंद गवर्नमेंट मॉडल स्कूल, कड़ैयाबन, छबड़ा, राजस्थान** में Class 12 Science (PCM) के छात्र हैं और **Arjuna JEE 3.0** बैच में नामांकित हैं।";
    } else if (isHinglish) {
      return "Rohit **Swami Vivekanand Government Model School, Kadaiyaban, Chhabra, Rajasthan** me Class 12 Science (PCM) ke student hain aur unhone **Arjuna JEE 3.0** join kiya hua hai.";
    } else {
      return "Rohit is a Class 12 Science (PCM) student at **Swami Vivekanand Government Model School, Kadaiyaban, Chhabra, Rajasthan**, and is enrolled in **Arjuna JEE 3.0**.";
    }
  }

  // Github / Portfolio
  if (hasGithub) {
    if (isHi || isHinglish) {
      return "रोहित यादव का GitHub पोर्टफोलियो लिंक यह है: [heenayadav325200-png](https://github.com/heenayadav325200-png)";
    }
    return "You can check out Rohit Yadav's GitHub portfolio here: [heenayadav325200-png](https://github.com/heenayadav325200-png)";
  }

  // Projects
  if (hasProjects) {
    if (isHi) {
      return "रोहित यादव ने कई बेहतरीन प्रोजेक्ट्स बनाए हैं:\n1. **Sathi AI**: कस्टम-प्रशिक्षित 8B GGUF भाषा मॉडल।\n2. **Ascend Study**: सुव्यवस्थित एजुकेशनल वेब एप्लीकेशन।\n3. **CORE AI**: एआई असिस्टेंट इंटरफ़ेस।\n4. **PocketPaisa / PocketPaisa Pro**: वित्तीय प्रबंधन वेब ऐप।\n5. **DriveMate AI**: सड़क सुरक्षा ड्राइविंग असिस्टेंट।\n6. **THERMONEST V1**: गैर-विद्युत वाष्पीकरणीय कूलिंग सिस्टम ब्लूप्रिंट।";
    } else if (isHinglish) {
      return "Rohit Yadav ne kai real-world projects banaye hain:\n1. **Sathi AI**: Custom-trained 8B GGUF language model.\n2. **Ascend Study**: Educational web application.\n3. **CORE AI**: Custom conversational AI assistant interface.\n4. **PocketPaisa / PocketPaisa Pro**: Expense tracking app.\n5. **DriveMate AI**: Intelligent driving assistant concept.\n6. **THERMONEST V1**: Sustainable cooling system technical blueprint.";
    } else {
      return "Rohit Yadav has engineered several key projects:\n1. **Sathi AI**: Custom-trained 8B GGUF language model.\n2. **Ascend Study**: Educational web application.\n3. **CORE AI**: AI assistant interface.\n4. **PocketPaisa**: Finance management web app.\n5. **DriveMate AI**: Road safety driving assistant.\n6. **THERMONEST V1**: Sustainable pre-cooling system technical blueprint.";
    }
  }

  // Extracurriculars / Interests / Astronomy / Cricket
  if (hasInterests) {
    if (isHi) {
      return "रोहित यादव की विज्ञान और खेलों में गहरी रुचि है:\n* **खगोल विज्ञान (Astronomy)**: छत से आकाशीय पिंडों (बृहस्पति, ओरियन नक्षत्र, एंड्रोमेडा गैलेक्सी) का अवलोकन करना और जूनिवर्स (Zooniverse) पर खगोलीय डेटा वर्गीकरण कार्यों में भाग लेना।\n* **खेल (Sports)**: एक उत्साही क्रिकेटर, जो दाएं हाथ के बल्लेबाज और तेज गेंदबाज हैं।";
    } else if (isHinglish) {
      return "Rohit Yadav ki science aur sports me bohot gehri ruchi hai:\n* **Astronomy**: Rooftop observer jo celestial objects (Jupiter, Orion, Andromeda Galaxy) track karte hain aur Zooniverse par astronomy tasks classifications me participate karte hain.\n* **Sports**: Passionate cricketer jo right-handed batter aur fast bowler hain.";
    } else {
      return "Rohit Yadav is deeply interested in science and sports:\n* **Astronomy**: Rooftop celestial tracker (Jupiter, Orion, Andromeda Galaxy) and participant in astronomical data classification on Zooniverse.\n* **Sports**: Passionate cricketer, playing as a right-handed batter and fast bowler.";
    }
  }

  // Skills
  if (hasSkills) {
    if (isHi) {
      return "रोहित यादव के तकनीकी कौशलों में **Python, HTML5/CSS3, JavaScript, React, Tailwind CSS, Flutter, React Native, Vercel, Firebase और Prompt Engineering** शामिल हैं।";
    } else if (isHinglish) {
      return "Rohit Yadav ke technical skills me **Python, HTML5/CSS3, JavaScript, React, Tailwind CSS, Flutter, React Native, Vercel, Firebase aur Prompt Engineering** shamil hain.";
    } else {
      return "Rohit Yadav's technical skills include **Python, HTML5/CSS3, JavaScript, React, Tailwind CSS, Flutter, React Native, Vercel, Firebase, and Prompt Engineering**.";
    }
  }

  // Key matching criteria for detailed creator profile / Rohit Yadav questions
  const matchCreatorProfile = (
    norm === "rohit" ||
    norm === "yadav" ||
    norm === "rohit yadav" ||
    norm.includes("creator profile") ||
    norm.includes("about your creator") ||
    norm.includes("creator ke bare") ||
    norm.includes("creator ke baare") ||
    norm.includes("creator details") ||
    norm.includes("who is rohit") ||
    norm.includes("rohit kaun hai") ||
    norm.includes("rohit yadav kaun hai") ||
    norm.includes("rohit ke baare") ||
    norm.includes("rohit ke bare") ||
    norm.includes("tell me about rohit") ||
    norm.includes("tell me about your creator") ||
    norm.includes("details of rohit") ||
    norm.includes("details about rohit") ||
    (norm.includes("tell") && norm.includes("creator"))
  );

  if (matchCreatorSimple) {
    if (isHi) {
      return "मुझे **Rohit Yadav** ने बनाया है। क्या आप उनके बारे में और कुछ जानना चाहेंगे?";
    } else if (isHinglish) {
      return "Mujhe **Rohit Yadav** ne banaya hai. Kya aap unke baare me aur kuch jaan na chahenge?";
    } else {
      return "I was created by **Rohit Yadav**. Would you like to know more about him?";
    }
  }

  if (matchCreatorProfile) {
    if (isHi) {
      return `### 👤 मेरे निर्माता का प्रोफ़ाइल: रोहित यादव (Rohit Yadav)
**साइंस स्टूडेंट (PCM) और फुल-स्टैक / एआई डेवलपर**
*महेशपुर, छबड़ा तहसील, बारां जिला, राजस्थान, भारत*
*कक्षा 12 साइंस (PCM) | अरुणा जेईई 3.0 (Arjuna JEE 3.0)*
*GitHub पोर्टफोलियो*: [heenayadav325200-png](https://github.com/heenayadav325200-png)

---

#### 📖 प्रोफाइल सारांश (Profile Summary)
रोहित यादव एक अत्यधिक महत्वाकांक्षी और उत्साही कक्षा 12 (PCM) के छात्र हैं, जो **स्वामी विवेकानंद गवर्नमेंट मॉडल स्कूल, कड़ैयाबन, छबड़ा (राजस्थान)** में अध्ययनरत हैं। वे एक स्व-शिक्षित (self-taught) फुल-स्टैक सॉफ्टवेयर डेवलपर, मोबाइल ऐप निर्माता, और एआई/एलएलएम (AI/LLM) उत्साही हैं। वे फिजिक्स, केमिस्ट्री और मैथ्स में मजबूत शैक्षणिक ध्यान बनाए रखने के साथ-साथ शानदार एजुकेशनल वेब ऐप्स, कस्टम मॉडल्स (GGUF) और व्यावहारिक यूटिलिटी टूल्स विकसित करते हैं।

---

#### 🎓 शिक्षा (Education)
* **स्कूल**: स्वामी विवेकानंद गवर्नमेंट मॉडल स्कूल, कड़ैयाबन, छबड़ा, राजस्थान
* **कक्षा**: कक्षा 12 साइंस स्ट्रीम (भौतिकी, रसायन विज्ञान, गणित)
* **प्रतियोगी परीक्षा**: Arjuna JEE 3.0 के छात्र

---

#### 🚀 प्रमुख प्रोजेक्ट्स और नवाचार (Key Projects & Innovations)
* **Sathi AI (कस्टम 8B पैरामीटर LLM)**: पायथन, गूगल कोलाब और \`llama-cpp-python\` रनटाइम वातावरण का उपयोग करके कस्टम-प्रशिक्षित GGUF भाषा मॉडल (\`sathi_ai_q4_k_m.gguf\`) को कॉन्फ़िगर, टेस्ट और डिप्लॉय किया।
* **Ascend Study / Ascend Study Buddy**: छात्रों की मदद के लिए निर्मित एक सुव्यवस्थित शैक्षणिक वेब एप्लीकेशन, जिसमें संरचित अध्ययन सामग्री और इंटरैक्टिव लर्निंग मॉड्यूल शामिल हैं। (React, Firebase, Vercel)।
* **CORE AI**: त्वरित-अभियांत्रिकी (prompt-engineered) चैट वर्कफ़्लो और सहज यूजर इंटरैक्शन मॉडल से लैस एक कस्टमाइज़्ड कन्वर्सेशनल एआई असिस्टेंट वेब इंटरफ़ेस।
* **PocketPaisa / PocketPaisa Pro**: वित्तीय प्रबंधन और दैनिक खर्चों को ट्रैक करने के लिए निर्मित एक व्यापक वेब एप्लीकेशन।
* **DriveMate AI (ड्राईव मेट एआई)**: सड़क सुरक्षा में सुधार के उद्देश्य से डिजाइन किया गया एक इंटेलिजेंट ड्राइविंग असिस्टेंट ब्लूप्रिंट।
* **THERMONEST V1**: एक कड़ा, गैर-विद्युत वाष्पीकरणीय (non-electric evaporative) और ग्राउंड प्री-कूलिंग सिस्टम के लिए तैयार किया गया तकनीकी ब्लूप्रिंट।

---

#### 🛠️ तकनीकी कौशल (Technical Skills)
* **भाषाएं**: Python, HTML5, CSS3, JavaScript
* **फ्रेमवर्क और टूल्स**: React, Tailwind CSS, Flutter, React Native, Git & GitHub, Vercel, Firebase, Prompt Engineering, Google Colab & GGUF Models

---

#### 🌌 पाठ्येतर गतिविधियां और विज्ञान (Extracurricular Interests)
* **खगोल विज्ञान और नागरिक विज्ञान**: छत से आकाशीय पिंडों (जैसे बृहस्पति, ओरियन नक्षत्र, एंड्रोमेडा गैलेक्सी) का अवलोकन करना और जूनिवर्स (Zooniverse) पर खगोलीय डेटा वर्गीकरण कार्यों में भाग लेना।
* **खेल**: एक उत्साही क्रिकेटर, जो दाएं हाथ के बल्लेबाज और तेज गेंदबाज के रूप में खेलते हैं और प्रतिस्पर्धी उत्कृष्टता की ओर अग्रसर हैं।

---

*यदि आप रोहित यादव के बारे में कोई ऐसी जानकारी जानना चाहते हैं जो यहाँ उपलब्ध नहीं है, तो मैं विनम्रतापूर्वक सूचित करना चाहूँगा कि **मेरे Creator Profile में इस जानकारी का उल्लेख नहीं है।***`;
    } else if (isHinglish) {
      return `### 👤 Creator Profile: Rohit Yadav
**Science Student (PCM) & Full-Stack / AI Developer**
*Maheshpur, Chhabra Tehsil, Baran District, Rajasthan, India*
*Class 12 Science (PCM) | Arjuna JEE 3.0 Student*
*GitHub Portfolio*: [heenayadav325200-png](https://github.com/heenayadav325200-png)

---

#### 📖 Profile Summary
Rohit Yadav ek ambitious aur passionate Class 12 Science (PCM) student hain jo **Swami Vivekanand Government Model School, Kadaiyaban, Chhabra (Rajasthan)** me padhte hain. Unhe self-taught full-stack software development, mobile app creation, AI integration aur custom GGUF/LLM models handling ka bohot acha experience hai. Wo apni Physics, Chemistry aur Mathematics ki padhai ke sath-sath educational web apps aur machine learning interfaces develop karte hain.

---

#### 🎓 Education
* **School**: Swami Vivekanand Government Model School, Kadaiyaban, Chhabra, Rajasthan
* **Class**: Class 12 Science Stream (Physics, Chemistry, Mathematics)
* **Exam Prep**: Enrolled in Arjuna JEE 3.0

---

#### 🚀 Key Projects & Innovations
* **Sathi AI (Custom 8B Parameter LLM)**: Python, Google Colab, aur \`llama-cpp-python\` runtime ka use karke custom-trained GGUF models (\`sathi_ai_q4_k_m.gguf\`) configure aur deploy kiya.
* **Ascend Study / Ascend Study Buddy**: Ek feature-rich educational web application jo students ko study resources aur interactive learning provide karta hai (React, Firebase, Vercel).
* **CORE AI**: Custom conversational AI assistant web interface jisme prompt-engineered chat workflows hain.
* **PocketPaisa / PocketPaisa Pro**: Expense tracking aur personal finance management application.
* **DriveMate AI (ड्राईव मेट एआई)**: Road safety improve karne ke liye intelligent driving assistant concept.
* **THERMONEST V1**: Non-electric, sustainable evaporative and ground pre-cooling system ka technical blueprint.

---

#### 🛠️ Technical Skills & Expertise
* **Languages**: Python, HTML5, CSS3, JavaScript
* **Frameworks & Tools**: React, Tailwind CSS, Flutter, React Native, Git & GitHub, Vercel, Firebase, Prompt Engineering, Google Colab & GGUF Models

---

#### 🌌 Extracurricular Interests & Science
* **Astronomy & Citizen Science**: Rooftop observer jo celestial objects (Jupiter, Orion, Andromeda Galaxy) track karte hain aur Zooniverse par astronomical data classification me participate karte hain.
* **Sports**: Passionate cricketer jo right-handed batter aur fast bowler hain.

---

*Agar aap Rohit ke baare me koi aisi baat puch rahe hain jo is profile me nahi hai, toh **mere Creator Profile me is jankari ka ullekh nahi hai.***`;
    } else {
      return `### 👤 Creator Profile: Rohit Yadav
**Science Student (PCM) & Full-Stack / AI Developer**
*Maheshpur, Chhabra Tehsil, Baran District, Rajasthan, India*
*Class 12 Science (PCM) | Arjuna JEE 3.0 Student*
*GitHub Portfolio*: [heenayadav325200-png](https://github.com/heenayadav325200-png)

---

#### 📖 Profile Summary
Rohit Yadav is an ambitious and passionate Class 12 Science (PCM) student at **Swami Vivekanand Government Model School, Kadaiyaban, Chhabra, Rajasthan**. He has extensive self-taught expertise in full-stack software development, mobile application creation, AI integration, and custom GGUF/LLMs handling. He successfully balances a rigorous academic focus in Physics, Chemistry, and Mathematics while engineering highly useful educational web apps and machine learning interfaces.

---

#### 🎓 Education
* **School**: Swami Vivekanand Government Model School, Kadaiyaban, Chhabra, Rajasthan
* **Class**: Class 12 Science Stream (Physics, Chemistry, Mathematics)
* **Exam Prep**: Enrolled in Arjuna JEE 3.0

---

#### 🚀 Key Projects & Innovations
* **Sathi AI (Custom 8B Parameter LLM)**: Configured, tested, and deployed custom-trained GGUF language models (\`sathi_ai_q4_k_m.gguf\`) using Python, Google Colab, and \`llama-cpp-python\` runtime environments.
* **Ascend Study / Ascend Study Buddy**: Designed and deployed a feature-rich educational web application to aid students with structured study resources and interactive learning modules. (React, Firebase, Vercel).
* **CORE AI**: Developed a custom AI assistant web interface featuring prompt-engineered chat workflows and seamless user interaction models.
* **PocketPaisa / PocketPaisa Pro**: Conceptualized and published a comprehensive financial management and expense tracking web application.
* **DriveMate AI (ड्राईव मेट एआई)**: Engineered an intelligent driving assistant blueprint aimed at improving road safety.
* **THERMONEST V1**: Drafted technical blueprints and specifications for a sustainable, non-electric evaporative and ground pre-cooling system.

---

#### 🛠️ Technical Skills & Expertise
* **Languages**: Python, HTML5, CSS3, JavaScript
* **Frameworks & Tools**: React, Tailwind CSS, Flutter, React Native, Git & GitHub, Vercel, Firebase, Prompt Engineering, Google Colab & GGUF Models

---

#### 🌌 Extracurricular Interests & Science
* **Astronomy & Citizen Science**: Rooftop observer tracking celestial objects (Jupiter, Orion, Andromeda Galaxy) and participating in astronomical data classification tasks on Zooniverse.
* **Sports**: Passionate cricketer, playing as a right-handed batter and fast bowler with aspirations of competitive excellence.

---

*If you are asking about any information not listed here, **there is no mention of this detail in my official Creator Profile.***`;
    }
  }

  // Fallback check to avoid hallucination if Rohit is mentioned but we have no specific details
  if (norm.includes("rohit") || norm.includes("yadav")) {
    if (isHi) {
      return "मेरे पास मेरे Creator **Rohit Yadav** के बारे में केवल उनके आधिकारिक प्रोफाइल की जानकारी है। **मेरे Creator Profile में इस जानकारी का उल्लेख नहीं है।**";
    } else {
      return "I only have information from the official profile of my creator, **Rohit Yadav**. **There is no mention of this detail in my Creator Profile.**";
    }
  }

  return null;
}

