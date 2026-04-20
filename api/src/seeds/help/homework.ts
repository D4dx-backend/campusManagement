export const homeworkCategory = {
  name: 'Homework & Daily Diary',
  slug: 'homework',
  description: 'Assign homework, manage daily diary entries, and view assignments',
  icon: 'BookOpen',
  featureKey: null,
  order: 16,
  status: 'active' as const
};

export const homeworkArticles = [
  {
    title: 'How to Assign Homework',
    slug: 'how-to-assign-homework',
    summary: 'Create and manage homework assignments for classes with subjects, descriptions, and due dates.',
    content: `# How to Assign Homework

Teachers and admins can assign daily homework or diary entries to specific classes.

## Who Can Use This?
- **Branch Admin** — Can manage all homework for the branch
- **Teacher** — Can create, edit, and delete their own homework assignments

## Steps

### Step 1: Go to Homework
Click **Homework** in the sidebar (under the Attendance section).

### Step 2: Click "Assign Homework"
Click the **Assign Homework** button in the top-right corner.

### Step 3: Fill in the Details
- **Class** — Select the class to assign homework to (e.g., "Class 5")
- **Subject** — Enter the subject name (e.g., "Mathematics")
- **Title** — A short title (e.g., "Chapter 5 Exercises")
- **Description** — The full homework details — what pages to read, problems to solve, etc.
- **Date** — The date this homework is for (defaults to today)
- **Due Date** — When students should complete it by (must be on or after the date)

### Step 4: Click "Assign"
The homework is now visible to students in that class.

## Managing Homework

### View Homework
The main page shows a table with all homework:
| Column | Description |
|--------|-------------|
| Date | When the homework was assigned |
| Class | Which class it's for |
| Subject | The subject |
| Title | Homework title (with description preview) |
| Due Date | Deadline (shown in red if overdue) |
| Assigned By | The teacher who assigned it |

### Filter by Class
Use the **Class** dropdown above the table to filter homework for a specific class.

### Edit Homework
Click the **pencil icon** next to any homework entry to:
- Change the class, subject, title, description, or dates
- Click **Update** to save changes
- Only the creator or an admin can edit

### Delete Homework
Click the **trash icon** to remove homework. This is permanent.

## Tips
- Keep homework titles short and descriptive
- Put detailed instructions in the Description field
- Set realistic due dates
- Students see homework in their **"My Homework"** page, organized by date
`,
    module: 'homework',
    featureKey: null,
    roles: ['org_admin', 'branch_admin', 'teacher'],
    tags: ['homework', 'daily diary', 'assignments', 'teacher', 'class work'],
    relatedRoutes: ['/homework'],
    steps: [
      { stepNumber: 1, title: 'Go to Homework', description: 'Click Homework in the sidebar' },
      { stepNumber: 2, title: 'Click "Assign Homework"', description: 'Opens the assignment dialog' },
      { stepNumber: 3, title: 'Fill class, subject, title, description, dates', description: 'Enter the homework details' },
      { stepNumber: 4, title: 'Click "Assign"', description: 'Homework becomes visible to students' },
    ],
    order: 1,
  },
  {
    title: 'How to View My Homework (Students)',
    slug: 'how-to-view-my-homework-student',
    summary: 'Students can view all their assigned homework organized by date.',
    content: `# How to View My Homework (Students)

As a student, you can see all homework assigned to your class, organized by date.

## Steps

### Step 1: Go to My Homework
Click **My Homework** in the sidebar (under the **My Academic** section).

### Step 2: View Homework by Date
Homework is grouped by date, with the **most recent first**. Each date section shows:
- **Date heading** — The assignment date (shows "Today" for today's homework)
- **Homework cards** — One card per assignment containing:
  - **Title** — The homework title
  - **Class badge** — Your class
  - **Subject badge** — The subject
  - **Due Date** — The deadline (shown in **red** if overdue)
  - **Description** — Full homework instructions
  - **Assigned by** — The teacher's name

## Understanding Due Dates
- Due dates shown in normal text = still time left
- Due dates shown in **red** = the deadline has passed (overdue)

## Tips
- Check this page daily to stay up-to-date
- Note down due dates for upcoming assignments
- If a homework seems unclear, ask your teacher for clarification

> **Note:** You cannot edit or submit homework through this page — it's a read-only view. Your teacher may use a different method for homework submission.
`,
    module: 'homework',
    featureKey: null,
    roles: ['student'],
    tags: ['homework', 'my homework', 'student', 'daily diary', 'assignments'],
    relatedRoutes: ['/my-homework'],
    steps: [
      { stepNumber: 1, title: 'Go to My Homework', description: 'Click My Homework in the sidebar' },
      { stepNumber: 2, title: 'View homework grouped by date', description: 'See all assignments with due dates and descriptions' },
    ],
    order: 2,
  },
];
