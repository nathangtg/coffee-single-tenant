'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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

    useEffect(() => {
        fetchCartAndOptions();
    }, []);

    const fetchCartAndOptions = async () => {
        try {
            // Fetch cart details
            const cartResponse = await fetch('/api/cart', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!cartResponse.ok) throw new Error('Failed to fetch cart');
            const cartData = await cartResponse.json();

            if (!cartData[0]?.cartItems?.length) {
                setError('Your cart is empty');
                setLoading(false);
                return;
            }

            setCartDetails(cartData[0]);

            // Fetch options for each cart item
            const itemsWithOptions = await Promise.all(
                cartData[0].cartItems.map(async (cartItem) => {
                    const optionsResponse = await fetch(`/api/cart-item/${cartItem.id}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });

                    if (optionsResponse.ok) {
                        const itemWithOptions = await optionsResponse.json();
                        return itemWithOptions;
                    }
                    return cartItem;
                })
            );

            setCartItemsWithOptions(itemsWithOptions);
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
        <Card className="w-full max-w-lg mx-auto">
            <CardHeader>
                <CardTitle>Confirm Your Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                    {cartItemsWithOptions.map((item) => (
                        <div key={item.id} className="mb-4 last:mb-0">
                            <div className="flex justify-between">
                                <span className="font-medium">{item.item.name} x{item.quantity}</span>
                                <span>${(item.item.price * item.quantity).toFixed(2)}</span>
                            </div>
                            {item.options?.length > 0 && (
                                <div className="ml-4 mt-2 text-sm text-gray-600">
                                    {item.options.map((opt) => (
                                        <div key={opt.id} className="flex justify-between">
                                            <span>{opt.option.name}</span>
                                            <span>+${(opt.option.priceModifier * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between font-medium">
                            <span>Total Amount</span>
                            <span>${calculateTotal(cartItemsWithOptions).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-4">
                <Button
                    variant="outline"
                    onClick={() => router.push('/cart')}
                >
                    Back to Cart
                </Button>
                <Button
                    onClick={createOrder}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing
                        </>
                    ) : 'Confirm Order'}
                </Button>
            </CardFooter>
        </Card>
    );


    const renderPaymentStep = () => (
        <Card className="w-full max-w-lg mx-auto">
            <CardHeader>
                <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <p className="font-medium mb-2">Order Summary</p>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p>Order Number: {orderDetails?.orderNumber}</p>
                        <p className="mt-2">Total Amount: ${orderDetails?.totalAmount.toFixed(2)}</p>
                    </div>
                </div>
                <div>
                    <p className="font-medium mb-2">Select Payment Method</p>
                    <Select onValueChange={setPaymentMethod}>
                        <SelectTrigger>
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
                </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-4">
                <Button
                    variant="outline"
                    onClick={() => setStep('confirmation')}
                >
                    Back
                </Button>
                <Button
                    onClick={processPayment}
                    disabled={loading || !paymentMethod}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing
                        </>
                    ) : 'Pay Now'}
                </Button>
            </CardFooter>
        </Card>
    );

    const renderSuccessStep = () => (
        <Card className="w-full max-w-lg mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center">
                    <CheckCircle className="mr-2 h-6 w-6 text-green-500" />
                    Payment Successful
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <p>Payment ID: {paymentDetails?.id}</p>
                    <p className="mt-2">Status: {paymentDetails?.status}</p>
                    <p className="mt-2">Amount: ${paymentDetails?.amount.toFixed(2)}</p>
                    <p className="mt-2">Method: {paymentDetails?.paymentMethod.replace('_', ' ')}</p>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button
                    onClick={() => router.push('/')}
                >
                    Return to Home
                </Button>
            </CardFooter>
        </Card>
    );

    return (
        <div className="container mx-auto py-8 px-4">
            {error && (
                <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
                    <AlertCircle className="mr-2 h-5 w-5" />
                    {error}
                </div>
            )}

            <div className="mb-8">
                <div className="flex justify-center items-center space-x-4">
                    <div className={`flex items-center ${step === 'confirmation' ? 'text-primary' : 'text-gray-500'}`}>
                        <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center font-medium">
                            1
                        </div>
                        <span className="ml-2">Confirm Order</span>
                    </div>
                    <div className="w-16 h-px bg-gray-300" />
                    <div className={`flex items-center ${step === 'payment' ? 'text-primary' : 'text-gray-500'}`}>
                        <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center font-medium">
                            2
                        </div>
                        <span className="ml-2">Payment</span>
                    </div>
                    <div className="w-16 h-px bg-gray-300" />
                    <div className={`flex items-center ${step === 'success' ? 'text-primary' : 'text-gray-500'}`}>
                        <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center font-medium">
                            3
                        </div>
                        <span className="ml-2">Complete</span>
                    </div>
                </div>
            </div>

            {step === 'confirmation' && renderConfirmationStep()}
            {step === 'payment' && renderPaymentStep()}
            {step === 'success' && renderSuccessStep()}
        </div>
    );
};

export default OrderPaymentFlow;