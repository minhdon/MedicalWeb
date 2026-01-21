import { useEffect, useState } from "react";
import { ShoppingBag, Package, Clock, CreditCard, MapPin } from "lucide-react";
import styles from "./PurchaseHistory.module.css";
import { useAuth } from "../../../contexts/AuthContext";
import { orderService } from "../../../services/orderService";

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  paymentMethod: string;
  shippingAddress: string;
  createdAt: string;
}

const PurchaseHistory = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await orderService.getOrdersByUserId(user.id);
        setOrders(response.data);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setError("Không thể tải lịch sử mua hàng");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user?.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "delivered":
        return styles.statusSuccess;
      case "pending":
        return styles.statusPending;
      case "cancelled":
        return styles.statusCancelled;
      default:
        return styles.statusDefault;
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "Chờ xác nhận";
      case "confirmed":
        return "Đã xác nhận";
      case "delivered":
        return "Đã giao";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Lịch sử mua hàng</h1>
        <div className={styles.loading}>Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Lịch sử mua hàng</h1>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Lịch sử mua hàng</h1>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <ShoppingBag size={36} />
          </div>
          <p className={styles.emptyText}>Vui lòng đăng nhập để xem lịch sử</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Lịch sử mua hàng</h1>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <ShoppingBag size={36} />
          </div>
          <p className={styles.emptyText}>Chưa có lịch sử mua hàng</p>
          <p className={styles.emptySubtext}>
            Các đơn hàng của bạn sẽ hiển thị ở đây
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Lịch sử mua hàng</h1>

      <div className={styles.orderList}>
        {orders.map((order) => (
          <div key={order.id} className={styles.orderCard}>
            <div className={styles.orderHeader}>
              <div className={styles.orderId}>
                <Package size={18} />
                <span>Đơn hàng #{order.id.slice(-8).toUpperCase()}</span>
              </div>
              <span
                className={`${styles.status} ${getStatusColor(order.status)}`}
              >
                {getStatusText(order.status)}
              </span>
            </div>

            <div className={styles.orderMeta}>
              <div className={styles.metaItem}>
                <Clock size={14} />
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <div className={styles.metaItem}>
                <CreditCard size={14} />
                <span>{order.paymentMethod}</span>
              </div>
              {order.shippingAddress && (
                <div className={styles.metaItem}>
                  <MapPin size={14} />
                  <span>{order.shippingAddress}</span>
                </div>
              )}
            </div>

            <div className={styles.itemList}>
              {order.items.map((item, index) => (
                <div key={index} className={styles.item}>
                  <span className={styles.itemName}>{item.productName}</span>
                  <span className={styles.itemQty}>x{item.quantity}</span>
                  <span className={styles.itemPrice}>
                    {formatCurrency(item.totalPrice)}
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.orderFooter}>
              <span className={styles.totalLabel}>Tổng cộng:</span>
              <span className={styles.totalAmount}>
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PurchaseHistory;
