import React, { useState, useEffect, useContext } from "react";
import { IsInfoContext } from "../useContext/checkInfoContext";
import styles from "./CustomerInfo.module.css";

interface CustomerData {
    id?: string;
    name: string;
    phone: string;
    email?: string;
}

// Simplified form for staff in-store sales
// Only requires: Phone number + Customer name
// No address/shipping info needed

const StaffCustomerForm: React.FC = () => {
    const [phone, setPhone] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [foundCustomer, setFoundCustomer] = useState<CustomerData | null>(null);
    const [phoneError, setPhoneError] = useState("");
    const [isNewCustomer, setIsNewCustomer] = useState(false);

    const { setIsInfo, setCustomerData } = useContext(IsInfoContext);

    const phoneRegex = /^(?:\+84|0)\d{8,10}$/;

    // Search customer when phone has enough digits
    const searchCustomer = async (phoneNumber: string) => {
        if (phoneNumber.length < 10) {
            setFoundCustomer(null);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(
                `http://localhost:3000/api/customer/search?phone=${phoneNumber}`
            );
            const data = await response.json();

            if (data.found && data.customer) {
                setFoundCustomer(data.customer);
                setCustomerName(data.customer.name);
                setIsNewCustomer(false);
            } else {
                setFoundCustomer(null);
                setIsNewCustomer(true);
            }
        } catch (error) {
            console.error("Error searching customer:", error);
            setFoundCustomer(null);
        } finally {
            setIsSearching(false);
        }
    };

    // Validate phone on blur
    const validatePhone = (value: string) => {
        if (value.trim() === "") {
            setPhoneError("");
            return;
        }
        setPhoneError(phoneRegex.test(value) ? "" : "Số điện thoại không hợp lệ");
    };

    // Update context when form is valid
    useEffect(() => {
        const isValid =
            phone.trim().length >= 10 &&
            !phoneError &&
            customerName.trim().length > 0;

        if (isValid) {
            setIsInfo(true);
            setCustomerData({
                name: customerName,
                phone: phone,
                email: "",
                address: "Bán tại cửa hàng", // Placeholder for in-store sales
                customerId: foundCustomer?.id || null,
                isNewCustomer: isNewCustomer,
            });
        } else {
            setIsInfo(false);
        }
    }, [phone, customerName, phoneError, foundCustomer, isNewCustomer, setIsInfo, setCustomerData]);

    return (
        <div className={styles.container}>
            <div className={styles.formGroup}>
                <div className={styles.sectionHeader}>
                    <span style={{ fontSize: "20px", fontWeight: "bold", color: "#1d48ba" }}>
                        🏪 Thông tin khách hàng (Bán tại cửa hàng)
                    </span>
                </div>

                {/* Phone Number Input */}
                <div className={styles.fullWidth} style={{ marginTop: "16px" }}>
                    <label style={{ fontWeight: "500", marginBottom: "8px", display: "block" }}>
                        Số điện thoại khách hàng *
                    </label>
                    <div style={{ position: "relative" }}>
                        <input
                            type="tel"
                            className={styles.input}
                            placeholder="Nhập SĐT để tìm khách hàng..."
                            value={phone}
                            onChange={(e) => {
                                setPhone(e.target.value);
                                if (phoneError) setPhoneError("");
                                // Auto search when 10+ digits
                                if (e.target.value.length >= 10) {
                                    searchCustomer(e.target.value);
                                }
                            }}
                            onBlur={(e) => {
                                validatePhone(e.target.value);
                                searchCustomer(e.target.value);
                            }}
                            style={{
                                fontSize: "18px",
                                padding: "12px 16px",
                                border: foundCustomer ? "2px solid #4caf50" : undefined
                            }}
                        />
                        {isSearching && (
                            <span style={{
                                position: "absolute",
                                right: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "#666"
                            }}>
                                Đang tìm...
                            </span>
                        )}
                    </div>
                    {phoneError && <div className={styles.error}>{phoneError}</div>}
                </div>

                {/* Customer Found Indicator */}
                {foundCustomer && (
                    <div style={{
                        backgroundColor: "#e8f5e9",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        marginTop: "12px",
                        border: "1px solid #4caf50"
                    }}>
                        <span style={{ color: "#2e7d32", fontWeight: "500" }}>
                            ✅ Tìm thấy khách hàng: <strong>{foundCustomer.name}</strong>
                        </span>
                    </div>
                )}

                {/* New Customer Indicator */}
                {isNewCustomer && phone.length >= 10 && !isSearching && (
                    <div style={{
                        backgroundColor: "#fff3e0",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        marginTop: "12px",
                        border: "1px solid #ff9800"
                    }}>
                        <span style={{ color: "#e65100", fontWeight: "500" }}>
                            🆕 Khách hàng mới - Vui lòng nhập tên
                        </span>
                    </div>
                )}

                {/* Customer Name Input */}
                <div className={styles.fullWidth} style={{ marginTop: "16px" }}>
                    <label style={{ fontWeight: "500", marginBottom: "8px", display: "block" }}>
                        Tên khách hàng *
                    </label>
                    <input
                        type="text"
                        className={styles.input}
                        placeholder="Tên khách hàng"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        disabled={!!foundCustomer} // Disable if found existing customer
                        style={{
                            fontSize: "18px",
                            padding: "12px 16px",
                            backgroundColor: foundCustomer ? "#f5f5f5" : undefined
                        }}
                    />
                    {foundCustomer && (
                        <small style={{ color: "#666" }}>
                            Tên được tự động điền từ hệ thống
                        </small>
                    )}
                </div>

                {/* Clear Selection Button */}
                {foundCustomer && (
                    <button
                        type="button"
                        onClick={() => {
                            setFoundCustomer(null);
                            setCustomerName("");
                            setIsNewCustomer(true);
                        }}
                        style={{
                            marginTop: "12px",
                            padding: "8px 16px",
                            backgroundColor: "#f5f5f5",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "14px"
                        }}
                    >
                        Nhập khách hàng khác
                    </button>
                )}
            </div>
        </div>
    );
};

export default StaffCustomerForm;
