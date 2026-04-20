export const lmsCategory = {
  name: 'Learning Management System (LMS)',
  slug: 'lms',
  description: 'Creating content, managing chapters, assessments, scheduling, and tracking student progress',
  icon: 'Laptop',
  featureKey: 'lms',
  order: 7,
  status: 'active' as const
};

export const lmsArticles = [
  {
    title: 'Exploring the Content Library',
    slug: 'exploring-the-content-library',
    summary: 'Learn how to browse the LMS content library organized by class and subject with chapter statistics.',
    content: `# Exploring the Content Library

The Content Library is your starting point for all LMS content. It provides an overview of all chapters and lessons organized by class and subject.

## How it Works

### LMS Content Structure
\`\`\`
Class → Subject → Chapters → Lessons/Content
\`\`\`

For example:
- **Class 5** → **Mathematics** → **Chapter: Fractions** → Lessons on types of fractions, operations, worksheets

## Steps

1. Go to **Learning (LMS) → Content Library** in the sidebar
2. **Select a Class** from the dropdown (e.g., "Class 5")
3. **Select a Subject** from the dropdown (e.g., "Mathematics")
4. Browse the **chapters** listed with statistics:
   - Total chapters
   - Total content items
   - Published items
   - Draft items

## What You'll See

- **Stats Cards** — Quick summary showing total chapters, total content, published, and drafts
- **Chapter List** — All chapters for the selected class/subject with their content count
- Click any chapter to manage its content

> **Tip:** Use the Content Library to get a high-level view of your course content. For detailed editing, navigate to Chapter Management.`,
    module: 'lms',
    featureKey: 'lms',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'teacher'],
    tags: ['content library', 'LMS', 'browse', 'overview', 'chapters'],
    relatedRoutes: ['/lms'],
    steps: [
      { stepNumber: 1, title: 'Go to Content Library', description: 'Navigate to Learning (LMS) → Content Library.' },
      { stepNumber: 2, title: 'Select Class', description: 'Choose a class from the dropdown.' },
      { stepNumber: 3, title: 'Select Subject', description: 'Choose a subject to see its chapters.' },
      { stepNumber: 4, title: 'Browse Chapters', description: 'View chapter list with content statistics.' }
    ],
    order: 1
  },
  {
    title: 'How to Create and Manage Chapters',
    slug: 'how-to-create-chapters',
    summary: 'Learn how to create chapters within a subject, add descriptions, and organize them for students.',
    content: `# How to Create and Manage Chapters

Chapters organize your learning content under subjects. Each chapter can contain multiple lessons.

## Steps

1. Go to **Learning (LMS) → Chapter Management** in the sidebar
2. **Select a Class** from the dropdown
3. **Select a Subject** from the dropdown
4. Click the **"+" (Add)** button
5. Fill in:
   - **Chapter Name** — e.g., "Fractions"
   - **Chapter Number** — Auto-generated (can be adjusted)
   - **Description** — Brief overview (e.g., "Understanding fractions, types, and basic operations")
   - **Status** — Active / Inactive
6. Click **"Save"**

## Managing Chapters

- **Edit** — Click the pencil icon to change chapter name or description
- **Delete** — Click the trash icon to remove a chapter (only if it has no content)
- **Reorder** — Chapters are ordered by chapter number

## Example

Creating chapters for Class 5 Mathematics:
1. Chapter 1: "Numbers and Place Values"
2. Chapter 2: "Addition and Subtraction"
3. Chapter 3: "Multiplication"
4. Chapter 4: "Division"
5. Chapter 5: "Fractions"
6. Chapter 6: "Decimals"

> **Tip:** After creating chapters, add lesson content to each chapter using the Chapter Content page.`,
    module: 'lms',
    featureKey: 'lms',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'teacher'],
    tags: ['chapter', 'create chapter', 'LMS', 'organize', 'lessons'],
    relatedRoutes: ['/lms/chapters'],
    steps: [
      { stepNumber: 1, title: 'Go to Chapter Management', description: 'Navigate to Learning (LMS) → Chapter Management.' },
      { stepNumber: 2, title: 'Select Class and Subject', description: 'Choose the class and subject.' },
      { stepNumber: 3, title: 'Click Add', description: 'Click the "+" button to create a new chapter.' },
      { stepNumber: 4, title: 'Enter Details', description: 'Enter chapter name, description, and status.' },
      { stepNumber: 5, title: 'Save', description: 'Click Save to create the chapter.' }
    ],
    order: 2
  },
  {
    title: 'How to Add Lesson Content to Chapters',
    slug: 'how-to-add-lesson-content',
    summary: 'Learn how to upload videos, PDFs, audio, text, and images as lesson content within chapters.',
    content: `# How to Add Lesson Content to Chapters

After creating chapters, add lesson content like videos, PDFs, text notes, audio files, and images.

## Supported Content Types

| Type | Examples | File Formats |
|------|----------|-------------|
| **Video** | Recorded lectures, tutorials | MP4, WebM |
| **Audio** | Recorded explanations, podcasts | MP3, WAV |
| **PDF** | Worksheets, study materials | PDF |
| **Text** | Notes, summaries, explanations | Rich text |
| **Image** | Diagrams, charts, illustrations | JPG, PNG, GIF |

## Steps

1. Go to **Learning (LMS) → Chapter Management**
2. Select class and subject
3. Click on a **chapter name** to open it
4. Click **"Add Content"**
5. Select the **content type** (Video, Audio, PDF, Text, or Image)
6. Fill in:
   - **Title** — e.g., "Introduction to Fractions"
   - **Description** — Brief summary of the content
   - **File Upload** — Upload the file (for Video, Audio, PDF, Image)
   - **Text Content** — Type/paste content (for Text type)
7. Click **"Save"**

## Example

Adding content to Chapter "Fractions" (Class 5 Math):
1. **Video:** "What are Fractions?" — Upload a 10-minute lecture video (MP4)
2. **Text:** "Types of Fractions" — Write notes about proper, improper, and mixed fractions
3. **PDF:** "Practice Worksheet" — Upload a PDF worksheet with 20 problems
4. **Image:** "Fraction Diagram" — Upload a visual representation of fractions

> **Tip:** Mix content types to keep students engaged — use videos for explanations, text for notes, PDFs for practice, and images for visual concepts.`,
    module: 'lms',
    featureKey: 'lms',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'teacher'],
    tags: ['lesson content', 'upload', 'video', 'PDF', 'audio', 'text', 'image'],
    relatedRoutes: ['/lms/chapters'],
    steps: [
      { stepNumber: 1, title: 'Open Chapter', description: 'Go to Chapter Management, select class/subject, and click on a chapter.' },
      { stepNumber: 2, title: 'Click Add Content', description: 'Click the "Add Content" button.' },
      { stepNumber: 3, title: 'Select Content Type', description: 'Choose Video, Audio, PDF, Text, or Image.' },
      { stepNumber: 4, title: 'Upload or Enter Content', description: 'Upload a file or enter text content, add title and description.' },
      { stepNumber: 5, title: 'Save', description: 'Click Save to add the content to the chapter.' }
    ],
    order: 3
  },
  {
    title: 'How to Create Assessments',
    slug: 'how-to-create-assessments',
    summary: 'Learn how to create quizzes, assignments, and online exams in the LMS.',
    content: `# How to Create Assessments

Create online assessments — quizzes, assignments, or exams — that students can complete digitally.

## Assessment Types

| Type | Purpose | Auto-Graded? |
|------|---------|-------------|
| **Quiz** | Quick knowledge checks | ✅ Yes (for MCQ) |
| **Assignment** | Homework, projects | ❌ Manual review |
| **Online Exam** | Formal assessments | ✅ Partially |

## Steps

1. Go to **Learning (LMS) → Assessments** in the sidebar
2. Click **"Create Assessment"**
3. You'll be taken to the **Assessment Builder**
4. Fill in basic details:
   - **Title** — e.g., "Fractions Quiz"
   - **Type** — Quiz / Assignment / Online Exam
   - **Class** — Select the class
   - **Subject** — Select the subject
5. **Add Questions** using the builder
6. Set marks per question
7. **Publish** when ready

## Filtering Assessments

- **Class** — Filter by specific class
- **Subject** — Filter by subject
- **Type** — Quiz / Assignment / Online Exam
- **Status** — Draft / Published / Archived
- **Search** — Search by title

## Assessment Actions

- **Edit** — Modify questions and settings
- **Delete** — Remove the assessment
- **Duplicate** — Copy an existing assessment (great for making variations)
- **Publish** — Make it available to students

> **Tip:** Start with "Draft" status to build and review your assessment. Only "Publish" when it's ready for students.`,
    module: 'lms',
    featureKey: 'lms',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'teacher'],
    tags: ['assessment', 'quiz', 'assignment', 'online exam', 'create', 'LMS'],
    relatedRoutes: ['/lms/assessments'],
    steps: [
      { stepNumber: 1, title: 'Go to Assessments', description: 'Navigate to Learning (LMS) → Assessments.' },
      { stepNumber: 2, title: 'Click Create Assessment', description: 'Click the "Create Assessment" button.' },
      { stepNumber: 3, title: 'Set Basic Details', description: 'Enter title, select type, class, and subject.' },
      { stepNumber: 4, title: 'Add Questions', description: 'Use the Assessment Builder to add and configure questions.' },
      { stepNumber: 5, title: 'Publish', description: 'Set status to Published when the assessment is ready for students.' }
    ],
    order: 4
  },
  {
    title: 'How to Use the Assessment Builder',
    slug: 'how-to-use-assessment-builder',
    summary: 'Detailed guide to creating questions, setting correct answers, and configuring auto-grading in the assessment builder.',
    content: `# How to Use the Assessment Builder

The Assessment Builder is a powerful tool for creating questions for quizzes and exams.

## Getting Started

1. Create a new assessment (or edit an existing draft)
2. You'll land on the **Assessment Builder** page

## Adding Questions

1. Click **"Add Question"**
2. Choose question type:
   - **Multiple Choice (MCQ)** — Student selects one correct answer
   - **Short Answer** — Student types a brief answer
   - **Long Answer** — Student writes a detailed response
3. Enter the **question text**
4. For MCQ:
   - Enter **options** (A, B, C, D)
   - Mark the **correct answer**
5. Set **marks** for the question
6. Repeat for more questions

## Auto-Grading

- **MCQ questions** are auto-graded — the system checks the student's answer against the correct answer
- **Short/Long answer** questions need manual review by the teacher

## Tips for Good Assessments

- Mix question types for variety
- Set clear, unambiguous questions
- For MCQ, make all options plausible
- Assign appropriate marks based on question difficulty

> **Tip:** Use Question Pools to build a bank of questions that can be reused across assessments.`,
    module: 'lms',
    featureKey: 'lms',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'teacher'],
    tags: ['assessment builder', 'questions', 'MCQ', 'short answer', 'auto-grade'],
    relatedRoutes: ['/lms/assessments'],
    steps: [
      { stepNumber: 1, title: 'Open Assessment Builder', description: 'Create or edit an assessment to open the builder.' },
      { stepNumber: 2, title: 'Add Question', description: 'Click "Add Question" and choose the question type.' },
      { stepNumber: 3, title: 'Enter Question', description: 'Type the question text and options (for MCQ).' },
      { stepNumber: 4, title: 'Set Correct Answer', description: 'Mark the correct answer and set marks.' },
      { stepNumber: 5, title: 'Repeat', description: 'Add more questions as needed.' }
    ],
    order: 5
  },
  {
    title: 'How to Manage Question Pools',
    slug: 'how-to-manage-question-pools',
    summary: 'Learn how to create reusable question banks for auto-generating assessments.',
    content: `# How to Manage Question Pools

Question pools let you build a bank of questions organized by subject and topic. You can reuse them when creating assessments.

## Steps

1. Go to **Learning (LMS) → Question Pools** in the sidebar
2. Click **"Create Pool"**
3. Enter pool details:
   - **Pool Name** — e.g., "Class 5 Math - Fractions"
   - **Subject** — Select the subject
   - **Class** — Select the class
4. Add questions to the pool
5. Save

## Using Pools in Assessments

When creating an assessment, you can:
1. Select questions from existing pools
2. Auto-generate a quiz by randomly picking questions from a pool

> **Tip:** Build comprehensive question pools over time. This makes it easy to create varied assessments quickly without writing new questions each time.`,
    module: 'lms',
    featureKey: 'lms',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'teacher'],
    tags: ['question pool', 'question bank', 'reuse', 'auto-generate'],
    relatedRoutes: ['/lms/question-pools'],
    steps: [
      { stepNumber: 1, title: 'Go to Question Pools', description: 'Navigate to Learning (LMS) → Question Pools.' },
      { stepNumber: 2, title: 'Create Pool', description: 'Click "Create Pool" and set name, subject, and class.' },
      { stepNumber: 3, title: 'Add Questions', description: 'Add questions to the pool for later reuse.' }
    ],
    order: 6
  },
  {
    title: 'How to Schedule Content for Classes',
    slug: 'how-to-schedule-content',
    summary: 'Learn how to assign and schedule lessons and assessments for specific classes with due dates.',
    content: `# How to Schedule Content for Classes

Schedule when students can access lessons and assessments, with optional due dates.

## Steps

1. Go to **Learning (LMS) → Content Schedule** in the sidebar
2. Click **"Schedule Content"**
3. Fill in:
   - **Content Type** — Lesson or Assessment
   - **Select Content** — Choose from published lessons/assessments
   - **Class(es)** — Select one or more classes (multi-select)
   - **Division(s)** — Select divisions (multi-select)
   - **Title** — Display title for students
   - **Description** — Brief instructions
   - **Available From** — When content becomes accessible
   - **Available Until** — When access ends (optional)
   - **Due Date** — Submission deadline (optional)
   - **Schedule Type:**
     - **Immediate** — Available right now
     - **Scheduled** — Available at a future date
     - **Recurring** — Repeats on a schedule
   - (For Recurring) **Frequency** — Daily, Weekly, Bi-weekly, or Monthly
4. Click **"Save"**

## Example

Schedule a quiz for Class 5:
- **Type:** Assessment
- **Content:** "Fractions Quiz"
- **Classes:** Class 5 → **Divisions:** A, B
- **Available From:** October 1, 2025
- **Available Until:** October 15, 2025
- **Due Date:** October 10, 2025
- **Schedule Type:** Scheduled

Students in Class 5A and 5B can access the quiz from Oct 1, must submit by Oct 10, and access closes on Oct 15.

> **Tip:** Use the "Recurring" option for weekly homework assignments or daily practice quizzes.`,
    module: 'lms',
    featureKey: 'lms',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'teacher'],
    tags: ['schedule', 'assign content', 'due date', 'available', 'recurring'],
    relatedRoutes: ['/lms/schedule'],
    steps: [
      { stepNumber: 1, title: 'Go to Content Schedule', description: 'Navigate to Learning (LMS) → Content Schedule.' },
      { stepNumber: 2, title: 'Click Schedule Content', description: 'Click to create a new schedule.' },
      { stepNumber: 3, title: 'Select Content', description: 'Choose lesson or assessment from published content.' },
      { stepNumber: 4, title: 'Set Classes and Dates', description: 'Select classes, divisions, and set availability dates.' },
      { stepNumber: 5, title: 'Save', description: 'Click Save to create the schedule.' }
    ],
    order: 7
  },
  {
    title: 'How to Use the LMS Calendar',
    slug: 'how-to-use-lms-calendar',
    summary: 'View all scheduled content and assessments in a calendar format.',
    content: `# How to Use the LMS Calendar

The LMS Calendar shows all scheduled content and assessments in a visual calendar view.

## Steps

1. Go to **Learning (LMS) → Calendar** in the sidebar
2. Browse the calendar to see scheduled items
3. Click on any item to view details

## What You'll See

- **Lessons** — Shown on their available dates
- **Assessments** — Shown with due dates highlighted
- **Color coding** — Different colors for different content types

> **Tip:** Use the calendar view to check for scheduling conflicts and ensure content is evenly distributed across the week/month.`,
    module: 'lms',
    featureKey: 'lms',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'teacher'],
    tags: ['calendar', 'LMS calendar', 'schedule view', 'timeline'],
    relatedRoutes: ['/lms/calendar'],
    steps: [
      { stepNumber: 1, title: 'Go to Calendar', description: 'Navigate to Learning (LMS) → Calendar.' },
      { stepNumber: 2, title: 'Browse', description: 'Navigate through months to see scheduled content.' },
      { stepNumber: 3, title: 'Click Items', description: 'Click any calendar item to view its details.' }
    ],
    order: 8
  },
  {
    title: 'How to Review Student Submissions',
    slug: 'how-to-review-submissions',
    summary: 'Teachers can learn how to review, grade, and provide feedback on student submissions.',
    content: `# How to Review Student Submissions

When students complete assignments or quizzes, their submissions appear for teacher review.

## Steps

1. Go to **Learning (LMS) → Submissions** in the sidebar
2. You'll see all pending submissions
3. Click on a submission to review it
4. For each submission:
   - **View student's answers**
   - **Assign marks** (for non-auto-graded questions)
   - **Provide feedback** (optional comments)
5. Click **"Save"** to record the grade

## Auto-Graded vs Manual

- **MCQ quizzes** — Auto-graded instantly. You can review but marks are already assigned
- **Assignments and long answers** — Require manual grading by the teacher

> **Tip:** Review submissions promptly so students get timely feedback. You can filter by class and assessment to process submissions in batches.`,
    module: 'lms',
    featureKey: 'lms',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'teacher'],
    tags: ['submissions', 'review', 'grade', 'feedback', 'student work'],
    relatedRoutes: ['/lms/submissions'],
    steps: [
      { stepNumber: 1, title: 'Go to Submissions', description: 'Navigate to Learning (LMS) → Submissions.' },
      { stepNumber: 2, title: 'Select Submission', description: 'Click on a student submission to review.' },
      { stepNumber: 3, title: 'Grade and Feedback', description: 'Assign marks and provide feedback comments.' },
      { stepNumber: 4, title: 'Save', description: 'Click Save to record the grade.' }
    ],
    order: 9
  },
  {
    title: 'My Learning — Student Portal Guide',
    slug: 'student-lms-portal',
    summary: 'A guide for students on how to access learning content, attempt quizzes, and track progress.',
    content: `# My Learning — Student Portal Guide

As a student, the "My Learning" portal is your personal hub for all learning content.

## Accessing My Learning

Go to **Learning (LMS) → My Learning** in the sidebar (visible only to students)

## What You'll See

### Overview Dashboard
- **Overall Completion %** — How much content you've completed
- **Completed Content** — Number of items finished
- **Time Spent** — Total study time
- **Subjects** — Number of subjects with available content

### Due Soon
- Items due in the next few days, sorted by urgency
- Click any item to start working on it immediately

### Subject Progress
- List of all subjects with individual completion percentages
- Click a subject to see its chapters and lessons

### Assessments
- Upcoming quizzes and assignments to complete
- Click to start an assessment

## How to Study

1. Look at **Due Soon** for urgent items
2. Click on a **lesson** to open the content viewer
   - Videos play in-browser
   - PDFs open for reading
   - Text content displays inline
3. After completing a lesson, progress is automatically tracked

## How to Attempt a Quiz

1. Find the quiz in your assessments list
2. Click **"Start Quiz"**
3. Answer each question
4. Click **"Submit"** when done
5. For MCQ quizzes, you'll see your score immediately

> **Tip:** Complete content in order — each chapter builds on the previous one. Check "Due Soon" daily so you don't miss deadlines.`,
    module: 'lms',
    featureKey: 'lms',
    roles: ['student'],
    tags: ['my learning', 'student portal', 'study', 'quiz', 'progress', 'student'],
    relatedRoutes: ['/lms/student'],
    steps: [
      { stepNumber: 1, title: 'Open My Learning', description: 'Go to Learning (LMS) → My Learning.' },
      { stepNumber: 2, title: 'Check Due Items', description: 'Look at the "Due Soon" section for urgent items.' },
      { stepNumber: 3, title: 'Open Lessons', description: 'Click on lessons to view videos, PDFs, or text content.' },
      { stepNumber: 4, title: 'Attempt Assessments', description: 'Click on quizzes/assignments to complete them.' }
    ],
    order: 10
  },
  {
    title: 'How to Track Student Progress',
    slug: 'how-to-track-lms-progress',
    summary: 'Teachers and admins can monitor student engagement and content completion in the LMS.',
    content: `# How to Track Student Progress

Monitor how students are engaging with LMS content — completion rates, time spent, and activity.

## Steps

1. Go to **Learning (LMS) → Progress Dashboard** in the sidebar
2. View overall class metrics:
   - Content completion rates
   - Student engagement levels
   - Time spent per student/class
3. Drill down into individual student progress

## What to Look For

- **High completion** — Students on track
- **Low completion** — May need additional support or reminders
- **Zero activity** — Students who haven't started — follow up

> **Tip:** Review the progress dashboard weekly to identify students who may be falling behind and need extra support.`,
    module: 'lms',
    featureKey: 'lms',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'teacher'],
    tags: ['progress', 'tracking', 'engagement', 'completion', 'monitoring'],
    relatedRoutes: ['/lms/progress'],
    steps: [
      { stepNumber: 1, title: 'Go to Progress Dashboard', description: 'Navigate to Learning (LMS) → Progress Dashboard.' },
      { stepNumber: 2, title: 'Review Metrics', description: 'Check class-level completion and engagement metrics.' },
      { stepNumber: 3, title: 'Identify Issues', description: 'Look for students with low completion or zero activity.' }
    ],
    order: 11
  },
  {
    title: 'How to View LMS Reports',
    slug: 'how-to-view-lms-reports',
    summary: 'View class performance and activity reports for LMS content.',
    content: `# How to View LMS Reports

LMS Reports provide insights into class performance, content usage, and student activity.

## Steps

1. Go to **Learning (LMS) → Reports** in the sidebar
2. View reports including:
   - **Class Performance** — Average scores, pass rates
   - **Content Activity** — Most viewed content, engagement
   - **Student Activity** — Individual student usage

> **Tip:** Use these reports during parent-teacher meetings to show student engagement with digital learning.`,
    module: 'lms',
    featureKey: 'lms',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'teacher'],
    tags: ['LMS reports', 'class performance', 'activity', 'analytics'],
    relatedRoutes: ['/lms/reports'],
    steps: [
      { stepNumber: 1, title: 'Go to LMS Reports', description: 'Navigate to Learning (LMS) → Reports.' },
      { stepNumber: 2, title: 'Review Reports', description: 'Browse class performance and student activity reports.' }
    ],
    order: 12
  },
  {
    title: 'How to Clone Content Across Classes',
    slug: 'how-to-clone-content',
    summary: 'Learn how to copy LMS content from one class to another or to the next academic year.',
    content: `# How to Clone Content Across Classes

Save time by copying existing LMS content to different classes or academic years instead of recreating it.

## When to Use

- **New academic year** — Copy last year's content to this year's classes
- **Same content, different class** — Share content between parallel classes
- **Template creation** — Create content once, clone to multiple sections

## Steps

1. Go to **Learning (LMS) → Clone Content** in the sidebar
2. Select the **source**:
   - Source Class (e.g., "Class 5 - 2024-25")
   - Source Subject (e.g., "Mathematics")
3. Select the **target**:
   - Target Class (e.g., "Class 5 - 2025-26")
   - Target Subject (e.g., "Mathematics")
4. Review what will be cloned (chapters and their content)
5. Click **"Clone"**
6. All chapters and content are duplicated to the target

## Example

Copy Class 5 Mathematics content from last year to this year:
- **Source:** Class 5 Mathematics (2024-25)
- **Target:** Class 5 Mathematics (2025-26)
- Click Clone → All chapters and lessons are copied

> **Important:** Cloned content is independent — changes to the original don't affect the clone and vice versa.

> **Tip:** Clone content at the beginning of the academic year, then review and update as needed.`,
    module: 'lms',
    featureKey: 'lms',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'teacher'],
    tags: ['clone', 'copy', 'duplicate', 'academic year', 'reuse'],
    relatedRoutes: ['/lms/clone'],
    steps: [
      { stepNumber: 1, title: 'Go to Clone Content', description: 'Navigate to Learning (LMS) → Clone Content.' },
      { stepNumber: 2, title: 'Select Source', description: 'Choose the source class and subject to copy from.' },
      { stepNumber: 3, title: 'Select Target', description: 'Choose the target class and subject to copy to.' },
      { stepNumber: 4, title: 'Clone', description: 'Review and click Clone to duplicate all content.' }
    ],
    order: 13
  },
  {
    title: 'How to Take a Quiz (Students)',
    slug: 'how-to-take-quiz-student',
    summary: 'Step-by-step guide for students on attempting LMS quizzes and assessments.',
    content: `# How to Take a Quiz (Students)

When a teacher assigns an assessment, you can attempt it directly in the application.

## Steps

### Step 1: Open the Assessment
Go to **My Learning** from the sidebar. Find the assessment and click to start it.

### Step 2: Read Instructions
If the teacher added instructions, they appear at the top. Read them carefully before starting.

### Step 3: Watch the Timer
If the assessment has a time limit:
- A timer badge shows the remaining time (MM:SS format)
- Timer turns **orange** when less than 5 minutes remain
- Timer turns **red** when less than 1 minute remains
- When time reaches **zero**, your answers are **automatically submitted**

### Step 4: Answer Questions

**Question Navigation:**
- Numbered bubbles at the top show all questions
- **Blue** = current question
- **Green** = answered
- **Gray** = not yet answered
- Click any bubble to jump to that question
- A counter shows "X of N answered"

**Answer Types:**
- **Multiple Choice (MCQ) / True-False** — Click the option button to select your answer. The selected option highlights in blue
- **Short Answer / Fill in the Blank** — Type your answer in the text field
- **Long Answer** — Write your detailed answer in the large text area

### Step 5: Navigate Between Questions
- Click **Next** to go to the next question
- Click **Previous** to go back
- Or click any question bubble to jump directly

### Step 6: Submit
- On the last question, a **Submit** button appears instead of "Next"
- A sticky bar at the bottom always shows "Submit Quiz (X/N answered)" for quick access
- Click Submit → A confirmation dialog asks: **"Are you sure you want to submit?"**
- Click **Confirm** to submit. You cannot change answers after submitting

### Step 7: View Your Results
After submission, you'll see:
- **Score** — Marks earned out of total marks
- **Percentage** — Your score percentage
- **Result** — "Passed!" (green) or "Not Passed" (orange)
- If the assessment has long-answer questions, it may show "Pending teacher grading"
- Click **"Back to Assessments"** to return

## Tips
- Answer all questions before submitting — unanswered questions score zero
- Use the question bubbles to review your answers before final submission
- Don't refresh the page during the quiz — you may lose your progress
- If timed, manage your time wisely — spend proportional time on each question`,
    module: 'lms',
    featureKey: 'lms',
    roles: ['student'],
    tags: ['quiz', 'attempt quiz', 'assessment', 'student', 'MCQ', 'exam'],
    relatedRoutes: ['/lms/quiz', '/lms/my-learning'],
    steps: [
      { stepNumber: 1, title: 'Open the assessment', description: 'Find it in My Learning and click to start' },
      { stepNumber: 2, title: 'Read instructions', description: 'Review any instructions from the teacher' },
      { stepNumber: 3, title: 'Answer each question', description: 'Select MCQ options or type answers' },
      { stepNumber: 4, title: 'Navigate using question bubbles', description: 'Jump between questions, green = answered' },
      { stepNumber: 5, title: 'Submit the quiz', description: 'Click Submit and confirm to finalize' },
      { stepNumber: 6, title: 'View your results', description: 'See score, percentage, and pass/fail status' },
    ],
    order: 14
  },
  {
    title: 'How to View Assessment Results (Teachers)',
    slug: 'how-to-view-assessment-results',
    summary: 'Teachers can view detailed assessment results including pass rate, question analysis, and individual student scores.',
    content: `# How to View Assessment Results (Teachers)

After students submit an assessment, you can view comprehensive results and analytics.

## Steps

### Step 1: Go to Assessments
Navigate to **Learning (LMS) → Assessments** in the sidebar.

### Step 2: Open Results
Find the assessment and click the **Results** button (or open the assessment and click "View Results").

### Step 3: View Summary Cards
Four summary cards give an overview:

| Card | Description |
|------|-------------|
| **Submissions** | Total number of students who submitted |
| **Pass Rate** | Percentage of students who passed |
| **Avg Score** | Average score across all submissions |
| **High / Low** | Highest and lowest individual scores |

### Step 4: Review Question-wise Analysis
Below the summary, you'll see how students performed on each question:
- **Question number** and text
- **Accuracy bar** — Visual progress bar showing what percentage got it right
- **Attempt stats** — "X/Y" correct out of total attempts

This helps you identify which topics students found difficult.

### Step 5: View Individual Student Results
A table shows every student's performance:
| Column | Description |
|--------|-------------|
| Student | Student name |
| Adm No | Admission number |
| Score | Marks earned out of total |
| % | Score percentage |
| Result | Pass (green) or Fail (red) badge |
| Status | Graded / Pending grading status |

## How to Use This Data
- If a specific question has low accuracy, consider re-teaching that topic
- If the overall pass rate is low, the assessment may have been too difficult
- Use individual scores to identify students who need extra help
- Pending status means long-answer questions need manual grading from the Submissions page`,
    module: 'lms',
    featureKey: 'lms',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'teacher'],
    tags: ['assessment results', 'quiz results', 'analytics', 'pass rate', 'student performance'],
    relatedRoutes: ['/lms/assessments'],
    steps: [
      { stepNumber: 1, title: 'Go to Assessments', description: 'Navigate to Learning (LMS) → Assessments' },
      { stepNumber: 2, title: 'Click Results on an assessment', description: 'Opens the results page' },
      { stepNumber: 3, title: 'View summary cards', description: 'See submissions, pass rate, average, high/low' },
      { stepNumber: 4, title: 'Review question-wise analysis', description: 'Identify difficult questions' },
      { stepNumber: 5, title: 'Check individual student results', description: 'See each student score and pass/fail' },
    ],
    order: 15
  }
];
