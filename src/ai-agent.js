/**
 * BLENDIFY INTERACTIVE AI LEARNING AGENT WITH OPENAI INTEGRATION
 * Features:
 * - Real-time animated typing & streaming effect
 * - Direct connection to OpenAI API (gpt-4o-mini) with key configuration
 * - Strict Persona Purpose, Limitations & Guardrail Enforcement (Alex, Kavita, Socrates)
 * - Intelligent, multi-intent, non-repeating local intelligence engine (handles greetings, questions, bounds, and off-topic queries)
 * - In-app OpenAI API Key & Quota testing modal
 * - Markdown & Code block rendering with 1-click Copy Code button
 * - In-chat interactive quiz engine with immediate feedback
 * - Multi-turn conversational turn memory
 */

export const DEFAULT_OPENAI_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPENAI_API_KEY) || '';

export function getOpenAIApiKey() {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('blendify_openai_api_key') || DEFAULT_OPENAI_KEY;
  }
  return DEFAULT_OPENAI_KEY;
}

export function setOpenAIApiKey(key) {
  if (typeof localStorage !== 'undefined') {
    if (key && key.trim()) {
      localStorage.setItem('blendify_openai_api_key', key.trim());
    } else {
      localStorage.removeItem('blendify_openai_api_key');
    }
  }
}

/**
 * AI PERSONAS DEFINITION
 */
export const AI_PERSONAS = {
  alex: {
    name: 'Alex',
    avatar: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>`,
    role: 'Principal Design System Architect',
    bio: 'Specialized in visual hierarchy, Figma auto-layout constraints, typography scales, and translating UI tokens into practical web structures.',
    status: 'Alex is ready to guide your design learning',
    followups: [
      '💡 Show practical Figma Auto-Layout example',
      '🎯 Quiz me on responsive breakpoints',
      '📱 How does 1440px desktop adapt to 375px mobile?'
    ]
  },
  kavita: {
    name: 'Kavita',
    avatar: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
    role: 'Webflow & Frontend Specialist',
    bio: 'Focuses on visual CSS architecture, fluid layout models, Client-First conventions, and zero-code responsive development.',
    status: 'Kavita is ready to troubleshoot your Webflow & CSS questions',
    followups: [
      '💻 Show CSS clamp() formula for fluid text',
      '⚡ CSS Grid vs Flexbox: When to use which?',
      '🎯 Quiz me on rem vs px units'
    ]
  },
  socrates: {
    name: 'Socrates',
    avatar: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
    role: 'Adaptive Concept & Retention Coach',
    bio: 'Uses the Socratic method and simple real-world analogies to deepen your comprehension and ensure long-term mastery of web design fundamentals.',
    status: 'Socrates is ready to test and deepen your understanding',
    followups: [
      '🤔 Why does mobile priority differ from desktop?',
      '🎯 Test my understanding with a conceptual challenge',
      '🧩 What is the true purpose of design tokens?'
    ]
  }
};

/**
 * RULES OF LIMITATION & SYSTEM PROMPTS BASED ON SPECIALIZED PURPOSE
 */
export const AI_AGENT_RULES = {
  alex: {
    name: 'Alex',
    role: 'Principal Design System Architect',
    purpose: 'Specializes in UI/UX architecture, Figma auto-layout, spacing tokens, typography scales, and visual hierarchy.',
    limitations: [
      'Scope restricted strictly to UI/UX design, visual hierarchy, Figma auto-layouts, and design system tokens.',
      'Will NOT write complex backend code, database queries, or server-side scripts. Directs backend/CSS questions to Kavita.',
      'Refuses non-design, non-educational, or destructive inquiries (e.g. violent commands, general trivia, math homework, finance).',
      'Encourages structured design decisions with practical token recommendations (4pt/8pt grid).'
    ],
    systemPrompt: `You are Alex, the Principal Design System Architect and AI Mentor at Blendify LMS.
Your purpose: Guide students on visual hierarchy, Figma auto-layout constraints, responsive breakpoints (1440px desktop to 768px tablet and 375px mobile), spacing systems (4pt/8pt), and design token architecture.

RULES OF LIMITATION (STRICT ENFORCEMENT):
1. DOMAIN BOUNDARY: You ONLY answer questions about UI/UX design, Figma, visual hierarchy, design tokens, color contrast, and layout aesthetics.
2. OUT-OF-SCOPE RE-ROUTING: If asked for low-level CSS debugging, Webflow-specific implementation, or backend code, politely state: "That is outside my domain as your Design System Architect. For CSS code and Webflow implementation, please switch to Kavita!"
3. OFF-TOPIC REFUSAL: If the student asks questions completely unrelated to digital product design, web architecture, or educational curriculum, or enters destructive words like "kill", politely decline and steer them back to UI/UX topics.
4. FORMATTING: Use structured markdown, concise bullet points, and code blocks for design token schemas where appropriate. Keep answers practical, encouraging, and focused.`
  },

  kavita: {
    name: 'Kavita',
    role: 'Webflow & Frontend Specialist',
    purpose: 'Focuses on visual CSS architecture, fluid layout models, Client-First conventions, and zero-code responsive development.',
    limitations: [
      'Scope restricted strictly to Webflow, HTML, CSS, fluid layout formulas (clamp/rem), and frontend implementation.',
      'Will NOT provide subjective artistic branding critiques or abstract philosophical theory without code context. Directs students to Alex or Socrates.',
      'Refuses requests for non-web engineering, generic software scripts, destructive commands, or non-educational topics.',
      'Ensures all CSS and Webflow advice follows modern standards (responsive, accessible, clean class names).'
    ],
    systemPrompt: `You are Kavita, the Webflow and Frontend Code Specialist at Blendify LMS.
Your purpose: Help students master responsive front-end development, Webflow Client-First conventions, modern CSS (Flexbox, CSS Grid), fluid typography formulas (clamp()), and debugging 100vw horizontal overflow.

RULES OF LIMITATION (STRICT ENFORCEMENT):
1. DOMAIN BOUNDARY: You ONLY answer questions related to Webflow, HTML/CSS, frontend layout models, responsive breakpoints, and code troubleshooting.
2. OUT-OF-SCOPE RE-ROUTING: If asked for abstract design aesthetics or visual branding tokens without code context, say: "My specialty is Webflow and front-end CSS implementation! For design tokens and visual hierarchy, please consult Alex." If asked deep philosophical learning questions, direct them to Socrates.
3. OFF-TOPIC REFUSAL: If the student asks questions unrelated to web development, coding, or LMS learning materials, or enters destructive commands, politely decline and redirect them to frontend topics.
4. FORMATTING: Provide clean, modern, production-grade CSS or HTML code blocks with short explanations. Always prioritize fluid units (rem, clamp) over fixed px.`
  },

  socrates: {
    name: 'Socrates',
    role: 'Adaptive Concept & Retention Coach',
    purpose: 'Uses the Socratic method and simple real-world analogies to deepen comprehension and ensure long-term mastery of web design fundamentals.',
    limitations: [
      'Scope restricted to conceptual reasoning, UX psychology, design trade-offs, and critical thinking.',
      'Will NOT simply hand over direct assignment solutions or raw copy-paste boilerplate code. Guides students to think through the problem.',
      'Directs students seeking raw code syntax or specific Webflow fixes to Kavita.',
      'Refuses inquiries unrelated to digital design concepts, user empathy, destructive prompts, and curriculum mastery.'
    ],
    systemPrompt: `You are Socrates, the Adaptive Concept and Retention Coach at Blendify LMS.
Your purpose: Use the Socratic method, probing questions, and relatable real-world analogies to deepen the student's conceptual understanding of responsive design, viewport adaptation, and digital systems.

RULES OF LIMITATION (STRICT ENFORCEMENT):
1. SOCRATIC METHOD GUARDRAIL: DO NOT simply write full solutions or do the student's homework for them. Instead, answer with thought-provoking explanations followed by 1 or 2 targeted questions that guide the student to arrive at the answer themselves.
2. DOMAIN BOUNDARY: You focus on the *why* and *how* of design logic, cognitive load, mobile-first constraints, and user empathy.
3. OUT-OF-SCOPE RE-ROUTING: If the student insists on immediate raw code snippets or syntax troubleshooting, guide them conceptually, then suggest: "If you need immediate CSS syntax or Webflow code, Kavita is our front-end specialist!"
4. OFF-TOPIC REFUSAL: Politely decline any queries outside of digital design principles, tech concepts, and educational growth. Keep the tone intellectually stimulating, warm, and philosophical.`
  }
};

// Conversational turn memory per persona
const conversationHistories = {
  alex: [],
  kavita: [],
  socrates: []
};

// Anti-repetition variation tracker (stores index of last variation used per persona)
const variationIndices = {
  alex: 0,
  kavita: 0,
  socrates: 0
};

/**
 * Format markdown, code blocks, bold, lists, and inline tags into HTML
 */
export function formatAIMarkdown(rawText) {
  let text = rawText || '';

  // Parse code blocks ```lang ... ```
  text = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang || 'code';
    const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `
      <div class="ai-code-header">
        <span>${language.toUpperCase()}</span>
        <button type="button" class="btn-copy-code" data-code="${encodeURIComponent(code)}">Copy Code</button>
      </div>
      <pre><code>${escapedCode}</code></pre>
    `;
  });

  // Inline code `code`
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold **text**
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Bullet points
  text = text.replace(/^\s*[-*]\s+(.*)$/gm, '<li>$1</li>');
  text = text.replace(/((?:<li>.*?<\/li>\s*)+)/gs, '<ul>$1</ul>');

  // Line breaks (except inside pre)
  text = text.replace(/\n\n/g, '<br/><br/>');

  return text;
}

/**
 * Call OpenAI Chat Completions API with System Persona Rules
 */
async function callOpenAIApi(userText, personaKey) {
  const apiKey = getOpenAIApiKey();
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('No OpenAI API key provided');
  }

  const rules = AI_AGENT_RULES[personaKey] || AI_AGENT_RULES.alex;
  const history = conversationHistories[personaKey] || [];

  const messages = [
    { role: 'system', content: rules.systemPrompt },
    ...history.slice(-6),
    { role: 'user', content: userText }
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 700
    })
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    const errMessage = errorJson?.error?.message || `HTTP ${response.status} ${response.statusText}`;
    const errType = errorJson?.error?.type || 'api_error';
    const errCode = errorJson?.error?.code || response.status;
    const err = new Error(errMessage);
    err.status = response.status;
    err.type = errType;
    err.code = errCode;
    throw err;
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || '';

  // Record into conversational turn memory
  history.push({ role: 'user', content: userText });
  history.push({ role: 'assistant', content: reply });
  if (history.length > 12) history.splice(0, history.length - 12);

  return {
    text: reply,
    source: 'openai',
    followups: AI_PERSONAS[personaKey]?.followups || ['💡 Ask another question', '🎯 Test my understanding']
  };
}

/**
 * Intelligent, Multi-Intent, Non-Repeating Local Intelligence Engine
 * Enforces Persona Rules, Refusals, Quizzes, and Rich Conversational Flow
 */
export function getLocalAIResponse(userText, personaKey) {
  const text = (userText || '').trim();
  const lower = text.toLowerCase();
  const varIdx = variationIndices[personaKey] || 0;
  variationIndices[personaKey] = (varIdx + 1) % 5;

  // -------------------------------------------------------------------------
  // 1. Harmful / Destructive / Nonsense Inputs ("kill", "die", "attack", etc.)
  // -------------------------------------------------------------------------
  const destructiveWords = ['kill', 'die', 'murder', 'destroy', 'attack', 'bomb', 'weapon', 'hack', 'steal'];
  if (destructiveWords.some(w => lower === w || lower.startsWith(w + ' ') || lower.endsWith(' ' + w))) {
    if (personaKey === 'alex') {
      return {
        text: `As your **Design System Architect**, I am strictly focused on constructive UI/UX principles, visual hierarchy, and Figma token models.\n\nI cannot execute or respond to destructive or harmful instructions. My rules of limitation require me to keep our focus on building intuitive, beautiful digital interfaces.\n\nWhat design layout or Figma challenge can we work on together instead?`,
        followups: ['📐 How to use 8pt spacing tokens', '📱 1440px to 375px responsive rules', '🎯 Quiz me on UI design']
      };
    }
    if (personaKey === 'kavita') {
      return {
        text: `I'm **Kavita**, your Webflow & front-end code specialist. My purpose is strictly dedicated to clean CSS, responsive layout development, and Webflow implementation.\n\nI do not respond to destructive or aggressive commands. Let's redirect our session to practical web development—do you need help troubleshooting CSS Grid, Flexbox, or responsive clamping?`,
        followups: ['💻 Show CSS clamp() formula', '⚡ CSS Grid vs Flexbox', '🎯 Quiz me on CSS units']
      };
    }
    return {
      text: `As your **Concept & Retention Coach**, my role is to cultivate critical thinking, design empathy, and user-centered problem solving.\n\nDestructive prompts do not advance understanding. Let's redirect our inquiry: when you design an application, how do you ensure the interface protects and empowers the user rather than creating frustration?`,
      followups: ['🤔 Why does mobile priority matter?', '🎯 Challenge me with a UX puzzle', '💡 3 golden rules of mobile UX']
    };
  }

  // -------------------------------------------------------------------------
  // 2. Greetings & Salutations ("hi", "hello", "hey", "good morning", "sup")
  // -------------------------------------------------------------------------
  if (/^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening)|sup|howdy)[\s!.]*$/i.test(lower)) {
    if (personaKey === 'alex') {
      const alexGreetings = [
        `Hello! I'm **Alex**, your Principal Design System Architect. Ready to audit spacing tokens, review Figma auto-layout frames, or design responsive typography scales? What are we building today?`,
        `Welcome back! Alex here. Today we can dive into component architecture, 8pt spacing tokens, or translating 1440px desktop wireframes to mobile. Where would you like to start?`,
        `Greetings! As your design system mentor, I'm here to ensure your UI is visually harmonious, accessible, and responsive. What design question is on your mind?`
      ];
      return {
        text: alexGreetings[varIdx % alexGreetings.length],
        followups: ['💡 Show Figma Auto-Layout demo', '📐 How to use 8pt spacing tokens', '🎯 Quiz me on UI design']
      };
    }
    if (personaKey === 'kavita') {
      const kavitaGreetings = [
        `Hi there! I'm **Kavita**, your Webflow and front-end CSS specialist. Whether you're debugging 100vw horizontal overflow, converting Figma frames to CSS Grid, or setting up Client-First classes, I'm here to help.`,
        `Hello! Kavita here, ready to inspect your code. Need help with fluid \`clamp()\` typography, CSS Flexbox alignment, or responsive breakpoint behavior? Let's build!`,
        `Hey! Great to see you in the studio. What front-end or Webflow challenge are we tackling today? Ask me any CSS question or request a code snippet!`
      ];
      return {
        text: kavitaGreetings[varIdx % kavitaGreetings.length],
        followups: ['💻 Show CSS clamp() formula', '⚡ CSS Grid vs Flexbox', '🎯 Quiz me on rem vs px']
      };
    }
    const socratesGreetings = [
      `Greetings. I am **Socrates**, your conceptual thinking coach. Tell me: when you begin designing a responsive interface, do you design for the largest monitor first, or the smallest smartphone screen? And why?`,
      `Hello! Socrates here. In digital design, every constraint is an opportunity to clarify user intent. What core concept in your curriculum would you like to test today?`,
      `Welcome. I'm here to test and deepen your understanding of responsive design reasoning. Are you ready for a conceptual challenge or would you like to dissect a design principle?`
    ];
    return {
      text: socratesGreetings[varIdx % socratesGreetings.length],
      followups: ['🤔 Why does mobile priority differ?', '🎯 Challenge me with a concept quiz', '🧩 Purpose of design tokens']
    };
  }

  // -------------------------------------------------------------------------
  // 3. Gratitude & Affirmations ("thanks", "thank you", "cool", "great", "ok")
  // -------------------------------------------------------------------------
  if (/^(thanks|thank\s+you|thx|awesome|cool|great|nice|perfect|got\s+it|ok|okay)[\s!.]*$/i.test(lower)) {
    const praises = [
      `You're very welcome! Keep up the great momentum. What aspect of the curriculum should we explore next?`,
      `Glad that helped clarify things! Feel free to throw another question at me, or try one of our interactive quizzes to test your mastery.`,
      `Anytime! Continuous iteration is the secret to mastering digital design and code. What's our next topic?`
    ];
    return {
      text: praises[varIdx % praises.length],
      followups: ['🎯 Give me an interactive quiz', '📱 Explain mobile breakpoints', '💡 Show next best practice']
    };
  }

  // -------------------------------------------------------------------------
  // 4. Identity, Purpose, Rules & Limitations Inquiries
  // -------------------------------------------------------------------------
  if (lower.includes('who are you') || lower.includes('your role') || lower.includes('your purpose') || lower.includes('limitation') || lower.includes('your rules')) {
    const rules = AI_AGENT_RULES[personaKey] || AI_AGENT_RULES.alex;
    return {
      text: `### My Identity & Rules of Operation\n\nI am **${rules.name}**, your **${rules.role}** at Blendify LMS.\n\n**Core Purpose:**\n${rules.purpose}\n\n**My Strict Scope Limitations & Guardrails:**\n${rules.limitations.map(l => `- ${l}`).join('\n')}\n\nI operate within these exact boundaries to provide focused, high-caliber mentorship without conflicting with other specialist agents!`,
      followups: ['💡 What can you teach me today?', '🎯 Test me on your specialty', 'Switch to another agent']
    };
  }

  // -------------------------------------------------------------------------
  // 5. Out-of-Scope Topics (Redirect based on Persona Rules)
  // -------------------------------------------------------------------------
  if (lower.includes('president') || lower.includes('weather') || lower.includes('pizza') || lower.includes('recipe') || lower.includes('crypto') || lower.includes('bitcoin') || lower.includes('politics')) {
    return {
      text: `That topic is outside my domain. As your **${AI_PERSONAS[personaKey].role}**, my rules strictly limit my answers to web design, UI architecture, Webflow, and front-end engineering.\n\nLet's keep our session focused on your curriculum. Would you like to explore responsive layouts, typography scales, or test your skills with a quiz?`,
      followups: ['🎯 Give me a quick quiz', '💡 Show responsive layout rules', '📐 Explain spacing tokens']
    };
  }

  // -------------------------------------------------------------------------
  // 6. Interactive Quiz & Challenges
  // -------------------------------------------------------------------------
  if (lower.includes('quiz') || lower.includes('test me') || lower.includes('challenge') || lower.includes('exercise')) {
    if (personaKey === 'kavita') {
      const kavitaQuizzes = [
        {
          question: "Why is using `rem` for typography considered superior for web accessibility compared to `px`?",
          options: [
            { text: "A) rem loads faster because it bypasses CSS calculation engines.", isCorrect: false },
            { text: "B) rem respects the user's browser font-size settings and OS zoom preferences.", isCorrect: true },
            { text: "C) rem automatically centers headings inside flexbox rows.", isCorrect: false },
            { text: "D) rem requires zero CSS declarations in Webflow.", isCorrect: false }
          ],
          explanation: "Correct! `rem` is relative to the root font size. When visually impaired users increase default text size in browser settings, rem units scale proportionally."
        },
        {
          question: "What CSS property prevents horizontal scrollbars caused by 100vw full-bleed hero sections?",
          options: [
            { text: "A) overflow-x: clip; on the main page wrapper or html root.", isCorrect: true },
            { text: "B) display: inline-block; on every div container.", isCorrect: false },
            { text: "C) position: absolute; with z-index: -1.", isCorrect: false },
            { text: "D) margin: auto; on the body element.", isCorrect: false }
          ],
          explanation: "Spot on! `overflow-x: clip` or `overflow-x: hidden` prevents browser scrollbars from ballooning when viewport-width calculations include scrollbar gutters."
        }
      ];
      const q = kavitaQuizzes[varIdx % kavitaQuizzes.length];
      return {
        text: `Here is a front-end code challenge:`,
        quiz: q,
        followups: ['💡 Show rem calculation formula', '📐 Explain rem vs em', 'Ask another quiz question']
      };
    }

    if (personaKey === 'alex') {
      const alexQuizzes = [
        {
          question: "In Figma Auto-Layout, when should you set a card's width to 'Fill container' instead of 'Hug contents'?",
          options: [
            { text: "A) When you want the card to stay locked to a fixed 300px width.", isCorrect: false },
            { text: "B) When the card must stretch fluidly to take up 100% of its parent frame's width.", isCorrect: true },
            { text: "C) Only when exporting the card as an SVG icon.", isCorrect: false },
            { text: "D) When wrapping text tags in a pill badge.", isCorrect: false }
          ],
          explanation: "Spot on! 'Fill container' behaves like `width: 100%` in CSS, making elements fluidly expand to take up all available parent space."
        },
        {
          question: "According to WCAG 2.1 AA standards, what is the minimum required color contrast ratio for normal body text?",
          options: [
            { text: "A) 2.5:1 ratio", isCorrect: false },
            { text: "B) 3:1 ratio", isCorrect: false },
            { text: "C) 4.5:1 ratio", isCorrect: true },
            { text: "D) 7:1 ratio", isCorrect: false }
          ],
          explanation: "Exactly! WCAG 2.1 Level AA requires a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text (18pt or 14pt bold)."
        }
      ];
      const q = alexQuizzes[varIdx % alexQuizzes.length];
      return {
        text: `Let's test your design system understanding:`,
        quiz: q,
        followups: ['💡 Practical Auto-Layout card demo', '📱 Transitioning to 768px tablet layout', 'Ask another quiz question']
      };
    }

    return {
      text: `Consider this conceptual design problem:`,
      quiz: {
        question: "When designing mobile-first, why is content hierarchy more critical than visual ornamentation?",
        options: [
          { text: "A) Mobile devices cannot display gradient colors.", isCorrect: false },
          { text: "B) Limited screen estate demands immediate clarity on the primary user action.", isCorrect: true },
          { text: "C) Search engines penalize any page that contains rounded corners.", isCorrect: false }
        ],
        explanation: "Exactly. On mobile, attention span and viewport area are compressed. Every pixel must serve the user's primary intent."
      },
      followups: ['🤔 How to decide what to hide on mobile?', '💡 Show 3 golden rules of mobile UX']
    };
  }

  // -------------------------------------------------------------------------
  // 7. Figma Auto-Layout & UI Wireframing
  // -------------------------------------------------------------------------
  if (lower.includes('hug') || lower.includes('fill') || lower.includes('auto-layout') || lower.includes('autolayout') || lower.includes('figma')) {
    if (personaKey === 'kavita') {
      return {
        text: `### Translating Figma Auto-Layout to Clean CSS\n\nWhen developers receive Figma auto-layout designs, here is how each sizing mode maps directly to CSS:\n\n- **Hug Contents** ➔ \`width: fit-content;\` or default inline-flex wrapping. Ideal for buttons, badge pills, and chips.\n- **Fill Container** ➔ \`width: 100%;\` or \`flex: 1 1 0%;\`. Ensures cards and body text stretch fluidly.\n- **Fixed Dimension** ➔ \`width: 48px; height: 48px;\` (locked pixel avatars, icon badges).\n\n\`\`\`css\n/* Typical Auto-Layout Card in CSS */\n.course-card {\n  display: flex;\n  flex-direction: column;\n  gap: 16px;            /* Auto-layout item spacing */\n  padding: 24px;        /* Auto-layout padding */\n  width: 100%;          /* Fill container */\n}\n\`\`\``,
        followups: ['💻 Show CSS clamp() formula for cards', '⚡ CSS Grid vs Flexbox', '🎯 Quiz me on Auto-Layout to CSS']
      };
    }
    return {
      text: `### Figma Auto-Layout Architecture: Hug vs Fill vs Fixed\n\nIn modern design systems, framing your elements with Auto-Layout eliminates hours of manual resizing:\n\n1. **Hug Contents**: The frame shrinks tightly to fit its inner children plus padding. Use this for:\n   - Button components with dynamic label lengths\n   - Tag pills and category badges\n2. **Fill Container**: The child frame expands to consume **100% of the parent frame's width or height**. Use this for:\n   - Responsive card bodies\n   - Full-width hero text containers\n3. **Fixed Width / Height**: The element retains an immutable pixel dimension. Use strictly for:\n   - Avatar icons (\`40px × 40px\`)\n   - Fixed icon action triggers\n\n**Golden Rule**: Never nest a 'Fixed' card inside a 'Hug' parent if you intend for the frame to adapt to tablet breakpoints!`,
      followups: ['📱 How to scale auto-layout to 768px tablet', '📐 How to use 8pt spacing tokens', '🎯 Quiz me on Auto-Layout']
    };
  }

  // -------------------------------------------------------------------------
  // 8. Responsive Breakpoints (1440px -> 768px -> 375px)
  // -------------------------------------------------------------------------
  if (lower.includes('breakpoint') || lower.includes('tablet') || lower.includes('mobile') || lower.includes('1440') || lower.includes('768') || lower.includes('375')) {
    return {
      text: `### The 3 Golden Breakpoint Rules for Responsive Design\n\n1. **1440px (Desktop)**:\n   - Multi-column grids (\`grid-template-columns: repeat(3, 1fr)\` or \`repeat(4, 1fr)\`).\n   - Outer gutters of \`40px–64px\`.\n   - Display persistent horizontal navigation with search inputs.\n2. **768px (Tablet)**:\n   - Collapse multi-columns to **2 columns**.\n   - Reduce outer padding to \`24px\`.\n   - Scale headings down by approximately ~15%–20%.\n3. **375px (Mobile Smartphone)**:\n   - Single-column stacked flow (\`flex-direction: column\`).\n   - 16px side margins to maximize readable space.\n   - Move secondary links into an off-canvas drawer.\n   - Maintain minimum touch targets of **44px × 44px**.\n\n\`\`\`css\n@media (max-width: 768px) {\n  .grid-catalog { grid-template-columns: 1fr; }\n  .hero-title { font-size: 1.85rem; }\n}\n\`\`\``,
      followups: ['💡 What is fluid typography clamping?', '🎯 Quiz me on responsive breakpoints', '📱 Best practices for mobile navigation']
    };
  }

  // -------------------------------------------------------------------------
  // 9. Fluid Typography & Sizing with clamp() and rem
  // -------------------------------------------------------------------------
  if (lower.includes('clamp') || lower.includes('rem') || lower.includes('fluid') || lower.includes('font-size') || lower.includes('unit')) {
    return {
      text: `### Modern CSS Fluid Sizing with \`clamp()\`\n\nInstead of writing dozens of fragile media queries, use CSS \`clamp(min, preferred, max)\` to smoothly interpolate typography between mobile (\`375px\`) and desktop (\`1440px\`):\n\n\`\`\`css\n/* Fluid Hero Title: min 28px (1.75rem), scales with viewport, max 48px (3rem) */\nh1.hero-title {\n  font-size: clamp(1.75rem, 4vw + 1rem, 3rem);\n  line-height: 1.2;\n}\n\n/* Fluid Section Padding: min 24px, scales smoothly, max 64px */\n.section-container {\n  padding: clamp(1.5rem, 3vw + 0.5rem, 4rem) 20px;\n}\n\`\`\`\n\n**Why this matters**: On a phone (\`375px\`), the title never drops below 28px; on an ultra-wide monitor, it never balloons uncontrollably!`,
      followups: ['💡 How do I calculate clamp values in Webflow?', '🎯 Quiz me on CSS units', '⚡ Why rem is better than px']
    };
  }

  // -------------------------------------------------------------------------
  // 10. CSS Grid vs Flexbox
  // -------------------------------------------------------------------------
  if (lower.includes('grid') || lower.includes('flexbox') || lower.includes('flex')) {
    return {
      text: `### CSS Grid vs Flexbox: When to Use Which\n\n- **CSS Flexbox (1-Dimensional)**:\n  * Use when arranging items in a **single direction** (row OR column).\n  * Ideal for: Navigation bars, button groups, avatar pills, tags, and vertically centering.\n- **CSS Grid (2-Dimensional)**:\n  * Use when aligning items across **both rows and columns simultaneously**.\n  * Ideal for: Course catalogs, photo galleries, dashboard widget layouts, and overall page templates.\n\n\`\`\`css\n/* Responsive Auto-Fitting Grid without any Media Queries */\n.materials-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));\n  gap: 24px;\n}\n\`\`\``,
      followups: ['💡 Show auto-fit vs auto-fill differences', '🎯 Quiz me on Grid vs Flexbox', '📱 How to collapse a grid on mobile']
    };
  }

  // -------------------------------------------------------------------------
  // 11. Spacing Tokens & 8pt Grid System
  // -------------------------------------------------------------------------
  if (lower.includes('spacing') || lower.includes('token') || lower.includes('8pt') || lower.includes('padding') || lower.includes('margin') || lower.includes('gap')) {
    return {
      text: `### The 8pt Spacing Token Standard\n\nUsing an 8-point spatial system creates visual rhythm and removes arbitrary guessing for designers and developers:\n\n- **\`--space-xs\` (4px)**: Tight internal padding, badge borders, icon offsets.\n- **\`--space-sm\` (8px)**: Gap between text and subtext, small chips.\n- **\`--space-md\` (16px)**: Standard card padding, input field padding.\n- **\`--space-lg\` (24px)**: Outer card borders, grid gaps between sections.\n- **\`--space-xl\` (32px)**: Header separation, modal spacing.\n- **\`--space-2xl\` (48px–64px)**: Section hero banners, desktop viewport margins.\n\n\`\`\`css\n:root {\n  --space-1: 4px;\n  --space-2: 8px;\n  --space-3: 16px;\n  --space-4: 24px;\n  --space-5: 32px;\n  --space-6: 48px;\n}\n\`\`\``,
      followups: ['📐 How to apply spacing tokens in Figma', '📱 Spacing rules on 375px mobile', '🎯 Quiz me on Design Tokens']
    };
  }

  // -------------------------------------------------------------------------
  // 12. SQLite Database & Relational System in Blendify
  // -------------------------------------------------------------------------
  if (lower.includes('sqlite') || lower.includes('database') || lower.includes('sql') || lower.includes('api') || lower.includes('table')) {
    return {
      text: `### Blendify Relational Architecture (SQLite WebAssembly)\n\nBlendify runs a complete, client-side relational database using WebAssembly (\`sql.js\`). Key tables include:\n\n1. **\`users\`**: Student and Teacher accounts, emails, roles, timestamps.\n2. **\`classroom_portals\`**: Cohort rooms, unique join tags (\`#PORTAL-FIGMA-101\`), member counts.\n3. **\`learning_materials\`**: Uploaded community guides, file formats (PDF, FIGMA), download metrics.\n4. **\`quizzes\`**: Interactive course assessments generated in Teacher Studio.\n5. **\`student_activities\`**: Audit log of downloads and submissions.\n\nPress \`Ctrl + Shift + D\` or use the profile menu to open the **Database & API Explorer** to query tables with raw SQL!`,
      followups: ['💡 Show sample SQL query for top downloads', '📊 How WebAssembly persists data', '🎯 Quiz me on SQL']
    };
  }

  // -------------------------------------------------------------------------
  // 13. General Developer & Version Control Inquiries (GitHub, Git, Repositories)
  // -------------------------------------------------------------------------
  if (lower.includes('github') || lower.includes('git ') || lower === 'git' || lower.includes('version control') || lower.includes('repository') || lower.includes('repo')) {
    return {
      text: `### What is GitHub?\n\n**GitHub** is a cloud-based hosting platform for software development and version control using **Git**:\n\n1. **Version Control (Git)**: Tracks every commit, branch, and change across the project so you can experiment freely and roll back bugs safely.\n2. **Collaboration**: Enables teams to collaborate via Pull Requests (PRs), code reviews, and issue tracking.\n3. **Continuous Deployment (CI/CD)**: With GitHub Actions and GitHub Pages, projects (like Blendify LMS) can build and deploy automatically on every push.\n\nIn modern web workflows, design tokens, responsive CSS classes, and UI components are versioned in Git so designers and engineers remain aligned!`,
      followups: ['💻 How do design tokens connect to Git?', '⚡ CSS Grid vs Flexbox', '🎯 Quiz me on web fundamentals']
    };
  }

  // -------------------------------------------------------------------------
  // 14. Dynamic Contextual Fallback (Non-repeating, tailored to user query)
  // -------------------------------------------------------------------------
  const userWords = text.replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2);
  const subjectHint = userWords.length > 0 ? userWords.slice(0, 3).join(' ') : 'your inquiry';

  if (personaKey === 'alex') {
    const alexVariations = [
      `Regarding **"${subjectHint}"**: In design system architecture, we always examine how this element impacts visual balance and spatial tokens. Consistent visual hierarchy ensures students don't experience cognitive fatigue when navigating dense learning materials.\n\nWould you like to explore how to frame this inside Figma Auto-Layout, or how to translate it into a reusable design token?`,
      `Great inquiry regarding **"${subjectHint}"**. When architecting UI components for Blendify, we anchor our decisions to the 8pt grid and WCAG 4.5:1 contrast standards. Ensuring that elements scale smoothly across 1440px desktop down to 375px mobile prevents layout regressions.\n\nShall we inspect responsive breakpoint behavior or test token variables?`,
      `Looking at **"${subjectHint}"** from a design perspective: every interface component should have clear active, hover, and focus states with purposeful spacing tokens. What specific constraint or viewport size are you currently optimizing for?`
    ];
    return {
      text: alexVariations[varIdx % alexVariations.length],
      followups: ['💡 Explain Hug vs Fill in Figma', '📐 How to use 8pt spacing tokens', '🎯 Quiz me on UI design']
    };
  }

  if (personaKey === 'kavita') {
    const kavitaVariations = [
      `Analyzing **"${subjectHint}"** from a front-end perspective: keeping your CSS classes modular (like Client-First conventions) and avoiding fixed pixel widths prevents layout breakage across varying screen widths.\n\nAre you looking to implement this in Webflow or write custom CSS Grid/Flexbox code for it?`,
      `On **"${subjectHint}"**: When translating design wireframes into code, always favor relative units (\`rem\`, \`clamp()\`, \`%\`) over hardcoded pixel dimensions. This ensures accessibility compliance for users who adjust browser font sizes.\n\nWould you like a sample CSS snippet or a Webflow implementation guide?`,
      `Regarding **"${subjectHint}"**: One common trap is using \`100vw\` which can cause unwanted horizontal scrollbars. Using clean container wrappers with \`width: 100%; max-width: 1280px; margin: 0 auto;\` keeps your layout rock-solid across all viewports.`
    ];
    return {
      text: kavitaVariations[varIdx % kavitaVariations.length],
      followups: ['💻 Show CSS clamp() formula', '⚡ CSS Grid vs Flexbox', '🎯 Quiz me on Webflow CSS']
    };
  }

  const socratesVariations = [
    `Consider **"${subjectHint}"** from first principles: When you design an interface, whose mental model are you optimizing for—the developer who built the database, or the first-time student exploring the portal on a smartphone?\n\nHow does this principle guide the primary action you want the user to take on this screen?`,
    `A thought-provoking question on **"${subjectHint}"**. In digital learning environments, simplicity is not the lack of clutter; it is the presence of clear intent. What is the single most essential piece of information a user needs when encountering this?`,
    `Reflecting on **"${subjectHint}"**: Every screen transition and responsive breakpoint forces a trade-off between information density and visual clarity. If you had to remove 40% of the elements on the mobile viewport, what would you keep?`
  ];
  return {
    text: socratesVariations[varIdx % socratesVariations.length],
    followups: ['🤔 How to prioritize user attention', '🎯 Challenge me with a concept puzzle', '📱 Mobile UX trade-offs']
  };
}

/**
 * Master AI Response Dispatcher (OpenAI API first, graceful local fallback with explicit notice)
 */
export async function getAIResponse(userText, personaKey) {
  try {
    const liveResponse = await callOpenAIApi(userText, personaKey);
    updateApiBadgeStatus(true, 'OpenAI Live (gpt-4o-mini)');
    return liveResponse;
  } catch (error) {
    const isQuota = error.code === 'credit_balance_exhausted' || error.status === 429;
    const badgeLabel = isQuota ? '⚠️ API Quota Exhausted' : 'Local Intelligence (Active)';
    console.warn(`[Blendify AI] Notice: ${error.message}. Serving local fallback.`);
    updateApiBadgeStatus(false, badgeLabel, isQuota ? 'quota' : 'local');

    const fallbackResponse = getLocalAIResponse(userText, personaKey);

    const noticeText = isQuota
      ? `> ⚠️ **OpenAI Live Notice (HTTP 429 — 0 Credits Remaining):** The configured OpenAI API key has exhausted its credit quota. Add balance at [platform.openai.com](https://platform.openai.com/settings/organization/billing) or click **API Settings** (badge above) to enter your own funded key.\n\n*Answering via Local Assistant (${AI_PERSONAS[personaKey]?.name || 'Alex'}):*\n\n`
      : `> ⚠️ **OpenAI Live Notice (${error.message}):** Unable to reach live LLM. Answering via Local Assistant (${AI_PERSONAS[personaKey]?.name || 'Alex'}). Click **API Settings** to configure your OpenAI key.\n\n`;

    return {
      text: noticeText + fallbackResponse.text,
      source: 'local',
      quiz: fallbackResponse.quiz,
      followups: fallbackResponse.followups
    };
  }
}

/**
 * Helper to update header API badge
 */
function updateApiBadgeStatus(isLive, labelText, statusType = 'quota') {
  const badge = document.getElementById('btnAiApiSettings');
  const badgeText = document.getElementById('aiBadgeText');
  if (badgeText) badgeText.textContent = labelText;
  if (badge) {
    badge.classList.remove('quota-exhausted', 'local-mode');
    if (!isLive) {
      if (statusType === 'quota') {
        badge.classList.add('quota-exhausted');
      } else {
        badge.classList.add('local-mode');
      }
    }
  }
}

/**
 * Initialize Interactive AI Learning Agent
 */
export function initAILearningAgent(state, showToast) {
  const aiChatHistory = document.getElementById('aiChatHistory');
  const aiMessageInput = document.getElementById('aiMessageInput');
  const btnSendAIMessage = document.getElementById('btnSendAIMessage');
  const btnClearAIChat = document.getElementById('btnClearAIChat');
  const aiStatusText = document.getElementById('aiStatusText');
  const personaChips = document.querySelectorAll('.persona-chip');
  const personaAvatar = document.getElementById('personaAvatar');
  const personaName = document.getElementById('personaName');
  const personaRole = document.getElementById('personaRole');
  const personaBio = document.getElementById('personaBio');
  const aiRulesPurposeText = document.getElementById('aiRulesPurposeText');
  const aiRulesList = document.getElementById('aiRulesList');

  // Modal elements
  const btnAiApiSettings = document.getElementById('btnAiApiSettings');
  const aiApiKeyModal = document.getElementById('aiApiKeyModal');
  const modalCloseAiKey = document.getElementById('modalCloseAiKey');
  const inputOpenAiKey = document.getElementById('inputOpenAiKey');
  const btnSaveOpenAiKey = document.getElementById('btnSaveOpenAiKey');
  const btnTestOpenAiKey = document.getElementById('btnTestOpenAiKey');
  const aiKeyStatusNotice = document.getElementById('aiKeyStatusNotice');

  let isGenerating = false;

  // Setup API Key Modal triggers
  function openKeyModal() {
    if (aiApiKeyModal) {
      aiApiKeyModal.classList.add('open');
      if (inputOpenAiKey) inputOpenAiKey.value = getOpenAIApiKey();
      testCurrentKeyNotice();
    }
  }

  function closeKeyModal() {
    if (aiApiKeyModal) aiApiKeyModal.classList.remove('open');
  }

  async function testCurrentKeyNotice() {
    if (!aiKeyStatusNotice) return;
    aiKeyStatusNotice.innerHTML = `<em>Checking OpenAI API Key connection...</em>`;
    const key = inputOpenAiKey ? inputOpenAiKey.value.trim() : getOpenAIApiKey();
    if (!key) {
      aiKeyStatusNotice.innerHTML = `<span style="color:#ef4444;">⚠️ No API key set. The app uses the dynamic local intelligence engine.</span>`;
      return;
    }
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 5
        })
      });

      if (res.ok) {
        aiKeyStatusNotice.innerHTML = `<span style="color:#10b981; font-weight:600;">✅ OpenAI API Connected!</span> Active credits available on <code>gpt-4o-mini</code>.`;
        updateApiBadgeStatus(true, 'OpenAI Live');
      } else {
        const errJson = await res.json().catch(() => ({}));
        if (res.status === 429 || errJson?.error?.code === 'credit_balance_exhausted') {
          aiKeyStatusNotice.innerHTML = `<span style="color:#f59e0b; font-weight:600;">⚠️ Quota Notice (HTTP 429):</span> Your key is valid, but has <strong>0 credits remaining</strong>.<br/><small style="color:var(--text-muted)">Add credits at <a href="https://platform.openai.com/settings/organization/billing" target="_blank" style="color:var(--primary); text-decoration:underline;">platform.openai.com</a>. Meanwhile, our smart non-repeating local engine handles queries seamlessly.</small>`;
          updateApiBadgeStatus(false, '⚠️ API Quota Exhausted');
        } else {
          aiKeyStatusNotice.innerHTML = `<span style="color:#ef4444;">❌ API Error (${res.status}):</span> ${errJson?.error?.message || 'Check key validity'}`;
          updateApiBadgeStatus(false, 'Local Intelligence (Active)');
        }
      }
    } catch (e) {
      aiKeyStatusNotice.innerHTML = `<span style="color:#ef4444;">❌ Network Error:</span> ${e.message}`;
    }
  }

  btnAiApiSettings?.addEventListener('click', openKeyModal);
  modalCloseAiKey?.addEventListener('click', closeKeyModal);

  btnSaveOpenAiKey?.addEventListener('click', () => {
    const newKey = inputOpenAiKey?.value.trim();
    if (newKey) {
      setOpenAIApiKey(newKey);
      showToast('OpenAI API Key saved locally!');
      testCurrentKeyNotice();
      setTimeout(closeKeyModal, 800);
    } else {
      setOpenAIApiKey(null);
      showToast('Reverted to default key.');
      testCurrentKeyNotice();
    }
  });

  btnTestOpenAiKey?.addEventListener('click', testCurrentKeyNotice);

  // Render chat message bubble with rich formatting
  function appendMessageRow(sender, contentObj) {
    if (!aiChatHistory) return null;
    const row = document.createElement('div');
    row.className = `ai-msg-row ${sender === 'user' ? 'user' : 'ai-agent'}`;

    const textHtml = typeof contentObj === 'string' ? formatAIMarkdown(contentObj) : formatAIMarkdown(contentObj.text || '');

    row.innerHTML = `
      ${sender === 'agent' ? `<div class="agent-avatar-sm">${AI_PERSONAS[state.activePersona]?.avatar || 'AI'}</div>` : ''}
      <div class="ai-bubble">
        <div class="ai-text-body">${textHtml}</div>
        ${contentObj.quiz ? renderQuizHtml(contentObj.quiz) : ''}
        ${contentObj.followups ? renderFollowupChipsHtml(contentObj.followups) : ''}
      </div>
    `;

    aiChatHistory.appendChild(row);
    aiChatHistory.scrollTop = aiChatHistory.scrollHeight;

    // Attach copy code buttons
    row.querySelectorAll('.btn-copy-code').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = decodeURIComponent(btn.dataset.code);
        navigator.clipboard.writeText(code);
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy Code', 2000);
      });
    });

    // Attach quiz answer clicks
    row.querySelectorAll('.ai-quiz-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const isCorrect = btn.dataset.correct === 'true';
        const quizBox = btn.closest('.ai-quiz-card');
        const verdictEl = quizBox.querySelector('.ai-quiz-verdict');

        quizBox.querySelectorAll('.ai-quiz-btn').forEach(b => {
          b.disabled = true;
          if (b.dataset.correct === 'true') {
            b.classList.add('correct');
          } else {
            b.classList.add('incorrect');
          }
        });

        if (isCorrect) {
          verdictEl.innerHTML = `<span style="color:#10b981;">🎉 Correct!</span> ${quizBox.dataset.explanation || ''}`;
          showToast('Great job! That answer is correct.');
        } else {
          verdictEl.innerHTML = `<span style="color:#ef4444;">❌ Not quite.</span> ${quizBox.dataset.explanation || ''}`;
        }
      });
    });

    // Attach follow-up chip clicks
    row.querySelectorAll('.ai-followup-btn').forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.dataset.prompt;
        sendAIMessage(prompt);
      });
    });

    return row;
  }

  function renderQuizHtml(quiz) {
    return `
      <div class="ai-quiz-card" data-explanation="${quiz.explanation.replace(/"/g, '&quot;')}">
        <div class="ai-quiz-q-title">🎯 ${quiz.question}</div>
        <div class="ai-quiz-options-list">
          ${quiz.options.map(opt => `
            <button type="button" class="ai-quiz-btn" data-correct="${opt.isCorrect}">
              ${opt.text}
            </button>
          `).join('')}
        </div>
        <div class="ai-quiz-verdict"></div>
      </div>
    `;
  }

  function renderFollowupChipsHtml(followups) {
    return `
      <div class="ai-followup-chips">
        ${followups.map(chipText => `
          <button type="button" class="ai-followup-btn" data-prompt="${chipText.replace(/"/g, '&quot;')}">
            <span>${chipText}</span>
          </button>
        `).join('')}
      </div>
    `;
  }

  // Stream text animation
  async function streamAIResponse(responseObj) {
    const text = responseObj.text;
    const currentP = AI_PERSONAS[state.activePersona] || AI_PERSONAS.alex;

    // Create placeholder agent message row with typing dots
    const row = document.createElement('div');
    row.className = 'ai-msg-row ai-agent';
    row.innerHTML = `
      <div class="agent-avatar-sm">${currentP.avatar}</div>
      <div class="ai-bubble">
        <div class="ai-typing-indicator">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      </div>
    `;
    aiChatHistory.appendChild(row);
    aiChatHistory.scrollTop = aiChatHistory.scrollHeight;

    if (aiStatusText) aiStatusText.textContent = `${currentP.name} is formulating response...`;

    // Natural processing delay
    await new Promise(r => setTimeout(r, 280));

    const bubble = row.querySelector('.ai-bubble');
    bubble.innerHTML = `<div class="ai-text-body"></div>`;
    const textBody = bubble.querySelector('.ai-text-body');

    // Fast word-by-word streaming effect
    const words = text.split(' ');
    let currentText = '';

    for (let i = 0; i < words.length; i++) {
      currentText += (i === 0 ? '' : ' ') + words[i];
      textBody.innerHTML = formatAIMarkdown(currentText);
      aiChatHistory.scrollTop = aiChatHistory.scrollHeight;
      await new Promise(r => setTimeout(r, 10));
    }

    // Append quiz if present
    if (responseObj.quiz) {
      const quizWrap = document.createElement('div');
      quizWrap.innerHTML = renderQuizHtml(responseObj.quiz);
      bubble.appendChild(quizWrap.firstElementChild);

      // Wire quiz buttons
      bubble.querySelectorAll('.ai-quiz-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const isCorrect = btn.dataset.correct === 'true';
          const quizBox = btn.closest('.ai-quiz-card');
          const verdictEl = quizBox.querySelector('.ai-quiz-verdict');

          quizBox.querySelectorAll('.ai-quiz-btn').forEach(b => {
            b.disabled = true;
            if (b.dataset.correct === 'true') {
              b.classList.add('correct');
            } else {
              b.classList.add('incorrect');
            }
          });

          if (isCorrect) {
            verdictEl.innerHTML = `<span style="color:#10b981;">🎉 Correct!</span> ${quizBox.dataset.explanation || ''}`;
            showToast('Great job! That answer is correct.');
          } else {
            verdictEl.innerHTML = `<span style="color:#ef4444;">❌ Not quite.</span> ${quizBox.dataset.explanation || ''}`;
          }
        });
      });
    }

    // Append follow-up chips if present
    if (responseObj.followups) {
      const chipsWrap = document.createElement('div');
      chipsWrap.innerHTML = renderFollowupChipsHtml(responseObj.followups);
      bubble.appendChild(chipsWrap.firstElementChild);

      bubble.querySelectorAll('.ai-followup-btn').forEach(chip => {
        chip.addEventListener('click', () => {
          const prompt = chip.dataset.prompt;
          sendAIMessage(prompt);
        });
      });
    }

    // Attach copy code buttons
    bubble.querySelectorAll('.btn-copy-code').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = decodeURIComponent(btn.dataset.code);
        if (navigator.clipboard) {
          navigator.clipboard.writeText(code);
          btn.textContent = 'Copied!';
          setTimeout(() => btn.textContent = 'Copy Code', 2000);
        }
      });
    });

    if (aiStatusText) aiStatusText.textContent = currentP.status;
    isGenerating = false;
  }

  async function sendAIMessage(overrideText = null) {
    if (isGenerating) return;
    const text = overrideText || (aiMessageInput ? aiMessageInput.value.trim() : '');
    if (!text) return;

    isGenerating = true;

    // 1. Add user message
    appendMessageRow('user', text);
    if (!overrideText && aiMessageInput) aiMessageInput.value = '';

    // 2. Generate response via OpenAI / local engine and stream
    try {
      const responseObj = await getAIResponse(text, state.activePersona);
      await streamAIResponse(responseObj);
    } catch (e) {
      console.error('[AI Error]', e);
      await streamAIResponse({
        text: `I encountered an unexpected issue processing that question. Please try asking again or rephrase.`,
        followups: ['Try again', 'Ask a design question']
      });
    }
  }

  function updateRulesUI(personaKey) {
    const rules = AI_AGENT_RULES[personaKey] || AI_AGENT_RULES.alex;
    if (aiRulesPurposeText) {
      aiRulesPurposeText.textContent = rules.purpose;
    }
    if (aiRulesList) {
      aiRulesList.innerHTML = rules.limitations.map(lim => `<li>${lim}</li>`).join('');
    }
  }

  function switchPersona(personaKey) {
    state.activePersona = personaKey;
    const p = AI_PERSONAS[personaKey];
    if (!p) return;

    personaChips.forEach(chip => {
      chip.classList.toggle('active', chip.dataset.persona === personaKey);
    });

    if (personaAvatar) personaAvatar.innerHTML = p.avatar;
    if (personaName) personaName.textContent = p.name;
    if (personaRole) personaRole.textContent = p.role;
    if (personaBio) personaBio.textContent = p.bio;
    if (aiStatusText) aiStatusText.textContent = p.status;

    // Synchronize the Rules & Purpose Card
    updateRulesUI(personaKey);

    // Greet user with persona's unique welcome
    if (aiChatHistory) {
      aiChatHistory.innerHTML = '';
      appendMessageRow('agent', {
        text: `Hello! I'm **${p.name}**, your ${p.role}. How can I assist your learning today?`,
        followups: p.followups
      });
    }

    showToast(`Switched AI mentor to ${p.name}!`);
  }

  personaChips.forEach(chip => {
    chip.addEventListener('click', () => switchPersona(chip.dataset.persona));
  });

  btnSendAIMessage?.addEventListener('click', () => sendAIMessage());
  aiMessageInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAIMessage();
    }
  });

  btnClearAIChat?.addEventListener('click', () => {
    const p = AI_PERSONAS[state.activePersona] || AI_PERSONAS.alex;
    if (conversationHistories[state.activePersona]) {
      conversationHistories[state.activePersona] = [];
    }
    if (aiChatHistory) {
      aiChatHistory.innerHTML = '';
      appendMessageRow('agent', {
        text: `Conversation cleared. I'm **${p.name}**, ready to explore any curriculum question within my scope!`,
        followups: p.followups
      });
    }
    showToast('Conversation cleared.');
  });

  // Suggested prompt chips on the left sidebar
  document.querySelectorAll('.prompt-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.dataset.prompt;
      sendAIMessage(prompt);
    });
  });

  // Initial welcome greeting and Rules UI setup
  const initialP = AI_PERSONAS[state.activePersona] || AI_PERSONAS.alex;
  updateRulesUI(state.activePersona || 'alex');

  if (aiChatHistory) {
    aiChatHistory.innerHTML = '';
    appendMessageRow('agent', {
      text: `Hello! I'm **${initialP.name}**, your personalized AI mentor for **Blendify LMS**.\n\nI operate within defined architectural rules based on my specialty. Ask me to break down curriculum materials, review responsive Figma auto-layouts, demonstrate CSS clamp formulas, or test your comprehension with interactive quizzes!`,
      followups: initialP.followups
    });
  }

  // Check initial API Key status asynchronously on startup
  async function checkInitialApiKeyStatus() {
    const key = getOpenAIApiKey();
    if (!key) {
      updateApiBadgeStatus(false, 'Local Intelligence (Active)', 'local');
      return;
    }
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 5
        })
      });
      if (res.ok) {
        updateApiBadgeStatus(true, 'OpenAI Live (gpt-4o-mini)');
      } else {
        const errJson = await res.json().catch(() => ({}));
        if (res.status === 429 || errJson?.error?.code === 'credit_balance_exhausted') {
          updateApiBadgeStatus(false, '⚠️ API Quota Exhausted', 'quota');
        } else {
          updateApiBadgeStatus(false, 'Local Intelligence (Active)', 'local');
        }
      }
    } catch (e) {
      updateApiBadgeStatus(false, 'Local Intelligence (Active)', 'local');
    }
  }

  checkInitialApiKeyStatus();
}
