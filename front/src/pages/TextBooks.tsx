import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/ui/data-table';
import { useConfirmation } from '@/hooks/useConfirmation';
import { Plus, Search, BookOpen, Edit, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTextbooks, useCreateTextbook, useUpdateTextbook, useDeleteTextbook, useTextbookStats } from '@/hooks/useTextbooks';
import { useClasses } from '@/hooks/useClasses';
import { formatters } from '@/utils/exportUtils';
import { pageConfigurations } from '@/utils/pageTemplates';

const TextBooks = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState({});
  const { toast } = useToast();
  const { confirm, ConfirmationComponent } = useConfirmation();

  // API hooks - only pass basic parameters
  const { data: textbooksResponse, isLoading, error } = useTextbooks({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
  });

  const { data: classesResponse } = useClasses({ limit: 100 });
  const { data: statsResponse } = useTextbookStats();
  const createTextbookMutation = useCreateTextbook();
  const updateTextbookMutation = useUpdateTextbook();
  const deleteTextbookMutation = useDeleteTextbook();

  // Get active classes
  const activeClasses = classesResponse?.data?.filter(c => c.status === 'active') || [];

  // Get data from API (server-side filtered and paginated)
  const textbooks = (textbooksResponse?.data || []) as any[];
  const pagination = textbooksResponse?.pagination;
  const stats = (statsResponse?.data || {
    totalBooks: 0,
    totalTitles: 0,
    availableBooks: 0,
    issuedBooks: 0
  }) as { totalBooks: number; totalTitles: number; availableBooks: number; issuedBooks: number };

  // Get configuration from templates with dynamic class options
  const config = {
    ...pageConfigurations.textbooks,
    filters: pageConfigurations.textbooks.filters.map(filter => 
      filter.key === 'class' 
        ? { ...filter, options: activeClasses.filter(cls => cls._id && cls.name).map(cls => ({ value: cls._id, label: `${cls.name} (${cls.academicYear})` })) }
        : filter
    )
  };

  // Filter handlers
  const handleFilterChange = (values: any) => {
    setFilterValues(values);
    setCurrentPage(1);
  };

  const handleFilterReset = () => {
    setFilterValues({});
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const [formData, setFormData] = useState({
    bookCode: '',
    title: '',
    subject: '',
    class: '',
    publisher: '',
    price: '',
    quantity: '',
    academicYear: new Date().getFullYear().toString(),
  });

  const resetForm = () => {
    setFormData({
      bookCode: '',
      title: '',
      subject: '',
      class: '',
      publisher: '',
      price: '',
      quantity: '',
      academicYear: new Date().getFullYear().toString(),
    });
    setEditingBook(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const bookData = {
        bookCode: formData.bookCode,
        title: formData.title,
        subject: formData.subject,
        class: formData.class,
        publisher: formData.publisher,
        price: Number(formData.price),
        quantity: Number(formData.quantity),
        academicYear: formData.academicYear,
      };

      if (editingBook) {
        await updateTextbookMutation.mutateAsync({
          id: editingBook._id,
          data: bookData,
        });
      } else {
        await createTextbookMutation.mutateAsync(bookData);
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const handleEdit = (book: any) => {
    setEditingBook(book);
    
    setFormData({
      bookCode: book.bookCode,
      title: book.title,
      subject: book.subject,
      class: book.class?._id || '',
      publisher: book.publisher,
      price: book.price.toString(),
      quantity: book.quantity.toString(),
      academicYear: book.academicYear,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string, bookTitle: string) => {
    confirm(
      {
        title: 'Delete Text Book',
        description: `Are you sure you want to delete "${bookTitle}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'destructive'
      },
      async () => {
        try {
          await deleteTextbookMutation.mutateAsync(id);
        } catch (error) {
          // Error handling is done in the mutation hook
        }
      }
    );
  };



  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Text Book Inventory</h1>
            <p className="text-muted-foreground mt-1">Manage text book inventory and issuance</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Book
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingBook ? 'Edit Text Book' : 'Add New Text Book'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bookCode">Book Code *</Label>
                    <Input
                      id="bookCode"
                      value={formData.bookCode}
                      onChange={e => setFormData({ ...formData, bookCode: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class">Class *</Label>
                    <Select
                      value={formData.class}
                      onValueChange={(value) => setFormData({ ...formData, class: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeClasses.map(classItem => (
                          <SelectItem key={classItem._id} value={classItem._id}>
                            {classItem.name} ({classItem.academicYear})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Book Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="publisher">Publisher *</Label>
                    <Input
                      id="publisher"
                      value={formData.publisher}
                      onChange={e => setFormData({ ...formData, publisher: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="academicYear">Academic Year *</Label>
                  <Input
                    id="academicYear"
                    value={formData.academicYear}
                    onChange={e => setFormData({ ...formData, academicYear: e.target.value })}
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTextbookMutation.isPending || updateTextbookMutation.isPending}>
                    {(createTextbookMutation.isPending || updateTextbookMutation.isPending) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {editingBook ? 'Update' : 'Add'} Book
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Books</p>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalBooks}</div>
              <p className="text-xs text-muted-foreground mt-2">{stats.totalTitles} titles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <p className="text-sm font-medium text-muted-foreground">Available</p>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{stats.availableBooks}</div>
              <p className="text-xs text-muted-foreground mt-2">in stock</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <p className="text-sm font-medium text-muted-foreground">Issued</p>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats.issuedBooks}</div>
              <p className="text-xs text-muted-foreground mt-2">to students</p>
            </CardContent>
          </Card>
        </div>

        <DataTable
          searchPlaceholder="Search by title, book code, subject, or class..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          filters={config.filters}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onFilterReset={handleFilterReset}
          exportConfig={{
            filename: 'textbooks',
            columns: config.exportColumns.map(col => ({
              ...col,
              formatter: col.formatter ? formatters[col.formatter] : undefined
            }))
          }}
          pagination={{
            currentPage,
            totalPages: pagination?.pages || 1,
            totalItems: pagination?.total || 0,
            itemsPerPage,
            onPageChange: setCurrentPage,
            onItemsPerPageChange: handleItemsPerPageChange
          }}
          data={textbooks}
          isLoading={isLoading}
          error={error}
          emptyState={{
            icon: <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />,
            message: "No text books found"
          }}
        >
          <div className="grid gap-4">
            {textbooks.map(book => (
              <Card key={book._id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{book.title}</h3>
                        <span className="text-sm text-muted-foreground">
                          {book.bookCode}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Class:</span>
                          <span className="ml-2 font-medium">{book.class?.name}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Subject:</span>
                          <span className="ml-2 font-medium">{book.subject}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Publisher:</span>
                          <span className="ml-2 font-medium">{book.publisher}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Price:</span>
                          <span className="ml-2 font-medium">₹{book.price}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Stock:</span>
                          <span className="ml-2 font-medium">
                            {book.available}/{book.quantity}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(book)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDelete(book._id, book.title)}
                        disabled={deleteTextbookMutation.isPending}
                      >
                        {deleteTextbookMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DataTable>
      </div>
      <ConfirmationComponent />
    </AppLayout>
  );
};

export default TextBooks;
