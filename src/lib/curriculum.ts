export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface CurriculumItem {
  id: string;
  week: number;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' | 'Monthly' | 'Final';
  type: 'assignment' | 'task' | 'quiz' | 'lecture' | 'grand_test' | 'final_project';
  title: string;
  description: string;
  requirements?: string[];
  required_focus_hours?: number;
  content?: QuizQuestion[] | string[];
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

export const isDayUnlocked = (week: number, day: string, currentWeek: number) => {
  const today = new Date();
  let currentDayNum = today.getDay();
  if (currentDayNum === 0) currentDayNum = 7; // Sunday as 7

  if (week < currentWeek) return true;
  if (week > currentWeek) return false;

  const targetDay = DAY_MAP[day] || 0;
  return currentDayNum >= targetDay;
};

export const isDayPassed = (week: number, day: string, currentWeek: number) => {
  const today = new Date();
  let currentDayNum = today.getDay();
  if (currentDayNum === 0) currentDayNum = 7;

  if (week < currentWeek) return true;
  if (week > currentWeek) return false;

  const targetDay = DAY_MAP[day] || 0;
  return currentDayNum > targetDay;
};

export const CURRICULUM: CurriculumItem[] = [
  // WEEK 1: Foundations of the Web
  {
    id: 'w1-mon',
    week: 1,
    day: 'Monday',
    type: 'assignment',
    title: 'Semantic HTML & Personal Portfolio Structure',
    description: 'Create a multi-page website structure using only semantic HTML5 tags.',
    required_focus_hours: 1,
    requirements: [
        'Use at least 10 different semantic HTML5 tags',
        'Implement a contact form with at least 5 different input types',
        'Create a navigation system between three separate HTML files',
        'Ensure 100% Lighthouse accessibility score'
    ]
  },
  {
    id: 'w1-tue',
    week: 1,
    day: 'Tuesday',
    type: 'task',
    title: 'HTML5 Forms & Client-Side Validation',
    description: 'Master the power of native HTML5 form validation and advanced input types.',
    requirements: [
        'Use pattern (regex) for custom validation',
        'Implement required, min/max length, and type-specific attributes',
        'Design a multi-step registration form structure',
        'Apply basic CSS to invalid states using :invalid'
    ]
  },
  {
    id: 'w1-wed',
    week: 1,
    day: 'Wednesday',
    type: 'task',
    title: 'CSS Box Model & Flexbox Mastery',
    description: 'Build a responsive navigation bar and a 3-column feature section using Flexbox.',
    requirements: [
        'Implement a "sticky" header',
        'Create a 3-column feature section that stacks on mobile',
        'Demonstrate justify-content and align-items',
        'Use box-sizing: border-box globally'
    ]
  },
  {
    id: 'w1-thu',
    week: 1,
    day: 'Thursday',
    type: 'task',
    title: 'Advanced CSS Selectors & Combinators',
    description: 'Learn how to target specific elements without adding unnecessary classes.',
    requirements: [
        'Use descendant, child, and sibling selectors',
        'Implement nth-child logic for alternating list styles',
        'Use pseudo-classes like :hover, :focus, and :not',
        'Understand selector specificity and the cascade'
    ]
  },
  {
    id: 'w1-fri',
    week: 1,
    day: 'Friday',
    type: 'quiz',
    title: 'HTML & CSS Fundamentals Quiz',
    description: 'Test your knowledge on semantic tags and layout basics.',
    content: [
      { question: 'Which tag is most appropriate for the main navigation menu?', options: ['<menu>', '<nav>', '<ul>', '<navigation>'], correctAnswer: 1 },
      { question: 'What does "box-sizing: border-box" do?', options: ['Adds a border', 'Includes padding/border in width/height', 'Excludes padding', 'Makes it invisible'], correctAnswer: 1 },
      { question: 'Which display property is used for 1D layouts?', options: ['grid', 'block', 'flex', 'inline'], correctAnswer: 2 },
      { question: 'Which attribute provides alternative text for an image?', options: ['title', 'src', 'alt', 'longdesc'], correctAnswer: 2 },
      { question: 'What is the default position value?', options: ['relative', 'absolute', 'fixed', 'static'], correctAnswer: 3 },
    ],
  },

  // WEEK 2: Advanced CSS & Responsive Design
  {
    id: 'w2-mon',
    week: 2,
    day: 'Monday',
    type: 'assignment',
    title: 'CSS Grid Layout & Modern Landing Page',
    description: 'Design a complex magazine-style layout using CSS Grid.',
    requirements: [
        'Use grid-template-areas to define the page layout',
        'Implement a responsive grid using minmax() and auto-fill',
        'Create a "hero" section with an overlaying text element',
        'Zero media queries used for the primary grid structure'
    ]
  },
  {
    id: 'w2-tue',
    week: 2,
    day: 'Tuesday',
    type: 'task',
    title: 'CSS Typography & Web Fonts',
    description: 'Learn how to implement professional typography using Google Fonts and custom @font-face.',
    requirements: [
        'Set up a vertical rhythm using line-height and margins',
        'Implement responsive font sizes using clamp()',
        'Optimize font loading using font-display: swap',
        'Apply text-shadow and letter-spacing for design polish'
    ]
  },
  {
    id: 'w2-wed',
    week: 2,
    day: 'Wednesday',
    type: 'task',
    title: 'CSS Variables & Dark Mode Toggle',
    description: 'Implement a theme switching system using CSS variables.',
    requirements: [
        'Define a set of at least 5 CSS variables',
        'Implement a manual toggle that switches variables',
        'Ensure the toggle state is visually indicated',
        'Apply smooth CSS transitions for theme changes'
    ]
  },
  {
    id: 'w2-thu',
    week: 2,
    day: 'Thursday',
    type: 'task',
    title: 'Responsive Images & Media Queries',
    description: 'Master the art of making images look great on every device.',
    requirements: [
        'Use srcset and sizes for resolution switching',
        'Implement the <picture> element for art direction',
        'Write mobile-first media queries',
        'Use aspect-ratio to prevent layout shift'
    ]
  },
  {
    id: 'w2-fri',
    week: 2,
    day: 'Friday',
    type: 'quiz',
    title: 'Advanced CSS Quiz',
    description: 'Check your understanding of Grid and CSS Variables.',
    content: [
      { question: 'How do you create 3 equal columns in Grid?', options: ['1fr 1fr 1fr', '33% 33% 33%', 'repeat(3, 1fr)', 'All of the above'], correctAnswer: 3 },
      { question: 'How do you define a CSS variable?', options: ['var-color: red;', '$color: red;', '--color: red;', '@color: red;'], correctAnswer: 2 },
      { question: 'What is 1rem if root font is 16px?', options: ['16px', '1px', '10px', 'Depends on parent'], correctAnswer: 0 },
      { question: 'Property to change flex item order?', options: ['index', 'order', 'flex-order', 'z-index'], correctAnswer: 1 },
      { question: 'What does "gap" do?', options: ['Space outside', 'Space between items', 'Space inside items', 'Nothing'], correctAnswer: 1 },
    ],
  },

  // WEEK 3: JavaScript Essentials
  {
    id: 'w3-mon',
    week: 3,
    day: 'Monday',
    type: 'assignment',
    title: 'Interactive Todo List with LocalStorage',
    description: 'Build a high-performance Todo list with persistence.',
    requirements: [
        'Functionality: Create, Read, Update, and Delete todos',
        'Persist data in LocalStorage',
        'Implement filters (All, Active, Completed)',
        'Use clean, modular JavaScript functions'
    ]
  },
  {
    id: 'w3-tue',
    week: 3,
    day: 'Tuesday',
    type: 'task',
    title: 'JavaScript Control Flow & Loops',
    description: 'Master if/else, switch, and different types of loops in JS.',
    requirements: [
        'Use switch statements for multi-condition logic',
        'Demonstrate for...of and for...in loops',
        'Implement error handling with try/catch',
        'Solve a logic problem using nested loops'
    ]
  },
  {
    id: 'w3-wed',
    week: 3,
    day: 'Wednesday',
    type: 'task',
    title: 'Array Methods & Data Manipulation',
    description: 'Handle data like a pro using higher-order functions.',
    requirements: [
        'Use .filter() to extract specific users',
        'Use .reduce() to calculate aggregate statistics',
        'Use .sort() to order data by multiple criteria',
        'Implement a search function using .includes()'
    ]
  },
  {
    id: 'w3-thu',
    week: 3,
    day: 'Thursday',
    type: 'task',
    title: 'JavaScript Functions & Scope',
    description: 'Understand the difference between function declarations, expressions, and arrow functions.',
    requirements: [
        'Demonstrate lexical scope and closures',
        'Use arrow functions for concise syntax',
        'Implement default parameters',
        'Explain the "this" keyword in different contexts'
    ]
  },
  {
    id: 'w3-fri',
    week: 3,
    day: 'Friday',
    type: 'quiz',
    title: 'JS Basics Quiz',
    description: 'Test your core JavaScript knowledge.',
    content: [
      { question: 'Reassignable variable keyword?', options: ['const', 'let', 'var', 'Both B and C'], correctAnswer: 3 },
      { question: 'typeof [] result?', options: ['array', 'object', 'list', 'undefined'], correctAnswer: 1 },
      { question: 'Method to add element to end?', options: ['push()', 'pop()', 'shift()', 'unshift()'], correctAnswer: 0 },
      { question: 'What is hoisting?', options: ['DOM movement', 'Declarations moved to top', 'Error handling', 'Script loading'], correctAnswer: 1 },
      { question: 'Which is falsy?', options: ['"0"', '[]', '{}', 'null'], correctAnswer: 3 },
    ],
  },

  // WEEK 4: DOM Manipulation & Events
  {
    id: 'w4-mon',
    week: 4,
    day: 'Monday',
    type: 'assignment',
    title: 'Dynamic Quiz Application',
    description: 'Create an engine that renders quizzes dynamically.',
    requirements: [
        'Render questions dynamically from a JS object',
        'Implement a progress bar and score tracker',
        'Show a "Results" screen with breakdown',
        'Ensure UI is responsive and accessible'
    ]
  },
  {
    id: 'w4-tue',
    week: 4,
    day: 'Tuesday',
    type: 'task',
    title: 'DOM Traversing & Manipulation',
    description: 'Learn how to move through the DOM tree and modify elements on the fly.',
    requirements: [
        'Use parentNode, children, and closest()',
        'Create and append elements using document.createElement',
        'Modify classes and attributes dynamically',
        'Understand the difference between innerHTML and textContent'
    ]
  },
  {
    id: 'w4-wed',
    week: 4,
    day: 'Wednesday',
    type: 'task',
    title: 'Event Delegation & Bubbling',
    description: 'Master the DOM event model.',
    requirements: [
        'Implement a list with a single event listener',
        'Demonstrate stopping event propagation',
        'Use data attributes to pass info from DOM to JS',
        'Implement a custom "context menu" on right-click'
    ]
  },
  {
    id: 'w4-thu',
    week: 4,
    day: 'Thursday',
    type: 'task',
    title: 'Working with Timers & Intervals',
    description: 'Learn how to handle time-based events in the browser.',
    requirements: [
        'Build a countdown timer using setInterval',
        'Implement a "Debounce" function using setTimeout',
        'Handle clearing intervals to prevent memory leaks',
        'Understand the JS Event Loop basics'
    ]
  },
  {
    id: 'w4-monthly',
    week: 4,
    day: 'Monthly',
    type: 'grand_test',
    title: 'Month 1 Grand Test',
    description: 'Comprehensive test on HTML, CSS, and JS Fundamentals.',
    content: [
        { question: 'Which property is used for 2D layouts?', options: ['flex', 'grid', 'block', 'table'], correctAnswer: 1 },
        { question: 'How to select an element by ID?', options: ['.id', '#id', 'id=', '@id'], correctAnswer: 1 },
        { question: 'Which JS method merges arrays?', options: ['concat()', 'push()', 'join()', 'add()'], correctAnswer: 0 },
        { question: 'What is the DOM?', options: ['Data Object Model', 'Document Object Model', 'Digital Object Model', 'Design Object Model'], correctAnswer: 1 },
        { question: 'Meaning of semantic HTML?', options: ['Visual tags', 'Tags with meaning', 'Complex tags', 'Old tags'], correctAnswer: 1 },
    ]
  },

  // WEEK 5: Asynchronous JavaScript
  {
    id: 'w5-mon',
    week: 5,
    day: 'Monday',
    type: 'assignment',
    title: 'Weather App with Fetch API',
    description: 'Connect your code to the real world by fetching live weather data.',
    requirements: [
        'Integrate with OpenWeatherMap API',
        'Handle Loading and Error states',
        'Implement a search bar for cities',
        'Display dynamic backgrounds based on conditions'
    ]
  },
  {
    id: 'w5-tue',
    week: 5,
    day: 'Tuesday',
    type: 'task',
    title: 'Working with JSON & API Headers',
    description: 'Learn how to properly format requests and parse complex JSON responses.',
    requirements: [
        'Use JSON.parse and JSON.stringify effectively',
        'Handle API Authentication via Headers',
        'Understand HTTP status codes (200, 404, 500)',
        'Implement basic request timeout logic'
    ]
  },
  {
    id: 'w5-wed',
    week: 5,
    day: 'Wednesday',
    type: 'task',
    title: 'Promises & Async/Await',
    description: 'Master asynchronous flow control.',
    requirements: [
        'Refactor "callback hell" into clean Promises',
        'Implement try/catch blocks for error handling',
        'Execute multiple requests in parallel with Promise.all()',
        'Create a "delay" utility function'
    ]
  },
  {
    id: 'w5-thu',
    week: 5,
    day: 'Thursday',
    type: 'task',
    title: 'Error Handling & Resilience',
    description: 'Learn how to build apps that don\'t crash when the internet or API fails.',
    requirements: [
        'Implement a retry mechanism for failed fetches',
        'Design "Offline" UI indicators',
        'Use global error boundaries for async code',
        'Log errors to a mock external service'
    ]
  },
  {
    id: 'w5-fri',
    week: 5,
    day: 'Friday',
    type: 'quiz',
    title: 'Async JS Quiz',
    description: 'Testing your knowledge of Promises and APIs.',
    content: [
      { question: 'What does fetch() return?', options: ['JSON', 'A string', 'A Promise', 'An object'], correctAnswer: 2 },
      { question: 'How to handle errors in async/await?', options: ['catch()', 'then()', 'try...catch', 'if...else'], correctAnswer: 2 },
      { question: 'State of a promise after completion?', options: ['pending', 'fulfilled', 'finished', 'done'], correctAnswer: 1 },
      { question: 'What is an API?', options: ['App Programming Interface', 'App Process Info', 'App Program Int', 'None'], correctAnswer: 0 },
      { question: 'Purpose of JSON.stringify?', options: ['Parse JSON', 'Convert to String', 'Convert to Array', 'Delete JSON'], correctAnswer: 1 },
    ],
  },

  // WEEK 6: ES6+ & Modular JS
  {
    id: 'w6-mon',
    week: 6,
    day: 'Monday',
    type: 'assignment',
    title: 'Recipe Search Engine',
    description: 'Build a complex, multi-module application using ES Modules.',
    requirements: [
        'Use ES Modules (import/export) to structure the project',
        'Implement "Favorite Recipes" with persistent state',
        'Use Spoonacular API for data',
        'Implement a custom Spinner component'
    ]
  },
  {
    id: 'w6-tue',
    week: 6,
    day: 'Tuesday',
    type: 'task',
    title: 'Classes & Object Oriented JS',
    description: 'Learn the modern "class" syntax in JS and how it differs from prototypes.',
    requirements: [
        'Create a base class and extend it',
        'Use private fields (#) and getters/setters',
        'Implement static methods',
        'Understand the "new" keyword'
    ]
  },
  {
    id: 'w6-wed',
    week: 6,
    day: 'Wednesday',
    type: 'task',
    title: 'Destructuring & Spread Operator',
    description: 'Write modern, expressive JavaScript.',
    requirements: [
        'Use object destructuring for API data',
        'Use spread operator to merge objects',
        'Implement rest parameters for functions',
        'Refactor old ES5 code into modern syntax'
    ]
  },
  {
    id: 'w6-thu',
    week: 6,
    day: 'Thursday',
    type: 'task',
    title: 'Module Bundlers & Build Tools',
    description: 'Introduction to Vite, Webpack, and why we need them.',
    requirements: [
        'Set up a basic project using Vite',
        'Understand the "dist" folder and production builds',
        'Import CSS and Assets into JS files',
        'Use environment variables (.env)'
    ]
  },
  {
    id: 'w6-fri',
    week: 6,
    day: 'Friday',
    type: 'quiz',
    title: 'ES6+ Quiz',
    description: 'Modern JavaScript features.',
    content: [
      { question: 'Feature to merge arrays?', options: ['merge', 'spread', 'combine', 'plus'], correctAnswer: 1 },
      { question: 'Template literal syntax?', options: ['""', "''", "``", "||"], correctAnswer: 2 },
      { question: 'Arrow function "this" context?', options: ['Global', 'Inherited from parent', 'None', 'Bound to itself'], correctAnswer: 1 },
      { question: 'Keyword for modules?', options: ['require', 'import', 'include', 'fetch'], correctAnswer: 1 },
      { question: 'Default export limit?', options: ['none', 'one per file', 'five', 'ten'], correctAnswer: 1 },
    ],
  },

  // WEEK 7: Introduction to React
  {
    id: 'w7-mon',
    week: 7,
    day: 'Monday',
    type: 'assignment',
    title: 'First React Component Library',
    description: 'Build a library of reusable, atomic components.',
    requirements: [
        'Create Button, Input, Card, and Badge components',
        'Implement component "variants"',
        'Pass data using Props and handle events',
        'Use CSS Modules for scoped styling'
    ]
  },
  {
    id: 'w7-tue',
    week: 7,
    day: 'Tuesday',
    type: 'task',
    title: 'JSX Deep Dive & Rendering Logic',
    description: 'Understand how JSX is converted to JS and how to handle conditional rendering.',
    requirements: [
        'Use ternary operators and logical AND for UI logic',
        'Map through arrays to render lists with keys',
        'Render components based on different state types',
        'Use React Fragments to avoid extra DOM nodes'
    ]
  },
  {
    id: 'w7-wed',
    week: 7,
    day: 'Wednesday',
    type: 'task',
    title: 'React State with useState',
    description: 'Make your UI come alive with reactivity.',
    requirements: [
        'Build a "Counter" with increment/decrement',
        'Implement a "Toggle" switch',
        'Handle complex state (objects) with useState',
        'Demonstrate lifting state up'
    ]
  },
  {
    id: 'w7-thu',
    week: 7,
    day: 'Thursday',
    type: 'task',
    title: 'Forms in React (Controlled Components)',
    description: 'Learn how to handle user input the "React Way".',
    requirements: [
        'Create a controlled input with value and onChange',
        'Handle multi-field forms with a single state object',
        'Implement form submission and prevent default behavior',
        'Add basic validation in the React layer'
    ]
  },
  {
    id: 'w7-fri',
    week: 7,
    day: 'Friday',
    type: 'quiz',
    title: 'React Basics Quiz',
    description: 'Initial React concepts.',
    content: [
      { question: 'What is JSX?', options: ['JS XML', 'Java Syntax', 'JSON X', 'None'], correctAnswer: 0 },
      { question: 'React hook for state?', options: ['useEffect', 'useRef', 'useState', 'useMemo'], correctAnswer: 2 },
      { question: 'How to pass data to children?', options: ['state', 'props', 'params', 'links'], correctAnswer: 1 },
      { question: 'React component naming rule?', options: ['lowercase', 'UPPERCASE', 'PascalCase', 'camelCase'], correctAnswer: 2 },
      { question: 'What triggers a re-render?', options: ['Props change', 'State change', 'Both', 'None'], correctAnswer: 2 },
    ],
  },

  // WEEK 8: React Hooks & Lifecycle
  {
    id: 'w8-mon',
    week: 8,
    day: 'Monday',
    type: 'assignment',
    title: 'GitHub User Finder (React)',
    description: 'Build a production-ready search tool using useEffect.',
    requirements: [
        'Fetch user data on mount and search',
        'Display repositories and followers',
        'Implement a "Debounce" for search',
        'Handle API rate limits and errors'
    ]
  },
  {
    id: 'w8-tue',
    week: 8,
    day: 'Tuesday',
    type: 'task',
    title: 'Mastering the useRef Hook',
    description: 'Learn how to access DOM elements directly and store mutable values without re-renders.',
    requirements: [
        'Focus an input field on mount using ref',
        'Build a "Click Outside" detector',
        'Store a "previous" value of a prop using useRef',
        'Understand when to use Ref vs State'
    ]
  },
  {
    id: 'w8-wed',
    week: 8,
    day: 'Wednesday',
    type: 'task',
    title: 'useEffect Dependency Array',
    description: 'Master the most powerful and misunderstood React hook.',
    requirements: [
        'Implement a timer that starts/stops',
        'Demonstrate effect cleanup',
        'Use dependency array to trigger updates correctly',
        'Prevent infinite re-render loops'
    ]
  },
  {
    id: 'w8-thu',
    week: 8,
    day: 'Thursday',
    type: 'task',
    title: 'Custom Hooks for Reusable Logic',
    description: 'Learn how to extract component logic into reusable functions.',
    requirements: [
        'Create a useFetch custom hook',
        'Create a useLocalStorage hook',
        'Understand the "Rules of Hooks"',
        'Implement a useWindowSize responsive hook'
    ]
  },
  {
    id: 'w8-monthly',
    week: 8,
    day: 'Monthly',
    type: 'grand_test',
    title: 'Month 2 Grand Test',
    description: 'Testing Async JS, ES6+, and React Fundamentals.',
    content: [
        { question: 'Function of useEffect?', options: ['Manage state', 'Handle side effects', 'Navigate', 'Optimize'], correctAnswer: 1 },
        { question: 'What is a Virtual DOM?', options: ['Real DOM copy', 'Lightweight copy', 'Browser tool', 'Backend'], correctAnswer: 1 },
        { question: 'Spread operator symbol?', options: ['...', '***', '&&&', '---'], correctAnswer: 0 },
        { question: 'Async function return type?', options: ['Promise', 'String', 'Object', 'Boolean'], correctAnswer: 0 },
        { question: 'Key prop purpose?', options: ['Styling', 'Identify items', 'Navigation', 'Data'], correctAnswer: 1 },
    ]
  },

  // WEEK 9: Advanced React (State Management)
  {
    id: 'w9-mon',
    week: 9,
    day: 'Monday',
    type: 'assignment',
    title: 'Shopping Cart with Context API',
    description: 'Build a global state architecture to solve prop drilling.',
    requirements: [
        'Create a CartContext for global state',
        'Implement Add, Remove, and Clear actions',
        'Calculate total price in real-time',
        'Persist cart state in LocalStorage'
    ]
  },
  {
    id: 'w9-tue',
    week: 9,
    day: 'Tuesday',
    type: 'task',
    title: 'Performance Optimization: useMemo & useCallback',
    description: 'Learn how to prevent unnecessary calculations and re-renders.',
    requirements: [
        'Optimize a heavy calculation with useMemo',
        'Prevent child re-renders with useCallback and React.memo',
        'Use React DevTools Profiler to identify bottlenecks',
        'Understand when optimization is NOT needed'
    ]
  },
  {
    id: 'w9-wed',
    week: 9,
    day: 'Wednesday',
    type: 'task',
    title: 'useReducer for Complex State',
    description: 'Manage complex state transitions with predictable actions.',
    requirements: [
        'Implement a "Task Manager" using useReducer',
        'Define clear action types',
        'Create a pure reducer function',
        'Compare useReducer with multiple useStates'
    ]
  },
  {
    id: 'w9-thu',
    week: 9,
    day: 'Thursday',
    type: 'task',
    title: 'Portals & Error Boundaries',
    description: 'Advanced React techniques for better UI and stability.',
    requirements: [
        'Use createPortal to render a Modal at the root level',
        'Implement an Error Boundary component to catch UI crashes',
        'Design a fallback UI for when components fail',
        'Learn about the React concurrent features'
    ]
  },
  {
    id: 'w9-fri',
    week: 9,
    day: 'Friday',
    type: 'quiz',
    title: 'Advanced React Quiz',
    description: 'Context and Reducers.',
    content: [
      { question: 'Context API purpose?', options: ['Avoid prop drilling', 'State management', 'Both', 'None'], correctAnswer: 2 },
      { question: 'useReducer arguments?', options: ['state, action', 'reducer, initialValue', 'effect, deps', 'ref'], correctAnswer: 1 },
      { question: 'Provider value prop?', options: ['data', 'value', 'state', 'store'], correctAnswer: 1 },
      { question: 'Is Context a replacement for Redux?', options: ['Yes', 'No', 'Sometimes', 'Always'], correctAnswer: 2 },
      { question: 'Hook to consume Context?', options: ['useContext', 'useProvider', 'useState', 'useRef'], correctAnswer: 0 },
    ],
  },

  // WEEK 10: React Routing
  {
    id: 'w10-mon',
    week: 10,
    day: 'Monday',
    type: 'assignment',
    title: 'Multi-Page Blog with React Router',
    description: 'Create a Single Page Application with multiple routes.',
    requirements: [
        'Set up Home, About, and Blog routes',
        'Implement dynamic routing (/blog/:slug)',
        'Create a "404 Not Found" route',
        'Use nested routes for shared layouts'
    ]
  },
  {
    id: 'w10-tue',
    week: 10,
    day: 'Tuesday',
    type: 'task',
    title: 'Navigation & Protected Routes',
    description: 'Control user access to different parts of your application.',
    requirements: [
        'Implement programmatic navigation with useNavigate',
        'Build a "RequireAuth" wrapper for private routes',
        'Handle "Redirect back" logic after login',
        'Use NavLink for active link styling'
    ]
  },
  {
    id: 'w10-wed',
    week: 10,
    day: 'Wednesday',
    type: 'task',
    title: 'URL Parameters & Search Params',
    description: 'Sync your UI with the URL.',
    requirements: [
        'Extract ID parameters using useParams',
        'Implement filter system using useSearchParams',
        'Update URL without page refreshes',
        'Build Breadcrumbs based on path'
    ]
  },
  {
    id: 'w10-thu',
    week: 10,
    day: 'Thursday',
    type: 'task',
    title: 'Route Loaders & Actions (RR v6.4+)',
    description: 'Learn the modern "data-first" routing approach in React Router.',
    requirements: [
        'Implement a loader to fetch data before rendering',
        'Use useLoaderData in a component',
        'Handle loading states with useNavigation',
        'Implement form actions for data mutations'
    ]
  },
  {
    id: 'w10-fri',
    week: 10,
    day: 'Friday',
    type: 'quiz',
    title: 'Routing Quiz',
    description: 'React Router v6 features.',
    content: [
      { question: 'Hook for navigation?', options: ['useLink', 'useNavigate', 'useHistory', 'useRoute'], correctAnswer: 1 },
      { question: 'Component for links?', options: ['<a>', '<Link>', '<Url>', '<Go>'], correctAnswer: 1 },
      { question: 'Catch-all route path?', options: ['/', '*', '/all', 'none'], correctAnswer: 1 },
      { question: 'Access URL ID?', options: ['useParams', 'useId', 'useLocation', 'useSearch'], correctAnswer: 0 },
      { question: 'Routing type?', options: ['Server-side', 'Client-side', 'Both', 'Database'], correctAnswer: 1 },
    ],
  },

  // WEEK 11: Introduction to Next.js
  {
    id: 'w11-mon',
    week: 11,
    day: 'Monday',
    type: 'assignment',
    title: 'Porting React App to Next.js',
    description: 'Move your React projects into the Next.js App Router.',
    requirements: [
        'Convert file-based routing',
        'Implement root and nested layouts',
        'Add SEO metadata (title, description)',
        'Deploy to Vercel'
    ]
  },
  {
    id: 'w11-tue',
    week: 11,
    day: 'Tuesday',
    type: 'task',
    title: 'Next.js Image & Font Optimization',
    description: 'Use the built-in components to make your site blazing fast.',
    requirements: [
        'Replace <img> with next/image for auto-optimization',
        'Implement Google Fonts via next/font',
        'Analyze LCP improvement',
        'Use local images with blur placeholders'
    ]
  },
  {
    id: 'w11-wed',
    week: 11,
    day: 'Wednesday',
    type: 'task',
    title: 'Server vs Client Components',
    description: 'Master the hybrid model.',
    requirements: [
        'Identify Server-only components',
        'Implement interactivity with "use client"',
        'Pass data across the serialization boundary',
        'Understand the component tree rules'
    ]
  },
  {
    id: 'w11-thu',
    week: 11,
    day: 'Thursday',
    type: 'task',
    title: 'Next.js Routing Patterns',
    description: 'Learn about Parallel Routes, Intercepting Routes, and Dynamic Segments.',
    requirements: [
        'Create a dynamic route [id]',
        'Implement a loading.tsx and error.tsx for a route',
        'Build a Modal using Intercepting Routes (@modal)',
        'Understand the "Catch-all" [...slug] syntax'
    ]
  },
  {
    id: 'w11-fri',
    week: 11,
    day: 'Friday',
    type: 'quiz',
    title: 'Next.js Basics Quiz',
    description: 'App Router fundamentals.',
    content: [
      { question: 'Default component type?', options: ['Client', 'Server', 'Static', 'Dynamic'], correctAnswer: 1 },
      { question: 'Special file for routes?', options: ['route.js', 'page.tsx', 'index.html', 'main.js'], correctAnswer: 1 },
      { question: 'Directive for interactive components?', options: ['"use interactivity"', '"use browser"', '"use client"', '"use react"'], correctAnswer: 2 },
      { question: 'Next.js advantage?', options: ['SEO', 'Performance', 'Developer Experience', 'All of the above'], correctAnswer: 3 },
      { question: 'Folder for routing?', options: ['pages', 'app', 'routes', 'src'], correctAnswer: 1 },
    ],
  },

  // WEEK 12: Next.js Data Fetching
  {
    id: 'w12-mon',
    week: 12,
    day: 'Monday',
    type: 'assignment',
    title: 'SEO-Optimized Movie Database',
    description: 'Build a high-performance media site with perfect SEO.',
    requirements: [
        'Fetch movie data on server',
        'Implement dynamic detail pages',
        'Add Suspense boundaries',
        'Generate dynamic metadata'
    ]
  },
  {
    id: 'w12-tue',
    week: 12,
    day: 'Tuesday',
    type: 'task',
    title: 'Static Site Generation (SSG) & Pre-rendering',
    description: 'Learn how to generate pages at build time for maximum speed.',
    requirements: [
        'Use generateStaticParams to pre-render dynamic routes',
        'Understand the difference between SSG and SSR',
        'Optimize build times with parallel fetching',
        'Implement fallback pages for non-generated routes'
    ]
  },
  {
    id: 'w12-wed',
    week: 12,
    day: 'Wednesday',
    type: 'task',
    title: 'Revalidation & Caching',
    description: 'Control the freshness of your data.',
    requirements: [
        'Implement Time-based Revalidation',
        'Use fetch cache options',
        'Demonstrate on-demand revalidation',
        'Implement custom loading.tsx'
    ]
  },
  {
    id: 'w12-thu',
    week: 12,
    day: 'Thursday',
    type: 'task',
    title: 'API Routes in Next.js (Route Handlers)',
    description: 'Learn how to build internal APIs within your Next.js application.',
    requirements: [
        'Create a GET handler in route.ts',
        'Handle POST requests and JSON bodies',
        'Implement dynamic route handlers',
        'Apply basic middleware for API security'
    ]
  },
  {
    id: 'w12-monthly',
    week: 12,
    day: 'Monthly',
    type: 'grand_test',
    title: 'Month 3 Grand Test',
    description: 'Comprehensive React & Next.js assessment.',
    content: [
        { question: 'Primary benefit of SSR?', options: ['Better SEO', 'Less JS', 'Faster first paint', 'All'], correctAnswer: 3 },
        { question: 'File for layouts?', options: ['page.tsx', 'layout.tsx', 'main.tsx', 'app.tsx'], correctAnswer: 1 },
        { question: 'Caching strategy?', options: ['Fetch cache', 'ISR', 'Manual', 'None'], correctAnswer: 1 },
        { question: 'What is Hydration?', options: ['Loading CSS', 'Making static HTML interactive', 'Database sync', 'None'], correctAnswer: 1 },
        { question: 'Link component from?', options: ['next/router', 'next/link', 'react-router', 'html'], correctAnswer: 1 },
    ]
  },

  // WEEK 13: Styling in Next.js
  {
    id: 'w13-mon',
    week: 13,
    day: 'Monday',
    type: 'assignment',
    title: 'SaaS Landing Page with Tailwind',
    description: 'Design a world-class SaaS landing page.',
    requirements: [
        'Implement responsive bento grid',
        'Use arbitrary values for precision',
        'Create complex gradients',
        'Implement dark mode'
    ]
  },
  {
    id: 'w13-tue',
    week: 13,
    day: 'Tuesday',
    type: 'task',
    title: 'Tailwind Plugins & Configurations',
    description: 'Learn how to extend Tailwind with custom themes and official plugins.',
    requirements: [
        'Install and use @tailwindcss/typography',
        'Extend tailwind.config.js with custom colors and fonts',
        'Create reusable "component" classes with @apply',
        'Use container queries for modern responsiveness'
    ]
  },
  {
    id: 'w13-wed',
    week: 13,
    day: 'Wednesday',
    type: 'task',
    title: 'Framer Motion Animations',
    description: 'Add "soul" to your UI with professional animations.',
    requirements: [
        'Implement AnimatePresence',
        'Create scroll-linked animations',
        'Animate layoutId transitions',
        'Handle reduced-motion preferences'
    ]
  },
  {
    id: 'w13-thu',
    week: 13,
    day: 'Thursday',
    type: 'task',
    title: 'Shadcn/UI & Component Architecture',
    description: 'Learn how to build high-quality UIs fast using copy-pasteable components.',
    requirements: [
        'Set up shadcn/ui in a Next.js project',
        'Customize a component (e.g., Dialog or Button)',
        'Understand the Radix UI primitives underneath',
        'Implement a complex form using shadcn components'
    ]
  },
  {
    id: 'w13-fri',
    week: 13,
    day: 'Friday',
    type: 'quiz',
    title: 'Styling & UX Quiz',
    description: 'Tailwind and Animations.',
    content: [
      { question: 'Tailwind utility for flex?', options: ['display-flex', 'flex', 'box-flex', 'd-flex'], correctAnswer: 1 },
      { question: 'Framer Motion component?', options: ['<motion.div>', '<animate.div>', '<div motion>', '<fade>'], correctAnswer: 0 },
      { question: 'Tailwind arbitrary value?', options: ['w-[10px]', 'w-10px', 'w(10px)', 'w{10px}'], correctAnswer: 0 },
      { question: 'Responsiveness prefix?', options: ['md:', 'lg:', 'sm:', 'All'], correctAnswer: 3 },
      { question: 'Main config file?', options: ['tailwind.config.js', 'styles.css', 'app.css', 'config.json'], correctAnswer: 0 },
    ],
  },

  // WEEK 14: Authentication with Supabase
  {
    id: 'w14-mon',
    week: 14,
    day: 'Monday',
    type: 'assignment',
    title: 'User Authentication System',
    description: 'Secure your app with Supabase and Next.js.',
    requirements: [
        'Implement Email/Password signup',
        'Integrate Google/GitHub OAuth',
        'Manage session persistence',
        'Create Profile update page'
    ]
  },
  {
    id: 'w14-tue',
    week: 14,
    day: 'Tuesday',
    type: 'task',
    title: 'Passwordless Auth & Magic Links',
    description: 'Improve UX by implementing magic link login and password reset flows.',
    requirements: [
        'Set up Supabase Magic Link auth',
        'Handle auth callback routes',
        'Implement "Forgot Password" flow',
        'Understand JWT and Refresh Token rotation'
    ]
  },
  {
    id: 'w14-wed',
    week: 14,
    day: 'Wednesday',
    type: 'task',
    title: 'Protected Routes',
    description: 'Protect sensitive data using Middleware and Server Components.',
    requirements: [
        'Write Middleware for redirects',
        'Implement server-side auth checks',
        'Conditional navigation links',
        'Secure API route handlers'
    ]
  },
  {
    id: 'w14-thu',
    week: 14,
    day: 'Thursday',
    type: 'task',
    title: 'Role-Based Access Control (RBAC)',
    description: 'Learn how to handle different user roles (e.g., Admin vs Student).',
    requirements: [
        'Extend profiles table with a "role" column',
        'Protect routes based on user role',
        'Implement UI-level role checks',
        'Understand Row Level Security (RLS) for roles'
    ]
  },
  {
    id: 'w14-fri',
    week: 14,
    day: 'Friday',
    type: 'quiz',
    title: 'Auth Quiz',
    description: 'Security and Auth patterns.',
    content: [
      { question: 'What is JWT?', options: ['Java Web Tool', 'JSON Web Token', 'Joint Web Task', 'None'], correctAnswer: 1 },
      { question: 'Supabase auth hook?', options: ['useAuth', 'useUser', 'useSupabase', 'None'], correctAnswer: 1 },
      { question: 'Where to store sensitive keys?', options: ['GitHub', '.env', 'public folder', 'In code'], correctAnswer: 1 },
      { question: 'Middleware purpose?', options: ['Styling', 'Run code before request', 'Database sync', 'None'], correctAnswer: 1 },
      { question: 'Social Login name?', options: ['OAuth', 'SocialAuth', 'SafeLogin', 'SAML'], correctAnswer: 0 },
    ],
  },

  // WEEK 15: Database Design & Relationships
  {
    id: 'w15-mon',
    week: 15,
    day: 'Monday',
    type: 'assignment',
    title: 'Fullstack Task Manager',
    description: 'Build a relational app with a Postgres schema.',
    requirements: [
        'Design 1-to-Many (User -> Projects)',
        'Design Many-to-Many (Projects -> Tasks)',
        'Implement CRUD via Supabase SDK',
        'Handle Cascade Deletes'
    ]
  },
  {
    id: 'w15-tue',
    week: 15,
    day: 'Tuesday',
    type: 'task',
    title: 'Database Normalization & Indexing',
    description: 'Learn how to structure data for scale and optimize for query speed.',
    requirements: [
        'Understand 1NF, 2NF, and 3NF',
        'Create indexes for frequently searched columns',
        'Use Explain Analyze to profile queries',
        'Handle data redundancy professionally'
    ]
  },
  {
    id: 'w15-wed',
    week: 15,
    day: 'Wednesday',
    type: 'task',
    title: 'Relational Queries',
    description: 'Fetch data like a senior engineer.',
    requirements: [
        'Perform nested fetches',
        'Server-side filtering and sorting',
        'Use Postgres Views/RPC',
        'Optimize query performance'
    ]
  },
  {
    id: 'w15-thu',
    week: 15,
    day: 'Thursday',
    type: 'task',
    title: 'Postgres Triggers & Functions',
    description: 'Automate database tasks using PL/pgSQL.',
    requirements: [
        'Create a trigger to update "updated_at" timestamps',
        'Write a function to calculate complex aggregates',
        'Implement a basic notification system via triggers',
        'Understand the security of Database Functions'
    ]
  },
  {
    id: 'w15-fri',
    week: 15,
    day: 'Friday',
    type: 'quiz',
    title: 'Database Quiz',
    description: 'SQL and Postgres fundamentals.',
    content: [
      { question: 'SQL command to get data?', options: ['GET', 'SELECT', 'FIND', 'FETCH'], correctAnswer: 1 },
      { question: 'Link between tables?', options: ['Key', 'Foreign Key', 'Connector', 'Bridge'], correctAnswer: 1 },
      { question: 'Postgres type?', options: ['NoSQL', 'Relational', 'Graph', 'Document'], correctAnswer: 1 },
      { question: 'Query for updates?', options: ['UPDATE', 'SET', 'CHANGE', 'PATCH'], correctAnswer: 0 },
      { question: 'Unique identifier?', options: ['Primary Key', 'Super Key', 'Main Key', 'Index'], correctAnswer: 0 },
    ],
  },

  // WEEK 16: File Storage & Server Actions
  {
    id: 'w16-mon',
    week: 16,
    day: 'Monday',
    type: 'assignment',
    title: 'Instagram Clone (Image Upload)',
    description: 'Handle binary data with Supabase Buckets.',
    requirements: [
        'Upload to Buckets',
        'Generate public URLs',
        'Client-side resizing/preview',
        'Store metadata in DB'
    ]
  },
  {
    id: 'w16-tue',
    week: 16,
    day: 'Tuesday',
    type: 'task',
    title: 'Advanced Storage: Private Buckets & Downloads',
    description: 'Learn how to handle sensitive files that shouldn\'t be public.',
    requirements: [
        'Set up a Private Bucket with RLS',
        'Generate Signed URLs for temporary access',
        'Implement a download manager UI',
        'Handle file type and size restrictions'
    ]
  },
  {
    id: 'w16-wed',
    week: 16,
    day: 'Wednesday',
    type: 'task',
    title: 'Server Actions for Form Submission',
    description: 'Use the modern Next.js way to handle mutations.',
    requirements: [
        'Create Server Action for submission',
        'Use useFormStatus for loading',
        'Use useFormState for validation',
        'Revalidate paths after mutation'
    ]
  },
  {
    id: 'w16-thu',
    week: 16,
    day: 'Thursday',
    type: 'task',
    title: 'Real-time Subscriptions with Supabase',
    description: 'Make your app feel alive with instant updates.',
    requirements: [
        'Enable Realtime on a table',
        'Subscribe to INSERT and UPDATE events',
        'Update local state dynamically',
        'Handle presence (who is online)'
    ]
  },
  {
    id: 'w16-monthly',
    week: 16,
    day: 'Monthly',
    type: 'grand_test',
    title: 'Month 4 Grand Test',
    description: 'Fullstack Next.js and Supabase assessment.',
    content: [
        { question: 'Directive for Server Actions?', options: ['"use server"', '"use action"', '"use api"', 'none'], correctAnswer: 0 },
        { question: 'Supabase Storage type?', options: ['Bucket', 'Folder', 'Database', 'Cache'], correctAnswer: 0 },
        { question: 'How to prevent SQL injection in Supabase?', options: ['Use SDK', 'Manual escaping', 'Disable DB', 'None'], correctAnswer: 0 },
        { question: 'Server Action benefit?', options: ['Zero-JS forms', 'Better security', 'Simple code', 'All'], correctAnswer: 3 },
        { question: 'Database trigger purpose?', options: ['Run code on DB event', 'Fast search', 'Styling', 'Auth'], correctAnswer: 0 },
    ]
  },

  // WEEK 17: State Management (TanStack Query)
  {
    id: 'w17-mon',
    week: 17,
    day: 'Monday',
    type: 'assignment',
    title: 'Real-time Chat with TanStack Query',
    description: 'Build a real-time, resilient chat app using TanStack Query.',
    requirements: [
        'useQuery for history',
        'useMutation for sending',
        'Supabase Realtime integration',
        'Infinite Scroll for messages'
    ]
  },
  {
    id: 'w17-tue',
    week: 17,
    day: 'Tuesday',
    type: 'task',
    title: 'Query Invalidation & Prefetching',
    description: 'Learn how to keep your data fresh and predict user movements.',
    requirements: [
        'Invalidate queries after mutations',
        'Prefetch data on hover',
        'Handle background refetching',
        'Design a robust caching strategy'
    ]
  },
  {
    id: 'w17-wed',
    week: 17,
    day: 'Wednesday',
    type: 'task',
    title: 'Optimistic Updates',
    description: 'Create "Instant" UIs by updating state before the server responds.',
    requirements: [
        'Optimistic "Like" mutation',
        'Handle rollback on error',
        'Invalidate to sync with server',
        'Manage global cache config'
    ]
  },
  {
    id: 'w17-thu',
    week: 17,
    day: 'Thursday',
    type: 'task',
    title: 'Zustand for Simple Global State',
    description: 'Learn the lightweight alternative to Redux and Context.',
    requirements: [
        'Create a global store with Zustand',
        'Implement actions and derived state',
        'Use persist middleware for LocalStorage',
        'Compare with Context API'
    ]
  },
  {
    id: 'w17-fri',
    week: 17,
    day: 'Friday',
    type: 'quiz',
    title: 'TanStack Query Quiz',
    description: 'Efficient data fetching.',
    content: [
      { question: 'Primary feature?', options: ['Caching', 'Styling', 'Routing', 'Auth'], correctAnswer: 0 },
      { question: 'Hook for fetching?', options: ['useFetch', 'useQuery', 'useData', 'useGet'], correctAnswer: 1 },
      { question: 'Hook for mutations?', options: ['useMutation', 'useUpdate', 'useChange', 'useAction'], correctAnswer: 0 },
      { question: 'What is "staleTime"?', options: ['Time before data is old', 'Fetch time', 'Loading time', 'None'], correctAnswer: 0 },
      { question: 'Advantage?', options: ['Auto-refetch', 'Caching', 'Loading states', 'All'], correctAnswer: 3 },
    ],
  },

  // WEEK 18: Testing in Next.js
  {
    id: 'w18-mon',
    week: 18,
    day: 'Monday',
    type: 'assignment',
    title: 'Unit Testing with Vitest',
    description: 'Write bulletproof code with unit tests.',
    requirements: [
        'Unit tests for utilities',
        'Test components with RTL',
        'Mock external dependencies',
        '80% test coverage goal'
    ]
  },
  {
    id: 'w18-tue',
    week: 18,
    day: 'Tuesday',
    type: 'task',
    title: 'Integration Testing: Testing the Flow',
    description: 'Learn how to test how different parts of your app work together.',
    requirements: [
        'Test a multi-step form flow',
        'Mock Supabase responses for integration tests',
        'Use MSW (Mock Service Worker) for API mocking',
        'Handle async rendering in tests'
    ]
  },
  {
    id: 'w18-wed',
    week: 18,
    day: 'Wednesday',
    type: 'task',
    title: 'E2E Testing with Playwright',
    description: 'Automate the browser to test the happy path.',
    requirements: [
        'Login -> Dashboard -> Logout flow',
        'Test responsive viewports',
        'Use Playwright Codegen',
        'Visual regression testing'
    ]
  },
  {
    id: 'w18-thu',
    week: 18,
    day: 'Thursday',
    type: 'task',
    title: 'Continuous Integration (CI) Testing',
    description: 'Run your tests automatically on every GitHub push.',
    requirements: [
        'Create a GitHub Action for testing',
        'Run Vitest and Playwright in CI',
        'Configure parallel test execution',
        'Fail builds on test regression'
    ]
  },
  {
    id: 'w18-fri',
    week: 18,
    day: 'Friday',
    type: 'quiz',
    title: 'Testing Quiz',
    description: 'QA and Testing patterns.',
    content: [
      { question: 'What is E2E testing?', options: ['End to End', 'Easy to Edit', 'Element to Element', 'None'], correctAnswer: 0 },
      { question: 'Tool for Unit tests?', options: ['Vitest', 'Postman', 'Vercel', 'Next'], correctAnswer: 0 },
      { question: 'Testing Library goal?', options: ['Test implementation', 'Test user behavior', 'Test speed', 'Test colors'], correctAnswer: 1 },
      { question: 'What is "Mocking"?', options: ['Simulating data', 'Making fun of code', 'Deleting tests', 'None'], correctAnswer: 0 },
      { question: 'Test coverage meaning?', options: ['% of code tested', 'How many tests', 'Speed of tests', 'None'], correctAnswer: 0 },
    ],
  },

  // WEEK 19: Performance Optimization
  {
    id: 'w19-mon',
    week: 19,
    day: 'Monday',
    type: 'assignment',
    title: 'Optimizing LCP and CLS',
    description: 'Achieve a "Perfect 100" Lighthouse score.',
    requirements: [
        'Optimize images via next/image',
        'Implement Font Optimization',
        'Analyze bundle with @next/bundle-analyzer',
        'Optimize third-party scripts'
    ]
  },
  {
    id: 'w19-tue',
    week: 19,
    day: 'Tuesday',
    type: 'task',
    title: 'Advanced Caching: Edge Runtime & Redis',
    description: 'Learn how to store data at the edge for millisecond responses.',
    requirements: [
        'Implement Upstash Redis for global caching',
        'Use the Next.js Edge Runtime',
        'Understand Stale-While-Revalidate (SWR) at the edge',
        'Optimize for global users'
    ]
  },
  {
    id: 'w19-wed',
    week: 19,
    day: 'Wednesday',
    type: 'task',
    title: 'Dynamic Imports & Code Splitting',
    description: 'Ship less JavaScript to your users.',
    requirements: [
        'dynamic() imports for heavy libs',
        'Create Skeleton loaders',
        'Optimize initial JS payload',
        'Use Streaming with Suspense'
    ]
  },
  {
    id: 'w19-thu',
    week: 19,
    day: 'Thursday',
    type: 'task',
    title: 'Memoization & Rendering Loops',
    description: 'Deep dive into React\'s rendering engine to fix performance bugs.',
    requirements: [
        'Fix an infinite re-render bug',
        'Optimize a flat list with thousands of items (Virtualization)',
        'Measure component "wasted" renders',
        'Understand "Transitional" vs "Permanent" state'
    ]
  },
  {
    id: 'w19-fri',
    week: 19,
    day: 'Friday',
    type: 'quiz',
    title: 'Performance Quiz',
    description: 'Core Web Vitals and speed.',
    content: [
      { question: 'LCP stands for?', options: ['Largest Contentful Paint', 'Low Color Point', 'Large Code Path', 'None'], correctAnswer: 0 },
      { question: 'Component for image optimization?', options: ['<img>', '<NextImage>', '<Image>', '<Optimized>'], correctAnswer: 2 },
      { question: 'How to reduce bundle size?', options: ['Code splitting', 'Less CSS', 'Delete comments', 'None'], correctAnswer: 0 },
      { question: 'What is CLS?', options: ['Cumulative Layout Shift', 'Color Level Scale', 'Code Line Stop', 'None'], correctAnswer: 0 },
      { question: 'What does "priority" do on Image?', options: ['Preloads it', 'Deletes it', 'Resizes it', 'None'], correctAnswer: 0 },
    ],
  },

  // WEEK 20: Advanced API Patterns
  {
    id: 'w20-mon',
    week: 20,
    day: 'Monday',
    type: 'assignment',
    title: 'Building a RESTful API with Next.js',
    description: 'Build a public-facing API with security and documentation.',
    requirements: [
        'CRUD Route Handlers',
        'API Token authentication',
        'Rate Limiting via Upstash',
        'API documentation (README)'
    ]
  },
  {
    id: 'w20-tue',
    week: 20,
    day: 'Tuesday',
    type: 'task',
    title: 'Webhooks & External Integrations',
    description: 'Learn how to receive data from other services like Stripe or GitHub.',
    requirements: [
        'Set up a webhook listener route',
        'Verify webhook signatures (HMAC)',
        'Handle asynchronous background processing',
        'Design a "Webhook Dashboard" for logs'
    ]
  },
  {
    id: 'w20-wed',
    week: 20,
    day: 'Wednesday',
    type: 'task',
    title: 'GraphQL Basics',
    description: 'Learn the alternative to REST and how to fetch exactly what you need.',
    requirements: [
        'Write complex GraphQL queries',
        'Understand Queries vs Fragments',
        'Explore schema via Apollo',
        'Understand over-fetching solutions'
    ]
  },
  {
    id: 'w20-thu',
    week: 20,
    day: 'Thursday',
    type: 'task',
    title: 'Building a tRPC API',
    description: 'Experience the magic of end-to-end type safety between frontend and backend.',
    requirements: [
        'Set up tRPC in a Next.js project',
        'Define a procedure and its input schema (Zod)',
        'Call the procedure from a React component',
        'Understand why tRPC beats REST for internal APIs'
    ]
  },
  {
    id: 'w20-monthly',
    week: 20,
    day: 'Monthly',
    type: 'grand_test',
    title: 'Month 5 Grand Test',
    description: 'Testing Performance, QA, and Advanced API design.',
    content: [
        { question: 'HTTP method for updating?', options: ['POST', 'PUT/PATCH', 'GET', 'DELETE'], correctAnswer: 1 },
        { question: 'Advantage of GraphQL?', options: ['No over-fetching', 'Faster', 'Easier', 'Older'], correctAnswer: 0 },
        { question: 'Rate limiting purpose?', options: ['Security/Prevention', 'Speed', 'Pricing', 'None'], correctAnswer: 0 },
        { question: 'Status code for "Not Found"?', options: ['200', '404', '500', '403'], correctAnswer: 1 },
        { question: 'What is a Webhook?', options: ['Server-to-server callback', 'API call', 'Frontend tool', 'None'], correctAnswer: 0 },
    ]
  },

  // WEEK 21: TypeScript Mastery
  {
    id: 'w21-mon',
    week: 21,
    day: 'Monday',
    type: 'assignment',
    title: 'Converting JS Project to TS',
    description: 'Add full type safety to your workflow.',
    requirements: [
        'Migrate JS to TS without "any"',
        'Interfaces for API data',
        'Enable "Strict Mode"',
        'Type definitions for external libs'
    ]
  },
  {
    id: 'w21-tue',
    week: 21,
    day: 'Tuesday',
    type: 'task',
    title: 'Advanced Types: Unions & Intersections',
    description: 'Learn how to model complex data structures with TypeScript.',
    requirements: [
        'Use Discriminated Unions for state management',
        'Implement type guards using "typeof" and "instanceof"',
        'Combine types using Intersections (&)',
        'Understand the "never" and "void" types'
    ]
  },
  {
    id: 'w21-wed',
    week: 21,
    day: 'Wednesday',
    type: 'task',
    title: 'Generics & Utility Types',
    description: 'Write flexible but safe code.',
    requirements: [
        'Generic Table component',
        'Partial, Omit, and Pick usage',
        'Conditional Types logic',
        'Type-safe API wrapper'
    ]
  },
  {
    id: 'w21-thu',
    week: 21,
    day: 'Thursday',
    type: 'task',
    title: 'Zod & Schema Validation',
    description: 'Sync your TypeScript types with runtime validation.',
    requirements: [
        'Define a Zod schema for a complex form',
        'Infer TypeScript types from Zod schemas',
        'Validate API responses at runtime',
        'Integrate Zod with React Hook Form'
    ]
  },
  {
    id: 'w21-fri',
    week: 21,
    day: 'Friday',
    type: 'quiz',
    title: 'TypeScript Quiz',
    description: 'Types, Interfaces, and Generics.',
    content: [
      { question: 'Difference between Type and Interface?', options: ['Types can do unions', 'Interfaces are better for objects', 'Both', 'None'], correctAnswer: 2 },
      { question: 'Generic syntax?', options: ['<T>', '[T]', '{T}', '(T)'], correctAnswer: 0 },
      { question: 'What is "unknown"?', options: ['Type-safe "any"', 'Error', 'Same as any', 'Nothing'], correctAnswer: 0 },
      { question: 'Utility type for partial object?', options: ['Partial<T>', 'Pick<T>', 'Omit<T>', 'Select<T>'], correctAnswer: 0 },
      { question: 'What is an "Enum"?', options: ['Named constants', 'Error', 'Type of list', 'None'], correctAnswer: 0 },
    ],
  },

  // WEEK 22: Deployment & DevOps
  {
    id: 'w22-mon',
    week: 22,
    day: 'Monday',
    type: 'assignment',
    title: 'CI/CD Pipeline with GitHub Actions',
    description: 'Automate your releases with a production-grade pipeline.',
    requirements: [
        'Write .github/workflows/main.yml',
        'Automate Vitest on PR',
        'Branch Protection rules',
        'Slack/Discord notifications'
    ]
  },
  {
    id: 'w22-tue',
    week: 22,
    day: 'Tuesday',
    type: 'task',
    title: 'Dockerizing your Next.js App',
    description: 'Learn how to containerize your application for consistent deployments anywhere.',
    requirements: [
        'Write a multi-stage Dockerfile',
        'Understand Docker Images and Containers',
        'Use Docker Compose for local development with a DB',
        'Optimize Docker image size'
    ]
  },
  {
    id: 'w22-wed',
    week: 22,
    day: 'Wednesday',
    type: 'task',
    title: 'Custom Domain & SSL',
    description: 'Go live professionally.',
    requirements: [
        'Custom domain on Vercel',
        'Environment Variables config',
        'DNS records (CNAME, A)',
        'Production logging'
    ]
  },
  {
    id: 'w22-thu',
    week: 22,
    day: 'Thursday',
    type: 'task',
    title: 'Serverless Functions & Cold Starts',
    description: 'Understand the underlying architecture of Vercel and AWS Lambda.',
    requirements: [
        'Monitor serverless function execution times',
        'Optimize cold starts by reducing bundle size',
        'Understand the limitations of Serverless',
        'Deploy a standalone Node.js server for comparison'
    ]
  },
  {
    id: 'w22-fri',
    week: 22,
    day: 'Friday',
    type: 'quiz',
    title: 'DevOps Quiz',
    description: 'Deployment and CI/CD concepts.',
    content: [
      { question: 'CI stands for?', options: ['Continuous Integration', 'Code Info', 'Cloud Int', 'None'], correctAnswer: 0 },
      { question: 'CD stands for?', options: ['Continuous Deployment', 'Code Delivery', 'Both', 'None'], correctAnswer: 2 },
      { question: 'What is a "Docker"?', options: ['Container tool', 'Code editor', 'Database', 'None'], correctAnswer: 0 },
      { question: 'Env variables purpose?', options: ['Secrets', 'Styling', 'Speed', 'None'], correctAnswer: 0 },
      { question: 'What is "Linting"?', options: ['Static code analysis', 'Testing', 'Deployment', 'None'], correctAnswer: 0 },
    ],
  },

  // WEEK 23: Final Project Kickoff
  {
    id: 'w23-mon',
    week: 23,
    day: 'Monday',
    type: 'assignment',
    title: 'Final Project Proposal',
    description: 'Submit your capstone professional SaaS application plan.',
    requirements: [
        'Figma design prototype',
        'Database Schema (ERD)',
        'Technical Specification doc',
        'MVP features roadmap'
    ]
  },
  {
    id: 'w23-tue',
    week: 23,
    day: 'Tuesday',
    type: 'task',
    title: 'Project Setup & Scaffolding',
    description: 'Initialize your repository and set up all the tools you\'ll need.',
    requirements: [
        'Initialize a clean Next.js 14+ project',
        'Configure ESLint, Prettier, and Husky',
        'Set up the Supabase project and local dev',
        'Define the initial folder structure'
    ]
  },
  {
    id: 'w23-wed',
    week: 23,
    day: 'Wednesday',
    type: 'task',
    title: 'Architecture Review',
    description: 'Ensure your foundation is solid.',
    requirements: [
        'Choose State Management',
        'Plan Auth and RLS strategy',
        'Identify performance bottlenecks',
        'Select UI library'
    ]
  },
  {
    id: 'w23-thu',
    week: 23,
    day: 'Thursday',
    type: 'task',
    title: 'Database Implementation Phase',
    description: 'Build your entire Postgres schema and migrate your data.',
    requirements: [
        'Create all tables and relationships',
        'Apply Row Level Security (RLS) policies',
        'Seed the database with mock data',
        'Write complex views for the dashboard'
    ]
  },
  {
    id: 'w23-fri',
    week: 23,
    day: 'Friday',
    type: 'quiz',
    title: 'Final Knowledge Check',
    description: 'Mix of all topics.',
    content: [
      { question: 'Best practice for passwords?', options: ['Hash them', 'Plain text', 'Encode', 'None'], correctAnswer: 0 },
      { question: 'Next.js rendering for dashboards?', options: ['Client-side', 'SSR', 'ISR', 'None'], correctAnswer: 0 },
      { question: 'Primary key goal?', options: ['Uniqueness', 'Speed', 'Order', 'None'], correctAnswer: 0 },
      { question: 'Git command for changes?', options: ['commit', 'add', 'push', 'pull'], correctAnswer: 0 },
      { question: 'What is a "Pull Request"?', options: ['Code review request', 'Download code', 'Delete code', 'None'], correctAnswer: 0 },
    ],
  },

  // WEEK 24: Final Project Completion
  {
    id: 'w24-mon',
    week: 24,
    day: 'Monday',
    type: 'final_project',
    title: 'Final Capstone Project',
    description: 'Build a full-featured, professional SaaS application.',
    requirements: [
        'Full Auth and Profiles',
        'Relational DB with queries',
        'File storage',
        'Optimized for Performance'
    ]
  },
  {
    id: 'w24-tue',
    week: 24,
    day: 'Tuesday',
    type: 'task',
    title: 'Final Integration & Polish',
    description: 'The final push to make everything work perfectly together.',
    requirements: [
        'Connect all frontend modules to the backend',
        'Implement global loading and error handling',
        'Optimize for mobile responsiveness',
        'Run a full security audit'
    ]
  },
  {
    id: 'w24-wed',
    week: 24,
    day: 'Wednesday',
    type: 'task',
    title: 'Final Bug Bash',
    description: 'Polish and refine for production.',
    requirements: [
        'Zero console errors',
        'Fully responsive',
        'Complete test coverage',
        'Professional README'
    ]
  },
  {
    id: 'w24-thu',
    week: 24,
    day: 'Thursday',
    type: 'task',
    title: 'SEO & Launch Readiness',
    description: 'Prepare your app for the real world.',
    requirements: [
        'Verify OpenGraph and Twitter cards',
        'Submit sitemap to Google Search Console',
        'Check Lighthouse scores (aim for 90+)',
        'Configure production analytics'
    ]
  },
  {
    id: 'w24-final',
    week: 24,
    day: 'Final',
    type: 'final_project',
    title: 'Course Graduation',
    description: 'Present your masterpiece and receive certification.',
    requirements: [
        'Live demonstration',
        'Technical walkthrough',
        'Q&A with professionals',
        'Certificate award'
    ]
  },
];
