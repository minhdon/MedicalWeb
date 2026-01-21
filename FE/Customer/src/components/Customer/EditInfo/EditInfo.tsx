import React, { useState, useEffect, useContext } from "react";
import styles from "./EditInfo.module.css";
import { IsInfoContext } from "../../useContext/checkInfoContext";
import {
  syncProvincesToStorage,
  type Province,
} from "../../CallApi/CallApiLocation";
import { customerService } from "../../../services/customerService";
import { useAuth } from "../../../contexts/AuthContext";

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

const EditInfo: React.FC = () => {
  const { user, updateUser } = useAuth();

  // --- 1. State quản lý dữ liệu ---
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderEmail, setSenderEmail] = useState("");

  const [provinceCode, setProvinceCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [specificAddress, setSpecificAddress] = useState("");

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // UI State
  const [isValueOfProvinceSelected, setIsValueOfProvinceSelected] =
    useState(false);
  const [isDistrictSelected, setIsDistrictSelected] = useState(false);

  // Validation Errors
  const [senderPhoneError, setSenderPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");

  const rawData = localStorage.getItem("Location") || "[]";
  const { setIsInfo } = useContext(IsInfoContext); // Bỏ isInfo ở đây vì không dùng để check submit nữa
  const locationData = JSON.parse(rawData);

  // Regex
  const phoneRegex = /^(?:\+84|0)\d{8,10}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    syncProvincesToStorage();
    if (user) {
      setSenderName(user.fullName || "");
      setSenderPhone(user.phoneNum || "");
      setSenderEmail(user.email || "");
      // Lưu ý: Nếu user có sẵn địa chỉ, bạn cần logic để fill lại province/district/ward code ở đây nếu muốn hiện sẵn
    }
  }, [user]);

  // --- 2. Logic cập nhật Context (Giữ lại để đồng bộ với phần khác của App) ---
  useEffect(() => {
    const hasSenderInfo =
      senderName.trim() !== "" &&
      senderPhone.trim() !== "" &&
      !senderPhoneError;

    const hasLocation =
      provinceCode !== "" &&
      districtCode !== "" &&
      wardCode !== "" &&
      specificAddress.trim() !== "";

    const isEmailValid =
      senderEmail === "" || (senderEmail !== "" && !emailError);

    if (hasSenderInfo && hasLocation && isEmailValid) {
      setIsInfo(true);
    } else {
      setIsInfo(false);
    }
  }, [
    senderName,
    senderPhone,
    senderPhoneError,
    provinceCode,
    districtCode,
    wardCode,
    specificAddress,
    senderEmail,
    emailError,
    setIsInfo,
  ]);

  const validateSenderPhone = (value: string) => {
    if (value.trim() === "") {
      setSenderPhoneError("");
      return;
    }
    setSenderPhoneError(
      phoneRegex.test(value) ? "" : "Số điện thoại không hợp lệ",
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
    setDistrictCode("");
    setWardCode("");
    setIsValueOfProvinceSelected(value !== "");
    setIsDistrictSelected(false);
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setDistrictCode(value);
    setWardCode("");
    setIsDistrictSelected(value !== "");
  };

  // --- 3. Logic Xử lý Submit (Đã sửa đổi) ---
  const handleCheckIsInfo = async () => {
    // A. Kiểm tra trực tiếp
    const hasRequiredFields =
      senderName.trim() !== "" &&
      senderPhone.trim() !== "" &&
      provinceCode !== "" &&
      districtCode !== "" &&
      wardCode !== "" &&
      specificAddress.trim() !== "";

    const isPhoneValid = phoneRegex.test(senderPhone);
    const isEmailValid = senderEmail === "" || emailRegex.test(senderEmail);

    if (!hasRequiredFields || !isPhoneValid || !isEmailValid) {
      if (!isPhoneValid && senderPhone !== "")
        setSenderPhoneError("Số điện thoại không hợp lệ");
      if (!isEmailValid && senderEmail !== "")
        setEmailError("Email không hợp lệ");
      setShowErrorModal(true);
      return;
    }

    // B. Gọi API
    try {
      if (!user?.id) return;

      // Tìm địa điểm (SỬA LẠI ĐÂY)
      const province = locationData.find(
        (p: any) => p.code.toString() === provinceCode,
      );
      const district = province?.districts.find(
        (d: any) => d.code.toString() === districtCode,
      );
      const ward = district?.wards.find(
        (w: any) => w.code.toString() === wardCode,
      );

      // THÊM KIỂM TRA
      if (!province || !district || !ward) {
        console.error("Không tìm thấy địa chỉ hợp lệ");
        setShowErrorModal(true);
        return;
      }

      const fullAddress = `${specificAddress}, ${ward.name}, ${district.name}, ${province.name}`;

      const updateData = {
        name: senderName,
        phone: senderPhone,
        email: senderEmail,
        address: fullAddress,
      };

      const response = await customerService.updateCustomer(
        user.id,
        updateData,
      );

      if (response.data && response.data.data) {
        const updatedUser = {
          ...user,
          fullName: response.data.data.fullName,
          phoneNum: response.data.data.phoneNum,
          email: response.data.data.email,
          address: response.data.data.address,
        };
        updateUser(updatedUser);
      }

      setShowConfirmModal(true);
    } catch (error) {
      console.error("Failed to update info", error);
      setShowErrorModal(true);
    }
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
  };

  return (
    <section className={styles.container}>
      <div className={styles.infoZone}>
        {/* --- PHẦN 1: THÔNG TIN KHÁCH HÀNG --- */}
        <div className={styles.formGroup}>
          <div className={styles.sectionHeader}>
            <UserIcon />
            <span>Thông tin khách hàng</span>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                <span className={styles.requiredStar}>*</span>
              </label>
              <input
                type="text"
                className={styles.input}
                placeholder="Họ và tên "
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                <span className={styles.requiredStar}>*</span>
              </label>
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
        <div className={styles.row}></div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              <span className={styles.requiredStar}>*</span>
            </label>
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
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              <span className={styles.requiredStar}>*</span>
            </label>
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
        </div>

        <div className={styles.fullWidth}>
          <label className={styles.fieldLabel}>
            <span className={styles.requiredStar}>*</span>
          </label>
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

        <div className={styles.fullWidth}>
          <label className={styles.fieldLabel}>
            <span className={styles.requiredStar}>*</span>
          </label>
          <input
            type="text"
            className={styles.input}
            placeholder="Nhập địa chỉ cụ thể"
            value={specificAddress}
            onChange={(e) => setSpecificAddress(e.target.value)}
          />
        </div>

        <button className={styles.confirmButton} onClick={handleCheckIsInfo}>
          Xác nhận
        </button>
      </div>

      {showErrorModal && (
        <div className={styles.modalOverlay} onClick={closeErrorModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalTitle}>Thông báo</div>
            <div className={styles.modalMessage}>
              Vui lòng điền đầy đủ và chính xác các thông tin bắt buộc.
            </div>
            <button className={styles.modalButton} onClick={closeErrorModal}>
              Đã hiểu
            </button>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className={styles.modalOverlay} onClick={closeErrorModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalTitle}>Thông báo</div>
            <div className={styles.modalMessage}>
              Thông tin đã được cập nhập.
            </div>
            <button
              className={styles.modalButton}
              onClick={() => {
                window.location.href = "/";
              }}
            >
              Quay về trang chủ
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default EditInfo;
