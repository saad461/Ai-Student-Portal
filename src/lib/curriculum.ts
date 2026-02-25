export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface CurriculumItem {
  id: string;
  week: number; // Module Number
  day: string;  // Lecture Label or Day Name
  type: 'assignment' | 'task' | 'quiz' | 'lecture' | 'grand_test' | 'final_project';
  title: string;
  description: string;
  requirements?: string[];
  required_focus_hours?: number;
  content?: QuizQuestion[] | string[];
  theory_content?: string;
  attached_assignment?: {
    title: string;
    description: string;
    requirements: string[];
  };
  attached_quiz?: QuizQuestion[];
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

export const isItemUnlocked = (
  item: CurriculumItem,
  allCurriculum: CurriculumItem[],
  submissions: { curriculum_id: string; status: string }[],
  agreedTC: boolean = true
) => {
  const sorted = [...allCurriculum].sort((a, b) => {
    if (a.week !== b.week) return a.week - b.week;
    const getOrder = (d: string) => {
      if (DAY_MAP[d]) return DAY_MAP[d];
      const match = d.match(/Lecture\s+(\d+)/i);
      if (match) return parseInt(match[1]);
      return 0;
    };
    return getOrder(a.day) - getOrder(b.day);
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

  // 1: The Foundation
  {
    id: 'm1-l1',
    week: 1,
    day: 'Lecture 1',
    type: 'lecture',
    title: 'Overview of HTML',
    description: 'Understanding the role of HTML in web development.',
    theory_content: 'HTML (HyperText Markup Language) is the standard markup language for documents designed to be displayed in a web browser...',
  },
  {
    id: 'm1-l2',
    week: 1,
    day: 'Lecture 2',
    type: 'lecture',
    title: 'Document Structure',
    description: 'Learning the boilerplate of an HTML5 document.',
    theory_content: 'Every HTML5 document should start with <!DOCTYPE html> followed by the <html> element...',
  },
  {
    id: 'm1-l3',
    week: 1,
    day: 'Lecture 3',
    type: 'lecture',
    title: 'Metadata',
    description: 'The <head> element and its contents.',
    theory_content: 'Metadata is data about the HTML document. It is not displayed. Metadata typically defines the document title, character set, styles, scripts, and other meta information...',
  },
  {
    id: 'm1-l4',
    week: 1,
    day: 'Lecture 4',
    type: 'lecture',
    title: 'SEO & Open Graph Tags',
    description: 'Optimizing your site for search engines and social sharing.',
    theory_content: 'Search Engine Optimization (SEO) involves using meta tags to help search engines understand your content. Open Graph tags control how URLs are displayed when shared on social media...',
  },
  {
    id: 'm1-l5',
    week: 1,
    day: 'Lecture 5',
    type: 'lecture',
    title: 'Semantic HTML',
    description: 'Using tags that convey meaning rather than just presentation.',
    theory_content: 'Semantic HTML is the use of HTML markup to reinforce the semantics, or meaning, of the information in webpages and web applications rather than merely to define its look or appearance...',
  },
  {
    id: 'm1-l6',
    week: 1,
    day: 'Lecture 6',
    type: 'lecture',
    title: 'Headings and Sections',
    description: 'Structuring content hierarchy with H1-H6 and sectioning tags.',
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

  // 2: Content & Structure
  {
    id: 'm1-l7',
    week: 1,
    day: 'Lecture 7',
    type: 'lecture',
    title: 'Text Basics',
    description: 'Paragraphs, spans, and line breaks.',
    theory_content: 'The <p> tag defines a paragraph. The <span> tag is an inline container used to mark up a part of a text...',
  },
  {
    id: 'm1-l8',
    week: 1,
    day: 'Lecture 8',
    type: 'lecture',
    title: 'Other Inline Text Elements',
    description: 'Strong, em, mark, and small tags.',
    theory_content: 'Inline elements do not start on a new line and only take up as much width as necessary...',
  },
  {
    id: 'm1-l9',
    week: 1,
    day: 'Lecture 9',
    type: 'lecture',
    title: 'Links',
    description: 'Hyperlinks and navigation between pages.',
    theory_content: 'The <a> tag defines a hyperlink, which is used to link from one page to another...',
  },
  {
    id: 'm1-l10',
    week: 1,
    day: 'Lecture 10',
    type: 'lecture',
    title: 'Lists',
    description: 'Ordered, unordered, and description lists.',
    theory_content: 'An unordered list starts with the <ul> tag. Each list item starts with the <li> tag...',
  },
  {
    id: 'm1-l11',
    week: 1,
    day: 'Lecture 11',
    type: 'lecture',
    title: 'Navigation',
    description: 'Creating accessible navigation menus with <nav>.',
    theory_content: 'The <nav> tag defines a set of navigation links...',
  },
  {
    id: 'm1-l12',
    week: 1,
    day: 'Lecture 12',
    type: 'lecture',
    title: 'Tables',
    description: 'Representing tabular data in HTML.',
    theory_content: 'The <table> tag defines an HTML table. Each table row is defined with a <tr> tag...',
    required_focus_hours: 1,
    attached_assignment: {
      title: 'Data Table Project',
      description: 'Build a complex table representing student grades.',
      requirements: ['Use <thead> and <tbody>', 'Include at least 5 rows', 'Use rowspan or colspan']
    }
  },

  // 3: User Interaction & Logic
  {
    id: 'm1-l13',
    week: 1,
    day: 'Lecture 13',
    type: 'lecture',
    title: 'Attributes',
    description: 'Common HTML attributes and global attributes.',
    theory_content: 'Attributes provide additional information about elements. They are always specified in the start tag...',
  },
  {
    id: 'm1-l14',
    week: 1,
    day: 'Lecture 14',
    type: 'lecture',
    title: 'Custom Data Attributes (data-*)',
    description: 'Storing private data for the page or application.',
    theory_content: 'Custom data attributes allow us to store extra information on standard, semantic HTML elements...',
  },
  {
    id: 'm1-l15',
    week: 1,
    day: 'Lecture 15',
    type: 'lecture',
    title: 'Forms',
    description: 'Collecting user input with HTML forms.',
    theory_content: 'An HTML form is used to collect user input. The user input is most often sent to a server for processing...',
  },
  {
    id: 'm1-l16',
    week: 1,
    day: 'Lecture 16',
    type: 'lecture',
    title: 'Input Validation & Patterns',
    description: 'Native HTML5 form validation.',
    theory_content: 'HTML5 has a powerful set of built-in validation features using attributes like required, pattern, and minlength...',
  },
  {
    id: 'm1-l17',
    week: 1,
    day: 'Lecture 17',
    type: 'lecture',
    title: 'Focus',
    description: 'Managing element focus and the tabindex attribute.',
    theory_content: 'Focus is a state of an element that is ready to receive input. Only one element can have focus at a time...',
  },
  {
    id: 'm1-l18',
    week: 1,
    day: 'Lecture 18',
    type: 'lecture',
    title: 'Keyboard Accessibility',
    description: 'Ensuring your site is navigable via keyboard.',
    theory_content: 'Keyboard accessibility is one of the most important aspects of web accessibility. Many users rely on a keyboard to navigate the web...',
    required_focus_hours: 1,
    attached_quiz: [
      { question: 'Which attribute makes an element focusable?', options: ['id', 'class', 'tabindex', 'focus'], correctAnswer: 2 }
    ]
  },

  // 4: UI Components
  {
    id: 'm1-l19',
    week: 1,
    day: 'Lecture 19',
    type: 'lecture',
    title: 'Details and Summary',
    description: 'Creating native accordions with <details>.',
    theory_content: 'The <details> tag specifies additional details that the user can open and close on demand...',
  },
  {
    id: 'm1-l20',
    week: 1,
    day: 'Lecture 20',
    type: 'lecture',
    title: 'Dialog',
    description: 'Native modal dialogs with the <dialog> element.',
    theory_content: 'The <dialog> tag defines a dialog box or other interactive component, such as a dismissible alert...',
  },
  {
    id: 'm1-l21',
    week: 1,
    day: 'Lecture 21',
    type: 'lecture',
    title: 'Popovers',
    description: 'Introduction to the new Popover API.',
    theory_content: 'The Popover API provides a native way to create popovers and other floating UI elements...',
  },
  {
    id: 'm1-l22',
    week: 1,
    day: 'Lecture 22',
    type: 'lecture',
    title: 'Template, Slot, and Shadow',
    description: 'The three pillars of Web Components.',
    theory_content: 'The <template> and <slot> elements are used to define the structure of a web component...',
  },
  {
    id: 'm1-l23',
    week: 1,
    day: 'Lecture 23',
    type: 'lecture',
    title: 'Web Components',
    description: 'Building custom HTML tags.',
    theory_content: 'Web Components is a suite of different technologies allowing you to create reusable custom elements...',
    required_focus_hours: 1,
  },

  // 5: Multimedia & Graphics
  {
    id: 'm1-l24',
    week: 1,
    day: 'Lecture 24',
    type: 'lecture',
    title: 'Images',
    description: 'Working with <img>, alt text, and lazy loading.',
    theory_content: 'The <img> tag is used to embed an image in an HTML page...',
  },
  {
    id: 'm1-l25',
    week: 1,
    day: 'Lecture 25',
    type: 'lecture',
    title: 'Responsive Picture & Art Direction',
    description: 'Using <picture> for different image versions.',
    theory_content: 'The <picture> element gives web developers more flexibility in specifying image resources...',
  },
  {
    id: 'm1-l26',
    week: 1,
    day: 'Lecture 26',
    type: 'lecture',
    title: 'Audio and Video',
    description: 'Embedding media directly in the browser.',
    theory_content: 'The <audio> and <video> elements are used to embed multimedia content in an HTML document...',
  },
  {
    id: 'm1-l27',
    week: 1,
    day: 'Lecture 27',
    type: 'lecture',
    title: 'SVG Graphics',
    description: 'Scalable Vector Graphics in HTML.',
    theory_content: 'SVG stands for Scalable Vector Graphics. It is used to define vector-based graphics for the Web...',
  },
  {
    id: 'm1-l28',
    week: 1,
    day: 'Lecture 28',
    type: 'lecture',
    title: 'Canvas API',
    description: 'Drawing graphics via JavaScript.',
    theory_content: 'The HTML <canvas> element is used to draw graphics, on the fly, via JavaScript...',
    required_focus_hours: 1,
  },

  // 6: Advanced Web APIs
  {
    id: 'm1-l29',
    week: 1,
    day: 'Lecture 29',
    type: 'lecture',
    title: 'HTML APIs',
    description: 'Geolocation, Drag and Drop, and more.',
    theory_content: 'HTML5 has many APIs (Application Programming Interfaces) to make it more interactive...',
  },
  {
    id: 'm1-l30',
    week: 1,
    day: 'Lecture 30',
    type: 'lecture',
    title: 'Web Storage (LocalStorage/SessionStorage)',
    description: 'Storing data in the browser.',
    theory_content: 'Web storage allows web applications to store data locally within the user\'s browser...',
  },
  {
    id: 'm1-l31',
    week: 1,
    day: 'Lecture 31',
    type: 'lecture',
    title: 'IndexedDB (Deep Storage)',
    description: 'Working with client-side databases.',
    theory_content: 'IndexedDB is a way for you to persistently store data inside a user\'s browser...',
  },
  {
    id: 'm1-l32',
    week: 1,
    day: 'Lecture 32',
    type: 'lecture',
    title: 'Web Workers',
    description: 'Running scripts in the background.',
    theory_content: 'A web worker is a JavaScript that runs in the background, independently of other scripts, without affecting the performance of the page...',
    required_focus_hours: 1,
  },
];
