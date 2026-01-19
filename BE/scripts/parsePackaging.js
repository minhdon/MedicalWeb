/**
 * Parse Packaging Pattern from Product Names
 * Extracts variants from patterns like "(10 vỉ x 10 viên)" or "(60ml)"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read first 1000 lines for analysis
const csvPath = path.join(__dirname, '../../drug_data.csv');

function parsePackagingPattern(productName) {
    // Pattern: (X unit1 x Y unit2) or (X unit1) or (Xml)
    const patterns = [
        // Pattern 1: (10 vỉ x 10 viên)
        /\((\d+)\s*([^\d\sx]+)\s*x\s*(\d+)\s*([^\d\s)]+)\)/i,

        // Pattern 2: (60ml) or (100 viên)
        /\((\d+)\s*([^\d\s)]+)\)/i,

        // Pattern 3: (1 vỉ x 21 viên)
        /\((\d+(?:\.\d+)?)\s*([^\d\sx]+)\s*x\s*(\d+(?:\.\d+)?)\s*([^\d\s)]+)\)/i
    ];

    for (const pattern of patterns) {
        const match = productName.match(pattern);
        if (match) {
            if (match[4]) {
                // Double unit: (X unit1 x Y unit2)
                return {
                    type: 'double',
                    outer: { qty: parseInt(match[1]), unit: match[2].trim() },
                    inner: { qty: parseInt(match[3]), unit: match[4].trim() },
                    total: parseInt(match[1]) * parseInt(match[3])
                };
            } else {
                // Single unit: (Xml) or (X viên)
                return {
                    type: 'single',
                    qty: parseInt(match[1]),
                    unit: match[2].trim()
                };
            }
        }
    }

    return null;
}

function suggestVariants(packaging, productUnit) {
    if (!packaging) return null;

    if (packaging.type === 'double') {
        // Example: (10 vỉ x 10 viên) with Hộp
        const baseUnit = packaging.inner.unit;  // "viên"
        const midUnit = packaging.outer.unit;   // "vỉ"
        const topUnit = productUnit;            // "Hộp"

        return [
            { unit: baseUnit, ratio: 1 },
            { unit: midUnit, ratio: packaging.inner.qty },
            { unit: topUnit, ratio: packaging.total }
        ];
    } else if (packaging.type === 'single') {
        // Example: (60ml) with Chai
        return [
            { unit: packaging.unit, ratio: 1 },
            { unit: productUnit, ratio: packaging.qty }
        ];
    }

    return null;
}

// Read and parse CSV
console.log('📊 Analyzing packaging patterns in drug_data.csv...\n');

const content = fs.readFileSync(csvPath, 'utf-8');
const lines = content.split('\n').slice(1, 101); // First 100 products

const patterns = new Map();
const examples = [];

for (const line of lines) {
    if (!line.trim()) continue;

    const match = line.match(/^"([^"]+)",([^,]+),([^,]+)/);
    if (!match) continue;

    const productName = match[1];
    const price = match[2];
    const unit = match[3];

    const packaging = parsePackagingPattern(productName);

    if (packaging) {
        const key = packaging.type === 'double'
            ? `${packaging.outer.unit} x ${packaging.inner.unit}`
            : packaging.unit;

        if (!patterns.has(key)) {
            patterns.set(key, []);
        }

        patterns.get(key).push({
            name: productName,
            unit: unit,
            packaging: packaging,
            variants: suggestVariants(packaging, unit)
        });

        if (examples.length < 10) {
            examples.push({
                name: productName,
                unit: unit,
                packaging: packaging,
                variants: suggestVariants(packaging, unit)
            });
        }
    }
}

console.log('='.repeat(80));
console.log('📦 PACKAGING PATTERNS FOUND');
console.log('='.repeat(80));

for (const [pattern, items] of patterns.entries()) {
    console.log(`\n${pattern}: ${items.length} products`);
    const example = items[0];
    console.log(`  Example: ${example.name.substring(0, 80)}...`);
    console.log(`  Unit: ${example.unit}`);
    if (example.variants) {
        console.log(`  Suggested variants:`);
        example.variants.forEach(v => {
            console.log(`    { unit: "${v.unit}", ratio: ${v.ratio} }`);
        });
    }
}

console.log('\n' + '='.repeat(80));
console.log('📝 SAMPLE PRODUCTS WITH AUTO-GENERATED VARIANTS');
console.log('='.repeat(80));

examples.forEach((ex, idx) => {
    console.log(`\n${idx + 1}. ${ex.name}`);
    console.log(`   CSV Unit: ${ex.unit}`);
    console.log(`   Pattern: ${JSON.stringify(ex.packaging)}`);
    if (ex.variants) {
        console.log(`   Auto-generated variants:`);
        ex.variants.forEach(v => {
            console.log(`     - ${v.unit}: ratio ${v.ratio}`);
        });
    }
    console.log('');
});

console.log('='.repeat(80));
console.log('✅ Analysis complete!');
