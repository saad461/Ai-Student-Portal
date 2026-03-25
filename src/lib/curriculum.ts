export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Course {
  id: string;
  slug: string;
  name: string;
  description?: string;
  thumbnail_url?: string;
  index: number;
  parent_id?: string;
  status?: 'locked' | 'unlocked' | 'completed';
}

export interface Module {
  id: string;
  course_id: string;
  index: number;
  name: string;
  description?: string;
}

export interface SubModule {
  id: string;
  module_id: string;
  index: number;
  name: string;
}

export interface CurriculumItem {
  id: string;
  week: number; // Legacy Module Number
  day: string;  // Lecture Label or Day Name
  type: 'assignment' | 'task' | 'quiz' | 'lecture' | 'grand_test' | 'final_project';
  title: string;
  description: string;
  requirements?: string[];
  required_focus_hours?: number;
  required_read_minutes?: number;
  content?: any;
  theory_content?: string;
  video_url?: string;
  enable_compiler?: boolean;
  compiler_initial_code?: {
    html?: string;
    css?: string;
    js?: string;
  };
  external_resources?: {
    title: string;
    url: string;
    type: 'link' | 'video' | 'doc' | 'github';
  }[];
  attached_assignment?: {
    title: string;
    description: string;
    requirements: string[];
  };
  attached_quiz?: QuizQuestion[];
  is_boss_project?: boolean;
  course_id?: string;
  module_id?: string;
  module_index?: number;
  module_name?: string;
  lecture_index?: number;
  sub_module_id?: string;
  sub_module_name?: string;
}

export const DAY_MAP: Record<string, number> = {
  'Monday': 1,
  'Tuesday': 2,
  'Wednesday': 3,
  'Thursday': 4,
  'Friday': 5,
  'Saturday': 6,
  'Sunday': 7,
  'Monthly': 5,
  'Final': 5
};

export const getEstimatedReadTime = (content: string | undefined): number => {
  if (!content) return 0;
  // Average reading speed: 200 words per minute
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return minutes;
};

export const extractHeadings = (content: string | undefined) => {
  if (!content || typeof content !== 'string') return [];

  const extracted: { level: number; text: string; id: string }[] = [];
  const lines = content.split('\n');

  lines.forEach(line => {
    // Markdown: # Heading
    const mdMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (mdMatch) {
      const level = mdMatch[1].length;
      const rawText = mdMatch[2];
      const cleanText = rawText.replace(/[*_~`]/g, '').replace(/<[^>]*>/g, '').trim();
      const id = cleanText.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      extracted.push({ level, text: cleanText, id });
      return;
    }

    // HTML: <h1 style="...">Heading</h1>
    const htmlMatch = line.match(/<(h[1-3])[^>]*>(.*?)<\/h[1-3]>/i);
    if (htmlMatch) {
      const level = parseInt(htmlMatch[1][1]);
      const rawText = htmlMatch[2];
      const cleanText = rawText.replace(/<[^>]*>/g, '').replace(/[*_~`]/g, '').trim();
      const id = cleanText.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      extracted.push({ level, text: cleanText, id });
    }
  });

  return extracted;
};

export const isItemUnlocked = (
  item: CurriculumItem,
  allCurriculum: CurriculumItem[],
  submissions: { curriculum_id: string; status: string }[],
  agreedTC: boolean = true
) => {
  const sorted = [...allCurriculum].sort((a, b) => {
    // Primary Sort: Week/Module
    if (a.week !== b.week) return a.week - b.week;

    // Secondary Sort: Lecture Index (if exists)
    const getOrder = (i: CurriculumItem) => {
      if (i.lecture_index !== undefined && i.lecture_index !== null) return i.lecture_index;

      // Fallback to Day Map for legacy support
      if (DAY_MAP[i.day]) return DAY_MAP[i.day];

      // Fallback to "Lecture X" parsing
      const match = i.day.match(/Lecture\s+(\d+)/i);
      if (match) return parseInt(match[1]);

      return 0;
    };
    return getOrder(a) - getOrder(b);
  });

  if (sorted.length === 0) return true;

  const firstItem = sorted[0];
  if (item.id === firstItem.id) {
    return agreedTC;
  }

  const currentIndex = sorted.findIndex((i) => i.id === item.id);
  if (currentIndex <= 0) return true;

  const prevItem = sorted[currentIndex - 1];
  const prevSubmission = submissions.find((s) => s.curriculum_id === prevItem.id);

  return (
    prevSubmission &&
    (prevSubmission.status === 'submitted' ||
      prevSubmission.status === 'reviewed' ||
      prevSubmission.status === 'skipped')
  );
};

export const CURRICULUM: CurriculumItem[] = [
  // MODULE 1: HTML & Web Fundamentals

  {
    id: 'm1-l1',
    week: 1,
    day: 'Lecture 1',
    type: 'lecture',
    title: 'Welcome HTML',
    description: 'Introduction to the HTML course for web developers.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 1,
    theory_content: `<h1>Welcome to Learn HTML!</h1>
<p>This HTML course for web developers provides a <strong>solid overview</strong> for developers, from <em>novice to expert</em> level HTML.</p>
<p>HyperText Markup Language, or HTML, is the <u>backbone of the web</u>, providing the content, as well as the structure of that content, that you see displayed in your web browser.</p>
<p>Unless you're reading a PDF or a printed version of this page, this content is made up of various HTML elements and text. HTML is the content layer of the web. HTML elements are the nodes that make up the Document Object Model.</p>
<blockquote>
  <p>HTML is the foundation of every website. Without it, the web wouldn't exist as we know it today.</p>
</blockquote>
<h2>What you'll learn</h2>
<p>This course provides a comprehensive guide. If you're completely new to HTML, you'll learn how to build structurally sound content. If you've been building websites for years, this course may fill in gaps in knowledge that you didn't even know you had.</p>
<h3>Course Modules Table</h3>
<table>
  <thead>
    <tr>
      <th>Module</th>
      <th>Topic</th>
      <th>Difficulty</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>Fundamentals</td>
      <td>Beginner</td>
    </tr>
    <tr>
      <td>2</td>
      <td>Advanced Layout</td>
      <td>Intermediate</td>
    </tr>
    <tr>
      <td>3</td>
      <td>Web APIs</td>
      <td>Advanced</td>
    </tr>
  </tbody>
</table>
<p>Here's what we will cover in depth:</p>
<ul>
  <li><strong>Document structure</strong>: Learn how to structure your HTML documents.</li>
  <li><strong>Semantic HTML</strong>: Using the correct HTML elements to describe your content.</li>
  <li><strong>Forms &amp; Media</strong>: Handling user input and multimedia.</li>
</ul>
<p>So, are you ready to learn HTML? <strong>Let's get started!</strong></p>`,
  },

  {
    id: 'm1-l2',
    week: 1,
    day: 'Lecture 2',
    type: 'lecture',
    title: 'Overview of HTML',
    description: 'Understanding the role of HTML in web development.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 2,
    theory_content: `<h2>The Role of HTML</h2>
<p>HTML (HyperText Markup Language) is the standard markup language for documents designed to be displayed in a web browser. It is often assisted by technologies such as Cascading Style Sheets (CSS) and scripting languages such as JavaScript.</p>
<hr />
<p>Web browsers receive HTML documents from a web server or from local storage and render the documents into multimedia web pages. HTML describes the structure of a web page semantically and originally included cues for the appearance of the document.</p>`,
  },
  {
    id: 'm1-l3',
    week: 1,
    day: 'Lecture 3',
    type: 'lecture',
    title: 'Document Structure',
    description: 'Learning the boilerplate of an HTML5 document.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 3,
    theory_content: 'Every HTML5 document should start with <!DOCTYPE html> followed by the <html> element...',
  },
  {
    id: 'm1-l4',
    week: 1,
    day: 'Lecture 4',
    type: 'lecture',
    title: 'Metadata',
    description: 'The <head> element and its contents.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 4,
    theory_content: 'Metadata is data about the HTML document. It is not displayed. Metadata typically defines the document title, character set, styles, scripts, and other meta information...',
  },
  {
    id: 'm1-l5',
    week: 1,
    day: 'Lecture 5',
    type: 'lecture',
    title: 'SEO & Open Graph Tags',
    description: 'Optimizing your site for search engines and social sharing.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 5,
    theory_content: 'Search Engine Optimization (SEO) involves using meta tags to help search engines understand your content. Open Graph tags control how URLs are displayed when shared on social media...',
  },
  {
    id: 'm1-l6',
    week: 1,
    day: 'Lecture 6',
    type: 'lecture',
    title: 'Semantic HTML',
    description: 'Using tags that convey meaning rather than just presentation.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 6,
    theory_content: 'Semantic HTML is the use of HTML markup to reinforce the semantics, or meaning, of the information in webpages and web applications rather than merely to define its look or appearance...',
  },
  {
    id: 'm1-l7',
    week: 1,
    day: 'Lecture 7',
    type: 'lecture',
    title: 'Headings and Sections',
    description: 'Structuring content hierarchy with H1-H6 and sectioning tags.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 7,
    theory_content: 'Proper use of headings helps users and search engines read and understand text. Sections (<section>, <article>, <aside>) provide thematic grouping of content...',
    required_focus_hours: 1,
    attached_assignment: {
      title: 'Foundation Portfolio',
      description: 'Create a semantic structure for a personal portfolio.',
      requirements: ['Use all H1-H3 tags', 'Include a <meta> description', 'Use <header>, <main>, and <footer>']
    },
    attached_quiz: [
      { question: 'Which tag is used for the main title?', options: ['<head>', '<h1>', '<title>', '<main>'], correctAnswer: 1 }
    ]
  },

  {
    id: 'm1-l8',
    week: 1,
    day: 'Lecture 8',
    type: 'lecture',
    title: 'Text Basics',
    description: 'Paragraphs, spans, and line breaks.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 8,
    theory_content: 'The <p> tag defines a paragraph. The <span> tag is an inline container used to mark up a part of a text...',
  },
  {
    id: 'm1-l9',
    week: 1,
    day: 'Lecture 9',
    type: 'lecture',
    title: 'Other Inline Text Elements',
    description: 'Strong, em, mark, and small tags.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 9,
    theory_content: 'Inline elements do not start on a new line and only take up as much width as necessary...',
  },
  {
    id: 'm1-l10',
    week: 1,
    day: 'Lecture 10',
    type: 'lecture',
    title: 'Links',
    description: 'Hyperlinks and navigation between pages.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 10,
    theory_content: 'The <a> tag defines a hyperlink, which is used to link from one page to another...',
  },
  {
    id: 'm1-l11',
    week: 1,
    day: 'Lecture 11',
    type: 'lecture',
    title: 'Lists',
    description: 'Ordered, unordered, and description lists.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 11,
    theory_content: 'An unordered list starts with the <ul> tag. Each list item starts with the <li> tag...',
  },
  {
    id: 'm1-l12',
    week: 1,
    day: 'Lecture 12',
    type: 'lecture',
    title: 'Navigation',
    description: 'Creating accessible navigation menus with <nav>.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 12,
    theory_content: 'The <nav> tag defines a set of navigation links...',
  },
  {
    id: 'm1-l13',
    week: 1,
    day: 'Lecture 13',
    type: 'lecture',
    title: 'Tables',
    description: 'Representing tabular data in HTML.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 13,
    theory_content: 'The <table> tag defines an HTML table. Each table row is defined with a <tr> tag...',
    required_focus_hours: 1,
    attached_assignment: {
      title: 'Data Table Project',
      description: 'Build a complex table representing student grades.',
      requirements: ['Use <thead> and <tbody>', 'Include at least 5 rows', 'Use rowspan or colspan']
    }
  },

  {
    id: 'm1-l14',
    week: 1,
    day: 'Lecture 14',
    type: 'lecture',
    title: 'Attributes',
    description: 'Common HTML attributes and global attributes.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 14,
    theory_content: 'Attributes provide additional information about elements. They are always specified in the start tag...',
  },
  {
    id: 'm1-l15',
    week: 1,
    day: 'Lecture 15',
    type: 'lecture',
    title: 'Custom Data Attributes (data-*)',
    description: 'Storing private data for the page or application.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 15,
    theory_content: 'Custom data attributes allow us to store extra information on standard, semantic HTML elements...',
  },
  {
    id: 'm1-l16',
    week: 1,
    day: 'Lecture 16',
    type: 'lecture',
    title: 'Forms',
    description: 'Collecting user input with HTML forms.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 16,
    theory_content: 'An HTML form is used to collect user input. The user input is most often sent to a server for processing...',
  },
  {
    id: 'm1-l17',
    week: 1,
    day: 'Lecture 17',
    type: 'lecture',
    title: 'Input Validation & Patterns',
    description: 'Native HTML5 form validation.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 17,
    theory_content: 'HTML5 has a powerful set of built-in validation features using attributes like required, pattern, and minlength...',
  },
  {
    id: 'm1-l18',
    week: 1,
    day: 'Lecture 18',
    type: 'lecture',
    title: 'Focus',
    description: 'Managing element focus and the tabindex attribute.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 18,
    theory_content: 'Focus is a state of an element that is ready to receive input. Only one element can have focus at a time...',
  },
  {
    id: 'm1-l19',
    week: 1,
    day: 'Lecture 19',
    type: 'lecture',
    title: 'Keyboard Accessibility',
    description: 'Ensuring your site is navigable via keyboard.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 19,
    theory_content: 'Keyboard accessibility is one of the most important aspects of web accessibility. Many users rely on a keyboard to navigate the web...',
    required_focus_hours: 1,
    attached_quiz: [
      { question: 'Which attribute makes an element focusable?', options: ['id', 'class', 'tabindex', 'focus'], correctAnswer: 2 }
    ]
  },

  {
    id: 'm1-l20',
    week: 1,
    day: 'Lecture 20',
    type: 'lecture',
    title: 'Details and Summary',
    description: 'Creating native accordions with <details>.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 20,
    theory_content: 'The <details> tag specifies additional details that the user can open and close on demand...',
  },
  {
    id: 'm1-l21',
    week: 1,
    day: 'Lecture 21',
    type: 'lecture',
    title: 'Dialog',
    description: 'Native modal dialogs with the <dialog> element.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 21,
    theory_content: 'The <dialog> tag defines a dialog box or other interactive component, such as a dismissible alert...',
  },
  {
    id: 'm1-l22',
    week: 1,
    day: 'Lecture 22',
    type: 'lecture',
    title: 'Popovers',
    description: 'Introduction to the new Popover API.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 22,
    theory_content: 'The Popover API provides a native way to create popovers and other floating UI elements...',
  },
  {
    id: 'm1-l23',
    week: 1,
    day: 'Lecture 23',
    type: 'lecture',
    title: 'Template, Slot, and Shadow',
    description: 'The three pillars of Web Components.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 23,
    theory_content: 'The <template> and <slot> elements are used to define the structure of a web component...',
  },
  {
    id: 'm1-l24',
    week: 1,
    day: 'Lecture 24',
    type: 'lecture',
    title: 'Web Components',
    description: 'Building custom HTML tags.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 24,
    theory_content: 'Web Components is a suite of different technologies allowing you to create reusable custom elements...',
    required_focus_hours: 1,
  },

  {
    id: 'm1-l25',
    week: 1,
    day: 'Lecture 25',
    type: 'lecture',
    title: 'Images',
    description: 'Working with <img>, alt text, and lazy loading.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 25,
    theory_content: 'The <img> tag is used to embed an image in an HTML page...',
  },
  {
    id: 'm1-l26',
    week: 1,
    day: 'Lecture 26',
    type: 'lecture',
    title: 'Responsive Picture & Art Direction',
    description: 'Using <picture> for different image versions.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 26,
    theory_content: 'The <picture> element gives web developers more flexibility in specifying image resources...',
  },
  {
    id: 'm1-l27',
    week: 1,
    day: 'Lecture 27',
    type: 'lecture',
    title: 'Audio and Video',
    description: 'Embedding media directly in the browser.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 27,
    theory_content: 'The <audio> and <video> elements are used to embed multimedia content in an HTML document...',
  },
  {
    id: 'm1-l28',
    week: 1,
    day: 'Lecture 28',
    type: 'lecture',
    title: 'SVG Graphics',
    description: 'Scalable Vector Graphics in HTML.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 28,
    theory_content: 'SVG stands for Scalable Vector Graphics. It is used to define vector-based graphics for the Web...',
  },
  {
    id: 'm1-l29',
    week: 1,
    day: 'Lecture 29',
    type: 'lecture',
    title: 'Canvas API',
    description: 'Drawing graphics via JavaScript.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 29,
    theory_content: 'The HTML <canvas> element is used to draw graphics, on the fly, via JavaScript...',
    required_focus_hours: 1,
  },

  {
    id: 'm1-l30',
    week: 1,
    day: 'Lecture 30',
    type: 'lecture',
    title: 'HTML APIs',
    description: 'Geolocation, Drag and Drop, and more.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 30,
    theory_content: 'HTML5 has many APIs (Application Programming Interfaces) to make it more interactive...',
  },
  {
    id: 'm1-l31',
    week: 1,
    day: 'Lecture 31',
    type: 'lecture',
    title: 'Web Storage (LocalStorage/SessionStorage)',
    description: 'Storing data in the browser.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 31,
    theory_content: 'Web storage allows web applications to store data locally within the user\'s browser...',
  },
  {
    id: 'm1-l32',
    week: 1,
    day: 'Lecture 32',
    type: 'lecture',
    title: 'IndexedDB (Deep Storage)',
    description: 'Working with client-side databases.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 32,
    theory_content: 'IndexedDB is a way for you to persistently store data inside a user\'s browser...',
  },
  {
    id: 'm1-l33',
    week: 1,
    day: 'Lecture 33',
    type: 'lecture',
    title: 'Web Workers',
    description: 'Running scripts in the background.',
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 33,
    theory_content: 'A web worker is a JavaScript that runs in the background, independently of other scripts, without affecting the performance of the page...',
    required_focus_hours: 1,
  },
  {
    id: 'm1-boss',
    week: 1,
    day: 'Final Boss',
    type: 'assignment',
    title: 'The Semantic Citadel',
    description: 'Demonstrate your total mastery of HTML. This is a module-final Boss Challenge.',
    is_boss_project: true,
    module_index: 1,
    module_name: 'HTML Foundation',
    lecture_index: 34,
    theory_content: '<h1>Module 1: Boss Project</h1><p>You have reached the end of the HTML Foundation. Your mission is to build the "Semantic Citadel", a multi-page, pixel-perfect, fully semantic web portal from scratch.</p>',
    attached_assignment: {
      title: 'The Semantic Citadel',
      description: 'Build a complete, semantic multi-page portal.',
      requirements: [
        'Complete semantic structure (header, main, section, footer)',
        'Accessible forms with validation',
        'Complex data tables for project statistics',
        'Embedded media (video/audio)',
        'Native Web Component integration'
      ]
    },
    required_focus_hours: 5
  }
];
