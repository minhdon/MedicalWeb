import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Warehouse,
  Building2,
  FileText,
  Settings,
  Pill,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Tổng quan', href: '/', icon: LayoutDashboard },
  { name: 'Đơn hàng', href: '/orders', icon: ShoppingCart },
  { name: 'Sản phẩm', href: '/products', icon: Package },
  { name: 'Kho hàng', href: '/inventory', icon: Warehouse },
  { name: 'Lô hàng', href: '/batches', icon: Pill },
  { name: 'Khách hàng', href: '/customers', icon: Users },
  { name: 'Chi nhánh', href: '/branches', icon: Building2 },
  { name: 'Báo cáo', href: '/reports', icon: FileText },
  { name: 'Cài đặt', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
          <Pill className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-sidebar-accent-foreground">PharmaCare</h1>
          <p className="text-xs text-sidebar-foreground">Quản lý nhà thuốc</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 p-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-sm font-medium text-sidebar-accent-foreground">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-accent-foreground truncate">Admin</p>
            <p className="text-xs text-sidebar-foreground truncate">admin@pharmacare.vn</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
