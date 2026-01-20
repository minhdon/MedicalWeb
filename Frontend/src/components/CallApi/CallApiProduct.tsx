import { useState, useEffect } from "react";

const API_URL = "http://localhost:3000/api/product/getAll";

// Export interface để File hiển thị có thể dùng lại
export interface ApiData {
  id: number;
  _id?: string; // MongoDB ID
  productName: string;
  cost: number;
  status: boolean;
  img: string;
  productDesc: string;
  quantity?: number;
  category?: string;
  // Fields chi tiết
  unit?: string;
  variants?: { unit: string; price: number }[];
  brand?: string;
  origin?: string;
  manufacturer?: string;
  ingredients?: string;
  usage?: string;
  dosage?: string; // Liều dùng/Cách dùng
  sideEffects?: string; // Tác dụng phụ
  precautions?: string; // Lưu ý
  preservation?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalDocs: number;
  limit: number;
}

export interface ApiResponse {
  data: ApiData[];
  pagination: PaginationInfo;
}

// Hàm Fetch thủ công (Hỗ trợ Pagination & Prefetching & Filter)
export const fetchProductsByPage = async (page: number, limit: number = 8, filters: Record<string, any> = {}) => {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  // Append filters
  Object.keys(filters).forEach(key => {
    const value = filters[key];
    if (Array.isArray(value)) {
      value.forEach(v => params.append(key, v));
    } else if (value !== undefined && value !== null && value !== "") {
      params.append(key, value.toString());
    }
  });

  const response = await fetch(`${API_URL}?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json() as ApiResponse;
};

// Hàm Fetch Chi tiết
export const fetchProductById = async (id: string | number) => {
  const detailUrl = API_URL.replace('/getAll', '') + `/${id}`;
  const response = await fetch(detailUrl, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json() as ApiData;
};

export const useProductFetcher = () => {
  const [data, setData] = useState<ApiData[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Đang gọi API:", API_URL);
        const response = await fetch(API_URL, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `HTTP error! status: ${response.status} - ${errorText || response.statusText
            }`
          );
        }

        const result = await response.json();
        console.log("API Response:", result);

        // --- XỬ LÝ DỮ LIỆU ĐỂ LẤY MẢNG CHUẨN ---
        let finalData: ApiData[] = [];

        if (Array.isArray(result)) {
          finalData = result;
        } else if (result.results && Array.isArray(result.results)) {
          finalData = result.results;
        } else if (result.data && Array.isArray(result.data)) {
          finalData = result.data;
        } else {
          finalData = [result];
        }

        // --- CẬP NHẬT STATE VÀ LƯU LOCAL STORAGE ---
        setData(finalData);

        // Lưu mảng chuẩn xuống Local Storage
        try {
          localStorage.setItem("products", JSON.stringify(finalData));
          console.log("Đã lưu data xuống LocalStorage");
        } catch (storageErr) {
          console.warn("Lỗi lưu storage (có thể do quota):", storageErr);
        }
      } catch (e) {
        console.error("Error fetching data:", e);
        if (e instanceof TypeError && e.message.includes("fetch")) {
          setError("Không thể kết nối API. Kiểm tra Server Django và CORS.");
        } else if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Trả về dữ liệu để File giao diện sử dụng
  return { data, loading, error };
};
