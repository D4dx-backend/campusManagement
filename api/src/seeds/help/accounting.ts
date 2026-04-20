export const accountingCategory = {
  name: 'Accounting',
  slug: 'accounting',
  description: 'Day book, ledger, balance sheet, and financial reports for your school',
  icon: 'Calculator',
  featureKey: 'accounting',
  order: 11,
  status: 'active' as const
};

export const accountingArticles = [
  {
    title: 'Understanding the Day Book',
    slug: 'understanding-the-day-book',
    summary: 'Learn how to view daily transactions, filter by date range, and export/print the day book.',
    content: `# Understanding the Day Book

The Day Book shows a day-by-day record of all financial transactions — both income and expenses.

## Steps

1. Go to **Accounting → Day Book** in the sidebar
2. Set filters:
   - **Start Date** — Defaults to 1st of the current month
   - **End Date** — Defaults to today
   - **Transaction Type** — All / Income / Expense
   - **Search** — Search by description or category
3. The table shows all transactions within the date range

## Table Columns

| Column | Description |
|--------|-------------|
| Date | Transaction date |
| Type | Income or Expense |
| Category | Fee type, expense category, etc. |
| Description | Transaction details |
| Amount | Transaction amount |
| Payment Method | Cash or Bank |
| Reference | Reference number (if any) |

## Summary

At the top or bottom, you'll see:
- **Total Income** — Sum of all income transactions
- **Total Expense** — Sum of all expense transactions
- **Net Amount** — Income minus Expenses

## Exporting

- **CSV** — Download as CSV for spreadsheets
- **Excel** — Download as Excel file
- **Print** — Print a formatted report with school header

## Example

Viewing October 2025 Day Book:
1. Start Date: Oct 1, 2025 | End Date: Oct 31, 2025
2. Type: All
3. Result shows:
   - Fee collections: ₹5,00,000 (Income)
   - Salary payments: ₹3,00,000 (Expense)
   - Other expenses: ₹50,000 (Expense)
   - **Net: ₹1,50,000**

> **Tip:** Review the Day Book at the end of each day to verify all transactions are correctly recorded. Print a monthly report for your records.`,
    module: 'accounting',
    featureKey: 'accounting',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'accountant'],
    tags: ['day book', 'daily transactions', 'income', 'expense', 'financial record'],
    relatedRoutes: ['/accounting/daybook'],
    steps: [
      { stepNumber: 1, title: 'Go to Day Book', description: 'Navigate to Accounting → Day Book.' },
      { stepNumber: 2, title: 'Set Date Range', description: 'Choose start and end dates for the period.' },
      { stepNumber: 3, title: 'Filter Type', description: 'Optionally filter by Income or Expense.' },
      { stepNumber: 4, title: 'Review Transactions', description: 'Browse the transaction list and summary totals.' },
      { stepNumber: 5, title: 'Export', description: 'Download as CSV, Excel, or Print for records.' }
    ],
    order: 1
  },
  {
    title: 'Understanding the Ledger',
    slug: 'understanding-the-ledger',
    summary: 'Learn how to view the account-wise ledger with trial balance for financial verification.',
    content: `# Understanding the Ledger

The Ledger provides an account-wise view of all transactions, showing credits and debits for each account.

## Steps

1. Go to **Accounting → Ledger** in the sidebar
2. Set filters:
   - **Start Date** — Optional start date
   - **End Date** — Optional end date
   - **Account Type** — All / Fees / Expenses / Payroll
   - **Payment Method** — All / Cash / Bank
3. View the account list with balances

## What You'll See

The ledger table shows:
- **Account Name** — The account (e.g., "Tuition Fee", "Electricity")
- **Type** — Income or Expense
- **Balance** — Current balance
- **Transaction Count** — Number of transactions

## Trial Balance

At the top, you'll see the **Trial Balance**:
- **Total Credit** — Sum of all credits (income)
- **Total Debit** — Sum of all debits (expenses)
- **Difference** — Should ideally be zero (balanced books)

## Exporting

Export options: CSV, Excel, Print

> **Tip:** The Trial Balance should balance (Difference = 0). If there's a discrepancy, review recent transactions for errors.`,
    module: 'accounting',
    featureKey: 'accounting',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'accountant'],
    tags: ['ledger', 'trial balance', 'accounts', 'credit', 'debit'],
    relatedRoutes: ['/accounting/ledger'],
    steps: [
      { stepNumber: 1, title: 'Go to Ledger', description: 'Navigate to Accounting → Ledger.' },
      { stepNumber: 2, title: 'Set Filters', description: 'Optionally set date range and account type.' },
      { stepNumber: 3, title: 'Review Accounts', description: 'View account balances and transaction counts.' },
      { stepNumber: 4, title: 'Check Trial Balance', description: 'Verify that credits and debits balance.' }
    ],
    order: 2
  },
  {
    title: 'How to View Fee Details Report',
    slug: 'how-to-view-fee-details',
    summary: 'View detailed fee collection breakdowns by type, class, and student.',
    content: `# How to View Fee Details Report

The Fee Details report provides a detailed breakdown of all fee collections.

## Steps

1. Go to **Accounting → Fee Details** in the sidebar
2. The report shows fee collections grouped by:
   - Fee type (Tuition, Transport, Lab, etc.)
   - Class
   - Individual student payments

This helps you understand where your fee revenue comes from and track collection trends.

> **Tip:** Use this report during financial reviews to understand fee collection patterns and identify areas where collections may be lagging.`,
    module: 'accounting',
    featureKey: 'accounting',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'accountant'],
    tags: ['fee details', 'fee breakdown', 'collection report'],
    relatedRoutes: ['/accounting/fee-details'],
    steps: [
      { stepNumber: 1, title: 'Go to Fee Details', description: 'Navigate to Accounting → Fee Details.' },
      { stepNumber: 2, title: 'Review Breakdown', description: 'View fee collections by type, class, and student.' }
    ],
    order: 3
  },
  {
    title: 'How to View the Balance Sheet',
    slug: 'how-to-view-balance-sheet',
    summary: 'Understand your school\'s financial position with assets, liabilities, and equity.',
    content: `# How to View the Balance Sheet

The Balance Sheet shows your school's financial position — what you own (assets), what you owe (liabilities), and the difference (equity).

## Steps

1. Go to **Accounting → Balance Sheet** in the sidebar
2. The report automatically calculates and displays:
   - **Assets** — Cash, bank balances, receivables
   - **Liabilities** — Outstanding payments, dues
   - **Equity** — Net worth (Assets - Liabilities)

## Understanding the Numbers

| Section | Includes | Example |
|---------|----------|---------|
| Assets | Cash in hand, Bank balance, Fee receivables | ₹10,00,000 |
| Liabilities | Pending salary, Outstanding bills | ₹3,00,000 |
| Equity | Net position | ₹7,00,000 |

> **Tip:** Review the balance sheet monthly and at the end of each academic year for financial planning.`,
    module: 'accounting',
    featureKey: 'accounting',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'accountant'],
    tags: ['balance sheet', 'assets', 'liabilities', 'financial position'],
    relatedRoutes: ['/accounting/balance-sheet'],
    steps: [
      { stepNumber: 1, title: 'Go to Balance Sheet', description: 'Navigate to Accounting → Balance Sheet.' },
      { stepNumber: 2, title: 'Review Position', description: 'Review assets, liabilities, and equity.' }
    ],
    order: 4
  },
  {
    title: 'How to Generate the Annual Report',
    slug: 'how-to-generate-annual-report',
    summary: 'Generate a comprehensive yearly financial summary with all income, expenses, and net position.',
    content: `# How to Generate the Annual Report

The Annual Report provides a complete financial summary for an entire academic year.

## Steps

1. Go to **Accounting → Annual Report** in the sidebar
2. The report compiles:
   - Total income by category (fees, donations, etc.)
   - Total expenses by category (salary, utilities, etc.)
   - Monthly trends
   - Net income/loss for the year
3. Export or print for records

## What's Included

- **Income Summary** — All revenue sources with totals
- **Expense Summary** — All expense categories with totals
- **Net Income** — Income minus Expenses
- **Monthly Breakdown** — Month-by-month comparison

> **Tip:** Generate the Annual Report at the end of each academic year. Share it with your management committee or board for financial review.`,
    module: 'accounting',
    featureKey: 'accounting',
    roles: ['platform_admin', 'org_admin', 'branch_admin', 'accountant'],
    tags: ['annual report', 'yearly summary', 'financial report', 'year end'],
    relatedRoutes: ['/accounting/annual-report'],
    steps: [
      { stepNumber: 1, title: 'Go to Annual Report', description: 'Navigate to Accounting → Annual Report.' },
      { stepNumber: 2, title: 'Review Report', description: 'View income summary, expense summary, and net income.' },
      { stepNumber: 3, title: 'Export', description: 'Export or print for records and board meetings.' }
    ],
    order: 5
  }
];
