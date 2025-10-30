# Textbook Indent Feature

A comprehensive textbook issuance and return management system with receipt generation capabilities.

## Features

### 1. Textbook Indent Management
- **Create Indent**: Issue textbooks to students with payment tracking
- **View Details**: Complete indent information with student and book details
- **Status Tracking**: Pending → Issued → Partially Returned → Returned → Cancelled
- **Payment Management**: Track payments, partial payments, and balances

### 2. Student-Centric Design
- Student selection with class and admission number display
- Academic year tracking
- Individual student textbook history
- Expected return date management

### 3. Textbook Selection & Inventory
- Real-time availability checking
- Multiple book selection with quantity control
- Price calculation and total amount computation
- Integration with existing textbook inventory system

### 4. Return Management
- Partial and full return processing
- Book condition assessment (Good, Fair, Poor, Damaged, Lost)
- Return date tracking
- Damage/loss charge calculation

### 5. Receipt Generation
- Professional PDF receipt generation
- School branding and configuration
- Detailed itemization with terms & conditions
- Digital signature sections
- Downloadable receipts

### 6. Analytics & Reporting
- Dashboard statistics (Total, Pending, Issued, Overdue)
- Monthly and class-wise analytics
- Overdue tracking and alerts
- Payment status monitoring

## File Structure

```
src/
├── types/
│   └── textbookIndent.ts           # TypeScript interfaces
├── services/
│   └── textbookIndentService.ts    # API service layer
├── hooks/
│   └── useTextbookIndents.ts       # React Query hooks
├── components/
│   ├── receipt/
│   │   └── TextbookReceiptTemplate.tsx  # Receipt template
│   └── textbook/
│       ├── CreateTextbookIndent.tsx     # Indent creation form
│       └── ReturnTextbooks.tsx          # Return processing form
├── pages/
│   └── TextbookIndents.tsx         # Main page component
└── utils/
    └── textbookReceiptGenerator.ts # PDF generation utility
```

## API Endpoints

### Textbook Indents
- `GET /textbook-indents` - List indents with filters
- `GET /textbook-indents/:id` - Get indent details
- `POST /textbook-indents` - Create new indent
- `PUT /textbook-indents/:id` - Update indent
- `POST /textbook-indents/:id/issue` - Issue textbooks
- `POST /textbook-indents/:id/return` - Process returns
- `POST /textbook-indents/:id/cancel` - Cancel indent
- `POST /textbook-indents/:id/receipt` - Generate receipt
- `GET /textbook-indents/stats/overview` - Get statistics
- `GET /textbook-indents/overdue` - Get overdue indents
- `GET /textbook-indents/student/:id/history` - Student history
- `POST /textbook-indents/bulk-issue` - Bulk issue for class

## Data Models

### TextbookIndent
```typescript
interface TextbookIndent {
  _id: string;
  indentNo: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  class: string;
  division?: string;
  academicYear: string;
  items: TextbookIndentItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'bank' | 'online' | 'adjustment';
  paymentStatus: 'pending' | 'partial' | 'paid';
  paidAmount: number;
  balanceAmount: number;
  issueDate: string;
  expectedReturnDate?: string;
  status: 'pending' | 'issued' | 'partially_returned' | 'returned' | 'cancelled';
  issuedBy: string;
  issuedByName: string;
  remarks?: string;
  receiptGenerated: boolean;
  branchId: string;
  createdAt: string;
  updatedAt: string;
}
```

### TextbookIndentItem
```typescript
interface TextbookIndentItem {
  _id: string;
  textbookId: string;
  bookCode: string;
  title: string;
  subject: string;
  publisher: string;
  price: number;
  quantity: number;
  returnedQuantity: number;
  status: 'issued' | 'partially_returned' | 'returned' | 'lost' | 'damaged';
  issueDate: string;
  returnDate?: string;
  condition?: 'good' | 'fair' | 'poor' | 'damaged' | 'lost';
  remarks?: string;
}
```

## Usage Examples

### Creating a Textbook Indent
```typescript
const indentData: CreateTextbookIndentData = {
  studentId: "student123",
  items: [
    { textbookId: "book1", quantity: 1 },
    { textbookId: "book2", quantity: 2 }
  ],
  paymentMethod: "cash",
  paidAmount: 500,
  expectedReturnDate: "2024-03-31",
  remarks: "First semester books"
};

await createTextbookIndent(indentData);
```

### Processing Returns
```typescript
const returnData: ReturnTextbookData = {
  items: [
    {
      itemId: "item1",
      returnedQuantity: 1,
      condition: "good",
      remarks: "Book in excellent condition"
    }
  ]
};

await returnTextbooks(indentId, returnData);
```

### Generating Receipt
```typescript
const receiptData = await generateReceipt(indentId);
await downloadTextbookReceipt(receiptData);
```

## Key Features Implementation

### 1. Real-time Inventory Updates
- Automatic stock reduction on issue
- Stock restoration on return
- Availability checking before issue

### 2. Payment Tracking
- Multiple payment methods support
- Partial payment handling
- Balance calculation and tracking

### 3. Condition Assessment
- Book condition tracking on return
- Damage/loss charge calculation
- Condition-based inventory updates

### 4. Receipt System
- Professional PDF generation
- School configuration integration
- Terms and conditions inclusion
- Digital signatures support

### 5. Analytics Dashboard
- Real-time statistics
- Overdue tracking
- Class and monthly analytics
- Payment status monitoring

## Integration Points

### With Existing Systems
- **Student Management**: Student selection and details
- **Textbook Inventory**: Real-time stock management
- **Receipt Configuration**: School branding and settings
- **User Management**: Issued by tracking and permissions

### External Dependencies
- **html2canvas**: For receipt PDF generation
- **jsPDF**: PDF creation and download
- **React Query**: Data fetching and caching
- **Tailwind CSS**: Styling and responsive design

## Best Practices Implemented

### 1. Data Validation
- Form validation with TypeScript
- API response validation
- Business rule enforcement

### 2. Error Handling
- Comprehensive error messages
- Graceful failure handling
- User-friendly error display

### 3. Performance Optimization
- React Query caching
- Pagination for large datasets
- Optimistic updates

### 4. User Experience
- Intuitive workflow design
- Real-time feedback
- Responsive design
- Accessibility compliance

### 5. Security
- Role-based access control
- Data sanitization
- Secure API endpoints

## Future Enhancements

### 1. Advanced Features
- Bulk operations for class-wise issuance
- Automated overdue notifications
- Integration with SMS/Email systems
- Barcode scanning for quick processing

### 2. Reporting Enhancements
- Advanced analytics dashboard
- Custom report generation
- Export capabilities
- Trend analysis

### 3. Mobile Support
- Mobile-responsive design
- Progressive Web App (PWA)
- Offline capability
- Mobile-specific workflows

### 4. Integration Improvements
- Library management system integration
- Academic calendar integration
- Parent portal integration
- Financial system integration

## Deployment Notes

### Environment Variables
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api

# Receipt Configuration
VITE_RECEIPT_LOGO_URL=https://example.com/logo.png
VITE_SCHOOL_NAME="Example School"
```

### Dependencies
```json
{
  "html2canvas": "^1.4.1",
  "jspdf": "^3.0.3",
  "@tanstack/react-query": "^5.90.2",
  "lucide-react": "^0.462.0"
}
```

This textbook indent feature provides a complete solution for managing textbook issuance and returns with professional receipt generation, following modern web development best practices and providing an excellent user experience.