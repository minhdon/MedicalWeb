import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
// import { customers as initialCustomers } from '@/data/mockData';
import { Customer } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Search, Plus, Pencil, Trash2, Phone, Mail, MapPin, Key } from 'lucide-react';
import { toast } from 'sonner';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    password: '',
  });
  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch customers from API
  const fetchCustomers = async () => {
    try {
      const res = await fetch('http://127.0.0.1:3000/api/customer/getAll');
      const data = await res.json();
      if (data && data.data) {
        const mappedCustomers = data.data.map((c: any) => ({
          id: c._id,
          name: c.fullName || '',
          phone: c.phoneNum || '',
          email: c.email || '',
          address: c.address || '',
          createdAt: c.createdAt || new Date().toISOString(),
          totalOrders: c.totalOrders || 0,
          totalSpent: c.totalSpent || 0
        }));
        setCustomers(mappedCustomers);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      toast.error('Không thể tải danh sách khách hàng');
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(
    (customer) =>
      (customer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone || '').includes(searchTerm)
  );

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', address: '', password: '' });
    setEditingCustomer(null);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      password: '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone) {
      toast.error('Vui lòng điền tên và số điện thoại');
      return;
    }

    try {
      if (editingCustomer) {
        // Update existing customer
        const res = await fetch(`http://127.0.0.1:3000/api/customer/update/${editingCustomer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          toast.success('Đã cập nhật thông tin khách hàng');
          fetchCustomers(); // Refresh list
        } else {
          toast.error(data.message || 'Lỗi khi cập nhật');
        }
      } else {
        // Create new customer
        const res = await fetch('http://127.0.0.1:3000/api/customer/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            password: formData.password || undefined
          })
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          toast.success('Đã thêm khách hàng mới');
          fetchCustomers(); // Refresh list
        } else {
          // Show specific error message from backend
          toast.error(data.message || 'Lỗi khi thêm khách hàng');
          return; // Don't close dialog on error
        }
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error('Có lỗi kết nối đến server');
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const res = await fetch(`http://127.0.0.1:3000/api/customer/delete/${deleteId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success('Đã xóa khách hàng');
        fetchCustomers(); // Refresh list
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.message || 'Không thể xóa khách hàng');
      }
    } catch (error) {
      console.error('Delete request error:', error);
      toast.error('Lỗi kết nối khi xóa khách hàng');
    } finally {
      setDeleteId(null);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordId || !newPassword) return;

    if (newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    try {
      const res = await fetch(`http://127.0.0.1:3000/api/customer/${resetPasswordId}/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      });

      if (res.ok) {
        toast.success('Đặt lại mật khẩu thành công');
      } else {
        const data = await res.json();
        toast.error(data.message || 'Lỗi đặt lại mật khẩu');
      }
    } catch (error) {
      toast.error('Lỗi kết nối');
    } finally {
      setResetPasswordId(null);
      setNewPassword('');
    }
  };

  return (
    <DashboardLayout title="Quản lý khách hàng" subtitle="Thông tin và lịch sử khách hàng">
      <div className="rounded-xl bg-card p-6 card-shadow">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên hoặc số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Thêm khách hàng
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCustomer ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Họ tên *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Địa chỉ</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <Button onClick={handleSubmit} className="w-full">
                  {editingCustomer ? 'Cập nhật' : 'Thêm khách hàng'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.length === 0 ? (
            <div className="col-span-3 text-center py-10 text-muted-foreground">Chưa có khách hàng nào</div>
          ) : (
            filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow relative group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-card-foreground">{customer.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Khách hàng từ {new Date(customer.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(customer)} title="Chỉnh sửa">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setResetPasswordId(customer.id)} title="Đặt lại mật khẩu">
                      <Key className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(customer.id)} title="Xóa">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {customer.phone}
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {customer.email}
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5" />
                      <span className="line-clamp-2">{customer.address}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                  <div>
                    <p className="text-muted-foreground">Tổng đơn hàng</p>
                    <p className="font-semibold text-card-foreground">{customer.totalOrders}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Tổng chi tiêu</p>
                    <p className="font-semibold text-primary">
                      {customer.totalSpent.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </div>
              </div>
            )))}
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận xóa</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>Bạn có chắc chắn muốn xóa khách hàng này không? Hành động này không thể hoàn tác.</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)}>Hủy</Button>
              <Button variant="destructive" onClick={confirmDelete}>Xóa</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={!!resetPasswordId} onOpenChange={(open) => {
          if (!open) {
            setResetPasswordId(null);
            setNewPassword('');
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Đặt lại mật khẩu</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setResetPasswordId(null)}>Hủy</Button>
              <Button onClick={handleResetPassword}>Đặt lại mật khẩu</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
