import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowLeft, ArrowRight, CircleOff, Clock3, Download, Loader2, MoreHorizontal, Pencil, Plus, Receipt, Search, User, Users, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCancelFeePayment, useCreateBulkFeePayment, useCreateFeePayment, useFeePayments, useFeeStats, usePaidStudentIds, useUpdateFeePayment } from '@/hooks/useFees';
import { useStudents } from '@/hooks/useStudents';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchContext } from '@/contexts/BranchContext';
import { useBranch, useBranches } from '@/hooks/useBranches';
import { useClasses } from '@/hooks/useClasses';
import { useDivisionsByClass } from '@/hooks/useDivisions';
import { useCurrentOrganization, useOrganization } from '@/hooks/useOrganizations';
import feeStructureService, { FeeStructure } from '@/services/feeStructureService';
import { academicYearApi, AcademicYear } from '@/services/academicYearService';
import type { FeePayment as HistoryPayment } from '@/types';
import { cn } from '@/lib/utils';
import { formatters } from '@/utils/exportUtils';
import { downloadReceipt } from '@/utils/receiptGenerator';
import { receiptService } from '@/services/receiptService';

// ─── Constants ───────────────────────────────────────────────────────────────

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const RECENT_STUDENTS_STORAGE_KEY = 'fees_recent_students';
const MAX_RECENT_STUDENTS = 8;

type PaymentMethod = 'cash' | 'bank' | 'online';
type StudentPreset = 'all' | 'unpaid';
type QuickCollectStep = 'student' | 'fees' | 'payment';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const roundCurrency = (amount: number) => Number(amount.toFixed(3));

const toDateInputValue = (value: string | Date) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getPaymentStatusClasses = (status: HistoryPayment['status']) => {
  switch (status) {
    case 'paid':
      return 'border-green-200 bg-green-50 text-green-700';
    case 'partial':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'pending':
      return 'border-slate-200 bg-slate-50 text-slate-700';
    case 'cancelled':
      return 'border-red-200 bg-red-50 text-red-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
};

const getHistoryPaymentId = (payment: HistoryPayment) => payment._id || payment.id;

const describePaymentEditChanges = (edit: NonNullable<HistoryPayment['editHistory']>[number]) => {
  const changes: string[] = [];

  if (edit.previousValues.paymentMethod !== edit.newValues.paymentMethod) {
    changes.push(`Method: ${formatters.capitalize(edit.previousValues.paymentMethod)} -> ${formatters.capitalize(edit.newValues.paymentMethod)}`);
  }

  if (toDateInputValue(edit.previousValues.paymentDate) !== toDateInputValue(edit.newValues.paymentDate)) {
    changes.push(`Date: ${new Date(edit.previousValues.paymentDate).toLocaleDateString()} -> ${new Date(edit.newValues.paymentDate).toLocaleDateString()}`);
  }

  if ((edit.previousValues.academicYear || '') !== (edit.newValues.academicYear || '')) {
    changes.push(`Year: ${edit.previousValues.academicYear || '-'} -> ${edit.newValues.academicYear || '-'}`);
  }

  if ((edit.previousValues.feeMonth || '') !== (edit.newValues.feeMonth || '')) {
    changes.push(`Month: ${edit.previousValues.feeMonth || '-'} -> ${edit.newValues.feeMonth || '-'}`);
  }

  if ((edit.previousValues.remarks || '') !== (edit.newValues.remarks || '')) {
    changes.push('Remarks updated');
  }

  return changes;
};

const getFeeTypeKey = (fee: FeeStructure) => {
  const rawValue = fee.feeType || fee.feeTypeName || '';
  return rawValue.trim().toLowerCase().replace(/\s+/g, '_');
};

const isTransportFee = (fee: FeeStructure) => {
  const feeTypeKey = getFeeTypeKey(fee);
  return feeTypeKey === 'transport' || feeTypeKey.includes('transport');
};

const getStudentClassLabel = (student: StudentOption) => (
  student.section ? `${student.class} - ${student.section}` : student.class
);

const getDiscountedFeeAmount = (fee: FeeStructure, isStaffChild?: boolean) => {
  if (isStaffChild && fee.staffDiscountPercent && fee.staffDiscountPercent > 0) {
    return roundCurrency(fee.amount - (fee.amount * fee.staffDiscountPercent / 100));
  }
  return roundCurrency(fee.amount);
};

const groupFeesByType = (fees: FeeStructure[]) =>
  fees.reduce((groups, fee) => {
    (groups[fee.feeTypeName] ??= []).push(fee);
    return groups;
  }, {} as Record<string, FeeStructure[]>);

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface StudentOption {
  _id: string;
  name: string;
  admissionNo: string;
  class: string;
  classId?: string;
  branchId?: string;
  section?: string;
  isStaffChild?: boolean;
}

interface FeeItemPayload {
  feeStructureId: string;
  title: string;
  feeType: string;
  amount: number;
  transportDistanceGroup?: string;
}

const toStudentOption = (student: any): StudentOption => ({
  _id: student._id || student.id,
  name: student.name,
  admissionNo: student.admissionNo,
  class: student.class || student.className || '',
  classId: student.classId,
  branchId: student.branchId,
  section: student.section,
  isStaffChild: student.isStaffChild,
});

const getStoredRecentStudents = (): StudentOption[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(RECENT_STUDENTS_STORAGE_KEY);
    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
};

const buildRecentStudents = (existingStudents: StudentOption[], incomingStudents: StudentOption[]) => {
  const mergedStudents = [...incomingStudents, ...existingStudents].filter((student) => Boolean(student?._id));
  const uniqueStudents = mergedStudents.filter((student, index, list) => (
    list.findIndex((item) => item._id === student._id) === index
  ));

  return uniqueStudents.slice(0, MAX_RECENT_STUDENTS);
};

// ═════════════════════════════════════════════════════════════════════════════
//  FeeItemSelector — reusable card to pick fees for ONE student
// ═════════════════════════════════════════════════════════════════════════════

function FeeItemSelector({
  fees,
  student,
  selectedFeeIds,
  transportGroups,
  formatAmount,
  onToggleFee,
  onDistanceGroupChange,
  onSelectRegular,
  onClearAll,
  isLoading,
}: {
  fees: FeeStructure[];
  student: StudentOption;
  selectedFeeIds: string[];
  transportGroups: Record<string, string>;
  formatAmount: (amount: number) => string;
  onToggleFee: (feeId: string) => void;
  onDistanceGroupChange: (feeId: string, group: string) => void;
  onSelectRegular: () => void;
  onClearAll: () => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading fee structures...</span>
      </div>
    );
  }

  if (fees.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        No fee structures configured for this class yet.
      </p>
    );
  }

  const grouped = groupFeesByType(fees);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={onSelectRegular}>
          Select all regular fees
        </Button>
        {selectedFeeIds.length > 0 && (
          <Button type="button" size="sm" variant="ghost" onClick={onClearAll}>
            Clear all
          </Button>
        )}
      </div>

      {Object.entries(grouped).map(([typeName, typeFees]) => {
        const isTransport = !!typeFees[0] && isTransportFee(typeFees[0]);
        const controlId = typeFees[0]?._id;

        return (
          <div key={typeName} className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{typeName}</h4>

            {isTransport && controlId ? (
              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={`t-${student._id}-${controlId}`}
                    checked={selectedFeeIds.includes(controlId)}
                    onCheckedChange={() => onToggleFee(controlId)}
                  />
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`t-${student._id}-${controlId}`} className="font-medium">
                      {typeFees[0].title}
                    </Label>
                    {selectedFeeIds.includes(controlId) && (
                      <Select
                        value={transportGroups[controlId] || ''}
                        onValueChange={(v) => onDistanceGroupChange(controlId, v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select distance range" />
                        </SelectTrigger>
                        <SelectContent>
                          {typeFees.map((fee) => {
                            const val = fee.transportDistanceGroup || fee._id;
                            const disc = getDiscountedFeeAmount(fee, student.isStaffChild);
                            const hasDisc = disc !== roundCurrency(fee.amount);
                            return (
                              <SelectItem key={fee._id} value={val}>
                                {fee.distanceRange || fee.transportDistanceGroup || 'Range'} -{' '}
                                {hasDisc
                                  ? `${formatAmount(fee.amount)} > ${formatAmount(disc)}`
                                  : formatAmount(disc)}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {typeFees.map((fee) => {
                  const disc = getDiscountedFeeAmount(fee, student.isStaffChild);
                  const hasDisc = disc !== roundCurrency(fee.amount);
                  return (
                    <label
                      key={fee._id}
                      htmlFor={`f-${student._id}-${fee._id}`}
                      className={cn(
                        'flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                        selectedFeeIds.includes(fee._id) ? 'border-primary bg-primary/5' : 'hover:bg-muted/40',
                      )}
                    >
                      <Checkbox
                        id={`f-${student._id}-${fee._id}`}
                        checked={selectedFeeIds.includes(fee._id)}
                        onCheckedChange={() => onToggleFee(fee._id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">{fee.title}</p>
                        <div className="mt-1 text-sm">
                          {hasDisc ? (
                            <>
                              <span className="text-muted-foreground line-through">{formatAmount(fee.amount)}</span>
                              <span className="ml-1.5 font-semibold text-green-600">{formatAmount(disc)}</span>
                            </>
                          ) : (
                            <span className="font-semibold">{formatAmount(disc)}</span>
                          )}
                        </div>
                        {hasDisc && (
                          <p className="mt-0.5 text-xs text-green-600">{fee.staffDiscountPercent}% staff discount</p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  Main page
// ═════════════════════════════════════════════════════════════════════════════

const Fees = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { branches: contextBranches, selectedBranchId: contextSelectedBranchId, switchBranch } = useBranchContext();
  const [platformSelectedBranchId, setPlatformSelectedBranchId] = useState('all');

  // Branch resolution
  const { data: branchesResponse } = useBranches();
  const platformBranches = branchesResponse?.data || [];
  const branches = user?.role === 'org_admin' ? contextBranches : platformBranches;
  const selectedBranchId = user?.role === 'org_admin'
    ? (contextSelectedBranchId || 'all')
    : platformSelectedBranchId;
  const effectiveBranchId = selectedBranchId !== 'all' ? selectedBranchId : undefined;
  const { data: selectedBranchResponse } = useBranch(effectiveBranchId || '');
  const selectedBranch = selectedBranchResponse?.data;
  const { data: currentOrganizationResponse } = useCurrentOrganization(user?.role !== 'platform_admin');
  const { data: selectedOrganizationResponse } = useOrganization(
    user?.role === 'platform_admin' ? (selectedBranch?.organizationId || '') : ''
  );
  const feeCurrencyCode =
    selectedBranch?.currency ||
    selectedOrganizationResponse?.data?.currency ||
    currentOrganizationResponse?.data?.currency ||
    'BHD';
  const feeCurrencySymbol =
    selectedBranch?.currencySymbol ||
    selectedOrganizationResponse?.data?.currencySymbol ||
    currentOrganizationResponse?.data?.currencySymbol ||
    feeCurrencyCode;
  const formatFeeAmount = (amount: number | string | undefined | null) => `${feeCurrencySymbol} ${Number(amount || 0).toFixed(3)}`;

  // Academic years
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  useEffect(() => {
    const load = async () => {
      try {
        const params: Record<string, any> = { status: 'active', limit: 50 };
        if (effectiveBranchId) params.branchId = effectiveBranchId;
        const res = await academicYearApi.getAll(params);
        setAcademicYears(res.data || []);
      } catch {
        setAcademicYears([]);
      }
    };
    load();
  }, [effectiveBranchId]);

  const currentAcademicYear = academicYears.find((y) => y.isCurrent);
  const defaultAcademicYear = currentAcademicYear?.name || '';
  const defaultMonth = MONTHS[new Date().getMonth()];

  // Classes
  const { data: classesResponse } = useClasses({ status: 'active', limit: 100, branchId: effectiveBranchId });
  const classes = classesResponse?.data || [];

  // Page tab
  const [activeTab, setActiveTab] = useState<string>('quick');
  const [isQuickPickerOpen, setIsQuickPickerOpen] = useState(false);
  const [isBulkPickerOpen, setIsBulkPickerOpen] = useState(false);
  const [quickStep, setQuickStep] = useState<QuickCollectStep>('student');
  const [recentStudents, setRecentStudents] = useState<StudentOption[]>([]);
  const [qPreset, setQPreset] = useState<StudentPreset>('all');
  const [bPreset, setBPreset] = useState<StudentPreset>('all');

  useEffect(() => {
    setRecentStudents(getStoredRecentStudents());
  }, []);

  const rememberRecentStudents = (studentsToRemember: StudentOption[]) => {
    const nextRecentStudents = buildRecentStudents(recentStudents, studentsToRemember);
    setRecentStudents(nextRecentStudents);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(RECENT_STUDENTS_STORAGE_KEY, JSON.stringify(nextRecentStudents));
    }
  };

  const scopedRecentStudents = useMemo(() => (
    recentStudents.filter((student) => !effectiveBranchId || !student.branchId || student.branchId === effectiveBranchId)
  ), [recentStudents, effectiveBranchId]);

  // ═══════════════════════════════════════════════════════════════════════════
  //  Quick Collect state
  // ═══════════════════════════════════════════════════════════════════════════

  const [qClassId, setQClassId] = useState('all');
  const [qStudentSearch, setQStudentSearch] = useState('');
  const [qSelectedStudent, setQSelectedStudent] = useState<StudentOption | null>(null);
  const [qFees, setQFees] = useState<FeeStructure[]>([]);
  const [qFeesLoading, setQFeesLoading] = useState(false);
  const [qSelectedFeeIds, setQSelectedFeeIds] = useState<string[]>([]);
  const [qTransportGroups, setQTransportGroups] = useState<Record<string, string>>({});
  const [qPaymentMethod, setQPaymentMethod] = useState<PaymentMethod>('cash');
  const [qAcademicYear, setQAcademicYear] = useState('');
  const [qFeeMonth, setQFeeMonth] = useState('');
  const [qRemarks, setQRemarks] = useState('');

  // Set defaults when academic years load
  useEffect(() => {
    if (defaultAcademicYear && !qAcademicYear) setQAcademicYear(defaultAcademicYear);
    if (defaultMonth && !qFeeMonth) setQFeeMonth(defaultMonth);
  }, [defaultAcademicYear, defaultMonth]);

  const qSelectedClassId = qClassId !== 'all' ? qClassId : '';
  const { data: qDivisionsResponse } = useDivisionsByClass(qSelectedClassId);
  const qDivisions = qDivisionsResponse?.data || [];
  const [qDivisionName, setQDivisionName] = useState('all');

  // Reset division when class changes
  useEffect(() => { setQDivisionName('all'); }, [qClassId]);

  const { data: qStudentsResponse, isLoading: qStudentsLoading } = useStudents({
    limit: 0,
    search: qStudentSearch.trim() || undefined,
    branchId: effectiveBranchId,
    classId: qSelectedClassId || undefined,
    section: qDivisionName !== 'all' ? qDivisionName : undefined,
    status: 'active',
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const qStudents = (qStudentsResponse?.data || []).map(toStudentOption);
  const { data: qPaidStudentsResponse, isLoading: qPaidStudentsLoading } = usePaidStudentIds({
    academicYear: qAcademicYear || defaultAcademicYear || undefined,
    feeMonth: qFeeMonth || defaultMonth || undefined,
    classId: qSelectedClassId || undefined,
    branchId: effectiveBranchId,
  });
  const qPaidStudentIds = useMemo(() => new Set((qPaidStudentsResponse?.data || []).map(String)), [qPaidStudentsResponse?.data]);
  const qVisibleStudents = useMemo(() => (
    qStudents.filter((student) => qPreset !== 'unpaid' || !qPaidStudentIds.has(student._id))
  ), [qStudents, qPreset, qPaidStudentIds]);
  const qRecentShortcutStudents = useMemo(() => (
    scopedRecentStudents.filter((student) => !qSelectedClassId || student.classId === qSelectedClassId)
  ), [scopedRecentStudents, qSelectedClassId]);

  // Auto-load fees when student is selected
  useEffect(() => {
    if (!qSelectedStudent?.classId) {
      setQFees([]);
      setQSelectedFeeIds([]);
      setQTransportGroups({});
      return;
    }
    let cancelled = false;
    const load = async () => {
      setQFeesLoading(true);
      try {
        const res = await feeStructureService.getFeeStructuresByClass(
          qSelectedStudent.classId!,
          undefined,
          effectiveBranchId,
        );
        if (!cancelled) {
          setQFees(res.success ? (res.data.feeStructures || []) : []);
        }
      } catch {
        if (!cancelled) setQFees([]);
      } finally {
        if (!cancelled) setQFeesLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [qSelectedStudent?._id, qSelectedStudent?.classId, effectiveBranchId]);

  const qTotal = useMemo(() => {
    return qSelectedFeeIds.reduce((sum, feeId) => {
      const fee = qFees.find((f) => f._id === feeId);
      if (!fee) return sum;
      if (isTransportFee(fee)) {
        const group = qTransportGroups[feeId];
        const tFee = qFees.find((f) => isTransportFee(f) && (f.transportDistanceGroup || f._id) === group);
        return sum + (tFee ? getDiscountedFeeAmount(tFee, qSelectedStudent?.isStaffChild) : 0);
      }
      return sum + getDiscountedFeeAmount(fee, qSelectedStudent?.isStaffChild);
    }, 0);
  }, [qSelectedFeeIds, qTransportGroups, qFees, qSelectedStudent]);

  const createPaymentMutation = useCreateFeePayment();
  const createBulkPaymentMutation = useCreateBulkFeePayment();
  const updatePaymentMutation = useUpdateFeePayment();
  const cancelPaymentMutation = useCancelFeePayment();

  const buildFeeItems = (
    fees: FeeStructure[],
    selectedIds: string[],
    transportGroups: Record<string, string>,
    isStaffChild?: boolean,
  ): { items: FeeItemPayload[]; error?: string } => {
    const items: FeeItemPayload[] = [];
    for (const feeId of selectedIds) {
      const fee = fees.find((f) => f._id === feeId);
      if (!fee) continue;
      if (isTransportFee(fee)) {
        const group = transportGroups[feeId];
        if (!group) return { items: [], error: 'Select a transport distance range' };
        const tFee = fees.find((f) => isTransportFee(f) && (f.transportDistanceGroup || f._id) === group);
        if (!tFee) return { items: [], error: 'Selected transport slab not available' };
        items.push({
          feeStructureId: tFee._id,
          title: tFee.title,
          feeType: getFeeTypeKey(tFee),
          amount: getDiscountedFeeAmount(tFee, isStaffChild),
          transportDistanceGroup: tFee.transportDistanceGroup,
        });
      } else {
        items.push({
          feeStructureId: fee._id,
          title: fee.title,
          feeType: getFeeTypeKey(fee),
          amount: getDiscountedFeeAmount(fee, isStaffChild),
        });
      }
    }
    return { items };
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qSelectedStudent) {
      toast({ title: 'Error', description: 'Select a student first', variant: 'destructive' });
      return;
    }
    if (qSelectedFeeIds.length === 0) {
      toast({ title: 'Error', description: 'Select at least one fee item', variant: 'destructive' });
      return;
    }
    const { items, error } = buildFeeItems(qFees, qSelectedFeeIds, qTransportGroups, qSelectedStudent.isStaffChild);
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
      return;
    }
    try {
      await createPaymentMutation.mutateAsync({
        studentId: qSelectedStudent._id,
        feeItems: items,
        paymentMethod: qPaymentMethod,
        remarks: qRemarks.trim() || undefined,
        academicYear: qAcademicYear || undefined,
        feeMonth: qFeeMonth || undefined,
      });
      rememberRecentStudents([qSelectedStudent]);
      prepareNextQuickCollection();
    } catch {
      // handled by mutation hook
    }
  };

  const handleSelectStudent = (student: StudentOption) => {
    setQSelectedStudent(student);
    setQSelectedFeeIds([]);
    setQTransportGroups({});
  };

  const resetQuickFlow = () => {
    setQuickStep('student');
    setQSelectedStudent(null);
    setQSelectedFeeIds([]);
    setQTransportGroups({});
    setQRemarks('');
    setQStudentSearch('');
    setQClassId('all');
    setQDivisionName('all');
    setQPreset('all');
  };

  const prepareNextQuickCollection = () => {
    setQuickStep('student');
    setQSelectedStudent(null);
    setQSelectedFeeIds([]);
    setQTransportGroups({});
    setQRemarks('');
    setQStudentSearch('');
  };

  const hasQuickDraft = Boolean(qSelectedStudent || qSelectedFeeIds.length > 0 || qRemarks.trim());

  const handleQSelectRegular = () => {
    const regularIds = qFees.filter((f) => !isTransportFee(f)).map((f) => f._id);
    const transportIds = qSelectedFeeIds.filter((id) => {
      const f = qFees.find((x) => x._id === id);
      return f ? isTransportFee(f) : false;
    });
    setQSelectedFeeIds([...new Set([...regularIds, ...transportIds])]);
  };

  const openQuickWizard = (step: QuickCollectStep = 'student') => {
    setQuickStep(step);
    setIsQuickPickerOpen(true);
  };

  const moveQuickWizardToPayment = () => {
    if (!qSelectedStudent) {
      return;
    }

    const { error } = buildFeeItems(qFees, qSelectedFeeIds, qTransportGroups, qSelectedStudent.isStaffChild);
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
      return;
    }

    if (qSelectedFeeIds.length === 0) {
      toast({ title: 'Error', description: 'Select at least one fee item', variant: 'destructive' });
      return;
    }

    setQuickStep('payment');
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  Bulk Collect state
  // ═══════════════════════════════════════════════════════════════════════════

  const [bClassId, setBClassId] = useState('all');
  const [bDivisionName, setBDivisionName] = useState('all');
  const [bStudentSearch, setBStudentSearch] = useState('');
  const [bPaymentMethod, setBPaymentMethod] = useState<PaymentMethod>('cash');
  const [bAcademicYear, setBAcademicYear] = useState('');
  const [bFeeMonth, setBFeeMonth] = useState('');
  const [bRemarks, setBRemarks] = useState('');

  interface BulkStudentEntry {
    student: StudentOption;
    selectedFeeIds: string[];
    transportGroups: Record<string, string>;
  }
  const [bSelections, setBSelections] = useState<BulkStudentEntry[]>([]);
  const [bFeeCache, setBFeeCache] = useState<Record<string, FeeStructure[]>>({});
  const [bLoadingClasses, setBLoadingClasses] = useState<string[]>([]);

  useEffect(() => {
    if (defaultAcademicYear && !bAcademicYear) setBAcademicYear(defaultAcademicYear);
    if (defaultMonth && !bFeeMonth) setBFeeMonth(defaultMonth);
  }, [defaultAcademicYear, defaultMonth]);

  const bSelectedClassId = bClassId !== 'all' ? bClassId : '';
  const { data: bDivisionsResponse } = useDivisionsByClass(bSelectedClassId);
  const bDivisions = bDivisionsResponse?.data || [];
  useEffect(() => { setBDivisionName('all'); }, [bClassId]);

  const { data: bStudentsResponse, isLoading: bStudentsLoading } = useStudents({
    limit: 0,
    search: bStudentSearch.trim() || undefined,
    branchId: effectiveBranchId,
    classId: bSelectedClassId || undefined,
    section: bDivisionName !== 'all' ? bDivisionName : undefined,
    status: 'active',
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const bStudents = (bStudentsResponse?.data || []).map(toStudentOption);
  const bSelectedIds = new Set(bSelections.map((s) => s.student._id));
  const { data: bPaidStudentsResponse, isLoading: bPaidStudentsLoading } = usePaidStudentIds({
    academicYear: bAcademicYear || defaultAcademicYear || undefined,
    feeMonth: bFeeMonth || defaultMonth || undefined,
    classId: bSelectedClassId || undefined,
    branchId: effectiveBranchId,
  });
  const bPaidStudentIds = useMemo(() => new Set((bPaidStudentsResponse?.data || []).map(String)), [bPaidStudentsResponse?.data]);
  const bVisibleStudents = useMemo(() => (
    bStudents.filter((student) => bPreset !== 'unpaid' || !bPaidStudentIds.has(student._id))
  ), [bStudents, bPreset, bPaidStudentIds]);
  const bRecentShortcutStudents = useMemo(() => (
    scopedRecentStudents.filter((student) => !bSelectedClassId || student.classId === bSelectedClassId)
  ), [scopedRecentStudents, bSelectedClassId]);

  const loadBulkFees = async (classId?: string) => {
    if (!classId || bFeeCache[classId] || bLoadingClasses.includes(classId)) return;
    setBLoadingClasses((p) => [...p, classId]);
    try {
      const res = await feeStructureService.getFeeStructuresByClass(classId, undefined, effectiveBranchId);
      setBFeeCache((p) => ({ ...p, [classId]: res.success ? (res.data.feeStructures || []) : [] }));
    } catch {
      setBFeeCache((p) => ({ ...p, [classId]: [] }));
    } finally {
      setBLoadingClasses((p) => p.filter((x) => x !== classId));
    }
  };

  const handleBulkToggleStudent = async (student: StudentOption) => {
    if (bSelectedIds.has(student._id)) {
      setBSelections((p) => p.filter((s) => s.student._id !== student._id));
      return;
    }
    if (!student.classId) {
      toast({ title: 'Error', description: 'Student has no class assigned', variant: 'destructive' });
      return;
    }
    setBSelections((p) => [
      ...p,
      { student, selectedFeeIds: [], transportGroups: {} },
    ].sort((a, b) => a.student.name.localeCompare(b.student.name)));
    await loadBulkFees(student.classId);
  };

  const handleBulkSelectVisible = async () => {
    if (bVisibleStudents.length === 0) return;
    const allSelected = bVisibleStudents.every((s) => bSelectedIds.has(s._id));
    if (allSelected) {
      const visIds = new Set(bVisibleStudents.map((s) => s._id));
      setBSelections((p) => p.filter((s) => !visIds.has(s.student._id)));
      return;
    }
    const toAdd = bVisibleStudents.filter((s) => !bSelectedIds.has(s._id) && s.classId);
    setBSelections((p) => [
      ...p,
      ...toAdd.map((s) => ({ student: s, selectedFeeIds: [] as string[], transportGroups: {} as Record<string, string> })),
    ].sort((a, b) => a.student.name.localeCompare(b.student.name)));
    const classIds = [...new Set(toAdd.map((s) => s.classId).filter(Boolean))] as string[];
    await Promise.all(classIds.map(loadBulkFees));
  };

  const bGrandTotal = bSelections.reduce((sum, sel) => {
    const fees = sel.student.classId ? (bFeeCache[sel.student.classId] || []) : [];
    return sum + sel.selectedFeeIds.reduce((s, feeId) => {
      const fee = fees.find((f) => f._id === feeId);
      if (!fee) return s;
      if (isTransportFee(fee)) {
        const g = sel.transportGroups[feeId];
        const tf = fees.find((f) => isTransportFee(f) && (f.transportDistanceGroup || f._id) === g);
        return s + (tf ? getDiscountedFeeAmount(tf, sel.student.isStaffChild) : 0);
      }
      return s + getDiscountedFeeAmount(fee, sel.student.isStaffChild);
    }, 0);
  }, 0);

  const bConfiguredCount = bSelections.filter((s) => s.selectedFeeIds.length > 0).length;

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bSelections.length === 0) {
      toast({ title: 'Error', description: 'Select at least one student', variant: 'destructive' });
      return;
    }
    const paymentEntries: Array<{ studentId: string; feeItems: FeeItemPayload[] }> = [];
    for (const sel of bSelections) {
      if (sel.selectedFeeIds.length === 0) {
        toast({ title: 'Error', description: `Choose at least one fee for ${sel.student.name}`, variant: 'destructive' });
        return;
      }
      const fees = sel.student.classId ? (bFeeCache[sel.student.classId] || []) : [];
      const { items, error } = buildFeeItems(fees, sel.selectedFeeIds, sel.transportGroups, sel.student.isStaffChild);
      if (error) {
        toast({ title: 'Error', description: `${sel.student.name}: ${error}`, variant: 'destructive' });
        return;
      }
      paymentEntries.push({ studentId: sel.student._id, feeItems: items });
    }
    try {
      if (paymentEntries.length === 1) {
        await createPaymentMutation.mutateAsync({
          ...paymentEntries[0],
          paymentMethod: bPaymentMethod,
          remarks: bRemarks.trim() || undefined,
          academicYear: bAcademicYear || undefined,
          feeMonth: bFeeMonth || undefined,
        });
      } else {
        await createBulkPaymentMutation.mutateAsync({
          payments: paymentEntries,
          paymentMethod: bPaymentMethod,
          remarks: bRemarks.trim() || undefined,
          academicYear: bAcademicYear || undefined,
          feeMonth: bFeeMonth || undefined,
        });
      }
      rememberRecentStudents(bSelections.map((entry) => entry.student));
      setBSelections([]);
      setBFeeCache({});
      setBRemarks('');
      setBPreset('all');
    } catch {
      // handled by hooks
    }
  };

  // Reset bulk when branch changes
  useEffect(() => {
    setBSelections([]);
    setBFeeCache({});
    setBClassId('all');
  }, [selectedBranchId]);

  // ═══════════════════════════════════════════════════════════════════════════
  //  Payment History state
  // ═══════════════════════════════════════════════════════════════════════════

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [historyEditPayment, setHistoryEditPayment] = useState<HistoryPayment | null>(null);
  const [historyCancelPayment, setHistoryCancelPayment] = useState<HistoryPayment | null>(null);
  const [historyEditPaymentMethod, setHistoryEditPaymentMethod] = useState<PaymentMethod>('cash');
  const [historyEditPaymentDate, setHistoryEditPaymentDate] = useState('');
  const [historyEditAcademicYear, setHistoryEditAcademicYear] = useState('');
  const [historyEditFeeMonth, setHistoryEditFeeMonth] = useState('');
  const [historyEditRemarks, setHistoryEditRemarks] = useState('');
  const [historyEditReason, setHistoryEditReason] = useState('');
  const [historyCancelReason, setHistoryCancelReason] = useState('');

  const { data: paymentsResponse, isLoading, error } = useFeePayments({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    branchId: effectiveBranchId,
    feeType: filterValues.feeType || undefined,
    paymentMethod: filterValues.paymentMethod || undefined,
    status: filterValues.status || undefined,
    startDate: filterValues.paymentDate_from || undefined,
    endDate: filterValues.paymentDate_to || undefined,
    academicYear: filterValues.academicYear || undefined,
    feeMonth: filterValues.feeMonth || undefined,
  });
  const { data: statsResponse } = useFeeStats();

  useEffect(() => { setCurrentPage(1); }, [selectedBranchId]);

  const payments = (paymentsResponse?.data || []) as HistoryPayment[];

  const pagination = paymentsResponse?.pagination;
  const stats = statsResponse?.data;

  const handleDownloadReceipt = async (payment: HistoryPayment) => {
    try {
      const paymentId = getHistoryPaymentId(payment);
      if (!paymentId) {
        toast({ title: 'Error', description: 'Payment record not found', variant: 'destructive' });
        return;
      }

      const response = await receiptService.getReceiptData(paymentId);
      if (!response.success) {
        toast({ title: 'Error', description: 'Something went wrong while loading the receipt data. Please try again.', variant: 'destructive' });
        return;
      }
      await downloadReceipt(response.data);
      toast({ title: 'Success', description: 'Receipt downloaded successfully' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Something went wrong while downloading. Please try again receipt', variant: 'destructive' });
    }
  };

  const resetHistoryEditDialog = () => {
    setHistoryEditPayment(null);
    setHistoryEditPaymentMethod('cash');
    setHistoryEditPaymentDate('');
    setHistoryEditAcademicYear('');
    setHistoryEditFeeMonth('');
    setHistoryEditRemarks('');
    setHistoryEditReason('');
  };

  const openHistoryEditDialog = (payment: HistoryPayment) => {
    setHistoryEditPayment(payment);
    setHistoryEditPaymentMethod(payment.paymentMethod);
    setHistoryEditPaymentDate(toDateInputValue(payment.paymentDate));
    setHistoryEditAcademicYear(payment.academicYear || '');
    setHistoryEditFeeMonth(payment.feeMonth || '');
    setHistoryEditRemarks(payment.remarks || '');
    setHistoryEditReason('');
  };

  const handleHistoryEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!historyEditPayment) {
      return;
    }

    const paymentId = getHistoryPaymentId(historyEditPayment);
    if (!paymentId) {
      toast({ title: 'Error', description: 'Payment record not found', variant: 'destructive' });
      return;
    }

    if (!historyEditReason.trim()) {
      toast({ title: 'Error', description: 'Enter a reason for this edit', variant: 'destructive' });
      return;
    }

    try {
      await updatePaymentMutation.mutateAsync({
        paymentId,
        data: {
          paymentMethod: historyEditPaymentMethod,
          paymentDate: historyEditPaymentDate,
          academicYear: historyEditAcademicYear || undefined,
          feeMonth: historyEditFeeMonth || undefined,
          remarks: historyEditRemarks.trim() || undefined,
          reason: historyEditReason.trim(),
        },
      });
      resetHistoryEditDialog();
    } catch {
      // handled by mutation hook
    }
  };

  const resetHistoryCancelDialog = () => {
    setHistoryCancelPayment(null);
    setHistoryCancelReason('');
  };

  const handleHistoryCancelSubmit = async () => {
    if (!historyCancelPayment) {
      return;
    }

    const paymentId = getHistoryPaymentId(historyCancelPayment);
    if (!paymentId) {
      toast({ title: 'Error', description: 'Payment record not found', variant: 'destructive' });
      return;
    }

    if (!historyCancelReason.trim()) {
      toast({ title: 'Error', description: 'Enter a reason for cancellation', variant: 'destructive' });
      return;
    }

    try {
      await cancelPaymentMutation.mutateAsync({
        paymentId,
        data: {
          reason: historyCancelReason.trim(),
        },
      });
      resetHistoryCancelDialog();
    } catch {
      // handled by mutation hook
    }
  };

  const filterOptions = [
    {
      key: 'academicYear', label: 'Academic Year', type: 'select' as const,
      options: academicYears.map((y) => ({ value: y.name, label: y.name + (y.isCurrent ? ' (Current)' : '') })),
    },
    {
      key: 'feeMonth', label: 'Fee Month', type: 'select' as const,
      options: MONTHS.map((m) => ({ value: m, label: m })),
    },
    {
      key: 'feeType', label: 'Fee Type', type: 'select' as const,
      options: [
        { value: 'tuition', label: 'Tuition Fee' },
        { value: 'transport', label: 'Transport Fee' },
        { value: 'cocurricular', label: 'Co-curricular Fee' },
        { value: 'maintenance', label: 'Maintenance Fee' },
        { value: 'exam', label: 'Exam Fee' },
        { value: 'textbook', label: 'Text Book Charges' },
      ],
    },
    {
      key: 'paymentMethod', label: 'Payment Method', type: 'select' as const,
      options: [
        { value: 'cash', label: 'Cash' },
        { value: 'bank', label: 'Bank Transfer' },
        { value: 'online', label: 'Online Payment' },
      ],
    },
    {
      key: 'status', label: 'Status', type: 'select' as const,
      options: [
        { value: 'paid', label: 'Paid' },
        { value: 'partial', label: 'Partial' },
        { value: 'pending', label: 'Pending' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
    { key: 'paymentDate', label: 'Payment Date', type: 'dateRange' as const },
  ];

  const exportColumns = [
    { key: 'receiptNo', label: 'Receipt No' },
    { key: 'studentName', label: 'Student Name' },
    { key: 'class', label: 'Class', formatter: (_: any, row: any) => row.className || row.class },
    { key: 'academicYear', label: 'Academic Year' },
    { key: 'feeMonth', label: 'Fee Month' },
    {
      key: 'feeItems', label: 'Fee Details',
      formatter: (_: any, row: any) =>
        row.feeItems?.length > 0
          ? row.feeItems.map((i: any) => `${i.title}: ${formatFeeAmount(i.amount)}`).join(', ')
          : `${formatters.capitalize(row.feeType)}: ${formatFeeAmount(row.amount)}`,
    },
    { key: 'totalAmount', label: 'Total Amount', formatter: (_: any, row: any) => formatFeeAmount(row.totalAmount || row.amount) },
    { key: 'status', label: 'Status', formatter: formatters.capitalize },
    { key: 'paymentMethod', label: 'Payment Method', formatter: formatters.capitalize },
    { key: 'paymentDate', label: 'Payment Date', formatter: formatters.date },
    { key: 'remarks', label: 'Remarks' },
  ];

  const isSubmitting = createPaymentMutation.isPending || createBulkPaymentMutation.isPending;

  // ═══════════════════════════════════════════════════════════════════════════
  //  Render helpers
  // ═══════════════════════════════════════════════════════════════════════════

  const branchNameById = new Map(branches.map((b: any) => [b._id || b.id, b.name]));

  const renderBranchSelector = () => {
    if (!((user?.role === 'platform_admin' || user?.role === 'org_admin') && branches.length > 0)) return null;
    return (
      <Select
        value={selectedBranchId}
        onValueChange={(v) => {
          if (user?.role === 'org_admin') { switchBranch(v === 'all' ? null : v); return; }
          setPlatformSelectedBranchId(v);
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All Branches" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Branches</SelectItem>
          {branches.map((b: any) => (
            <SelectItem key={b._id || b.id} value={b._id || b.id}>{b.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const renderPaymentFields = (
    ay: string, setAy: (v: string) => void,
    fm: string, setFm: (v: string) => void,
    pm: PaymentMethod, setPm: (v: PaymentMethod) => void,
    rm: string, setRm: (v: string) => void,
  ) => (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Academic Year *</Label>
        <Select value={ay} onValueChange={setAy}>
          <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
          <SelectContent>
            {academicYears.map((y) => (
              <SelectItem key={y._id} value={y.name}>{y.name}{y.isCurrent ? ' (Current)' : ''}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Fee Month *</Label>
        <Select value={fm} onValueChange={setFm}>
          <SelectTrigger><SelectValue placeholder="Select month" /></SelectTrigger>
          <SelectContent>
            {MONTHS.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Payment Method *</Label>
        <Select value={pm} onValueChange={(v: PaymentMethod) => setPm(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="bank">Bank Transfer</SelectItem>
            <SelectItem value="online">Online Payment</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Remarks</Label>
        <Textarea rows={2} value={rm} onChange={(e) => setRm(e.target.value)} placeholder="Optional note" />
      </div>
    </div>
  );

  const renderClassDivisionFilter = (
    classId: string, setClassId: (v: string) => void,
    divName: string, setDivName: (v: string) => void,
    divs: any[],
    selClassId: string,
    compact = false,
  ) => (
    <div className={cn('grid gap-3 sm:grid-cols-2', compact && 'xl:w-[460px]')}>
      <div className={compact ? undefined : 'space-y-1.5'}>
        {!compact && <Label className="text-xs font-medium">Class</Label>}
        <Select value={classId} onValueChange={setClassId}>
          <SelectTrigger>
            <SelectValue placeholder="All classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {classes.map((c: any) => (
              <SelectItem key={c._id} value={c._id}>
                {selectedBranchId === 'all' && branchNameById.get(c.branchId)
                  ? `${c.name} - ${branchNameById.get(c.branchId)}`
                  : c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className={compact ? undefined : 'space-y-1.5'}>
        {!compact && <Label className="text-xs font-medium">Division</Label>}
        <Select value={divName} onValueChange={setDivName} disabled={!selClassId}>
          <SelectTrigger>
            <SelectValue placeholder="All divisions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All divisions</SelectItem>
            {divs.map((d: any) => (
              <SelectItem key={d._id} value={d.name}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderStudentList = (
    studentList: StudentOption[],
    loading: boolean,
    selectedSet: Set<string>,
    onToggle: (s: StudentOption) => void,
    searchValue: string,
    setSearch: (v: string) => void,
    highlightSelected?: string | null,
    options?: {
      hideSearch?: boolean;
      listClassName?: string;
      wrapperClassName?: string;
    },
  ) => (
    <div className={cn('space-y-3', options?.wrapperClassName)}>
      {!options?.hideSearch && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            placeholder="Search name or admission no"
          />
        </div>
      )}
      <ScrollArea className={cn('h-[420px] rounded-lg border', options?.listClassName)}>
        <div className="divide-y">
          {loading ? (
            <div className="flex h-[200px] items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : studentList.length === 0 ? (
            <div className="flex h-[200px] flex-col items-center justify-center gap-2 px-4 text-center">
              <Users className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No students found. Select a class or search.</p>
            </div>
          ) : (
            studentList.map((student) => {
              const isSelected = selectedSet.has(student._id);
              const isHighlighted = highlightSelected === student._id;
              return (
                <button
                  key={student._id}
                  type="button"
                  onClick={() => onToggle(student)}
                  className={cn(
                    'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
                    isHighlighted ? 'bg-primary/10 border-l-2 border-primary' :
                    isSelected ? 'bg-primary/5' : 'hover:bg-muted/40',
                  )}
                >
                  {highlightSelected === undefined && (
                    <Checkbox checked={isSelected} className="pointer-events-none" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{student.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {student.admissionNo} - {student.section ? `${student.class} - ${student.section}` : student.class}
                    </p>
                  </div>
                  {isHighlighted && (
                    <Badge variant="secondary" className="text-xs">Selected</Badge>
                  )}
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  //  Main Render
  // ═══════════════════════════════════════════════════════════════════════════

  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-4">Failed to load fee payments</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Fee Management</h1>
            <p className="text-muted-foreground mt-1">Collect and manage student fees</p>
          </div>
          {renderBranchSelector()}
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Collected</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatFeeAmount(stats?.totalCollection?.total || 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats?.totalCollection?.count || 0} payments</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Monthly Collection</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatFeeAmount(stats?.monthlyCollection?.total || 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats?.monthlyCollection?.count || 0} this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Today's Collection</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatFeeAmount(stats?.dailyCollection?.total || 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats?.dailyCollection?.count || 0} today</p>
            </CardContent>
          </Card>
        </div>

        {/* Main content with tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid h-11 w-full max-w-md grid-cols-3 rounded-xl">
            <TabsTrigger value="quick" className="gap-2">
              <Zap className="h-4 w-4" />
              Quick Collect
            </TabsTrigger>
            <TabsTrigger value="bulk" className="gap-2">
              <Users className="h-4 w-4" />
              Bulk Collect
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Receipt className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <Dialog open={isQuickPickerOpen} onOpenChange={(open) => {
            setIsQuickPickerOpen(open);
            if (!open) {
              setQuickStep('student');
            }
          }}>
            <DialogContent className="max-w-5xl overflow-hidden p-0 sm:h-[88vh]">
              <form onSubmit={handleQuickSubmit} className="flex h-full min-h-0 flex-col">
                <DialogHeader className="border-b px-5 py-4">
                  <DialogTitle>Quick Collect</DialogTitle>
                  <DialogDescription>
                    Select student, choose fees, then confirm payment details in three clear steps.
                  </DialogDescription>
                </DialogHeader>

                <div className="border-b px-5 py-3">
                  <div className="grid gap-2 sm:grid-cols-3">
                    {[
                      { key: 'student', label: '1. Student' },
                      { key: 'fees', label: '2. Fees' },
                      { key: 'payment', label: '3. Payment' },
                    ].map((step) => {
                      const isActive = quickStep === step.key;
                      const isCompleted =
                        (step.key === 'student' && qSelectedStudent) ||
                        (step.key === 'fees' && qSelectedFeeIds.length > 0) ||
                        (step.key === 'payment' && quickStep === 'payment');

                      return (
                        <div
                          key={step.key}
                          className={cn(
                            'rounded-lg border px-3 py-1.5 text-sm font-medium',
                            isActive
                              ? 'border-primary bg-primary/5 text-primary'
                              : isCompleted
                                ? 'border-green-200 bg-green-50 text-green-700'
                                : 'text-muted-foreground',
                          )}
                        >
                          {step.label}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="min-h-0 flex-1 px-5 py-4">
                  {quickStep === 'student' && (
                    <div className="flex h-full min-h-0 flex-col gap-3">
                      {scopedRecentStudents.length > 0 && (
                        <div className="space-y-2 rounded-xl border bg-muted/20 p-3">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Clock3 className="h-4 w-4" />
                            Recent shortcuts
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => handleSelectStudent(scopedRecentStudents[0])}
                            >
                              Last Collected: {scopedRecentStudents[0].name}
                            </Button>
                            {qRecentShortcutStudents.slice(0, 5).map((student) => (
                              <Button
                                key={student._id}
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleSelectStudent(student)}
                              >
                                {student.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-3 rounded-xl border p-3">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            autoFocus
                            value={qStudentSearch}
                            onChange={(e) => setQStudentSearch(e.target.value)}
                            className="pl-9"
                            placeholder="Search name or admission no"
                          />
                        </div>

                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" size="sm" variant={qPreset === 'all' ? 'default' : 'outline'} onClick={() => setQPreset('all')}>
                              All Students
                            </Button>
                            <Button type="button" size="sm" variant={qPreset === 'unpaid' ? 'default' : 'outline'} onClick={() => setQPreset('unpaid')}>
                              Unpaid Only
                            </Button>
                          </div>

                          {renderClassDivisionFilter(qClassId, setQClassId, qDivisionName, setQDivisionName, qDivisions, qSelectedClassId, true)}
                        </div>

                        {qSelectedStudent && (
                          <div className="rounded-lg border bg-primary/5 px-4 py-2.5 text-sm">
                            <p className="font-medium">Selected: {qSelectedStudent.name}</p>
                            <p className="text-muted-foreground">{qSelectedStudent.admissionNo} - {getStudentClassLabel(qSelectedStudent)}</p>
                          </div>
                        )}

                        {qPreset === 'unpaid' && (
                          <p className="text-xs text-muted-foreground">
                            Showing students without any payment record for {qFeeMonth || defaultMonth} in {qAcademicYear || defaultAcademicYear || 'the selected year'}.
                          </p>
                        )}
                      </div>

                      {renderStudentList(
                        qVisibleStudents,
                        qStudentsLoading || qPaidStudentsLoading,
                        new Set(qSelectedStudent ? [qSelectedStudent._id] : []),
                        handleSelectStudent,
                        qStudentSearch,
                        setQStudentSearch,
                        qSelectedStudent?._id ?? null,
                        {
                          hideSearch: true,
                          wrapperClassName: 'min-h-0 flex-1',
                          listClassName: 'h-full',
                        },
                      )}
                    </div>
                  )}

                  {quickStep === 'fees' && qSelectedStudent && (
                    <ScrollArea className="h-full pr-1">
                      <div className="space-y-4 pb-1">
                        <Card className="border-primary/20 bg-primary/5">
                          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-lg font-semibold">{qSelectedStudent.name}</p>
                              <p className="text-sm text-muted-foreground">{qSelectedStudent.admissionNo} - {getStudentClassLabel(qSelectedStudent)}</p>
                            </div>
                            <div className="rounded-lg border bg-background px-4 py-3 text-right">
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Running total</p>
                              <p className="mt-1 text-2xl font-bold text-primary">{formatFeeAmount(qTotal)}</p>
                              <p className="text-xs text-muted-foreground">{qSelectedFeeIds.length} fee item(s)</p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Select Fee Items</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <FeeItemSelector
                              fees={qFees}
                              student={qSelectedStudent}
                              selectedFeeIds={qSelectedFeeIds}
                              transportGroups={qTransportGroups}
                              formatAmount={formatFeeAmount}
                              onToggleFee={(feeId) => {
                                setQSelectedFeeIds((prev) => (
                                  prev.includes(feeId) ? prev.filter((x) => x !== feeId) : [...prev, feeId]
                                ));
                              }}
                              onDistanceGroupChange={(feeId, group) => {
                                setQTransportGroups((prev) => ({ ...prev, [feeId]: group }));
                              }}
                              onSelectRegular={handleQSelectRegular}
                              onClearAll={() => {
                                setQSelectedFeeIds([]);
                                setQTransportGroups({});
                              }}
                              isLoading={qFeesLoading}
                            />
                          </CardContent>
                        </Card>
                      </div>
                    </ScrollArea>
                  )}

                  {quickStep === 'payment' && qSelectedStudent && (
                    <ScrollArea className="h-full pr-1">
                      <div className="space-y-4 pb-1">
                        <Card className="border-primary/20 bg-primary/5">
                          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-lg font-semibold">{qSelectedStudent.name}</p>
                              <p className="text-sm text-muted-foreground">{getStudentClassLabel(qSelectedStudent)}</p>
                            </div>
                            <div className="rounded-lg border bg-background px-4 py-3 text-right">
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Grand total</p>
                              <p className="mt-1 text-2xl font-bold text-primary">{formatFeeAmount(qTotal)}</p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Payment Details</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {renderPaymentFields(qAcademicYear, setQAcademicYear, qFeeMonth, setQFeeMonth, qPaymentMethod, setQPaymentMethod, qRemarks, setQRemarks)}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Fee Summary</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            {qSelectedFeeIds.map((feeId) => {
                              const fee = qFees.find((item) => item._id === feeId);
                              if (!fee) {
                                return null;
                              }

                              const amount = isTransportFee(fee)
                                ? (() => {
                                    const group = qTransportGroups[feeId];
                                    const transportFee = qFees.find((item) => isTransportFee(item) && (item.transportDistanceGroup || item._id) === group);
                                    return transportFee ? getDiscountedFeeAmount(transportFee, qSelectedStudent.isStaffChild) : 0;
                                  })()
                                : getDiscountedFeeAmount(fee, qSelectedStudent.isStaffChild);

                              return (
                                <div key={feeId} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                                  <span className="min-w-0 truncate">{fee.title}</span>
                                  <span className="font-medium">{formatFeeAmount(amount)}</span>
                                </div>
                              );
                            })}
                          </CardContent>
                        </Card>
                      </div>
                    </ScrollArea>
                  )}
                </div>

                <div className="sticky bottom-0 z-10 shrink-0 border-t bg-background px-5 py-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      {quickStep !== 'student' && (
                        <Button type="button" variant="outline" onClick={() => setQuickStep(quickStep === 'payment' ? 'fees' : 'student')}>
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back
                        </Button>
                      )}
                      <Button type="button" variant="ghost" onClick={() => setIsQuickPickerOpen(false)}>
                        Close
                      </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {quickStep === 'student' && (
                        <Button type="button" onClick={() => setQuickStep('fees')} disabled={!qSelectedStudent}>
                          Next
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                      {quickStep === 'fees' && (
                        <Button type="button" onClick={moveQuickWizardToPayment} disabled={qSelectedFeeIds.length === 0}>
                          Next
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                      {quickStep === 'payment' && (
                        <Button type="submit" disabled={isSubmitting || qSelectedFeeIds.length === 0}>
                          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Record Payment
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isBulkPickerOpen} onOpenChange={setIsBulkPickerOpen}>
            <DialogContent className="max-w-4xl overflow-hidden p-0">
              <div className="flex max-h-[90vh] flex-col">
                <DialogHeader className="border-b px-6 py-5">
                  <DialogTitle>Add Students</DialogTitle>
                  <DialogDescription>
                    Pick students here and return straight to the fee configuration screen without losing context.
                  </DialogDescription>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                  <div className="space-y-4">
                    {scopedRecentStudents.length > 0 && (
                      <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Clock3 className="h-4 w-4" />
                          Recent shortcuts
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {bRecentShortcutStudents.slice(0, 6).map((student) => (
                            <Button key={student._id} type="button" size="sm" variant="outline" onClick={() => void handleBulkToggleStudent(student)}>
                              {student.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4 rounded-xl border p-4">
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant={bPreset === 'all' ? 'default' : 'outline'} onClick={() => setBPreset('all')}>
                          All Students
                        </Button>
                        <Button type="button" size="sm" variant={bPreset === 'unpaid' ? 'default' : 'outline'} onClick={() => setBPreset('unpaid')}>
                          Unpaid Only
                        </Button>
                      </div>

                      {renderClassDivisionFilter(bClassId, setBClassId, bDivisionName, setBDivisionName, bDivisions, bSelectedClassId)}

                      {bPreset === 'unpaid' && (
                        <p className="text-xs text-muted-foreground">
                          Showing students without any payment record for {bFeeMonth || defaultMonth} in {bAcademicYear || defaultAcademicYear || 'the selected year'}.
                        </p>
                      )}

                      <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                        <span className="text-muted-foreground">{bSelections.length} student(s) selected</span>
                        <Button type="button" variant="outline" size="sm" onClick={handleBulkSelectVisible} disabled={bVisibleStudents.length === 0}>
                          {bVisibleStudents.length > 0 && bVisibleStudents.every((s) => bSelectedIds.has(s._id)) ? 'Unselect visible' : 'Select visible'}
                        </Button>
                      </div>

                      {renderStudentList(
                        bVisibleStudents,
                        bStudentsLoading || bPaidStudentsLoading,
                        bSelectedIds,
                        handleBulkToggleStudent,
                        bStudentSearch,
                        setBStudentSearch,
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t bg-background px-6 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">{bSelections.length} student(s) selected</p>
                    <Button type="button" onClick={() => setIsBulkPickerOpen(false)}>Done</Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Quick Collect Tab */}
          <TabsContent value="quick" className="mt-6">
            <div className="space-y-4">
              <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Quick collection</p>
                    <h2 className="text-2xl font-semibold">Student → Fees → Payment Details → Pay</h2>
                    <p className="text-sm text-muted-foreground">
                      Quick collect now runs as a step-by-step popup so the workflow stays simple and clean.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {hasQuickDraft && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => openQuickWizard(qSelectedFeeIds.length > 0 ? 'payment' : qSelectedStudent ? 'fees' : 'student')}
                      >
                        Continue Draft
                      </Button>
                    )}
                    <Button type="button" className="gap-2" onClick={() => {
                      resetQuickFlow();
                      openQuickWizard('student');
                    }}>
                      <Zap className="h-4 w-4" />
                      {hasQuickDraft ? 'New Collection' : 'Start Quick Collect'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {scopedRecentStudents.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Recent Students</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {scopedRecentStudents.slice(0, 6).map((student) => (
                      <Button
                        key={student._id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          resetQuickFlow();
                          handleSelectStudent(student);
                          openQuickWizard('fees');
                        }}
                      >
                        {student.name}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Bulk Collect Tab */}
          <TabsContent value="bulk" className="mt-6">
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                <CardContent className="space-y-4 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Bulk collection</p>
                      <h2 className="text-xl font-semibold">Add students in a popup and configure fees on one clean screen</h2>
                      <p className="text-sm text-muted-foreground">
                        The student list no longer stays pinned on the left, so the page gives more room to the actual collection work.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {bSelections.length > 0 && (
                        <Button type="button" variant="ghost" onClick={() => { setBSelections([]); setBFeeCache({}); }}>
                          Clear All
                        </Button>
                      )}
                      <Button type="button" className="gap-2" onClick={() => setIsBulkPickerOpen(true)}>
                        <Plus className="h-4 w-4" />
                        {bSelections.length > 0 ? 'Add More Students' : 'Add Students'}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <Card className="border-primary/20 bg-primary/5">
                      <CardContent className="p-3">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Selected</p>
                        <p className="mt-1 text-2xl font-bold">{bSelections.length}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Configured</p>
                        <p className="mt-1 text-2xl font-bold">{bConfiguredCount}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Grand Total</p>
                        <p className="mt-1 text-2xl font-bold text-primary">{formatFeeAmount(bGrandTotal)}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {bSelections.length > 0 ? (
                    <ScrollArea className="w-full whitespace-nowrap rounded-lg border bg-background/70">
                      <div className="flex gap-2 p-3">
                        {bSelections.map((sel) => (
                          <div key={sel.student._id} className="flex items-center gap-2 rounded-full border bg-muted/30 px-3 py-1.5 text-sm">
                            <span className="font-medium">{sel.student.name}</span>
                            <span className="text-muted-foreground">{sel.student.class}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                      No students added yet. Open the popup and pick students first.
                    </div>
                  )}
                </CardContent>
              </Card>

              {bSelections.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Payment Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {renderPaymentFields(bAcademicYear, setBAcademicYear, bFeeMonth, setBFeeMonth, bPaymentMethod, setBPaymentMethod, bRemarks, setBRemarks)}
                    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{bConfiguredCount} of {bSelections.length} students configured</p>
                        <p className="text-xl font-bold text-primary">{formatFeeAmount(bGrandTotal)}</p>
                      </div>
                      <Button type="submit" disabled={isSubmitting || bSelections.length === 0} className="sm:px-8">
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {bSelections.length > 1 ? `Record ${bSelections.length} Payments` : 'Record Payment'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {bSelections.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                    <Users className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <p className="text-lg font-semibold">Add students to start bulk collection</p>
                      <p className="text-sm text-muted-foreground">The student search now lives in a popup so this page stays clean.</p>
                    </div>
                    <Button type="button" className="gap-2" onClick={() => setIsBulkPickerOpen(true)}>
                      <Plus className="h-4 w-4" />
                      Open Student Picker
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {bSelections.map((sel) => {
                    const fees = sel.student.classId ? (bFeeCache[sel.student.classId] || []) : [];
                    const isFeeLoading = !!sel.student.classId && bLoadingClasses.includes(sel.student.classId);
                    const studentTotal = sel.selectedFeeIds.reduce((s, feeId) => {
                      const fee = fees.find((f) => f._id === feeId);
                      if (!fee) return s;
                      if (isTransportFee(fee)) {
                        const g = sel.transportGroups[feeId];
                        const tf = fees.find((f) => isTransportFee(f) && (f.transportDistanceGroup || f._id) === g);
                        return s + (tf ? getDiscountedFeeAmount(tf, sel.student.isStaffChild) : 0);
                      }
                      return s + getDiscountedFeeAmount(fee, sel.student.isStaffChild);
                    }, 0);

                    return (
                      <Card key={sel.student._id}>
                        <CardHeader className="pb-3">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <CardTitle className="text-lg">{sel.student.name}</CardTitle>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {sel.student.admissionNo} - {sel.student.section ? `${sel.student.class} - ${sel.student.section}` : sel.student.class}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="rounded-lg border bg-muted/30 px-4 py-2 text-right">
                                <p className="text-xs text-muted-foreground">{sel.selectedFeeIds.length} fee(s)</p>
                                <p className="text-lg font-semibold text-primary">{formatFeeAmount(studentTotal)}</p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setBSelections((p) => p.filter((x) => x.student._id !== sel.student._id))}
                                className="text-destructive hover:text-destructive"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <FeeItemSelector
                            fees={fees}
                            student={sel.student}
                            selectedFeeIds={sel.selectedFeeIds}
                            transportGroups={sel.transportGroups}
                            formatAmount={formatFeeAmount}
                            onToggleFee={(feeId) => {
                              setBSelections((p) => p.map((x) =>
                                x.student._id !== sel.student._id ? x : {
                                  ...x,
                                  selectedFeeIds: x.selectedFeeIds.includes(feeId)
                                    ? x.selectedFeeIds.filter((i) => i !== feeId)
                                    : [...x.selectedFeeIds, feeId],
                                },
                              ));
                            }}
                            onDistanceGroupChange={(feeId, group) => {
                              setBSelections((p) => p.map((x) =>
                                x.student._id !== sel.student._id ? x : {
                                  ...x,
                                  transportGroups: { ...x.transportGroups, [feeId]: group },
                                },
                              ));
                            }}
                            onSelectRegular={() => {
                              setBSelections((p) => p.map((x) => {
                                if (x.student._id !== sel.student._id) return x;
                                const regularIds = fees.filter((f) => !isTransportFee(f)).map((f) => f._id);
                                const transportIds = x.selectedFeeIds.filter((id) => {
                                  const fee = fees.find((f) => f._id === id);
                                  return fee ? isTransportFee(fee) : false;
                                });
                                return { ...x, selectedFeeIds: [...new Set([...regularIds, ...transportIds])] };
                              }));
                            }}
                            onClearAll={() => {
                              setBSelections((p) => p.map((x) =>
                                x.student._id !== sel.student._id ? x : { ...x, selectedFeeIds: [], transportGroups: {} },
                              ));
                            }}
                            isLoading={isFeeLoading}
                          />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </form>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-6">
            <DataTable
              searchPlaceholder="Search by student name, receipt no, or class..."
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              filters={filterOptions}
              filterValues={filterValues}
              onFilterChange={(v: any) => { setFilterValues(v); setCurrentPage(1); }}
              onFilterReset={() => { setFilterValues({}); setCurrentPage(1); }}
              exportConfig={{ filename: 'fee_payments', columns: exportColumns }}
              pagination={{
                currentPage,
                totalPages: pagination?.pages || 1,
                totalItems: pagination?.total || 0,
                itemsPerPage,
                onPageChange: setCurrentPage,
                onItemsPerPageChange: (v: number) => { setItemsPerPage(v); setCurrentPage(1); },
              }}
              data={payments}
              isLoading={isLoading}
              error={error}
              emptyState={{
                icon: <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />,
                message: 'No fee payments recorded',
              }}
            >
              <div className="grid gap-4">
                {payments.map((payment) => (
                  <Card key={getHistoryPaymentId(payment)} className={cn(payment.status === 'cancelled' && 'border-red-200 bg-red-50/40')}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-3 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="font-semibold text-lg">{payment.studentName}</h3>
                            <span className="text-sm text-muted-foreground">{payment.receiptNo}</span>
                            <Badge variant="outline" className={cn('capitalize', getPaymentStatusClasses(payment.status))}>
                              {payment.status}
                            </Badge>
                            {!!payment.editHistory?.length && (
                              <Badge variant="secondary">{payment.editHistory.length} edit{payment.editHistory.length > 1 ? 's' : ''}</Badge>
                            )}
                          </div>

                          {payment.feeItems?.length > 0 ? (
                            <div className="space-y-1.5">
                              <p className="text-sm font-medium text-muted-foreground">Fee Items:</p>
                              {payment.feeItems.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-sm border-l-2 border-primary/30 pl-3">
                                  <span className="font-medium">
                                    {item.title}
                                    {item.transportDistanceGroup && (
                                      <span className="text-muted-foreground ml-1">({item.transportDistanceGroup})</span>
                                    )}
                                  </span>
                                  <span className="font-medium">{formatFeeAmount(item.amount)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm">
                              <span className="text-muted-foreground">Fee Type:</span>
                              <span className="ml-2 font-medium capitalize">{payment.feeType}</span>
                            </p>
                          )}

                          {payment.cancellation && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                              <p className="font-medium">Cancelled on {new Date(payment.cancellation.cancelledAt).toLocaleString()}</p>
                              <p className="mt-1">Reason: {payment.cancellation.reason}</p>
                              <p className="mt-1 text-xs">By {payment.cancellation.cancelledByName}</p>
                            </div>
                          )}

                          {!!payment.editHistory?.length && (
                            <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Audit Trail</p>
                              {[...payment.editHistory].reverse().map((entry, index) => (
                                <div key={`${getHistoryPaymentId(payment)}-edit-${index}`} className="rounded-md border bg-background px-3 py-2 text-xs text-muted-foreground">
                                  <p className="font-medium text-foreground">Edited on {new Date(entry.editedAt).toLocaleString()} by {entry.editedByName}</p>
                                  <p className="mt-1">Reason: {entry.reason}</p>
                                  {describePaymentEditChanges(entry).map((change) => (
                                    <p key={change} className="mt-1">{change}</p>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm pt-2 border-t">
                            <div>
                              <span className="text-muted-foreground">Class:</span>
                              <span className="ml-1 font-medium">{payment.className || payment.class}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Total:</span>
                              <span className="ml-1 font-semibold text-primary">{formatFeeAmount(payment.totalAmount || payment.amount)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Method:</span>
                              <span className="ml-1 font-medium capitalize">{payment.paymentMethod}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Date:</span>
                              <span className="ml-1 font-medium">{new Date(payment.paymentDate).toLocaleDateString()}</span>
                            </div>
                            {payment.academicYear && (
                              <div>
                                <span className="text-muted-foreground">Year:</span>
                                <span className="ml-1 font-medium">{payment.academicYear}</span>
                              </div>
                            )}
                            {payment.feeMonth && (
                              <div>
                                <span className="text-muted-foreground">Month:</span>
                                <span className="ml-1 font-medium">{payment.feeMonth}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 flex shrink-0 items-start gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadReceipt(payment)}
                            title="Download Receipt"
                            className="gap-2"
                          >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Receipt</span>
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="button" variant="outline" className="h-9 w-9 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleDownloadReceipt(payment)}>
                                <Download className="mr-2 h-4 w-4" />
                                Download Receipt
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem disabled={payment.status === 'cancelled'} onClick={() => openHistoryEditDialog(payment)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Payment
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={payment.status === 'cancelled'}
                                onClick={() => {
                                  setHistoryCancelPayment(payment);
                                  setHistoryCancelReason('');
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <CircleOff className="mr-2 h-4 w-4" />
                                Cancel Payment
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DataTable>
          </TabsContent>
        </Tabs>

        <Dialog open={Boolean(historyEditPayment)} onOpenChange={(open) => {
          if (!open) {
            resetHistoryEditDialog();
          }
        }}>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleHistoryEditSubmit} className="space-y-5">
              <DialogHeader>
                <DialogTitle>Edit Payment</DialogTitle>
                <DialogDescription>
                  Standard practice is to keep the original receipt and store every change with a reason. Use cancel and re-record if fee items or amount are wrong.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Payment Method</Label>
                  <Select value={historyEditPaymentMethod} onValueChange={(value: PaymentMethod) => setHistoryEditPaymentMethod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="online">Online Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Payment Date</Label>
                  <Input type="date" value={historyEditPaymentDate} onChange={(e) => setHistoryEditPaymentDate(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label>Academic Year</Label>
                  <Select value={historyEditAcademicYear || 'none'} onValueChange={(value) => setHistoryEditAcademicYear(value === 'none' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not set</SelectItem>
                      {academicYears.map((year) => (
                        <SelectItem key={year._id} value={year.name}>{year.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Fee Month</Label>
                  <Select value={historyEditFeeMonth || 'none'} onValueChange={(value) => setHistoryEditFeeMonth(value === 'none' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not set</SelectItem>
                      {MONTHS.map((month) => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Remarks</Label>
                <Textarea rows={3} value={historyEditRemarks} onChange={(e) => setHistoryEditRemarks(e.target.value)} placeholder="Optional note" />
              </div>

              <div className="space-y-1.5">
                <Label>Edit Reason *</Label>
                <Textarea rows={3} value={historyEditReason} onChange={(e) => setHistoryEditReason(e.target.value)} placeholder="Why are you changing this payment record?" />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetHistoryEditDialog}>Close</Button>
                <Button type="submit" disabled={updatePaymentMutation.isPending}>
                  {updatePaymentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={Boolean(historyCancelPayment)} onOpenChange={(open) => {
          if (!open) {
            resetHistoryCancelDialog();
          }
        }}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Cancel Payment</DialogTitle>
              <DialogDescription>
                This will not delete the record. The payment stays in history with cancelled status and the reason you enter below.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                <p className="font-medium">{historyCancelPayment?.studentName}</p>
                <p className="text-muted-foreground">{historyCancelPayment?.receiptNo}</p>
              </div>

              <div className="space-y-1.5">
                <Label>Cancellation Reason *</Label>
                <Textarea rows={4} value={historyCancelReason} onChange={(e) => setHistoryCancelReason(e.target.value)} placeholder="Enter why this payment is being cancelled" />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetHistoryCancelDialog}>Keep Payment</Button>
              <Button type="button" variant="destructive" onClick={handleHistoryCancelSubmit} disabled={cancelPaymentMutation.isPending}>
                {cancelPaymentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cancel Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Fees;
