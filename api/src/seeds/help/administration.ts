export const administrationCategory = {
  name: 'Administration',
  slug: 'administration',
  description: 'Organization management, branch management, user access, feature settings, and domains',
  icon: 'Settings',
  featureKey: null,
  order: 14,
  status: 'active' as const
};

export const administrationArticles = [
  {
    title: 'How to Create and Manage Organizations',
    slug: 'how-to-manage-organizations',
    summary: 'Platform admins can learn how to create and configure organizations with tax, currency, and contact details.',
    content: `# How to Create and Manage Organizations

Organizations are the top-level entities in the system. Each organization can have multiple branches (schools/campuses).

## Who Can Do This?
Only **Platform Admins** can create and manage organizations.

## Steps to Create an Organization

1. Go to **Organizations** in the sidebar
2. Click **"Add Organization"**
3. Fill in:
   - **Organization Name** — e.g., "ABC Education Trust"
   - **Code** — Short code (e.g., "ABCEDU")
   - **Address** — Registered address
   - **Phone** — Contact number
   - **Email** — Official email
   - **Website** — Organization website (optional)
   - **Tax ID** — Tax registration number
   - **Tax Label** — Label for tax (e.g., "GST No.")
   - **Currency** — e.g., "INR"
   - **Currency Symbol** — e.g., "₹"
   - **Country, State, City, Pincode** — Location details
   - **Registration Number** — Official registration number
   - **Footer Text** — Text shown on receipts and documents
4. Click **"Save"**

## Managing an Organization

From the organization card, you can:
- **Edit** — Update organization details
- **Configure Features (⚙️)** — Enable/disable modules
- **Manage Domains** — Add custom domains
- **Manage Branches** — Create and manage branches

> **Tip:** Set up the organization details carefully — they appear on all documents and receipts for that organization's branches.`,
    module: 'organizations',
    featureKey: null,
    roles: ['platform_admin'],
    tags: ['organization', 'create organization', 'setup', 'trust', 'institution'],
    relatedRoutes: ['/organization-management'],
    steps: [
      { stepNumber: 1, title: 'Go to Organizations', description: 'Navigate to Organizations in the sidebar.' },
      { stepNumber: 2, title: 'Click Add Organization', description: 'Click the "Add Organization" button.' },
      { stepNumber: 3, title: 'Fill Details', description: 'Enter name, code, contact info, tax details, and location.' },
      { stepNumber: 4, title: 'Save', description: 'Click Save to create the organization.' }
    ],
    order: 1
  },
  {
    title: 'How to Create and Manage Branches',
    slug: 'how-to-manage-branches',
    summary: 'Learn how to create school branches under an organization with custom settings.',
    content: `# How to Create and Manage Branches

Branches represent individual schools or campuses under an organization.

## Steps to Create a Branch

1. Go to **Branch Management** in the sidebar
2. Click **"Add Branch"**
3. Fill in:
   - **Name** — Branch name (e.g., "Main Campus")
   - **Code** — Auto-generated from name
   - **Address** — Branch address
   - **Phone** — Branch contact number
   - **Email** — Branch email
   - **Principal Name** — Head of the branch
   - **Established Date** — When the branch was established
   - **Status** — Active / Inactive
4. **(Optional) Override Organization Settings:**
   - Tax ID, Currency, Location, etc.
   - Leave blank to use organization defaults
5. Click **"Save"**

## Branch Feature Settings

After creating a branch, configure which features are available:
1. Click the **gear icon (⚙️)** on the branch card
2. Toggle features ON/OFF
3. **Note:** You can only enable features that are enabled at the organization level
4. Click **"Save"**

## Example

Creating branches for "ABC Education Trust":
1. **Main Campus** — Full features, 500 students
2. **North Branch** — All features except Transport
3. **Online Academy** — LMS only

> **Tip:** Branch settings can override organization defaults for things like tax number, currency, and address. This is useful when branches operate in different locations.`,
    module: 'branches',
    featureKey: null,
    roles: ['platform_admin', 'org_admin'],
    tags: ['branch', 'campus', 'create branch', 'school', 'manage'],
    relatedRoutes: ['/branch-management'],
    steps: [
      { stepNumber: 1, title: 'Go to Branch Management', description: 'Navigate to Branch Management in the sidebar.' },
      { stepNumber: 2, title: 'Click Add Branch', description: 'Click the "Add Branch" button.' },
      { stepNumber: 3, title: 'Fill Details', description: 'Enter name, address, phone, principal name, etc.' },
      { stepNumber: 4, title: 'Save', description: 'Click Save to create the branch.' },
      { stepNumber: 5, title: 'Configure Features', description: 'Click the gear icon to enable/disable features for this branch.' }
    ],
    order: 2
  },
  {
    title: 'How to Manage User Access and Permissions',
    slug: 'how-to-manage-user-access',
    summary: 'Create user accounts, assign roles, and configure per-module permissions for fine-grained access control.',
    content: `# How to Manage User Access and Permissions

Control who can access the system and what they can do by creating users with specific roles and permissions.

## Steps to Create a User

1. Go to **User Access** in the sidebar
2. Click **"Add User"**
3. Fill in:
   - **Name** — User's full name
   - **Email** — Login email
   - **Mobile** — Phone number
   - **PIN** — Login PIN (auto-generated, or set custom)
   - **Role** — Select one:
     - Platform Admin
     - Organization Admin
     - Branch Admin
     - Accountant
     - Teacher
     - Staff
     - Student
   - **Branch** — Select the branch (for non-platform roles)
   - **Status** — Active / Inactive

4. **Set Permissions** — For each module, check the actions allowed:

| Module | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| Students | ☐ | ☑ | ☐ | ☐ |
| Staff | ☐ | ☑ | ☐ | ☐ |
| Fees | ☑ | ☑ | ☑ | ☐ |
| Classes | ☐ | ☑ | ☐ | ☐ |
| Attendance | ☑ | ☑ | ☑ | ☐ |
| Marks | ☑ | ☑ | ☑ | ☐ |
| ... | ... | ... | ... | ... |

5. Click **"Save"**

## Example: Creating a Teacher Account

- **Name:** Priya Nair
- **Email:** priya@school.com
- **Role:** Teacher
- **Branch:** Main Campus
- **Permissions:**
  - Students: Read ✓
  - Classes: Read ✓
  - Attendance: Create ✓, Read ✓, Update ✓
  - Marks: Create ✓, Read ✓, Update ✓
  - LMS: Create ✓, Read ✓, Update ✓

## Resetting a User's PIN

1. Find the user in the list
2. Click **"Reset PIN"**
3. A new PIN is generated
4. Share the new PIN with the user

## Filtering Users

- **Branch** — Filter by branch
- **Role** — Filter by role
- **Status** — Active / Inactive
- **Search** — Search by name, email, or mobile

> **Tip:** The PIN is used for quick login. Give new users their PIN securely and advise them to remember it. PINs can always be reset by an admin.`,
    module: 'users',
    featureKey: null,
    roles: ['platform_admin', 'org_admin', 'branch_admin'],
    tags: ['user access', 'permissions', 'create user', 'role', 'PIN', 'login'],
    relatedRoutes: ['/user-access'],
    steps: [
      { stepNumber: 1, title: 'Go to User Access', description: 'Navigate to User Access in the sidebar.' },
      { stepNumber: 2, title: 'Click Add User', description: 'Click the "Add User" button.' },
      { stepNumber: 3, title: 'Fill User Details', description: 'Enter name, email, mobile, PIN, and select role.' },
      { stepNumber: 4, title: 'Set Permissions', description: 'Check Create/Read/Update/Delete for each module.' },
      { stepNumber: 5, title: 'Save', description: 'Click Save to create the user account.' }
    ],
    order: 3
  },
  {
    title: 'How to Configure Organization Features',
    slug: 'how-to-configure-org-features',
    summary: 'Enable or disable feature modules for an entire organization.',
    content: `# How to Configure Organization Features

Control which modules are available for an organization. Features disabled at the org level are not available to any branch.

## Steps

1. Go to **Organization Feature Settings** (from the organizations page, click ⚙️)
2. **Select the Organization** from the dropdown
3. You'll see all available features as toggle cards:
   - Students
   - Staff
   - Academics
   - Exams
   - LMS
   - Attendance
   - Finance
   - Accounting
   - Transport
   - Reports
4. **Toggle ON/OFF** to enable/disable each feature
5. Use **"Enable All"** or **"Disable All"** for quick selection
6. Click **"Save Changes"**

## What Happens When You Disable a Feature

- The module becomes **inaccessible** for all branches and users in the organization
- Branch-level feature settings cannot override this (branches can only disable, not enable beyond org)
- Menu items for the disabled feature **disappear from the sidebar**

## Example

"ABC School Online" only needs LMS and basic student management:
1. Enable: Students ✓, Staff ✓, Academics ✓, LMS ✓
2. Disable: Exams ✗, Attendance ✗, Finance ✗, Accounting ✗, Transport ✗, Reports ✗

> **Important:** Disabling a feature does NOT delete any existing data. Re-enabling it restores access to previously entered data.`,
    module: 'features',
    featureKey: null,
    roles: ['platform_admin'],
    tags: ['features', 'enable', 'disable', 'modules', 'organization settings'],
    relatedRoutes: ['/organization-feature-settings'],
    steps: [
      { stepNumber: 1, title: 'Select Organization', description: 'Choose the organization from the dropdown.' },
      { stepNumber: 2, title: 'Toggle Features', description: 'Turn features ON or OFF.' },
      { stepNumber: 3, title: 'Save Changes', description: 'Click Save Changes to apply.' }
    ],
    order: 4
  },
  {
    title: 'How to Configure Branch Features',
    slug: 'how-to-configure-branch-features',
    summary: 'Customize which features are available at the branch level, inheriting from the organization.',
    content: `# How to Configure Branch Features

Fine-tune which features are available for a specific branch. Branches inherit organization features and can only disable them — not enable features the organization has turned off.

## Steps

1. Go to **Branch Feature Settings** in the sidebar (or click ⚙️ on a branch card)
2. **Select the Branch** from the dropdown
3. View the feature grid:
   - Features enabled at org level: **Toggleable** (can disable)
   - Features disabled at org level: **Grayed out** with "Not in plan" badge
4. **Toggle features** as needed
5. Click **"Save Changes"**

## Inheritance Rules

- **Branch cannot enable** a feature the organization has disabled
- **Branch can disable** features that are enabled at the org level
- **"Reset to Org Defaults"** — Restores all features to match the organization settings

## Example

Organization has all features enabled. "Online Academy" branch only needs LMS:
1. Disable: Students, Finance, Exams, Attendance, Transport, Accounting
2. Keep enabled: Academics (class structure), LMS
3. Save

> **Tip:** Use "Reset to Org Defaults" if you want a branch to inherit all organization features without any overrides.`,
    module: 'features',
    featureKey: null,
    roles: ['platform_admin', 'org_admin', 'branch_admin'],
    tags: ['branch features', 'inheritance', 'customize', 'branch settings'],
    relatedRoutes: ['/branch-feature-settings'],
    steps: [
      { stepNumber: 1, title: 'Select Branch', description: 'Choose the branch from the dropdown.' },
      { stepNumber: 2, title: 'Toggle Features', description: 'Disable features not needed for this branch.' },
      { stepNumber: 3, title: 'Save Changes', description: 'Click Save Changes to apply.' }
    ],
    order: 5
  },
  {
    title: 'How to Manage Custom Domains',
    slug: 'how-to-manage-custom-domains',
    summary: 'Set up custom domains or subdomains for your organization to access the application.',
    content: `# How to Manage Custom Domains

Map custom domains or subdomains to your organization so users can access the application through your own web address.

## Steps to Add a Domain

1. Go to **Domain Management** in the sidebar
2. Click **"Add Domain"**
3. Fill in:
   - **Domain** — Your domain name (e.g., "school.example.com")
   - **Domain Type** — Subdomain or Custom domain
   - **Set as Primary** — Toggle if this should be the main domain
4. Click **"Save"**

## Verifying a Domain

After adding a custom domain:

1. **Configure DNS** — Point your domain to the application's servers
   - For subdomains: Add a CNAME record
   - For custom domains: Add an A record
2. Come back to **Domain Management**
3. Click **"Verify"** on your domain
4. The system checks DNS configuration
5. If correct, status changes to **"Active"** ✅

## Domain Statuses

| Status | Meaning |
|--------|---------|
| **Active** ✅ | Domain is verified and working |
| **Pending** ⏳ | Domain added but DNS not yet verified |
| **Inactive** ❌ | Domain verification failed or domain was disabled |

## Setting a Primary Domain

1. Click the **star icon** on the domain you want as primary
2. This becomes the main address for your organization
3. Only one domain can be primary at a time

## Example

Setting up "abcschool.edu.in" as a custom domain:
1. Add domain: "abcschool.edu.in", Type: Custom
2. Configure DNS at your domain registrar (add A record pointing to our server IP)
3. Wait for DNS propagation (up to 24 hours)
4. Click "Verify" → Status changes to Active ✅
5. Click the star icon to set as Primary

> **Tip:** DNS changes can take up to 24 hours to propagate. If verification fails, wait and try again later.`,
    module: 'domains',
    featureKey: null,
    roles: ['platform_admin', 'org_admin'],
    tags: ['domain', 'custom domain', 'subdomain', 'DNS', 'verify', 'URL'],
    relatedRoutes: ['/domain-management'],
    steps: [
      { stepNumber: 1, title: 'Go to Domain Management', description: 'Navigate to Domain Management in the sidebar.' },
      { stepNumber: 2, title: 'Add Domain', description: 'Click "Add Domain" and enter the domain details.' },
      { stepNumber: 3, title: 'Configure DNS', description: 'Set up DNS records at your domain registrar.' },
      { stepNumber: 4, title: 'Verify', description: 'Click "Verify" to check the DNS configuration.' },
      { stepNumber: 5, title: 'Set Primary', description: 'Click the star icon to make it the primary domain.' }
    ],
    order: 6
  }
];
