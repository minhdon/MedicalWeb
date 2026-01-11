import { orders } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const statusConfig = {
  pending: { label: 'Chờ xử lý', variant: 'warning' as const },
  confirmed: { label: 'Đã xác nhận', variant: 'default' as const },
  processing: { label: 'Đang xử lý', variant: 'default' as const },
  shipping: { label: 'Đang giao', variant: 'secondary' as const },
  delivered: { label: 'Đã giao', variant: 'success' as const },
  cancelled: { label: 'Đã hủy', variant: 'destructive' as const },
};

export function RecentOrders() {
  const recentOrders = orders.slice(0, 5);

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
        {recentOrders.map((order) => {
          const status = statusConfig[order.status];
          return (
            <div
              key={order.id}
              className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-card-foreground">{order.id}</span>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {order.customerName} • {order.items.length} sản phẩm
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-card-foreground">
                  {order.total.toLocaleString('vi-VN')}đ
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
