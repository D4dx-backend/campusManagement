export const academicsCategory = {
  name: 'Academic Setup',
  slug: 'academic-setup',
  description: 'Setting up classes, divisions, subjects, academic years, and textbooks',
  icon: 'BookOpen',
  featureKey: 'academics',
  order: 4,
  status: 'active' as const
};

export const academicsArticles = [
  {
    title: 'How to Create and Manage Academic Years',
    slug: 'how-to-manage-academic-years',
    summary: 'Learn how to create academic years and set the current active year that affects all modules.',
    content: `# How to Create and Manage Academic Years

Academic years are the foundation of your school's data. All modules (fees, attendance, exams, etc.) are organized by academic year.

## Steps to Create an Academic Year

1. Go to **Academics Setup → Academic Years** in the sidebar
2. Click **"Add Academic Year"**
3. Fill in:
   - **Name** — e.g., "2025-26"
   - **Start Date** — e.g., June 1, 2025
   - **End Date** — e.g., March 31, 2026
   - **Set as Current** — Toggle ON if this is the active year
   - **Status** — Active / Inactive
4. Click **"Save"**

## Setting the Current Year

- Only **one academic year** can be marked as "Current" at any time
- The current year is used as the default throughout the system (fees, attendance, exams, etc.)
- To change the current year:
  1. Find the academic year in the list
  2. Click the **"Set as Current"** button
  3. The previous current year is automatically unset

## Example Setup

| Name | Start Date | End Date | Current |
|------|-----------|----------|---------|
| 2023-24 | Jun 1, 2023 | Mar 31, 2024 | No |
| 2024-25 | Jun 1, 2024 | Mar 31, 2025 | No |
| 2025-26 | Jun 1, 2025 | Mar 31, 2026 | ✅ Yes |

> **Important:** Always create the new academic year before the school year starts. Many features (fee structures, student promotion, class creation) depend on having the correct academic year available.`,
    module: 'academic_years',
    featureKey: 'academics',
    roles: ['platform_admin', 'org_admin', 'branch_admin'],
    tags: ['academic year', 'school year', 'session', 'current year', 'create year'],
    relatedRoutes: ['/academic-years'],
    steps: [
      { stepNumber: 1, title: 'Go to Academic Years', description: 'Navigate to Academics Setup → Academic Years.' },
      { stepNumber: 2, title: 'Click Add Academic Year', description: 'Click the "Add Academic Year" button.' },
      { stepNumber: 3, title: 'Fill Name and Dates', description: 'Enter the name (e.g., "2025-26") and start/end dates.' },
      { stepNumber: 4, title: 'Set as Current', description: 'Toggle "Set as Current" if this is the active year.' },
      { stepNumber: 5, title: 'Save', description: 'Click Save to create the academic year.' }
    ],
    order: 1
  },
  {
    title: 'How to Create Classes',
    slug: 'how-to-create-classes',
    summary: 'Learn how to set up class levels like LKG, Class 1, Class 2, up to Class 12.',
    content: `# How to Create Classes

Classes represent the grade levels in your school (e.g., LKG, UKG, Class 1 through Class 12).

## Prerequisites
- An **Academic Year** must exist — see [Managing Academic Years](/help/how-to-manage-academic-years)

## Steps

1. Go to **Academics Setup → Classes** in the sidebar
2. Click **"Add Class"**
3. Fill in:
   - **Class Name** — e.g., "Class 5" or "LKG"
   - **Academic Year** — Select from dropdown (defaults to current year)
   - **Status** — Active / Inactive
4. Click **"Save"**

## Recommended Setup

Create all your class levels in order:

| Class Name | Status |
|-----------|--------|
| LKG | Active |
| UKG | Active |
| Class 1 | Active |
| Class 2 | Active |
| Class 3 | Active |
| ... | ... |
| Class 12 | Active |

## Editing a Class

1. Find the class in the list
2. Click the **Edit (pencil) icon**
3. Modify the name or status
4. Click **"Save"**

## Deleting a Class

1. Click the **Delete (trash) icon** on the class row
2. Confirm the deletion

> **Important:** You cannot delete a class that has students enrolled or divisions created under it. Remove those dependencies first.

> **Tip:** After creating classes, the next step is to create **Divisions** (sections) under each class.`,
    module: 'classes',
    featureKey: 'academics',
    roles: ['platform_admin', 'org_admin', 'branch_admin'],
    tags: ['class', 'grade', 'level', 'create class', 'LKG', 'UKG'],
    relatedRoutes: ['/classes'],
    steps: [
      { stepNumber: 1, title: 'Go to Classes', description: 'Navigate to Academics Setup → Classes.' },
      { stepNumber: 2, title: 'Click Add Class', description: 'Click the "Add Class" button.' },
      { stepNumber: 3, title: 'Enter Class Name', description: 'Type the class name (e.g., "Class 5") and select the academic year.' },
      { stepNumber: 4, title: 'Save', description: 'Click Save. Repeat for all class levels.' }
    ],
    order: 2
  },
  {
    title: 'How to Create Divisions (Sections)',
    slug: 'how-to-create-divisions',
    summary: 'Learn how to create sections like A, B, C under each class, set capacity, and assign class teachers.',
    content: `# How to Create Divisions (Sections)

Divisions (also called sections) divide students within a class into manageable groups — typically named A, B, C, etc.

## Prerequisites
- **Classes** must be created first — see [How to Create Classes](/help/how-to-create-classes)

## Steps

1. Go to **Academics Setup → Divisions** in the sidebar
2. Click **"Add Division"**
3. Fill in:
   - **Class** — Select the class (e.g., "Class 5")
   - **Division Name** — Enter the section name (e.g., "A")
   - **Capacity** — Maximum number of students (e.g., 40)
   - **Class Teacher** — Select from staff dropdown (optional; "No Teacher" is an option)
   - **Status** — Active / Inactive
4. Click **"Save"**

## Example Setup

For Class 5 with 3 divisions:

| Class | Division | Capacity | Class Teacher |
|-------|----------|----------|--------------|
| Class 5 | A | 40 | Mrs. Priya Nair |
| Class 5 | B | 40 | Mr. Rajan |
| Class 5 | C | 35 | Mrs. Deepa |

## Filtering Divisions

Use the filters to view divisions for a specific class:
- **Class filter** — Select a class to see only its divisions
- **Class Teacher filter** — Find divisions assigned to a specific teacher
- **Status filter** — Active or Inactive

> **Tip:** Assigning a class teacher is optional but recommended — it helps identify who is responsible for each division. The class teacher can be changed at any time by editing the division.`,
    module: 'divisions',
    featureKey: 'academics',
    roles: ['platform_admin', 'org_admin', 'branch_admin'],
    tags: ['division', 'section', 'create division', 'capacity', 'class teacher'],
    relatedRoutes: ['/divisions'],
    steps: [
      { stepNumber: 1, title: 'Go to Divisions', description: 'Navigate to Academics Setup → Divisions.' },
      { stepNumber: 2, title: 'Click Add Division', description: 'Click the "Add Division" button.' },
      { stepNumber: 3, title: 'Select Class', description: 'Choose the class this division belongs to.' },
      { stepNumber: 4, title: 'Enter Division Details', description: 'Enter name (e.g., "A"), capacity, and optionally assign a class teacher.' },
      { stepNumber: 5, title: 'Save', description: 'Click Save. Repeat for each division (A, B, C, etc.).' }
    ],
    order: 3
  },
  {
    title: 'How to Create Subjects',
    slug: 'how-to-create-subjects',
    summary: 'Learn how to create subjects with codes, assign them to classes, and set maximum and passing marks.',
    content: `# How to Create Subjects

Subjects define what is taught at your school. Each subject has a code, is linked to specific classes, and has mark settings used in exams.

## Steps

1. Go to **Academics Setup → Subjects** in the sidebar
2. Click **"Add Subject"**
3. Fill in:
   - **Subject Name** — e.g., "Mathematics"
   - **Subject Code** — A unique code, e.g., "MATH01" (auto-converts to uppercase)
   - **Classes** — Select which classes use this subject (checkboxes). Leave empty if it applies to ALL classes
   - **Max Mark** — Maximum mark for exams (default: 100)
   - **Pass Mark** — Minimum mark to pass (default: 33)
   - **Optional** — Check if this is an optional/elective subject
   - **Status** — Active / Inactive
4. Click **"Save"**

## Example Subjects

| Name | Code | Classes | Max Mark | Pass Mark | Optional |
|------|------|---------|----------|-----------|----------|
| Mathematics | MATH01 | All | 100 | 33 | No |
| English | ENG01 | All | 100 | 33 | No |
| Hindi | HIN01 | Class 1-8 | 100 | 33 | No |
| Computer Science | CS01 | Class 6-12 | 100 | 33 | Yes |
| Physical Education | PE01 | All | 50 | 20 | No |

## Important Notes

- **Subject Code must be unique** — No two subjects can have the same code within a branch
- **"All Classes" trick** — Leave the class selection empty to make the subject available for all classes
- **Max Mark and Pass Mark** — These are used during mark entry and result calculation

## Filtering Subjects

- **Search** — Type subject name or code
- **Class filter** — See subjects for a specific class
- **Status filter** — Active or Inactive

> **Tip:** Create subjects before setting up exams and marks. The exam system uses these subjects and their mark settings during mark entry.`,
    module: 'subjects',
    featureKey: 'academics',
    roles: ['platform_admin', 'org_admin', 'branch_admin'],
    tags: ['subject', 'create subject', 'subject code', 'marks', 'class subject'],
    relatedRoutes: ['/subjects'],
    steps: [
      { stepNumber: 1, title: 'Go to Subjects', description: 'Navigate to Academics Setup → Subjects.' },
      { stepNumber: 2, title: 'Click Add Subject', description: 'Click the "Add Subject" button.' },
      { stepNumber: 3, title: 'Enter Name and Code', description: 'Enter subject name (e.g., "Mathematics") and code (e.g., "MATH01").' },
      { stepNumber: 4, title: 'Select Classes', description: 'Check the classes this subject applies to, or leave empty for all classes.' },
      { stepNumber: 5, title: 'Set Marks', description: 'Set Max Mark (e.g., 100) and Pass Mark (e.g., 33).' },
      { stepNumber: 6, title: 'Save', description: 'Click Save to create the subject.' }
    ],
    order: 4
  },
  {
    title: 'How to Manage Textbooks',
    slug: 'how-to-manage-textbooks',
    summary: 'Learn how to add textbooks to your inventory, track quantities, and manage textbook records.',
    content: `# How to Manage Textbooks

Track your school's textbook inventory — add books, set prices, and monitor stock levels.

## Steps to Add a Textbook

1. Go to **Academics Setup → Textbooks** in the sidebar
2. Click **"Add Book"**
3. Fill in:
   - **Book Code** — Unique identifier (e.g., "TB-MATH-5")
   - **Title** — Book title (e.g., "NCERT Mathematics Class 5")
   - **Class** — Which class uses this book
   - **Subject** — Related subject (optional)
   - **Publisher** — Publisher name (e.g., "NCERT")
   - **Price** — Per-unit price (e.g., ₹120)
   - **Quantity** — Total units in stock (e.g., 200)
   - **Academic Year** — The applicable year
4. Click **"Save"**

## Inventory Stats

At the top of the page, you'll see four summary cards:
- **Total Books** — Total book entries
- **Total Titles** — Unique titles
- **Available Books** — Books currently in stock
- **Issued Books** — Books currently issued to students

## Filtering

- **Class filter** — See books for a specific class
- **Search** — Search by title or code

> **Tip:** Keep the quantity field updated when new stock arrives. The "Available" count helps you know when to reorder.`,
    module: 'textbooks',
    featureKey: 'academics',
    roles: ['platform_admin', 'org_admin', 'branch_admin'],
    tags: ['textbook', 'book', 'inventory', 'NCERT', 'publisher', 'stock'],
    relatedRoutes: ['/textbooks'],
    steps: [
      { stepNumber: 1, title: 'Go to Textbooks', description: 'Navigate to Academics Setup → Textbooks.' },
      { stepNumber: 2, title: 'Click Add Book', description: 'Click the "Add Book" button.' },
      { stepNumber: 3, title: 'Fill Book Details', description: 'Enter code, title, class, subject, publisher, price, and quantity.' },
      { stepNumber: 4, title: 'Save', description: 'Click Save to add the book to inventory.' }
    ],
    order: 5
  },
  {
    title: 'How to Create and Manage Textbook Indents',
    slug: 'how-to-manage-textbook-indents',
    summary: 'Learn how to issue textbooks to students, track returns, and generate receipts.',
    content: `# How to Create and Manage Textbook Indents

A textbook indent is a record of books issued to a student. It tracks which books were given, payment status, and returns.

## Creating an Indent (Issuing Books)

1. Go to **Academics Setup → Textbook Indents** in the sidebar
2. Click **"Create Indent"**
3. Fill in:
   - **Student** — Search and select the student
   - **Class** — Auto-fills from student record
   - **Books** — Select books and quantities to issue
   - **Payment Details:**
     - Total amount (calculated automatically)
     - Payment method (Cash/Bank)
     - Paid amount
   - **Issue Date** — When books are given out
   - **Expected Return Date** — When books should be returned
4. Click **"Save"**

## Indent Statuses

| Status | Meaning |
|--------|---------|
| **Pending** | Indent created but books not yet issued |
| **Issued** | Books have been handed to the student |
| **Partially Returned** | Some books returned, some still with student |
| **Returned** | All books returned |
| **Cancelled** | Indent cancelled |

## Returning Books

1. Find the indent in the list
2. Click **"Return Books"**
3. Select which books are being returned
4. Click **"Process Return"**

## Generating a Receipt

1. Find the indent
2. Click **"Generate Receipt"**
3. A printable receipt is generated with all indent details

## Example

Issuing books to Rahul (Class 5A):
- Math textbook: ₹120 × 1 = ₹120
- Science textbook: ₹130 × 1 = ₹130
- English textbook: ₹110 × 1 = ₹110
- **Total:** ₹360, **Payment:** Cash
- **Issue Date:** June 15, 2025
- **Return Date:** March 31, 2026

> **Tip:** Use the filters to quickly find indents by status (e.g., all "Issued" indents) or by student class.`,
    module: 'textbooks',
    featureKey: 'academics',
    roles: ['platform_admin', 'org_admin', 'branch_admin'],
    tags: ['textbook indent', 'issue books', 'return books', 'receipt', 'student books'],
    relatedRoutes: ['/textbook-indents'],
    steps: [
      { stepNumber: 1, title: 'Go to Textbook Indents', description: 'Navigate to Academics Setup → Textbook Indents.' },
      { stepNumber: 2, title: 'Click Create Indent', description: 'Click the "Create Indent" button.' },
      { stepNumber: 3, title: 'Select Student and Books', description: 'Search for the student, then select which books to issue with quantities.' },
      { stepNumber: 4, title: 'Enter Payment', description: 'Confirm the total, enter paid amount, and select payment method.' },
      { stepNumber: 5, title: 'Save', description: 'Click Save to create the indent.' },
      { stepNumber: 6, title: 'Issue Books', description: 'Click "Issue" to mark the books as handed over.' }
    ],
    order: 6
  }
];
