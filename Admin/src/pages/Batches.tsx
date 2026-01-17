import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, Filter, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Check, ChevronsUpDown, Package, Calendar, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from "@/lib/utils"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

interface ProductBatch {
    _id: string;
    productId: {
        _id: string;
        productName: string;
        unit: string;
        packagingType: string;
    };
    purchaseInvoiceId?: string;
    quantity: number;
    remainingQuantity: number;
    manufactureDate: string;
    expiryDate: string;
}

interface ProductSimple {
    _id: string;
    productName: string;
    unit?: string;
    variants?: { unit: string; price: number }[];
}

interface InvoiceGroup {
    invoiceId: string;
    batches: ProductBatch[];
    totalProducts: number;
    totalQuantity: number;
    createdDate: string;
}

const ProductSelect = ({
    value,
    onChange,
    displayName
}: {
    value: string,
    onChange: (val: string, name: string, variants?: { unit: string; price: number }[]) => void,
    displayName?: string
}) => {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [options, setOptions] = useState<ProductSimple[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProducts(search)
        }, 300)
        return () => clearTimeout(timer)
    }, [search])

    const fetchProducts = async (term: string) => {
        setLoading(true)
        try {
            const query = term ? `?search=${encodeURIComponent(term)}&limit=20` : '?limit=20';
            const res = await fetch(`http://127.0.0.1:3000/api/product/getAll${query}`)
            const data = await res.json()
            if (data && data.data) {
                setOptions(data.data.map((p: any) => ({
                    _id: p._id || p.id,
                    productName: p.productName,
                    unit: p.unit,
                    variants: p.variants || []
                })))
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const selectedName = options.find(p => p._id === value)?.productName || displayName;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal h-10"
                >
                    <span className="truncate flex-1 text-left">{selectedName || "Chọn sản phẩm..."}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Nhập tên thuốc để tìm..."
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        {loading && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Đang tìm kiếm...
                            </div>
                        )}
                        {!loading && options.length === 0 && (
                            <CommandEmpty>Không tìm thấy sản phẩm.</CommandEmpty>
                        )}
                        <CommandGroup>
                            {options.map((product) => (
                                <CommandItem
                                    key={product._id}
                                    value={product.productName}
                                    onSelect={() => {
                                        onChange(product._id, product.productName, product.variants);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === product._id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {product.productName}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

export default function Batches() {
    const [batches, setBatches] = useState<ProductBatch[]>([]);
    const [products, setProducts] = useState<ProductSimple[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalBatches, setTotalBatches] = useState(0);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBatch, setEditingBatch] = useState<ProductBatch | null>(null);

    // View Detail Dialog
    const [selectedGroup, setSelectedGroup] = useState<InvoiceGroup | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Adjusted State for Bulk Import
    const [importItems, setImportItems] = useState<any[]>([{
        productId: '',
        productName: '',
        quantity: '',
        unit: '', // Will be set from product variants
        variants: [], // Store product-specific variants
        manufactureDate: '',
        expiryDate: ''
    }]);

    // Helper to update specific item in import list
    const updateImportItem = (index: number, updates: Record<string, any>) => {
        const newItems = [...importItems];
        newItems[index] = { ...newItems[index], ...updates };
        setImportItems(newItems);
    };

    const addImportItem = () => {
        setImportItems([...importItems, {
            productId: '',
            productName: '',
            quantity: '',
            unit: '',
            variants: [],
            manufactureDate: '',
            expiryDate: ''
        }]);
    };

    const removeImportItem = (index: number) => {
        if (importItems.length === 1) return;
        const newItems = [...importItems];
        newItems.splice(index, 1);
        setImportItems(newItems);
    };

    // Group batches by purchaseInvoiceId
    const invoiceGroups = useMemo(() => {
        const groups: Record<string, InvoiceGroup> = {};

        batches.forEach(batch => {
            const invoiceId = (batch as any).purchaseInvoiceId || batch._id;
            if (!groups[invoiceId]) {
                groups[invoiceId] = {
                    invoiceId,
                    batches: [],
                    totalProducts: 0,
                    totalQuantity: 0,
                    createdDate: batch.manufactureDate
                };
            }
            groups[invoiceId].batches.push(batch);
            groups[invoiceId].totalProducts++;
            groups[invoiceId].totalQuantity += batch.remainingQuantity;
        });

        return Object.values(groups);
    }, [batches]);

    const fetchBatches = async () => {
        try {
            setLoading(true);
            const res = await fetch(`http://127.0.0.1:3000/api/product/batches/getAll?page=${page}&limit=20`);
            const data = await res.json();
            if (data.data) {
                setBatches(data.data);
                setTotalPages(data.totalPages || 1);
                setTotalBatches(data.total || data.data.length);
            } else {
                setBatches(data);
            }
        } catch (error) {
            console.error(error);
            toast.error('Lỗi tải dữ liệu lô hàng');
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch('http://127.0.0.1:3000/api/product/getAll?limit=1000');
            const data = await res.json();
            if (data && data.data) {
                setProducts(data.data.map((p: any) => ({ _id: p._id, productName: p.productName })));
            }
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        fetchBatches();
    }, [page]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleAdd = () => {
        setEditingBatch(null);
        setImportItems([{
            productId: '',
            productName: '',
            quantity: '',
            manufactureDate: '',
            expiryDate: ''
        }]);
        setIsDialogOpen(true);
    };

    const handleViewDetail = (group: InvoiceGroup) => {
        setSelectedGroup(group);
        setIsDetailOpen(true);
    };

    const handleEdit = async (batch: ProductBatch) => {
        setEditingBatch(batch);
        setIsDetailOpen(false);

        const initialItem = {
            _id: batch._id,
            productId: (batch.productId as any)?._id || (typeof batch.productId === 'string' ? batch.productId : ''),
            productName: (batch.productId as any)?.productName || '',
            quantity: batch.quantity.toString(),
            remainingQuantity: batch.remainingQuantity.toString(),
            manufactureDate: batch.manufactureDate ? batch.manufactureDate.split('T')[0] : '',
            expiryDate: batch.expiryDate ? batch.expiryDate.split('T')[0] : '',
        };
        setImportItems([initialItem]);
        setIsDialogOpen(true);

        try {
            const invoiceId = (batch as any).purchaseInvoiceId;
            if (invoiceId) {
                const res = await fetch(`http://127.0.0.1:3000/api/product/batches/invoice/${invoiceId}`);
                if (res.ok) {
                    const groupData = await res.json();
                    if (groupData && Array.isArray(groupData) && groupData.length > 0) {
                        let displayData = groupData;
                        const LIMIT = 20;

                        if (groupData.length > LIMIT) {
                            toast.warning(`Lô hàng có ${groupData.length} sản phẩm. Chỉ hiển thị các sản phẩm đầu tiên.`);
                            displayData = groupData.slice(0, LIMIT);
                        }

                        setImportItems(displayData.map((item: any) => ({
                            _id: item._id,
                            productId: item.productId?._id || (typeof item.productId === 'string' ? item.productId : ''),
                            productName: item.productId?.productName || '',
                            quantity: item.quantity.toString(),
                            remainingQuantity: item.remainingQuantity.toString(),
                            manufactureDate: item.manufactureDate.split('T')[0],
                            expiryDate: item.expiryDate.split('T')[0]
                        })));
                    }
                }
            }
        } catch (e) {
            console.error("Error loading full batch group:", e);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi lô hàng?')) return;
        try {
            const res = await fetch(`http://127.0.0.1:3000/api/product/batches/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success('Xóa thành công');
                fetchBatches();
                setIsDetailOpen(false);
            } else {
                toast.error('Lỗi xóa lô hàng');
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
        }
    };

    const handleSubmit = async () => {
        const validItems = importItems.filter(item => item.productId && item.productId.trim() !== '');

        if (validItems.length === 0) {
            toast.error('Vui lòng nhập thông tin cho ít nhất một dòng');
            return;
        }

        const isAllFilled = validItems.every(item => item.quantity && item.manufactureDate && item.expiryDate);
        if (!isAllFilled) {
            toast.error('Vui lòng điền đầy đủ Ngày SX, Hạn SD và Số lượng');
            return;
        }

        try {
            if (editingBatch) {
                const invoiceId = (editingBatch as any).purchaseInvoiceId;

                if (!invoiceId) {
                    toast.error("Lỗi dữ liệu: Không tìm thấy mã phiếu nhập");
                    return;
                }

                const payload = {
                    batches: validItems.map(item => ({
                        _id: item._id,
                        productId: item.productId,
                        quantity: parseInt(item.quantity),
                        remainingQuantity: parseInt(item.remainingQuantity || item.quantity),
                        manufactureDate: item.manufactureDate,
                        expiryDate: item.expiryDate
                    }))
                };

                const res = await fetch(`http://127.0.0.1:3000/api/product/batches/invoice/${invoiceId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    toast.success('Cập nhật lô hàng thành công');
                    setIsDialogOpen(false);
                    fetchBatches();
                } else {
                    const err = await res.json();
                    toast.error(err.message || 'Cập nhật thất bại');
                }

            } else {
                const payload = {
                    batches: validItems.map(item => ({
                        productId: item.productId,
                        quantity: parseInt(item.quantity),
                        manufactureDate: item.manufactureDate,
                        expiryDate: item.expiryDate
                    }))
                };

                const res = await fetch('http://127.0.0.1:3000/api/product/batches/bulk-create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    toast.success(`Nhập thành công ${validItems.length} lô hàng`);
                    setIsDialogOpen(false);
                    fetchBatches();
                } else {
                    toast.error('Có lỗi xảy ra');
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Đã xảy ra lỗi trong quá trình xử lý');
        }
    };

    const filteredGroups = invoiceGroups.filter((group) =>
        group.batches.some(b =>
            (b.productId?.productName || '').toLowerCase().includes(searchTerm.toLowerCase())
        ) || group.invoiceId.includes(searchTerm)
    );

    return (
        <DashboardLayout title="Quản lý lô hàng" subtitle="Danh sách các phiếu nhập hàng">
            <div className="rounded-xl bg-card p-6 card-shadow">
                <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm theo tên thuốc hoặc mã phiếu..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleAdd} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Nhập hàng
                        </Button>
                    </div>
                </div>

                {/* Card Grid Layout */}
                {loading ? (
                    <div className="text-center py-12 text-muted-foreground">Đang tải...</div>
                ) : filteredGroups.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">Không tìm thấy phiếu nhập nào</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredGroups.map((group) => {
                            const firstBatch = group.batches[0];
                            const hasExpired = group.batches.some(b => new Date(b.expiryDate) < new Date());
                            const hasNearExpiry = group.batches.some(b => {
                                const expiry = new Date(b.expiryDate);
                                return expiry >= new Date() && expiry < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
                            });

                            return (
                                <Card
                                    key={group.invoiceId}
                                    className={cn(
                                        "cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]",
                                        hasExpired && "border-destructive/50 bg-destructive/5",
                                        hasNearExpiry && !hasExpired && "border-yellow-500/50 bg-yellow-500/5"
                                    )}
                                    onClick={() => handleViewDetail(group)}
                                >
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg font-mono">
                                                #{group.invoiceId.slice(-6).toUpperCase()}
                                            </CardTitle>
                                            {hasExpired ? (
                                                <Badge variant="destructive">Có hàng hết hạn</Badge>
                                            ) : hasNearExpiry ? (
                                                <Badge variant="warning">Sắp hết hạn</Badge>
                                            ) : (
                                                <Badge variant="success">Tốt</Badge>
                                            )}
                                        </div>
                                        <CardDescription className="flex items-center gap-1 text-xs">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(firstBatch?.manufactureDate || new Date()), 'dd/MM/yyyy')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pb-2">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Package className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{group.totalProducts} sản phẩm</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground line-clamp-2">
                                                {group.batches.slice(0, 2).map(b => b.productId?.productName).join(', ')}
                                                {group.batches.length > 2 && '...'}
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-2 border-t">
                                        <div className="flex items-center justify-between w-full text-sm">
                                            <span className="text-muted-foreground">Tồn kho:</span>
                                            <span className="font-semibold text-primary">{group.totalQuantity} đơn vị</span>
                                        </div>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Detail Dialog */}
                <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Chi tiết phiếu nhập #{selectedGroup?.invoiceId.slice(-6).toUpperCase()}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Sản phẩm</TableHead>
                                        <TableHead>NSX</TableHead>
                                        <TableHead>HSD</TableHead>
                                        <TableHead>Đóng gói</TableHead>
                                        <TableHead>Ban đầu</TableHead>
                                        <TableHead>Tồn kho</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead className="text-right">Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedGroup?.batches.map((batch) => {
                                        const isExpired = new Date(batch.expiryDate) < new Date();
                                        const isNearExpiry = !isExpired && new Date(batch.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

                                        return (
                                            <TableRow key={batch._id}>
                                                <TableCell>
                                                    <span className="font-medium">{batch.productId?.productName}</span>
                                                </TableCell>
                                                <TableCell>{format(new Date(batch.manufactureDate), 'dd/MM/yyyy')}</TableCell>
                                                <TableCell className={isExpired ? 'text-destructive font-bold' : ''}>
                                                    {format(new Date(batch.expiryDate), 'dd/MM/yyyy')}
                                                </TableCell>
                                                <TableCell>{batch.productId?.packagingType}</TableCell>
                                                <TableCell>{batch.quantity} {batch.productId?.unit}</TableCell>
                                                <TableCell className="font-semibold">
                                                    {batch.remainingQuantity} {batch.productId?.unit}
                                                </TableCell>
                                                <TableCell>
                                                    {batch.remainingQuantity === 0 ? (
                                                        <Badge variant="outline">Hết hàng</Badge>
                                                    ) : isExpired ? (
                                                        <Badge variant="destructive">Hết hạn</Badge>
                                                    ) : isNearExpiry ? (
                                                        <Badge variant="warning">Sắp hết hạn</Badge>
                                                    ) : (
                                                        <Badge variant="success">Sử dụng tốt</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(batch)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(batch._id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Đóng</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Import Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingBatch ? 'Sửa lô hàng' : 'Nhập hàng (Nhiều sản phẩm)'}</DialogTitle>
                        </DialogHeader>

                        <div className="py-4">
                            {importItems.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-4 items-end mb-6 border-b pb-6 last:border-0 last:pb-0">
                                    <div className="col-span-5 space-y-2">
                                        <Label className="text-sm font-medium">Sản phẩm {importItems.length > 1 ? `#${index + 1}` : ''}</Label>
                                        <ProductSelect
                                            value={item.productId}
                                            displayName={item.productName}
                                            onChange={(val, name, variants) => {
                                                const defaultUnit = variants && variants.length > 0 ? variants[0].unit : '';
                                                updateImportItem(index, {
                                                    productId: val,
                                                    productName: name,
                                                    variants: variants || [],
                                                    unit: defaultUnit
                                                });
                                            }}
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <Label className="text-sm font-medium">Ngày SX</Label>
                                        <Input type="date" className="h-10" value={item.manufactureDate} onChange={(e) => updateImportItem(index, { manufactureDate: e.target.value })} />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <Label className="text-sm font-medium">Hạn SD</Label>
                                        <Input type="date" className="h-10" value={item.expiryDate} onChange={(e) => updateImportItem(index, { expiryDate: e.target.value })} />
                                    </div>
                                    <div className="col-span-3 space-y-2">
                                        <Label className="text-sm font-medium">Số lượng & Đơn vị</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                placeholder="Số lượng"
                                                value={item.quantity}
                                                onChange={(e) => updateImportItem(index, { quantity: e.target.value })}
                                                className="w-24 h-10"
                                            />
                                            <Select
                                                value={item.unit || ''}
                                                onValueChange={(val) => updateImportItem(index, { unit: val })}
                                                disabled={!item.variants || item.variants.length === 0}
                                            >
                                                <SelectTrigger className="flex-1 h-10">
                                                    <SelectValue placeholder="Chọn đơn vị" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(item.variants || []).map((v: { unit: string; price: number }) => (
                                                        <SelectItem key={v.unit} value={v.unit}>
                                                            {v.unit} - {v.price.toLocaleString('vi-VN')}đ
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {!editingBatch && importItems.length > 1 && (
                                        <div className="col-span-1 pb-1">
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeImportItem(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}

                                    {editingBatch && (
                                        <div className="col-span-12 mt-2">
                                            <Label>Tồn kho hiện tại</Label>
                                            <Input type="number" value={item.remainingQuantity || ''} onChange={(e) => updateImportItem(index, { remainingQuantity: e.target.value })} />
                                        </div>
                                    )}
                                </div>
                            ))}

                            <Button variant="outline" size="sm" onClick={addImportItem} className="mt-2 w-full border-dashed">
                                <Plus className="mr-2 h-4 w-4" /> Thêm dòng sản phẩm
                            </Button>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
                            <Button onClick={handleSubmit}>{editingBatch ? 'Cập nhật' : 'Nhập kho'}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <div className="flex items-center justify-between py-4">
                    <div className="text-sm text-muted-foreground">
                        Hiển thị {batches.length} / {totalBatches} lô hàng
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Trước
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (page <= 3) {
                                    pageNum = i + 1;
                                } else if (page >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = page - 2 + i;
                                }
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={page === pageNum ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setPage(pageNum)}
                                        disabled={loading}
                                        className="w-10"
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                        >
                            Sau
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Trang {page} / {totalPages}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
