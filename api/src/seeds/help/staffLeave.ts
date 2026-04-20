export const staffLeaveArticles = [
  {
    title: 'How to Apply for Staff Leave',
    slug: 'how-to-apply-for-staff-leave',
    summary: 'Staff and teachers can apply for leave by selecting the type, dates, and reason.',
    content: `# How to Apply for Staff Leave

Staff members and teachers can submit leave requests through the system. Admins can then review and approve or reject these requests.

## Who Can Use This?
- **Teachers** and **Staff** — Can submit and track their own leave requests
- **Branch Admin / Org Admin** — Can view all staff leave requests and approve/reject them

## Applying for Leave (Staff/Teachers)

### Step 1: Go to Staff Leave
Click **Staff Leave** (or **My Leave**) in the sidebar under the Attendance section.

### Step 2: Click "Apply for Leave"
Click the **Apply for Leave** button.

### Step 3: Fill in Details
- **Leave Type** — Choose one:
  - **Casual Leave** — For personal reasons
  - **Sick Leave** — For illness or medical reasons
  - **Earned Leave** — For pre-planned absences
  - **Other** — Any other type of leave
- **From Date** — The first day of leave
- **To Date** — The last day of leave (must be on or after From Date)
- **Reason** — Explain why you need the leave

### Step 4: Submit
Click **Submit**. Your leave request will appear in the table with **Pending** status.

## Tracking Your Requests
Your leave requests show in a table with:
| Column | Description |
|--------|-------------|
| Leave Type | The type you selected |
| From Date | Start of leave |
| To Date | End of leave |
| Days | Number of leave days (auto-calculated) |
| Reason | Your reason |
| Status | Pending (yellow) / Approved (green) / Rejected (red) |

### Cancel a Pending Request
If your leave is still **Pending** (not yet reviewed), you can click the **trash icon** to cancel it.

> **Note:** Once a leave is Approved or Rejected, it cannot be cancelled.

## Reviewing Leave Requests (Admins)

### Step 1: Go to Staff Leave Requests
Click **Staff Leave** in the sidebar.

### Step 2: View All Requests
The table shows all staff leave requests with:
- **Staff Name** and **Role**
- Leave Type, Dates, Days, Reason
- Current Status

### Step 3: Filter by Status
Use the **Status dropdown** to filter: All / Pending / Approved / Rejected

### Step 4: Review a Request
Click the **Review** button on any Pending request.

### Step 5: Make a Decision
- Choose **Approve** or **Reject**
- Add an optional **Note** (e.g., "Please ensure handover before leave")
- Click **Confirm**

The status updates immediately and the staff member can see the decision.

## Status Colors
| Status | Color | Icon |
|--------|-------|------|
| Pending | Yellow | Clock |
| Approved | Green | Check |
| Rejected | Red | X |
`,
    module: 'staff-leave',
    featureKey: 'attendance',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'teacher', 'staff'],
    tags: ['staff leave', 'teacher leave', 'leave request', 'approve leave', 'casual leave', 'sick leave'],
    relatedRoutes: ['/staff-leave-requests'],
    steps: [
      { stepNumber: 1, title: 'Go to Staff Leave', description: 'Click Staff Leave in the sidebar' },
      { stepNumber: 2, title: 'Click "Apply for Leave"', description: 'Opens the leave application form' },
      { stepNumber: 3, title: 'Select leave type, dates, reason', description: 'Fill in leave details' },
      { stepNumber: 4, title: 'Submit', description: 'Request goes to admin for review' },
    ],
    order: 5,
  },
];
