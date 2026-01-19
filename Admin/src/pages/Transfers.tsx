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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus, ArrowRight, Check, X, Trash2, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = 'http://127.0.0.1:3000/api';

interface Transfer {
    _id: string;
    fromWarehouseId: { _id: string; warehouseName: string };
    toWarehouseId: { _id: string; warehouseName: string };
    products: Array<{
        productId: { _id: string; productName: string, unit?: string };
        quantity: number;
    }>;
    status: 'Pending' | 'Completed' | 'Cancelled';
    note?: string;
    createdAt: string;
    transferDate?: string;
}

interface Warehouse {
    id: string;
    name: string;
}

interface Product {
    _id: string;
    productName: string;
    unit?: string;
    variants?: Array<{
        unit: string;
        ratio: number;
        price: number;
    }>;
}

interface CartProduct {
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    baseQuantity?: number;  // Converted to base unit
    baseUnit?: string;      // Base unit name
}

export default function Transfers() {
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form state
    const [fromWarehouse, setFromWarehouse] = useState('');
    const [toWarehouse, setToWarehouse] = useState('');
    const [note, setNote] = useState('');

    // Cart state
    const [cart, setCart] = useState<CartProduct[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedUnit, setSelectedUnit] = useState('');
    const [quantity, setQuantity] = useState('');
    const [conversionPreview, setConversionPreview] = useState('');

    // Product search state
    const [productSearch, setProductSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);

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

    // Search products with debouncing
    const searchProducts = async (searchTerm: string) => {
        if (!searchTerm || searchTerm.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(`${API_BASE}/product/getAll?search=${encodeURIComponent(searchTerm)}&limit=20`);
            const data = await res.json();
            setSearchResults(data.data || []);
        } catch (error) {
            console.error('Error searching products:', error);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        fetchTransfers();
        fetchWarehouses();
    }, []);

    // Debounce product search
    useEffect(() => {
        const timer = setTimeout(() => {
            searchProducts(productSearch);
        }, 500);  // 500ms debounce

        return () => clearTimeout(timer);
    }, [productSearch]);

    // Update conversion preview when product/unit/quantity changes
    useEffect(() => {
        if (!selectedProduct || !quantity || !selectedUnit) {
            setConversionPreview('');
            return;
        }

        if (!selectedProduct.variants || selectedProduct.variants.length === 0) {
            setConversionPreview('');
            return;
        }

        const variant = selectedProduct.variants.find((v: any) => v.unit === selectedUnit);
        if (variant && variant.ratio) {
            const baseQty = parseInt(quantity) * variant.ratio;
            const baseUnit = selectedProduct.variants.find((v: any) => v.ratio === 1)?.unit || selectedProduct.unit;
            setConversionPreview(`${quantity} ${selectedUnit} = ${baseQty} ${baseUnit}`);
        } else {
            setConversionPreview('');
        }
    }, [selectedProduct, selectedUnit, quantity]);

    // Add to cart
    const handleAddToCart = () => {
        if (!selectedProduct || !quantity || !selectedUnit) {
            toast.error('Vui lòng chọn sản phẩm, đơn vị và nhập số lượng');
            return;
        }

        const qty = parseInt(quantity);
        if (qty <= 0) {
            toast.error('Số lượng phải lớn hơn 0');
            return;
        }

        if (!selectedProduct) return;

        // Calculate base quantity for display
        let baseQty = qty;
        let baseUnitName = selectedUnit;

        if (selectedProduct.variants && selectedProduct.variants.length > 0) {
            const variant = selectedProduct.variants.find((v: any) => v.unit === selectedUnit);
            if (variant) {
                baseQty = qty * (variant.ratio || 1);
                baseUnitName = selectedProduct.variants.find((v: any) => v.ratio === 1)?.unit || selectedProduct.unit;
            }
        }

        setCart([...cart, {
            productId: selectedProduct._id,
            productName: selectedProduct.productName,
            quantity: qty,
            unit: selectedUnit,
            baseQuantity: baseQty,
            baseUnit: baseUnitName
        }]);
        toast.success('Đã thêm vào phiếu');

        setSelectedProduct(null);
        setSelectedUnit('');
        setQuantity('');
        setProductSearch('');
        setSearchResults([]);
        setConversionPreview('');
    };

    // Remove from cart
    const handleRemoveFromCart = (productId: string) => {
        setCart(cart.filter(item => item.productId !== productId));
        toast.success('Đã xóa khỏi phiếu');
    };

    // Create transfer
    const handleCreate = async () => {
        if (!fromWarehouse || !toWarehouse) {
            toast.error('Vui lòng chọn kho nguồn và kho đích');
            return;
        }

        if (cart.length === 0) {
            toast.error('Vui lòng thêm ít nhất một sản phẩm vào phiếu');
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
                    products: cart.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unit: item.unit  // Send unit for backend conversion
                    })),
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
        if (!confirm('Xác nhận hoàn thành phiếu chuyển kho?')) return;

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
        if (!confirm('Xác nhận hủy phiếu chuyển kho?')) return;

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

    // Delete transfer and restore stock
    const handleDelete = async (id: string) => {
        if (!confirm('Xác nhận XÓA phiếu chuyển kho?\n(Nếu đã hoàn thành, hàng sẽ được hoàn trả về kho nguồn)')) return;

        try {
            const res = await fetch(`${API_BASE}/transfer/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            if (data.restoredQuantity > 0) {
                toast.success(data.message);
            } else {
                toast.success('Đã xóa phiếu chuyển kho');
            }
            fetchTransfers();
        } catch (error: any) {
            toast.error(error.message || 'Lỗi khi xóa');
        }
    };

    const resetForm = () => {
        setFromWarehouse('');
        setToWarehouse('');
        setNote('');
        setCart([]);
        setSelectedProduct('');
        setQuantity('');
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
                        <h1 className="text-2xl font-bold text-gray-900">Chuyển Kho (Smart Transfer)</h1>
                        <p className="text-gray-500 mt-1">Quản lý việc chuyển hàng giữa các kho - Hệ thống tự động chọn lô theo FEFO</p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Tạo phiếu chuyển
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5" />
                                    Tạo Phiếu Chuyển Kho
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                {/* Warehouse Selection */}
                                <div className="grid grid-cols-2 gap-4">
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
                                </div>

                                {/* Product Selection (Search-style) */}
                                <div className="border-t pt-4">
                                    <Label className="text-base font-semibold">Thêm sản phẩm vào phiếu</Label>
                                    <div className="grid grid-cols-[1fr,120px,120px,auto] gap-2 mt-2">
                                        {/* Product Search Input */}
                                        <div className="relative">
                                            <Input
                                                type="text"
                                                value={productSearch}
                                                onChange={(e) => setProductSearch(e.target.value)}
                                                placeholder="Tìm kiếm sản phẩm..."
                                            />
                                            {/* Search Results Dropdown */}
                                            {(productSearch.length >= 2 || selectedProduct) && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                                                    {isSearching ? (
                                                        <div className="px-4 py-2 text-sm text-gray-500">Tìm kiếm...</div>
                                                    ) : selectedProduct ? (
                                                        <div className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50">
                                                            ✓ {selectedProduct.productName}
                                                        </div>
                                                    ) : searchResults.length > 0 ? (
                                                        searchResults.map((product) => (
                                                            <div
                                                                key={product._id}
                                                                onClick={() => {
                                                                    setSelectedProduct(product);
                                                                    setProductSearch(product.productName);
                                                                    setSearchResults([]);
                                                                    // Auto-select first variant
                                                                    if (product.variants && product.variants.length > 0) {
                                                                        setSelectedUnit(product.variants[0].unit);
                                                                    } else {
                                                                        setSelectedUnit(product.unit || 'Đơn vị');
                                                                    }
                                                                }}
                                                                className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                                                            >
                                                                {product.productName}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="px-4 py-2 text-sm text-gray-500">Không tìm thấy sản phẩm</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Đơn vị" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {selectedProduct && (() => {
                                                    if (selectedProduct.variants && selectedProduct.variants.length > 0) {
                                                        return selectedProduct.variants.map((v: any, idx: number) => (
                                                            <SelectItem key={idx} value={v.unit}>
                                                                {v.unit}
                                                            </SelectItem>
                                                        ));
                                                    } else {
                                                        return <SelectItem value={selectedProduct.unit || 'Đơn vị'}>{selectedProduct.unit || 'Đơn vị'}</SelectItem>;
                                                    }
                                                })()}
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            placeholder="SL"
                                        />
                                        <Button onClick={handleAddToCart} type="button">
                                            <Plus className="w-4 h-4 mr-1" />
                                            Thêm
                                        </Button>
                                    </div>
                                    {conversionPreview && (
                                        <p className="text-sm text-blue-600 mt-2">📊 {conversionPreview}</p>
                                    )}
                                </div>

                                {/* Cart Table */}
                                {cart.length > 0 && (
                                    <div className="border rounded-lg">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Sản phẩm</TableHead>
                                                    <TableHead className="text-right">Số lượng</TableHead>
                                                    <TableHead className="w-[80px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {cart.map((item) => (
                                                    <TableRow key={item.productId}>
                                                        <TableCell className="font-medium">{item.productName}</TableCell>
                                                        <TableCell className="text-right">
                                                            {item.quantity} {item.unit}
                                                            {item.baseQuantity && item.baseQuantity !== item.quantity && (
                                                                <span className="text-xs text-gray-500 block">
                                                                    (= {item.baseQuantity} {item.baseUnit})
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleRemoveFromCart(item.productId)}
                                                            >
                                                                <Trash2 className="w-4 h-4 text-red-600" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}

                                {/* Note */}
                                <div>
                                    <Label>Ghi chú</Label>
                                    <Input
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="Ghi chú (tùy chọn)"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-4 border-t">
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Hủy
                                    </Button>
                                    <Button onClick={handleCreate} disabled={cart.length === 0}>
                                        Tạo phiếu ({cart.length} sản phẩm)
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
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tổng SL</th>
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
                                            <td className="px-4 py-3 text-sm">
                                                <div className="font-medium">
                                                    {transfer.products?.length > 0 ? (
                                                        <>
                                                            {transfer.products[0]?.productId?.productName || 'N/A'}
                                                            {transfer.products.length > 1 && (
                                                                <Badge variant="secondary" className="ml-2">
                                                                    +{transfer.products.length - 1}
                                                                </Badge>
                                                            )}
                                                        </>
                                                    ) : 'N/A'}
                                                </div>
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
                                                {transfer.products?.reduce((sum, p) => sum + p.quantity, 0) || 0}
                                            </td>
                                            <td className="px-4 py-3">
                                                {getStatusBadge(transfer.status)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {new Date(transfer.createdAt).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {transfer.status === 'Pending' && (
                                                        <>
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
                                                                className="text-yellow-600 hover:bg-yellow-50"
                                                                onClick={() => handleCancel(transfer._id)}
                                                            >
                                                                <X className="w-4 h-4 mr-1" />
                                                                Hủy
                                                            </Button>
                                                        </>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-600 hover:bg-red-50"
                                                        onClick={() => handleDelete(transfer._id)}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-1" />
                                                        Xóa
                                                    </Button>
                                                </div>
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
