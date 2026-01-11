export const createOrderAPI = async (orderData: any) => {
    try {
        const response = await fetch('http://localhost:3000/api/sale-invoice/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData),
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Lỗi khi tạo đơn hàng');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
};
