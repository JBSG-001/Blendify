/**
 * GEMINI API & BLIPP AI ASSISTANT SERVICE
 * Provides unified AI capabilities for Blendify LMS:
 * - Direct Gemini API integration (gemini-1.5-flash / gemini-2.0-flash / gemini-2.5-flash)
 * - Support for VITE_GEMINI_API_KEY environment variable & localStorage configuration
 * - System prompt unifying UI/UX design architecture, Webflow & CSS coding, and Socratic coaching
 * - Rich fallback educational knowledge engine when offline or no API key is set
 * - Safe markdown rendering for structured learning outputs (code blocks, bullet points, formatting)
 */

const STORAGE_KEY_API_KEY = 'blendify_gemini_api_key';
const STORAGE_KEY_MODEL = 'blendify_gemini_model';

export const DEFAULT_MODEL = 'gemini-1.5-flash';
export const AVAILABLE_MODELS = [
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Recommended - Fast & Lightweight)' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Next-Gen Speed & Intelligence)' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Latest Experimental)' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Deep Reasoning & Analysis)' }
];

/**
 * Retrieve the active Gemini API Key.
 * Checks localStorage first, then falls back to Vite env variables.
 */
export function getGeminiApiKey() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_API_KEY);
    if (stored && stored.trim()) return stored.trim();
  } catch (e) {
    // Ignore storage errors
  }
  return import.meta.env.VITE_GEMINI_API_KEY || '';
}

/**
 * Save Gemini API Key to localStorage.
 */
export function saveGeminiApiKey(key) {
  try {
    if (key && key.trim()) {
      localStorage.setItem(STORAGE_KEY_API_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_API_KEY);
    }
    return true;
  } catch (e) {
    console.error('Failed to save Gemini API key:', e);
    return false;
  }
}

/**
 * Get selected Gemini model.
 */
export function getGeminiModel() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_MODEL);
    if (stored && stored.trim()) return stored.trim();
  } catch (e) {}
  return DEFAULT_MODEL;
}

/**
 * Save selected Gemini model.
 */
export function saveGeminiModel(modelId) {
  try {
    localStorage.setItem(STORAGE_KEY_MODEL, modelId);
  } catch (e) {}
}

/**
 * Check if a Gemini API key is configured.
 */
export function hasGeminiApiKey() {
  return !!getGeminiApiKey();
}

/**
 * Unified System Prompt for Blipp
 */
export function getBlippSystemPrompt(focusArea = 'all') {
  const focusGuidance = {
    all: 'Provide a well-rounded response balancing visual UI intuition, clean frontend code, and conceptual clarity.',
    design: 'Focus deeply on visual hierarchy, Figma auto-layout (Hug vs Fill vs Fixed), typography scales, and token systems.',
    code: 'Focus deeply on Webflow visual CSS, Flexbox vs Grid, fluid rem units vs px, Client-First naming conventions, and clean frontend syntax.',
    concept: 'Focus on Socratic coaching, using vivid real-world analogies, conceptual breakdown, and thought-provoking questions.',
    quiz: 'Act as an engaging quizmaster. Test the user with 1-3 targeted multiple-choice or short-answer questions, and provide helpful feedback on their answers.'
  }[focusArea] || 'Provide a well-rounded educational response.';

  return `You are Blipp, the friendly, brilliant, and unified AI Learning Companion for Blendify LMS (an educational learning management platform).

Your Identity:
- Name: Blipp
- Role: Unified AI Learning Companion & Mentor
- Platform: Blendify LMS (students learn design, access educational materials, and collaborate in classroom workplaces via portal tags like #PORTAL-FIGMA-101)
- Personality: Enthusiastic, encouraging, concise, pedagogically sharp, and approachable. Always supportive and clear.

Your Merged Core Superpowers:
1. UI/UX & Design Systems: Expert in Figma Auto-Layout constraints (Hug, Fill, Fixed), responsive fluid adaptation (1440px desktop down to 768px tablet and 375px mobile), spacing tokens, visual hierarchy, and component architecture.
2. Webflow & Frontend Code: Expert in translating UI wireframes to responsive CSS Flexbox and Grid, rem units vs px, Client-First class conventions, and fluid container rules.
3. Socratic Coaching & Concept Retention: Expert in making complex web design concepts stick through memorable analogies, retention checks, and guided inquiry.
4. Blendify Navigation: Help users navigate classroom workplaces, search community educational materials, and track curriculum progress.

Active Focus Mode: ${focusArea.toUpperCase()} (${focusGuidance})

Formatting Instructions:
- Use clean Markdown: **bold** for key terms, \`code\` for tokens/CSS properties, bullet points for lists, and fenced \`\`\`language code blocks for multi-line snippets.
- Keep responses readable and concise (2-4 concise paragraphs or bulleted steps). Avoid overwhelming the learner with walls of raw text.
- If the user asks a question, give a clear answer followed by a quick practical tip or retention prompt.
- Warmly identify as Blipp when appropriate.`;
}

/**
 * Comprehensive built-in knowledge base for Blipp when offline or before API key is provided.
 */
export function generateLocalBlippResponse(userText, focusArea = 'all') {
  const lower = userText.toLowerCase();

  // Auto-layout / Hug vs Fill
  if (lower.includes('hug') || lower.includes('fill') || lower.includes('fixed') || lower.includes('auto-layout') || lower.includes('autolayout')) {
    return `### Auto-Layout in Figma & Webflow\n\nIn Figma Auto-Layout, think of **Hug** and **Fill** like this:\n\n- **Hug Contents**: Shrink-wraps the container tightly around its children. Use this for buttons, tag pills, and badges where the container should grow dynamically with text length.\n- **Fill Container**: Tells the child element to expand to **100%** of its parent's width. Essential for responsive text blocks, card bodies, and full-bleed image headers.\n- **Fixed**: Hardcodes an exact pixel dimension (e.g. \`48px\` avatar). Use sparingly in responsive design!\n\n**Webflow Translation:**\n\`Fill container\` translates directly to \`width: 100%\` or \`flex: 1 1 auto\` inside a CSS flexbox container!`;
  }

  // Breakpoints / Responsive
  if (lower.includes('breakpoint') || lower.includes('mobile') || lower.includes('tablet') || lower.includes('1440') || lower.includes('768')) {
    return `### Responsive Breakpoints: Desktop to Mobile\n\nWhen transitioning layouts from **1440px Desktop** to **768px Tablet** and **375px Mobile**:\n\n1. **Flex Direction Switch**: Transform multi-column card rows (\`flex-direction: row\`) into stacked columns (\`flex-direction: column\`).\n2. **Side Padding Clamp**: Step down container padding from \`40px\` or \`48px\` on desktop down to \`16px\` or \`20px\` on mobile.\n3. **Typography Scaling**: Scale down \`H1\` titles by ~25-30% using CSS \`clamp()\` or responsive rem scales.\n4. **Touch Targets**: Ensure buttons, tags, and interactive links have at least **44x44px** tappable hit areas for thumb ergonomics.\n\n*Pro-tip:* In Blendify, check out **Module 2.2: Auto-Layout Fluid Constraints** for interactive visual simulators!`;
  }

  // Rem vs Px
  if (lower.includes('rem') || lower.includes('px') || lower.includes('pixel') || lower.includes('unit')) {
    return `### Why Rem Units Beat Pixels\n\nAlways prefer **\`rem\`** over **\`px\`** for responsive typography and spacing in modern CSS:\n\n- **Accessibility First**: \`1rem\` is tied to the root font-size (typically \`16px\`). If a user adjusts their browser's default font size for vision assistance, \`rem\` units scale proportionately, whereas hardcoded \`px\` values remain frozen.\n- **Fluid Scaling**: By adjusting the root font size across breakpoints, your entire design system (padding, margin, typography) adapts harmoniously.\n\n**Quick conversion:**\n- \`12px = 0.75rem\`\n- \`14px = 0.875rem\`\n- \`16px = 1rem\`\n- \`24px = 1.5rem\`\n- \`32px = 2rem\``;
  }

  // Grid vs Flexbox
  if (lower.includes('grid') || lower.includes('flexbox') || lower.includes('flex')) {
    return `### CSS Flexbox vs. CSS Grid\n\nHere is Blipp's golden rule for choosing between the two:\n\n- **CSS Flexbox (1-Dimensional)**: Use when laying out elements in a single row OR a single column. Perfect for navigation bars, button groups, tag badges, and message bubble rows.\n- **CSS Grid (2-Dimensional)**: Use when you need precise alignment across BOTH rows and columns simultaneously. Perfect for responsive card galleries, LMS dashboard overviews, and magazine layouts.\n\n*Did you know?* In modern Webflow, CSS Grid allows you to adjust columns per breakpoint without touching HTML markup!`;
  }

  // Design Tokens
  if (lower.includes('token') || lower.includes('color') || lower.includes('variable')) {
    return `### UI Design Tokens Explained\n\nDesign tokens are the foundational building blocks of your UI system—like CSS variables for values you use repeatedly:\n\n\`\`\`css\n:root {\n  --primary: #C59A53;\n  --bg-surface: #FFFFFF;\n  --radius-md: 8px;\n  --space-unit: 4px;\n}\n\`\`\`\n\nWhen design tokens are defined early, redesigning a brand theme or switching to dark mode takes minutes rather than rewriting hundreds of individual style properties!`;
  }

  // Quiz request
  if (lower.includes('quiz') || lower.includes('test') || focusArea === 'quiz') {
    return `### 🧠 Quick Knowledge Check from Blipp!\n\nHere are 2 rapid-fire questions to test your UI & responsive layout skills:\n\n1. **In Figma Auto-Layout, which resizing mode allows a card to automatically stretch across the full width of its parent container?**\n   - A) Hug contents\n   - B) Fill container\n   - C) Fixed width\n\n2. **In CSS, what is the default pixel equivalent of \`1.5rem\` in standard browsers?**\n   - A) 18px\n   - B) 24px\n   - C) 32px\n\n*Reply with your answers and I'll grade them immediately!*`;
  }

  // Socratic / conceptual questions
  if (lower.includes('why') || lower.includes('analogy') || focusArea === 'concept') {
    return `### Conceptual Insight from Blipp\n\nThink of responsive web design like **packing water into containers of different shapes**:\n\nThe water (your content) doesn't change volume or essence, but the vessel changes from a tall pitcher (desktop screen) to a compact travel mug (smartphone). If you freeze the water into a rigid ice sculpture (hardcoded pixel widths), it won't fit into the smaller mug without breaking the glass!\n\nAuto-layout, flexbox, and fluid tokens give your design that fluid liquid quality. How does this analogy change how you approach wireframing your next project?`;
  }

  // Blendify LMS portal / classroom / tag
  if (lower.includes('portal') || lower.includes('tag') || lower.includes('workplace') || lower.includes('cohort')) {
    return `### Blendify Classroom Workplaces & Tags\n\nIn Blendify, study cohorts collaborate in dedicated **Workplaces** identified by portal tags like **\`#PORTAL-FIGMA-101\`**:\n\n- **Entering a Workplace**: Click on **Classroom Workplaces** in the main navigation, enter your portal tag in the input box, and hit Enter.\n- **Generating a New Tag**: Instructors and study group leads can click **Generate New Portal Tag** to launch a custom study room with its own live discussion feed.\n- **Sharing**: You can click **Share to Workplace** on any lesson material to send it directly to your peers!`;
  }

  // Default well-rounded reply
  return `### Hello! I'm Blipp, your Unified AI Companion 🚀\n\nI'm ready to help you master every aspect of modern web design and Blendify LMS. Here are some great things we can do together:\n\n- **🎨 Design Systems**: Break down Figma Auto-layout (Hug vs Fill), typography hierarchies, and token architecture.\n- **💻 Frontend Code**: Convert wireframes into Webflow flexbox, responsive CSS grids, and accessible rem scales.\n- **🧠 Concept Coaching**: Explore web fundamentals through analogies and step-by-step reasoning.\n- **📝 Practice Quizzes**: Test your knowledge with interactive retention checks!\n\nWhat would you like to build or learn right now?`;
}

/**
 * Call the live Gemini API endpoint
 */
export async function callGeminiAPI({ prompt, history = [], focusArea = 'all' }) {
  const apiKey = getGeminiApiKey();

  // If no API key is provided, return rich offline educational response
  if (!apiKey) {
    // Simulate realistic AI response delay for natural feeling
    await new Promise(res => setTimeout(res, 500));
    const fallbackText = generateLocalBlippResponse(prompt, focusArea);
    return {
      text: fallbackText,
      source: 'local',
      model: 'Blipp Local Engine',
      hasKey: false
    };
  }

  const model = getGeminiModel();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Format past history for Gemini API
  // Gemini expects contents: [{ role: 'user'|'model', parts: [{ text }] }]
  const contents = [];

  // Add recent history (up to last 10 messages for rich context without exceeding token quotas)
  const recentHistory = history.slice(-10);
  recentHistory.forEach(item => {
    if (!item.text) return;
    const role = item.sender === 'user' ? 'user' : 'model';
    // Skip initial greeting if needed, or include it
    contents.push({
      role,
      parts: [{ text: item.text }]
    });
  });

  // Ensure current user prompt is included
  if (contents.length === 0 || contents[contents.length - 1].parts[0].text !== prompt) {
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });
  }

  const systemPrompt = getBlippSystemPrompt(focusArea);

  const payload = {
    contents,
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1200
    }
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      console.warn('Gemini API returned error:', errorMessage);

      // Return a graceful error with fallback response
      const fallback = generateLocalBlippResponse(prompt, focusArea);
      return {
        text: `${fallback}\n\n> ⚠️ *Note: Live Gemini API request encountered an issue (${errorMessage}). Showing response from Blipp's built-in curriculum knowledge base. Check your API key in Settings.*`,
        source: 'fallback',
        model,
        hasKey: true,
        error: errorMessage
      };
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const generatedText = candidate?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No response text returned by Gemini API');
    }

    return {
      text: generatedText,
      source: 'gemini',
      model,
      hasKey: true
    };
  } catch (err) {
    console.error('Gemini API call failed:', err);
    const fallback = generateLocalBlippResponse(prompt, focusArea);
    return {
      text: `${fallback}\n\n> ⚠️ *Note: Connection to Gemini API failed (${err.message || 'Network error'}). Blipp is currently using the offline knowledge base.*`,
      source: 'fallback',
      model,
      hasKey: true,
      error: err.message
    };
  }
}

/**
 * Test a Gemini API key with a fast ping request
 */
export async function testGeminiConnection(key, model = DEFAULT_MODEL) {
  if (!key || !key.trim()) {
    return { success: false, message: 'Please provide an API key to test.' };
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key.trim()}`;
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: 'Hello Gemini! Please reply with exactly: "Blipp online!"' }]
      }
    ],
    generationConfig: {
      maxOutputTokens: 20
    }
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        success: false,
        message: errJson.error?.message || `HTTP ${res.status}: ${res.statusText}`
      };
    }

    const data = await res.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return {
      success: true,
      message: `Connected successfully! Gemini replied: "${reply.trim()}"`
    };
  } catch (e) {
    return {
      success: false,
      message: `Connection failed: ${e.message || 'Check your network and key.'}`
    };
  }
}

/**
 * Format markdown text to safe HTML for Blipp's chat bubbles.
 */
export function formatMarkdown(text) {
  if (!text) return '';

  // Escape HTML characters first
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Fenced code blocks ```language\ncode\n```
  html = html.replace(/```([a-zA-Z0-9_\-\+]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const cleanLang = lang.trim() || 'code';
    return `<div class="blipp-code-block">
      <div class="blipp-code-header">
        <span class="blipp-code-lang">${cleanLang}</span>
        <button class="blipp-code-copy" onclick="navigator.clipboard.writeText(this.closest('.blipp-code-block').querySelector('code').innerText); this.textContent='Copied!'; setTimeout(() => this.textContent='Copy', 2000);">Copy</button>
      </div>
      <pre><code>${code.trim()}</code></pre>
    </div>`;
  });

  // Inline code `code`
  html = html.replace(/`([^`]+)`/g, '<code class="blipp-inline-code">$1</code>');

  // Headings ### Heading
  html = html.replace(/^### (.*$)/gim, '<h4 class="blipp-chat-h4">$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3 class="blipp-chat-h3">$1</h3>');

  // Blockquotes > quote
  html = html.replace(/^\&gt;\s?(.*$)/gim, '<blockquote class="blipp-blockquote">$1</blockquote>');

  // Bold **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic *text* or _text_
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Bullet list items
  html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li class="blipp-list-item">$1</li>');
  html = html.replace(/(<li class="blipp-list-item">[\s\S]*?<\/li>)/g, '<ul class="blipp-list">$1</ul>');
  // Clean adjacent lists
  html = html.replace(/<\/ul>\s*<ul class="blipp-list">/g, '');

  // Numbered list items
  html = html.replace(/^\s*(\d+)\.\s+(.*$)/gim, '<li class="blipp-num-item"><span class="num-prefix">$1.</span> $2</li>');
  html = html.replace(/(<li class="blipp-num-item">[\s\S]*?<\/li>)/g, '<ol class="blipp-num-list">$1</ol>');
  html = html.replace(/<\/ol>\s*<ol class="blipp-num-list">/g, '');

  // Paragraph breaks
  const paragraphs = html.split(/\n{2,}/);
  html = paragraphs.map(p => {
    p = p.trim();
    if (!p) return '';
    if (p.startsWith('<div class="blipp-code-block"') || p.startsWith('<h3') || p.startsWith('<h4') || p.startsWith('<ul') || p.startsWith('<ol') || p.startsWith('<blockquote')) {
      return p;
    }
    return `<p>${p.replace(/\n/g, '<br/>')}</p>`;
  }).join('');

  return html;
}
