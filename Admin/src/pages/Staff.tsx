import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Search, Plus, Pencil, Trash2, Key, Power, Check, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const API_BASE = 'http://127.0.0.1:3000/api';

interface Staff {
    id: string;
    fullName: string;
    userName: string;
    email: string;
    phoneNum: string;
    address: string;
    role: string;
    roleId: string;
    warehouse: { id: string; name: string; address: string } | null;
    warehouseId: string | null;
    isActive: boolean;
    createdAt: string;
}

interface Role {
    id: string;
    name: string;
    description: string;
}

interface Warehouse {
    id: string;
    name: string;
    address: string;
}

export default function Staff() {
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [resetPasswordId, setResetPasswordId] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState('');

    const [formData, setFormData] = useState({
        fullName: '',
        userName: '',
        email: '',
        passWord: '',
        phoneNum: '',
        address: '',
        roleId: '',
        warehouseId: '',
    });

    // Fetch staff list
    const fetchStaff = async () => {
        try {
            const res = await fetch(`${API_BASE}/staff`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setStaffList(data);
            }
        } catch (error) {
            console.error('Failed to fetch staff:', error);
            toast.error('Không thể tải danh sách nhân viên');
        }
    };

    // Fetch roles
    const fetchRoles = async () => {
        try {
            const res = await fetch(`${API_BASE}/staff/roles`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setRoles(data);
            }
        } catch (error) {
            console.error('Failed to fetch roles:', error);
        }
    };

    // Fetch warehouses
    const fetchWarehouses = async () => {
        try {
            const res = await fetch(`${API_BASE}/warehouse/getAll`);
            const data = await res.json();
            if (data && data.data) {
                setWarehouses(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch warehouses:', error);
        }
    };

    useEffect(() => {
        fetchStaff();
        fetchRoles();
        fetchWarehouses();
    }, []);

    const filteredStaff = staffList.filter(
        (staff) =>
            staff.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            staff.phoneNum?.includes(searchTerm)
    );

    const resetForm = () => {
        setFormData({
            fullName: '',
            userName: '',
            email: '',
            passWord: '',
            phoneNum: '',
            address: '',
            roleId: '',
            warehouseId: '',
        });
        setEditingStaff(null);
    };

    const handleEdit = (staff: Staff) => {
        setEditingStaff(staff);
        setFormData({
            fullName: staff.fullName,
            userName: staff.userName,
            email: staff.email,
            passWord: '',
            phoneNum: staff.phoneNum || '',
            address: staff.address || '',
            roleId: staff.roleId || '',
            warehouseId: staff.warehouseId || '',
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.fullName || !formData.email) {
            toast.error('Vui lòng điền tên và email');
            return;
        }

        if (!editingStaff && !formData.passWord) {
            toast.error('Vui lòng nhập mật khẩu');
            return;
        }

        try {
            if (editingStaff) {
                // Update
                const res = await fetch(`${API_BASE}/staff/${editingStaff.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fullName: formData.fullName,
                        email: formData.email,
                        phoneNum: formData.phoneNum,
                        address: formData.address,
                        roleId: formData.roleId || undefined,
                        warehouseId: formData.warehouseId || null,
                    }),
                });

                const data = await res.json();
                if (res.ok) {
                    toast.success('Cập nhật nhân viên thành công');
                    fetchStaff();
                } else {
                    toast.error(data.message || 'Lỗi cập nhật');
                    return;
                }
            } else {
                // Create
                const res = await fetch(`${API_BASE}/staff`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fullName: formData.fullName,
                        userName: formData.userName || formData.email,
                        email: formData.email,
                        passWord: formData.passWord,
                        phoneNum: formData.phoneNum,
                        address: formData.address,
                        roleId: formData.roleId || undefined,
                        warehouseId: formData.warehouseId || null,
                    }),
                });

                const data = await res.json();
                if (res.ok) {
                    toast.success('Thêm nhân viên thành công');
                    fetchStaff();
                } else {
                    toast.error(data.message || 'Lỗi thêm nhân viên');
                    return;
                }
            }
            setIsDialogOpen(false);
            resetForm();
        } catch (error) {
            console.error(error);
            toast.error('Lỗi kết nối server');
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            const res = await fetch(`${API_BASE}/staff/${deleteId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success('Đã xóa nhân viên');
                fetchStaff();
            } else {
                const data = await res.json();
                toast.error(data.message || 'Lỗi xóa nhân viên');
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
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
            const res = await fetch(`${API_BASE}/staff/${resetPasswordId}/reset-password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword }),
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

    const handleToggleStatus = async (staff: Staff) => {
        try {
            const res = await fetch(`${API_BASE}/staff/${staff.id}/toggle-status`, {
                method: 'PUT',
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(data.message);
                fetchStaff();
            } else {
                toast.error('Lỗi thay đổi trạng thái');
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
        }
    };

    const handleRoleChange = async (staffId: string, roleId: string) => {
        try {
            const res = await fetch(`${API_BASE}/staff/${staffId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roleId }),
            });

            if (res.ok) {
                toast.success('Đã cập nhật vai trò');
                fetchStaff();
            } else {
                toast.error('Lỗi cập nhật vai trò');
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
        }
    };

    return (
        <DashboardLayout title="Quản lý nhân viên" subtitle="Quản lý tài khoản và phân quyền nhân viên">
            <div className="rounded-xl bg-card p-6 card-shadow">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Tìm theo tên, email, SĐT..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <Dialog
                        open={isDialogOpen}
                        onOpenChange={(open) => {
                            setIsDialogOpen(open);
                            if (!open) resetForm();
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Thêm nhân viên
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingStaff ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName">Họ tên *</Label>
                                        <Input
                                            id="fullName"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {!editingStaff && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="userName">Tên đăng nhập</Label>
                                            <Input
                                                id="userName"
                                                value={formData.userName}
                                                placeholder="Để trống = dùng email"
                                                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="passWord">Mật khẩu *</Label>
                                            <Input
                                                id="passWord"
                                                type="password"
                                                value={formData.passWord}
                                                onChange={(e) => setFormData({ ...formData, passWord: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phoneNum">Số điện thoại</Label>
                                        <Input
                                            id="phoneNum"
                                            value={formData.phoneNum}
                                            onChange={(e) => setFormData({ ...formData, phoneNum: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="roleId">Vai trò</Label>
                                        <Select
                                            value={formData.roleId}
                                            onValueChange={(value) => setFormData({ ...formData, roleId: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn vai trò" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles.map((role) => (
                                                    <SelectItem key={role.id} value={role.id}>
                                                        {role.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="warehouseId">Chi nhánh làm việc</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="w-full justify-between font-normal"
                                            >
                                                {formData.warehouseId
                                                    ? warehouses.find((wh) => wh.id === formData.warehouseId)?.name
                                                    : "Chọn chi nhánh..."}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Tìm chi nhánh..." />
                                                <CommandList>
                                                    <CommandEmpty>Không tìm thấy chi nhánh</CommandEmpty>
                                                    <CommandGroup>
                                                        <CommandItem
                                                            value="none"
                                                            onSelect={() => setFormData({ ...formData, warehouseId: '' })}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    !formData.warehouseId ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            Không gán chi nhánh
                                                        </CommandItem>
                                                        {warehouses.map((wh) => (
                                                            <CommandItem
                                                                key={wh.id}
                                                                value={wh.name}
                                                                onSelect={() => setFormData({ ...formData, warehouseId: wh.id })}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        formData.warehouseId === wh.id ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {wh.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
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
                                    {editingStaff ? 'Cập nhật' : 'Thêm nhân viên'}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nhân viên</TableHead>
                                <TableHead>Email / SĐT</TableHead>
                                <TableHead>Chi nhánh</TableHead>
                                <TableHead>Vai trò</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredStaff.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        Chưa có nhân viên nào
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredStaff.map((staff) => (
                                    <TableRow key={staff.id}>
                                        <TableCell>
                                            <div className="font-medium">{staff.fullName}</div>
                                            <div className="text-sm text-muted-foreground">@{staff.userName}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div>{staff.email}</div>
                                            <div className="text-sm text-muted-foreground">{staff.phoneNum}</div>
                                        </TableCell>
                                        <TableCell>
                                            {staff.warehouse?.name || (
                                                <span className="text-muted-foreground">Chưa gán</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={staff.roleId}
                                                onValueChange={(value) => handleRoleChange(staff.id, value)}
                                            >
                                                <SelectTrigger className="w-[120px] h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.map((role) => (
                                                        <SelectItem key={role.id} value={role.id}>
                                                            {role.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={staff.isActive ? 'default' : 'destructive'}>
                                                {staff.isActive ? 'Hoạt động' : 'Vô hiệu'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(staff)}
                                                    title="Chỉnh sửa"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setResetPasswordId(staff.id)}
                                                    title="Đặt lại mật khẩu"
                                                >
                                                    <Key className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleToggleStatus(staff)}
                                                    title={staff.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                                >
                                                    <Power className={`h-4 w-4 ${staff.isActive ? 'text-green-500' : 'text-red-500'}`} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeleteId(staff.id)}
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa nhân viên</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p>Bạn có chắc chắn muốn xóa nhân viên này không?</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Hành động này không thể hoàn tác.
                        </p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setDeleteId(null)}>
                            Hủy
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Xóa
                        </Button>
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
                        <Button variant="outline" onClick={() => setResetPasswordId(null)}>
                            Hủy
                        </Button>
                        <Button onClick={handleResetPassword}>
                            Đặt lại mật khẩu
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
