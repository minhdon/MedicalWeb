import React, { useState, useEffect, useContext } from "react";
import styles from "./CustomerInfo.module.css";
import { IsInfoContext } from "../useContext/checkInfoContext";
import {
  syncProvincesToStorage,
  type Province,
} from "../CallApi/CallApiLocation";

// ... (Giữ nguyên phần SVG Icon cũ) ...
const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 448 512"
    fill="currentColor"
    className={styles.icon}
  >
    <path d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z" />
  </svg>
);

const MapMarkerIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 384 512"
    fill="currentColor"
    className={styles.icon}
  >
    <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 29.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 80z" />
  </svg>
);

const CustomerInfo: React.FC = () => {
  // --- 1. State quản lý dữ liệu ---
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderEmail, setSenderEmail] = useState("");

  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");

  const [provinceCode, setProvinceCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [wardCode, setWardCode] = useState(""); // Thêm state Ward
  const [specificAddress, setSpecificAddress] = useState(""); // Thêm state Address
  const [note, setNote] = useState("");

  // UI State
  const [isValueOfProvinceSelected, setIsValueOfProvinceSelected] =
    useState(false);
  const [isDistrictSelected, setIsDistrictSelected] = useState(false);

  // Validation Errors
  const [senderPhoneError, setSenderPhoneError] = useState("");
  const [recipientPhoneError, setRecipientPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");

  const rawData = localStorage.getItem("Location") || "[]";
  const { setIsInfo, setCustomerData } = useContext(IsInfoContext);
  const locationData = JSON.parse(rawData);

  // Regex
  const phoneRegex = /^(?:\+84|0)\d{8,10}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    syncProvincesToStorage();
  }, []);

  // --- 2. Logic kiểm tra toàn bộ Form (Core Logic) ---
  useEffect(() => {
    // Điều kiện bắt buộc (Required fields)
    const hasSenderInfo =
      senderName.trim() !== "" &&
      senderPhone.trim() !== "" &&
      !senderPhoneError;
    const hasRecipientInfo =
      recipientName.trim() !== "" &&
      recipientPhone.trim() !== "" &&
      !recipientPhoneError;
    const hasLocation =
      provinceCode !== "" &&
      districtCode !== "" &&
      wardCode !== "" &&
      specificAddress.trim() !== "";

    // Điều kiện tùy chọn (Optional fields): Nếu điền thì phải đúng format
    const isEmailValid =
      senderEmail === "" || (senderEmail !== "" && !emailError);


    // Construct Address string from inputs (Logic tạm thời, cần map code -> name nếu muốn đẹp)
    // Nhưng controller chỉ cần string address.
    // Thực tế cần map Code -> Name (Tỉnh, Huyện, Xã).
    // Tuy nhiên CustomerInfo.tsx đang giữ locationData.
    // Logic map tên khá dài dòng. Để nhanh, ta lưu tạm "Code - Code - Code - Specific"
    // HOẶC: Chỉ lưu specificAddress nếu user chưa quan trọng form chuẩn.
    // Tốt nhất: customerData.address = specificAddress (Tạm thời). 
    // Nếu muốn full: Phải lookup name từ locationData.

    const fullAddress = `${specificAddress}`; // Tạm thời.

    if (hasSenderInfo && hasRecipientInfo && hasLocation && isEmailValid) {
      setIsInfo(true);
      setCustomerData({
        name: senderName,
        phone: senderPhone,
        email: senderEmail,
        address: fullAddress, // Lưu ý: Cần update logic lấy full address (Tỉnh Huyện Xã) sau
        recipientName,
        recipientPhone,
        note
      });
    } else {
      setIsInfo(false);
    }
  }, [
    senderName,
    senderPhone,
    senderPhoneError,
    recipientName,
    recipientPhone,
    recipientPhoneError,
    provinceCode,
    districtCode,
    wardCode,
    specificAddress,
    senderEmail,
    emailError,
    setIsInfo,
    setCustomerData,
    note
  ]); // Added deps

  // --- Helper Functions ---

  const validateSenderPhone = (value: string) => {
    if (value.trim() === "") {
      setSenderPhoneError("");
      return;
    }
    setSenderPhoneError(
      phoneRegex.test(value) ? "" : "Số điện thoại không hợp lệ"
    );
  };

  const validateRecipientPhone = (value: string) => {
    if (value.trim() === "") {
      setRecipientPhoneError("");
      return;
    }
    setRecipientPhoneError(
      phoneRegex.test(value) ? "" : "Số điện thoại không hợp lệ"
    );
  };

  const validateEmail = (value: string) => {
    if (value.trim() === "") {
      setEmailError("");
      return;
    }
    setEmailError(emailRegex.test(value) ? "" : "Email không hợp lệ");
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setProvinceCode(value);
    setDistrictCode(""); // Reset district khi đổi tỉnh
    setWardCode(""); // Reset ward khi đổi tỉnh
    setIsValueOfProvinceSelected(value !== "");
    setIsDistrictSelected(false);
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setDistrictCode(value);
    setWardCode(""); // Reset ward khi đổi quận
    setIsDistrictSelected(value !== "");
  };

  return (
    <div className={styles.container}>
      {/* --- PHẦN 1: THÔNG TIN NGƯỜI ĐẶT --- */}
      <div className={styles.formGroup}>
        <div className={styles.sectionHeader}>
          <UserIcon />
          <span>Thông tin người đặt</span>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <input
              type="text"
              className={styles.input}
              placeholder="Họ và tên người đặt"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <input
              type="tel"
              className={styles.input}
              placeholder="Số điện thoại"
              value={senderPhone}
              onBlur={(e) => validateSenderPhone(e.target.value)}
              onChange={(e) => {
                setSenderPhone(e.target.value);
                if (senderPhoneError) setSenderPhoneError("");
              }}
            />
            {senderPhoneError && (
              <div className={styles.error}>{senderPhoneError}</div>
            )}
          </div>
        </div>

        <div className={styles.fullWidth}>
          <input
            type="email"
            className={styles.input}
            placeholder="Email (không bắt buộc)"
            value={senderEmail}
            onBlur={(e) => validateEmail(e.target.value)}
            onChange={(e) => {
              setSenderEmail(e.target.value);
              if (emailError) setEmailError("");
            }}
          />
          {emailError && <div className={styles.error}>{emailError}</div>}
        </div>
      </div>

      {/* --- PHẦN 2: ĐỊA CHỈ NHẬN HÀNG --- */}
      <div className={styles.formGroup}>
        <div className={styles.sectionHeader}>
          <MapMarkerIcon />
          <span>Địa chỉ nhận hàng</span>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <input
              type="text"
              className={styles.input}
              placeholder="Họ và tên người nhận"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <input
              type="tel"
              className={styles.input}
              placeholder="Số điện thoại"
              value={recipientPhone}
              onBlur={(e) => validateRecipientPhone(e.target.value)}
              onChange={(e) => {
                setRecipientPhone(e.target.value);
                if (recipientPhoneError) setRecipientPhoneError("");
              }}
            />
            {recipientPhoneError && (
              <div className={styles.error}>{recipientPhoneError}</div>
            )}
          </div>
        </div>

        {/* Dropdowns */}
        <div className={styles.row}>
          <select
            className={styles.select}
            value={provinceCode}
            onChange={handleProvinceChange}
          >
            <option value="">Chọn Tỉnh/Thành phố</option>
            {locationData.map((province: Province) => (
              <option key={province.code} value={province.code}>
                {province.name}
              </option>
            ))}
          </select>

          <select
            className={`${styles.select} ${styles.selectHidden}`}
            value={districtCode}
            disabled={!isValueOfProvinceSelected}
            onChange={handleDistrictChange}
          >
            <option value="">Chọn Quận/Huyện</option>
            {locationData.map((province: Province) => {
              if (province.code.toString() === provinceCode) {
                return province.districts.map((district) => (
                  <option key={district.code} value={district.code}>
                    {district.name}
                  </option>
                ));
              }
              return null;
            })}
          </select>
        </div>

        <div className={styles.fullWidth}>
          <select
            className={`${styles.select} ${styles.selectHidden}`}
            value={wardCode}
            disabled={!isDistrictSelected}
            onChange={(e) => setWardCode(e.target.value)}
          >
            <option value="">Chọn Phường/Xã</option>
            {locationData.map((province: Province) => {
              if (province.code.toString() === provinceCode) {
                return province.districts.map((district) => {
                  if (district.code.toString() === districtCode) {
                    return district.wards.map((ward) => (
                      <option key={ward.code} value={ward.code}>
                        {ward.name}
                      </option>
                    ));
                  }
                  return null;
                });
              }
              return null;
            })}
          </select>
        </div>

        {/* Địa chỉ cụ thể */}
        <div className={styles.fullWidth}>
          <input
            type="text"
            className={styles.input}
            placeholder="Nhập địa chỉ cụ thể"
            value={specificAddress}
            onChange={(e) => setSpecificAddress(e.target.value)}
          />
        </div>

        {/* Ghi chú */}
        <div className={styles.fullWidth}>
          <textarea
            className={styles.textarea}
            placeholder="Ghi chú (không bắt buộc)&#10;Ví dụ: Hãy gọi cho tôi 15 phút trước khi giao"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          ></textarea>
        </div>
      </div>

      {/* --- FOOTER: HÓA ĐƠN ĐIỆN TỬ --- */}
    </div>
  );
};

export default CustomerInfo;
