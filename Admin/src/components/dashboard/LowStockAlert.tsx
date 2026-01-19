import { useState, useEffect } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const API_BASE = 'http://127.0.0.1:3000/api';

interface LowStockProduct {
  id: string;
  productName: string;
  category: string;
  quantity: number;
  unit: string;
}

export function LowStockAlert() {
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const LOW_STOCK_THRESHOLD = 20; // Products with less than 20 units

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        const res = await fetch(`${API_BASE}/product/getAll?page=1&limit=1000`);
        const data = await res.json();

        const products = data?.data || [];
        const lowStock = products
          .filter((p: any) => (p.quantity || 0) < LOW_STOCK_THRESHOLD && (p.quantity || 0) >= 0)
          .sort((a: any, b: any) => (a.quantity || 0) - (b.quantity || 0))
          .slice(0, 5) // Show top 5 lowest stock
          .map((p: any) => ({
            id: p._id || p.id,
            productName: p.productName,
            category: p.category || p.categoryId?.categoryName || 'Chưa phân loại',
            quantity: p.quantity || 0,
            unit: p.unit || 'Đơn vị'
          }));

        setLowStockProducts(lowStock);
      } catch (error) {
        console.error('Error fetching low stock:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLowStock();
  }, []);

  return (
    <div className="rounded-xl bg-card p-6 card-shadow animate-slide-up">
      <div className="flex items-center gap-2 mb-6">
        <AlertTriangle className="h-5 w-5 text-warning" />
        <h3 className="text-lg font-semibold text-card-foreground">Cảnh báo tồn kho</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : lowStockProducts.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-muted-foreground text-sm">✅ Không có sản phẩm nào sắp hết hàng</p>
          <p className="text-xs text-muted-foreground mt-1">(Ngưỡng: dưới {LOW_STOCK_THRESHOLD} đơn vị)</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lowStockProducts.map((product) => (
            <div
              key={product.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${product.quantity <= 5
                  ? 'bg-destructive/5 border-destructive/20'
                  : 'bg-warning/5 border-warning/20'
                }`}
            >
              <div>
                <p className="font-medium text-card-foreground">{product.productName}</p>
                <p className="text-sm text-muted-foreground">{product.category}</p>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${product.quantity <= 5 ? 'text-destructive' : 'text-warning'}`}>
                  {product.quantity} {product.unit}
                </p>
                <p className="text-xs text-muted-foreground">còn lại</p>
              </div>
            </div>
          ))}
          <Link to="/inventory">
            <Button variant="outline" className="w-full mt-2">
              Quản lý kho hàng
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
