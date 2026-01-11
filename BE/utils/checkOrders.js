import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { SaleInvoice } from '../models/saleInvoice/SaleInvoice.js';
import { SaleInvoiceDetail } from '../models/saleInvoice/SaleInvoiceDetail.js';
import { User } from '../models/auth/User.js';
import { Product } from '../models/product/Product.js';
import { OrderStatus } from '../models/saleInvoice/OrderStatus.js';

dotenv.config();

const checkOrders = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Get latest 5 invoices
        const invoices = await SaleInvoice.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('userId', 'fullName phoneNum')
            .populate('statusId', 'statusName');

        console.log(`Found ${invoices.length} recent invoices:\n`);

        for (const inv of invoices) {
            console.log('------------------------------------------------');
            console.log(`Invoice ID: ${inv._id}`);
            console.log(`Date: ${inv.saleDate}`);
            console.log(`Customer: ${inv.userId ? inv.userId.fullName : 'Unknown'} (${inv.userId ? inv.userId.phoneNum : 'N/A'})`);
            console.log(`Status: ${inv.statusId ? inv.statusId.statusName : 'N/A'}`);

            const details = await SaleInvoiceDetail.find({ saleInvoiceId: inv._id })
                .populate({
                    path: 'productId',
                    select: 'productName' // Chỉ lấy tên sản phẩm
                });

            console.log('Items:');
            details.forEach((d, index) => {
                const pName = d.productId ? d.productId.productName : 'Unknown Product';
                console.log(`  ${index + 1}. ${pName} - Qty: ${d.quantity} - Price: ${d.unitPrice.toLocaleString()} - Total: ${d.totalPrice.toLocaleString()}`);
            });
            console.log('------------------------------------------------\n');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
};

checkOrders();
