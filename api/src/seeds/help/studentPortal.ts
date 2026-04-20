export const studentPortalCategory = {
  name: 'Student Self-Service',
  slug: 'student-portal',
  description: 'View your attendance, marks, fees, homework, and timetable',
  icon: 'GraduationCap',
  featureKey: null,
  order: 18,
  status: 'active' as const
};

export const studentPortalArticles = [
  {
    title: 'How to View My Attendance',
    slug: 'how-to-view-my-attendance',
    summary: 'Students can view their monthly attendance calendar showing present, absent, late, and half-day statuses.',
    content: `# How to View My Attendance

As a student, you can view your attendance record month by month in a visual calendar format.

## Steps

### Step 1: Go to My Attendance
Click **My Attendance** in the sidebar (under the **My Academic** section).

### Step 2: View the Current Month
You'll see:
- Your **class name** and **section** at the top
- **Summary cards** showing your attendance stats:
  - **Total Days** — School days in this month
  - **Present** — Days you were present (green)
  - **Absent** — Days you were absent (red)
  - **Late** — Days you arrived late (yellow)
  - **Rate %** — Your attendance percentage (blue)

### Step 3: View the Calendar Grid
Below the summary, a **calendar grid** shows every day of the month:
- Each day has a colored circle:
  - 🟢 **Green** = Present
  - 🔴 **Red** = Absent
  - 🟡 **Yellow** = Late
  - 🟠 **Orange** = Half Day
  - ⚫ **Gray** = No record (holiday/weekend)

### Step 4: Navigate Between Months
Use the **left arrow (←)** and **right arrow (→)** buttons to view previous or future months.

## Understanding Your Attendance Rate
Your attendance rate is calculated as:

**Rate = (Present + Late + Half Day) ÷ Total Days × 100**

A high attendance rate (above 90%) is generally expected. If your attendance drops, you may see warnings from the school.

## Legend
A legend at the bottom of the calendar explains the color codes:
| Color | Meaning |
|-------|---------|
| Green | Present |
| Red | Absent |
| Yellow | Late |
| Orange | Half Day |
`,
    module: 'attendance',
    featureKey: 'attendance',
    roles: ['student'],
    tags: ['my attendance', 'student attendance', 'attendance calendar', 'attendance rate'],
    relatedRoutes: ['/my-attendance'],
    steps: [
      { stepNumber: 1, title: 'Go to My Attendance', description: 'Click My Attendance in the sidebar' },
      { stepNumber: 2, title: 'View monthly summary cards', description: 'See present, absent, late counts and rate' },
      { stepNumber: 3, title: 'Check the calendar grid', description: 'Color-coded dots show daily status' },
      { stepNumber: 4, title: 'Navigate months', description: 'Use arrows to view different months' },
    ],
    order: 1,
  },
  {
    title: 'How to View My Marks and Grades',
    slug: 'how-to-view-my-marks',
    summary: 'Students can view their exam results including marks, grades, and pass/fail status for each subject.',
    content: `# How to View My Marks and Grades

View your performance across all exams — marks scored, maximum marks, grades, and pass/fail status for every subject.

## Steps

### Step 1: Go to My Marks
Click **My Marks** in the sidebar (under the **My Academic** section).

### Step 2: View Your Exam Results
Each exam appears as a card showing:

**Card Header:**
- **Exam name** (e.g., "First Term Exam")
- **Academic Year** badge
- **Overall Score** badge — Shows your total marks, maximum marks, and percentage
  - 🟢 Green if ≥ 60%
  - 🟠 Orange if ≥ 35%
  - 🔴 Red if < 35%

**Subject Table (inside each card):**
| Column | Description |
|--------|-------------|
| Subject | The subject name |
| Marks | Marks you scored (or "—" if not yet entered) |
| Max | Maximum marks possible |
| Pass | Passing marks for this subject |
| Grade | Your letter grade (A+, A, B+, etc.) |
| Status | **Pass** (green) or **Fail** (red) |

## Understanding Grades
- **Pass**: Your marks ≥ the passing marks for that subject
- **Fail**: Your marks < the passing marks, or marks not yet entered

## Tips
- Check after each exam period to see your results
- If marks show "—", it means the teacher hasn't entered your marks yet
- Your overall percentage appears in the colored badge at the top of each exam card
`,
    module: 'exams',
    featureKey: 'exams',
    roles: ['student'],
    tags: ['my marks', 'grades', 'exam results', 'student marks', 'report card'],
    relatedRoutes: ['/my-marks'],
    steps: [
      { stepNumber: 1, title: 'Go to My Marks', description: 'Click My Marks in the sidebar' },
      { stepNumber: 2, title: 'View exam cards', description: 'Each exam shows subjects, marks, grades, pass/fail' },
    ],
    order: 2,
  },
  {
    title: 'How to View My Fee Details',
    slug: 'how-to-view-my-fee-details',
    summary: 'Students can view their fee summary, fee structure breakdown, and payment history.',
    content: `# How to View My Fee Details

Check your total fees, how much has been paid, outstanding balance, and full payment history.

## Steps

### Step 1: Go to My Fees
Click **My Fees** in the sidebar (under the **My Academic** section).

### Step 2: View Fee Summary
Three summary cards show at the top:

| Card | Description |
|------|-------------|
| **Total Fees** | The total amount of fees assigned to you (blue) |
| **Total Paid** | How much has been paid so far (green) |
| **Balance** | Outstanding amount (red), or "Fully Paid" (green) if nothing is due |

### Step 3: View Fee Structure
If a fee structure is assigned, you'll see a breakdown table:
| Column | Description |
|--------|-------------|
| Fee Type | Type of fee (Tuition, Lab, Transport, etc.) |
| Title | Specific fee title |
| Amount | The fee amount |
| **Total** | Sum of all fees (shown at bottom) |

### Step 4: View Payment History
Below the fee structure, a payment history table shows:
| Column | Description |
|--------|-------------|
| Receipt | Receipt number (e.g., "REC-001") |
| Date | Payment date |
| Method | How it was paid (Cash, Online, Cheque, etc.) |
| Amount | Amount paid |
| Status | Payment status (usually "Paid") |

## Tips
- If your balance shows a pending amount, inform your parents/guardians
- Receipt numbers can be used as proof of payment
- Contact the school office if you see any discrepancy in the amounts
`,
    module: 'fees',
    featureKey: 'finance',
    roles: ['student'],
    tags: ['my fees', 'student fees', 'fee details', 'payment history', 'balance'],
    relatedRoutes: ['/my-fees'],
    steps: [
      { stepNumber: 1, title: 'Go to My Fees', description: 'Click My Fees in the sidebar' },
      { stepNumber: 2, title: 'View summary cards', description: 'See total fees, paid amount, and balance' },
      { stepNumber: 3, title: 'Check fee structure', description: 'See the breakdown of different fee types' },
      { stepNumber: 4, title: 'View payment history', description: 'See all past payments with receipt numbers' },
    ],
    order: 3,
  },
];
