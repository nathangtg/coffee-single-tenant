import React from "react"
import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Search,
    Pencil,
    Trash2,
    ShoppingCart,
    Clock,
    Calendar,
    AlertCircle,
    ChevronDown,
=    Activity,
    PieChart,
    ShoppingBag,
    TrendingUp,
    ChevronRight,
    Printer
} from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/app/components/ui/textarea"
import { Badge } from "@/app/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/app/components/ui/progress"

// Order status types
type OrderStatus = "PENDING" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED"

// Order interface
type Order = {
    id: string
    orderNumber: string
    userId: string
    status: OrderStatus
    totalAmount: number
    discount: number
    tax: number
    notes: string | null
    createdAt: string
    updatedAt: string
    completedAt: string | null
    user: {
        id: string
        email: string
    }
    orderItems: OrderItem[]
    payment: Payment | null
}

// Order item interface
type OrderItem = {
    id: string
    orderId: string
    itemId: string
    quantity: number
    unitPrice: number
    notes: string | null
    createdAt: string
    updatedAt: string
    item: {
        id: string
        name: string
        description: string
        price: number
        imageUrl: string
        isAvailable: boolean
        preparationTime: number
        categoryId: string
        createdAt: string
        updatedAt: string
    }
    options: any[]
}

// Payment interface
type Payment = {
    id: string
    orderId: string
    amount: number
    paymentMethod: string
    status: string
    transactionId: string | null
    paymentDate: string | null
    createdAt: string
    updatedAt: string
}

// Stats interface
type OrderStats = {
    totalOrders: number
    totalRevenue: number
    averageOrderValue: number
    pendingOrders: number
    completedOrders: number
    cancelledOrders: number
    revenueByStatus: Record<OrderStatus, number>
    popularItems: Array<{ itemName: string, quantity: number, revenue: number }>
    recentActivityLog: Array<{ date: string, action: string, orderNumber: string }>
}

export default function OrdersTable() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL")
    const [activeTab, setActiveTab] = useState("all")
    const [orderStats, setOrderStats] = useState<OrderStats | null>(null)
    const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set())

    // For edit dialog
    const [editingOrder, setEditingOrder] = useState<Order | null>(null)
    const [showEditDialog, setShowEditDialog] = useState(false)

    // For order details dialog
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [showDetailsDialog, setShowDetailsDialog] = useState(false)

    const [currencySymbol, setCurrencySymbol] = useState('$')

    useEffect(() => {
        fetchOrders()
        fetchRestaurantSettings()
    }, [])

    useEffect(() => {
        if (orders.length > 0) {
            calculateOrderStats()
        }
    }, [orders])

    const fetchRestaurantSettings = async () => {
        const response = await fetch("/api/restaurant-settings")
        const data = await response.json()
        setCurrencySymbol(data.currencySymbol)
    }

    const fetchOrders = async () => {
        setLoading(true)
        try {
            const response = await fetch("/api/order", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            })

            if (!response.ok) {
                throw new Error("Failed to fetch orders")
            }

            const data = await response.json()
            setOrders(data)
        } catch (error) {
            console.error("Error fetching orders:", error)
        } finally {
            setLoading(false)
        }
    }

    const calculateOrderStats = () => {
        const totalOrders = orders.length
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0)
        const averageOrderValue = totalRevenue / totalOrders

        const pendingOrders = orders.filter(order =>
            order.status === "PENDING" || order.status === "PREPARING" || order.status === "READY"
        ).length
        const completedOrders = orders.filter(order => order.status === "COMPLETED").length
        const cancelledOrders = orders.filter(order => order.status === "CANCELLED").length

        // Revenue by status
        const revenueByStatus = orders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + order.totalAmount
            return acc
        }, {} as Record<OrderStatus, number>)

        // Popular items
        const itemStats = new Map()
        orders.forEach(order => {
            order.orderItems.forEach(item => {
                const itemName = item.item.name
                const quantity = item.quantity
                const revenue = item.quantity * item.unitPrice

                if (itemStats.has(itemName)) {
                    const current = itemStats.get(itemName)
                    itemStats.set(itemName, {
                        quantity: current.quantity + quantity,
                        revenue: current.revenue + revenue
                    })
                } else {
                    itemStats.set(itemName, { quantity, revenue })
                }
            })
        })

        const popularItems = Array.from(itemStats.entries())
            .map(([itemName, stats]) => ({
                itemName,
                quantity: stats.quantity,
                revenue: stats.revenue
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5)

        // Recent activity log (simplified for demo)
        const recentActivityLog = orders
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 5)
            .map(order => ({
                date: order.updatedAt,
                action: `Order ${order.status.toLowerCase()}`,
                orderNumber: order.orderNumber
            }))

        setOrderStats({
            totalOrders,
            totalRevenue,
            averageOrderValue,
            pendingOrders,
            completedOrders,
            cancelledOrders,
            revenueByStatus,
            popularItems,
            recentActivityLog
        })
    }

    const handleUpdateOrder = async () => {
        if (!editingOrder) return

        try {
            const response = await fetch(`/api/order/${editingOrder.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({
                    status: editingOrder.status,
                    notes: editingOrder.notes,
                    discount: editingOrder.discount,
                    tax: editingOrder.tax,
                    totalAmount: editingOrder.totalAmount
                })
            })

            if (!response.ok) {
                throw new Error("Failed to update order")
            }

            // Update local state
            setOrders(orders.map(order =>
                order.id === editingOrder.id ? editingOrder : order
            ))

            setShowEditDialog(false)
            setEditingOrder(null)
        } catch (error) {
            console.error("Error updating order:", error)
        }
    }

    const handleDeleteOrder = async (id: string) => {
        if (!confirm("Are you sure you want to delete this order?")) return

        try {
            const response = await fetch(`/api/order/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            })

            if (!response.ok) {
                throw new Error("Failed to delete order")
            }

            // Update local state
            setOrders(orders.filter(order => order.id !== id))
        } catch (error) {
            console.error("Error deleting order:", error)
        }
    }

    const toggleExpandOrder = (orderId: string) => {
        const newExpandedOrderIds = new Set(expandedOrderIds)
        if (newExpandedOrderIds.has(orderId)) {
            newExpandedOrderIds.delete(orderId)
        } else {
            newExpandedOrderIds.add(orderId)
        }
        setExpandedOrderIds(newExpandedOrderIds)
    }

    const getStatusBadgeColor = (status: OrderStatus) => {
        switch (status) {
            case "PENDING":
                return "bg-yellow-100 text-yellow-800"
            case "PREPARING":
                return "bg-blue-100 text-blue-800"
            case "READY":
                return "bg-green-100 text-green-800"
            case "COMPLETED":
                return "bg-purple-100 text-purple-800"
            case "CANCELLED":
                return "bg-red-100 text-red-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    // Filter orders based on search term, status, and active tab
    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.orderItems.some(item =>
                item.item.name.toLowerCase().includes(searchTerm.toLowerCase())
            )

        const matchesStatus = statusFilter === "ALL" || order.status === statusFilter

        const matchesTab =
            activeTab === "all" ||
            (activeTab === "pending" && (order.status === "PENDING" || order.status === "PREPARING" || order.status === "READY")) ||
            (activeTab === "completed" && order.status === "COMPLETED") ||
            (activeTab === "cancelled" && order.status === "CANCELLED")

        return matchesSearch && matchesStatus && matchesTab
    })

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A"
        return new Date(dateString).toLocaleString()
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            currencyDisplay: 'symbol'
        }).format(amount).replace('$', currencySymbol)
    }

    const isOrderExpanded = (orderId: string) => {
        return expandedOrderIds.has(orderId)
    }

    return (
        <div className="space-y-6">
            {/* Statistics Dashboard */}
            {orderStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium flex items-center gap-2">
                                <ShoppingBag className="h-5 w-5 text-blue-500" />
                                Orders Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Total Orders</p>
                                        <p className="text-2xl font-bold">{orderStats.totalOrders}</p>
                                    </div>
                                    <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                                        <ShoppingCart className="h-8 w-8 text-blue-500" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Pending</span>
                                        <span className="font-medium">{orderStats.pendingOrders} orders</span>
                                    </div>
                                    <Progress value={(orderStats.pendingOrders / orderStats.totalOrders) * 100} className="h-2 bg-yellow-100" indicatorclassname="bg-yellow-500" />

                                    <div className="flex justify-between text-sm">
                                        <span>Completed</span>
                                        <span className="font-medium">{orderStats.completedOrders} orders</span>
                                    </div>
                                    <Progress value={(orderStats.completedOrders / orderStats.totalOrders) * 100} className="h-2 bg-green-100" indicatorclassname="bg-green-500" />

                                    <div className="flex justify-between text-sm">
                                        <span>Cancelled</span>
                                        <span className="font-medium">{orderStats.cancelledOrders} orders</span>
                                    </div>
                                    <Progress value={(orderStats.cancelledOrders / orderStats.totalOrders) * 100} className="h-2 bg-red-100" indicatorclassname="bg-red-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium flex items-center gap-2">
                                {currencySymbol ? currencySymbol : '$'}
                                Revenue
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Total Revenue</p>
                                        <p className="text-2xl font-bold">{formatCurrency(orderStats.totalRevenue)}</p>
                                    </div>
                                    <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                                        <TrendingUp className="h-8 w-8 text-green-500" />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm">Average Order Value</span>
                                        <span className="text-lg font-medium">{formatCurrency(orderStats.averageOrderValue)}</span>
                                    </div>

                                    <div className="space-y-1 mt-4">
                                        <p className="text-sm font-medium mb-2">Revenue by Order Status</p>
                                        {Object.entries(orderStats.revenueByStatus).map(([status, amount]) => (
                                            <div key={status} className="flex justify-between text-sm items-center">
                                                <div className="flex items-center">
                                                    <Badge className={`${getStatusBadgeColor(status as OrderStatus)} mr-2`}>
                                                        {status}
                                                    </Badge>
                                                </div>
                                                <span>{formatCurrency(amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium flex items-center gap-2">
                                <PieChart className="h-5 w-5 text-purple-500" />
                                Popular Items
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    {orderStats.popularItems.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center">
                                            <div>
                                                <p className="font-medium">{item.itemName}</p>
                                                <p className="text-sm text-gray-500">{item.quantity} sold</p>
                                            </div>
                                            <span className="text-green-600 font-medium">{formatCurrency(item.revenue)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 border-t">
                                    <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
                                        <Activity className="h-4 w-4" />
                                        Recent Activity
                                    </h4>
                                    <div className="space-y-2">
                                        {orderStats.recentActivityLog.map((log, index) => (
                                            <div key={index} className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="font-normal">
                                                        {log.action}
                                                    </Badge>
                                                    <span className="text-gray-500">{log.orderNumber}</span>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(log.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Orders Management Table */}
            <Card className="w-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                        <CardTitle className="text-2xl font-bold flex items-center gap-2">
                            <ShoppingCart className="h-6 w-6" />
                            <span>Orders Management</span>
                        </CardTitle>
                        <CardDescription>
                            Manage and track all customer orders in one place
                        </CardDescription>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search by order #, customer, or item..."
                                className="pl-8 w-64"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select
                            value={statusFilter}
                            onValueChange={(value) => setStatusFilter(value as OrderStatus | "ALL")}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Statuses</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="PREPARING">Preparing</SelectItem>
                                <SelectItem value="READY">Ready</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={fetchOrders}>Refresh</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-4">
                        <TabsList>
                            <TabsTrigger value="all">All Orders</TabsTrigger>
                            <TabsTrigger value="pending">Pending</TabsTrigger>
                            <TabsTrigger value="completed">Completed</TabsTrigger>
                            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="w-10"></TableHead>
                                    <TableHead className="font-semibold">Order #</TableHead>
                                    <TableHead className="font-semibold">Customer</TableHead>
                                    <TableHead className="font-semibold">Date</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="font-semibold">Items</TableHead>
                                    <TableHead className="font-semibold">Total</TableHead>
                                    <TableHead className="font-semibold">Payment</TableHead>
                                    <TableHead className="font-semibold text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Clock className="h-8 w-8 animate-spin text-gray-400" />
                                                <p className="text-gray-500">Loading orders...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <AlertCircle className="h-8 w-8 text-gray-400" />
                                                <p className="text-gray-500">No orders found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <React.Fragment key={order.id}>
                                            <TableRow key={order.id} className="hover:bg-gray-50">
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => toggleExpandOrder(order.id)}
                                                    >
                                                        <ChevronDown className={`h-4 w-4 transition-transform ${isOrderExpanded(order.id) ? 'transform rotate-180' : ''}`} />
                                                    </Button>
                                                </TableCell>
                                                <TableCell
                                                    className="font-medium cursor-pointer hover:text-blue-600"
                                                    onClick={() => {
                                                        setSelectedOrder(order)
                                                        setShowDetailsDialog(true)
                                                    }}
                                                >
                                                    {order.orderNumber}
                                                </TableCell>
                                                <TableCell>{order.user.email}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-1">
                                                        <Calendar className="h-3 w-3 text-gray-500" />
                                                        <span className="text-sm">{formatDate(order.createdAt)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={`${getStatusBadgeColor(order.status)} font-normal`}
                                                    >
                                                        {order.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {order.orderItems.length} {order.orderItems.length === 1 ? 'item' : 'items'}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {formatCurrency(order.totalAmount)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={order.payment?.status === 'PENDING'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-green-100 text-green-800'
                                                        }
                                                    >
                                                        {order.payment?.status || 'N/A'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setEditingOrder(order)
                                                                setShowEditDialog(true)
                                                            }}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-red-600"
                                                            onClick={() => handleDeleteOrder(order.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>

                                            {/* Expanded Order Items Row */}
                                            {isOrderExpanded(order.id) && (
                                                <TableRow className="bg-gray-50">
                                                    <TableCell colSpan={9} className="p-0">
                                                        <div className="p-4">
                                                            <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-1">
                                                                <ShoppingBag className="h-4 w-4" />
                                                                Order Items
                                                            </h4>
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow className="bg-gray-100">
                                                                        <TableHead className="w-12"></TableHead>
                                                                        <TableHead>Item</TableHead>
                                                                        <TableHead>Quantity</TableHead>
                                                                        <TableHead>Unit Price</TableHead>
                                                                        <TableHead>Total</TableHead>
                                                                        <TableHead>Notes</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {order.orderItems.map((item) => (
                                                                        <TableRow key={item.id}>
                                                                            <TableCell>
                                                                                <div className="w-10 h-10 relative rounded overflow-hidden">
                                                                                    <img
                                                                                        src={item.item.imageUrl || "/api/placeholder/40/40"}
                                                                                        alt={item.item.name}
                                                                                        className="w-10 h-10 object-cover rounded"
                                                                                        onError={(e) => {
                                                                                            (e.target as HTMLImageElement).src = "/api/placeholder/40/40"
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell className="font-medium">
                                                                                {item.item.name}
                                                                            </TableCell>
                                                                            <TableCell>{item.quantity}</TableCell>
                                                                            <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                                                                            <TableCell className="font-medium">{formatCurrency(item.quantity * item.unitPrice)}</TableCell>
                                                                            <TableCell>{item.notes || "-"}</TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>

                                                            <div className="mt-4 flex justify-between">
                                                                <Button
                                                                    variant="link"
                                                                    className="p-0 h-auto flex items-center gap-1 text-blue-600"
                                                                    onClick={() => {
                                                                        setSelectedOrder(order)
                                                                        setShowDetailsDialog(true)
                                                                    }}
                                                                >
                                                                    View full order details
                                                                    <ChevronRight className="h-4 w-4" />
                                                                </Button>

                                                                <div className="space-x-2">
                                                                    <Badge className="font-normal">
                                                                        Subtotal: {formatCurrency(order.orderItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0))}
                                                                    </Badge>
                                                                    {order.discount > 0 && (
                                                                        <Badge variant="outline" className="font-normal text-green-600">
                                                                            Discount: -{formatCurrency(order.discount)}
                                                                        </Badge>
                                                                    )}
                                                                    {order.tax > 0 && (
                                                                        <Badge variant="outline" className="font-normal">
                                                                            Tax: {formatCurrency(order.tax)}
                                                                        </Badge>
                                                                    )}
                                                                    <Badge className="bg-blue-100 text-blue-800 font-normal">
                                                                        Total: {formatCurrency(order.totalAmount)}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Edit Order Dialog */}
            {/* Edit Order Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Order #{editingOrder?.orderNumber}</DialogTitle>
                    </DialogHeader>
                    {editingOrder && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Status</label>
                                    <Select
                                        value={editingOrder.status}
                                        onValueChange={(value) =>
                                            setEditingOrder({
                                                ...editingOrder,
                                                status: value as OrderStatus
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PENDING">Pending</SelectItem>
                                            <SelectItem value="PREPARING">Preparing</SelectItem>
                                            <SelectItem value="READY">Ready</SelectItem>
                                            <SelectItem value="COMPLETED">Completed</SelectItem>
                                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Total Amount</label>
                                    <div className="relative">
                                        {currencySymbol ? currencySymbol : '$'}
                                        <Input
                                            type="number"
                                            className="pl-8"
                                            value={editingOrder.totalAmount}
                                            onChange={(e) =>
                                                setEditingOrder({
                                                    ...editingOrder,
                                                    totalAmount: parseFloat(e.target.value)
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Discount</label>
                                    <div className="relative">
                                        {currencySymbol ? currencySymbol : '$'}
                                        <Input
                                            type="number"
                                            className="pl-8"
                                            value={editingOrder.discount}
                                            onChange={(e) =>
                                                setEditingOrder({
                                                    ...editingOrder,
                                                    discount: parseFloat(e.target.value)
                                                })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tax</label>
                                    <div className="relative">
                                        {currencySymbol ? currencySymbol : '$'}
                                        <Input
                                            type="number"
                                            className="pl-8"
                                            value={editingOrder.tax}
                                            onChange={(e) =>
                                                setEditingOrder({
                                                    ...editingOrder,
                                                    tax: parseFloat(e.target.value)
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Notes</label>
                                <Textarea
                                    placeholder="Add notes about this order..."
                                    value={editingOrder.notes || ""}
                                    onChange={(e) =>
                                        setEditingOrder({
                                            ...editingOrder,
                                            notes: e.target.value
                                        })
                                    }
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-sm font-medium">Order Summary</h3>
                                <div className="bg-gray-50 p-3 rounded-md space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Customer:</span>
                                        <span className="font-medium">{editingOrder.user.email}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Items:</span>
                                        <span className="font-medium">{editingOrder.orderItems.length}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Created:</span>
                                        <span className="font-medium">{formatDate(editingOrder.createdAt)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Payment Status:</span>
                                        <Badge
                                            className={
                                                editingOrder.payment?.status === 'PENDING'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-green-100 text-green-800'
                                            }
                                        >
                                            {editingOrder.payment?.status || 'N/A'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateOrder}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Order Details Dialog */}
            {/* Order Details Dialog */}
            <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" />
                            Order Details #{selectedOrder?.orderNumber}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="space-y-6">
                            {/* Order Summary Card */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Order Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Status:</span>
                                            <Badge
                                                className={getStatusBadgeColor(selectedOrder.status)}
                                            >
                                                {selectedOrder.status}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Created:</span>
                                            <span>{formatDate(selectedOrder.createdAt)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Updated:</span>
                                            <span>{formatDate(selectedOrder.updatedAt)}</span>
                                        </div>
                                        {selectedOrder.completedAt && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Completed:</span>
                                                <span>{formatDate(selectedOrder.completedAt)}</span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Customer Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Customer ID:</span>
                                            <span className="font-mono">{selectedOrder.userId}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Email:</span>
                                            <span>{selectedOrder.user.email}</span>
                                        </div>
                                        <Button variant="link" className="p-0 h-auto text-blue-600">
                                            View Customer Profile
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Payment Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        {selectedOrder.payment ? (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Payment Status:</span>
                                                    <Badge
                                                        className={
                                                            selectedOrder.payment.status === 'PENDING'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : 'bg-green-100 text-green-800'
                                                        }
                                                    >
                                                        {selectedOrder.payment.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Method:</span>
                                                    <span>{selectedOrder.payment.paymentMethod}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Transaction ID:</span>
                                                    <span className="font-mono text-xs">
                                                        {selectedOrder.payment.transactionId || 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Payment Date:</span>
                                                    <span>{formatDate(selectedOrder.payment.paymentDate || '')}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex items-center justify-center h-16 text-gray-500">
                                                No payment information
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Order Items */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2">
                                        <ShoppingBag className="h-5 w-5" />
                                        Order Items ({selectedOrder.orderItems.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-md border overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-gray-50">
                                                    <TableHead className="w-16"></TableHead>
                                                    <TableHead>Item</TableHead>
                                                    <TableHead>Price</TableHead>
                                                    <TableHead>Quantity</TableHead>
                                                    <TableHead>Subtotal</TableHead>
                                                    <TableHead>Notes</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedOrder.orderItems.map((item) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell>
                                                            <div className="w-12 h-12 rounded overflow-hidden">
                                                                <img
                                                                    src={item.item.imageUrl || "/api/placeholder/48/48"}
                                                                    alt={item.item.name}
                                                                    className="w-12 h-12 object-cover"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = "/api/placeholder/48/48"
                                                                    }}
                                                                />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div>
                                                                <p className="font-medium">{item.item.name}</p>
                                                                <p className="text-xs text-gray-500 truncate max-w-xs">
                                                                    {item.item.description}
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                                                        <TableCell>{item.quantity}</TableCell>
                                                        <TableCell className="font-medium">
                                                            {formatCurrency(item.quantity * item.unitPrice)}
                                                        </TableCell>
                                                        <TableCell>
                                                            {item.notes ? (
                                                                <p className="text-sm">{item.notes}</p>
                                                            ) : (
                                                                <span className="text-gray-400">-</span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Order Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Order Notes</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {selectedOrder.notes ? (
                                            <p className="text-sm">{selectedOrder.notes}</p>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">No notes for this order</p>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Order Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Subtotal:</span>
                                                <span>
                                                    {formatCurrency(selectedOrder.orderItems.reduce(
                                                        (acc, item) => acc + item.quantity * item.unitPrice, 0
                                                    ))}
                                                </span>
                                            </div>

                                            {selectedOrder.discount > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Discount:</span>
                                                    <span className="text-green-600">
                                                        -{formatCurrency(selectedOrder.discount)}
                                                    </span>
                                                </div>
                                            )}

                                            {selectedOrder.tax > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Tax:</span>
                                                    <span>{formatCurrency(selectedOrder.tax)}</span>
                                                </div>
                                            )}

                                            <div className="pt-2 mt-2 border-t flex justify-between font-medium">
                                                <span>Total:</span>
                                                <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Action Footer */}
                            <div className="flex justify-between pt-4 border-t">
                                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                                    Close
                                </Button>

                                <div className="space-x-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setEditingOrder(selectedOrder)
                                            setShowDetailsDialog(false)
                                            setShowEditDialog(true)
                                        }}
                                    >
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit Order
                                    </Button>

                                    <Button
                                        variant="default"
                                        onClick={() => {
                                            // Implement print functionality
                                            window.print()
                                        }}
                                    >
                                        <Printer className="h-4 w-4 mr-2" />
                                        Print Order
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}