import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
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
  ArrowLeftRight,
  PackageSearch,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Define which roles can access each menu item
// 'all' means both Admin and Staff can access
// 'admin' means only Admin can access
// 'warehouse' is for warehouse staff - limited to inventory related pages
const navigation = [
  {
    name: "Tổng quan",
    href: "/",
    icon: LayoutDashboard,
    roles: ["Admin", "Staff", "WarehouseStaff"],
  },
  {
    name: "Đơn hàng",
    href: "/orders",
    icon: ShoppingCart,
    roles: ["Admin", "Staff"],
  },
  {
    name: "Sản phẩm",
    href: "/products",
    icon: Package,
    roles: ["Admin", "Staff", "WarehouseStaff"],
  },
  {
    name: "Kho hàng",
    href: "/inventory",
    icon: Warehouse,
    roles: ["Admin", "Staff", "WarehouseStaff"],
  },
  {
    name: "Lô hàng",
    href: "/batches",
    icon: Pill,
    roles: ["Admin", "Staff", "WarehouseStaff"],
  },
  {
    name: "Kho chi nhánh",
    href: "/branch-inventory",
    icon: PackageSearch,
    roles: ["Admin", "Staff", "WarehouseStaff"],
  },
  { name: "Khách hàng", href: "/customers", icon: Users, roles: ["Admin"] },
  { name: "Chi nhánh", href: "/branches", icon: Building2, roles: ["Admin"] },
  {
    name: "Chuyển kho",
    href: "/transfers",
    icon: ArrowLeftRight,
    roles: ["Admin", "Staff", "WarehouseStaff"],
  },
  { name: "Nhân viên", href: "/staff", icon: UserCog, roles: ["Admin"] },
  { name: "Báo cáo", href: "/reports", icon: FileText, roles: ["Admin"] },
  { name: "Cài đặt", href: "/settings", icon: Settings, roles: ["Admin"] },
];

export function Sidebar() {
  const location = useLocation();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(
    null,
  );

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser({
          fullName: parsed.fullName || parsed.userName || "User",
          role: parsed.role || "Staff",
        });
      } catch (e) {
        console.error("Error parsing user data");
      }
    }
  }, []);

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter((item) => {
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
        {/* <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
          <Pill className="h-5 w-5 text-sidebar-primary-foreground" />
        </div> */}
        <img src="/public/logo.png" alt="" style={{ width: "60px" }} />
        <div>
          <h1 className="text-lg font-semibold text-sidebar-accent-foreground">
            MediCare
          </h1>
          <p className="text-xs text-sidebar-foreground">Quản lý nhà thuốc</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 p-4">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
        <div className="relative group">
          <button
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer"
            onClick={() => {
              const dropdown = document.getElementById("logout-dropdown");
              if (dropdown) {
                dropdown.classList.toggle("hidden");
              }
            }}
          >
            <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-sm font-medium text-sidebar-accent-foreground">
                {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-sidebar-accent-foreground truncate">
                {user?.fullName || "User"}
              </p>
              <p className="text-xs text-sidebar-foreground truncate">
                {user?.role === "Admin"
                  ? "Quản trị viên"
                  : user?.role === "Staff"
                    ? "Nhân viên"
                    : user?.role || "N/A"}
              </p>
            </div>
            <svg
              className="w-4 h-4 text-sidebar-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Logout Dropdown */}
          <div
            id="logout-dropdown"
            className="hidden absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden"
          >
            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/login";
              }}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
