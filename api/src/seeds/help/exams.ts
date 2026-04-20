export const examsCategory = {
  name: 'Exam & Assessment',
  slug: 'exam-assessment',
  description: 'Creating exams, entering marks, viewing scores, and generating progress cards',
  icon: 'FileText',
  featureKey: 'exams',
  order: 5,
  status: 'active' as const
};

export const examsArticles = [
  {
    title: 'How to Create an Exam',
    slug: 'how-to-create-an-exam',
    summary: 'Learn how to set up exams with names, types, dates, and statuses.',
    content: `# How to Create an Exam

Exams are used to assess students. Create the exam first, then use Mark Entry to record results.

## Prerequisites
- **Academic Year** must be set up
- **Subjects** must be created with max and pass marks

## Steps

1. Go to **Exam & Assessment → Exams** in the sidebar
2. Click **"Create Exam"**
3. Fill in:
   - **Exam Name** — e.g., "First Term Examination 2025"
   - **Academic Year** — Select from dropdown
   - **Exam Type** — Choose one:
     - Term
     - Quarterly
     - Half-Yearly
     - Annual
     - Class Test
     - Other
   - **Start Date** — When the exam begins (optional)
   - **End Date** — When the exam ends (optional)
   - **Status** — Upcoming / Ongoing / Completed / Cancelled
4. Click **"Save"**

## Example

| Exam Name | Type | Year | Start | End | Status |
|-----------|------|------|-------|-----|--------|
| First Term Exam 2025 | Term | 2025-26 | Sep 15, 2025 | Sep 25, 2025 | Upcoming |
| Quarterly Test Oct | Quarterly | 2025-26 | Oct 10, 2025 | Oct 10, 2025 | Upcoming |
| Half Yearly Exam | Half-Yearly | 2025-26 | Dec 1, 2025 | Dec 15, 2025 | Upcoming |
| Annual Exam | Annual | 2025-26 | Mar 1, 2026 | Mar 15, 2026 | Upcoming |

## Filtering Exams

- **Academic Year** — Filter by year (defaults to current)
- **Exam Type** — Filter by type
- **Status** — Filter by status
- **Search** — Search by exam name

> **Tip:** Create all your exams at the beginning of the academic year. Update their status as they progress (Upcoming → Ongoing → Completed).`,
    module: 'exams',
    featureKey: 'exams',
    roles: ['platform_admin', 'org_admin', 'branch_admin'],
    tags: ['exam', 'create exam', 'test', 'assessment', 'term', 'annual'],
    relatedRoutes: ['/exams'],
    steps: [
      { stepNumber: 1, title: 'Go to Exams', description: 'Navigate to Exam & Assessment → Exams.' },
      { stepNumber: 2, title: 'Click Create Exam', description: 'Click the "Create Exam" button.' },
      { stepNumber: 3, title: 'Fill Exam Details', description: 'Enter name, select year and type, set dates and status.' },
      { stepNumber: 4, title: 'Save', description: 'Click Save to create the exam.' }
    ],
    order: 1
  },
  {
    title: 'How to Enter Marks (Mark Entry)',
    slug: 'how-to-enter-marks',
    summary: 'Complete guide to entering student marks for exams, including using paste from spreadsheet and finalizing marks.',
    content: `# How to Enter Marks (Mark Entry)

After conducting an exam, use Mark Entry to record each student's marks per subject.

## Prerequisites
- An **Exam** must be created
- **Classes**, **Divisions**, and **Subjects** must be set up

## Steps

### Step 1: Navigate to Mark Entry
Go to **Exam & Assessment → Mark Entry** in the sidebar

### Step 2: Select Filters
- **Academic Year** — Select the year (defaults to current)
- **Exam** — Select which exam to enter marks for
- **Class** — Select the class (e.g., "Class 5")
- **Division** — Select division or "All Divisions"
- **Order By** — Choose to order students by Name or Admission Number

### Step 3: Load Students
Click **"Go"** to load the student list. A table appears with:
- Student names in the first column
- Admission numbers in the second column
- One column per subject (empty input fields for marks)
- Auto-calculated Total and Percentage columns

### Step 4: Enter Marks
- Click on a mark input field and type the mark (e.g., "85")
- Press **Tab** to move to the next subject
- The **Total** and **Percentage** calculate automatically
- Repeat for each student

### Step 5: Paste from Spreadsheet (Optional Shortcut)
If you have marks in an Excel/Google Sheets file:
1. Copy a column of marks from your spreadsheet
2. Click on the first cell of the subject column
3. Click **"Paste"** — the marks fill in automatically

### Step 6: Save (Draft)
Click **"Save"** to save the marks as a **draft**. You can come back and edit later.

### Step 7: Finalize
When you're sure all marks are correct, click **"Finalize"**.

> ⚠️ **Warning:** Finalizing **locks the marks permanently**. You cannot edit them after finalization.

## Export and Print

- **Download** — Export the marks as a CSV file
- **Print** — Open a print-friendly version for physical records

## Example

Entering marks for Class 5A, First Term Exam:
1. Year: 2025-26, Exam: First Term, Class: 5, Division: A
2. Click "Go" → 40 students appear
3. For student "Rahul Kumar": Math: 85, Science: 78, English: 92, Hindi: 70
4. Total: 325/400, Percentage: 81.25%
5. Save as draft → Continue entering for other students → Finalize when done

> **Tip:** Save frequently as you enter marks. The "Save" button saves a draft that you can edit. Only click "Finalize" when everything is confirmed.`,
    module: 'marks',
    featureKey: 'exams',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'teacher'],
    tags: ['marks', 'mark entry', 'grades', 'score', 'exam results', 'enter marks'],
    relatedRoutes: ['/mark-entry'],
    steps: [
      { stepNumber: 1, title: 'Go to Mark Entry', description: 'Navigate to Exam & Assessment → Mark Entry.' },
      { stepNumber: 2, title: 'Select Filters', description: 'Choose academic year, exam, class, and division.' },
      { stepNumber: 3, title: 'Click Go', description: 'Click "Go" to load the student list.' },
      { stepNumber: 4, title: 'Enter Marks', description: 'Type marks for each student in each subject column.' },
      { stepNumber: 5, title: 'Save', description: 'Click Save to save as draft.' },
      { stepNumber: 6, title: 'Finalize', description: 'Click Finalize to lock marks permanently when confirmed.' }
    ],
    order: 2
  },
  {
    title: 'How to View Exam Scores',
    slug: 'how-to-view-exam-scores',
    summary: 'Learn how to view consolidated exam results with marks, totals, and percentages for a class.',
    content: `# How to View Exam Scores

View the consolidated results for an entire class after marks have been entered.

## Steps

1. Go to **Exam & Assessment → Exam Scores** in the sidebar
2. Select filters:
   - **Academic Year** — Select the year
   - **Class** — Select class (e.g., "Class 5")
   - **Division** — Select division or "All"
   - **Exam** — The exam dropdown loads automatically based on the year
3. Select the exam to view
4. The results table shows:

| # | Name | Adm No | Math | Science | English | Hindi | Total | % |
|---|------|--------|------|---------|---------|-------|-------|---|
| 1 | Rahul Kumar | 2025-5A-001 | 85 | 78 | 92 | 70 | 325 | 81.25% |
| 2 | Anu Menon | 2025-5A-002 | 90 | 85 | 88 | 82 | 345 | 86.25% |

## This is a Read-Only View

- You **cannot edit marks** from this page
- To modify marks, go to **Mark Entry** and edit before finalization
- This page is for reviewing and reporting purposes

> **Tip:** Use this view to quickly check class performance across subjects. Sort by percentage to identify top performers and students who may need extra support.`,
    module: 'marks',
    featureKey: 'exams',
    roles: [],
    tags: ['exam scores', 'results', 'view marks', 'totals', 'percentage'],
    relatedRoutes: ['/exam-score'],
    steps: [
      { stepNumber: 1, title: 'Go to Exam Scores', description: 'Navigate to Exam & Assessment → Exam Scores.' },
      { stepNumber: 2, title: 'Select Filters', description: 'Choose year, class, division, and exam.' },
      { stepNumber: 3, title: 'View Results', description: 'The table shows all students with marks per subject, totals, and percentages.' }
    ],
    order: 3
  },
  {
    title: 'How to Generate and Print Progress Cards',
    slug: 'how-to-generate-progress-cards',
    summary: 'Learn how to generate printable progress cards for students with exam results across multiple terms.',
    content: `# How to Generate and Print Progress Cards

Progress cards consolidate a student's performance across multiple exams into a single printable report.

## Steps

1. Go to **Exam & Assessment → Progress Card** in the sidebar
2. Select filters:
   - **Academic Year** — Select the year
   - **Class** — Select the class
   - **Division** — Select division or "All"
   - **Exams** — Multi-select the exams to include (e.g., Term 1 + Term 2)
     - Use "Toggle All" to select all exams
   - **Subjects** — Multi-select the subjects to include
     - Use "Toggle All" to select all subjects
   - **Page Size** — A4 or A5
3. Click **"Generate"**
4. Progress cards are generated showing each student's marks across selected exams
5. Click **"Print"** to print

## What's On the Progress Card

- Student name and admission number
- Class and division
- Selected exams as column headers
- Marks per subject per exam
- Total marks and percentage per exam
- Attendance summary (if available)

## Printing Options

- **Print All** — Prints progress cards for all students in the class
- **Print Individual** — Select specific students to print

## Example

Generate progress cards for Class 5A for the full year:
1. Year: 2025-26, Class: 5, Division: A
2. Select exams: Term 1, Half-Yearly, Term 2, Annual
3. Select all subjects
4. Page size: A4
5. Click Generate → Print

> **Tip:** Choose A5 page size if you want 2 progress cards per A4 sheet (more paper-efficient for distribution).`,
    module: 'marks',
    featureKey: 'exams',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'teacher'],
    tags: ['progress card', 'report card', 'print', 'student report', 'grades'],
    relatedRoutes: ['/progress-card'],
    steps: [
      { stepNumber: 1, title: 'Go to Progress Card', description: 'Navigate to Exam & Assessment → Progress Card.' },
      { stepNumber: 2, title: 'Select Filters', description: 'Choose year, class, division, exams, and subjects.' },
      { stepNumber: 3, title: 'Select Page Size', description: 'Choose A4 or A5 format.' },
      { stepNumber: 4, title: 'Generate', description: 'Click Generate to create the progress cards.' },
      { stepNumber: 5, title: 'Print', description: 'Click Print to send to printer.' }
    ],
    order: 4
  }
];
