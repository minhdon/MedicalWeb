import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentOrders } from '@/components/dashboard/RecentOrders';
import { LowStockAlert } from '@/components/dashboard/LowStockAlert';
import { ShoppingCart, Package, Users, TrendingUp, Warehouse, ArrowLeftRight } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:3000/api';

interface DashboardStats {
  totalRevenue: number;
  todayRevenue: number;
  pendingOrders: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  totalWarehouses: number;
  totalTransfers: number;
  pendingTransfers: number;
  lowStockCount: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalWarehouses: 0,
    totalTransfers: 0,
    pendingTransfers: 0,
    lowStockCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);

        // Fetch all data in parallel
        const [ordersRes, productsRes, customersRes, warehousesRes, transfersRes] = await Promise.all([
          fetch(`${API_BASE}/sale-invoice/getAll`),
          fetch(`${API_BASE}/product/getAll?page=1&limit=1000`),
          fetch(`${API_BASE}/customer/getAll`),
          fetch(`${API_BASE}/warehouse/getAll`),
          fetch(`${API_BASE}/transfer/getAll`)
        ]);

        const [ordersData, productsData, customersData, warehousesData, transfersData] = await Promise.all([
          ordersRes.json(),
          productsRes.json(),
          customersRes.json(),
          warehousesRes.json(),
          transfersRes.json()
        ]);

        // Calculate stats
        const orders = Array.isArray(ordersData) ? ordersData : [];
        const products = productsData?.data || [];
        const customers = customersData?.data || [];
        const warehouses = warehousesData?.data || [];
        const transfers = transfersData?.data || [];

        // Revenue calculations
        const today = new Date().toDateString();
        const completedOrders = orders.filter((o: any) =>
          o.status?.toLowerCase() === 'completed' || o.status?.toLowerCase() === 'delivered'
        );
        const totalRevenue = completedOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);

        const todayOrders = orders.filter((o: any) =>
          new Date(o.createdAt).toDateString() === today
        );
        const todayRevenue = todayOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);

        // Pending orders
        const pendingOrders = orders.filter((o: any) =>
          o.status?.toLowerCase() === 'pending' || o.status?.toLowerCase() === 'chờ xử lý'
        ).length;

        // Low stock products (less than 10)
        const lowStockCount = products.filter((p: any) => (p.quantity || 0) < 10).length;

        // Pending transfers
        const pendingTransfers = transfers.filter((t: any) => t.status === 'Pending').length;

        setStats({
          totalRevenue,
          todayRevenue,
          pendingOrders,
          totalOrders: orders.length,
          totalProducts: products.length,
          totalCustomers: customers.length,
          totalWarehouses: warehouses.length,
          totalTransfers: transfers.length,
          pendingTransfers,
          lowStockCount
        });

      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toLocaleString('vi-VN');
  };

  return (
    <DashboardLayout title="Tổng quan" subtitle="Chào mừng trở lại, Admin">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Doanh thu tổng"
          value={loading ? '...' : `${formatCurrency(stats.totalRevenue)}đ`}
          change={`Hôm nay: ${formatCurrency(stats.todayRevenue)}đ`}
          changeType="positive"
          icon={TrendingUp}
          iconBgColor="bg-success/10"
        />
        <StatCard
          title="Đơn hàng chờ xử lý"
          value={loading ? '...' : stats.pendingOrders}
          change={`Tổng: ${stats.totalOrders} đơn`}
          changeType={stats.pendingOrders > 0 ? 'negative' : 'neutral'}
          icon={ShoppingCart}
          iconBgColor="bg-warning/10"
        />
        <StatCard
          title="Tổng sản phẩm"
          value={loading ? '...' : stats.totalProducts}
          change={stats.lowStockCount > 0 ? `${stats.lowStockCount} sắp hết hàng` : 'Đầy đủ hàng'}
          changeType={stats.lowStockCount > 0 ? 'negative' : 'positive'}
          icon={Package}
          iconBgColor="bg-primary/10"
        />
        <StatCard
          title="Khách hàng"
          value={loading ? '...' : stats.totalCustomers}
          change="Tổng số khách hàng"
          changeType="neutral"
          icon={Users}
          iconBgColor="bg-secondary/10"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-6">
        <StatCard
          title="Kho hàng"
          value={loading ? '...' : stats.totalWarehouses}
          change="Chi nhánh hoạt động"
          changeType="neutral"
          icon={Warehouse}
          iconBgColor="bg-blue-500/10"
        />
        <StatCard
          title="Phiếu chuyển kho"
          value={loading ? '...' : stats.totalTransfers}
          change={stats.pendingTransfers > 0 ? `${stats.pendingTransfers} đang chờ` : 'Không có chờ'}
          changeType={stats.pendingTransfers > 0 ? 'negative' : 'positive'}
          icon={ArrowLeftRight}
          iconBgColor="bg-purple-500/10"
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
