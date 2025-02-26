'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/ui/header';

export default function ProfilePage() {
    const [user, setUser] = useState({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        address: ''
    });

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [activeTab, setActiveTab] = useState('profile');
    const [filterStatus, setFilterStatus] = useState('ALL');

    const router = useRouter();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch('/api/auth/user', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        router.push('/login');
                        return;
                    }
                    throw new Error('Failed to fetch user data');
                }

                const data = await response.json();
                setUser(data.user);
            } catch (error) {
                console.error('Error fetching user data:', error);
                setMessage({ text: 'Failed to load profile data', type: 'error' });
            }
        };

        const fetchOrders = async () => {
            try {
                const response = await fetch('/api/order', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch orders');
                }

                const data = await response.json();
                setOrders(data);
            } catch (error) {
                console.error('Error fetching orders:', error);
                setMessage({ text: 'Failed to load order history', type: 'error' });
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
        fetchOrders();
    }, [router]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUser(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);

        try {
            const response = await fetch('/api/auth/user', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(user)
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            const data = await response.json();
            setUser(data.user);
            setMessage({ text: 'Profile updated successfully', type: 'success' });

            // Clear success message after 3 seconds
            setTimeout(() => {
                setMessage({ text: '', type: '' });
            }, 3000);
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({ text: 'Failed to update profile', type: 'error' });
        } finally {
            setUpdating(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateOrderStats = () => {
        if (!orders.length) return { total: 0, count: 0, average: 0, mostOrdered: null, recentOrder: null };

        let total = 0;
        let itemCounts = {};
        let mostOrdered = { name: '', count: 0 };
        let recentOrder = orders[0];

        // Find most recent order
        orders.forEach(order => {
            const orderDate = new Date(order.createdAt);
            const recentDate = new Date(recentOrder.createdAt);
            if (orderDate > recentDate) {
                recentOrder = order;
            }
        });

        // Calculate totals and most ordered item
        orders.forEach(order => {
            total += order.totalAmount;

            order.orderItems.forEach(item => {
                const itemName = item.item.name;
                if (!itemCounts[itemName]) {
                    itemCounts[itemName] = 0;
                }
                itemCounts[itemName] += item.quantity;

                if (itemCounts[itemName] > mostOrdered.count) {
                    mostOrdered = { name: itemName, count: itemCounts[itemName] };
                }
            });
        });

        return {
            total: total.toFixed(2),
            count: orders.length,
            average: (total / orders.length).toFixed(2),
            mostOrdered: mostOrdered.name,
            recentOrder: formatDate(recentOrder.createdAt)
        };
    };

    const generatePDF = (order) => {
        // In a real application, this would connect to a backend API to generate a PDF
        // For now, we'll just simulate a download with an alert
        alert(`Receipt for order ${order.orderNumber} would be downloaded here`);

        // For a real implementation, you would trigger a download, e.g.:
        // window.open(`/api/receipts/${order.id}`, '_blank');
    };

    const filteredOrders = filterStatus === 'ALL'
        ? orders
        : orders.filter(order => order.status === filterStatus);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center">
                        <div className="animate-pulse h-6 w-48 bg-gray-200 rounded mb-4 mx-auto"></div>
                        <div className="animate-pulse h-4 w-full max-w-md bg-gray-200 rounded mx-auto"></div>
                    </div>
                </div>
            </div>
        );
    }

    const orderStats = calculateOrderStats();

    return (
        <div className=" bg-gray-50">
            <Header />
            <div className="max-w-4xl py-12 px-4 mx-auto">
                <h1 className="text-3xl font-bold text-center mb-8">My Account</h1>

                {message.text && (
                    <div className={`mb-6 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                    <div className="flex border-b">
                        <button
                            className={`px-6 py-3 font-medium text-sm ${activeTab === 'profile' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500'}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            Profile
                        </button>
                        <button
                            className={`px-6 py-3 font-medium text-sm ${activeTab === 'orders' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500'}`}
                            onClick={() => setActiveTab('orders')}
                        >
                            Order History
                        </button>
                    </div>

                    {activeTab === 'profile' && (
                        <div className="p-6">
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            id="firstName"
                                            name="firstName"
                                            value={user.firstName || ''}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            id="lastName"
                                            name="lastName"
                                            value={user.lastName || ''}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={user.email || ''}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={user.phone || ''}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                                            Address
                                        </label>
                                        <textarea
                                            id="address"
                                            name="address"
                                            value={user.address || ''}
                                            onChange={handleChange}
                                            rows="3"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <button
                                        type="submit"
                                        disabled={updating}
                                        className={`w-full md:w-auto px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-offset-2 ${updating ? 'opacity-75 cursor-not-allowed' : ''}`}
                                    >
                                        {updating ? 'Updating...' : 'Update Profile'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="p-6">
                            {orders.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">You haven't placed any orders yet.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Order Statistics Summary */}
                                    <div className="mb-8 bg-gray-50 rounded-lg p-6">
                                        <h2 className="text-lg font-medium mb-4">Your Order Summary</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                                <p className="text-sm text-gray-500">Total Spent</p>
                                                <p className="text-2xl font-bold">${orderStats.total}</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                                <p className="text-sm text-gray-500">Orders Placed</p>
                                                <p className="text-2xl font-bold">{orderStats.count}</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                                <p className="text-sm text-gray-500">Average Order</p>
                                                <p className="text-2xl font-bold">${orderStats.average}</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                                <p className="text-sm text-gray-500">Most Ordered</p>
                                                <p className="text-lg font-semibold">{orderStats.mostOrdered || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Filter Controls */}
                                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                                        <h3 className="text-lg font-medium">Recent Orders</h3>
                                        <div className="flex items-center gap-2">
                                            <label htmlFor="filterStatus" className="text-sm text-gray-500">Filter by status:</label>
                                            <select
                                                id="filterStatus"
                                                value={filterStatus}
                                                onChange={(e) => setFilterStatus(e.target.value)}
                                                className="border border-gray-300 rounded px-3 py-1 text-sm"
                                            >
                                                <option value="ALL">All Orders</option>
                                                <option value="PENDING">Pending</option>
                                                <option value="PROCESSING">Processing</option>
                                                <option value="COMPLETED">Completed</option>
                                                <option value="CANCELLED">Cancelled</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Order List */}
                                    <div className="space-y-6">
                                        {filteredOrders.length === 0 ? (
                                            <p className="text-center text-gray-500 py-4">No orders match the selected filter.</p>
                                        ) : (
                                            filteredOrders.map((order) => (
                                                <div key={order.id} className="border rounded-lg overflow-hidden">
                                                    <div className="bg-gray-50 px-4 py-3 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                                        <div>
                                                            <span className="text-sm text-gray-500">Order #</span>
                                                            <span className="ml-1 font-medium">{order.orderNumber}</span>
                                                        </div>
                                                        <div className="mt-2 sm:mt-0">
                                                            <span className="text-sm text-gray-500">Placed on</span>
                                                            <span className="ml-1 font-medium">{formatDate(order.createdAt)}</span>
                                                        </div>
                                                        <div className="mt-2 sm:mt-0 flex items-center gap-3">
                                                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                                order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                                                        'bg-blue-100 text-blue-800'
                                                                }`}>
                                                                {order.status}
                                                            </span>
                                                            <button
                                                                onClick={() => generatePDF(order)}
                                                                className="text-sm text-gray-700 hover:text-gray-900 flex items-center gap-1"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                                                </svg>
                                                                Receipt
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="p-4">
                                                        <div className="space-y-3">
                                                            {order.orderItems.map((item) => (
                                                                <div key={item.id} className="flex justify-between items-center">
                                                                    <div className="flex items-center">
                                                                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                                                            {item.item.imageUrl && (
                                                                                <img
                                                                                    src={item.item.imageUrl}
                                                                                    alt={item.item.name}
                                                                                    className="h-full w-full object-cover object-center"
                                                                                />
                                                                            )}
                                                                        </div>
                                                                        <div className="ml-4">
                                                                            <h3 className="text-sm font-medium text-gray-900">{item.item.name}</h3>
                                                                            <div className="flex gap-3 mt-1">
                                                                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                                                                <p className="text-sm text-gray-500">Unit: ${item.unitPrice.toFixed(2)}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-sm font-medium text-gray-900">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="border-t mt-4 pt-4">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <div className="text-sm text-gray-500">Payment Method</div>
                                                                <div className="text-sm font-medium">{order.payment.paymentMethod}</div>
                                                            </div>

                                                            {order.discount > 0 && (
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <div className="text-sm text-gray-500">Discount</div>
                                                                    <div className="text-sm font-medium text-green-600">-${order.discount.toFixed(2)}</div>
                                                                </div>
                                                            )}

                                                            {order.tax > 0 && (
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <div className="text-sm text-gray-500">Tax</div>
                                                                    <div className="text-sm font-medium">${order.tax.toFixed(2)}</div>
                                                                </div>
                                                            )}

                                                            <div className="flex justify-between items-center pt-2 border-t mt-2">
                                                                <div className="text-base font-medium">Total</div>
                                                                <div className="text-lg font-bold">${order.totalAmount.toFixed(2)}</div>
                                                            </div>

                                                            {order.notes && (
                                                                <div className="mt-3 pt-3 border-t">
                                                                    <p className="text-sm text-gray-500">Notes:</p>
                                                                    <p className="text-sm">{order.notes}</p>
                                                                </div>
                                                            )}

                                                            {order.status === 'COMPLETED' && (
                                                                <div className="mt-4 text-center">
                                                                    <button
                                                                        className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-offset-2"
                                                                        onClick={() => generatePDF(order)}
                                                                    >
                                                                        Download Receipt
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}