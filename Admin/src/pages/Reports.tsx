import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2 } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:3000/api';
const COLORS = ['hsl(199, 89%, 48%)', 'hsl(160, 60%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(280, 65%, 60%)', 'hsl(0, 72%, 51%)'];

interface ReportStats {
  totalRevenue: number;
  totalStockValue: number;
  avgOrderValue: number;
  totalCustomers: number;
  revenueByStatus: { name: string; value: number }[];
  productsByCategory: { name: string; value: number }[];
  topProducts: { name: string; value: number; stock: number }[];
}

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReportStats>({
    totalRevenue: 0,
    totalStockValue: 0,
    avgOrderValue: 0,
    totalCustomers: 0,
    revenueByStatus: [],
    productsByCategory: [],
    topProducts: [],
  });

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);

        // Fetch all necessary data
        const [ordersRes, productsRes, customersRes] = await Promise.all([
          fetch(`${API_BASE}/sale-invoice/getAll`),
          fetch(`${API_BASE}/product/getAll?page=1&limit=1000`),
          fetch(`${API_BASE}/customer/getAll`),
        ]);

        const [ordersData, productsData, customersData] = await Promise.all([
          ordersRes.json(),
          productsRes.json(),
          customersRes.json(),
        ]);

        const orders = Array.isArray(ordersData) ? ordersData : [];
        const products = productsData?.data || [];
        const customers = customersData?.data || [];

        // Calculate revenue by status
        const statusMap: { [key: string]: number } = {};
        orders.forEach((order: any) => {
          const status = order.status || 'Unknown';
          statusMap[status] = (statusMap[status] || 0) + (order.total || 0);
        });
        const revenueByStatus = Object.entries(statusMap).map(([name, value]) => ({
          name: translateStatus(name),
          value,
        }));

        // Calculate products by category
        const categoryMap: { [key: string]: number } = {};
        products.forEach((product: any) => {
          const category = product.category || 'Khác';
          categoryMap[category] = (categoryMap[category] || 0) + 1;
        });
        const productsByCategory = Object.entries(categoryMap).map(([name, value]) => ({
          name,
          value,
        }));

        // Top products by stock value
        const topProducts = products
          .map((p: any) => ({
            name: p.productName?.length > 20 ? p.productName.substring(0, 20) + '...' : (p.productName || 'Unknown'),
            value: (p.quantity || 0) * (p.price || 0),
            stock: p.quantity || 0,
          }))
          .sort((a: any, b: any) => b.value - a.value)
          .slice(0, 10);

        // Calculate totals
        const completedOrders = orders.filter((o: any) =>
          ['Completed', 'Delivered', 'Đã giao', 'Hoàn thành'].includes(o.status)
        );
        const totalRevenue = completedOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
        const totalStockValue = products.reduce((sum: number, p: any) =>
          sum + ((p.quantity || 0) * (p.price || 0)), 0
        );
        const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

        setStats({
          totalRevenue,
          totalStockValue,
          avgOrderValue,
          totalCustomers: customers.length,
          revenueByStatus,
          productsByCategory,
          topProducts,
        });

      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  const translateStatus = (status: string) => {
    const translations: { [key: string]: string } = {
      'Pending': 'Chờ xử lý',
      'Confirmed': 'Đã xác nhận',
      'Processing': 'Đang xử lý',
      'Completed': 'Hoàn thành',
      'Cancelled': 'Đã hủy',
      'Delivered': 'Đã giao',
    };
    return translations[status] || status;
  };

  if (loading) {
    return (
      <DashboardLayout title="Báo cáo thống kê" subtitle="Tổng quan hoạt động kinh doanh">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Báo cáo thống kê" subtitle="Tổng quan hoạt động kinh doanh">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng doanh thu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{stats.totalRevenue.toLocaleString('vi-VN')}đ</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Giá trị tồn kho</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-secondary">{stats.totalStockValue.toLocaleString('vi-VN')}đ</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Giá trị đơn TB</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{Math.round(stats.avgOrderValue).toLocaleString('vi-VN')}đ</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng khách hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalCustomers}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue by Order Status */}
        <Card>
          <CardHeader>
            <CardTitle>Doanh thu theo trạng thái đơn hàng</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.revenueByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.revenueByStatus}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000)}K`} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toLocaleString('vi-VN')}đ`, 'Doanh thu']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu đơn hàng</p>
            )}
          </CardContent>
        </Card>

        {/* Products by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Sản phẩm theo danh mục</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.productsByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.productsByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.productsByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu sản phẩm</p>
            )}
          </CardContent>
        </Card>

        {/* Stock Value by Product */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top 10 sản phẩm theo giá trị tồn kho</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <YAxis dataKey="name" type="category" width={150} className="text-xs" />
                  <Tooltip
                    formatter={(value: number) => [`${value.toLocaleString('vi-VN')}đ`, 'Giá trị']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--secondary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu tồn kho</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
