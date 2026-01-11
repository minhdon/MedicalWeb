import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { orders as initialOrders, branches } from '@/data/mockData';
import { Order } from '@/types';
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
import { Search, Eye, Truck } from 'lucide-react';
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
          const mappedOrders: Order[] = data.map((o: any) => ({
            id: o.id,
            customerId: o.id, // Fallback ID
            customerName: o.customerName,
            customerPhone: o.customerPhone,
            customerAddress: o.customerAddress,
            items: [], // Detail fetch needed or mock for list
            total: o.total,
            status: (o.status.toLowerCase() === 'pending' ? 'pending' : 'confirmed') as Order['status'], // Cast to enum
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

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAssignBranch = (order: Order, branchName: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id
          ? { ...o, deliveryBranch: branchName, status: 'confirmed' as const }
          : o
      )
    );
    toast.success(`Đã phân bổ đơn ${order.id} cho ${branchName}`);
    setShowAssignDialog(false);
    setOrderToAssign(null);
  };

  const handleUpdateStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    toast.success('Đã cập nhật trạng thái đơn hàng');
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
                <TableHead>Sản phẩm</TableHead>
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
                    <TableCell>{order.items.length} sản phẩm</TableCell>
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
                          >
                            <Truck className="h-4 w-4" />
                          </Button>
                        )}
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
                      onClick={() => handleAssignBranch(orderToAssign, branch.name)}
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
    </DashboardLayout>
  );
}
