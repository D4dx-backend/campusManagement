export const reportsCategory = {
  name: 'Reports & Analytics',
  slug: 'reports-analytics',
  description: 'Financial reports, activity logs, and data analytics',
  icon: 'BarChart3',
  featureKey: 'reports',
  order: 13,
  status: 'active' as const
};

export const reportsArticles = [
  {
    title: 'How to View Monthly Financial Reports',
    slug: 'how-to-view-monthly-reports',
    summary: 'View monthly financial summaries with income/expense breakdowns and quick access to specialized reports.',
    content: `# How to View Monthly Financial Reports

Get a comprehensive view of your school's financial health for any month.

## Steps

1. Go to **Reports & Analytics → Reports** in the sidebar
2. Select:
   - **Month** — Choose the month (e.g., "October")
   - **Year** — Choose the year (e.g., "2025")
3. View the dashboard:

## Summary Cards

| Card | Shows |
|------|-------|
| **Income** | Total income for the month |
| **Expenses** | Total expenses (with category breakdown) |
| **Net Income** | Income minus Expenses |
| **Transactions** | Total number of financial transactions |

## Income Breakdown

Shows income by fee type:
- Tuition Fee: ₹3,00,000
- Transport Fee: ₹80,000
- Lab Fee: ₹20,000
- *Total: ₹4,00,000*

## Expense Breakdown

Shows expenses by category + payroll:
- Salaries: ₹2,50,000
- Electricity: ₹12,500
- Maintenance: ₹15,000
- *Total: ₹2,77,500*

## Quick Links

The report page provides quick access to:
- **Fee Dues Report** — Detailed overdue fee analysis
- **Attendance Reports** — Monthly attendance data

> **Tip:** Review the monthly report to identify trends in income and expenses. Share with management for financial planning.`,
    module: 'reports',
    featureKey: 'reports',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'accountant'],
    tags: ['monthly report', 'financial report', 'income', 'expense', 'summary'],
    relatedRoutes: ['/reports'],
    steps: [
      { stepNumber: 1, title: 'Go to Reports', description: 'Navigate to Reports & Analytics → Reports.' },
      { stepNumber: 2, title: 'Select Month and Year', description: 'Choose the month and year to view.' },
      { stepNumber: 3, title: 'Review Summary', description: 'Check income, expenses, net income, and breakdowns.' }
    ],
    order: 1
  },
  {
    title: 'How to View Activity Logs',
    slug: 'how-to-view-activity-logs',
    summary: 'Monitor who did what in the system with detailed audit trails filterable by module, action, and role.',
    content: `# How to View Activity Logs

Activity Logs track every action performed in the system — who did what, when, and in which module.

## Steps

1. Go to **Reports & Analytics → Activity Log** in the sidebar
2. View the stats at the top:
   - **Total Activities** — All logged actions
   - **Current Page** — Actions shown on this page
   - **Active Users** — Users who performed actions
   - **Most Active Module** — The module with the most activity
3. Use filters to narrow down:
   - **Search** — Search by user, action, or details
   - **Module** — Filter by module (e.g., "fees", "students", "attendance")
   - **Action** — Filter by type (Create / Update / Delete / Login / Logout)
   - **Role** — Filter by user role
   - **Organization** — Filter by organization (platform admin only)
   - **Branch** — Filter by branch (platform admin / org admin)

## Activity Log Table

| Column | Description |
|--------|-------------|
| User | Who performed the action |
| Role | Their role (color-coded badge) |
| Action | What they did (color-coded: green=Create, blue=Update, red=Delete) |
| Module | Which module was affected |
| Details | Specific details of the action |
| Timestamp | When it happened |
| Organization | Which organization (if applicable) |

## Example Uses

- **"Who deleted a student?"** — Filter Module: students, Action: delete
- **"What did a specific user do today?"** — Search by user name
- **"All fee collections this week?"** — Filter Module: fees, Action: create

## Role-Based Visibility

- **Platform Admin** — Sees all activities across all organizations
- **Org Admin** — Sees activities within their organization
- **Other Roles** — See only their own activities

> **Tip:** Check activity logs regularly for security monitoring. Any unexpected deletions or changes should be investigated.`,
    module: 'activity_logs',
    featureKey: 'reports',
    roles: ['platform_admin', 'org_admin', 'branch_admin'],
    tags: ['activity log', 'audit trail', 'who did what', 'security', 'monitoring'],
    relatedRoutes: ['/activity-log'],
    steps: [
      { stepNumber: 1, title: 'Go to Activity Log', description: 'Navigate to Reports & Analytics → Activity Log.' },
      { stepNumber: 2, title: 'Review Stats', description: 'Check total activities, active users, and most active module.' },
      { stepNumber: 3, title: 'Apply Filters', description: 'Filter by module, action, role, or search for specific activities.' },
      { stepNumber: 4, title: 'Investigate', description: 'Click into specific entries to see detailed information.' }
    ],
    order: 2
  }
];
