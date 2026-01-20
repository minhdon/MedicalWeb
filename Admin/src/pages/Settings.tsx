import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Store, Bell, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = 'http://127.0.0.1:3000/api';

interface SettingsData {
  storeName: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  notifyNewOrder: boolean;
  notifyLowStock: boolean;
  notifyExpiry: boolean;
  notifyEmail: boolean;
  enable2FA: boolean;
}

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    storeName: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    notifyNewOrder: true,
    notifyLowStock: true,
    notifyExpiry: true,
    notifyEmail: false,
    enable2FA: false,
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/settings`);
        const data = await res.json();
        if (res.ok) {
          setSettings({
            storeName: data.storeName || '',
            phone: data.phone || '',
            email: data.email || '',
            website: data.website || '',
            address: data.address || '',
            notifyNewOrder: data.notifyNewOrder ?? true,
            notifyLowStock: data.notifyLowStock ?? true,
            notifyExpiry: data.notifyExpiry ?? true,
            notifyEmail: data.notifyEmail ?? false,
            enable2FA: data.enable2FA ?? false,
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Không thể tải cài đặt');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Đã lưu cài đặt thành công');
      } else {
        toast.error(data.message || 'Lỗi lưu cài đặt');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Lỗi kết nối server');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Mật khẩu mới không khớp');
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    // TODO: Implement password change API
    toast.info('Chức năng đổi mật khẩu sẽ được triển khai');
    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  if (loading) {
    return (
      <DashboardLayout title="Cài đặt" subtitle="Quản lý cấu hình hệ thống">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Cài đặt" subtitle="Quản lý cấu hình hệ thống">
      <div className="grid gap-6 max-w-4xl">
        {/* Store Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Thông tin nhà thuốc</CardTitle>
                <CardDescription>Cập nhật thông tin cơ bản</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="storeName">Tên nhà thuốc</Label>
                <Input
                  id="storeName"
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={settings.website}
                  onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input
                id="address"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-warning" />
              </div>
              <div>
                <CardTitle>Thông báo</CardTitle>
                <CardDescription>Cấu hình thông báo hệ thống</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Thông báo đơn hàng mới</p>
                <p className="text-sm text-muted-foreground">Nhận thông báo khi có đơn hàng mới</p>
              </div>
              <Switch
                checked={settings.notifyNewOrder}
                onCheckedChange={(checked) => setSettings({ ...settings, notifyNewOrder: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Cảnh báo tồn kho thấp</p>
                <p className="text-sm text-muted-foreground">Thông báo khi sản phẩm sắp hết hàng</p>
              </div>
              <Switch
                checked={settings.notifyLowStock}
                onCheckedChange={(checked) => setSettings({ ...settings, notifyLowStock: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Cảnh báo hạn sử dụng</p>
                <p className="text-sm text-muted-foreground">Thông báo sản phẩm gần hết hạn</p>
              </div>
              <Switch
                checked={settings.notifyExpiry}
                onCheckedChange={(checked) => setSettings({ ...settings, notifyExpiry: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Thông báo qua email</p>
                <p className="text-sm text-muted-foreground">Gửi bản tóm tắt hàng ngày qua email</p>
              </div>
              <Switch
                checked={settings.notifyEmail}
                onCheckedChange={(checked) => setSettings({ ...settings, notifyEmail: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <CardTitle>Bảo mật</CardTitle>
                <CardDescription>Cài đặt bảo mật tài khoản</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Xác thực hai yếu tố</p>
                <p className="text-sm text-muted-foreground">Bảo vệ tài khoản với 2FA</p>
              </div>
              <Switch
                checked={settings.enable2FA}
                onCheckedChange={(checked) => setSettings({ ...settings, enable2FA: checked })}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Đổi mật khẩu</Label>
              <div className="grid gap-2">
                <Input
                  type="password"
                  placeholder="Mật khẩu hiện tại"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                />
                <Input
                  type="password"
                  placeholder="Mật khẩu mới"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                />
                <Input
                  type="password"
                  placeholder="Xác nhận mật khẩu mới"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                />
              </div>
              <Button
                variant="outline"
                onClick={handleChangePassword}
                disabled={!passwords.currentPassword || !passwords.newPassword}
              >
                Đổi mật khẩu
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu cài đặt
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
