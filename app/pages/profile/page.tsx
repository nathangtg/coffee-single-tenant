'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/ui/header';
import { useAuth } from '@/context/AuthContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';

export default function ProfilePage() {
    const { logout } = useAuth();
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
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [currencySymbol, setCurrencySymbol] = useState('$')

    const router = useRouter();

    useEffect(() => {

        const fetchRestaurantSettings = async () => {
            const response = await fetch("/api/restaurant-settings")
            const data = await response.json()
            setCurrencySymbol(data.currencySymbol)
        }

        const fetchUserData = async () => {
            try {
                const response = await fetch('/api/auth/user', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        router.push('/');
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
        fetchRestaurantSettings()
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

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/');
        } catch (error) {
            console.error('Logout failed:', error);
            setMessage({ text: 'Failed to log out. Please try again.', type: 'error' });
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

    const generatePDF = async (order) => {
        // Create new document with slightly larger default size
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Set document properties
        doc.setProperties({
            title: `Project 1.0 Receipt - ${order.orderNumber}`,
            subject: 'Café Receipt',
            author: 'Project 1.0 Café',
            creator: 'Project 1.0 POS System'
        });

        // Add styling variables
        const primaryColor = [58, 124, 165]; // Blue-ish color
        const accentColor = [156, 102, 68];  // Coffee brown color
        const lightGray = [240, 240, 240];

        // Helper function to convert RGB to hex
        const rgbToHex = (r, g, b) => {
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        };

        // Add café logo/header
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 0, 210, 35, 'F');

        // Add white text for header
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.text('PROJECT 1.0', 105, 15, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('PREMIUM CAFÉ & DELICATESSEN', 105, 22, { align: 'center' });
        doc.text('Online Coffee ? We are your solution', 105, 28, { align: 'center' });

        // Add receipt title
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('ORDER RECEIPT', 105, 45, { align: 'center' });

        // Create a border for the header information
        doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.setLineWidth(0.5);
        doc.roundedRect(15, 50, 180, 30, 3, 3);

        // Add order details
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Order Number:', 20, 58);
        doc.text('Date:', 20, 65);
        doc.text('Customer:', 20, 72);

        doc.setFont('helvetica', 'normal');
        doc.text(order.orderNumber, 60, 58);
        doc.text(formatDate(order.createdAt), 60, 65);

        // Use email if name is not available
        const customerName = (user && user.firstName && user.lastName)
            ? `${user.firstName} ${user.lastName}`
            : order.user.email;
        doc.text(customerName, 60, 72);

        // Add payment info on the right side
        doc.setFont('helvetica', 'bold');
        doc.text('Status:', 120, 58);
        doc.text('Payment Method:', 120, 65);
        doc.text('Transaction ID:', 120, 72);

        doc.setFont('helvetica', 'normal');
        doc.text(order.status, 160, 58);

        // Get payment details if available
        const paymentMethod = order.payment ? order.payment.paymentMethod.replace('_', ' ') : 'N/A';
        const transactionId = (order.payment && order.payment.transactionId) ? order.payment.transactionId : 'Pending';

        doc.text(paymentMethod, 160, 65);
        doc.text(transactionId, 160, 72);

        // Create a table for order items
        const tableColumn = ["Item", "Qty", "Unit Price", "Options", "Total"];
        const tableRows = [];

        // Calculate subtotal
        let subtotal = 0;

        order.orderItems.forEach(item => {
            // Calculate option prices
            let optionText = '';
            let optionsCost = 0;

            if (item.options && item.options.length > 0) {
                item.options.forEach(opt => {
                    optionText += `+ ${opt.option.name}\n`;
                    optionsCost += opt.priceModifier;
                });
            }

            const itemTotal = (item.quantity * item.unitPrice) + optionsCost;
            subtotal += itemTotal;

            const itemData = [
                item.item.name,
                item.quantity,
                `${currencySymbol || '$'} ${item.unitPrice.toFixed(2)}`,
                optionText || 'No options',
                `${currencySymbol || '$'} ${itemTotal.toFixed(2)}`
            ];
            tableRows.push(itemData);
        });

        // Use the proper imported function for the main items table
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 90,
            styles: {
                fontSize: 10,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: rgbToHex(primaryColor[0], primaryColor[1], primaryColor[2]),
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: rgbToHex(lightGray[0], lightGray[1], lightGray[2])
            },
            columnStyles: {
                0: { cellWidth: 60 },
                3: { cellWidth: 50 }
            }
        });

        // Add summary section
        const tax = order.tax || 0;
        const discount = order.discount || 0;
        const total = order.totalAmount;

        autoTable(doc, {
            body: [
                [{ content: 'Order Summary', colSpan: 2, styles: { fontStyle: 'bold', fontSize: 12 } }],
                ['Subtotal:', `${currencySymbol || '$'} ${subtotal.toFixed(2)}`],
                ['Tax:', `${currencySymbol || '$'} ${tax.toFixed(2)}`],
                ['Discount:', `${currencySymbol || '$'} ${discount.toFixed(2)}`],
                [{ content: 'Total:', styles: { fontStyle: 'bold' } }, { content: `${currencySymbol || '$'} ${total.toFixed(2)}`, styles: { fontStyle: 'bold' } }]
            ],
            startY: doc.lastAutoTable.finalY + 10,
            theme: 'plain',
            styles: {
                fontSize: 10
            },
            columnStyles: {
                0: { cellWidth: 80, halign: 'right' },
                1: { cellWidth: 30, halign: 'right' }
            },
            margin: { left: 100 }
        });

        // Add notes if any
        if (order.notes) {
            autoTable(doc, {
                body: [
                    [{ content: 'Order Notes:', styles: { fontStyle: 'bold' } }],
                    [order.notes]
                ],
                startY: doc.lastAutoTable.finalY + 10,
                theme: 'plain',
                styles: {
                    fontSize: 10
                }
            });
        }

        // Add a thumbnail image of the first item if available
        if (order.orderItems.length > 0 && order.orderItems[0].item.imageUrl) {
            try {

                const imgData = order.orderItems[0].item.imageUrl;


                doc.setFontSize(9);
                doc.setTextColor(100, 100, 100);
                doc.text('* Image preview would appear here in the actual implementation', 15, doc.lastAutoTable.finalY + 15);
            } catch (e) {
                console.error('Could not add image to PDF', e);
            }
        }

        // Add footer
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);

        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);

            // Add footer border
            doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setFillColor(252, 252, 252);
            doc.roundedRect(15, 270, 180, 20, 2, 2, 'FD');

            // Footer text
            doc.text('Thank you for visiting Project 1.0 Café!', 105, 277, { align: 'center' });
            doc.text('www.project10cafe.com | @project10cafe', 105, 282, { align: 'center' });
            doc.text(`Receipt generated: ${new Date().toLocaleString()}`, 105, 287, { align: 'center' });
        }

        // Save the PDF
        doc.save(`Project1.0-Receipt-${order.orderNumber}.pdf`);
    };




    const filteredOrders = filterStatus === 'ALL'
        ? orders
        : orders.filter(order => order.status === filterStatus);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 py-12 px-4">
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
        <div className="min-h-screen bg-gray-100">
            <Header />
            <div className="max-w-5xl py-12 px-4 mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">My Account</h1>
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-md border border-red-200 hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                        Log Out
                    </button>
                </div>

                {message.text && (
                    <div className={`mb-6 p-4 rounded-md shadow-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border-l-4 border-green-500' : 'bg-red-50 text-red-700 border-l-4 border-red-500'}`}>
                        {message.text}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                    <div className="flex border-b">
                        <button
                            className={`px-6 py-4 font-medium transition-colors ${activeTab === 'profile' ? 'text-gray-900 border-b-2 border-gray-900 bg-gray-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            Profile
                        </button>
                        <button
                            className={`px-6 py-4 font-medium transition-colors ${activeTab === 'orders' ? 'text-gray-900 border-b-2 border-gray-900 bg-gray-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                            onClick={() => setActiveTab('orders')}
                        >
                            Order History
                        </button>
                        <button
                            className={`px-6 py-4 font-medium transition-colors ${activeTab === 'security' ? 'text-gray-900 border-b-2 border-gray-900 bg-gray-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                            onClick={() => setActiveTab('security')}
                        >
                            Security
                        </button>
                    </div>

                    {activeTab === 'profile' && (
                        <div className="p-8">
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
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <button
                                        type="submit"
                                        disabled={updating}
                                        className={`px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${updating ? 'opacity-75 cursor-not-allowed' : ''}`}
                                    >
                                        {updating ? 'Updating...' : 'Update Profile'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="p-8">
                            {orders.length === 0 ? (
                                <div className="text-center py-16">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                    <p className="text-gray-500 text-lg">You haven't placed any orders yet.</p>
                                    <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                                        Start Shopping
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Order Statistics Summary */}
                                    <div className="mb-8 bg-gray-50 rounded-xl p-6">
                                        <h2 className="text-lg font-medium mb-4">Your Order Summary</h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-white p-4 rounded-xl shadow-sm">
                                                <p className="text-sm text-gray-500">Total Spent</p>
                                                <p className="text-2xl font-bold">{currencySymbol || '$'} {orderStats.total}</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-xl shadow-sm">
                                                <p className="text-sm text-gray-500">Orders Placed</p>
                                                <p className="text-2xl font-bold">{orderStats.count}</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-xl shadow-sm">
                                                <p className="text-sm text-gray-500">Average Order</p>
                                                <p className="text-2xl font-bold">{currencySymbol || '$'} {orderStats.average}</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-xl shadow-sm">
                                                <p className="text-sm text-gray-500">Most Ordered</p>
                                                <p className="text-lg font-semibold truncate">{orderStats.mostOrdered || 'N/A'}</p>
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
                                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                            <p className="text-center text-gray-500 py-8 bg-gray-50 rounded-xl">No orders match the selected filter.</p>
                                        ) : (
                                            filteredOrders.map((order) => (
                                                <div key={order.id} className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="bg-gray-50 px-6 py-4 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center">
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

                                                    <div className="p-6">
                                                        <div className="space-y-4">
                                                            {order.orderItems.map((item) => (
                                                                <div key={item.id} className="flex justify-between items-center hover:bg-gray-50 p-2 rounded-lg transition-colors">
                                                                    <div className="flex items-center">
                                                                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200">
                                                                            {item.item.imageUrl ? (
                                                                                <img
                                                                                    src={item.item.imageUrl}
                                                                                    alt={item.item.name}
                                                                                    className="h-full w-full object-cover object-center"
                                                                                />
                                                                            ) : (
                                                                                <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                                    </svg>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="ml-4">
                                                                            <h3 className="text-base font-medium text-gray-900">{item.item.name}</h3>
                                                                            <div className="flex gap-3 mt-1">
                                                                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                                                                <p className="text-sm text-gray-500">Unit: {currencySymbol || '$'} {item.unitPrice.toFixed(2)}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-base font-medium text-gray-900">{currencySymbol || '$'} {(item.unitPrice * item.quantity).toFixed(2)}</p>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="border-t mt-6 pt-4">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <div className="text-sm text-gray-500">Payment Method</div>
                                                                <div className="text-sm font-medium">
                                                                    {order.payment.paymentMethod === 'CREDIT_CARD' ? (
                                                                        <span className="flex items-center gap-2">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                                            </svg>
                                                                            Credit Card
                                                                        </span>
                                                                    ) : order.payment.paymentMethod}
                                                                </div>
                                                            </div>

                                                            {order.discount > 0 && (
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <div className="text-sm text-gray-500">Discount</div>
                                                                    <div className="text-sm font-medium text-green-600">-{currencySymbol || '$'} {order.discount.toFixed(2)}</div>
                                                                </div>
                                                            )}

                                                            {order.tax > 0 && (
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <div className="text-sm text-gray-500">Tax</div>
                                                                    <div className="text-sm font-medium">{currencySymbol || '$'} {order.tax.toFixed(2)}</div>
                                                                </div>
                                                            )}

                                                            <div className="flex justify-between items-center pt-3 border-t mt-3">
                                                                <div className="text-base font-medium">Total</div>
                                                                <div className="text-lg font-bold">{currencySymbol || '$'} {order.totalAmount.toFixed(2)}</div>
                                                            </div>

                                                            {order.notes && (
                                                                <div className="mt-4 pt-3 border-t">
                                                                    <p className="text-sm text-gray-500">Notes:</p>
                                                                    <p className="text-sm mt-1 bg-gray-50 p-3 rounded-lg">{order.notes}</p>
                                                                </div>
                                                            )}

                                                            {order.status === 'COMPLETED' && (
                                                                <div className="mt-4 text-center">
                                                                    <button
                                                                        className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
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

                    {activeTab === 'security' && (
                        <div className="p-8">
                            <h2 className="text-lg font-medium mb-6">Account Security</h2>

                            <div className="space-y-6">
                                <div className="bg-gray-50 p-6 rounded-xl">
                                    <h3 className="text-base font-medium mb-4">Password</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        It&apos;s a good idea to use a strong password that you don&apos;t use elsewhere.
                                    </p>
                                    <button
                                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                                    >
                                        Change Password
                                    </button>
                                </div>

                                <div className="bg-gray-50 p-6 rounded-xl">
                                    <h3 className="text-base font-medium mb-4">Two-Factor Authentication</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Add an extra layer of security to your account by enabling two-factor authentication
                                    </p>
                                    <button
                                        className="px-4 py-2 border border-gray-300 bg-white text-sm rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                                    >
                                        Enable 2FA
                                    </button>
                                </div>

                                <div className="bg-gray-50 p-6 rounded-xl">
                                    <h3 className="text-base font-medium mb-4">Account Sessions</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Manage your active sessions and sign out from other devices
                                    </p>
                                    <button
                                        className="px-4 py-2 border border-gray-300 bg-white text-sm rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                                    >
                                        Manage Sessions
                                    </button>
                                </div>

                                <div className="border-t pt-6 mt-6">
                                    <h3 className="text-base font-medium text-red-600 mb-4">Danger Zone</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Once you delete your account, there is no going back. Please be certain.
                                    </p>
                                    <button
                                        className="px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                                    >
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-medium mb-2">Log Out</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to log out of your account?</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
