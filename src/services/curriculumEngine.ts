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
 * Generates topic-aligned multiple choice questions for mock exams.
 */
export function generateSubjectMockQuestions(subject: string, topic: string, language: string = "en"): any[] {
  const isHi = language === "hi";
  const cleanSubject = subject || "Science";
  const cleanTopic = topic || "Core Principles";

  if (isHi) {
    return [
      {
        questionText: `${cleanSubject} में ${cleanTopic} का मुख्य मूलभूत नियम कौन सा है?`,
        options: [
          "संरक्षण और संतुलन का नियम",
          "यादृच्छिक परिवर्तन का नियम",
          "अनिश्चितता का नियम",
          "शून्य द्रव्यमान का नियम"
        ],
        correctOptionIndex: 0,
        explanation: `${cleanTopic} के सभी समीकरण संरक्षण और भौतिक संतुलन के नियमों पर आधारित होते हैं।`
      },
      {
        questionText: `दिए गए विकल्पों में से ${cleanTopic} के लिए सबसे महत्वपूर्ण चर (Variable) क्या है?`,
        options: [
          "समय और दर में परिवर्तन",
          "केवल रंग और रूप",
          "स्थैतिक मान",
          "अपरिवर्तनीय वातावरण"
        ],
        correctOptionIndex: 0,
        explanation: "प्रक्रिया की दर और समय का अध्ययन इस विषय का आधार है।"
      },
      {
        questionText: `${cleanTopic} से संबंधित गणनाओं में किस पद्धति से त्रुटि की संभावना न्यूनतम होती है?`,
        options: [
          "चरणबद्ध विधि और इकाई सत्यापन",
          "अनुमान लगाना",
          "अंतिम परिणाम का अंदाजा",
          "सूत्रों को छोड़ देना"
        ],
        correctOptionIndex: 0,
        explanation: "चरणबद्ध गणना और इकाइयों का सही उपयोग सटीक उत्तर सुनिश्चित करता है।"
      },
      {
        questionText: `व्यावहारिक रूप से ${cleanTopic} का उपयोग कहाँ देखा जाता है?`,
        options: [
          "आधुनिक इंजीनियरिंग एवं तकनीकी प्रणालियों में",
          "केवल सैद्धांतिक किताबों में",
          "किसी भी वास्तविक कार्य में नहीं",
          "अज्ञात स्थानों में"
        ],
        correctOptionIndex: 0,
        explanation: "यह सिद्धांत आधुनिक तकनीक और वास्तविक वैज्ञानिक अनुप्रयोगों में व्यापक रूप से प्रयुक्त होता है।"
      },
      {
        questionText: `${cleanTopic} के अध्ययन से विद्यार्थी किस क्षमता का विकास करते हैं?`,
        options: [
          "तार्किक और विश्लेषणात्मक चिंतन",
          "केवल रटना",
          "गलत निष्कर्ष निकालना",
          "समय की बर्बादी"
        ],
        correctOptionIndex: 0,
        explanation: "वैज्ञानिक और गणितीय दृष्टिकोण से समस्या निवारण की क्षमता विकसित होती है।"
      }
    ];
  }

  return [
    {
      questionText: `What is the primary governing principle of ${cleanTopic} in ${cleanSubject}?`,
      options: [
        "Conservation and Equilibrium Laws",
        "Random Fluctuations Principle",
        "Arbitrary Static Equilibrium",
        "Non-interacting Field Hypothesis"
      ],
      correctOptionIndex: 0,
      explanation: `The foundational principles of ${cleanTopic} are rooted in conservation and mathematical equilibrium.`
    },
    {
      questionText: `When analyzing problem scenarios involving ${cleanTopic}, which step is considered essential?`,
      options: [
        "Verifying boundary conditions and dimensional units",
        "Ignoring intermediate calculations",
        "Assuming zero initial state unconditionally",
        "Relying purely on qualitative approximations"
      ],
      correctOptionIndex: 0,
      explanation: "Dimensional consistency and boundary checks ensure rigorous scientific validity."
    },
    {
      questionText: `How does a change in primary system parameters typically affect ${cleanTopic}?`,
      options: [
        "Follows a predictable, structured functional relationship",
        "Causes purely chaotic, untestable variations",
        "Has absolutely no measurable physical effect",
        "Violates fundamental conservation principles"
      ],
      correctOptionIndex: 0,
      explanation: "Governing equations demonstrate direct or inverse relationships under specified constraints."
    },
    {
      questionText: `In standard examinations, which of the following is crucial for securing full marks on ${cleanTopic}?`,
      options: [
        "Presenting sequential derivations with explicit formula statements",
        "Writing only the final numerical value without steps",
        "Skipping unit annotations",
        "Omitting reference diagrams"
      ],
      correctOptionIndex: 0,
      explanation: "Examiners award marks for systematic methodology, formula clarity, and boxed final answers."
    },
    {
      questionText: `Which practical application best showcases the real-world utility of ${cleanTopic}?`,
      options: [
        "System optimization and computational modeling in modern industry",
        "Purely historical archival documentation",
        "Uncalibrated laboratory observation",
        "Isolated theoretical exercises with no physical counterpart"
      ],
      correctOptionIndex: 0,
      explanation: "Modern engineering and scientific tools rely on these principles for accurate predictive modeling."
    }
  ];
}
