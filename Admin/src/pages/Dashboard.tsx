import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentOrders } from '@/components/dashboard/RecentOrders';
import { LowStockAlert } from '@/components/dashboard/LowStockAlert';
import { ShoppingCart, Package, Users, TrendingUp } from 'lucide-react';
import { orders, medicines, customers } from '@/data/mockData';

export default function Dashboard() {
  const totalRevenue = orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrders = orders.filter((o) => o.status === 'pending').length;

  return (
    <DashboardLayout title="Tổng quan" subtitle="Chào mừng trở lại, Admin">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Doanh thu hôm nay"
          value={`${(totalRevenue / 1000000).toFixed(1)}M`}
          change="+12.5% so với hôm qua"
          changeType="positive"
          icon={TrendingUp}
          iconBgColor="bg-success/10"
        />
        <StatCard
          title="Đơn hàng chờ xử lý"
          value={pendingOrders}
          change={`${orders.length} đơn hôm nay`}
          changeType="neutral"
          icon={ShoppingCart}
          iconBgColor="bg-warning/10"
        />
        <StatCard
          title="Tổng sản phẩm"
          value={medicines.length}
          change="5 sản phẩm mới"
          changeType="positive"
          icon={Package}
          iconBgColor="bg-primary/10"
        />
        <StatCard
          title="Khách hàng"
          value={customers.length}
          change="+3 khách mới tuần này"
          changeType="positive"
          icon={Users}
          iconBgColor="bg-secondary/10"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentOrders />
        </div>
        <div>
          <LowStockAlert />
        </div>
      </div>
    </DashboardLayout>
  );
}
