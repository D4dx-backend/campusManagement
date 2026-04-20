export const financeCategory = {
  name: 'Fee Management',
  slug: 'fee-management',
  description: 'Setting up fee structures, collecting fees, tracking dues, and generating receipts',
  icon: 'IndianRupee',
  featureKey: 'finance',
  order: 8,
  status: 'active' as const
};

export const financeArticles = [
  {
    title: 'How to Set Up Fee Types',
    slug: 'how-to-set-up-fee-types',
    summary: 'Learn how to create fee categories like Tuition Fee, Transport Fee, and Lab Fee before creating fee structures.',
    content: `# How to Set Up Fee Types

Fee Types are the categories of fees your school charges (e.g., Tuition Fee, Transport Fee, Lab Fee). Set these up before creating fee structures.

## Steps

1. Go to **Finance → Fee Types** in the sidebar
2. Click **"Add Fee Type"**
3. Fill in:
   - **Fee Type Name** — e.g., "Tuition Fee"
   - **Common for All Classes** — Toggle ON if this fee applies to all classes
   - **Active** — Toggle ON to make it available
4. Click **"Save"**

## Common Fee Types

| Fee Type | Common for All? | Description |
|----------|----------------|-------------|
| Tuition Fee | ✅ Yes | Monthly tuition charge |
| Transport Fee | ❌ No | Only for bus students |
| Lab Fee | ❌ No | Only for classes with labs |
| Library Fee | ✅ Yes | Annual library charge |
| Sports Fee | ✅ Yes | Covers sports activities |
| Exam Fee | ✅ Yes | Per-exam fee |

> **Tip:** Create all fee types first, then create fee structures that reference these types.`,
    module: 'fees',
    featureKey: 'finance',
    roles: ['platform_admin', 'org_admin', 'branch_admin'],
    tags: ['fee type', 'fee category', 'tuition', 'transport fee', 'lab fee'],
    relatedRoutes: ['/fee-type-configs'],
    steps: [
      { stepNumber: 1, title: 'Go to Fee Types', description: 'Navigate to Finance → Fee Types.' },
      { stepNumber: 2, title: 'Click Add Fee Type', description: 'Click the "Add Fee Type" button.' },
      { stepNumber: 3, title: 'Enter Details', description: 'Enter name, set "Common for All Classes", and activate.' },
      { stepNumber: 4, title: 'Save', description: 'Click Save. Repeat for each fee type.' }
    ],
    order: 1
  },
  {
    title: 'How to Create Fee Structures',
    slug: 'how-to-create-fee-structures',
    summary: 'Learn how to create fee structures that define the amount charged per class, including staff child discounts.',
    content: `# How to Create Fee Structures

Fee structures define exactly how much each fee type costs for each class, including any discounts.

## Prerequisites
- **Fee Types** must be created first

## Steps

1. Go to **Finance → Fee Structures** in the sidebar
2. Click **"Add Fee Structure"**
3. Fill in:
   - **Title** — e.g., "Tuition Fee 2025-26"
   - **Fee Type** — Select from your fee types (e.g., "Tuition Fee")
   - **Academic Year** — Select the year
   - **Is Common Fee** — If the amount is the same for all classes
     - If YES: Enter a single amount
     - If NO: Enter different amounts per class
   - **Per-Class Amounts** (if not common):
     - Select classes
     - Enter amount and staff discount % for each class
4. Click **"Save"**

## Example: Tuition Fee with Different Rates

| Class | Amount | Staff Discount |
|-------|--------|---------------|
| LKG - UKG | ₹1,500/month | 50% |
| Class 1-5 | ₹2,000/month | 50% |
| Class 6-8 | ₹2,500/month | 50% |
| Class 9-10 | ₹3,000/month | 50% |
| Class 11-12 | ₹3,500/month | 50% |

## Transport Fee Structure

For transport fees, you can also set the **distance range**:
- 0-5 km: ₹500/month
- 5-10 km: ₹800/month
- 10+ km: ₹1,200/month

> **Tip:** Staff child discounts are automatically applied during fee collection when a student is marked as "Staff Child" in their profile.`,
    module: 'fees',
    featureKey: 'finance',
    roles: ['platform_admin', 'org_admin', 'branch_admin'],
    tags: ['fee structure', 'fee amount', 'class fees', 'staff discount', 'pricing'],
    relatedRoutes: ['/fee-structures'],
    steps: [
      { stepNumber: 1, title: 'Go to Fee Structures', description: 'Navigate to Finance → Fee Structures.' },
      { stepNumber: 2, title: 'Click Add Fee Structure', description: 'Click the "Add Fee Structure" button.' },
      { stepNumber: 3, title: 'Set Title and Type', description: 'Enter a title and select the fee type.' },
      { stepNumber: 4, title: 'Set Amounts', description: 'Enter a common amount or per-class amounts with staff discounts.' },
      { stepNumber: 5, title: 'Save', description: 'Click Save to create the fee structure.' }
    ],
    order: 2
  },
  {
    title: 'How to Collect Fees (Quick Collect)',
    slug: 'how-to-collect-fees-quick',
    summary: 'Step-by-step guide to collecting fees from a single student using the Quick Collect feature.',
    content: `# How to Collect Fees (Quick Collect)

The Quick Collect feature allows you to collect fees from one student at a time with a simple 3-step process.

## Steps

### Step 1: Select Student
1. Go to **Finance → Fee Management** in the sidebar
2. You're on the **"Quick Collect"** tab by default
3. Find the student:
   - **Recent Students** — Click a recently accessed student from the list
   - **Search** — Type the student's name or admission number
   - **Filter by Class** — Select a class to narrow the search

### Step 2: Select Fees
After selecting a student:
1. Available fees are shown in groups by fee type
2. **Check the boxes** next to the fees to collect
3. Use **"Select All Regular Fees"** to check all at once
4. For **transport fees**: Select the distance range from the dropdown
5. The amounts are calculated automatically
6. Staff child discounts are applied automatically if applicable

### Step 3: Payment
1. Select **Payment Method**: Cash / Bank / Online
2. **Academic Year** — Auto-filled (change if needed)
3. **Fee Month** — Select the month being paid for
4. **Remarks** — Add optional notes (e.g., "Paid by father")
5. Click **"Submit Payment"**
6. A **receipt is generated** automatically

## Example

Collecting fees for Rahul (Class 5A):
1. Search "Rahul" → Select "Rahul Kumar (2025-5A-001)"
2. Check: Tuition Fee ₹2,000 + Lab Fee ₹500
3. Payment: Cash → Month: October 2025
4. Click Submit → Receipt generated

## Staff Child Example

Collecting fees for Anu (staff child, Class 5A):
1. Select Anu
2. Tuition Fee: Original ₹2,000 → **After 50% discount: ₹1,000**
3. The discount is applied automatically because Anu is marked as a staff child

> **Tip:** The system remembers your recent students for quick access. Click their name from the "Recent" list instead of searching every time.`,
    module: 'fees',
    featureKey: 'finance',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'accountant'],
    tags: ['collect fee', 'payment', 'quick collect', 'receipt', 'cash', 'fee collection'],
    relatedRoutes: ['/fees'],
    steps: [
      { stepNumber: 1, title: 'Select Student', description: 'Search or select from recent students.' },
      { stepNumber: 2, title: 'Select Fees', description: 'Check the fee types to collect and verify amounts.' },
      { stepNumber: 3, title: 'Choose Payment Method', description: 'Select Cash, Bank, or Online.' },
      { stepNumber: 4, title: 'Set Month', description: 'Select the fee month being paid for.' },
      { stepNumber: 5, title: 'Submit', description: 'Click Submit Payment to process and generate a receipt.' }
    ],
    order: 3
  },
  {
    title: 'How to Collect Fees in Bulk',
    slug: 'how-to-collect-fees-bulk',
    summary: 'Learn how to process fee payments for multiple students at once.',
    content: `# How to Collect Fees in Bulk

When collecting the same fee from many students at once (e.g., monthly tuition for an entire class), use Bulk Collect.

## Steps

1. Go to **Finance → Fee Management** in the sidebar
2. Click the **"Bulk Collect"** tab
3. Follow a similar process to Quick Collect but for multiple students at once
4. Select the class and fees
5. Process payments for all selected students

> **Tip:** Bulk Collect is ideal for monthly tuition fee collection where the amount is the same for all students in a class.`,
    module: 'fees',
    featureKey: 'finance',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'accountant'],
    tags: ['bulk collect', 'batch payment', 'multiple students', 'mass collection'],
    relatedRoutes: ['/fees'],
    steps: [
      { stepNumber: 1, title: 'Go to Fee Management', description: 'Navigate to Finance → Fee Management.' },
      { stepNumber: 2, title: 'Select Bulk Collect Tab', description: 'Click the "Bulk Collect" tab.' },
      { stepNumber: 3, title: 'Select Class and Fees', description: 'Choose the class and fee types to collect.' },
      { stepNumber: 4, title: 'Process Payments', description: 'Process payments for all selected students.' }
    ],
    order: 4
  },
  {
    title: 'How to View and Manage Payment History',
    slug: 'how-to-view-payment-history',
    summary: 'Learn how to view past fee payments, download receipts, and edit or cancel payments.',
    content: `# How to View and Manage Payment History

View all past fee collections with options to download receipts, edit, or cancel payments.

## Steps

1. Go to **Finance → Fee Management** in the sidebar
2. Click the **"Payment History"** tab
3. Browse payments or use filters:
   - Search by student name or admission number
   - Filter by date range
   - Filter by payment method

## Available Actions

| Action | How To | When To Use |
|--------|--------|-------------|
| **Download Receipt** | Click the receipt icon | Give receipt to parent |
| **Edit Payment** | Click the edit icon | Correct a mistake in amount or details |
| **Cancel Payment** | Click cancel | Reverse an incorrect payment |

## Payment History Table

Shows: Student Name, Admission No, Amount Paid, Payment Date, Payment Method, Status

> **Tip:** Always download a receipt when collecting fees in person. The receipt serves as proof of payment for the parent.`,
    module: 'fees',
    featureKey: 'finance',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'accountant'],
    tags: ['payment history', 'receipt', 'download', 'edit payment', 'cancel'],
    relatedRoutes: ['/fees'],
    steps: [
      { stepNumber: 1, title: 'Go to Payment History', description: 'Navigate to Fee Management → Payment History tab.' },
      { stepNumber: 2, title: 'Search or Filter', description: 'Find specific payments using search or filters.' },
      { stepNumber: 3, title: 'Take Action', description: 'Download receipt, edit, or cancel a payment as needed.' }
    ],
    order: 5
  },
  {
    title: 'How to Track Fee Dues and Send Reminders',
    slug: 'how-to-track-fee-dues',
    summary: 'Monitor overdue fee payments, filter by aging, and send payment reminders to parents.',
    content: `# How to Track Fee Dues and Send Reminders

Keep track of unpaid fees and send reminders to parents of students with outstanding balances.

## Steps

1. Go to **Finance → Fee Dues** in the sidebar (or Reports → Fee Dues)
2. View the **summary cards**:
   - **Total Due Amount** — Total outstanding fees
   - **Overdue Amount** — Fees past their due date
   - **Students with Dues** — Number of students with balances
   - **Collection Rate** — Percentage of fees collected

## Filtering by Aging

Use **aging buckets** to prioritize follow-ups:

| Aging Bucket | Meaning |
|-------------|---------|
| Not Due Yet | Fee is due in the future |
| 1-30 Days | Recently overdue |
| 31-60 Days | Moderately overdue |
| 61-90 Days | Significantly overdue |
| 90+ Days | Severely overdue — needs urgent attention |

## Sending Reminders

1. Find students with overdue fees
2. Click **"Send Reminder"** on a student's row
3. Choose the method: **Email** or **WhatsApp**
4. A reminder message is sent to the guardian's contact

## Exporting Dues List

Click **"Export CSV"** to download the full dues list for offline follow-up or sharing with staff.

## Example

Checking Class 5 dues:
1. Filter: Class = "Class 5"
2. Filter: Aging = "90+ Days"
3. Result: 3 students with ₹15,000+ overdue
4. Click "Send Reminder" for each → Email sent to parents

> **Tip:** Run this report weekly and prioritize the 90+ days aging bucket. Early reminders often result in faster payments.`,
    module: 'fees',
    featureKey: 'finance',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'accountant'],
    tags: ['fee dues', 'overdue', 'reminder', 'aging', 'collection', 'outstanding'],
    relatedRoutes: ['/fee-dues', '/reports/fee-dues'],
    steps: [
      { stepNumber: 1, title: 'Go to Fee Dues', description: 'Navigate to Finance → Fee Dues.' },
      { stepNumber: 2, title: 'Review Summary', description: 'Check total dues, overdue amount, and collection rate.' },
      { stepNumber: 3, title: 'Filter by Aging', description: 'Use aging buckets to prioritize follow-ups.' },
      { stepNumber: 4, title: 'Send Reminders', description: 'Click "Send Reminder" to notify parents via email or WhatsApp.' }
    ],
    order: 6
  },
  {
    title: 'How to Configure Fee Receipts',
    slug: 'how-to-configure-fee-receipts',
    summary: 'Set up your receipt template with school name, logo, and other details for printed fee receipts.',
    content: `# How to Configure Fee Receipts

Customize the receipt that is generated when fees are collected. Add your school logo, name, and contact details.

## Steps

1. Go to **Finance → Receipt Config** in the sidebar
2. If no config exists, you'll be put in **edit mode** automatically
3. Fill in:
   - **School Name** — Your school's official name
   - **Address** — School address
   - **Phone** — Contact phone number
   - **Email** — Contact email
   - **Website** — School website (optional)
   - **Logo** — Upload your school logo (image files only, max 2MB)
   - **Tax Number** — Tax identification number (if applicable)
   - **Registration Number** — School registration number
   - **Footer Text** — Any text to appear at the bottom of receipts
4. Click **"Save"**

## Logo Upload

- Click the **upload area** or drag-and-drop your logo
- Accepted formats: JPG, PNG
- Maximum size: 2MB
- A preview shows after upload
- Click the **remove** button to delete the logo

## What Appears on Receipts

The configured information appears on all fee receipts:
- School logo (top)
- School name, address, and contact
- Receipt number, date, and student details
- Fee breakdown
- Footer text (bottom)

> **Tip:** Configure receipts before starting fee collection. This ensures every printed receipt looks professional with your school branding.`,
    module: 'fees',
    featureKey: 'finance',
    roles: ['platform_admin', 'org_admin', 'branch_admin'],
    tags: ['receipt', 'receipt config', 'logo', 'school name', 'print receipt'],
    relatedRoutes: ['/receipt-config'],
    steps: [
      { stepNumber: 1, title: 'Go to Receipt Config', description: 'Navigate to Finance → Receipt Config.' },
      { stepNumber: 2, title: 'Edit Configuration', description: 'Click Edit to enter edit mode.' },
      { stepNumber: 3, title: 'Fill School Details', description: 'Enter school name, address, phone, email, and upload logo.' },
      { stepNumber: 4, title: 'Save', description: 'Click Save. This configuration applies to all future receipts.' }
    ],
    order: 7
  }
];

export const payrollCategory = {
  name: 'Payroll',
  slug: 'payroll',
  description: 'Processing staff salaries with allowances and deductions',
  icon: 'Wallet',
  featureKey: 'finance',
  order: 9,
  status: 'active' as const
};

export const payrollArticles = [
  {
    title: 'How to Process Staff Salary',
    slug: 'how-to-process-staff-salary',
    summary: 'Step-by-step guide to processing monthly salary payments for staff members.',
    content: `# How to Process Staff Salary

Process monthly salary payments for your staff with automatic calculations for allowances and deductions.

## Steps

1. Go to **Finance → Payroll** in the sidebar
2. Click **"Process Salary"** (or the "+" button)
3. Fill in the dialog:
   - **Staff Member** — Select from dropdown (shows name, designation, and base salary)
   - **Month** — Select the salary month (e.g., "October")
   - **Year** — Enter the year (e.g., "2025")
   - **Allowances** — Enter additional amounts (e.g., ₹5,000 for HRA)
   - **Deductions** — Enter amounts to deduct (e.g., ₹2,000 for tax)
   - **Payment Method** — Cash or Bank
4. Click **"Process"**

## Automatic Calculation

The system calculates:
- **Net Salary = Base Salary + Allowances - Deductions**

## Example

Processing October 2025 salary for Priya Nair:
- **Staff:** Priya Nair (Senior Teacher, Base: ₹45,000)
- **Month:** October, **Year:** 2025
- **Allowances:** ₹5,000 (HRA)
- **Deductions:** ₹2,000 (Professional Tax)
- **Net Salary:** ₹45,000 + ₹5,000 - ₹2,000 = **₹48,000**
- **Payment Method:** Bank

## Payroll Stats

At the top of the Payroll page, you'll see:
- **Total Paid** — Total salary disbursed
- **This Month Total** — Current month's salary total
- **Entries** — Number of salary entries processed

> **Tip:** Process payroll at the end of each month. The stats help you track total salary expenses for budgeting.`,
    module: 'payroll',
    featureKey: 'finance',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'accountant'],
    tags: ['payroll', 'salary', 'process salary', 'allowances', 'deductions', 'monthly pay'],
    relatedRoutes: ['/payroll'],
    steps: [
      { stepNumber: 1, title: 'Go to Payroll', description: 'Navigate to Finance → Payroll.' },
      { stepNumber: 2, title: 'Click Process Salary', description: 'Click the "Process Salary" button.' },
      { stepNumber: 3, title: 'Select Staff and Month', description: 'Choose the staff member and salary month/year.' },
      { stepNumber: 4, title: 'Enter Allowances and Deductions', description: 'Add any extra allowances or deductions.' },
      { stepNumber: 5, title: 'Process', description: 'Select payment method and click Process.' }
    ],
    order: 1
  }
];

export const expensesCategory = {
  name: 'Expenses & Income',
  slug: 'expenses-income',
  description: 'Recording school expenses, income, and managing categories',
  icon: 'Receipt',
  featureKey: 'finance',
  order: 10,
  status: 'active' as const
};

export const expensesArticles = [
  {
    title: 'How to Set Up Expense Categories',
    slug: 'how-to-set-up-expense-categories',
    summary: 'Create categories to organize your school expenses like Electricity, Stationery, and Maintenance.',
    content: `# How to Set Up Expense Categories

Organize your expenses by creating categories that match your school's spending patterns.

## Steps

1. Go to **Finance → Expense Categories** in the sidebar
2. Click **"Add Category"**
3. Fill in:
   - **Category Name** — e.g., "Electricity"
   - **Description** — Brief description (optional)
   - **Status** — Active / Inactive
4. Click **"Save"**

## Common Categories

- Electricity Bill
- Water Bill
- Stationery & Printing
- Building Maintenance
- Event Expenses
- Travel & Transport
- Internet & Phone
- Cleaning & Housekeeping
- Sports Equipment
- Lab Supplies

> **Tip:** Create categories before recording expenses so every expense can be properly classified.`,
    module: 'expenses',
    featureKey: 'finance',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'accountant'],
    tags: ['expense category', 'classify', 'electricity', 'maintenance'],
    relatedRoutes: ['/expense-categories'],
    steps: [
      { stepNumber: 1, title: 'Go to Expense Categories', description: 'Navigate to Finance → Expense Categories.' },
      { stepNumber: 2, title: 'Add Category', description: 'Click "Add Category" and enter the name.' },
      { stepNumber: 3, title: 'Save', description: 'Click Save. Repeat for each category.' }
    ],
    order: 1
  },
  {
    title: 'How to Record an Expense',
    slug: 'how-to-record-an-expense',
    summary: 'Learn how to record a school expense with category, amount, and generate a printable voucher.',
    content: `# How to Record an Expense

Record every expense to maintain accurate financial records.

## Steps

1. Go to **Finance → Expenses** in the sidebar
2. Click **"Add Expense"**
3. Fill in:
   - **Date** — When the expense was incurred
   - **Category** — Select from expense categories
   - **Description** — What the expense is for (e.g., "October electricity bill")
   - **Amount** — The expense amount
   - **Payment Method** — Cash or Bank
   - **Remarks** — Additional notes (optional)
4. Click **"Save"**

## Expense Voucher

After recording, you can print an expense voucher:
1. Find the expense in the list
2. Click **"Print Voucher"**
3. A printable voucher with all details is generated

## Expense Stats

At the top of the page:
- **Total Expenses** — All-time total
- **Monthly Expenses** — Current month's total
- **Yearly Expenses** — Current year's total

## Example

Recording an electricity bill:
- **Date:** Oct 15, 2025
- **Category:** Electricity
- **Description:** "October 2025 electricity bill - Main Building"
- **Amount:** ₹12,500
- **Method:** Bank
- Click Save → Print voucher for records

> **Tip:** Record expenses as they happen and keep the printed vouchers filed for audit purposes.`,
    module: 'expenses',
    featureKey: 'finance',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'accountant'],
    tags: ['expense', 'record expense', 'voucher', 'print', 'bill'],
    relatedRoutes: ['/expenses'],
    steps: [
      { stepNumber: 1, title: 'Go to Expenses', description: 'Navigate to Finance → Expenses.' },
      { stepNumber: 2, title: 'Click Add Expense', description: 'Click the "Add Expense" button.' },
      { stepNumber: 3, title: 'Fill Details', description: 'Enter date, category, description, amount, and payment method.' },
      { stepNumber: 4, title: 'Save', description: 'Click Save to record the expense.' },
      { stepNumber: 5, title: 'Print Voucher', description: 'Optionally click "Print Voucher" for a printable record.' }
    ],
    order: 2
  },
  {
    title: 'How to Set Up Income Categories',
    slug: 'how-to-set-up-income-categories',
    summary: 'Create categories for non-fee income like Donations, Rental Income, and Event Revenue.',
    content: `# How to Set Up Income Categories

Track non-fee income by creating categories for different revenue sources.

## Steps

1. Go to **Finance → Income Categories** in the sidebar
2. Click **"Add Category"**
3. Fill in:
   - **Category Name** — e.g., "Donations"
   - **Description** — Brief description
   - **Status** — Active / Inactive
4. Click **"Save"**

## Common Income Categories

- Donations
- Rental Income (auditorium, grounds)
- Event Revenue
- Canteen Revenue
- Interest Income
- Government Grants
- Sponsorships

> **Note:** Regular fee income is tracked automatically through the Fee Management module. Income Categories are for other (non-fee) revenue sources.`,
    module: 'income',
    featureKey: 'finance',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'accountant'],
    tags: ['income category', 'donations', 'revenue', 'non-fee income'],
    relatedRoutes: ['/income-categories'],
    steps: [
      { stepNumber: 1, title: 'Go to Income Categories', description: 'Navigate to Finance → Income Categories.' },
      { stepNumber: 2, title: 'Add Category', description: 'Click "Add Category" and enter the name.' },
      { stepNumber: 3, title: 'Save', description: 'Click Save. Repeat for each category.' }
    ],
    order: 3
  }
];
