export const studentsCategory = {
  name: 'Student Management',
  slug: 'student-management',
  description: 'Everything about adding, editing, and managing students',
  icon: 'GraduationCap',
  featureKey: 'students',
  order: 2,
  status: 'active' as const
};

export const studentsArticles = [
  {
    title: 'How to Add a New Student',
    slug: 'how-to-add-a-new-student',
    summary: 'Step-by-step guide to register a new student with personal details, guardian information, and transport preferences.',
    content: `# How to Add a New Student

This guide walks you through registering a new student in the system.

## Prerequisites

Before adding a student, make sure the following are already set up:
- **Classes** (e.g., Class 1, Class 2, etc.) — see [How to Create Classes](/help/how-to-create-classes)
- **Divisions** (e.g., Division A, B, C) — see [How to Create Divisions](/help/how-to-create-divisions)
- **Transport Routes** (if the student uses school transport) — see [How to Create Transport Routes](/help/how-to-create-transport-routes)

## Step-by-Step Instructions

### Step 1: Go to the Students Page
- Click **"Students"** in the sidebar under the **People** section
- You'll see the list of all existing students

### Step 2: Click "Add Student"
- Click the **"Add Student"** button in the top-right corner
- A form dialog opens

### Step 3: Select Class and Division
- Select the **Class** from the dropdown (e.g., "Class 5")
- The **Division** dropdown loads automatically with available divisions
- Select the **Division** (e.g., "A")
- The **Admission Number** auto-fills based on the year, class, and division (e.g., "2025-5A-001")

### Step 4: Enter Personal Details
- **Full Name** — Enter the student's complete name (e.g., "Rahul Kumar")
- **Date of Birth** — Select using the date picker
- **Gender** — Select Male or Female

### Step 5: Enter Guardian Information
**Father's Details:**
- Name (e.g., "Suresh Kumar")
- Phone Number
- Email Address
- Job / Company

**Mother's Details:**
- Name (e.g., "Lakshmi Kumar")
- Phone Number
- Email Address
- Job / Company

### Step 6: Select Transport Type
Choose one of:
- **School Bus** — Select the transport route from the dropdown
- **Own Transport** — Student comes on their own
- **None** — Not applicable

### Step 7: Enter Address
- Type the full residential address

### Step 8: Staff Child Option
- Check the **"Staff Child"** box if this student is a child of a staff member
- This automatically applies fee discounts when collecting fees

### Step 9: Save
- Click **"Save"** to register the student
- The student appears in the list with status **"Active"**

## Example

Registering a new student:
- **Class:** Class 5 → **Division:** A → **Admission No:** 2025-5A-001 (auto-generated)
- **Name:** Rahul Kumar → **DOB:** 15/06/2015 → **Gender:** Male
- **Father:** Suresh Kumar, 9876543210
- **Transport:** School Bus → Route: "North Zone Route 1"
- Click **Save** ✓

> **Tip:** The Admission Number is automatically generated and cannot be edited manually. It follows the format: Year-ClassDivision-Sequence.`,
    module: 'students',
    featureKey: 'students',
    roles: ['platform_admin', 'org_admin', 'branch_admin'],
    tags: ['add student', 'new student', 'register', 'admission', 'enroll', 'create student'],
    relatedRoutes: ['/students'],
    steps: [
      { stepNumber: 1, title: 'Go to Students', description: 'Click "Students" in the sidebar under People.' },
      { stepNumber: 2, title: 'Click Add Student', description: 'Click the "Add Student" button in the top-right corner.' },
      { stepNumber: 3, title: 'Select Class and Division', description: 'Choose the class and division. Admission number auto-generates.' },
      { stepNumber: 4, title: 'Enter Personal Details', description: 'Fill in name, date of birth, and gender.' },
      { stepNumber: 5, title: 'Enter Guardian Info', description: 'Fill in father and mother details including phone and email.' },
      { stepNumber: 6, title: 'Select Transport', description: 'Choose transport type and route if applicable.' },
      { stepNumber: 7, title: 'Save', description: 'Click Save to register the student.' }
    ],
    order: 1
  },
  {
    title: 'How to Search and Filter Students',
    slug: 'how-to-search-and-filter-students',
    summary: 'Learn how to find specific students using the search bar and advanced filters.',
    content: `# How to Search and Filter Students

When you have hundreds of students, finding a specific one is easy with search and filters.

## Quick Search

1. Go to **Students** from the sidebar
2. Use the **search bar** at the top of the table
3. Type the **student's name** or **admission number**
4. Results filter in real-time as you type

Example: Type "Rahul" to find all students named Rahul.

## Advanced Filters

Click the filter options to narrow down:

| Filter | Options | Example |
|--------|---------|---------|
| **Class** | All classes | Select "Class 5" to see only Class 5 students |
| **Division** | Available divisions for selected class | Select "A" to see Division A only |
| **Gender** | Male / Female | Filter by gender |
| **Transport** | School Bus / Own / None | Find all bus students |
| **Status** | Active / Inactive / Suspended / TC Issued | Find suspended students |
| **Branch** | Available branches (admin only) | Filter by branch |
| **DOB Range** | Date range | Find students born between specific dates |

## Combining Filters

You can use multiple filters together. For example:
- **Class:** Class 8 + **Gender:** Female + **Transport:** School Bus
- This shows all female students in Class 8 who use school transport

## Clearing Filters

- Click the **reset/clear** button next to the filters to remove all filters and see all students again

> **Tip:** The search works on both student name and admission number, so you can search by either.`,
    module: 'students',
    featureKey: 'students',
    roles: [],
    tags: ['search', 'filter', 'find student', 'admission number', 'lookup'],
    relatedRoutes: ['/students'],
    steps: [
      { stepNumber: 1, title: 'Go to Students', description: 'Navigate to the Students page from the sidebar.' },
      { stepNumber: 2, title: 'Use Search Bar', description: 'Type a student name or admission number in the search bar.' },
      { stepNumber: 3, title: 'Apply Filters', description: 'Use dropdown filters for class, division, gender, transport, or status.' },
      { stepNumber: 4, title: 'View Results', description: 'The table updates in real-time to show matching students.' }
    ],
    order: 2
  },
  {
    title: 'How to Edit Student Details',
    slug: 'how-to-edit-student-details',
    summary: 'Learn how to update a student\'s personal information, class, guardian details, or transport preferences.',
    content: `# How to Edit Student Details

You can update a student's information at any time after registration.

## Steps

1. Go to **Students** from the sidebar
2. **Find the student** using search or filters
3. Click the **Edit (pencil) icon** on the student's row
4. The edit form opens with all current information pre-filled
5. **Make your changes** — you can update:
   - Personal details (name, DOB, gender)
   - Class and Division (for manual transfers)
   - Guardian information
   - Transport type and route
   - Address
   - Staff child status
6. Click **"Save"** to update

## What You Can Change

| Field | Editable? | Notes |
|-------|-----------|-------|
| Full Name | ✅ Yes | |
| Date of Birth | ✅ Yes | |
| Gender | ✅ Yes | |
| Class | ✅ Yes | Use Student Promotion for bulk class changes |
| Division | ✅ Yes | |
| Guardian Details | ✅ Yes | |
| Transport | ✅ Yes | |
| Address | ✅ Yes | |
| Admission Number | ❌ No | Auto-generated, cannot be changed |

> **Tip:** For changing a student's class at the end of an academic year, use the **Student Promotion** feature instead of editing each student individually.`,
    module: 'students',
    featureKey: 'students',
    roles: ['platform_admin', 'org_admin', 'branch_admin'],
    tags: ['edit student', 'update student', 'modify', 'change details'],
    relatedRoutes: ['/students'],
    steps: [
      { stepNumber: 1, title: 'Find the Student', description: 'Search or filter to locate the student.' },
      { stepNumber: 2, title: 'Click Edit', description: 'Click the pencil icon on the student\'s row.' },
      { stepNumber: 3, title: 'Modify Details', description: 'Update the fields you want to change.' },
      { stepNumber: 4, title: 'Save Changes', description: 'Click Save to apply the updates.' }
    ],
    order: 3
  },
  {
    title: 'How to Issue a Transfer Certificate (TC)',
    slug: 'how-to-issue-transfer-certificate',
    summary: 'Learn how to issue a Transfer Certificate when a student is leaving the school.',
    content: `# How to Issue a Transfer Certificate (TC)

When a student is transferring to another school, you need to issue a Transfer Certificate.

## Steps

1. Go to **Students** from the sidebar
2. **Find the student** who is leaving
3. Click the **dropdown arrow (⋮)** on the student's row
4. Select **"Transfer Certificate"**
5. A confirmation dialog appears
6. Click **"Confirm"** to issue the TC

## What Happens After Issuing a TC

- The student's status changes to **"TC Issued"**
- The student is no longer counted in active student totals
- The student's data is preserved in the system (not deleted)
- The student will appear in filters when you select **Status: TC Issued**

## Example

Student "Rahul Kumar" (Class 5A, Admission No: 2025-5A-001) is transferring:
1. Find "Rahul Kumar" in the student list
2. Click the dropdown menu on his row
3. Select "Transfer Certificate"
4. Confirm the action
5. His status changes from "Active" to "TC Issued"

> **Important:** This action changes the student's status permanently. If the student returns, you would need to add them as a new admission.

> **Tip:** You can filter students by status "TC Issued" to see all students who have transferred out.`,
    module: 'students',
    featureKey: 'students',
    roles: ['platform_admin', 'org_admin', 'branch_admin'],
    tags: ['transfer certificate', 'TC', 'leaving', 'withdraw', 'departure'],
    relatedRoutes: ['/students'],
    steps: [
      { stepNumber: 1, title: 'Find the Student', description: 'Search for the student who is transferring.' },
      { stepNumber: 2, title: 'Open Actions Menu', description: 'Click the dropdown arrow on the student\'s row.' },
      { stepNumber: 3, title: 'Select Transfer Certificate', description: 'Choose "Transfer Certificate" from the dropdown.' },
      { stepNumber: 4, title: 'Confirm', description: 'Click Confirm to issue the TC. Status changes to "TC Issued".' }
    ],
    order: 4
  },
  {
    title: 'How to Suspend and Reinstate a Student',
    slug: 'how-to-suspend-and-reinstate-student',
    summary: 'Learn how to suspend a student and how to reinstate them later.',
    content: `# How to Suspend and Reinstate a Student

## Suspending a Student

1. Go to **Students** from the sidebar
2. **Find the student** to suspend
3. Click the **dropdown arrow (⋮)** on the student's row
4. Select **"Suspend"**
5. The student's status changes to **"Suspended"**

## Reinstating a Suspended Student

1. Go to **Students**
2. **Filter by Status:** Select "Suspended" to find suspended students
3. Find the student to reinstate
4. Click the **dropdown arrow (⋮)**
5. Select **"Revoke Suspension"**
6. The student's status returns to **"Active"**

## What Happens When Suspended

- The student is marked as **"Suspended"** in the system
- They are not counted in active student totals
- Their data is fully preserved
- They can be reinstated at any time

> **Note:** Suspension is different from TC — suspension is temporary and reversible, while TC is permanent.`,
    module: 'students',
    featureKey: 'students',
    roles: ['platform_admin', 'org_admin', 'branch_admin'],
    tags: ['suspend', 'reinstate', 'revoke', 'discipline', 'inactive'],
    relatedRoutes: ['/students'],
    steps: [
      { stepNumber: 1, title: 'Find the Student', description: 'Search for the student to suspend.' },
      { stepNumber: 2, title: 'Open Actions Menu', description: 'Click the dropdown arrow on the student\'s row.' },
      { stepNumber: 3, title: 'Select Suspend', description: 'Choose "Suspend" from the dropdown menu.' },
      { stepNumber: 4, title: 'To Reinstate', description: 'Filter by "Suspended" status, find the student, and select "Revoke Suspension".' }
    ],
    order: 5
  },
  {
    title: 'How to Promote Students to the Next Class',
    slug: 'how-to-promote-students',
    summary: 'End-of-year guide to promoting students from one class to the next, including how to handle detained students.',
    content: `# How to Promote Students to the Next Class

At the end of an academic year, use the Student Promotion feature to move students to their next class in bulk.

## Prerequisites

- The **new academic year** must be created first
- The **target class and divisions** must exist in the new academic year

## Steps

### Step 1: Go to Student Promotion
- Navigate to **Exam & Assessment → Student Promotion** in the sidebar

### Step 2: Set Up the Promotion
Fill in the promotion form:
- **From Academic Year** — Select the current year (e.g., "2024-25")
- **To Academic Year** — Select the next year (e.g., "2025-26")
- **From Class** — Select the source class (e.g., "Class 5")
- **From Division** — Select "All" or a specific division (e.g., "A")
- **To Class** — The system auto-suggests the next class (e.g., "Class 6")
- **To Division** — Optionally select a target division

### Step 3: Fetch Students
- Click **"Fetch Students"**
- A list of all students in the selected class/division appears

### Step 4: Set Status for Each Student
For each student, you can set:
- **Promoted** — Moves to the next class ✅
- **Detained** — Stays in the same class 🔁
- **TC Issued** — Student is leaving 📤

By default, all students are marked as "Promoted."

### Step 5: Confirm and Promote
- Review the **summary** showing counts of promoted, detained, and TC issued
- Click **"Promote"** to confirm
- Students are moved to their new class in the new academic year

## Example

Promoting Class 5A to Class 6A for 2025-26:
1. From Year: 2024-25 → To Year: 2025-26
2. From Class: Class 5, Division: A → To Class: Class 6
3. Click "Fetch Students" → 40 students appear
4. Mark 38 as Promoted, 1 as Detained (Anu — needs to repeat), 1 as TC Issued (Rahul — transferring)
5. Summary: Promoted: 38, Detained: 1, TC Issued: 1
6. Click "Promote"

> **Tip:** You can select all students at once and then change individual statuses as needed, rather than setting each one manually.

> **Important:** Make sure the target class exists in the new academic year before starting the promotion.`,
    module: 'promotions',
    featureKey: 'students',
    roles: ['platform_admin', 'org_admin', 'branch_admin'],
    tags: ['promote', 'promotion', 'next class', 'year end', 'detained', 'advance'],
    relatedRoutes: ['/student-promotion'],
    steps: [
      { stepNumber: 1, title: 'Go to Student Promotion', description: 'Navigate to Exam & Assessment → Student Promotion in the sidebar.' },
      { stepNumber: 2, title: 'Set From and To Years', description: 'Select the current academic year and the next academic year.' },
      { stepNumber: 3, title: 'Select Class and Division', description: 'Choose the source class and division to promote from.' },
      { stepNumber: 4, title: 'Fetch Students', description: 'Click "Fetch Students" to load the student list.' },
      { stepNumber: 5, title: 'Set Status', description: 'Mark each student as Promoted, Detained, or TC Issued.' },
      { stepNumber: 6, title: 'Promote', description: 'Review the summary and click "Promote" to confirm.' }
    ],
    order: 6
  },
  {
    title: 'How to Export Student Data',
    slug: 'how-to-export-student-data',
    summary: 'Learn how to download student data as a CSV or Excel file for offline use or reporting.',
    content: `# How to Export Student Data

You can download the student list as a file for offline use, reporting, or sharing.

## Steps

1. Go to **Students** from the sidebar
2. **Apply any filters** you need (e.g., specific class, division, status)
3. Look for the **Export** button near the top of the data table
4. Click **Export** to download the data
5. The file downloads as a **CSV** (comma-separated values) file that you can open in Excel, Google Sheets, or any spreadsheet application

## What's Included in the Export

The exported file includes all visible columns:
- Admission Number
- Student Name
- Class
- Division
- Gender
- Date of Birth
- Status
- Guardian contact information

## Tips

- **Filter before exporting** — Apply the filters you need so the export only contains the data you want
- **Open with Excel** — Double-click the downloaded CSV file to open it in Microsoft Excel
- **Open with Google Sheets** — Upload the CSV to Google Drive and open with Google Sheets

> **Tip:** If you need a specific subset of students (e.g., "all female students in Class 8 using school bus"), apply those filters first, then export. The export only includes the filtered results.`,
    module: 'students',
    featureKey: 'students',
    roles: [],
    tags: ['export', 'download', 'CSV', 'Excel', 'spreadsheet', 'report'],
    relatedRoutes: ['/students'],
    steps: [
      { stepNumber: 1, title: 'Apply Filters', description: 'Optionally filter students by class, division, status, etc.' },
      { stepNumber: 2, title: 'Click Export', description: 'Click the Export button near the top of the data table.' },
      { stepNumber: 3, title: 'Download File', description: 'The CSV file downloads automatically. Open it in Excel or Google Sheets.' }
    ],
    order: 7
  }
];
