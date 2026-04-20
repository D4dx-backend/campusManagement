export const attendanceCategory = {
  name: 'Attendance & Leave',
  slug: 'attendance-leave',
  description: 'Marking daily attendance, viewing reports, and managing leave requests',
  icon: 'CalendarCheck',
  featureKey: 'attendance',
  order: 6,
  status: 'active' as const
};

export const attendanceArticles = [
  {
    title: 'How to Mark Daily Attendance',
    slug: 'how-to-mark-daily-attendance',
    summary: 'Step-by-step guide to marking student attendance with Present, Absent, Late, and Half Day statuses.',
    content: `# How to Mark Daily Attendance

Mark attendance for each class every day. Students can be marked as Present, Absent, Late, or Half Day.

## Steps

### Step 1: Navigate to Attendance
Go to **Attendance → Mark Attendance** in the sidebar

### Step 2: Select Filters
- **Date** — Defaults to today. Change if marking for a different date
- **Academic Year** — Defaults to current year
- **Class** — Select the class (e.g., "Class 5")
- **Division** — Select division or "All Divisions"

### Step 3: Load Students
Click **"Load Students"** to display the student list

### Step 4: Mark Attendance
Each student has a **status badge** which you click to cycle through:
- 🟢 **P (Present)** — Student is in school
- 🔴 **A (Absent)** — Student is not in school
- 🟡 **L (Late)** — Student arrived late
- 🟠 **H (Half Day)** — Student was present for only part of the day

**How to mark:** Simply **click the badge** next to each student's name. Each click cycles: P → A → L → H → P

### Step 5: Use Quick Actions (Optional)
- **"Mark All Present"** — Sets all students to Present in one click
- **"Mark All Absent"** — Sets all students to Absent in one click

This is useful when most students are present — click "Mark All Present" first, then change only the absent students.

### Step 6: Save
Click **"Save Attendance"** to record the attendance

## Stats Bar

While marking, a real-time stats bar shows:
- **Total Students** — total in the class
- **Present** — count (green)
- **Absent** — count (red)
- **Late** — count (yellow)
- **Half Day** — count (orange)

## Editing Past Attendance

If you already marked attendance for a date:
1. Select the date
2. Load students — the existing attendance pre-fills
3. Make changes
4. Save — the existing record is updated

## Example

Marking attendance for Class 5A on October 15, 2025:
1. Date: Oct 15, 2025 | Class: 5 | Division: A
2. Click "Load Students" → 40 students appear
3. Click "Mark All Present" → All set to P
4. Change Anu to A (Absent), Rahul to L (Late)
5. Stats: Present: 38, Absent: 1, Late: 1
6. Click "Save Attendance" ✓

> **Tip:** Use "Mark All Present" first, then change only the exceptions. This is much faster than marking each student individually.`,
    module: 'attendance',
    featureKey: 'attendance',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'teacher'],
    tags: ['attendance', 'mark attendance', 'present', 'absent', 'late', 'daily'],
    relatedRoutes: ['/attendance'],
    steps: [
      { stepNumber: 1, title: 'Select Date and Class', description: 'Choose the date, class, and division.' },
      { stepNumber: 2, title: 'Load Students', description: 'Click "Load Students" to display the list.' },
      { stepNumber: 3, title: 'Mark Status', description: 'Click each student\'s badge to cycle through P/A/L/H.' },
      { stepNumber: 4, title: 'Use Quick Actions', description: 'Optionally click "Mark All Present" first, then change exceptions.' },
      { stepNumber: 5, title: 'Save', description: 'Click "Save Attendance" to record.' }
    ],
    order: 1
  },
  {
    title: 'How to View Attendance Reports',
    slug: 'how-to-view-attendance-reports',
    summary: 'Learn how to view monthly attendance reports with a day-by-day grid showing each student\'s status.',
    content: `# How to View Attendance Reports

View a complete monthly overview of attendance for any class, with a day-by-day grid.

## Steps

1. Go to **Attendance → Attendance Report** in the sidebar
2. Select filters:
   - **Month** — Select the month (e.g., "October")
   - **Year** — Select the year (e.g., "2025")
   - **Class** — Select the class
   - **Division** — Select division or "All"
3. Click **"Submit"**

## Reading the Report

The report shows a grid:
- **Rows** — Each student (name + admission number)
- **Columns** — Days of the month (1 through 31)
- **Status Indicators:**
  - **P** (green) — Present
  - **A** (red) — Absent
  - **L** (yellow) — Late
  - **H** (orange) — Half Day
  - **–** — No record for that day
- **Sunday columns** — Highlighted in red
- **Totals** — Each student's Present and Absent counts at the end

## Printing the Report

Click **"Print"** to generate a print-friendly version with:
- School name and header
- Class, division, month, and year
- Full attendance grid
- Student totals

> **Tip:** Print the monthly report and keep it as a physical record. The print version includes all the formatting needed for school records.`,
    module: 'attendance',
    featureKey: 'attendance',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'teacher'],
    tags: ['attendance report', 'monthly report', 'print', 'grid', 'summary'],
    relatedRoutes: ['/attendance-report'],
    steps: [
      { stepNumber: 1, title: 'Go to Attendance Report', description: 'Navigate to Attendance → Attendance Report.' },
      { stepNumber: 2, title: 'Select Month and Class', description: 'Choose the month, year, class, and division.' },
      { stepNumber: 3, title: 'Click Submit', description: 'Click Submit to generate the report.' },
      { stepNumber: 4, title: 'Review and Print', description: 'View the grid and click Print for a printable version.' }
    ],
    order: 2
  },
  {
    title: 'How to Submit a Leave Request (For Students)',
    slug: 'how-to-submit-leave-request',
    summary: 'Students and parents can learn how to submit a leave request through the system.',
    content: `# How to Submit a Leave Request

If you are a student or your teacher/admin is submitting on your behalf, follow these steps to request leave.

## Steps

1. Go to **Attendance → Leave Requests** in the sidebar
2. Click **"New Leave Request"**
3. Fill in:
   - **Student** — (Pre-filled if you're a student; for teachers, search and select the student)
   - **From Date** — First day of leave
   - **To Date** — Last day of leave
   - **Reason** — Explain why leave is needed (e.g., "Family function", "Medical appointment")
4. Click **"Submit"**

## After Submission

- Your request appears in the list with status **"Pending"** (yellow badge)
- A teacher or admin will review it
- Once reviewed, the status changes to:
  - **"Approved"** (green) — Leave is granted
  - **"Rejected"** (red) — Leave is not granted (may include a note)

## Checking Your Leave Requests

- Go to **Leave Requests** to see all your submitted requests
- Check the **status** column to see if it's pending, approved, or rejected

## Example

Student Anu submitting leave:
- **From:** October 20, 2025
- **To:** October 22, 2025
- **Reason:** "Family wedding ceremony"
- Click Submit → Status: Pending ⏳
- Teacher reviews and approves → Status: Approved ✅`,
    module: 'leave_requests',
    featureKey: 'attendance',
    roles: ['student', 'teacher', 'branch_admin', 'org_admin', 'platform_admin'],
    tags: ['leave request', 'submit leave', 'absence', 'permission', 'student leave'],
    relatedRoutes: ['/leave-requests'],
    steps: [
      { stepNumber: 1, title: 'Go to Leave Requests', description: 'Navigate to Attendance → Leave Requests.' },
      { stepNumber: 2, title: 'Click New Leave Request', description: 'Click the "New Leave Request" button.' },
      { stepNumber: 3, title: 'Fill Details', description: 'Select student (if teacher), set dates, and enter reason.' },
      { stepNumber: 4, title: 'Submit', description: 'Click Submit. The request shows as "Pending".' }
    ],
    order: 3
  },
  {
    title: 'How to Review Leave Requests (For Teachers and Admins)',
    slug: 'how-to-review-leave-requests',
    summary: 'Teachers and admins can learn how to approve or reject student leave requests.',
    content: `# How to Review Leave Requests

As a teacher or admin, you can review, approve, or reject student leave requests.

## Steps

1. Go to **Attendance → Leave Requests** in the sidebar
2. You'll see a list of all leave requests for your class/branch
3. **Filter by status** — Select "Pending" to see requests waiting for review
4. **Filter by class** — Narrow down to a specific class
5. Find the request to review
6. Click **"Approve"** or **"Reject"**:
   - **Approve** — Grants the leave
   - **Reject** — Denies the leave
7. Optionally add a **note** (e.g., "Approved - please submit medical certificate on return")
8. Click **"Confirm"**

## Status Guide

| Status | Badge Color | Meaning |
|--------|-------------|---------|
| Pending | 🟡 Yellow | Waiting for review |
| Approved | 🟢 Green | Leave granted |
| Rejected | 🔴 Red | Leave denied |

## Example

Reviewing Anu's leave request:
1. Filter: Status = "Pending"
2. Find: Anu Menon, Oct 20-22, Reason: "Family wedding"
3. Click "Approve"
4. Add note: "Approved. Submit wedding invitation copy"
5. Click Confirm ✓

> **Tip:** Review leave requests regularly to avoid delays. Students and parents can see the status update immediately after you approve or reject.`,
    module: 'leave_requests',
    featureKey: 'attendance',
    roles: ['teacher', 'branch_admin', 'org_admin', 'platform_admin'],
    tags: ['review leave', 'approve', 'reject', 'leave request', 'teacher'],
    relatedRoutes: ['/leave-requests'],
    steps: [
      { stepNumber: 1, title: 'Go to Leave Requests', description: 'Navigate to Attendance → Leave Requests.' },
      { stepNumber: 2, title: 'Filter Pending', description: 'Filter by status "Pending" to see requests awaiting review.' },
      { stepNumber: 3, title: 'Review Request', description: 'Read the student name, dates, and reason.' },
      { stepNumber: 4, title: 'Approve or Reject', description: 'Click Approve or Reject, add an optional note, and confirm.' }
    ],
    order: 4
  }
];
