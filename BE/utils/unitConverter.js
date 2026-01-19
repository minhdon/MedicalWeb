/**
 * Unit Converter Utilities
 * Handles conversion between different units (e.g., Hộp ↔ Viên) based on Product.variants
 */

import { Product } from '../models/product/Product.js';

/**
 * Convert a quantity from a specific unit to the base unit
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity to convert
 * @param {string} fromUnit - Unit to convert from (e.g., "Hộp")
 * @returns {Promise<{baseQuantity: number, baseUnit: string}>}
 */
export async function convertToBaseUnit(productId, quantity, fromUnit) {
    const product = await Product.findById(productId);

    if (!product) {
        throw new Error('Sản phẩm không tồn tại');
    }

    // If no variants, treat as single-unit product
    if (!product.variants || product.variants.length === 0) {
        return {
            baseQuantity: quantity,
            baseUnit: product.unit || 'Đơn vị',
            ratio: 1
        };
    }

    // Find the variant matching the fromUnit
    const variant = product.variants.find(v => v.unit === fromUnit);
    if (!variant) {
        throw new Error(`Đơn vị "${fromUnit}" không hợp lệ cho sản phẩm ${product.productName}`);
    }

    // Base unit = variant with ratio 1 (smallest unit)
    const baseVariant = product.variants.find(v => v.ratio === 1) || product.variants[0];
    const baseUnit = baseVariant.unit;

    // Convert: quantity × ratio
    // Example: 5 Hộp × 50 = 250 Viên
    const ratio = variant.ratio || 1;
    const baseQuantity = quantity * ratio;

    return { baseQuantity, baseUnit, ratio };
}

/**
 * Format a base quantity into human-readable string
 * @param {number} baseQuantity - Quantity in base unit
 * @param {Array} variants - Product variants with conversion ratios
 * @returns {string} Formatted string (e.g., "49 Hộp 45 Viên")
 */
export function formatQuantity(baseQuantity, variants) {
    if (!variants || variants.length === 0) {
        return `${baseQuantity}`;
    }

    // Sort by ratio descending (largest unit first)
    const sorted = [...variants].sort((a, b) => (b.ratio || 1) - (a.ratio || 1));

    let remaining = baseQuantity;
    const parts = [];

    for (const variant of sorted) {
        const ratio = variant.ratio || 1;
        if (remaining >= ratio) {
            const count = Math.floor(remaining / ratio);
            if (count > 0) {
                parts.push(`${count} ${variant.unit}`);
                remaining = remaining % ratio;
            }
        }
    }

    // Add remaining base units if any
    if (remaining > 0 && sorted.length > 0) {
        const baseUnit = sorted[sorted.length - 1].unit;
        parts.push(`${remaining} ${baseUnit}`);
    }

    return parts.join(' ') || '0';
}

/**
 * Get the base unit for a product
 * @param {string} productId - Product ID
 * @returns {Promise<string>} Base unit name
 */
export async function getBaseUnit(productId) {
    const product = await Product.findById(productId);

    if (!product) {
        throw new Error('Sản phẩm không tồn tại');
    }

    if (!product.variants || product.variants.length === 0) {
        return product.unit || 'Đơn vị';
    }

    const baseVariant = product.variants.find(v => v.ratio === 1) || product.variants[0];
    return baseVariant.unit;
}
