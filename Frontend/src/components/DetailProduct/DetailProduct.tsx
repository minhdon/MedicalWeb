import React, { useEffect, useState } from "react";
import styles from "./DetailProduct.module.css";
import { useSearchParams, useNavigate } from "react-router";

import { type ApiData, fetchProductById } from "../CallApi/CallApiProduct";

// Interface CartItem
interface CartItem extends ApiData {
  quantity: number;
}

const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const CheckShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00b894" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const TruckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00b894" strokeWidth="2">
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

// Tab options
type TabKey = 'ingredients' | 'usage' | 'dosage' | 'sideEffects' | 'precautions' | 'preservation';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'ingredients', label: 'Thành phần' },
  { key: 'usage', label: 'Công dụng' },
  { key: 'dosage', label: 'Cách dùng' },
  { key: 'sideEffects', label: 'Tác dụng phụ' },
  { key: 'precautions', label: 'Lưu ý' },
  { key: 'preservation', label: 'Bảo quản' },
];

const ProductDetail: React.FC = () => {
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<{ unit: string, price: number } | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('ingredients');

  const navigate = useNavigate();
  const [search] = useSearchParams();
  const productID = search.get("productId");

  useEffect(() => {
    const loadDetail = async () => {
      if (!productID) return;
      try {
        setLoading(true);
        const data = await fetchProductById(productID);
        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          const defaultVar = data.variants.find(v => v.unit === 'Hộp') || data.variants[0];
          setSelectedVariant(defaultVar);
        } else {
          setSelectedVariant({ unit: data.unit || 'Hộp', price: data.cost || 0 });
        }
        setLoading(false);
      } catch (err: any) {
        console.error(err);
        setError("Không thể tải thông tin sản phẩm");
        setLoading(false);
      }
    };
    loadDetail();
  }, [productID]);

  const handleAddToCart = (item: ApiData, isBuyNow = false) => {
    const itemToAdd = {
      ...item,
      cost: selectedVariant?.price || item.cost,
      unit: selectedVariant?.unit || item.unit
    };

    if (isBuyNow) {
      const buyNowItem: CartItem = { ...itemToAdd, quantity: 1, status: true };
      localStorage.setItem("buyNowCart", JSON.stringify([buyNowItem]));
      navigate("/ShoppingCart?mode=buy_now");
      return;
    }

    const cartData = localStorage.getItem("shoppingCart");
    let cartItems: CartItem[] = cartData ? JSON.parse(cartData) : [];

    const existingItemIndex = cartItems.findIndex(
      (cartItem) => String(cartItem._id) === String(item._id) && cartItem.unit === itemToAdd.unit
    );

    if (existingItemIndex < 0) {
      const newItem: CartItem = { ...itemToAdd, quantity: 1, status: true };
      cartItems.push(newItem);
    } else {
      cartItems[existingItemIndex].quantity += 1;
    }

    localStorage.setItem("shoppingCart", JSON.stringify(cartItems));
    alert(`Đã thêm ${itemToAdd.unit} vào giỏ hàng!`);
  };

  // Get content for active tab
  const getTabContent = () => {
    if (!product) return <p style={{ color: '#666' }}>Chưa có dữ liệu.</p>;

    const content: Record<TabKey, string | undefined> = {
      ingredients: product.ingredients,
      usage: product.usage,
      dosage: product.dosage || product.usage, // fallback to usage if no dosage
      sideEffects: product.sideEffects,
      precautions: product.precautions,
      preservation: product.preservation,
    };

    const text = content[activeTab];
    if (!text) {
      return <p style={{ color: '#888', fontStyle: 'italic' }}>Chưa có dữ liệu.</p>;
    }

    return (
      <div style={{ whiteSpace: 'pre-line', lineHeight: 1.7, color: '#333' }}>
        {text}
      </div>
    );
  };

  if (!productID) return <div>Invalid Product ID</div>;
  if (loading) return <div className={styles.loading}>Đang tải chi tiết sản phẩm...</div>;
  if (error || !product) return <div className={styles.error}>{error || "Sản phẩm không tồn tại"}</div>;

  const displayPrice = selectedVariant ? selectedVariant.price : (product.cost || 0);
  const displayUnit = selectedVariant ? selectedVariant.unit : (product.unit || 'Hộp');

  return (
    <div className={styles.hero}>
      <div className={styles.container}>
        {/* Left Column - Images */}
        <div className={styles.leftColumn}>
          <div className={styles.mainImageContainer}>
            <img src={product.img} alt={product.productName} className={styles.mainImage} />
          </div>
          <div className={styles.gallery}>
            <div className={`${styles.galleryItem} ${styles.active}`}>
              <img src={product.img} alt="Thumb" className={styles.galleryImg} />
            </div>
          </div>
        </div>

        {/* Right Column - Info */}
        <div className={styles.rightColumn}>
          <div className={styles.brand}>Thương hiệu: {product.brand || "Đang cập nhật"}</div>
          <h1 className={styles.title}>{product.productName}</h1>

          <div className={styles.metaInfo}>
            <span className={styles.sku}>SKU: {product.id}</span>
            <div className={styles.rating}>
              <span>4.9</span> <StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon />
            </div>
            <span className={styles.link}>Xem đánh giá</span>
          </div>

          <div className={styles.priceContainer}>
            <div className={styles.priceRow}>
              <span className={styles.currentPrice}>
                {new Intl.NumberFormat("vi-VN").format(displayPrice)}đ
              </span>
              <span className={styles.unit}>/ {displayUnit}</span>
            </div>
          </div>

          <div className={styles.specsContainer}>
            {/* Variant Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className={styles.specRow}>
                <span className={styles.specLabel}>Chọn đơn vị tính</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {product.variants.map((v, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedVariant(v)}
                      className={styles.unitTag}
                      style={{
                        border: selectedVariant?.unit === v.unit ? '2px solid #00b894' : '1px solid #ddd',
                        color: selectedVariant?.unit === v.unit ? '#00b894' : '#333',
                        fontWeight: selectedVariant?.unit === v.unit ? 'bold' : 'normal',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        padding: '5px 10px',
                        borderRadius: '5px'
                      }}
                    >
                      {v.unit}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.specRow}>
              <span className={styles.specLabel}>Danh mục</span>
              <span className={styles.specValue}>{product.category || "N/A"}</span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Xuất xứ</span>
              <span className={styles.specValue}>{product.origin || "Đang cập nhật"}</span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Nhà sản xuất</span>
              <span className={styles.specValue}>{product.manufacturer || product.brand || "Đang cập nhật"}</span>
            </div>
          </div>

          {/* Buttons Group */}
          <div className={styles.buttonGroup}>
            {product.category === "Thuốc theo đơn" ? (
              <button className={styles.btnBuy} style={{ backgroundColor: '#ff9800' }}
                onClick={() => alert("Vui lòng liên hệ dược sĩ để được tư vấn thuốc kê đơn.")}
              >
                Tư vấn ngay
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <button
                  className={styles.btnBuy}
                  style={{ backgroundColor: '#00b894' }}
                  onClick={() => product && handleAddToCart(product, true)}
                >
                  Mua ngay
                </button>
                <button
                  className={styles.btnBuy}
                  style={{ backgroundColor: '#fff', color: '#00b894', border: '1px solid #00b894' }}
                  onClick={() => product && handleAddToCart(product, false)}
                >
                  Thêm vào giỏ
                </button>
              </div>
            )}
            <button className={styles.btnFindStore}>Tìm nhà thuốc</button>
          </div>

          {/* Footer Badges */}
          <div className={styles.footerBadges}>
            <div className={styles.badgeItem}>
              <CheckShieldIcon />
              <div><div style={{ fontWeight: 600 }}>Đổi trả trong 30 ngày</div><div style={{ color: "#777", fontSize: "11px" }}>kể từ ngày mua hàng</div></div>
            </div>
            <div className={styles.badgeItem}>
              <TruckIcon />
              <div><div style={{ fontWeight: 600 }}>Miễn phí vận chuyển</div><div style={{ color: "#777", fontSize: "11px" }}>theo chính sách</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs Section */}
      <div className={styles.tabsSection}>
        <div className={styles.tabsSidebar}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`${styles.tabButton} ${activeTab === tab.key ? styles.tabButtonActive : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className={styles.tabContent}>
          <h2 className={styles.tabContentTitle}>
            {TABS.find(t => t.key === activeTab)?.label} của {product.productName}
          </h2>
          {getTabContent()}
        </div>
      </div>

      {/* Warning Note */}
      <div className={styles.warningNote}>
        <span className={styles.warningIcon}>⚠️</span>
        Mọi thông tin trên đây chỉ mang tính chất tham khảo. Việc sử dụng thuốc phải tuân theo hướng dẫn của bác sĩ chuyên môn.
      </div>
    </div>
  );
};

export default ProductDetail;
