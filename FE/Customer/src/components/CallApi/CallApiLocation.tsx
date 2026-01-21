// 1. Định nghĩa Type cho cấu trúc Depth = 3 (Rất quan trọng để code gợi ý đúng)
export interface Ward {
  code: number;
  name: string;
  division_type: string;
  codename: string;
}

export interface District {
  code: number;
  name: string;
  division_type: string;
  codename: string;
  wards: Ward[]; // Chứa danh sách xã/phường
}

export interface Province {
  code: number;
  name: string;
  division_type: string;
  codename: string;
  phone_code: number;
  districts: District[]; // Chứa danh sách quận/huyện
}

const STORAGE_KEY = "Location"; // Key lưu trữ
const API_URL = "https://provinces.open-api.vn/api/?depth=3";

/**
 * Hàm gọi API và lưu xuống LocalStorage
 * @param forceUpdate : Nếu true, sẽ bắt buộc gọi API mới đè lên dữ liệu cũ
 */
export const syncProvincesToStorage = async (
  forceUpdate: boolean = false
): Promise<void> => {
  try {
    // 1. Kiểm tra nếu đã có dữ liệu và không yêu cầu force update thì dừng lại
    if (!forceUpdate) {
      const existingData = localStorage.getItem(STORAGE_KEY);
      if (existingData) {
        console.log(
          "✅ Dữ liệu (Depth=3) đã tồn tại trong LocalStorage. Bỏ qua việc gọi API."
        );
        return;
      }
    }

    // 2. Gọi API
    console.log("⏳ Đang tải toàn bộ dữ liệu Tỉnh/Huyện/Xã (Depth=3)...");
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Lỗi HTTP: ${response.status}`);
    }

    const data: Province[] = await response.json();

    data.sort((a, b) => a.name.localeCompare(b.name, "vi"));

    data.forEach((province) => {
      // Sắp xếp quận huyện
      province.districts.sort((a, b) => a.name.localeCompare(b.name, "vi"));

      // Sắp xếp phường xã trong từng quận
      province.districts.forEach((district) => {
        district.wards.sort((a, b) => a.name.localeCompare(b.name, "vi"));
      });
    });

    // 3. Lưu xuống LocalStorage
    // Lưu ý: Dữ liệu depth=3 khá lớn, có thể gây lỗi QuotaExceededError nếu bộ nhớ đầy
    try {
      const jsonString = JSON.stringify(data);
      localStorage.setItem(STORAGE_KEY, jsonString);
      console.log(
        `🎉 Đã lưu thành công ${data.length} tỉnh thành vào LocalStorage.`
      );
    } catch (storageError) {
      console.error(
        "⚠️ Không thể lưu vào LocalStorage (có thể do tràn bộ nhớ):",
        storageError
      );
    }
  } catch (error) {
    console.error("❌ Lỗi quá trình đồng bộ dữ liệu:", error);
  }
};

/**
 * Hàm phụ trợ: Lấy dữ liệu từ LocalStorage ra để dùng (khi cần)
 */
export const getProvincesFromStorage = (): Province[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};
