import express from "express"
import {
    createOrder,
    getAllOrders,
    updateOrder,
    deleteOrder,
    addItemToOrder,
    removeItemFromOrder,
    updateOrderItem
} from "../controllers/saleInvoiceController.js"

const router = express.Router()

// Order CRUD
router.post("/create", createOrder)
router.get("/getAll", getAllOrders)
router.put("/update/:id", updateOrder)
router.delete("/delete/:id", deleteOrder)

// Order Item Editing
router.post("/addItem/:orderId", addItemToOrder)
router.delete("/removeItem/:orderId/:detailId", removeItemFromOrder)
router.put("/updateItem/:detailId", updateOrderItem)

export default router
