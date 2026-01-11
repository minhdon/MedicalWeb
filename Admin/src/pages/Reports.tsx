import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { orders, medicines, customers } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

const COLORS = ['hsl(199, 89%, 48%)', 'hsl(160, 60%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(280, 65%, 60%)', 'hsl(0, 72%, 51%)'];

export default function Reports() {
  // Revenue by status
  const revenueByStatus = [
    { name: 'Chờ xử lý', value: orders.filter(o => o.status === 'pending').reduce((sum, o) => sum + o.total, 0) },
    { name: 'Đã xác nhận', value: orders.filter(o => o.status === 'confirmed').reduce((sum, o) => sum + o.total, 0) },
    { name: 'Đang giao', value: orders.filter(o => o.status === 'shipping').reduce((sum, o) => sum + o.total, 0) },
    { name: 'Đã giao', value: orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0) },
  ];

  // Products by category
  const productsByCategory = medicines.reduce((acc, med) => {
    const existing = acc.find(item => item.name === med.category);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: med.category, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Stock value by product
  const stockValue = medicines.map(med => ({
    name: med.name.length > 15 ? med.name.substring(0, 15) + '...' : med.name,
    value: med.stock * med.costPrice,
    stock: med.stock,
  }));

  // Total metrics
  const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const totalProducts = medicines.length;
  const totalCustomers = customers.length;
  const totalStockValue = medicines.reduce((sum, m) => sum + m.stock * m.costPrice, 0);
  const avgOrderValue = totalRevenue / orders.filter(o => o.status === 'delivered').length || 0;

  return (
    <DashboardLayout title="Báo cáo thống kê" subtitle="Tổng quan hoạt động kinh doanh">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng doanh thu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{totalRevenue.toLocaleString('vi-VN')}đ</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Giá trị tồn kho</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-secondary">{totalStockValue.toLocaleString('vi-VN')}đ</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Giá trị đơn TB</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{Math.round(avgOrderValue).toLocaleString('vi-VN')}đ</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng khách hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalCustomers}</p>
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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByStatus}>
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
          </CardContent>
        </Card>

        {/* Products by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Sản phẩm theo danh mục</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={productsByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {productsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stock Value */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Giá trị tồn kho theo sản phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stockValue} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                <YAxis dataKey="name" type="category" width={120} className="text-xs" />
                <Tooltip 
                  formatter={(value: number) => [`${value.toLocaleString('vi-VN')}đ`, 'Giá trị']}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="value" fill="hsl(var(--secondary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
