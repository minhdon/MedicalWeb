import { medicines } from '@/data/mockData';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function LowStockAlert() {
  const lowStockMedicines = medicines.filter((m) => m.stock < 100);

  return (
    <div className="rounded-xl bg-card p-6 card-shadow animate-slide-up">
      <div className="flex items-center gap-2 mb-6">
        <AlertTriangle className="h-5 w-5 text-warning" />
        <h3 className="text-lg font-semibold text-card-foreground">Cảnh báo tồn kho</h3>
      </div>

      {lowStockMedicines.length === 0 ? (
        <p className="text-muted-foreground text-sm">Không có sản phẩm nào sắp hết hàng</p>
      ) : (
        <div className="space-y-3">
          {lowStockMedicines.map((medicine) => (
            <div
              key={medicine.id}
              className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20"
            >
              <div>
                <p className="font-medium text-card-foreground">{medicine.name}</p>
                <p className="text-sm text-muted-foreground">{medicine.category}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-warning">{medicine.stock} {medicine.unit}</p>
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
