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
    description: 'Create a multi-page website structure using only semantic HTML5 tags (header, nav, main, section, article, aside, footer). Include a contact form with various input types.',
  },
  {
    id: 'w1-wed',
    week: 1,
    day: 'Wednesday',
    type: 'task',
    title: 'CSS Box Model & Flexbox Mastery',
    description: 'Build a responsive navigation bar and a 3-column feature section using Flexbox. Ensure you understand padding, margin, borders, and content-box vs border-box.',
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
    description: 'Design a complex magazine-style layout using CSS Grid. It must be fully responsive without using too many media queries (use minmax, auto-fill).',
  },
  {
    id: 'w2-wed',
    week: 2,
    day: 'Wednesday',
    type: 'task',
    title: 'CSS Variables & Dark Mode Toggle',
    description: 'Implement a theme switching system using CSS variables (custom properties). Create a page that can toggle between light and dark themes manually.',
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
    description: 'Build a Todo list where users can add, delete, and toggle completion. Data must persist after page refresh using localStorage.',
  },
  {
    id: 'w3-wed',
    week: 3,
    day: 'Wednesday',
    type: 'task',
    title: 'Array Methods & Data Manipulation',
    description: 'Given an array of user objects, write functions to filter by age, sort by name, and calculate the total age using map, filter, and reduce.',
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
    description: 'Build a quiz application that fetches questions from an object, tracks the score, and displays results at the end.',
  },
  {
    id: 'w4-wed',
    week: 4,
    day: 'Wednesday',
    type: 'task',
    title: 'Event Delegation & Bubbling',
    description: 'Create a dynamic list where clicking any item alerts its index. Use a single event listener on the parent.',
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
    description: 'Create a weather dashboard that fetches real-time data from OpenWeatherMap API and displays it beautifully.',
  },
  {
    id: 'w5-wed',
    week: 5,
    day: 'Wednesday',
    type: 'task',
    title: 'Promises & Async/Await',
    description: 'Refactor a chain of nested callbacks into a clean async/await structure with proper error handling using try/catch.',
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
    description: 'Build a search engine for recipes. Use modules to separate API logic, UI rendering, and state management.',
  },
  {
    id: 'w6-wed',
    week: 6,
    day: 'Wednesday',
    type: 'task',
    title: 'Destructuring & Spread Operator',
    description: 'Clean up a messy codebase by using object/array destructuring and the spread operator to merge configs and pass props.',
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
    description: 'Build a set of reusable UI components (Button, Card, Input) using React and Props.',
  },
  {
    id: 'w7-wed',
    week: 7,
    day: 'Wednesday',
    type: 'task',
    title: 'React State with useState',
    description: 'Create a counter and a text input mirror using the useState hook to manage local state.',
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
    description: 'Rebuild the GitHub finder using React and useEffect to fetch data on component mount.',
  },
  {
    id: 'w8-wed',
    week: 8,
    day: 'Wednesday',
    type: 'task',
    title: 'useEffect Dependency Array',
    description: 'Demonstrate how to run an effect only when a specific state changes vs running it on every render.',
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
    description: 'Build a store where items can be added to a cart that is accessible globally using React Context.',
  },
  {
    id: 'w9-wed',
    week: 9,
    day: 'Wednesday',
    type: 'task',
    title: 'useReducer for Complex State',
    description: 'Refactor a complex useState object into a useReducer pattern with actions and a reducer function.',
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
    description: 'Create a blog with Home, About, and dynamic Post Detail pages using React Router.',
  },
  {
    id: 'w10-wed',
    week: 10,
    day: 'Wednesday',
    type: 'task',
    title: 'URL Parameters & Search Params',
    description: 'Implement a search filter that updates the URL query string using useSearchParams.',
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
    description: 'Move your portfolio to Next.js using the App Router. Implement static and dynamic metadata.',
  },
  {
    id: 'w11-wed',
    week: 11,
    day: 'Wednesday',
    type: 'task',
    title: 'Server vs Client Components',
    description: 'Identify and demonstrate the difference between "use client" and default Server Components.',
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
    description: 'Build a movie site using TMDB API. Use Server Side Rendering (SSR) for the movie detail pages.',
  },
  {
    id: 'w12-wed',
    week: 12,
    day: 'Wednesday',
    type: 'task',
    title: 'Revalidation & Caching',
    description: 'Implement Incremental Static Regeneration (ISR) to update your movie list every 60 seconds.',
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
    description: 'Build a high-converting landing page using Tailwind CSS, including complex gradients and animations.',
  },
  {
    id: 'w13-wed',
    week: 13,
    day: 'Wednesday',
    type: 'task',
    title: 'Framer Motion Animations',
    description: 'Add entrance and scroll animations to your SaaS landing page using Framer Motion.',
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
    description: 'Implement Login, Signup, and Logout functionality using Supabase Auth.',
  },
  {
    id: 'w14-wed',
    week: 14,
    day: 'Wednesday',
    type: 'task',
    title: 'Protected Routes',
    description: 'Use Next.js Middleware to protect private pages from unauthenticated users.',
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
    description: 'Build a task manager where users can create projects and tasks linked by foreign keys in Postgres.',
  },
  {
    id: 'w15-wed',
    week: 15,
    day: 'Wednesday',
    type: 'task',
    title: 'Relational Queries',
    description: 'Write Supabase queries to fetch projects with their associated tasks in a single request.',
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
    description: 'Implement image uploading to Supabase Storage and store the URL in the database.',
  },
  {
    id: 'w16-wed',
    week: 16,
    day: 'Wednesday',
    type: 'task',
    title: 'Server Actions for Form Submission',
    description: 'Handle form submissions using Next.js Server Actions instead of API routes.',
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
    description: 'Build a real-time chat application using TanStack Query for data fetching and caching.',
  },
  {
    id: 'w17-wed',
    week: 17,
    day: 'Wednesday',
    type: 'task',
    title: 'Optimistic Updates',
    description: 'Implement optimistic updates so the UI reflects changes immediately before the server responds.',
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
    description: 'Write unit tests for your utility functions and components using Vitest and React Testing Library.',
  },
  {
    id: 'w18-wed',
    week: 18,
    day: 'Wednesday',
    type: 'task',
    title: 'E2E Testing with Playwright',
    description: 'Set up Playwright and write a test that simulates a user logging in and submitting a form.',
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
    description: 'Analyze an existing site with Lighthouse and optimize images, fonts, and scripts to achieve a 90+ score.',
  },
  {
    id: 'w19-wed',
    week: 19,
    day: 'Wednesday',
    type: 'task',
    title: 'Dynamic Imports & Code Splitting',
    description: 'Use next/dynamic to lazy-load heavy components and reduce the initial bundle size.',
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
    description: 'Create a full CRUD API using Route Handlers and implement rate limiting.',
  },
  {
    id: 'w20-wed',
    week: 20,
    day: 'Wednesday',
    type: 'task',
    title: 'GraphQL Basics',
    description: 'Explore a GraphQL API and write queries to fetch specific data nested deep in the graph.',
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
    description: 'Take a medium-sized JS project and fully type it, including complex interfaces and generics.',
  },
  {
    id: 'w21-wed',
    week: 21,
    day: 'Wednesday',
    type: 'task',
    title: 'Generics & Utility Types',
    description: 'Write a generic fetch wrapper that automatically types the response data.',
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
    description: 'Set up a pipeline that automatically runs tests and linting on every push to GitHub.',
  },
  {
    id: 'w22-wed',
    week: 22,
    day: 'Wednesday',
    type: 'task',
    title: 'Custom Domain & SSL',
    description: 'Configure a custom domain for your Vercel project and ensure SSL is working properly.',
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
    description: 'Submit a detailed plan for your final project, including Figma designs and database schema.',
  },
  {
    id: 'w23-wed',
    week: 23,
    day: 'Wednesday',
    type: 'task',
    title: 'Architecture Review',
    description: 'Review your proposed architecture with a focus on scalability and security.',
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
    description: 'Build a full-featured, professional SaaS application using Next.js, Supabase, Tailwind, and TypeScript. Must include Auth, DB, and Storage.',
  },
  {
    id: 'w24-wed',
    week: 24,
    day: 'Wednesday',
    type: 'task',
    title: 'Final Bug Bash',
    description: 'Thoroughly test your application, fix all bugs, and optimize for production.',
  },
  {
    id: 'w24-final',
    week: 24,
    day: 'Final',
    type: 'final_project',
    title: 'Course Graduation',
    description: 'Present your final project and receive your certificate.',
  },
];
