import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import styles from './PaymentResult.module.css';

const PaymentResult: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const status = searchParams.get('status');
    const orderId = searchParams.get('orderId');
    const code = searchParams.get('code');
    const message = searchParams.get('message');

    const isSuccess = status === 'success';
    const isFailed = status === 'failed';

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                {isSuccess ? (
                    <>
                        <div className={styles.iconSuccess}>✓</div>
                        <h1 className={styles.titleSuccess}>Thanh toán thành công!</h1>
                        <p className={styles.message}>
                            Đơn hàng <strong>{orderId}</strong> đã được thanh toán.
                        </p>
                        <p className={styles.subMessage}>
                            Cảm ơn bạn đã mua hàng. Đơn hàng sẽ được xử lý trong thời gian sớm nhất.
                        </p>
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
