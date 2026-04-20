export const transportCategory = {
  name: 'Transport',
  slug: 'transport',
  description: 'Managing transport routes, vehicles, and drivers',
  icon: 'Bus',
  featureKey: 'transport',
  order: 12,
  status: 'active' as const
};

export const transportArticles = [
  {
    title: 'How to Create Transport Routes',
    slug: 'how-to-create-transport-routes',
    summary: 'Learn how to set up transport routes with multiple vehicles, driver details, and route descriptions.',
    content: `# How to Create Transport Routes

Set up the school's transport routes with vehicle and driver information.

## Steps

1. Go to **Administration → Transport Routes** in the sidebar
2. Click **"Add Route"** (the "+" button)
3. Fill in:
   - **Route Name** — e.g., "North Zone Route 1"
   - **Route Code** — Auto-generated from name
   - **Description** — Brief route description (e.g., "Covers neighborhoods north of the school")
   - **Status** — Active / Inactive
4. Add **Vehicles**:
   - Click **"Add Vehicle"**
   - Enter:
     - **Vehicle Number** — e.g., "KL-10-AB-1234"
     - **Driver Name** — e.g., "Suresh"
     - **Driver Phone** — e.g., "9876543210"
   - You can add multiple vehicles per route
5. Click **"Save"**

## Example Setup

| Route | Description | Vehicles |
|-------|-------------|----------|
| North Zone Route 1 | Covers Edapally, Kakkanad, Thrikkakara | Bus KL-10-AB-1234 (Driver: Suresh), Bus KL-10-CD-5678 (Driver: Rajan) |
| South Zone Route 1 | Covers Tripunithura, Maradu | Bus KL-10-EF-9012 (Driver: Kumar) |
| East Zone Route 1 | Covers Aluva, Angamaly | Bus KL-10-GH-3456 (Driver: Vinod) |

## Important Notes

- **Multiple vehicles** can be assigned to a single route
- **Transport fees** are configured separately in **Fee Structures** (not here)
- Students are assigned to routes when adding/editing student profiles

> **Tip:** Create all transport routes before the academic year begins and before assigning transport to student profiles.`,
    module: 'transport_routes',
    featureKey: 'transport',
    roles: ['platform_admin', 'org_admin', 'branch_admin'],
    tags: ['transport', 'route', 'bus', 'vehicle', 'driver', 'school bus'],
    relatedRoutes: ['/transport-routes'],
    steps: [
      { stepNumber: 1, title: 'Go to Transport Routes', description: 'Navigate to Administration → Transport Routes.' },
      { stepNumber: 2, title: 'Click Add Route', description: 'Click the "+" button to create a new route.' },
      { stepNumber: 3, title: 'Enter Route Details', description: 'Enter route name, description, and status.' },
      { stepNumber: 4, title: 'Add Vehicles', description: 'Click "Add Vehicle" and enter vehicle number, driver name, and phone.' },
      { stepNumber: 5, title: 'Save', description: 'Click Save to create the route.' }
    ],
    order: 1
  },
  {
    title: 'Understanding Transport Reports',
    slug: 'understanding-transport-reports',
    summary: 'View reports on students per route and vehicle utilization.',
    content: `# Understanding Transport Reports

View how many students use each transport route and check vehicle utilization.

## Steps

1. Go to **Reports → Transport Report** in the sidebar
2. View the report showing:
   - Students assigned to each route
   - Number of students per vehicle
   - Route utilization

This helps you plan capacity and identify routes that may need additional vehicles.

> **Tip:** Review transport reports before each academic year to adjust routes and vehicles based on student enrollment.`,
    module: 'transport_routes',
    featureKey: 'transport',
    roles: ['platform_admin', 'org_admin', 'branch_admin'],
    tags: ['transport report', 'bus report', 'route utilization', 'capacity'],
    relatedRoutes: ['/reports/transport'],
    steps: [
      { stepNumber: 1, title: 'Go to Transport Report', description: 'Navigate to Reports → Transport Report.' },
      { stepNumber: 2, title: 'Review Data', description: 'Check students per route and vehicle utilization.' }
    ],
    order: 2
  }
];
