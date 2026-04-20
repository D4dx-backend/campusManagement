export const timetableCategory = {
  name: 'Timetable',
  slug: 'timetable',
  description: 'Configure periods, create class timetables, and view teaching schedules',
  icon: 'Grid3X3',
  featureKey: null,
  order: 7,
  status: 'active' as const
};

export const timetableArticles = [
  {
    title: 'How to Create Timetable Configs',
    slug: 'how-to-create-timetable-configs',
    summary: 'Set up period structures, working days, and time slots that form the base for timetables.',
    content: `# How to Create Timetable Configs

A Timetable Config defines the period structure for your school — how many periods per day, break times, and start/end times for each slot.

## Who Can Use This?
- **Branch Admin** and **Org Admin** only

## Steps

### Step 1: Go to Timetable Configs
Click **Academics → Timetable Configs** in the sidebar.

### Step 2: Click "New Config"
Click the **New Config** button in the top-right corner.

### Step 3: Fill Basic Details
- **Config Name** — Give a descriptive name (e.g., "Standard 8-Period Day", "Saturday Half Day")
- **Academic Year** — Select the academic year this config applies to

### Step 4: Set Working Days
Select which days of the week have classes. Default is Monday to Friday. You can include Saturday if needed.

### Step 5: Configure Period Slots
For each working day, define the time slots:
- **Slot Type** — Choose "Period" (for a teaching period) or "Break" (for intervals/lunch)
- **Label** — A friendly name (e.g., "Period 1", "Lunch Break")
- **Start Time** — When this period starts (e.g., 9:00 AM)
- **End Time** — When this period ends (e.g., 9:45 AM)

> **Tip:** You can copy the schedule from one day and apply it to other days if they follow the same pattern.

### Step 6: Save the Config
Click **Create** to save. The config will appear as a card on the main page.

## Managing Configs
- **Edit** — Click the edit icon on any config card to modify it
- **Delete** — Click the delete icon. Note: if any timetable uses this config, deletion will be blocked
- **Search** — Use the search bar to find configs by name
- **Filter** — Use the Academic Year dropdown to filter configs

## Example
A typical config might look like:
| Slot | Type | Label | Time |
|------|------|-------|------|
| 1 | Period | Period 1 | 9:00 AM – 9:45 AM |
| 2 | Period | Period 2 | 9:45 AM – 10:30 AM |
| 3 | Break | Short Break | 10:30 AM – 10:45 AM |
| 4 | Period | Period 3 | 10:45 AM – 11:30 AM |
| 5 | Period | Period 4 | 11:30 AM – 12:15 PM |
| 6 | Break | Lunch | 12:15 PM – 1:00 PM |
| 7 | Period | Period 5 | 1:00 PM – 1:45 PM |
| 8 | Period | Period 6 | 1:45 PM – 2:30 PM |
`,
    module: 'timetable',
    featureKey: null,
    roles: ['org_admin', 'branch_admin'],
    tags: ['timetable', 'config', 'periods', 'schedule', 'time slots'],
    relatedRoutes: ['/timetable-configs'],
    steps: [
      { stepNumber: 1, title: 'Go to Timetable Configs', description: 'Academics → Timetable Configs in sidebar' },
      { stepNumber: 2, title: 'Click "New Config"', description: 'Opens the creation dialog' },
      { stepNumber: 3, title: 'Enter name and academic year', description: 'Give a descriptive name and select the year' },
      { stepNumber: 4, title: 'Select working days', description: 'Choose which days have classes' },
      { stepNumber: 5, title: 'Configure period slots', description: 'Set period/break types, times for each day' },
      { stepNumber: 6, title: 'Click Create', description: 'Save the timetable config' },
    ],
    order: 1,
  },
  {
    title: 'How to Create and Manage Timetables',
    slug: 'how-to-create-manage-timetables',
    summary: 'Create class timetables by assigning subjects and teachers to each period, with auto-generation and cloning support.',
    content: `# How to Create and Manage Timetables

Timetables assign subjects and teachers to each period slot for every class and division.

## Who Can Use This?
- **Branch Admin** and **Org Admin** only

## Creating a Timetable Manually

### Step 1: Go to Timetable Management
Click **Academics → Timetable** in the sidebar.

### Step 2: Select Class Details
- Choose the **Academic Year**
- Select the **Class** (e.g., "Class 5")
- Select the **Division** (e.g., "A")

### Step 3: Choose a Config
If no timetable exists for this class, you'll see a "Create Manually" button. Click it, then select which **Timetable Config** (period structure) to use.

### Step 4: Assign Subjects and Teachers
A grid appears with days as columns and periods as rows. For each cell:
- Select the **Subject** from the dropdown
- Select the **Teacher** from the dropdown
- Break slots are shown in gray and cannot be edited

### Step 5: Check for Conflicts
Click **Check Conflicts** to verify no teacher is assigned to two classes at the same time. Fix any conflicts shown.

### Step 6: Save
Click **Save** to save as a draft timetable.

### Step 7: Activate
Once you're satisfied, click **Activate** to make it the live timetable for that class.

## Auto-Generate a Timetable
Instead of manually filling every cell:

1. Click **Auto Generate** on an empty class or existing timetable
2. Select the **Timetable Config** to use
3. Add rows for each subject:
   - Select **Subject**
   - Select **Teacher**
   - Enter **Periods per week** (how many times this subject should appear)
4. Optionally toggle **"Use AI (Gemini)"** for smarter distribution
5. Click **Generate** — the system fills the grid automatically
6. Review, then **Save** and **Activate**

## Clone a Timetable
To copy an existing timetable to another class:

1. Open the active timetable for a class
2. Click **Clone**
3. Select the **Target Class** and **Target Division**
4. Click **Clone** — a draft copy is created for the target class

## Teacher View
Switch to the **Teacher View** tab to see any teacher's full schedule:
- **Weekly Tab** — Full week grid showing all their classes
- **Daily Tab** — Day-by-day card view of classes
- **By Class Tab** — See a specific class timetable with the teacher's slots highlighted

## Managing Timetables
- **Draft** timetables can be edited, activated, or deleted
- **Active** timetables can be cloned or replaced by activating a new draft
- **Archived** timetables are read-only historical records
`,
    module: 'timetable',
    featureKey: null,
    roles: ['org_admin', 'branch_admin'],
    tags: ['timetable', 'schedule', 'subject assignment', 'teacher assignment', 'auto generate', 'clone'],
    relatedRoutes: ['/timetable'],
    steps: [
      { stepNumber: 1, title: 'Go to Timetable Management', description: 'Academics → Timetable in sidebar' },
      { stepNumber: 2, title: 'Select year, class, and division', description: 'Choose which class to create timetable for' },
      { stepNumber: 3, title: 'Select a timetable config', description: 'Choose the period structure' },
      { stepNumber: 4, title: 'Assign subjects and teachers', description: 'Fill the grid or use Auto Generate' },
      { stepNumber: 5, title: 'Check for conflicts', description: 'Verify no teacher double-booked' },
      { stepNumber: 6, title: 'Save and Activate', description: 'Save as draft, then activate when ready' },
    ],
    order: 2,
  },
  {
    title: 'How to View My Timetable (Students)',
    slug: 'how-to-view-my-timetable-student',
    summary: 'Students can view their class timetable in weekly or daily format.',
    content: `# How to View My Timetable (Students)

As a student, you can view your class timetable to know which subjects and teachers you have each day.

## Steps

### Step 1: Go to My Timetable
Click **My Timetable** in the sidebar (under Attendance section).

### Step 2: View Your Schedule
You'll see your **class name**, **division**, and **academic year** at the top.

Two views are available:

### Full Week View
Shows the complete weekly timetable in a grid format:
- **Columns** = Days of the week (Mon–Fri or as configured)
- **Rows** = Period time slots
- Each cell shows the **subject** for that period

### Day View
Shows a single day's classes as cards:
- Click on any **day button** (Mon, Tue, Wed, etc.) to see that day
- Today is marked with a dot (•) for quick access
- Each card shows:
  - **Time** (start–end)
  - **Subject name**
  - **Teacher name**
  - **Period number**

> **Note:** If no timetable has been created for your class yet, you'll see a message saying no timetable is available.
`,
    module: 'timetable',
    featureKey: null,
    roles: ['student'],
    tags: ['timetable', 'my timetable', 'student', 'class schedule', 'daily view'],
    relatedRoutes: ['/my-timetable'],
    steps: [
      { stepNumber: 1, title: 'Go to My Timetable', description: 'Click My Timetable in the sidebar' },
      { stepNumber: 2, title: 'View Full Week or Day View', description: 'Switch between weekly grid and daily card views' },
    ],
    order: 3,
  },
  {
    title: 'How to View My Teaching Schedule (Teachers)',
    slug: 'how-to-view-my-teaching-schedule',
    summary: 'Teachers can view their complete teaching schedule across all assigned classes.',
    content: `# How to View My Teaching Schedule (Teachers)

As a teacher, you can view your complete teaching schedule showing all your classes, subjects, and timings.

## Steps

### Step 1: Go to My Schedule
Click **My Schedule** in the sidebar (under Attendance section).

### Step 2: View Summary
At the top, you'll see:
- **Total Classes** — How many different classes you teach
- **Periods/Week** — Total teaching periods in the week
- **Periods Today** — How many classes you have today

### Step 3: Choose a View

#### Weekly View
A full grid showing your entire week:
- **Rows** = Time slots from all your classes
- **Columns** = Working days
- Each cell shows the **class name** and **subject**
- Today's column is highlighted in blue
- Break slots appear in a muted style

#### Daily View
Click on a **day button** to see that specific day:
- Each class shows as a card with:
  - **Time** (start–end)
  - **Subject**
  - **Class–Division** (e.g., "Class 5 – A")
  - **Period number**
- Days with no classes show "No classes scheduled"

#### By Class View
Select a specific class from the dropdown:
- Full timetable grid for that class is displayed
- Your teaching slots are **highlighted** so you can easily spot your periods

> **Tip:** Use the By Class view to quickly check when you teach in a particular class without scanning the whole week.
`,
    module: 'timetable',
    featureKey: null,
    roles: ['teacher'],
    tags: ['timetable', 'my schedule', 'teacher', 'teaching schedule', 'weekly view'],
    relatedRoutes: ['/my-schedule'],
    steps: [
      { stepNumber: 1, title: 'Go to My Schedule', description: 'Click My Schedule in the sidebar' },
      { stepNumber: 2, title: 'View your summary', description: 'See total classes, periods/week, periods today' },
      { stepNumber: 3, title: 'Choose Weekly, Daily, or By Class view', description: 'Switch between views using tabs' },
    ],
    order: 4,
  },
];
