import axios from 'axios';

const API_URL = 'http://localhost:3000/api/customer';

export const customerService = {
  // Update customer info
  updateCustomer: async (id: string, data: any) => {
    return await axios.put(`${API_URL}/update/${id}`, data);
  },
};
