export interface PenaltyTask {
  id: string;
  title: string;
  description: string;
}

export const PENALTY_TASKS: PenaltyTask[] = [
  {
    id: 'pt-video-1',
    title: 'Code Walkthrough Video',
    description: 'Record a 3-minute video explaining the core logic of your most recent successful assignment and upload it to a private YouTube/Loom link.'
  },
  {
    id: 'pt-blog-1',
    title: 'Technical Blog Post',
    description: 'Write a 500-word blog post on "Lessons Learned" from the topic you missed and share it on Hashnode or Dev.to.'
  },
  {
    id: 'pt-refactor-1',
    title: 'Deep Refactor',
    description: 'Go back to your Week 1 project and refactor it using 3 advanced techniques you learned recently.'
  },
  {
    id: 'pt-docs-1',
    title: 'Documentation Sprint',
    description: 'Create a professional README.md for your entire portfolio repo, including a tech stack breakdown and architecture diagrams.'
  },
  {
    id: 'pt-video-2',
    title: 'Debugging Session',
    description: 'Record a video of you solving a complex bug you encountered this week. Explain your thought process.'
  },
  {
    id: 'pt-ui-1',
    title: 'UI Enhancement',
    description: 'Pick any of your previous assignments and implement 3 Framer Motion animations to make it "Pro" grade.'
  }
];
