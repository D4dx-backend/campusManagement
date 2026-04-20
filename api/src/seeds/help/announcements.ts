export const announcementsCategory = {
  name: 'Announcements',
  slug: 'announcements',
  description: 'Create, manage, and view announcements for branches, classes, and individual students',
  icon: 'Bell',
  featureKey: null,
  order: 15,
  status: 'active' as const
};

export const announcementsArticles = [
  {
    title: 'How to Create and Manage Announcements',
    slug: 'how-to-create-manage-announcements',
    summary: 'Send announcements to branches, classes, divisions, or specific students with different types and priorities.',
    content: `# How to Create and Manage Announcements

Announcements let you communicate important information to students, teachers, and staff. You can target announcements to specific groups.

## Who Can Use This?
- **Platform Admin / Org Admin** — Can send organization-wide, branch-level, class, division, or student-specific announcements
- **Branch Admin / Teacher** — Can send branch-level, class, division, or student-specific announcements
- **Students** — Can only view announcements targeted to them (read-only)

## Creating an Announcement

### Step 1: Go to Announcements
Click **Announcements** in the sidebar (appears near the Dashboard).

### Step 2: Click "New Announcement"
Click the **New Announcement** button (only visible to admins and teachers).

### Step 3: Fill in the Details
- **Title** — A clear, concise title for the announcement
- **Message** — The full announcement text
- **Type** — Choose the announcement type:
  - **General** — Everyday notices
  - **Academic** — Academic-related information
  - **Event** — School events, functions, etc.
  - **Emergency** — Urgent communications
- **Priority** — Set the importance level:
  - **Low** — Informational, no urgency
  - **Normal** — Standard announcements
  - **High** — Important, needs attention
  - **Urgent** — Critical, immediate attention required

### Step 4: Choose Target Audience

Under the **Targeting** section:

- **Scope** — Who should see this announcement:
  - **Organization** — All branches of the organization
  - **Branch** — Specific branch(es) only
  - **Class** — A specific class
  - **Division** — A specific class/division
  - **Specific Students** — Hand-picked students

- Depending on scope:
  - **Branch scope** → Select which branches (checkboxes)
  - **Class scope** → Select a class from the dropdown
  - **Division scope** → Select class, then division
  - **Student scope** → Search and select individual students

- **Role Filter** (for org/branch scope) — Choose who sees it:
  - **All** — Everyone
  - **Students** — Only students
  - **Teachers** — Only teachers
  - **Staff** — Only staff members

- **Expires On** (optional) — Set a date after which the announcement disappears

### Step 5: Publish
Click **Publish** to send the announcement immediately.

## Viewing Announcements
- Announcements appear as cards, newest first
- **Unread** announcements have a blue left border and a bell icon
- Click on an unread announcement to **mark it as read**
- Use **"Mark All Read"** button to clear all unread notifications
- **Filter by type** — Use the Type dropdown to show only General, Academic, Event, or Emergency announcements

## Editing an Announcement
- Click the **edit** (pencil) icon on any announcement you created
- Modify the fields and click **Update**
- Only the creator or an admin can edit

## Deleting an Announcement
- Click the **delete** (trash) icon
- Confirm the deletion

## Announcement Types (Color-Coded)
| Type | Color |
|------|-------|
| General | Gray |
| Academic | Blue |
| Event | Purple |
| Emergency | Red |

## Priority Levels
| Priority | Color |
|----------|-------|
| Low | Gray |
| Normal | Blue |
| High | Orange |
| Urgent | Red |
`,
    module: 'announcements',
    featureKey: null,
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'teacher', 'student', 'staff'],
    tags: ['announcements', 'notifications', 'broadcast', 'communication', 'notices'],
    relatedRoutes: ['/announcements'],
    steps: [
      { stepNumber: 1, title: 'Go to Announcements', description: 'Click Announcements in the sidebar' },
      { stepNumber: 2, title: 'Click "New Announcement"', description: 'Opens the creation dialog' },
      { stepNumber: 3, title: 'Fill title, message, type, priority', description: 'Enter the announcement content' },
      { stepNumber: 4, title: 'Choose target audience', description: 'Select scope, branches/classes/students, and roles' },
      { stepNumber: 5, title: 'Click Publish', description: 'Sends the announcement to the targeted audience' },
    ],
    order: 1,
  },
];
