export interface AcademicSuggestion {
  id: string;
  icon: 'question' | 'practice' | 'deepen' | 'analogy' | 'quiz' | 'formula' | 'step' | 'mistake' | 'summary' | 'action';
  label: string; // e.g. "🔬 Derivation & Proof", "🧮 Numerical Practice", "💡 Real-World Analogy"
  prompt: string; // The text to be submitted to AI Tutor when clicked
  subtitle?: string; // Short 1-line description of the outcome
  category: 'deep_dive' | 'practice' | 'concept' | 'study_action' | 'summary';
  badge?: string; // e.g. "+15 XP", "High Yield", "Exam Prep"
}

interface SuggestionContext {
  messages: Array<{ sender: 'user' | 'ai'; text: string; subject?: string; mode?: string }>;
  subject?: string;
  studentContext?: {
    name?: string;
    className?: string;
    school?: string;
    targetGoal?: string;
  };
  tutorMode?: string;
  language?: string;
}

/**
 * Heuristic Contextual Analyzer
 * Rapidly extracts topics, keywords, and academic concepts from recent conversation history.
 */
export function generateContextualSuggestions(context: SuggestionContext): AcademicSuggestion[] {
  const { messages, subject = 'General', studentContext: _studentContext, tutorMode: _tutorMode } = context;

  // 1. Gather recent conversation context
  const recentMessages = messages.slice(-4);
  const combinedText = recentMessages.map((m) => m.text).join(' ').toLowerCase();
  const lastUserMsg = [...messages].reverse().find((m) => m.sender === 'user')?.text || '';
  const lastQuery = lastUserMsg.toLowerCase();

  // Specific Domain Topics Detection

  // --- MATHEMATICS DOMAINS ---
  if (
    subject === 'Mathematics' ||
    combinedText.includes('quadratic') ||
    combinedText.includes('equation') ||
    combinedText.includes('derivative') ||
    combinedText.includes('integral') ||
    combinedText.includes('trigonometry') ||
    combinedText.includes('matrix') ||
    combinedText.includes('polynomial') ||
    combinedText.includes('geometry') ||
    combinedText.includes('triangle') ||
    combinedText.includes('probability') ||
    combinedText.includes('algebra')
  ) {
    if (combinedText.includes('quadratic') || combinedText.includes('parabola') || combinedText.includes('x^2') || combinedText.includes('x²')) {
      return [
        {
          id: 'sugg_quad_1',
          icon: 'formula',
          label: '📐 Prove Quadratic Formula',
          prompt: 'Can you show the mathematical step-by-step derivation of the Quadratic Formula using the Completing the Square method?',
          subtitle: 'Step-by-step algebraic proof',
          category: 'deep_dive',
          badge: 'High Yield'
        },
        {
          id: 'sugg_quad_2',
          icon: 'practice',
          label: '🧮 Solve Practice Problem',
          prompt: 'Give me 1 challenging quadratic equation with fractional or negative coefficients to solve right now, then check my answer.',
          subtitle: 'Interactive test problem',
          category: 'practice',
          badge: '+15 XP'
        },
        {
          id: 'sugg_quad_3',
          icon: 'mistake',
          label: '🔍 Common Exam Pitfalls',
          prompt: 'What are the top 3 common discriminant (b² - 4ac) and sign mistakes students make in quadratic exams, and how do I avoid them?',
          subtitle: 'Avoid common exam traps',
          category: 'study_action',
          badge: 'Exam Tips'
        }
      ];
    }

    if (combinedText.includes('derivative') || combinedText.includes('integral') || combinedText.includes('calculus') || combinedText.includes('limit')) {
      return [
        {
          id: 'sugg_calc_1',
          icon: 'analogy',
          label: '💡 Geometric Meaning',
          prompt: 'Explain the geometric intuition of derivatives vs integrals with an everyday velocity and distance graph analogy.',
          subtitle: 'Intuitive geometric concept',
          category: 'concept',
          badge: 'Concept'
        },
        {
          id: 'sugg_calc_2',
          icon: 'step',
          label: '⚡ Chain Rule / Product Rule',
          prompt: 'Show me a worked-out example demonstrating how to apply both Product Rule and Chain Rule together step-by-step.',
          subtitle: 'Advanced calculus method',
          category: 'deep_dive',
          badge: '+15 XP'
        },
        {
          id: 'sugg_calc_3',
          icon: 'quiz',
          label: '📝 Quick Practice MCQ',
          prompt: 'Give me 2 practice multiple choice questions on finding critical points and limits at infinity to test my mastery.',
          subtitle: 'Test your understanding',
          category: 'practice',
          badge: 'Quiz'
        }
      ];
    }

    if (combinedText.includes('trigonometry') || combinedText.includes('sin') || combinedText.includes('cos') || combinedText.includes('tan') || combinedText.includes('theta')) {
      return [
        {
          id: 'sugg_trig_1',
          icon: 'formula',
          label: '📐 Unit Circle Cheat Sheet',
          prompt: 'Create a clean markdown table summarizing the standard angles (0°, 30°, 45°, 60°, 90°, 180°) and their sin, cos, tan values with memory tricks.',
          subtitle: 'Summary values table',
          category: 'summary',
          badge: 'Cheat Sheet'
        },
        {
          id: 'sugg_trig_2',
          icon: 'practice',
          label: '🧮 Trigonometric Identity Proof',
          prompt: 'Give me a classic trigonometric identity proof problem (like proving sin²θ + cos²θ = 1 or tanθ + cotθ = secθ cscθ) to verify step-by-step.',
          subtitle: 'Step-by-step identity proof',
          category: 'practice',
          badge: '+15 XP'
        },
        {
          id: 'sugg_trig_3',
          icon: 'analogy',
          label: '🌍 Real-World Triangulation',
          prompt: 'How do astronomers and civil engineers use trigonometry (angles of elevation and depression) to measure heights of mountains and distance to stars?',
          subtitle: 'Everyday applications',
          category: 'concept',
          badge: 'Real World'
        }
      ];
    }

    // Default Math Suggestions
    return [
      {
        id: 'sugg_math_gen_1',
        icon: 'step',
        label: '⚡ Deeper Step-by-Step Breakdown',
        prompt: `Can you break down the mathematical logic for ${lastUserMsg ? `"${lastUserMsg.slice(0, 40)}..."` : 'this topic'} into even simpler sequential steps with each formula stated?`,
        subtitle: 'Break into atomic steps',
        category: 'deep_dive',
        badge: 'Step-by-Step'
      },
      {
        id: 'sugg_math_gen_2',
        icon: 'practice',
        label: '🧮 2 Similar Practice Questions',
        prompt: 'Give me 2 similar practice problems at a standard board exam level so I can test whether I understood this method.',
        subtitle: 'Practice numericals',
        category: 'practice',
        badge: '+15 XP'
      },
      {
        id: 'sugg_math_gen_3',
        icon: 'summary',
        label: '📌 Formula & Rule Summary',
        prompt: 'Summarize all the formulas, definitions, and conditions used here in a clean reference table.',
        subtitle: 'Quick revision cheat sheet',
        category: 'summary',
        badge: 'Formulas'
      }
    ];
  }

  // --- PHYSICS DOMAINS ---
  if (
    subject === 'Physics' ||
    combinedText.includes('motion') ||
    combinedText.includes('newton') ||
    combinedText.includes('force') ||
    combinedText.includes('energy') ||
    combinedText.includes('thermodynamics') ||
    combinedText.includes('optics') ||
    combinedText.includes('gravity') ||
    combinedText.includes('electricity') ||
    combinedText.includes('current') ||
    combinedText.includes('magnetic')
  ) {
    return [
      {
        id: 'sugg_phys_1',
        icon: 'analogy',
        label: '🌍 Real-World Analogy',
        prompt: 'Explain this exact physical principle using a fun, relatable real-world example (e.g. sports, rollercoasters, or space travel).',
        subtitle: 'Intuitive physical visual',
        category: 'concept',
        badge: 'Analogy'
      },
      {
        id: 'sugg_phys_2',
        icon: 'practice',
        label: '🧮 Numerical with SI Units',
        prompt: 'Give me a numerical physics problem with given values and SI units to calculate step-by-step.',
        subtitle: 'Physics problem calculation',
        category: 'practice',
        badge: '+15 XP'
      },
      {
        id: 'sugg_phys_3',
        icon: 'mistake',
        label: '🔍 Sign & Vector Conventions',
        prompt: 'What are the crucial sign conventions (+/- directions) and unit conversion traps to watch out for in exams on this topic?',
        subtitle: 'Avoid calculation errors',
        category: 'study_action',
        badge: 'Exam Tips'
      }
    ];
  }

  // --- CHEMISTRY DOMAINS ---
  if (
    subject === 'Chemistry' ||
    combinedText.includes('reaction') ||
    combinedText.includes('periodic') ||
    combinedText.includes('acid') ||
    combinedText.includes('base') ||
    combinedText.includes('mole') ||
    combinedText.includes('organic') ||
    combinedText.includes('bond') ||
    combinedText.includes('atom') ||
    combinedText.includes('electron') ||
    combinedText.includes('oxidation')
  ) {
    return [
      {
        id: 'sugg_chem_1',
        icon: 'formula',
        label: '🧪 Balanced Chemical Equations',
        prompt: 'Show the balanced chemical equations, state symbols (s, l, g, aq), and reaction conditions for this mechanism.',
        subtitle: 'Equation balancing & states',
        category: 'deep_dive',
        badge: 'Equations'
      },
      {
        id: 'sugg_chem_2',
        icon: 'practice',
        label: '🧮 Stoichiometry / Mole Question',
        prompt: 'Give me a stoichiometry calculation problem based on this reaction to find the mass or volume produced.',
        subtitle: 'Test mole calculations',
        category: 'practice',
        badge: '+15 XP'
      },
      {
        id: 'sugg_chem_3',
        icon: 'summary',
        label: '📊 Reaction Mechanism Summary',
        prompt: 'Create a structured comparison table showing reactants, products, catalysts, and safety precautions.',
        subtitle: 'Structured revision table',
        category: 'summary',
        badge: 'Summary'
      }
    ];
  }

  // --- BIOLOGY DOMAINS ---
  if (
    subject === 'Biology' ||
    combinedText.includes('cell') ||
    combinedText.includes('photosynthesis') ||
    combinedText.includes('genetics') ||
    combinedText.includes('dna') ||
    combinedText.includes('rna') ||
    combinedText.includes('heart') ||
    combinedText.includes('brain') ||
    combinedText.includes('respiration') ||
    combinedText.includes('organism') ||
    combinedText.includes('evolution')
  ) {
    return [
      {
        id: 'sugg_bio_1',
        icon: 'deepen',
        label: '🔬 Step-by-Step Biological Cycle',
        prompt: 'Break down the exact sequence of cellular / physiological events in this process in numbered chronological order.',
        subtitle: 'Step-by-step pathway',
        category: 'deep_dive',
        badge: 'Biological Cycle'
      },
      {
        id: 'sugg_bio_2',
        icon: 'quiz',
        label: '📝 3 High-Yield Board Exam MCQs',
        prompt: 'Test my recall with 3 tricky multiple choice questions on diagrams, enzyme functions, and organelle roles in this topic.',
        subtitle: 'Board exam revision quiz',
        category: 'practice',
        badge: '+15 XP'
      },
      {
        id: 'sugg_bio_3',
        icon: 'summary',
        label: '📊 Function & Organelle Table',
        prompt: 'Make a clean markdown summary table showing each organelle/molecule and its exact biological function.',
        subtitle: 'Quick revision table',
        category: 'summary',
        badge: 'Summary'
      }
    ];
  }

  // --- ENGLISH & HUMANITIES DOMAINS ---
  if (
    subject === 'English' ||
    combinedText.includes('essay') ||
    combinedText.includes('grammar') ||
    combinedText.includes('poem') ||
    combinedText.includes('literature') ||
    combinedText.includes('story') ||
    combinedText.includes('character') ||
    combinedText.includes('vocabulary') ||
    combinedText.includes('thesis')
  ) {
    return [
      {
        id: 'sugg_eng_1',
        icon: 'action',
        label: '✍️ Advanced Vocabulary & Phrasing',
        prompt: 'Suggest 5 sophisticated academic vocabulary words and transition phrases to elevate the tone and clarity of this writing.',
        subtitle: 'Elevate writing style',
        category: 'study_action',
        badge: 'Writing'
      },
      {
        id: 'sugg_eng_2',
        icon: 'deepen',
        label: '🎭 Literary Themes & Devices',
        prompt: 'Analyze the literary devices (metaphors, symbolism, irony, tone) and central thematic message in this context.',
        subtitle: 'Deep literary analysis',
        category: 'deep_dive',
        badge: 'Analysis'
      },
      {
        id: 'sugg_eng_3',
        icon: 'practice',
        label: '📝 Outline & Counterargument',
        prompt: 'Help me outline a strong counterargument paragraph and rebuttal to make this essay persuasive and balanced.',
        subtitle: 'Essay structuring',
        category: 'practice',
        badge: '+15 XP'
      }
    ];
  }

  // --- GENERAL / VERSATILE ACADEMIC FALLBACK ---
  return [
    {
      id: 'sugg_gen_1',
      icon: 'analogy',
      label: '💡 Explain with Simpler Analogy',
      prompt: `Can you explain the core concept of ${lastQuery ? `"${lastQuery.slice(0, 35)}..."` : 'this lesson'} using a simple everyday analogy and Hinglish/simple English?`,
      subtitle: 'Clear intuitive explanation',
      category: 'concept',
      badge: 'Analogy'
    },
    {
      id: 'sugg_gen_2',
      icon: 'quiz',
      label: '📝 Practice Check Question',
      prompt: 'Give me 1 quick practice question based on what we just discussed so I can test if I really understood it.',
      subtitle: 'Instant self-test',
      category: 'practice',
      badge: '+15 XP'
    },
    {
      id: 'sugg_gen_3',
      icon: 'summary',
      label: '📌 Key Takeaways & Cheat Sheet',
      prompt: 'Summarize the core definitions, formulas, and most important exam takeaways from this in a structured summary.',
      subtitle: 'Revision notes table',
      category: 'summary',
      badge: 'Summary'
    }
  ];
}

const clientSuggCache = new Map<string, { data: AcademicSuggestion[]; timestamp: number }>();

/**
 * Fetch dynamic AI-generated suggestions from backend (or fallback to heuristic engine)
 */
export async function getAiTutorSuggestions(context: SuggestionContext): Promise<AcademicSuggestion[]> {
  const heuristic = generateContextualSuggestions(context);

  // If there are no messages, return standard starter suggestions
  if (!context.messages || context.messages.length <= 1) {
    return heuristic;
  }

  const cacheKey = `${context.subject || 'gen'}_${context.language || 'en'}_${context.messages.length}`;
  const cached = clientSuggCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < 5 * 60 * 1000)) {
    return cached.data;
  }

  try {
    const recentMsgs = context.messages.slice(-3).map((m) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      text: m.text.slice(0, 400)
    }));

    // Call backend suggestion generator
    const res = await fetch('/api/gemini/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        history: recentMsgs,
        subject: context.subject,
        studentContext: context.studentContext,
        language: context.language
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.suggestions) && data.suggestions.length === 3) {
        const result = data.suggestions.map((s: any, idx: number) => ({
          id: `ai_sugg_${Date.now()}_${idx}`,
          icon: s.icon || (idx === 0 ? 'deepen' : idx === 1 ? 'practice' : 'analogy'),
          label: s.label || heuristic[idx].label,
          prompt: s.prompt || heuristic[idx].prompt,
          subtitle: s.subtitle || heuristic[idx].subtitle,
          category: s.category || (idx === 0 ? 'deep_dive' : idx === 1 ? 'practice' : 'concept'),
          badge: s.badge || (idx === 1 ? '+15 XP' : 'High Yield')
        }));
        clientSuggCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
      }
    }
  } catch (e) {
    // Non-blocking fallback to heuristic
  }

  return heuristic;
}
