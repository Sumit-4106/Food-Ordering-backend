import express from 'express'
import { addToCart, clearCart, deleteCartItem, getCart, updateCartItem } from '../controllers/cartController.js'
import authMiddleWare from '../middleware/auth.js'

const router = express.Router();

router.route('/')
    .get(authMiddleWare, getCart)
    .post(authMiddleWare, addToCart)

router.post('/clear',authMiddleWare, clearCart)

router.route('/:id')
    .put(authMiddleWare, updateCartItem)
    .delete(authMiddleWare, deleteCartItem)

export default router