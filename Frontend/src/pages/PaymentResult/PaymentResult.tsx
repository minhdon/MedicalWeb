import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import styles from './PaymentResult.module.css';

interface OrderItem {
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
}

interface OrderDetail {
    id: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    items: OrderItem[];
    totalAmount: number;
    paymentMethod: string;
    paymentStatus: string;
    createdAt: string;
    vnpayTransactionNo?: string;
    staffName?: string;
    branchName?: string;
    branchAddress?: string;
}

const PaymentResult: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const invoiceRef = useRef<HTMLDivElement>(null);

    const status = searchParams.get('status');
    const orderId = searchParams.get('orderId');
    const code = searchParams.get('code');
    const message = searchParams.get('message');

    const isSuccess = status === 'success';
    const isFailed = status === 'failed';

    const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [showInvoice, setShowInvoice] = useState(false);

    // Fetch order detail when success
    useEffect(() => {
        if (isSuccess && orderId) {
            fetchOrderDetail();
        }
    }, [isSuccess, orderId]);

    const fetchOrderDetail = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://127.0.0.1:3000/api/sale-invoice/${orderId}`);
            const data = await res.json();
            if (res.ok && data) {
                setOrderDetail({
                    id: data._id || orderId,
                    customerName: data.customerId?.fullName || data.customerName || 'Khách hàng',
                    customerPhone: data.customerId?.phoneNum || data.customerPhone || '',
                    customerAddress: data.customerId?.address || data.customerAddress || '',
                    items: data.details?.map((d: any) => ({
                        productName: d.productId?.productName || d.productName || 'Sản phẩm',
                        quantity: d.quantity,
                        unit: d.unit || 'Đơn vị',
                        unitPrice: d.unitPrice || d.price || 0,
                        totalPrice: d.totalPrice || (d.quantity * (d.unitPrice || d.price || 0))
                    })) || [],
                    totalAmount: data.totalAmount || 0,
                    paymentMethod: data.paymentMethod || 'VNPay',
                    paymentStatus: data.paymentStatus || 'paid',
                    createdAt: data.createdAt,
                    vnpayTransactionNo: data.vnpayTransactionNo,
                    staffName: data.staffName || null,
                    branchName: data.branchName || null,
                    branchAddress: data.branchAddress || null
                });
            }
        } catch (error) {
            console.error('Error fetching order detail:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        if (invoiceRef.current) {
            const printContent = invoiceRef.current.innerHTML;
            const originalContent = document.body.innerHTML;

            document.body.innerHTML = `
                <html>
                    <head>
                        <title>Hóa đơn #${orderId}</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; }
                            .invoice-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #00b894; padding-bottom: 20px; }
                            .invoice-header h1 { color: #00b894; margin: 0 0 10px; }
                            .invoice-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
                            .invoice-info-left, .invoice-info-right { width: 48%; }
                            .invoice-info h3 { color: #2d3436; margin: 0 0 10px; }
                            .invoice-info p { margin: 5px 0; color: #636e72; }
                            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                            th, td { border: 1px solid #dfe6e9; padding: 12px; text-align: left; }
                            th { background: #00b894; color: white; }
                            tr:nth-child(even) { background: #f8f9fa; }
                            .total-row { font-weight: bold; background: #e8f5e9 !important; }
                            .invoice-footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dfe6e9; color: #636e72; }
                            @media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
                        </style>
                    </head>
                    <body>
                        ${printContent}
                    </body>
                </html>
            `;

            window.print();
            document.body.innerHTML = originalContent;
            window.location.reload();
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatMoney = (amount: number) => {
        return amount.toLocaleString('vi-VN') + 'đ';
    };

    return (
        <div className={styles.container}>
            <div className={styles.card} style={showInvoice ? { maxWidth: '800px' } : {}}>
                {isSuccess ? (
                    <>
                        <div className={styles.iconSuccess}>✓</div>
                        <h1 className={styles.titleSuccess}>Thanh toán thành công!</h1>
                        <p className={styles.message}>
                            Đơn hàng <strong>{orderId?.slice(-8).toUpperCase()}</strong> đã được thanh toán.
                        </p>
                        <p className={styles.subMessage}>
                            Cảm ơn bạn đã mua hàng. Đơn hàng sẽ được xử lý trong thời gian sớm nhất.
                        </p>

                        {/* Invoice Toggle Button */}
                        {!showInvoice && (
                            <button
                                className={styles.btnPrimary}
                                onClick={() => setShowInvoice(true)}
                                style={{ marginBottom: '1rem', width: '100%' }}
                            >
                                📄 Xem hóa đơn
                            </button>
                        )}

                        {/* Invoice Display */}
                        {showInvoice && (
                            <div ref={invoiceRef} style={{ textAlign: 'left', marginTop: '1rem' }}>
                                <div className="invoice-header" style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #00b894', paddingBottom: '15px' }}>
                                    <h1 style={{ color: '#00b894', margin: '0 0 5px', fontSize: '1.5rem' }}>🏥 PharmaCare</h1>
                                    <p style={{ color: '#636e72', margin: 0 }}>Hệ thống nhà thuốc uy tín</p>
                                    <h2 style={{ marginTop: '15px', color: '#2d3436' }}>HÓA ĐƠN BÁN HÀNG</h2>
                                </div>

                                {loading ? (
                                    <p style={{ textAlign: 'center' }}>Đang tải...</p>
                                ) : orderDetail ? (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap' }}>
                                            <div style={{ width: '32%', minWidth: '200px' }}>
                                                <h4 style={{ color: '#00b894', marginBottom: '8px' }}>Thông tin đơn hàng</h4>
                                                <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Mã đơn:</strong> #{orderId?.slice(-8).toUpperCase()}</p>
                                                <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Ngày:</strong> {formatDate(orderDetail.createdAt)}</p>
                                                <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Thanh toán:</strong> {orderDetail.paymentMethod}</p>
                                                {orderDetail.vnpayTransactionNo && (
                                                    <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Mã GD:</strong> {orderDetail.vnpayTransactionNo}</p>
                                                )}
                                            </div>
                                            <div style={{ width: '32%', minWidth: '200px' }}>
                                                <h4 style={{ color: '#00b894', marginBottom: '8px' }}>Khách hàng</h4>
                                                <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Tên:</strong> {orderDetail.customerName}</p>
                                                {orderDetail.customerPhone && (
                                                    <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>SĐT:</strong> {orderDetail.customerPhone}</p>
                                                )}
                                                {orderDetail.customerAddress && (
                                                    <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Địa chỉ:</strong> {orderDetail.customerAddress}</p>
                                                )}
                                            </div>
                                            <div style={{ width: '32%', minWidth: '200px' }}>
                                                <h4 style={{ color: '#00b894', marginBottom: '8px' }}>Chi nhánh bán hàng</h4>
                                                {orderDetail.branchName ? (
                                                    <>
                                                        <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>CN:</strong> {orderDetail.branchName}</p>
                                                        {orderDetail.branchAddress && (
                                                            <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Địa chỉ:</strong> {orderDetail.branchAddress}</p>
                                                        )}
                                                    </>
                                                ) : (
                                                    <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#636e72' }}>Đơn hàng online</p>
                                                )}
                                                {orderDetail.staffName && (
                                                    <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>NV bán hàng:</strong> {orderDetail.staffName}</p>
                                                )}
                                            </div>
                                        </div>

                                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                                            <thead>
                                                <tr style={{ background: '#00b894', color: 'white' }}>
                                                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #dfe6e9' }}>STT</th>
                                                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #dfe6e9' }}>Sản phẩm</th>
                                                    <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #dfe6e9' }}>SL</th>
                                                    <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #dfe6e9' }}>Đơn giá</th>
                                                    <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #dfe6e9' }}>Thành tiền</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orderDetail.items.map((item, idx) => (
                                                    <tr key={idx} style={{ background: idx % 2 === 0 ? 'white' : '#f8f9fa' }}>
                                                        <td style={{ padding: '10px', border: '1px solid #dfe6e9' }}>{idx + 1}</td>
                                                        <td style={{ padding: '10px', border: '1px solid #dfe6e9' }}>{item.productName}</td>
                                                        <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #dfe6e9' }}>{item.quantity} {item.unit}</td>
                                                        <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #dfe6e9' }}>{formatMoney(item.unitPrice)}</td>
                                                        <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #dfe6e9' }}>{formatMoney(item.totalPrice)}</td>
                                                    </tr>
                                                ))}
                                                <tr style={{ background: '#e8f5e9', fontWeight: 'bold' }}>
                                                    <td colSpan={4} style={{ padding: '12px', border: '1px solid #dfe6e9', textAlign: 'right' }}>TỔNG CỘNG:</td>
                                                    <td style={{ padding: '12px', border: '1px solid #dfe6e9', textAlign: 'right', color: '#00b894', fontSize: '1.1rem' }}>
                                                        {formatMoney(orderDetail.totalAmount)}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        <div className="invoice-footer" style={{ textAlign: 'center', marginTop: '25px', paddingTop: '15px', borderTop: '1px solid #dfe6e9' }}>
                                            <p style={{ color: '#636e72', margin: '5px 0' }}>Cảm ơn quý khách đã mua hàng!</p>
                                            <p style={{ color: '#636e72', margin: '5px 0', fontSize: '0.85rem' }}>Hotline: 1900-xxxx | Email: support@pharmacare.vn</p>
                                        </div>
                                    </>
                                ) : (
                                    <p style={{ textAlign: 'center', color: '#636e72' }}>Không thể tải thông tin đơn hàng</p>
                                )}
                            </div>
                        )}

                        {/* Print Button */}
                        {showInvoice && orderDetail && (
                            <button
                                className={styles.btnPrimary}
                                onClick={handlePrint}
                                style={{ marginTop: '1rem', marginBottom: '1rem', width: '100%' }}
                            >
                                🖨️ In hóa đơn
                            </button>
                        )}
                    </>
                ) : isFailed ? (
                    <>
                        <div className={styles.iconFailed}>✕</div>
                        <h1 className={styles.titleFailed}>Thanh toán thất bại</h1>
                        <p className={styles.message}>
                            Đơn hàng <strong>{orderId}</strong> chưa được thanh toán.
                        </p>
                        <p className={styles.subMessage}>
                            Mã lỗi: {code}. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.
                        </p>
                    </>
                ) : (
                    <>
                        <div className={styles.iconError}>!</div>
                        <h1 className={styles.titleError}>Có lỗi xảy ra</h1>
                        <p className={styles.message}>
                            {message || 'Đã xảy ra lỗi khi xử lý thanh toán.'}
                        </p>
                    </>
                )}

                <div className={styles.actions}>
                    <button
                        className={styles.btnPrimary}
                        onClick={() => navigate('/')}
                    >
                        Về trang chủ
                    </button>
                    <button
                        className={styles.btnSecondary}
                        onClick={() => navigate('/orders')}
                    >
                        Xem đơn hàng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentResult;
