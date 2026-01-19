import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Warehouse, Package, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = 'http://localhost:3000';

interface WarehouseType {
    id: string;
    name: string;
    address?: string;
}

interface BatchStock {
    productId: string;
    productName: string;
    baseUnit: string;
    totalQuantity: number;
    batches: number;
    earliestExpiry: string;
}

export default function BranchInventory() {
    const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
    const [stock, setStock] = useState<BatchStock[]>([]);
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState({ totalProducts: 0, totalQuantity: 0, totalBatches: 0 });

    // Fetch warehouses
    useEffect(() => {
        const fetchWarehouses = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/warehouse/getAll`);
                const data = await res.json();
                setWarehouses(data.data || []);
            } catch (error) {
                toast.error('Lỗi tải danh sách kho');
            }
        };
        fetchWarehouses();
    }, []);

    // Fetch stock when warehouse changes
    useEffect(() => {
        if (!selectedWarehouse) {
            setStock([]);
            setSummary({ totalProducts: 0, totalQuantity: 0, totalBatches: 0 });
            return;
        }

        const fetchStock = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/api/warehouse/${selectedWarehouse}/stock`);
                const data = await res.json();

                if (data.success) {
                    setStock(data.data || []);
                    setSummary(data.summary || { totalProducts: 0, totalQuantity: 0, totalBatches: 0 });
                } else {
                    setStock([]);
                    setSummary({ totalProducts: 0, totalQuantity: 0, totalBatches: 0 });
                }
            } catch (error) {
                toast.error('Lỗi tải tồn kho');
                setStock([]);
            } finally {
                setLoading(false);
            }
        };
        fetchStock();
    }, [selectedWarehouse]);

    const selectedWarehouseData = warehouses.find(w => w.id === selectedWarehouse);

    return (
        <DashboardLayout title="Kho Chi Nhánh">
            <div className="space-y-6">
                {/* Warehouse Selector */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Warehouse className="h-5 w-5" />
                            Chọn Kho
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                            <SelectTrigger className="w-full max-w-md">
                                <SelectValue placeholder="Chọn kho để xem tồn kho" />
                            </SelectTrigger>
                            <SelectContent>
                                {warehouses.map((wh) => (
                                    <SelectItem key={wh.id} value={wh.id}>
                                        {wh.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {selectedWarehouse && (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Sản phẩm</p>
                                            <p className="text-2xl font-bold">{summary.totalProducts}</p>
                                        </div>
                                        <Package className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Tổng số lượng</p>
                                            <p className="text-2xl font-bold">{summary.totalQuantity.toLocaleString()}</p>
                                        </div>
                                        <ArrowLeftRight className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Lô hàng</p>
                                            <p className="text-2xl font-bold">{summary.totalBatches}</p>
                                        </div>
                                        <Warehouse className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Warehouse Info */}
                        {selectedWarehouseData && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">📍 {selectedWarehouseData.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedWarehouseData.address || 'Không có địa chỉ'}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Stock Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Danh sách tồn kho</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="text-center py-8">Đang tải...</div>
                                ) : stock.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Kho này chưa có hàng
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Sản phẩm</TableHead>
                                                <TableHead className="text-right">Số lượng</TableHead>
                                                <TableHead>Đơn vị</TableHead>
                                                <TableHead className="text-right">Số lô</TableHead>
                                                <TableHead>Hạn sử dụng gần nhất</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {stock.map((item) => (
                                                <TableRow key={item.productId}>
                                                    <TableCell className="font-medium">
                                                        {item.productName}
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold">
                                                        {item.totalQuantity.toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{item.baseUnit}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">{item.batches}</TableCell>
                                                    <TableCell>
                                                        {item.earliestExpiry
                                                            ? new Date(item.earliestExpiry).toLocaleDateString('vi-VN')
                                                            : '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
