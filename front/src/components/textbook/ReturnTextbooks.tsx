import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  RotateCcw,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useReturnTextbooks } from '@/hooks/useTextbookIndents';
import { TextbookIndent, ReturnTextbookData } from '@/types/textbookIndent';

interface ReturnTextbooksProps {
  indent: TextbookIndent;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface ReturnItem {
  itemId: string;
  title: string;
  bookCode: string;
  issuedQuantity: number;
  returnedQuantity: number;
  returningQuantity: number;
  condition: 'good' | 'fair' | 'poor' | 'damaged' | 'lost';
  remarks: string;
}

export const ReturnTextbooks = ({ indent, onSuccess, onCancel }: ReturnTextbooksProps) => {
  const [returnItems, setReturnItems] = useState<ReturnItem[]>(
    indent.items
      .filter(item => item.quantity > item.returnedQuantity)
      .map(item => ({
        itemId: item._id,
        title: item.title,
        bookCode: item.bookCode,
        issuedQuantity: item.quantity,
        returnedQuantity: item.returnedQuantity,
        returningQuantity: item.quantity - item.returnedQuantity,
        condition: 'good' as const,
        remarks: ''
      }))
  );

  const returnTextbooksMutation = useReturnTextbooks();

  const updateReturnItem = (itemId: string, field: keyof ReturnItem, value: any) => {
    setReturnItems(prev => 
      prev.map(item => 
        item.itemId === itemId 
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const returningItems = returnItems.filter(item => item.returningQuantity > 0);
    
    if (returningItems.length === 0) {
      return;
    }

    const returnData: ReturnTextbookData = {
      items: returningItems.map(item => ({
        itemId: item.itemId,
        returnedQuantity: item.returningQuantity,
        condition: item.condition,
        remarks: item.remarks || undefined
      }))
    };

    try {
      await returnTextbooksMutation.mutateAsync({ id: indent._id, data: returnData });
      onSuccess?.();
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const getConditionBadge = (condition: string) => {
    const conditionConfig = {
      good: { variant: 'secondary' as const, label: 'Good' },
      fair: { variant: 'outline' as const, label: 'Fair' },
      poor: { variant: 'outline' as const, label: 'Poor' },
      damaged: { variant: 'destructive' as const, label: 'Damaged' },
      lost: { variant: 'destructive' as const, label: 'Lost' },
    };

    const config = conditionConfig[condition as keyof typeof conditionConfig];
    return config ? <Badge variant={config.variant}>{config.label}</Badge> : null;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Indent Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5" />
            Return Textbooks - {indent.indentNo}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Student:</span>
              <div className="font-medium">{indent.studentName}</div>
              <div className="text-xs text-gray-500">{indent.admissionNo}</div>
            </div>
            <div>
              <span className="text-gray-600">Class:</span>
              <div className="font-medium">{indent.class}</div>
            </div>
            <div>
              <span className="text-gray-600">Issue Date:</span>
              <div className="font-medium">{new Date(indent.issueDate).toLocaleDateString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Return Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Books to Return
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {returnItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4" />
              <p>All books have been returned for this indent.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {returnItems.map((item, index) => (
                <div key={item.itemId} className="p-4 border rounded-lg space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.bookCode}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span>Issued: <strong>{item.issuedQuantity}</strong></span>
                        <span>Returned: <strong>{item.returnedQuantity}</strong></span>
                        <span>Pending: <strong>{item.issuedQuantity - item.returnedQuantity}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`quantity-${index}`}>Returning Quantity</Label>
                      <Input
                        id={`quantity-${index}`}
                        type="number"
                        min="0"
                        max={item.issuedQuantity - item.returnedQuantity}
                        value={item.returningQuantity}
                        onChange={(e) => updateReturnItem(item.itemId, 'returningQuantity', parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`condition-${index}`}>Condition</Label>
                      <Select 
                        value={item.condition} 
                        onValueChange={(value: any) => updateReturnItem(item.itemId, 'condition', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                          <SelectItem value="damaged">Damaged</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      {getConditionBadge(item.condition)}
                    </div>
                  </div>

                  {(item.condition === 'damaged' || item.condition === 'lost' || item.condition === 'poor') && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                          <p className="font-medium">Additional charges may apply</p>
                          <p>Books in {item.condition} condition may incur replacement or repair costs.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor={`remarks-${index}`}>Remarks</Label>
                    <Textarea
                      id={`remarks-${index}`}
                      value={item.remarks}
                      onChange={(e) => updateReturnItem(item.itemId, 'remarks', e.target.value)}
                      placeholder="Any additional notes about the book condition..."
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {returnItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Return Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Books:</span>
                <div className="font-medium">{returnItems.reduce((sum, item) => sum + item.returningQuantity, 0)}</div>
              </div>
              <div>
                <span className="text-gray-600">Good Condition:</span>
                <div className="font-medium text-green-600">
                  {returnItems.filter(item => item.condition === 'good' && item.returningQuantity > 0).length}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Damaged/Lost:</span>
                <div className="font-medium text-red-600">
                  {returnItems.filter(item => ['damaged', 'lost'].includes(item.condition) && item.returningQuantity > 0).length}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Fair/Poor:</span>
                <div className="font-medium text-yellow-600">
                  {returnItems.filter(item => ['fair', 'poor'].includes(item.condition) && item.returningQuantity > 0).length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={returnItems.length === 0 || returnItems.every(item => item.returningQuantity === 0) || returnTextbooksMutation.isPending}
        >
          {returnTextbooksMutation.isPending && (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          )}
          Process Return
        </Button>
      </div>
    </form>
  );
};