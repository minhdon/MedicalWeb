import styles from "./ShoppingCart.module.css";
import { useContext, useState, useEffect } from "react";
import { paymentPerProductContext } from "../useContext/PaymentPerProduct";
import { IsInfoContext } from "../useContext/checkInfoContext";
import { createOrderAPI } from "../CallApi/CallApiSaleInvoice";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../../contexts/AuthContext";

interface CartItem {
  _id: string; // Updated to _id
  id?: number; // Optional backward compatibility
  productName: string;
  cost: number;
  status: boolean;
  img: string;
  productDesc: string;
  quantity: number;
  unit?: string;
  variants?: any[];
  [key: string]: unknown;
}

const TrashIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const LightningIcon = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
  >
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const ChevronRight = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const ShoppingCart: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isBuyNowMode = searchParams.get("mode") === "buy_now";
  // Determine storage key
  const storageKey = isBuyNowMode ? "buyNowCart" : "shoppingCart";

  // Get staff info for in-store sales
  const { user, isStaff } = useAuth();

  // Dữ liệu giả lập - Initialize with empty array first, then load in Effect
  // OR initialize directly but logic is cleaner with Effect for mode switching
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load Cart Data Effect
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      setCartItems(stored ? JSON.parse(stored) : []);
    } catch (e) {
      console.error("Error parsing cart", e);
      setCartItems([]);
    }
  }, [storageKey]); // Re-run when mode changes

  const { isInfo, customerData } = useContext(IsInfoContext);
  const products = useContext(paymentPerProductContext);
  const [isOrdering, setIsOrdering] = useState(false);
  const [validationError, setValidationError] = useState<string>(""); // NEW: For inline validation

  // FIX: Use _id AND unit to identify item
  const handleChangeQuantity = (id: string, unit: string, count: number) => {
    // ... (keep existing logic)
    const newItems = cartItems.map((item) => {
      if (item._id === id && item.unit === unit && item.quantity + count >= 1) {
        return { ...item, quantity: item.quantity + count };
      }
      return item;
    });
    setCartItems(newItems);
    localStorage.setItem(storageKey, JSON.stringify(newItems));
  };


  // Toggle Checkbox Status
  const handleToggleStatus = (id: string, unit: string) => {
    const newItems = cartItems.map((item) => {
      if (item._id === id && item.unit === unit) {
        return { ...item, status: !item.status };
      }
      return item;
    });
    setCartItems(newItems);
    localStorage.setItem(storageKey, JSON.stringify(newItems));
  };

  const handleToggleAll = (checked: boolean) => {
    const newItems = cartItems.map(item => ({ ...item, status: checked }));
    setCartItems(newItems);
    localStorage.setItem(storageKey, JSON.stringify(newItems));
  };

  // Displayed Items chính là cartItems (vì đã load đúng nguồn)
  const displayedItems = cartItems;

  // Tính tổng từ `cartItems` (Chỉ tính item được chọn)
  const totalAmount: number = cartItems.reduce(
    (sum: number, item: CartItem) => {
      if (!item.status) return sum;
      const cost = Number(item.cost) || 0;
      const qty = Number(item.quantity) || 0;
      return sum + cost * qty;
    },
    0
  );

  // ... (handleCheckout logic remains same)
  const handleCheckout = async () => {
    const selectedItems = cartItems.filter(item => item.status);

    // Clear previous errors first
    setValidationError("");

    if (selectedItems.length === 0) {
      setValidationError("Vui lòng chọn ít nhất một sản phẩm!");
      return;
    }

    // Validate customer Info
    if (!isInfo) {
      setValidationError("Vui lòng điền đầy đủ thông tin khách hàng bên dưới!");
      // Scroll to customer form
      document.querySelector('[class*="CustomerInfo"], [class*="StaffCustomer"]')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Custom confirmation for staff vs customer
    const confirmMsg = isStaff
      ? `Xác nhận bán hàng trực tiếp ${selectedItems.length} sản phẩm tại ${user?.warehouse?.name || 'cửa hàng'}?`
      : `Xác nhận đặt hàng ${selectedItems.length} sản phẩm đã chọn?`;

    if (!window.confirm(confirmMsg)) return;

    setIsOrdering(true);
    try {
      const itemsPayload = selectedItems.map(item => ({
        id: item._id,
        quantity: item.quantity,
        cost: Number(item.cost),
        unit: item.unit || 'Hộp',
        productName: item.productName
      }));

      // Build order payload with staff info for in-store sales
      const orderPayload: any = {
        customerInfo: customerData,
        cartItems: itemsPayload
      };

      // If staff is logged in, add warehouse and staff info for in-store sales tracking
      if (isStaff && user) {
        orderPayload.warehouseId = user.warehouse?._id || user.warehouse?.id || null;
        orderPayload.staffId = user.id || user._id;
        orderPayload.isInStoreSale = true; // Flag to indicate in-store sale
      }

      const result = await createOrderAPI(orderPayload);

      const successMsg = isStaff
        ? `Bán hàng thành công! Mã đơn: ${result.invoiceId}\nTổng tiền: ${result.totalBill?.toLocaleString()}đ\nChi nhánh: ${user?.warehouse?.name || 'N/A'}`
        : `Đặt hàng thành công! Mã đơn: ${result.invoiceId}\nTổng tiền: ${result.totalBill?.toLocaleString()}đ`;

      alert(successMsg);

      // Remove Paid Items
      const remainingItems = cartItems.filter(item => !item.status);
      setCartItems(remainingItems);
      localStorage.setItem(storageKey, JSON.stringify(remainingItems));

      window.location.href = "/";
    } catch (err: any) {
      console.error(err);
      alert(`Lỗi đặt hàng: ${err.message}`);
    } finally {
      setIsOrdering(false);
    }
  };


  // FIX: Remove by ID and Unit
  const removeItemByX = (id: string, unit: string): CartItem[] => {
    const newItems = cartItems.filter((item) => !(item._id === id && item.unit === unit));
    setCartItems(newItems);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newItems));
    } catch (e) {
      console.error("Lỗi khi cập nhật localStorage:", e);
    }
    return newItems;
  };
  // Khi bấm nút xóa

  return (
    <div className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.leftPanel}>


          <div className={styles.freeShipBanner}>
            Miễn phí vận chuyển&nbsp;
            <span style={{ color: "#333" }}>
              đối với đơn hàng trên 300.000đ
            </span>
          </div>

          {/* Header Row */}
          <div className={styles.headerRow}>
            <div className={`${styles.colCheckbox}`}>
              <input
                type="checkbox"
                className={styles.checkbox}
                onChange={(e) => handleToggleAll(e.target.checked)}
                checked={cartItems.length > 0 && cartItems.every(i => i.status)}
                disabled={isBuyNowMode}
              />
            </div>
            <div className={styles.colProduct}>
              {isBuyNowMode ? 'Sản phẩm mua ngay' : `Chọn tất cả (${cartItems.length})`}
            </div>
            <div className={styles.colPrice}>Giá thành</div>
            <div className={styles.colQty}>Số lượng</div>
            <div className={styles.colUnit}>Đơn vị</div>
            <div className={styles.colDelete}></div>
          </div>

          {/* Product Item Row */}
          {displayedItems.map((item: CartItem, index) => (
            // FIX: Unique Key using ID + Unit + Index (Index fallback for safety)
            <div key={`${item._id}-${item.unit}-${index}`}>
              <div className={styles.cartItem}>
                <div className={styles.colCheckbox}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={!!item.status}
                    onChange={() => handleToggleStatus(item._id, item.unit || '')}
                  />
                </div>

                <div className={`${styles.colProduct} ${styles.productInfo}`}>
                  <img
                    src={item.img}
                    alt="Product"
                    className={styles.productImg}
                  />
                  <div>
                    <span className={styles.flashSaleBadge}>
                      <LightningIcon /> Flash sale giá sốc
                    </span>
                    <div className={styles.productName}>{item.productName}</div>
                  </div>
                </div>

                <div className={styles.colPrice}>
                  <span className={styles.currentPrice}>
                    {(item.cost * item.quantity).toLocaleString("vi-VN")}đ
                  </span>
                </div>

                <div className={styles.colQty}>
                  <div className={styles.qtyGroup}>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => handleChangeQuantity(item._id, item.unit || '', -1)}
                    >
                      -
                    </button>
                    <input
                      type="text"
                      className={styles.qtyInput}
                      value={item.quantity}
                      readOnly
                    />
                    <button
                      className={styles.qtyBtn}
                      onClick={() => handleChangeQuantity(item._id, item.unit || '', 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className={styles.colUnit}>
                  {item.variants && item.variants.length > 0 ? (
                    <select
                      className={styles.unitSelect}
                      value={item.unit}
                      onChange={(e) => {
                        const newUnit = e.target.value;
                        const variant = item.variants?.find((v: any) => v.unit === newUnit);
                        // Check duplicate before changing unit
                        const isDuplicate = cartItems.some(ci => ci._id === item._id && ci.unit === newUnit && ci !== item);

                        if (isDuplicate) {
                          alert(`Trong giỏ hàng đã có sản phẩm này với đơn vị ${newUnit}. Vui lòng tăng số lượng sản phẩm đó thay vì đổi đơn vị.`);
                          return;
                        }

                        if (variant) {
                          const newItems = cartItems.map((ci) => {
                            // Only update THIS item (identified by id AND old unit)
                            if (ci._id === item._id && ci.unit === item.unit) {
                              return { ...ci, unit: newUnit, cost: variant.price };
                            }
                            return ci;
                          });
                          setCartItems(newItems);
                          localStorage.setItem("shoppingCart", JSON.stringify(newItems));
                        }
                      }}
                    >
                      {item.variants.map((v: any, idx: number) => (
                        <option key={idx} value={v.unit}>
                          {v.unit}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span style={{ fontWeight: 500, color: "#333" }}>{item.unit}</span>
                  )}
                </div>

                <div className={styles.colDelete}>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => {
                      // FIX: Remove specific unit item
                      removeItemByX(item._id, item.unit || '');
                    }}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Promotion info inside item card */}
          <div className={styles.itemFooter}>
            <div className={styles.lightningIcon}>
              <LightningIcon />
            </div>
            <span>Giảm ngay 20% khi mua Online 8h - 22h áp dụng đến 01/12</span>
          </div>
        </div>
        {/* CỘT PHẢI: TỔNG KẾT ĐƠN HÀNG */}
        <div className={styles.rightPanel}>
          <div className={styles.couponBar}>
            <span>Áp dụng ưu đãi để được giảm giá</span>
            <ChevronRight />
          </div>

          <div className={styles.summaryRow}>
            <span>Tổng tiền ({cartItems.filter(i => i.status).length} sản phẩm)</span>
            <span className={styles.summaryVal}>
              {totalAmount.toLocaleString("vi-VN")}đ
            </span>
          </div>

          <div className={styles.divider}></div>

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Thành tiền</span>
            <div style={{ textAlign: "right" }}>
              <span className={styles.totalPrice}>
                {totalAmount.toLocaleString("vi-VN")}đ
              </span>
            </div>
          </div>

          {/* Validation Error Message */}
          {validationError && (
            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              color: '#856404',
              padding: '10px 16px',
              borderRadius: '8px',
              marginBottom: '12px',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              ⚠️ {validationError}
            </div>
          )}

          <button
            className={styles.btnCheckout}
            disabled={isOrdering || cartItems.filter(i => i.status).length === 0}
            style={{
              opacity: isOrdering ? 0.7 : cartItems.filter(i => i.status).length === 0 ? 0.5 : 1,
              cursor: isOrdering ? 'wait' : cartItems.filter(i => i.status).length === 0 ? 'not-allowed' : 'pointer',
              backgroundColor: isInfo && cartItems.filter(i => i.status).length > 0 ? '#28a745' : '#1d48ba'
            }}
            onClick={handleCheckout}
          >
            {isOrdering
              ? 'Đang xử lý...'
              : cartItems.filter(i => i.status).length === 0
                ? 'Chọn sản phẩm'
                : !isInfo
                  ? 'Điền thông tin khách hàng'
                  : isStaff ? '✓ Xác nhận bán hàng' : '✓ Đặt hàng ngay'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;
