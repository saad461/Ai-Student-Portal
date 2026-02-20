export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface CurriculumItem {
  id: string;
  week: number;
  day: 'Monday' | 'Wednesday' | 'Friday' | 'Monthly' | 'Final';
  type: 'assignment' | 'task' | 'quiz' | 'grand_test' | 'final_project';
  title: string;
  description: string;
  requirements?: string[];
  content?: QuizQuestion[] | string[];
}

export const CURRICULUM: CurriculumItem[] = [
  // WEEK 1: Foundations of the Web
  {
    id: 'w1-mon',
    week: 1,
    day: 'Monday',
    type: 'assignment',
    title: 'Semantic HTML & Personal Portfolio Structure',
    description: 'Create a multi-page website structure using only semantic HTML5 tags. This project focuses on the skeleton of a professional portfolio, ensuring high accessibility and SEO readiness.',
    requirements: [
        'Use at least 10 different semantic HTML5 tags (header, nav, main, section, article, etc.)',
        'Implement a contact form with at least 5 different input types and proper labels',
        'Create a navigation system between three separate HTML files',
        'Ensure 100% Lighthouse accessibility score for the structure'
    ]
  },
  {
    id: 'w1-wed',
    week: 1,
    day: 'Wednesday',
    type: 'task',
    title: 'CSS Box Model & Flexbox Mastery',
    description: 'Build a responsive navigation bar and a 3-column feature section using Flexbox. Focus on precise spacing and understanding how elements behave within the flow.',
    requirements: [
        'Implement a "sticky" header that stays at the top on scroll',
        'Create a 3-column feature section that stacks vertically on mobile devices',
        'Demonstrate understanding of justify-content, align-items, and flex-grow',
        'Use the "box-sizing: border-box" property globally'
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
    description: 'Design a complex magazine-style layout using CSS Grid. This project challenges you to create non-linear layouts that are elegant and responsive.',
    requirements: [
        'Use grid-template-areas to define the page layout',
        'Implement a responsive grid using minmax() and auto-fill/auto-fit',
        'Create a "hero" section with an overlaying text element',
        'Zero media queries used for the primary grid structure'
    ]
  },
  {
    id: 'w2-wed',
    week: 2,
    day: 'Wednesday',
    type: 'task',
    title: 'CSS Variables & Dark Mode Toggle',
    description: 'Implement a theme switching system using CSS variables. Learn how to manage design tokens like a professional engineer.',
    requirements: [
        'Define a set of at least 5 CSS variables for colors and spacing',
        'Implement a manual toggle that switches the --theme-bg and --theme-text variables',
        'Ensure the toggle state is visually indicated',
        'Apply smooth CSS transitions for theme changes'
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
    description: 'Build a high-performance Todo list. This project is the first step in learning state management and browser storage.',
    requirements: [
        'Functionality: Create, Read, Update (toggle), and Delete todos',
        'Persist data in LocalStorage so it survives page refreshes',
        'Implement filters (All, Active, Completed)',
        'Use clean, modular JavaScript functions'
    ]
  },
  {
    id: 'w3-wed',
    week: 3,
    day: 'Wednesday',
    type: 'task',
    title: 'Array Methods & Data Manipulation',
    description: 'Handle data like a pro. Use higher-order functions to transform a raw dataset into meaningful information.',
    requirements: [
        'Use .filter() to extract specific users from a mock dataset',
        'Use .reduce() to calculate aggregate statistics (e.g., total revenue)',
        'Use .sort() to order data by multiple criteria',
        'Implement a search function using .includes()'
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
    description: 'Create an engine that renders quizzes dynamically. This project bridges the gap between static content and interactive applications.',
    requirements: [
        'Render questions dynamically from a JavaScript object',
        'Implement a progress bar and score tracker',
        'Show a "Results" screen with a breakdown of correct/incorrect answers',
        'Ensure the UI is responsive and accessible'
    ]
  },
  {
    id: 'w4-wed',
    week: 4,
    day: 'Wednesday',
    type: 'task',
    title: 'Event Delegation & Bubbling',
    description: 'Master the DOM event model. Learn how to handle hundreds of items with a single event listener.',
    requirements: [
        'Implement a list where clicking an item triggers an action via delegation',
        'Demonstrate stopping event propagation where necessary',
        'Use data attributes to pass information from the DOM to JS',
        'Implement a custom "context menu" on right-click'
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
    description: 'Connect your code to the real world. Fetch live weather data and display it in a beautiful dashboard.',
    requirements: [
        'Integrate with the OpenWeatherMap API using fetch()',
        'Handle "Loading" and "Error" states gracefully',
        'Implement a search bar for different cities',
        'Display weather icons and dynamic backgrounds based on conditions'
    ]
  },
  {
    id: 'w5-wed',
    week: 5,
    day: 'Wednesday',
    type: 'task',
    title: 'Promises & Async/Await',
    description: 'Master asynchronous flow control. Learn how to write clean, synchronous-looking code for async operations.',
    requirements: [
        'Refactor a "callback hell" scenario into clean Promises',
        'Implement try/catch blocks for robust error handling',
        'Execute multiple requests in parallel using Promise.all()',
        'Create a "delay" utility function using Promises'
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
    description: 'Build a complex, multi-module application. Organize your logic into specialized files for scalability.',
    requirements: [
        'Use ES Modules (import/export) to structure the project',
        'Implement a "Favorite Recipes" feature using persistent state',
        'Use the Spoonacular API for recipe data',
        'Implement a custom "Spinner" component for loading states'
    ]
  },
  {
    id: 'w6-wed',
    week: 6,
    day: 'Wednesday',
    type: 'task',
    title: 'Destructuring & Spread Operator',
    description: 'Write modern, expressive JavaScript. Learn the shorthand techniques used in professional React codebases.',
    requirements: [
        'Use object destructuring to extract deeply nested API data',
        'Use the spread operator to merge configuration objects',
        'Implement rest parameters for functions with variable arguments',
        'Refactor old "ES5" code into modern "ES6+" syntax'
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
    description: 'Enter the world of React. Build a library of reusable, atomic components following best practices.',
    requirements: [
        'Create a Button, Input, Card, and Badge component',
        'Implement component "variants" (e.g., Primary vs Secondary buttons)',
        'Pass data using Props and handle events',
        'Use CSS Modules or Tailwind for scoped styling'
    ]
  },
  {
    id: 'w7-wed',
    week: 7,
    day: 'Wednesday',
    type: 'task',
    title: 'React State with useState',
    description: 'Make your UI come alive. Learn the fundamental hook for managing component reactivity.',
    requirements: [
        'Build a "Counter" with increment/decrement/reset',
        'Implement a "Toggle" switch for visibility',
        'Handle complex state (objects or arrays) with useState',
        'Demonstrate "lifting state up" between components'
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
    description: 'Build a production-ready search tool. Learn how to synchronize your UI with external data using useEffect.',
    requirements: [
        'Fetch user data from the GitHub API on mount and search',
        'Display repositories, followers, and bio in a clean layout',
        'Implement a "Debounce" feature for the search input',
        'Handle API rate limits and "User Not Found" errors'
    ]
  },
  {
    id: 'w8-wed',
    week: 8,
    day: 'Wednesday',
    type: 'task',
    title: 'useEffect Dependency Array',
    description: 'Master the most powerful and misunderstood React hook. Learn how to control exactly when effects run.',
    requirements: [
        'Implement a timer that starts/stops based on state',
        'Demonstrate effect cleanup (removing event listeners)',
        'Use the dependency array to trigger updates correctly',
        'Prevent infinite re-render loops with proper dependencies'
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
    description: 'Build a global state architecture. Solve the "prop drilling" problem like an architect.',
    requirements: [
        'Create a CartContext to manage global cart state',
        'Implement "Add to Cart", "Remove", and "Clear" actions',
        'Calculate total price and item count in real-time',
        'Persist the cart state in LocalStorage via Context'
    ]
  },
  {
    id: 'w9-wed',
    week: 9,
    day: 'Wednesday',
    type: 'task',
    title: 'useReducer for Complex State',
    description: 'Learn the Redux pattern within React. Manage complex state transitions with predictable actions.',
    requirements: [
        'Implement a "Task Manager" using useReducer',
        'Define a clear set of action types (ADD_TASK, TOGGLE_TASK, etc.)',
        'Create a pure reducer function to handle state updates',
        'Demonstrate why useReducer is better than multiple useStates'
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
    description: 'Create a Single Page Application (SPA) with multiple routes. Master client-side navigation.',
    requirements: [
        'Set up Home, About, and Blog routes',
        'Implement dynamic routing (e.g., /blog/:slug)',
        'Create a "404 Not Found" catch-all route',
        'Use nested routes for shared layouts'
    ]
  },
  {
    id: 'w10-wed',
    week: 10,
    day: 'Wednesday',
    type: 'task',
    title: 'URL Parameters & Search Params',
    description: 'Sync your UI with the URL. Learn how to build search and filter systems that users can bookmark.',
    requirements: [
        'Extract ID parameters from the URL using useParams',
        'Implement a filter system using useSearchParams',
        'Update the URL dynamically without page refreshes',
        'Build a "Breadcrumbs" component based on the current path'
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
    description: 'Upgrade to the industry standard. Move your React projects into the Next.js App Router framework.',
    requirements: [
        'Convert a React Router project to Next.js file-based routing',
        'Implement a root Layout and nested layouts',
        'Add SEO metadata (title, description, opengraph) to pages',
        'Deploy the project to Vercel'
    ]
  },
  {
    id: 'w11-wed',
    week: 11,
    day: 'Wednesday',
    type: 'task',
    title: 'Server vs Client Components',
    description: 'Master the hybrid model. Learn when to use the power of the server and when to use the interactivity of the client.',
    requirements: [
        'Identify components that should be Server-only',
        'Implement interactive elements using "use client"',
        'Pass data from Server Components to Client Components',
        'Understand the "serialization" boundary'
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
    description: 'Build a high-performance media site. Leverage Next.js data fetching for perfect SEO and speed.',
    requirements: [
        'Fetch movie data on the server using async components',
        'Implement dynamic routes for movie detail pages',
        'Add "Suspense" boundaries for smooth loading states',
        'Generate static metadata dynamically based on movie titles'
    ]
  },
  {
    id: 'w12-wed',
    week: 12,
    day: 'Wednesday',
    type: 'task',
    title: 'Revalidation & Caching',
    description: 'Control the freshness of your data. Learn how to cache responses and revalidate them on a schedule.',
    requirements: [
        'Implement Time-based Revalidation (ISR)',
        'Use the fetch() "cache" option (no-store, force-cache)',
        'Demonstrate on-demand revalidation using revalidatePath',
        'Implement a custom "loading.tsx" for the entire route'
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
    description: 'Design a world-class SaaS landing page. Focus on high-fidelity UI and modern styling techniques.',
    requirements: [
        'Implement a responsive "bento grid" layout',
        'Use Tailwind "arbitrary values" for precision design',
        'Create complex gradients and backdrop-blur effects',
        'Implement dark mode support throughout the page'
    ]
  },
  {
    id: 'w13-wed',
    week: 13,
    day: 'Wednesday',
    type: 'task',
    title: 'Framer Motion Animations',
    description: 'Add "soul" to your UI. Learn how to implement professional entrance and scroll-triggered animations.',
    requirements: [
        'Implement "AnimatePresence" for smooth exit transitions',
        'Create scroll-linked animations using useScroll',
        'Animate layouts between state changes using layoutId',
        'Ensure animations are disabled for users with "prefers-reduced-motion"'
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
    description: 'Secure your application. Implement a full authentication flow using Supabase and Next.js.',
    requirements: [
        'Implement Email/Password signup and login',
        'Integrate OAuth providers (Google or GitHub)',
        'Manage session persistence on the server and client',
        'Create a "Profile" page where users can update their info'
    ]
  },
  {
    id: 'w14-wed',
    week: 14,
    day: 'Wednesday',
    type: 'task',
    title: 'Protected Routes',
    description: 'Protect sensitive data. Learn how to use Middleware and Server Components to restrict access.',
    requirements: [
        'Write Next.js Middleware to redirect unauthenticated users',
        'Implement server-side auth checks for individual pages',
        'Show different navigation links based on auth state',
        'Secure API route handlers from unauthorized access'
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
    description: 'Build a relational application. Design a Postgres schema and connect it to your Next.js frontend.',
    requirements: [
        'Design a 1-to-Many relationship (User -> Projects)',
        'Design a Many-to-Many relationship (Projects -> Tasks)',
        'Implement CRUD operations using the Supabase SDK',
        'Handle database constraints and "On Delete Cascade"'
    ]
  },
  {
    id: 'w15-wed',
    week: 15,
    day: 'Wednesday',
    type: 'task',
    title: 'Relational Queries',
    description: 'Fetch data like a senior engineer. Learn how to join tables and perform complex filtering in Postgres.',
    requirements: [
        'Perform a nested fetch (Get Project with all its Tasks)',
        'Implement server-side filtering and sorting',
        'Use Postgres Views or RPC for complex logic',
        'Optimize queries for performance'
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
    description: 'Handle binary data. Build a system that allows users to upload, store, and view images.',
    requirements: [
        'Implement image uploading to Supabase Buckets',
        'Generate public URLs for stored images',
        'Implement client-side image resizing/preview before upload',
        'Store image metadata (size, type, URL) in the database'
    ]
  },
  {
    id: 'w16-wed',
    week: 16,
    day: 'Wednesday',
    type: 'task',
    title: 'Server Actions for Form Submission',
    description: 'Eliminate API routes. Use the modern Next.js way to handle form data and mutations.',
    requirements: [
        'Create a Server Action to handle data submission',
        'Implement useFormStatus for loading states',
        'Implement useFormState for server-side validation messages',
        'Revalidate paths immediately after a successful mutation'
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
    description: 'Master the best data fetching library in the industry. Build a real-time, resilient chat app.',
    requirements: [
        'Use useQuery for fetching message history',
        'Implement useMutation for sending new messages',
        'Set up Supabase Realtime for instant message updates',
        'Implement "Infinite Scroll" for old messages'
    ]
  },
  {
    id: 'w17-wed',
    week: 17,
    day: 'Wednesday',
    type: 'task',
    title: 'Optimistic Updates',
    description: 'Create "Instant" UIs. Learn how to update the UI before the server even responds.',
    requirements: [
        'Implement an optimistic update for "Liking" a message',
        'Handle mutation errors by rolling back the UI state',
        'Invalidate specific queries to trigger background refetches',
        'Manage global cache configuration'
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
    description: 'Write "Bulletproof" code. Learn how to test your logic in isolation to prevent regressions.',
    requirements: [
        'Write unit tests for complex utility functions',
        'Test a React component using React Testing Library',
        'Mock external dependencies and API calls',
        'Achieve at least 80% test coverage for core logic'
    ]
  },
  {
    id: 'w18-wed',
    week: 18,
    day: 'Wednesday',
    type: 'task',
    title: 'E2E Testing with Playwright',
    description: 'Test the "Happy Path". Automate the browser to ensure your entire app works together.',
    requirements: [
        'Write a test for the "Login -> Dashboard -> Logout" flow',
        'Test responsive layouts on different viewport sizes',
        'Use Playwright "Codegen" to generate test scripts',
        'Implement visual regression testing'
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
    description: 'Build for speed. Learn how to achieve a "Perfect 100" Lighthouse score for production apps.',
    requirements: [
        'Optimize all images using next/image and proper sizing',
        'Implement "Font Optimization" to prevent layout shift',
        'Analyze bundle size using @next/bundle-analyzer',
        'Optimize third-party scripts and "Critical CSS"'
    ]
  },
  {
    id: 'w19-wed',
    week: 19,
    day: 'Wednesday',
    type: 'task',
    title: 'Dynamic Imports & Code Splitting',
    description: 'Ship less JavaScript. Learn how to defer loading heavy components until they are needed.',
    requirements: [
        'Implement dynamic() imports for heavy libraries (e.g., charts)',
        'Create "Skeleton" loaders for lazy-loaded components',
        'Optimize the initial JS payload for mobile users',
        'Use the "Streaming" pattern with Suspense'
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
    description: 'Build a public-facing API. Master Route Handlers, Rate Limiting, and API Security.',
    requirements: [
        'Create CRUD Route Handlers for an external entity',
        'Implement API authentication via Header tokens',
        'Implement Rate Limiting using Upstash or similar',
        'Document your API using Swagger or a README'
    ]
  },
  {
    id: 'w20-wed',
    week: 20,
    day: 'Wednesday',
    type: 'task',
    title: 'GraphQL Basics',
    description: 'Learn the alternative to REST. Explore the power of the "Graph" and fetching exactly what you need.',
    requirements: [
        'Write complex GraphQL queries and mutations',
        'Understand the difference between Queries and Fragments',
        'Explore a GraphQL schema using Apollo or GraphiQL',
        'Understand how GraphQL solves over-fetching'
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
    description: 'Add "Type Safety" to your workflow. Learn why TypeScript is mandatory for professional engineering.',
    requirements: [
        'Migrate a JavaScript project to TypeScript without using "any"',
        'Define complex Interfaces and Types for API data',
        'Implement "Strict Mode" and resolve all TS errors',
        'Create type definitions for external libraries'
    ]
  },
  {
    id: 'w21-wed',
    week: 21,
    day: 'Wednesday',
    type: 'task',
    title: 'Generics & Utility Types',
    description: 'Write "Flexible" but "Safe" code. Learn how to build generic components and functions.',
    requirements: [
        'Create a generic "Table" component in React',
        'Use Utility types like Partial, Omit, and Pick',
        'Implement "Conditional Types" for complex logic',
        'Build a type-safe API wrapper using Generics'
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
    description: 'Automate your releases. Build a pipeline that tests and lints your code on every push.',
    requirements: [
        'Write a .github/workflows/main.yml file',
        'Automate Vitest runs on every Pull Request',
        'Implement "Production Branch Protection" rules',
        'Set up Slack/Discord notifications for build failures'
    ]
  },
  {
    id: 'w22-wed',
    week: 22,
    day: 'Wednesday',
    type: 'task',
    title: 'Custom Domain & SSL',
    description: 'Go "Live" professionally. Learn how to manage domains, SSL, and production environments.',
    requirements: [
        'Configure a custom domain on Vercel/Netlify',
        'Set up "Environment Variables" for production keys',
        'Configure DNS records (CNAME, A, TXT)',
        'Monitor production logs and errors'
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
    description: 'The "Masterpiece" begins. Submit a detailed plan for your capstone professional SaaS application.',
    requirements: [
        'Create a full Figma design with prototype',
        'Design a complete Database Schema (ERD)',
        'Write a detailed Technical Specification document',
        'Outline the "MVP" features and future roadmap'
    ]
  },
  {
    id: 'w23-wed',
    week: 23,
    day: 'Wednesday',
    type: 'task',
    title: 'Architecture Review',
    description: 'Ensure your foundation is solid. Review your tech stack and architectural decisions.',
    requirements: [
        'Choose appropriate State Management (Context, TanStack, or Zustand)',
        'Plan the "Auth" and "RLS" strategy for the database',
        'Identify potential performance bottlenecks',
        'Select a UI library or custom design system'
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
    description: 'The "Ultimate" test. Build a full-featured, professional SaaS application using the entire stack.',
    requirements: [
        'Full Authentication and User Profiles',
        'Relational Database with complex queries',
        'File storage for user content',
        'Optimized for Performance and SEO'
    ]
  },
  {
    id: 'w24-wed',
    week: 24,
    day: 'Wednesday',
    type: 'task',
    title: 'Final Bug Bash',
    description: 'Polish and refine. Ensure your application is "Production Ready" for the real world.',
    requirements: [
        'Zero console errors and warnings',
        'Fully responsive on all screen sizes',
        'Complete test coverage for critical paths',
        'Professional documentation and README'
    ]
  },
  {
    id: 'w24-final',
    week: 24,
    day: 'Final',
    type: 'final_project',
    title: 'Course Graduation',
    description: 'Present your masterpiece. Showcase your skills to the world and receive your certification.',
    requirements: [
        'Live demonstration of the application',
        'Technical walkthrough of the architecture',
        'Q&A session with industry professionals',
        'Graduation ceremony and certificate award'
    ]
  },
];
