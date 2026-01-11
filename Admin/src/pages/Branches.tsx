import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { branches as initialBranches } from '@/data/mockData';
import { Branch } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Pencil, Building2, Phone, User, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function Branches() {
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    manager: '',
    isActive: true,
  });

  const resetForm = () => {
    setFormData({ name: '', address: '', phone: '', manager: '', isActive: true });
    setEditingBranch(null);
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      manager: branch.manager,
      isActive: branch.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.address) {
      toast.error('Vui lòng điền tên và địa chỉ chi nhánh');
      return;
    }

    if (editingBranch) {
      setBranches((prev) =>
        prev.map((b) =>
          b.id === editingBranch.id ? { ...b, ...formData } : b
        )
      );
      toast.success('Đã cập nhật thông tin chi nhánh');
    } else {
      const newBranch: Branch = {
        id: Date.now().toString(),
        ...formData,
      };
      setBranches((prev) => [...prev, newBranch]);
      toast.success('Đã thêm chi nhánh mới');
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const toggleBranchStatus = (id: string) => {
    setBranches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b))
    );
  };

  return (
    <DashboardLayout title="Quản lý chi nhánh" subtitle="Các cơ sở giao hàng">
      <div className="flex justify-end mb-6">
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Thêm chi nhánh
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingBranch ? 'Chỉnh sửa chi nhánh' : 'Thêm chi nhánh mới'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên chi nhánh *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Địa chỉ *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manager">Quản lý</Label>
                <Input
                  id="manager"
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Đang hoạt động</Label>
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingBranch ? 'Cập nhật' : 'Thêm chi nhánh'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {branches.map((branch) => (
          <div
            key={branch.id}
            className={`rounded-xl bg-card p-6 card-shadow border-l-4 ${
              branch.isActive ? 'border-l-success' : 'border-l-muted'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-card-foreground">{branch.name}</h3>
                  <Badge variant={branch.isActive ? 'success' : 'secondary'}>
                    {branch.isActive ? 'Đang hoạt động' : 'Tạm ngưng'}
                  </Badge>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleEdit(branch)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">{branch.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{branch.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Quản lý: {branch.manager}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Trạng thái hoạt động</span>
              <Switch
                checked={branch.isActive}
                onCheckedChange={() => toggleBranchStatus(branch.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
