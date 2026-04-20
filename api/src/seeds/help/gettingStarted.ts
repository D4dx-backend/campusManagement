export const gettingStartedCategory = {
  name: 'Getting Started',
  slug: 'getting-started',
  description: 'Learn the basics of navigating and using the application',
  icon: 'Rocket',
  featureKey: null,
  order: 1,
  status: 'active' as const
};

export const gettingStartedArticles = [
  {
    title: 'Understanding the Dashboard',
    slug: 'understanding-the-dashboard',
    summary: 'Learn what you see when you first log in and how to use the dashboard to quickly access key information.',
    content: `# Understanding the Dashboard

When you log in to the application, the **Dashboard** is the first page you see. It gives you a quick overview of your school's key information.

## What You'll See

### For School Administrators (Branch Admin, Org Admin)

When you log in as an administrator, your dashboard shows:

1. **Greeting Message** — A personalized greeting based on the time of day (Good morning / Good afternoon / Good evening)
2. **Quick Search Bar** — Search and jump to any module instantly
3. **Summary Cards** — Four cards showing:
   - **Total Students** — Number of students enrolled in your branch
   - **Total Staff** — Number of staff members
   - **Fee Collection** — Total fees collected
   - **Payroll Status** — Current payroll summary
4. **Quick Menu** — Shortcut buttons to frequently used modules (Students, Staff, Fees, Attendance, etc.)

### For Platform Administrators

Platform admins see a different dashboard:

1. **Organizations** — Total organizations on the platform (click to manage)
2. **Total Branches** — All branches across organizations (click to manage)
3. **Total Users** — All users in the system (click to manage)
4. **Active Students** — Total active students across all organizations
5. **Recent Activity** — A feed showing the latest actions performed in the system

## Using Quick Search

The dashboard has a powerful search feature:

1. **Click the search bar** at the top of the dashboard
2. **Type a module name** — for example, type "fees" or "attendance"
3. **Click the result** to navigate directly to that module

This is the fastest way to move around the application.

> **Tip:** You can also use the keyboard shortcut **Cmd+K** (Mac) or **Ctrl+K** (Windows) from any page to open the global search.`,
    module: null,
    featureKey: null,
    roles: [],
    tags: ['dashboard', 'home', 'overview', 'quick search', 'start', 'login'],
    relatedRoutes: ['/dashboard', '/'],
    steps: [
      { stepNumber: 1, title: 'Log In', description: 'Enter your email/mobile and PIN to log in to the application.' },
      { stepNumber: 2, title: 'View Dashboard', description: 'After login, you will automatically land on the Dashboard page showing your summary cards.' },
      { stepNumber: 3, title: 'Use Quick Search', description: 'Type a module name in the search bar or press Cmd+K to quickly navigate to any feature.' },
      { stepNumber: 4, title: 'Click Quick Menu Items', description: 'Use the shortcut buttons to jump directly to frequently used modules.' }
    ],
    order: 1
  },
  {
    title: 'Navigating the Application',
    slug: 'navigating-the-application',
    summary: 'Learn how to use the sidebar menu, command palette, and breadcrumbs to move around the application.',
    content: `# Navigating the Application

The application has a clean, organized navigation system that makes it easy to find any feature.

## The Sidebar Menu

On the left side of every page, you'll see the **sidebar menu**. It is organized into sections:

1. **Dashboard** — Your home page
2. **People** — Students and Staff management
3. **Academics Setup** — Classes, Divisions, Subjects, Academic Years, Textbooks
4. **Exam & Assessment** — Exams, Mark Entry, Scores, Progress Cards, Promotions
5. **Attendance** — Mark Attendance, Reports, Leave Requests
6. **Learning (LMS)** — Content Library, Chapters, Assessments, and more
7. **Finance** — Fees, Fee Structures, Payroll, Expenses
8. **Accounting** — Day Book, Ledger, Balance Sheet, Reports
9. **Reports & Analytics** — Reports, Activity Log
10. **Administration** — Departments, Designations, Staff Categories, Transport

### Expanding and Collapsing Sections

- Click the **arrow icon (▶)** next to a section name to expand it and see its sub-items
- Click again to collapse it
- The section you're currently in will automatically expand

### Sidebar on Mobile

On mobile devices or small screens:
1. Tap the **hamburger menu (☰)** icon at the top left
2. The sidebar slides out
3. Tap any menu item to navigate
4. The sidebar closes automatically after you select an item

## Command Palette (Quick Navigation)

The fastest way to navigate is the **Command Palette**:

1. Press **Cmd+K** (Mac) or **Ctrl+K** (Windows) from any page
2. A search dialog appears
3. Type the name of what you're looking for (e.g., "attendance", "marks", "payroll")
4. Click the matching result to navigate instantly

> **Tip:** The command palette searches through all menu items with their descriptions, so you can search by keyword even if you don't remember the exact name.

## Menu Items You See Depend on Your Role

Not everyone sees the same menu items. The sidebar only shows modules you have permission to access:

- **Platform Admin** — Sees organization and system management tools
- **Organization Admin** — Sees branch management and all school modules
- **Branch Admin** — Sees all modules enabled for their branch
- **Teacher** — Sees student-related features, attendance, marks, and LMS
- **Accountant** — Sees finance and accounting modules
- **Student** — Sees personal modules like attendance, LMS, and leave requests
- **Staff** — Sees limited modules based on permissions

If you cannot see a module you expect, contact your administrator — they may need to enable the feature or adjust your permissions.`,
    module: null,
    featureKey: null,
    roles: [],
    tags: ['navigation', 'sidebar', 'menu', 'command palette', 'cmd+k', 'search', 'mobile'],
    relatedRoutes: ['/dashboard', '/'],
    steps: [
      { stepNumber: 1, title: 'Use the Sidebar', description: 'Click on section names in the left sidebar to expand them and see sub-items.' },
      { stepNumber: 2, title: 'Open Command Palette', description: 'Press Cmd+K (Mac) or Ctrl+K (Windows) to open the quick search dialog.' },
      { stepNumber: 3, title: 'Search and Navigate', description: 'Type a module name and click the result to navigate directly.' }
    ],
    order: 2
  },
  {
    title: 'How to Switch Between Branches',
    slug: 'switching-between-branches',
    summary: 'If you manage multiple branches, learn how to switch your active branch context to view and manage different branch data.',
    content: `# How to Switch Between Branches

If your organization has multiple branches (campuses), administrators can switch between them to view and manage each branch's data separately.

## Who Can Switch Branches?

- **Platform Admin** — Can access all branches across all organizations
- **Organization Admin** — Can switch between all branches in their organization

Teachers, staff, accountants, and students are assigned to a specific branch and cannot switch.

## How to Switch

1. **Look at the sidebar** — Near the top, you'll see a **branch dropdown** showing your current branch name
2. **Click the dropdown** to see a list of all available branches
3. **Select a different branch** — for example, "North Campus" or "Main Branch"
4. The page **refreshes automatically** and now shows data for the selected branch

## What Changes When You Switch

When you switch branches, all data-related pages update:

- **Students** — Shows students enrolled in the selected branch
- **Staff** — Shows staff assigned to the selected branch
- **Fees** — Shows fee structures and collections for that branch
- **Attendance** — Shows attendance data for that branch
- **Reports** — All reports reflect the selected branch's data

> **Tip:** The branch you select is remembered for your session. You don't need to re-select it when navigating between pages.

## Example

You are the Organization Admin of "ABC School" with 3 branches:
1. **Main Campus** — 500 students
2. **North Branch** — 200 students
3. **South Branch** — 150 students

To check North Branch's fee collection:
1. Select **"North Branch"** from the branch dropdown
2. Go to **Finance → Fee Management**
3. You'll see only North Branch's fee data`,
    module: null,
    featureKey: null,
    roles: ['platform_admin', 'org_admin'],
    tags: ['branch', 'switch', 'campus', 'multi-branch', 'context'],
    relatedRoutes: ['/dashboard', '/'],
    steps: [
      { stepNumber: 1, title: 'Find the Branch Dropdown', description: 'Look near the top of the sidebar for the branch selector dropdown.' },
      { stepNumber: 2, title: 'Click to Open', description: 'Click the dropdown to see all available branches.' },
      { stepNumber: 3, title: 'Select a Branch', description: 'Click the branch name you want to switch to.' },
      { stepNumber: 4, title: 'Verify the Switch', description: 'The page refreshes and all data now reflects the selected branch.' }
    ],
    order: 3
  },
  {
    title: 'Understanding Roles and Permissions',
    slug: 'understanding-roles-and-permissions',
    summary: 'Learn about the different user roles in the system and what each role can access and do.',
    content: `# Understanding Roles and Permissions

The application uses a role-based access system. Each user is assigned a role that determines what they can see and do.

## The 7 User Roles

| Role | Level | Description |
|------|-------|-------------|
| **Platform Admin** | System-wide | Full access to everything. Manages all organizations, branches, and users. |
| **Organization Admin** | Organization | Manages all branches within their organization. Can configure features and create users. |
| **Branch Admin** | Branch | Full management of a single branch — students, staff, fees, academics, and more. |
| **Accountant** | Branch | Access to finance and accounting modules only — fees, payroll, expenses, and reports. |
| **Teacher** | Branch | Access to student data, attendance marking, mark entry, and LMS content creation. |
| **Staff** | Branch | Limited access to view organizational data as configured by admin. |
| **Student** | Individual | Personal access only — view own attendance, leave requests, LMS content, and grades. |

## What Each Role Can Do

### Platform Admin
- Create and manage organizations
- Create and manage all branches
- Manage all users across the system
- View activity logs for the entire system
- Access everything a Branch Admin can do

### Organization Admin
- Create and manage branches within their organization
- Switch between branches to view/manage data
- Configure features (enable/disable modules per branch)
- Manage domain settings
- Manage users within the organization

### Branch Admin
- Full access to all modules enabled for their branch
- Manage students, staff, classes, subjects
- Handle fees, payroll, expenses
- View reports and analytics
- Manage departments, designations, transport routes

### Accountant
- Fee Management (collect fees, view history)
- Fee Structures and Fee Types
- Payroll processing
- Expenses and Income tracking
- Accounting reports (Day Book, Ledger, Balance Sheet)

### Teacher
- View student lists
- Mark attendance for their classes
- Enter exam marks
- Create and manage LMS content
- Review student submissions
- View attendance reports

### Student
- View personal dashboard
- Access LMS learning content
- Attempt quizzes and assignments
- Submit leave requests
- View own attendance and grades

## Module-Level Permissions

Beyond roles, each user can have specific **module permissions** with four actions:

- **Create** — Can add new records
- **Read** — Can view records
- **Update** — Can edit existing records
- **Delete** — Can remove records

For example, a Teacher might have:
- Students: **Read** only
- Attendance: **Create**, **Read**, **Update**
- Marks: **Create**, **Read**, **Update**

> **Note:** If you feel you're missing access to a module you need, contact your Branch Admin or Organization Admin to update your permissions.`,
    module: null,
    featureKey: null,
    roles: [],
    tags: ['roles', 'permissions', 'access', 'admin', 'teacher', 'student', 'accountant', 'security'],
    relatedRoutes: ['/user-access', '/dashboard'],
    steps: [],
    order: 4
  }
];
