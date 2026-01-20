import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Order, Branch } from '@/types';

const API_BASE = 'http://127.0.0.1:3000/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Eye, Truck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const statusConfig = {
  pending: { label: 'Chờ xử lý', variant: 'warning' as const },
  confirmed: { label: 'Đã xác nhận', variant: 'default' as const },
  processing: { label: 'Đang xử lý', variant: 'default' as const },
  shipping: { label: 'Đang giao', variant: 'secondary' as const },
  delivered: { label: 'Đã giao', variant: 'success' as const },
  cancelled: { label: 'Đã hủy', variant: 'destructive' as const },
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('http://127.0.0.1:3000/api/sale-invoice/getAll');
        const data = await res.json();
        // Map data
        if (Array.isArray(data)) {
          // Map backend status to frontend status key
          const statusMap: Record<string, Order['status']> = {
            'pending': 'pending',
            'confirmed': 'confirmed',
            'processing': 'processing',
            'completed': 'delivered',
            'cancelled': 'cancelled'
          };

          const mappedOrders: Order[] = data.map((o: any) => ({
            id: o.id,
            customerId: o.id, // Fallback ID
            customerName: o.customerName,
            customerPhone: o.customerPhone,
            customerAddress: o.customerAddress,
            items: o.items || [], // Use items from API
            total: o.total,
            status: statusMap[o.status?.toLowerCase()] || 'pending',
            deliveryBranch: o.deliveryBranch,
            paymentMethod: 'cash', // Default or fetch
            paymentStatus: 'pending', // Default
            createdAt: o.createdAt,
            updatedAt: o.createdAt,
            notes: ''
          }));
          setOrders(mappedOrders);
        }
      } catch (e) {
        console.error(e);
        toast.error("Lỗi tải đơn hàng");
      }
    };
    fetchOrders();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [orderToAssign, setOrderToAssign] = useState<Order | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Fetch branches from database
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch(`${API_BASE}/warehouse/getAll`);
        const data = await res.json();
        if (data && data.data) {
          setBranches(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch branches:', error);
      }
    };
    fetchBranches();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAssignBranch = async (order: Order, branchId: string, branchName: string) => {
    try {
      const res = await fetch(`${API_BASE}/sale-invoice/update/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warehouseId: branchId, statusName: 'Confirmed' })
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? { ...o, deliveryBranch: branchName, status: 'confirmed' as const }
              : o
          )
        );
        toast.success(`Đã phân bổ đơn hàng cho ${branchName}`);
      } else {
        const data = await res.json();
        toast.error(data.message || 'Lỗi phân bổ đơn hàng');
      }
    } catch (error) {
      toast.error('Lỗi kết nối khi phân bổ đơn hàng');
    }
    setShowAssignDialog(false);
    setOrderToAssign(null);
  };

  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);

  const handleUpdateStatus = async (orderId: string, newStatusName: string) => {
    try {
      const res = await fetch(`${API_BASE}/sale-invoice/update/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusName: newStatusName })
      });

      if (res.ok) {
        // Map backend status to frontend status key
        const statusMap: Record<string, Order['status']> = {
          'Pending': 'pending',
          'Confirmed': 'confirmed',
          'Processing': 'processing',
          'Completed': 'delivered',
          'Cancelled': 'cancelled'
        };
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: statusMap[newStatusName] || 'pending' } : o))
        );
        toast.success('Đã cập nhật trạng thái đơn hàng');
      } else {
        toast.error('Lỗi cập nhật trạng thái');
      }
    } catch (error) {
      toast.error('Lỗi kết nối');
    }
  };

  const handleDeleteOrder = async () => {
    if (!deleteOrderId) return;

    try {
      const res = await fetch(`${API_BASE}/sale-invoice/delete/${deleteOrderId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== deleteOrderId));
        toast.success('Đã xóa đơn hàng');
      } else {
        toast.error('Lỗi xóa đơn hàng');
      }
    } catch (error) {
      toast.error('Lỗi kết nối khi xóa');
    } finally {
      setDeleteOrderId(null);
    }
  };

  return (
    <DashboardLayout title="Quản lý đơn hàng" subtitle="Xem và xử lý các đơn hàng">
      <div className="rounded-xl bg-card p-6 card-shadow">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo mã đơn, tên khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {Object.entries(statusConfig).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã đơn</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Số lượng</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Chi nhánh giao</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const status = statusConfig[order.status];
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-semibold">{(order as any).totalQuantity || order.items.reduce((s: number, i: any) => s + i.quantity, 0)} sản phẩm</span>
                        <span className="text-sm text-muted-foreground ml-1">({order.items.length} loại)</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {order.total.toLocaleString('vi-VN')}đ
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {order.deliveryBranch || (
                        <span className="text-muted-foreground">Chưa phân bổ</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedOrder(order)}
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {order.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setOrderToAssign(order);
                              setShowAssignDialog(true);
                            }}
                            title="Phân bổ chi nhánh"
                          >
                            <Truck className="h-4 w-4" />
                          </Button>
                        )}
                        <Select
                          value=""
                          onValueChange={(value) => handleUpdateStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-[130px] h-8">
                            <SelectValue placeholder="Đổi trạng thái" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Chờ xử lý</SelectItem>
                            <SelectItem value="Confirmed">Đã xác nhận</SelectItem>
                            <SelectItem value="Processing">Đang xử lý</SelectItem>
                            <SelectItem value="Completed">Đã giao</SelectItem>
                            <SelectItem value="Cancelled">Đã hủy</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteOrderId(order.id)}
                          title="Xóa đơn hàng"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn hàng {selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Khách hàng</p>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                  <p className="text-sm">{selectedOrder.customerPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Địa chỉ giao hàng</p>
                  <p className="font-medium">{selectedOrder.customerAddress}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Sản phẩm</p>
                <div className="rounded-lg border divide-y">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between p-3">
                      <div>
                        <p className="font-medium">{item.medicineName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.price.toLocaleString('vi-VN')}đ x {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">{item.total.toLocaleString('vi-VN')}đ</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 pt-4 border-t">
                  <p className="font-semibold">Tổng cộng</p>
                  <p className="text-xl font-bold text-primary">
                    {selectedOrder.total.toLocaleString('vi-VN')}đ
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {selectedOrder.status === 'pending' && (
                  <>
                    <Button onClick={() => handleUpdateStatus(selectedOrder.id, 'confirmed')}>
                      Xác nhận đơn
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                    >
                      Hủy đơn
                    </Button>
                  </>
                )}
                {selectedOrder.status === 'confirmed' && (
                  <Button onClick={() => handleUpdateStatus(selectedOrder.id, 'shipping')}>
                    Bắt đầu giao hàng
                  </Button>
                )}
                {selectedOrder.status === 'shipping' && (
                  <Button onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered')}>
                    Đã giao thành công
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Branch Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Phân bổ chi nhánh giao hàng</DialogTitle>
          </DialogHeader>
          {orderToAssign && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Chọn chi nhánh để giao đơn hàng <strong>{orderToAssign.id}</strong>
              </p>
              <div className="space-y-2">
                {branches
                  .filter((b) => b.isActive)
                  .map((branch) => (
                    <Button
                      key={branch.id}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleAssignBranch(orderToAssign, branch.id, branch.name)}
                    >
                      <div className="text-left">
                        <p className="font-medium">{branch.name}</p>
                        <p className="text-sm text-muted-foreground">{branch.address}</p>
                      </div>
                    </Button>
                  ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteOrderId} onOpenChange={(open) => !open && setDeleteOrderId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa đơn hàng</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Bạn có chắc chắn muốn xóa đơn hàng này không?</p>
            <p className="text-sm text-muted-foreground mt-2">
              Hành động này sẽ xóa toàn bộ thông tin đơn hàng và không thể hoàn tác.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteOrderId(null)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDeleteOrder}>Xóa</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
