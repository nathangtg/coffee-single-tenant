'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle, Coffee, CreditCard, Home, ArrowRight, Clock } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from './badge';
import { Separator } from '@radix-ui/react-select';


const PaymentMethod = {
    CASH: 'CASH',
    CREDIT_CARD: 'CREDIT_CARD',
    DEBIT_CARD: 'DEBIT_CARD',
    MOBILE_PAYMENT: 'MOBILE_PAYMENT'
};

const OrderPaymentFlow = () => {
    const router = useRouter();
    const [step, setStep] = useState('confirmation');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [orderDetails, setOrderDetails] = useState(null);
    const [paymentDetails, setPaymentDetails] = useState(null);
    const [cartDetails, setCartDetails] = useState(null);
    const [cartItemsWithOptions, setCartItemsWithOptions] = useState([]);
    const [estimatedTime, setEstimatedTime] = useState(15); // Minutes

    useEffect(() => {
        fetchCartAndOptions();
    }, []);

    const fetchCartAndOptions = async () => {
        try {
            const cartResponse = await fetch('/api/cart', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!cartResponse.ok) throw new Error('Failed to fetch cart');

            const cartData = await cartResponse.json();

            // Check if cartData is an array (admin) or an object (user)
            const cart = Array.isArray(cartData) ? cartData[0] : cartData;

            if (!cart?.cartItems?.length) {
                setError('Your cart is empty');
                setLoading(false);
                return;
            }

            setCartDetails(cart);

            // Fetch options for each cart item
            const itemsWithOptions = await Promise.all(
                cart.cartItems.map(async (cartItem) => {
                    const optionsResponse = await fetch(`/api/cart-item/${cartItem.id}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });

                    if (optionsResponse.ok) {
                        return await optionsResponse.json();
                    }
                    return cartItem;
                })
            );

            setCartItemsWithOptions(itemsWithOptions);

            // Calculate estimated preparation time based on items and quantity
            const totalItems = itemsWithOptions.reduce((sum, item) => sum + item.quantity, 0);
            setEstimatedTime(Math.max(10, Math.min(30, 10 + totalItems * 2)));

            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const calculateTotal = (items) => {
        return items.reduce((total, item) => {
            const basePrice = item.item.price * item.quantity;
            const optionsTotal = item.options?.reduce((sum, opt) =>
                sum + (opt.option.priceModifier * item.quantity), 0) || 0;
            return total + basePrice + optionsTotal;
        }, 0);
    };

    const calculateSubtotal = (items) => {
        return items.reduce((total, item) => {
            const basePrice = item.item.price * item.quantity;
            return total + basePrice;
        }, 0);
    };

    const calculateOptionsTotal = (items) => {
        return items.reduce((total, item) => {
            const optionsTotal = item.options?.reduce((sum, opt) =>
                sum + (opt.option.priceModifier * item.quantity), 0) || 0;
            return total + optionsTotal;
        }, 0);
    };

    const createOrder = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/order', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    notes: 'Optional order notes'
                })
            });

            if (!response.ok) throw new Error('Failed to create order');
            const order = await response.json();
            setOrderDetails(order);
            setStep('payment');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const processPayment = async () => {
        if (!paymentMethod || !orderDetails) return;

        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/payment', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orderId: orderDetails.id,
                    amount: orderDetails.totalAmount,
                    paymentMethod: paymentMethod
                })
            });

            if (!response.ok) throw new Error('Payment failed');
            const payment = await response.json();
            setPaymentDetails(payment);
            setStep('success');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderConfirmationStep = () => (
        <Card className="w-full max-w-xl mx-auto shadow-lg border-t-4 border-t-amber-600">
            <CardHeader className="bg-amber-50">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-amber-800">Order Confirmation</CardTitle>
                        <CardDescription>Review your order from Project 1.0 Café</CardDescription>
                    </div>
                    <Coffee className="h-8 w-8 text-amber-600" />
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Est. Preparation Time: {estimatedTime} mins</span>
                    </div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                        Dine-in
                    </Badge>
                </div>

                <div>
                    <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                        <Coffee className="h-4 w-4 mr-2 text-amber-600" />
                        Your Order Items
                    </h3>
                    <div className="bg-amber-50/30 p-4 rounded-lg border border-amber-100">
                        {cartItemsWithOptions.map((item) => (
                            <div key={item.id} className="mb-4 last:mb-0">
                                <div className="flex justify-between">
                                    <div className="flex items-start">
                                        <Badge className="mr-2 bg-amber-100 text-amber-800 hover:bg-amber-100">{item.quantity}x</Badge>
                                        <span className="font-medium">{item.item.name}</span>
                                    </div>
                                    <span>${(item.item.price * item.quantity).toFixed(2)}</span>
                                </div>
                                {item.options?.length > 0 && (
                                    <div className="ml-10 mt-2 text-sm text-gray-600">
                                        {item.options.map((opt) => (
                                            <div key={opt.id} className="flex justify-between">
                                                <span>• {opt.option.name}</span>
                                                <span>+${(opt.option.priceModifier * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {item !== cartItemsWithOptions[cartItemsWithOptions.length - 1] && (
                                    <Separator className="my-3 bg-amber-100" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                    <div className="flex justify-between text-gray-600 mb-2">
                        <span>Subtotal</span>
                        <span>${calculateSubtotal(cartItemsWithOptions).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 mb-2">
                        <span>Options & Add-ons</span>
                        <span>${calculateOptionsTotal(cartItemsWithOptions).toFixed(2)}</span>
                    </div>
                    <Separator className="my-3 bg-amber-200" />
                    <div className="flex justify-between font-medium text-lg">
                        <span>Total</span>
                        <span className="text-amber-800">${calculateTotal(cartItemsWithOptions).toFixed(2)}</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-4 bg-gray-50 p-6">
                <Button
                    variant="outline"
                    onClick={() => router.push('/cart')}
                    className="border-amber-200 text-amber-800 hover:bg-amber-50"
                >
                    Back to Cart
                </Button>
                <Button
                    onClick={createOrder}
                    disabled={loading}
                    className="bg-amber-600 hover:bg-amber-700"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing
                        </>
                    ) : (
                        <>
                            Confirm Order
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );

    const renderPaymentStep = () => (
        <Card className="w-full max-w-xl mx-auto shadow-lg border-t-4 border-t-amber-600">
            <CardHeader className="bg-amber-50">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-amber-800">Payment Details</CardTitle>
                        <CardDescription>Complete your order at Project 1.0 Café</CardDescription>
                    </div>
                    <CreditCard className="h-8 w-8 text-amber-600" />
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div>
                    <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                        <Coffee className="h-4 w-4 mr-2 text-amber-600" />
                        Order Summary
                    </h3>
                    <div className="bg-amber-50/30 p-4 rounded-lg border border-amber-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-600">Order Number:</span>
                            <Badge variant="outline" className="font-mono border-amber-200">
                                {orderDetails?.orderNumber}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-600">Preparation Time:</span>
                            <span className="flex items-center text-amber-800">
                                <Clock className="h-4 w-4 mr-1" />
                                {estimatedTime} minutes
                            </span>
                        </div>
                        <Separator className="my-3 bg-amber-100" />
                        <div className="flex items-center justify-between font-medium">
                            <span>Total Amount:</span>
                            <span className="text-amber-800 text-lg">${orderDetails?.totalAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                        <CreditCard className="h-4 w-4 mr-2 text-amber-600" />
                        Select Payment Method
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        <Select onValueChange={setPaymentMethod}>
                            <SelectTrigger className="w-full border-amber-200 focus:ring-amber-500">
                                <SelectValue placeholder="Choose payment method" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(PaymentMethod).map(([key, value]) => (
                                    <SelectItem key={key} value={value}>
                                        {key.replace('_', ' ')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {paymentMethod && (
                            <div className="bg-amber-50/30 p-4 rounded-lg border border-amber-100">
                                <p className="text-sm text-gray-600">
                                    {paymentMethod === 'CASH' && 'Pay with cash at the counter when your order is ready.'}
                                    {paymentMethod === 'CREDIT_CARD' && 'Pay securely with your credit card.'}
                                    {paymentMethod === 'DEBIT_CARD' && 'Pay directly from your bank account.'}
                                    {paymentMethod === 'MOBILE_PAYMENT' && 'Pay using your favorite mobile payment app.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-4 bg-gray-50 p-6">
                <Button
                    variant="outline"
                    onClick={() => setStep('confirmation')}
                    className="border-amber-200 text-amber-800 hover:bg-amber-50"
                >
                    Back
                </Button>
                <Button
                    onClick={processPayment}
                    disabled={loading || !paymentMethod}
                    className="bg-amber-600 hover:bg-amber-700"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing
                        </>
                    ) : (
                        <>
                            Complete Payment
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );

    const renderSuccessStep = () => (
        <Card className="w-full max-w-xl mx-auto shadow-lg border-t-4 border-t-green-600">
            <CardHeader className="bg-green-50">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-green-800 flex items-center">
                            <CheckCircle className="mr-2 h-6 w-6 text-green-600" />
                            Payment Successful
                        </CardTitle>
                        <CardDescription>Thank you for ordering at Project 1.0 Café</CardDescription>
                    </div>
                    <Coffee className="h-8 w-8 text-green-600" />
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="bg-green-50/30 p-6 rounded-lg border border-green-100 text-center">
                    <h3 className="text-lg font-medium text-green-800 mb-2">Your order is being prepared!</h3>
                    <p className="text-gray-600 mb-4">
                        Estimated preparation time: <span className="font-medium">{estimatedTime} minutes</span>
                    </p>
                    <div className="inline-flex items-center justify-center p-2 bg-green-100 rounded-full">
                        <Clock className="h-10 w-10 text-green-600 animate-pulse" />
                    </div>
                </div>

                <div>
                    <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                        <CreditCard className="h-4 w-4 mr-2 text-green-600" />
                        Payment Details
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Payment ID</p>
                                <p className="font-mono text-sm">{paymentDetails?.id}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                    {paymentDetails?.status}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Amount</p>
                                <p className="font-medium">${paymentDetails?.amount.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Method</p>
                                <p>{paymentDetails?.paymentMethod.replace('_', ' ')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 text-center">
                    <p className="text-amber-800">
                        We'll notify you when your order is ready for pickup at the counter.
                    </p>
                </div>
            </CardContent>
            <CardFooter className="flex justify-center space-x-4 bg-gray-50 p-6">
                <Button
                    onClick={() => router.push('/')}
                    className="bg-green-600 hover:bg-green-700"
                >
                    <Home className="mr-2 h-4 w-4" />
                    Return to Home
                </Button>
            </CardFooter>
        </Card>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-8 px-4">
            <div className="container mx-auto max-w-4xl">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-amber-800">Project 1.0 Café</h1>
                    <p className="text-amber-600">Brewing Perfection, One Cup at a Time</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center border border-red-200 max-w-xl mx-auto">
                        <AlertCircle className="mr-2 h-5 w-5" />
                        {error}
                    </div>
                )}

                <div className="mb-8">
                    <div className="flex justify-center items-center max-w-xl mx-auto">
                        <div className={`flex flex-col items-center ${step === 'confirmation' ? 'text-amber-800' : 'text-gray-400'}`}>
                            <div className={`w-10 h-10 rounded-full border-2 ${step === 'confirmation' ? 'border-amber-600 bg-amber-50' : 'border-gray-300'} flex items-center justify-center font-medium`}>
                                1
                            </div>
                            <span className="mt-2 text-sm">Review</span>
                        </div>
                        <div className={`w-16 h-1 ${step !== 'confirmation' ? 'bg-amber-300' : 'bg-gray-200'}`} />
                        <div className={`flex flex-col items-center ${step === 'payment' ? 'text-amber-800' : 'text-gray-400'}`}>
                            <div className={`w-10 h-10 rounded-full border-2 ${step === 'payment' ? 'border-amber-600 bg-amber-50' : step === 'success' ? 'border-amber-600 bg-amber-600' : 'border-gray-300'} flex items-center justify-center font-medium`}>
                                {step === 'success' ? <CheckCircle className="h-5 w-5 text-white" /> : '2'}
                            </div>
                            <span className="mt-2 text-sm">Payment</span>
                        </div>
                        <div className={`w-16 h-1 ${step === 'success' ? 'bg-amber-300' : 'bg-gray-200'}`} />
                        <div className={`flex flex-col items-center ${step === 'success' ? 'text-green-800' : 'text-gray-400'}`}>
                            <div className={`w-10 h-10 rounded-full border-2 ${step === 'success' ? 'border-green-600 bg-green-50' : 'border-gray-300'} flex items-center justify-center font-medium`}>
                                3
                            </div>
                            <span className="mt-2 text-sm">Complete</span>
                        </div>
                    </div>
                </div>

                {loading && !error && step === 'confirmation' && (
                    <div className="flex flex-col items-center justify-center p-12">
                        <Loader2 className="h-12 w-12 text-amber-600 animate-spin mb-4" />
                        <p className="text-amber-800">Loading your order details...</p>
                    </div>
                )}

                {!loading && step === 'confirmation' && renderConfirmationStep()}
                {step === 'payment' && renderPaymentStep()}
                {step === 'success' && renderSuccessStep()}
            </div>
        </div>
    );
};

export default OrderPaymentFlow;