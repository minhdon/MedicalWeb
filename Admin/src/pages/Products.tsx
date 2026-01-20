import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { medicines as initialMedicines, categories } from '@/data/mockData';
import { Medicine } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 10;

export default function Products() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Fetch Products with pagination and search
  const fetchProducts = async (page: number = 1, search: string = '') => {
    try {
      setLoading(true);
      let url = `http://127.0.0.1:3000/api/product/getAll?page=${page}&limit=${ITEMS_PER_PAGE}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.data) {
        const mappedProducts: Medicine[] = data.data.map((p: any) => ({
          id: p._id || p.id,
          name: p.productName,
          description: p.productDesc || '',
          category: p.category || 'Dược phẩm',
          price: p.price,
          costPrice: 0,
          stock: p.quantity || p.variants?.[0]?.quantity || 0,
          unit: p.unit,
          manufacturer: p.manufacturerId?.manufacturerName || p.manufacturer || 'Đang cập nhật',
          ingredients: p.ingredients || '',
          usage: p.usage || '',
          dosage: p.dosage || '',
          preservation: p.preservation || '',
          sideEffects: p.sideEffects || '',
          precautions: p.precautions || '',
          brand: p.brand || '',
          origin: p.origin || '',
          requiresPrescription: p.category === 'Thuốc theo đơn',
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          variants: p.variants || []
        }));
        setMedicines(mappedProducts);
        setTotalPages(data.pagination?.totalPages || data.totalPages || 1);
        setTotalProducts(data.pagination?.totalDocs || data.totalProducts || 0);
      }
    } catch (error) {
      console.error(error);
      toast.error(`Lỗi: ${error instanceof Error ? error.message : 'Không xác định'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(currentPage, searchTerm);
  }, [currentPage]);

  // Debounced search - triggers when searchTerm changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset to page 1 when searching
      fetchProducts(1, searchTerm);
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Dialog and form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    costPrice: '',
    unit: 'Hộp',
    manufacturer: '',
    ingredients: '',
    usage: '',
    dosage: '',
    preservation: '',
    sideEffects: '',
    precautions: '',
    brand: '',
    origin: '',
    requiresPrescription: false,
  });

  // Client-side category filter only (search is server-side)
  const filteredMedicines = categoryFilter === 'all'
    ? medicines
    : medicines.filter((medicine) => medicine.category === categoryFilter);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      price: '',
      costPrice: '',
      unit: 'Hộp',
      manufacturer: '',
      ingredients: '',
      usage: '',
      dosage: '',
      preservation: '',
      sideEffects: '',
      precautions: '',
      brand: '',
      origin: '',
      requiresPrescription: false,
    });
    setEditingMedicine(null);
    setVariants([]);
  };

  const handleEdit = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setFormData({
      name: medicine.name,
      description: medicine.description,
      category: medicine.category,
      price: medicine.price.toString(),
      costPrice: medicine.costPrice.toString(),
      unit: medicine.unit,
      manufacturer: medicine.manufacturer,
      ingredients: medicine.ingredients || '',
      usage: medicine.usage || '',
      dosage: medicine.dosage || '',
      preservation: medicine.preservation || '',
      sideEffects: medicine.sideEffects || '',
      precautions: medicine.precautions || '',
      brand: medicine.brand || '',
      origin: medicine.origin || '',
      requiresPrescription: medicine.requiresPrescription,
    });
    setVariants(medicine.variants || []);
    setIsDialogOpen(true);
  };

  const [variants, setVariants] = useState<{ unit: string; price: number }[]>([]);

  const handleAddVariant = () => {
    setVariants([...variants, { unit: 'Hộp', price: 0 }]);
  };

  const handleVariantChange = (index: number, field: 'unit' | 'price', value: string | number) => {
    const newVariants = [...variants];
    if (field === 'price') newVariants[index].price = Number(value);
    else newVariants[index].unit = String(value);
    setVariants(newVariants);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };


  const handleSubmit = async () => {
    if (!formData.name || !formData.category || !formData.price) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      if (editingMedicine) {
        // Update existing product via API
        const res = await fetch(`http://127.0.0.1:3000/api/product/${editingMedicine.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productName: formData.name,
            productDesc: formData.description,
            ingredients: formData.ingredients,
            usage: formData.usage,
            dosage: formData.dosage,
            preservation: formData.preservation,
            sideEffects: formData.sideEffects,
            precautions: formData.precautions,
            origin: formData.origin,
            brand: formData.brand,
            price: parseFloat(formData.price),
            unit: formData.unit,
            variants: variants,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          toast.success('Đã cập nhật sản phẩm thành công');
          fetchProducts(currentPage, searchTerm); // Refresh from server
        } else {
          toast.error(data.message || 'Lỗi cập nhật sản phẩm');
          return;
        }
      } else {
        // Create new product - just update local state for now (no create API yet)
        const now = new Date().toISOString();
        const newMedicine: Medicine = {
          id: Date.now().toString(),
          name: formData.name,
          description: formData.description,
          category: formData.category,
          price: parseFloat(formData.price),
          costPrice: parseFloat(formData.costPrice) || 0,
          stock: 0,
          unit: formData.unit,
          manufacturer: formData.manufacturer,
          requiresPrescription: formData.requiresPrescription,
          createdAt: now,
          updatedAt: now,
          variants: variants,
        };
        setMedicines((prev) => [newMedicine, ...prev]);
        toast.success('Đã thêm sản phẩm mới thành công (local only)');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error('Lỗi kết nối server');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      setMedicines((prev) => prev.filter((m) => m.id !== id));
      toast.success('Đã xóa sản phẩm');
    }
  };

  return (
    <DashboardLayout title="Quản lý sản phẩm" subtitle="Thêm, sửa, xóa sản phẩm thuốc">
      <div className="rounded-xl bg-card p-6 card-shadow">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Thêm sản phẩm
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingMedicine ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tên sản phẩm *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Danh mục *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Thương hiệu</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="origin">Xuất xứ</Label>
                    <Input
                      id="origin"
                      value={formData.origin}
                      onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả chung</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ingredients">Thành phần</Label>
                  <Textarea
                    id="ingredients"
                    value={formData.ingredients}
                    onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="usage">Công dụng</Label>
                    <Textarea
                      id="usage"
                      value={formData.usage}
                      onChange={(e) => setFormData({ ...formData, usage: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dosage">Cách dùng / Liều dùng</Label>
                    <Textarea
                      id="dosage"
                      value={formData.dosage}
                      onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preservation">Bảo quản</Label>
                    <Textarea
                      id="preservation"
                      value={formData.preservation}
                      onChange={(e) => setFormData({ ...formData, preservation: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sideEffects">Tác dụng phụ</Label>
                    <Textarea
                      id="sideEffects"
                      value={formData.sideEffects}
                      onChange={(e) => setFormData({ ...formData, sideEffects: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="precautions">Lưu ý</Label>
                    <Textarea
                      id="precautions"
                      value={formData.precautions}
                      onChange={(e) => setFormData({ ...formData, precautions: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Giá bán (VNĐ) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="costPrice">Giá nhập (VNĐ)</Label>
                    <Input
                      id="costPrice"
                      type="number"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unit">Đơn vị</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) => setFormData({ ...formData, unit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hộp">Hộp</SelectItem>
                        <SelectItem value="Vỉ">Vỉ</SelectItem>
                        <SelectItem value="Chai">Chai</SelectItem>
                        <SelectItem value="Lọ">Lọ</SelectItem>
                        <SelectItem value="Tuýp">Tuýp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="prescription"
                    checked={formData.requiresPrescription}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, requiresPrescription: checked })
                    }
                  />
                  <Label htmlFor="prescription">Yêu cầu đơn thuốc</Label>
                </div>

                <Button onClick={handleSubmit} className="w-full">
                  {editingMedicine ? 'Cập nhật' : 'Thêm sản phẩm'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên sản phẩm</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Giá bán</TableHead>
                <TableHead>Tồn kho</TableHead>
                <TableHead>Thương hiệu</TableHead>
                <TableHead>Xuất xứ</TableHead>
                <TableHead>Cần kê đơn</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMedicines.map((medicine) => (
                <TableRow key={medicine.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{medicine.name}</p>
                      <p className="text-sm text-muted-foreground">{medicine.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{medicine.category}</Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {medicine.price.toLocaleString('vi-VN')}đ
                  </TableCell>
                  <TableCell>
                    <span className={medicine.stock < 100 ? 'text-warning font-medium' : ''}>
                      {medicine.stock} {medicine.unit}
                    </span>
                  </TableCell>
                  <TableCell>{medicine.brand}</TableCell>
                  <TableCell>{medicine.origin || medicine.manufacturer}</TableCell>
                  <TableCell>
                    {medicine.requiresPrescription ? (
                      <Badge variant="destructive">Có</Badge>
                    ) : (
                      <Badge variant="secondary">Không</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(medicine)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(medicine.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="text-sm text-muted-foreground">
            Hiển thị {medicines.length} / {totalProducts} sản phẩm
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Trước
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading}
                    className="w-10"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
            >
              Sau
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            Trang {currentPage} / {totalPages}
          </div>
        </div>
      </div>
    </DashboardLayout >
  );
}
