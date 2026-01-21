import axios from 'axios';

const API_URL = 'http://localhost:3000/api/saleInvoice';

export const orderService = {
  // Get orders by user ID (for purchase history)
  getOrdersByUserId: async (userId: string) => {
    return await axios.get(`${API_URL}/user/${userId}`);
  },
};
