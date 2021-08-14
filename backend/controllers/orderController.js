const Order = require('../models/order');
const Product = require('../models/product');

const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');

//Create a new order => /api/v1/order/new

exports.newOrder = catchAsyncErrors( async(req, res, next) => {
    const {
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo
    } = req.body;

    const order = await Order.create({
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo,
        paidAt: Date.now(),
        user: req.user._id
    })

    res.status(200).json({
        success: true,
        order
    })
})

// Get single Order /api/v1/order/:_id

exports.getSingleOrder = catchAsyncErrors( async (req, res, next) => {

    const order = await Order.findById(req.params.id).populate('user', 'name email')
    // console.log(order)

    if(!order) {
        return next(ErrorHandler('No order found with this id', 404))
    }

    res.status(200).json({
        success: true,
        order
    })
})

// Get Logged in user orders /api/v1/orders/me

exports.myOrders = catchAsyncErrors( async (req, res, next) => {

const orders = await Order.find({ user: req.user.id })

   res.status(200).json({
        success: true,
        orders
    })
})

// Get all orders /api/v1/admin/orders

exports.allOrders = catchAsyncErrors( async (req, res, next) => {

       
    const orders = await Order.find()

    let totalAmount = 0;

    orders.forEach(order => {
            totalAmount += order.totalPrice
    })
    
       res.status(200).json({
            success: true,
            totalAmount,
            orders
        })
    })

// Update/ Process order - Admin /api/v1/admin/order/:id

exports.updateOrder = catchAsyncErrors( async (req, res, next) => {

       
    const order = await Order.findById(req.params.id)
    

    if(order.orderStatus === "Delivered"){
        return next(new ErrorHandler('You have already delivered this order', 400))
    }

    order.orderItems.forEach(async item => {
        await updateStock(item.product, item.quantity)
    })
    

    order.orderStatus = req.body.status,
    order.deliveredAt = Date.now() 

    await order.save()

       res.status(200).json({
            success: true
            
        })
    })

    async function updateStock(id, quantity) {
        const product = await Product.findById(id);

        product.stock = product.stock - quantity;

        await product.save({ validateBeforeSave: false });
    }



// Delet Order => /api/v1/admin/order/:Id =>

exports.deleteOrder = catchAsyncErrors( async (req, res, next) => {

    let order = await Order.findById(req.params.id);

    if(!order) {
        return next(new ErrorHandler('Order not found', 404))
    }

    await order.remove();

    res.status(200).json({ 
        success: true,
        message: 'Order is deleted'
    })
})