import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Minus, 
  Search, 
  BookOpen, 
  User, 
  Calculator,
  Loader2,
  X
} from 'lucide-react';
import { useStudents } from '@/hooks/useStudents';
import { useTextbooks } from '@/hooks/useTextbooks';
import { useCreateTextbookIndent } from '@/hooks/useTextbookIndents';
import { CreateTextbookIndentData } from '@/types/textbookIndent';

interface CreateTextbookIndentProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface SelectedTextbook {
  _id: string;
  bookCode: string;
  title: string;
  subject: string;
  publisher: string;
  price: number;
  available: number;
  quantity: number;
}

export const CreateTextbookIndent = ({ onSuccess, onCancel }: CreateTextbookIndentProps) => {
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedTextbooks, setSelectedTextbooks] = useState<SelectedTextbook[]>([]);
  const [textbookSearch, setTextbookSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'online' | 'adjustment'>('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [remarks, setRemarks] = useState('');

  // API hooks
  const { data: studentsResponse } = useStudents({ limit: 100 });
  const { data: textbooksResponse } = useTextbooks({ 
    search: textbookSearch,
    limit: 50 
  });
  const createIndentMutation = useCreateTextbookIndent();

  const students = studentsResponse?.data || [];
  const textbooks = textbooksResponse?.data || [];

  // Calculate totals
  const totalAmount = selectedTextbooks.reduce((sum, book) => sum + (book.price * book.quantity), 0);
  const paidAmountNum = parseFloat(paidAmount) || 0;
  const balanceAmount = totalAmount - paidAmountNum;

  // Handle student selection
  const handleStudentSelect = (studentId: string) => {
    const student = students.find(s => s._id === studentId);
    setSelectedStudentId(studentId);
    setSelectedStudent(student);
  };

  // Add textbook to selection
  const addTextbook = (textbook: any) => {
    const existing = selectedTextbooks.find(t => t._id === textbook._id);
    if (existing) {
      if (existing.quantity < textbook.available) {
        setSelectedTextbooks(prev => 
          prev.map(t => 
            t._id === textbook._id 
              ? { ...t, quantity: t.quantity + 1 }
              : t
          )
        );
      }
    } else {
      setSelectedTextbooks(prev => [...prev, {
        _id: textbook._id,
        bookCode: textbook.bookCode,
        title: textbook.title,
        subject: textbook.subject,
        publisher: textbook.publisher,
        price: textbook.price,
        available: textbook.available,
        quantity: 1
      }]);
    }
  };

  // Remove textbook from selection
  const removeTextbook = (textbookId: string) => {
    setSelectedTextbooks(prev => prev.filter(t => t._id !== textbookId));
  };

  // Update textbook quantity
  const updateQuantity = (textbookId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeTextbook(textbookId);
      return;
    }

    setSelectedTextbooks(prev => 
      prev.map(t => {
        if (t._id === textbookId) {
          const maxQuantity = Math.min(newQuantity, t.available);
          return { ...t, quantity: maxQuantity };
        }
        return t;
      })
    );
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudentId || selectedTextbooks.length === 0) {
      return;
    }

    const indentData: CreateTextbookIndentData = {
      studentId: selectedStudentId,
      items: selectedTextbooks.map(book => ({
        textbookId: book._id,
        quantity: book.quantity
      })),
      paymentMethod,
      paidAmount: paidAmountNum,
      expectedReturnDate: expectedReturnDate || undefined,
      remarks: remarks || undefined
    };

    try {
      await createIndentMutation.mutateAsync(indentData);
      onSuccess?.();
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  // Set default expected return date (end of academic year)
  useEffect(() => {
    if (!expectedReturnDate) {
      const currentYear = new Date().getFullYear();
      const academicYearEnd = new Date(currentYear + 1, 2, 31); // March 31st next year
      setExpectedReturnDate(academicYearEnd.toISOString().split('T')[0]);
    }
  }, [expectedReturnDate]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Student Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Student Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="student">Select Student *</Label>
            <Select value={selectedStudentId} onValueChange={handleStudentSelect} required>
              <SelectTrigger>
                <SelectValue placeholder="Choose a student" />
              </SelectTrigger>
              <SelectContent>
                {students.map(student => (
                  <SelectItem key={student._id} value={student._id}>
                    {student.name} - {student.admissionNo} ({student.class})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedStudent && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <div className="font-medium">{selectedStudent.name}</div>
                </div>
                <div>
                  <span className="text-gray-600">Class:</span>
                  <div className="font-medium">{selectedStudent.class}</div>
                </div>
                <div>
                  <span className="text-gray-600">Admission No:</span>
                  <div className="font-medium">{selectedStudent.admissionNo}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Textbook Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Textbook Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Textbooks */}
          <div>
            <Label htmlFor="textbook-search">Search Textbooks</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="textbook-search"
                placeholder="Search by title, book code, or subject..."
                value={textbookSearch}
                onChange={(e) => setTextbookSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Available Textbooks */}
          {textbookSearch && (
            <div className="max-h-60 overflow-y-auto border rounded-lg">
              {textbooks.filter(book => book.available > 0).map(textbook => (
                <div key={textbook._id} className="p-3 border-b last:border-b-0 hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-medium">{textbook.title}</div>
                      <div className="text-sm text-gray-600">
                        {textbook.bookCode} • {textbook.subject} • ₹{textbook.price}
                      </div>
                      <div className="text-xs text-gray-500">
                        Available: {textbook.available} • Publisher: {textbook.publisher}
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addTextbook(textbook)}
                      disabled={selectedTextbooks.some(t => t._id === textbook._id && t.quantity >= textbook.available)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Selected Textbooks */}
          {selectedTextbooks.length > 0 && (
            <div>
              <Label>Selected Textbooks ({selectedTextbooks.length})</Label>
              <div className="space-y-2 mt-2">
                {selectedTextbooks.map(book => (
                  <div key={book._id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                    <div className="flex-1">
                      <div className="font-medium">{book.title}</div>
                      <div className="text-sm text-gray-600">
                        {book.bookCode} • {book.subject} • ₹{book.price} each
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(book._id, book.quantity - 1)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{book.quantity}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(book._id, book.quantity + 1)}
                        disabled={book.quantity >= book.available}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => removeTextbook(book._id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment-method">Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="online">Online Payment</SelectItem>
                  <SelectItem value="adjustment">Fee Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="paid-amount">Paid Amount</Label>
              <Input
                id="paid-amount"
                type="number"
                step="0.01"
                min="0"
                max={totalAmount}
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="expected-return">Expected Return Date</Label>
            <Input
              id="expected-return"
              type="date"
              value={expectedReturnDate}
              onChange={(e) => setExpectedReturnDate(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
            />
          </div>

          {/* Amount Summary */}
          {selectedTextbooks.length > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-3">Amount Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-medium">₹{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid Amount:</span>
                  <span className="font-medium text-green-600">₹{paidAmountNum.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Balance Amount:</span>
                  <span className={balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}>
                    ₹{balanceAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!selectedStudentId || selectedTextbooks.length === 0 || createIndentMutation.isPending}
        >
          {createIndentMutation.isPending && (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          )}
          Create Indent
        </Button>
      </div>
    </form>
  );
};