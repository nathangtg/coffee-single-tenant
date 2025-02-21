import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';

const PaymentDetails = () => {
    const router = useRouter();
    const { paymentId } = router.query;
    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPaymentDetails = async () => {
            if (!paymentId) return;

            try {
                const response = await fetch(`/api/payment/${paymentId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch payment details');
                const data = await response.json();
                setPayment(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPaymentDetails();
    }, [paymentId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
                <AlertCircle className="mr-2 h-5 w-5" />
                {error}
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <Card className="w-full max-w-lg mx-auto">
                <CardHeader>
                    <CardTitle>Payment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Payment ID</p>
                            <p className="font-medium">{payment?.id}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <p className="font-medium">{payment?.status}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Amount</p>
                            <p className="font-medium">${payment?.amount.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Payment Method</p>
                            <p className="font-medium">{payment?.paymentMethod.replace('_', ' ')}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Order Number</p>
                            <p className="font-medium">{payment?.order.orderNumber}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Payment Date</p>
                            <p className="font-medium">
                                {payment?.paymentDate
                                    ? new Date(payment.paymentDate).toLocaleDateString()
                                    : 'Pending'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h3 className="font-medium mb-2">Order Details</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Order Status</p>
                                    <p className="font-medium">{payment?.order.status}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Amount</p>
                                    <p className="font-medium">${payment?.order.totalAmount.toFixed(2)}</p>
                                </div>
                                {payment?.order.discount > 0 && (
                                    <div>
                                        <p className="text-sm text-gray-500">Discount</p>
                                        <p className="font-medium">${payment?.order.discount.toFixed(2)}</p>
                                    </div>
                                )}
                                {payment?.order.tax > 0 && (
                                    <div>
                                        <p className="text-sm text-gray-500">Tax</p>
                                        <p className="font-medium">${payment?.order.tax.toFixed(2)}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PaymentDetails;