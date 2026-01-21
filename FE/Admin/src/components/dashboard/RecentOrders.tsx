import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE = 'http://127.0.0.1:3000/api';

const statusConfig: Record<string, { label: string; variant: 'warning' | 'default' | 'secondary' | 'success' | 'destructive' }> = {
  pending: { label: 'Chờ xử lý', variant: 'warning' },
  confirmed: { label: 'Đã xác nhận', variant: 'default' },
  processing: { label: 'Đang xử lý', variant: 'default' },
  shipping: { label: 'Đang giao', variant: 'secondary' },
  delivered: { label: 'Đã giao', variant: 'success' },
  completed: { label: 'Hoàn thành', variant: 'success' },
  cancelled: { label: 'Đã hủy', variant: 'destructive' },
};

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: any[];
  totalQuantity: number;
  total: number;
  status: string;
  createdAt: string;
  deliveryBranch?: string;
}

export function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API_BASE}/sale-invoice/getAll`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrders(data.slice(0, 5)); // Get 5 most recent
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusKey = (status: string): string => {
    const lower = status?.toLowerCase() || 'pending';
    if (lower.includes('pending') || lower.includes('chờ')) return 'pending';
    if (lower.includes('confirmed') || lower.includes('xác nhận')) return 'confirmed';
    if (lower.includes('processing') || lower.includes('xử lý')) return 'processing';
    if (lower.includes('shipping') || lower.includes('giao')) return 'shipping';
    if (lower.includes('delivered') || lower.includes('hoàn thành') || lower.includes('completed')) return 'completed';
    if (lower.includes('cancelled') || lower.includes('hủy')) return 'cancelled';
    return 'pending';
  };

  return (
    <div className="rounded-xl bg-card p-6 card-shadow animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-card-foreground">Đơn hàng gần đây</h3>
        <Link to="/orders">
          <Button variant="ghost" size="sm" className="text-primary">
            Xem tất cả
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-muted-foreground py-4">Đang tải...</div>
        ) : orders.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">Chưa có đơn hàng</div>
        ) : (
          orders.map((order) => {
            const statusKey = getStatusKey(order.status);
            const status = statusConfig[statusKey] || statusConfig.pending;
            return (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-card-foreground text-sm">
                      {order.id.slice(-8).toUpperCase()}
                    </span>
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {order.deliveryBranch && (
                      <span className="text-xs text-muted-foreground">{order.deliveryBranch}</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {order.customerName} • {order.totalQuantity || order.items?.length || 0} sản phẩm
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-card-foreground">
                    {(order.total || 0).toLocaleString('vi-VN')}đ
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
