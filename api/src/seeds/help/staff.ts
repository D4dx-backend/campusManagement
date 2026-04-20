export const staffCategory = {
  name: 'Staff Management',
  slug: 'staff-management',
  description: 'Adding, editing, and managing teaching and non-teaching staff',
  icon: 'Users',
  featureKey: 'staff',
  order: 3,
  status: 'active' as const
};

export const staffArticles = [
  {
    title: 'How to Add a New Staff Member',
    slug: 'how-to-add-new-staff',
    summary: 'Step-by-step guide to register a new teaching or non-teaching staff member with personal and employment details.',
    content: `# How to Add a New Staff Member

## Prerequisites
- **Staff Categories** should be set up (e.g., Teaching, Non-Teaching) — see [Manage Staff Categories](/help/how-to-manage-staff-categories)
- **Designations** should be created (e.g., Senior Teacher, Clerk) — see [Manage Designations](/help/how-to-manage-designations)
- **Departments** should be created (e.g., Science, Administration) — see [Manage Departments](/help/how-to-manage-departments)

## Steps

1. Go to **Staff** from the sidebar under **People**
2. Click the **"Add Staff"** button (top-right)
3. Fill in the form:

**Employee Details:**
- **Employee ID** — A unique ID for the staff member (e.g., "EMP-001")
- **Full Name** — The staff member's complete name (e.g., "Priya Nair")

**Contact:**
- **Phone** — Mobile number
- **Email** — Email address
- **Address** — Full residential address

**Organization:**
- **Category** — Select the staff category (e.g., "Teaching", "Non-Teaching")
- **Designation** — Select the designation (e.g., "Senior Teacher", "Clerk")
- **Department** — Select the department (e.g., "Science", "Mathematics", "Administration")

**Employment:**
- **Date of Joining** — When the staff member started
- **Monthly Salary** — Base salary amount (e.g., ₹45,000)

4. Click **"Save"**

## Example

Adding a new teacher:
- **Employee ID:** EMP-015
- **Name:** Priya Nair
- **Phone:** 9876543210
- **Category:** Teaching
- **Designation:** Senior Teacher
- **Department:** Science
- **Date of Joining:** 01/06/2020
- **Monthly Salary:** ₹45,000

> **Tip:** The employee ID must be unique across the branch. Use a consistent format like "EMP-001", "EMP-002", etc.`,
    module: 'staff',
    featureKey: 'staff',
    roles: ['platform_admin', 'org_admin', 'branch_admin'],
    tags: ['add staff', 'new staff', 'register', 'employee', 'teacher', 'hire'],
    relatedRoutes: ['/staff'],
    steps: [
      { stepNumber: 1, title: 'Go to Staff', description: 'Click "Staff" in the sidebar under People.' },
      { stepNumber: 2, title: 'Click Add Staff', description: 'Click the "Add Staff" button in the top-right.' },
      { stepNumber: 3, title: 'Fill the Form', description: 'Enter employee ID, name, contact, category, designation, department, joining date, and salary.' },
      { stepNumber: 4, title: 'Save', description: 'Click Save to register the staff member.' }
    ],
    order: 1
  },
  {
    title: 'How to Process a Salary Increment',
    slug: 'how-to-process-salary-increment',
    summary: 'Learn how to increase a staff member\'s salary and record the change with an effective date and reason.',
    content: `# How to Process a Salary Increment

When a staff member receives a salary increase, record it through the Salary Increment feature.

## Steps

1. Go to **Staff** from the sidebar
2. **Find the staff member** using search or filters
3. Click the **dropdown arrow (⋮)** on their row
4. Select **"Salary Increment"**
5. Fill in the dialog:
   - **New Salary** — Enter the new monthly salary amount
   - **Effective Date** — When the increment takes effect
   - **Reason** — Why the increment is given (e.g., "Annual increment", "Promotion")
6. Click **"Save"**

## Example

Priya Nair's annual increment:
- **Current Salary:** ₹45,000
- **New Salary:** ₹50,000
- **Effective Date:** April 1, 2025
- **Reason:** Annual increment

## Viewing Salary History

After saving, you can view the complete salary history by clicking the dropdown and selecting **"Salary History"**. This shows all past salary changes with dates and reasons.

> **Tip:** Always enter a clear reason for the increment — this creates an audit trail for future reference.`,
    module: 'staff',
    featureKey: 'staff',
    roles: ['platform_admin', 'org_admin', 'branch_admin'],
    tags: ['salary', 'increment', 'raise', 'pay increase', 'compensation'],
    relatedRoutes: ['/staff'],
    steps: [
      { stepNumber: 1, title: 'Find the Staff Member', description: 'Search for the staff member in the Staff page.' },
      { stepNumber: 2, title: 'Open Actions Menu', description: 'Click the dropdown arrow on their row.' },
      { stepNumber: 3, title: 'Select Salary Increment', description: 'Choose "Salary Increment" from the dropdown.' },
      { stepNumber: 4, title: 'Enter New Salary', description: 'Enter the new salary, effective date, and reason.' },
      { stepNumber: 5, title: 'Save', description: 'Click Save to record the increment.' }
    ],
    order: 2
  },
  {
    title: 'How to Process Staff Separation',
    slug: 'how-to-process-staff-separation',
    summary: 'Learn how to handle a staff member\'s resignation or termination.',
    content: `# How to Process Staff Separation

When a staff member leaves the organization (resignation or termination), record it formally.

## Steps

1. Go to **Staff** from the sidebar
2. **Find the staff member**
3. Click the **dropdown arrow (⋮)** on their row
4. Select **"Separation"**
5. Fill in the dialog:
   - **Separation Type** — Select "Resigned" or "Terminated"
   - **Separation Date** — The date of the formal separation
   - **Last Working Date** — The last day the staff member works
   - **Reason** — The reason for leaving
6. Click **"Save"**

## What Happens

- The staff member's status changes to **"Inactive"**
- Their data is preserved in the system for records
- They can still be found by filtering with **Status: Inactive**

> **Important:** Processing separation does not delete the staff member's data. All records, salary history, and logs are preserved.`,
    module: 'staff',
    featureKey: 'staff',
    roles: ['platform_admin', 'org_admin', 'branch_admin'],
    tags: ['separation', 'resign', 'terminate', 'leaving', 'exit'],
    relatedRoutes: ['/staff'],
    steps: [
      { stepNumber: 1, title: 'Find the Staff Member', description: 'Search for the staff member in the Staff page.' },
      { stepNumber: 2, title: 'Select Separation', description: 'Click dropdown → "Separation".' },
      { stepNumber: 3, title: 'Fill Details', description: 'Select type (Resigned/Terminated), dates, and reason.' },
      { stepNumber: 4, title: 'Save', description: 'Click Save to process the separation.' }
    ],
    order: 3
  },
  {
    title: 'How to Generate an Experience Certificate',
    slug: 'how-to-generate-experience-certificate',
    summary: 'Learn how to generate a printable experience certificate for a staff member.',
    content: `# How to Generate an Experience Certificate

You can generate a formal experience certificate for any staff member.

## Steps

1. Go to **Staff** from the sidebar
2. **Find the staff member**
3. Click the **dropdown arrow (⋮)** on their row
4. Select **"Experience Certificate"**
5. A **preview** of the certificate appears with:
   - Staff member's name and designation
   - Department
   - Date of joining and last working date
   - Organization details
6. Click **"Print"** to print the certificate

> **Tip:** The certificate uses your organization's name and details from the system settings. Make sure your organization information is up to date.`,
    module: 'staff',
    featureKey: 'staff',
    roles: ['platform_admin', 'org_admin', 'branch_admin'],
    tags: ['experience certificate', 'print', 'document', 'letter'],
    relatedRoutes: ['/staff'],
    steps: [
      { stepNumber: 1, title: 'Find the Staff Member', description: 'Search for the staff member.' },
      { stepNumber: 2, title: 'Select Experience Certificate', description: 'Click dropdown → "Experience Certificate".' },
      { stepNumber: 3, title: 'Print', description: 'Review the preview and click Print.' }
    ],
    order: 4
  },
  {
    title: 'How to View Salary History',
    slug: 'how-to-view-salary-history',
    summary: 'Learn how to view a staff member\'s complete salary change history.',
    content: `# How to View Salary History

Track all salary changes made for a staff member over time.

## Steps

1. Go to **Staff** from the sidebar
2. **Find the staff member**
3. Click the **dropdown arrow (⋮)** on their row
4. Select **"Salary History"**
5. A popup shows all salary changes including:
   - **Date** of change
   - **Previous salary** amount
   - **New salary** amount
   - **Reason** for the change
   - **Changed by** (who processed it)

This provides a complete audit trail of all compensation changes.`,
    module: 'staff',
    featureKey: 'staff',
    roles: ['platform_admin', 'org_admin', 'branch_admin'],
    tags: ['salary history', 'pay history', 'compensation', 'audit'],
    relatedRoutes: ['/staff'],
    steps: [
      { stepNumber: 1, title: 'Find the Staff Member', description: 'Search for the staff member.' },
      { stepNumber: 2, title: 'Select Salary History', description: 'Click dropdown → "Salary History".' },
      { stepNumber: 3, title: 'Review', description: 'View the chronological list of salary changes.' }
    ],
    order: 5
  },
  {
    title: 'How to Manage Staff Categories',
    slug: 'how-to-manage-staff-categories',
    summary: 'Learn how to create and manage staff categories like Teaching, Non-Teaching, and Administrative.',
    content: `# How to Manage Staff Categories

Staff categories help you classify staff members into groups (e.g., Teaching, Non-Teaching, Administrative).

## Steps to Create a Category

1. Go to **Administration → Staff Categories** in the sidebar
2. Click **"Add Category"**
3. Enter the **Category Name** (e.g., "Teaching Staff")
4. Set **Status** to Active
5. Click **"Save"**

## Common Categories

- **Teaching** — Teachers, lecturers, tutors
- **Non-Teaching** — Office staff, peons, security
- **Administrative** — Principal, vice-principal, office managers

> **Tip:** Create categories before adding staff members, so you can assign the correct category during staff registration.`,
    module: 'staff_categories',
    featureKey: 'staff',
    roles: ['platform_admin', 'org_admin', 'branch_admin'],
    tags: ['staff categories', 'teaching', 'non-teaching', 'classify'],
    relatedRoutes: ['/staff-categories'],
    steps: [
      { stepNumber: 1, title: 'Go to Staff Categories', description: 'Navigate to Administration → Staff Categories.' },
      { stepNumber: 2, title: 'Click Add Category', description: 'Click the "Add Category" button.' },
      { stepNumber: 3, title: 'Enter Name', description: 'Type the category name (e.g., "Teaching Staff").' },
      { stepNumber: 4, title: 'Save', description: 'Click Save to create the category.' }
    ],
    order: 6
  },
  {
    title: 'How to Manage Departments',
    slug: 'how-to-manage-departments',
    summary: 'Learn how to create school departments like Science, Mathematics, and Administration.',
    content: `# How to Manage Departments

Departments organize your staff by their subject area or function.

## Steps to Create a Department

1. Go to **Administration → Departments** in the sidebar
2. Click **"Add Department"**
3. Enter the **Department Name** (e.g., "Science Department")
4. Enter an optional **Description**
5. Set **Status** to Active
6. Click **"Save"**

## Common School Departments

- **Science** — Physics, Chemistry, Biology teachers
- **Mathematics** — Math teachers
- **Languages** — English, Hindi, regional language teachers
- **Social Sciences** — History, Geography, Civics teachers
- **Physical Education** — Sports and PE teachers
- **Administration** — Office and management staff
- **IT** — Computer teachers and tech support`,
    module: 'departments',
    featureKey: 'staff',
    roles: ['platform_admin', 'org_admin', 'branch_admin'],
    tags: ['departments', 'create department', 'organize', 'science', 'mathematics'],
    relatedRoutes: ['/departments'],
    steps: [
      { stepNumber: 1, title: 'Go to Departments', description: 'Navigate to Administration → Departments.' },
      { stepNumber: 2, title: 'Click Add Department', description: 'Click the "Add Department" button.' },
      { stepNumber: 3, title: 'Enter Name', description: 'Type the department name (e.g., "Science Department").' },
      { stepNumber: 4, title: 'Save', description: 'Click Save to create the department.' }
    ],
    order: 7
  },
  {
    title: 'How to Manage Designations',
    slug: 'how-to-manage-designations',
    summary: 'Learn how to create staff designations like Principal, Senior Teacher, and Clerk.',
    content: `# How to Manage Designations

Designations define the job title or position of a staff member.

## Steps to Create a Designation

1. Go to **Administration → Designations** in the sidebar
2. Click **"Add Designation"**
3. Enter the **Designation Name** (e.g., "Senior Teacher")
4. Enter an optional **Description**
5. Set **Status** to Active
6. Click **"Save"**

## Common Designations

- **Principal** — Head of the school
- **Vice Principal** — Deputy head
- **Senior Teacher** — Experienced teachers
- **Junior Teacher** — New or less experienced teachers
- **Lab Assistant** — Laboratory support staff
- **Office Manager** — Administrative head
- **Clerk** — Office and record keeping staff
- **Librarian** — Library management
- **Peon** — Support staff

> **Tip:** Set up designations before adding staff members so they can be properly assigned during registration.`,
    module: 'designations',
    featureKey: 'staff',
    roles: ['platform_admin', 'org_admin', 'branch_admin'],
    tags: ['designations', 'job title', 'position', 'principal', 'teacher'],
    relatedRoutes: ['/designations'],
    steps: [
      { stepNumber: 1, title: 'Go to Designations', description: 'Navigate to Administration → Designations.' },
      { stepNumber: 2, title: 'Click Add Designation', description: 'Click the "Add Designation" button.' },
      { stepNumber: 3, title: 'Enter Name', description: 'Type the designation name (e.g., "Senior Teacher").' },
      { stepNumber: 4, title: 'Save', description: 'Click Save to create the designation.' }
    ],
    order: 8
  }
];
