import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, ArrowRight, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = 'http://127.0.0.1:3000/api';

interface Transfer {
    _id: string;
    fromWarehouseId: { _id: string; warehouseName: string };
    toWarehouseId: { _id: string; warehouseName: string };
    productBatchId: {
        _id: string;
        productId: { productName: string };
        remainingQuantity: number;
    };
    quantity: number;
    status: 'Pending' | 'Completed' | 'Cancelled';
    note?: string;
    createdAt: string;
    transferDate?: string;
}

interface Warehouse {
    id: string;
    name: string;
}

interface Batch {
    _id: string;
    productId: { productName: string };
    remainingQuantity: number;
    warehouseId: string;
}

export default function Transfers() {
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form state
    const [fromWarehouse, setFromWarehouse] = useState('');
    const [toWarehouse, setToWarehouse] = useState('');
    const [selectedBatch, setSelectedBatch] = useState('');
    const [quantity, setQuantity] = useState('');
    const [note, setNote] = useState('');

    // Fetch transfers
    const fetchTransfers = async () => {
        try {
            const res = await fetch(`${API_BASE}/transfer/getAll`);
            const data = await res.json();
            setTransfers(data.data || []);
        } catch (error) {
            toast.error('Lỗi khi tải danh sách chuyển kho');
        } finally {
            setLoading(false);
        }
    };

    // Fetch warehouses
    const fetchWarehouses = async () => {
        try {
            const res = await fetch(`${API_BASE}/warehouse/getAll`);
            const data = await res.json();
            setWarehouses(data.data || []);
        } catch (error) {
            console.error('Error fetching warehouses:', error);
        }
    };

    // Fetch batches for selected warehouse
    const fetchBatches = async (warehouseId: string) => {
        try {
            const res = await fetch(`${API_BASE}/product/batches?warehouseId=${warehouseId}`);
            const data = await res.json();
            setBatches(data || []);
        } catch (error) {
            console.error('Error fetching batches:', error);
        }
    };

    useEffect(() => {
        fetchTransfers();
        fetchWarehouses();
    }, []);

    useEffect(() => {
        if (fromWarehouse) {
            fetchBatches(fromWarehouse);
        }
    }, [fromWarehouse]);

    // Create transfer
    const handleCreate = async () => {
        if (!fromWarehouse || !toWarehouse || !selectedBatch || !quantity) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }

        if (fromWarehouse === toWarehouse) {
            toast.error('Kho nguồn và kho đích không được trùng nhau');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/transfer/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromWarehouseId: fromWarehouse,
                    toWarehouseId: toWarehouse,
                    productBatchId: selectedBatch,
                    quantity: parseInt(quantity),
                    note
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            toast.success('Tạo phiếu chuyển kho thành công');
            setIsDialogOpen(false);
            resetForm();
            fetchTransfers();
        } catch (error: any) {
            toast.error(error.message || 'Lỗi khi tạo phiếu');
        }
    };

    // Complete transfer
    const handleComplete = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE}/transfer/complete/${id}`, {
                method: 'PUT'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            toast.success('Chuyển kho thành công');
            fetchTransfers();
        } catch (error: any) {
            toast.error(error.message || 'Lỗi khi hoàn thành');
        }
    };

    // Cancel transfer
    const handleCancel = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE}/transfer/cancel/${id}`, {
                method: 'PUT'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            toast.success('Đã hủy phiếu chuyển kho');
            fetchTransfers();
        } catch (error: any) {
            toast.error(error.message || 'Lỗi khi hủy');
        }
    };

    const resetForm = () => {
        setFromWarehouse('');
        setToWarehouse('');
        setSelectedBatch('');
        setQuantity('');
        setNote('');
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Pending':
                return <Badge variant="outline" className="bg-yellow-100 text-yellow-700">Chờ xử lý</Badge>;
            case 'Completed':
                return <Badge variant="outline" className="bg-green-100 text-green-700">Hoàn thành</Badge>;
            case 'Cancelled':
                return <Badge variant="outline" className="bg-red-100 text-red-700">Đã hủy</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <DashboardLayout title="Chuyển Kho">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Chuyển Kho</h1>
                        <p className="text-gray-500 mt-1">Quản lý việc chuyển hàng giữa các kho</p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Tạo phiếu chuyển
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Tạo Phiếu Chuyển Kho</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="grid gap-4">
                                    <div>
                                        <Label>Kho nguồn</Label>
                                        <Select value={fromWarehouse} onValueChange={setFromWarehouse}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn kho nguồn" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {warehouses.map((wh) => (
                                                    <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Kho đích</Label>
                                        <Select value={toWarehouse} onValueChange={setToWarehouse}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn kho đích" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {warehouses.filter(wh => wh.id !== fromWarehouse).map((wh) => (
                                                    <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Lô hàng</Label>
                                        <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn lô hàng" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {batches.map((batch) => (
                                                    <SelectItem key={batch._id} value={batch._id}>
                                                        {batch.productId?.productName} (Còn: {batch.remainingQuantity})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Số lượng</Label>
                                        <Input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            placeholder="Nhập số lượng chuyển"
                                        />
                                    </div>

                                    <div>
                                        <Label>Ghi chú</Label>
                                        <Input
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            placeholder="Ghi chú (tùy chọn)"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Hủy
                                    </Button>
                                    <Button onClick={handleCreate}>
                                        Tạo phiếu
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Transfer List */}
                <div className="bg-white rounded-lg shadow">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Sản phẩm</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Chuyển từ</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Đến</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Số lượng</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Trạng thái</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ngày tạo</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                            Đang tải...
                                        </td>
                                    </tr>
                                ) : transfers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                            Chưa có phiếu chuyển kho nào
                                        </td>
                                    </tr>
                                ) : (
                                    transfers.map((transfer) => (
                                        <tr key={transfer._id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm font-medium">
                                                {transfer.productBatchId?.productId?.productName || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {transfer.fromWarehouseId?.warehouseName || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="flex items-center gap-1">
                                                    <ArrowRight className="w-4 h-4 text-gray-400" />
                                                    {transfer.toWarehouseId?.warehouseName || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium">
                                                {transfer.quantity}
                                            </td>
                                            <td className="px-4 py-3">
                                                {getStatusBadge(transfer.status)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {new Date(transfer.createdAt).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {transfer.status === 'Pending' && (
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            className="bg-green-600 hover:bg-green-700"
                                                            onClick={() => handleComplete(transfer._id)}
                                                        >
                                                            <Check className="w-4 h-4 mr-1" />
                                                            Hoàn thành
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-red-600 hover:bg-red-50"
                                                            onClick={() => handleCancel(transfer._id)}
                                                        >
                                                            <X className="w-4 h-4 mr-1" />
                                                            Hủy
                                                        </Button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
