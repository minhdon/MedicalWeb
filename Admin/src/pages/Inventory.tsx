import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { medicines as initialMedicines, inventoryLogs as initialLogs } from '@/data/mockData';
import { Medicine, InventoryLog } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, ArrowDownToLine, ArrowUpFromLine, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

import { format } from 'date-fns';

const ITEMS_PER_PAGE = 20;

export default function Inventory() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>(initialLogs);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showInStockOnly, setShowInStockOnly] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Batch View State
  const [selectedProductBatches, setSelectedProductBatches] = useState<any[]>([]);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Medicine | null>(null);

  const [adjustmentType, setAdjustmentType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [selectedMedicineId, setSelectedMedicineId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  // Fetch Products for Inventory with pagination and search
  const fetchInventory = async (page: number = 1, search: string = '', inStock: boolean = false) => {
    try {
      setLoading(true);
      let url = `http://127.0.0.1:3000/api/product/getAll?page=${page}&limit=${ITEMS_PER_PAGE}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      if (inStock) {
        url += `&inStockOnly=true`;
      }
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.data) {
        const mappedProducts: Medicine[] = data.data.map((p: any) => ({
          id: p._id || p.id,
          name: p.productName,
          description: '',
          category: p.category || 'Dược phẩm',
          price: p.price,
          costPrice: p.costPrice || p.price * 0.7, // Estimate if not available
          stock: p.quantity || 0,
          unit: p.unit,
          manufacturer: p.manufacturerId?.manufacturerName || p.manufacturer || 'Đang cập nhật',
          ingredients: p.ingredients,
          brand: p.brand,
          origin: p.origin,
          expiryDate: p.expiryDate || null,
          requiresPrescription: p.category === 'Thuốc theo đơn',
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        }));
        setMedicines(mappedProducts);
        setTotalPages(data.pagination?.totalPages || data.totalPages || 1);
        setTotalProducts(data.pagination?.totalDocs || data.totalProducts || 0);
      }
    } catch (error) {
      console.error(error);
      toast.error('Lỗi tải dữ liệu kho hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory(currentPage, searchTerm, showInStockOnly);
  }, [currentPage, showInStockOnly]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchInventory(1, searchTerm, showInStockOnly);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // No client-side filter needed - filter is now server-side
  const filteredMedicines = medicines;

  const handleViewBatches = async (product: Medicine) => {
    setViewingProduct(product);
    try {
      const res = await fetch(`http://127.0.0.1:3000/api/product/${product.id}/batches`);
      const data = await res.json();
      setSelectedProductBatches(data);
      setIsBatchDialogOpen(true);
    } catch (error) {
      toast.error('Lỗi tải thông tin lô hàng');
    }
  };

  const handleAdjustment = () => {
    if (!selectedMedicineId || !quantity || !reason) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const medicine = medicines.find((m) => m.id === selectedMedicineId);
    if (!medicine) return;

    const qtyChange = parseInt(quantity);
    let newStock = medicine.stock;

    if (adjustmentType === 'in') {
      newStock += qtyChange;
    } else if (adjustmentType === 'out') {
      if (qtyChange > medicine.stock) {
        toast.error('Số lượng xuất vượt quá tồn kho');
        return;
      }
      newStock -= qtyChange;
    } else {
      newStock = qtyChange;
    }

    setMedicines((prev) =>
      prev.map((m) => (m.id === selectedMedicineId ? { ...m, stock: newStock } : m))
    );

    const newLog: InventoryLog = {
      id: Date.now().toString(),
      medicineId: medicine.id,
      medicineName: medicine.name,
      type: adjustmentType,
      quantity: adjustmentType === 'out' ? -qtyChange : adjustmentType === 'adjustment' ? qtyChange - medicine.stock : qtyChange,
      previousStock: medicine.stock,
      newStock,
      reason,
      createdAt: new Date().toISOString(),
      createdBy: 'Admin',
    };

    setLogs((prev) => [newLog, ...prev]);
    toast.success('Đã cập nhật kho hàng');
    setIsDialogOpen(false);
    setSelectedMedicineId('');
    setQuantity('');
    setReason('');
  };

  const getLogTypeIcon = (type: InventoryLog['type']) => {
    switch (type) {
      case 'in':
        return <ArrowDownToLine className="h-4 w-4 text-success" />;
      case 'out':
        return <ArrowUpFromLine className="h-4 w-4 text-destructive" />;
      default:
        return <RefreshCw className="h-4 w-4 text-warning" />;
    }
  };

  const getLogTypeBadge = (type: InventoryLog['type']) => {
    switch (type) {
      case 'in':
        return <Badge variant="success">Nhập kho</Badge>;
      case 'out':
        return <Badge variant="destructive">Xuất kho</Badge>;
      default:
        return <Badge variant="warning">Điều chỉnh</Badge>;
    }
  };

  return (
    <DashboardLayout title="Quản lý kho hàng" subtitle="Theo dõi và điều chỉnh tồn kho">
      <Tabs defaultValue="stock" className="space-y-6">
        <TabsList>
          <TabsTrigger value="stock">Tồn kho</TabsTrigger>
          <TabsTrigger value="logs">Lịch sử biến động</TabsTrigger>
        </TabsList>

        <TabsContent value="stock">
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

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="inStockFilter"
                  checked={showInStockOnly}
                  onChange={(e) => setShowInStockOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="inStockFilter" className="text-sm text-muted-foreground whitespace-nowrap">
                  Chỉ còn hàng
                </label>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Điều chỉnh kho
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Điều chỉnh kho hàng</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Loại điều chỉnh</Label>
                      <Select
                        value={adjustmentType}
                        onValueChange={(value: 'in' | 'out' | 'adjustment') =>
                          setAdjustmentType(value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in">Nhập kho</SelectItem>
                          <SelectItem value="out">Xuất kho</SelectItem>
                          <SelectItem value="adjustment">Điều chỉnh số lượng</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Sản phẩm</Label>
                      <Select value={selectedMedicineId} onValueChange={setSelectedMedicineId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn sản phẩm" />
                        </SelectTrigger>
                        <SelectContent>
                          {medicines.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name} (Tồn: {m.stock})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        {adjustmentType === 'adjustment' ? 'Số lượng mới' : 'Số lượng'}
                      </Label>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Lý do</Label>
                      <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Nhập lý do điều chỉnh..."
                      />
                    </div>

                    <Button onClick={handleAdjustment} className="w-full">
                      Xác nhận
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Thông tin lô hàng - {viewingProduct?.name}</DialogTitle>
                  </DialogHeader>
                  <div className="rounded-lg border mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã lô</TableHead>
                          <TableHead>Ngày sản xuất</TableHead>
                          <TableHead>Hạn sử dụng</TableHead>
                          <TableHead>Số lượng tồn</TableHead>
                          <TableHead>Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedProductBatches.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                              Chưa có lô hàng nào
                            </TableCell>
                          </TableRow>
                        ) : (
                          selectedProductBatches.map((batch) => {
                            const isExpired = new Date(batch.expiryDate) < new Date();
                            const isNearExpiry = !isExpired && new Date(batch.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

                            return (
                              <TableRow key={batch._id}>
                                <TableCell className="font-mono text-xs">{batch._id.slice(-6).toUpperCase()}</TableCell>
                                <TableCell>{format(new Date(batch.manufactureDate), 'dd/MM/yyyy')}</TableCell>
                                <TableCell className={isExpired ? 'text-destructive font-bold' : ''}>
                                  {format(new Date(batch.expiryDate), 'dd/MM/yyyy')}
                                </TableCell>
                                <TableCell className="font-semibold">{batch.remainingQuantity}</TableCell>
                                <TableCell>
                                  {batch.remainingQuantity === 0 ? (
                                    <Badge variant="outline">Hết hàng</Badge>
                                  ) : isExpired ? (
                                    <Badge variant="destructive">Hết hạn</Badge>
                                  ) : isNearExpiry ? (
                                    <Badge variant="warning">Sắp hết hạn</Badge>
                                  ) : (
                                    <Badge variant="success">Sử dụng tốt</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Danh mục</TableHead>
                    <TableHead>Tồn kho</TableHead>
                    <TableHead>Đơn vị</TableHead>
                    <TableHead>Giá nhập</TableHead>
                    <TableHead>Giá trị tồn</TableHead>
                    <TableHead>Hạn SD</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Chi tiết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMedicines.map((medicine) => {
                    const stockValue = medicine.stock * medicine.costPrice;
                    const isLowStock = medicine.stock < 100;
                    const isExpiringSoon =
                      new Date(medicine.expiryDate) <
                      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

                    return (
                      <TableRow key={medicine.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{medicine.name}</p>
                            <p className="text-sm text-muted-foreground">{medicine.manufacturer}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{medicine.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={isLowStock ? 'text-warning font-semibold' : 'font-medium'}>
                            {medicine.stock}
                          </span>
                        </TableCell>
                        <TableCell>{medicine.unit}</TableCell>
                        <TableCell>{medicine.costPrice.toLocaleString('vi-VN')}đ</TableCell>
                        <TableCell className="font-semibold">
                          {stockValue.toLocaleString('vi-VN')}đ
                        </TableCell>
                        <TableCell>
                          <span className={isExpiringSoon ? 'text-destructive' : ''}>
                            {new Date(medicine.expiryDate).toLocaleDateString('vi-VN')}
                          </span>
                        </TableCell>
                        <TableCell>
                          {isLowStock ? (
                            <Badge variant="warning">Sắp hết</Badge>
                          ) : isExpiringSoon ? (
                            <Badge variant="destructive">Gần HSD</Badge>
                          ) : (
                            <Badge variant="success">Bình thường</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleViewBatches(medicine)}>
                            Xem lô
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
        </TabsContent>

        <TabsContent value="logs">
          <div className="rounded-xl bg-card p-6 card-shadow">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Số lượng</TableHead>
                    <TableHead>Trước</TableHead>
                    <TableHead>Sau</TableHead>
                    <TableHead>Lý do</TableHead>
                    <TableHead>Người thực hiện</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getLogTypeIcon(log.type)}
                          {getLogTypeBadge(log.type)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{log.medicineName}</TableCell>
                      <TableCell>
                        <span
                          className={
                            log.quantity > 0 ? 'text-success' : 'text-destructive'
                          }
                        >
                          {log.quantity > 0 ? '+' : ''}
                          {log.quantity}
                        </span>
                      </TableCell>
                      <TableCell>{log.previousStock}</TableCell>
                      <TableCell className="font-medium">{log.newStock}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{log.reason}</TableCell>
                      <TableCell>{log.createdBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout >
  );
}
