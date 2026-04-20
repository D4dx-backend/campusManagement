export const teacherAllocationsCategory = {
  name: 'Teacher Allocations',
  slug: 'teacher-allocations',
  description: 'Assign teachers to classes and subjects for each academic year',
  icon: 'UserCheck',
  featureKey: null,
  order: 17,
  status: 'active' as const
};

export const teacherAllocationsArticles = [
  {
    title: 'How to Assign Teachers to Classes',
    slug: 'how-to-assign-teachers-to-classes',
    summary: 'Create teacher allocations by assigning teachers to specific classes, subjects, and academic years.',
    content: `# How to Assign Teachers to Classes

Teacher Allocations let you map which teacher teaches which subject in which class. You can also mark a teacher as the "Class Teacher" for a specific class.

## Who Can Use This?
- **Org Admin** and **Branch Admin** only

## Steps

### Step 1: Go to Teacher Allocations
Click **Academics → Teacher Allocations** in the sidebar.

### Step 2: Click "Assign Teacher"
Click the **Assign Teacher** button in the top-right corner.

### Step 3: Fill in the Details
- **Teacher** — Select a teacher from the dropdown (shows all staff with teacher role)
- **Class** — Select the class (e.g., "Class 5")
- **Subject** — Optionally select a subject. Leave as "No specific subject" if the teacher is only being assigned as a Class Teacher
- **Academic Year** — Select the relevant academic year
- **Class Teacher toggle** — Turn this ON if this teacher is the Class Teacher for this class

### Step 4: Click "Assign"
The allocation is saved and appears in the table.

## Viewing Allocations
The main page shows a table with all current allocations:

| Column | Description |
|--------|-------------|
| Teacher | Teacher's name |
| Class | Class name (with division badge if applicable) |
| Subject | The subject assigned, or "—" if none |
| Academic Year | Which year this applies to |
| Class Teacher | Green badge if this teacher is the class teacher |
| Actions | Delete button |

### Filter the List
- **Class filter** — Show allocations for a specific class only
- **Academic Year filter** — Show allocations for a specific year

## Deleting an Allocation
Click the **trash icon** next to any allocation to remove it.

## Tips
- A teacher can be allocated to multiple classes and subjects
- Only one teacher should be marked as "Class Teacher" per class
- Teacher allocations are used by the Timetable module to populate teacher dropdowns
- Allocations help track teacher responsibilities across the school

## Example
| Teacher | Class | Subject | Class Teacher |
|---------|-------|---------|:------------:|
| Mrs. Priya | Class 5 A | Mathematics | ✓ |
| Mrs. Priya | Class 5 B | Mathematics | |
| Mr. Rajan | Class 5 A | Science | |
| Mr. Suresh | Class 6 A | English | ✓ |
`,
    module: 'teacher-allocations',
    featureKey: null,
    roles: ['org_admin', 'branch_admin'],
    tags: ['teacher allocations', 'class teacher', 'subject teacher', 'assign teacher', 'academics'],
    relatedRoutes: ['/teacher-allocations'],
    steps: [
      { stepNumber: 1, title: 'Go to Teacher Allocations', description: 'Academics → Teacher Allocations' },
      { stepNumber: 2, title: 'Click "Assign Teacher"', description: 'Opens the assignment dialog' },
      { stepNumber: 3, title: 'Select teacher, class, subject, year', description: 'Fill in the allocation details' },
      { stepNumber: 4, title: 'Toggle Class Teacher if needed', description: 'Mark as class teacher for this class' },
      { stepNumber: 5, title: 'Click "Assign"', description: 'Saves the teacher allocation' },
    ],
    order: 1,
  },
];
