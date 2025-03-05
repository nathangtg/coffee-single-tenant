import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, ShoppingCart, XCircle, PlusCircle, MinusCircle, Edit, Trash2, Eye } from "lucide-react"
import { format } from "date-fns"
import { Textarea } from "@/app/components/ui/textarea"

type CartItem = {
    id: string
    cartId: string
    itemId: string
    quantity: number
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
    options?: Array<{
        optionId: string
        option?: {
            id: string
            name: string
            priceModifier: number
        }
    }>
}

type RestaurantSetting = {
    id: string;
    storeName: string;
    address: string;
    phone: string;
    email: string;
    logoUrl: string;
    openingHours: {
        [day: string]: {
            open: string;
            close: string;
            closed?: boolean;
        };
    };
    taxRate: number;
    currencySymbol: string;
    createdAt: string;
    updatedAt: string;
};


type Cart = {
    id: string
    userId: string
    createdAt: string
    updatedAt: string
    cartItems: CartItem[]
    user?: {
        id: string
        name: string
        email: string
    }
}

type Item = {
    id: string
    name: string
    price: number
    options: Array<{
        id: string
        name: string
        priceModifier: number
    }>
}

export default function CartManagementTable() {
    const [carts, setCarts] = useState<Cart[]>([])
    const [items, setItems] = useState<Item[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCart, setSelectedCart] = useState<Cart | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isViewModalOpen, setIsViewModalOpen] = useState(false)
    const [editedCartItems, setEditedCartItems] = useState<CartItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [restaurantSettings, setRestaurantSettings] = useState<RestaurantSetting | null>(null)

    useEffect(() => {
        fetchCarts()
        fetchItems()
        fetchRestaurantSettings(
        ).then((data) => {
            setRestaurantSettings(data)
        }
        )
    }, [])

    const fetchRestaurantSettings = async () => {
        try {
            const response = await fetch("/api/restaurant-settings", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            })
            const data = await response.json()
            return data
        } catch (error) {
            console.error("Error fetching restaurant settings:", error)
            return null
        }
    }

    const fetchCarts = async () => {
        setIsLoading(true)
        try {
            const response = await fetch("/api/cart", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            })
            const data = await response.json()

            // Verify data is an array before setting state
            if (Array.isArray(data)) {
                setCarts(data)
            } else {
                console.error("Expected array of carts but received:", data)
                setCarts([]) // Reset to empty array
            }
        } catch (error) {
            console.error("Error fetching carts:", error)
            setCarts([]) // Ensure carts is an array on error
        } finally {
            setIsLoading(false)
        }
    }

    const fetchItems = async () => {
        try {
            const response = await fetch("/api/item", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            })
            const data = await response.json()
            setItems(data)
        } catch (error) {
            console.error("Error fetching items:", error)
        }
    }

    const fetchCartDetails = async (cartId: string) => {
        try {
            const response = await fetch(`/api/cart/${cartId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            })
            const data = await response.json()
            console.log("Cart details:", data)
            return data
        } catch (error) {
            console.error("Error fetching cart details:", error)
            return null
        }
    }

    const handleViewCart = async (cart: Cart) => {
        const cartDetails = await fetchCartDetails(cart.id)
        setSelectedCart(cartDetails)
        setIsViewModalOpen(true)
    }

    const handleEditCart = async (cart: Cart) => {
        const cartDetails = await fetchCartDetails(cart.id)
        setSelectedCart(cartDetails)
        setEditedCartItems([...cartDetails.cartItems])
        setIsEditModalOpen(true)
    }

    const handleDeleteCart = async (cartId: string) => {
        if (confirm("Are you sure you want to delete this cart?")) {
            try {
                await fetch(`/api/cart/${cartId}`, {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                })
                fetchCarts()
            } catch (error) {
                console.error("Error deleting cart:", error)
            }
        }
    }

    const handleUpdateCart = async () => {
        if (!selectedCart) return

        try {
            const payload = {
                cartItems: editedCartItems.map(item => ({
                    itemId: item.itemId,
                    quantity: item.quantity,
                    notes: item.notes,
                    options: item.options ? item.options.map(opt => ({ optionId: opt.optionId })) : []
                }))
            }

            await fetch(`/api/cart/${selectedCart.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            })

            setIsEditModalOpen(false)
            fetchCarts()
        } catch (error) {
            console.error("Error updating cart:", error)
        }
    }

    const updateCartItemQuantity = (index: number, quantity: number) => {
        const newItems = [...editedCartItems]
        newItems[index] = { ...newItems[index], quantity: Math.max(1, quantity) }
        setEditedCartItems(newItems)
    }

    const updateCartItemNotes = (index: number, notes: string) => {
        const newItems = [...editedCartItems]
        newItems[index] = { ...newItems[index], notes }
        setEditedCartItems(newItems)
    }

    const removeCartItem = (index: number) => {
        const newItems = [...editedCartItems]
        newItems.splice(index, 1)
        setEditedCartItems(newItems)
    }

    const addNewCartItem = () => {
        if (items.length === 0) return

        const newItem: CartItem = {
            id: `temp-${Date.now()}`,
            cartId: selectedCart?.id || "",
            itemId: items[0].id,
            quantity: 1,
            notes: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            item: {
                id: items[0].id,
                name: items[0].name,
                description: "",
                price: items[0].price,
                imageUrl: "",
                isAvailable: true,
                preparationTime: 0,
                categoryId: "",
                createdAt: "",
                updatedAt: ""
            },
            options: []
        }

        setEditedCartItems([...editedCartItems, newItem])
    }

    const filteredCarts = carts.filter(cart => {
        const searchLower = searchTerm.toLowerCase()
        return (
            cart.id.toLowerCase().includes(searchLower) ||
            cart.userId.toLowerCase().includes(searchLower) ||
            cart.cartItems.some(item =>
                item.item?.name.toLowerCase().includes(searchLower)
            )
        )
    })

    const calculateCartTotal = (cartItems: CartItem[]) => {
        return cartItems.reduce((total, item) => {
            const itemPrice = item.item.price * item.quantity
            const optionsPrice = item.options
                ? item.options.reduce((sum, opt) => sum + ((opt.option?.priceModifier || 0)), 0) * item.quantity
                : 0
            return total + itemPrice + optionsPrice
        }, 0)
    }

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), "MMM d, yyyy h:mm a")
    }

    return (
        <div>
            <Card className="w-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-2xl font-bold">Cart Management</CardTitle>
                    <div className="flex items-center space-x-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search carts..."
                                className="pl-8 w-64"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button onClick={fetchCarts} variant="outline">
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="text-center">
                                <div className="spinner"></div>
                                <p className="mt-2">Loading carts...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="font-semibold">Cart ID</TableHead>
                                        <TableHead className="font-semibold">User ID</TableHead>
                                        <TableHead className="font-semibold">Items</TableHead>
                                        <TableHead className="font-semibold">Total</TableHead>
                                        <TableHead className="font-semibold">Created</TableHead>
                                        <TableHead className="font-semibold">Updated</TableHead>
                                        <TableHead className="font-semibold text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCarts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                                                No carts found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredCarts.map((cart) => (
                                            <TableRow key={cart.id} className="hover:bg-gray-50">
                                                <TableCell className="font-medium">{cart.id.substring(0, 8)}...</TableCell>
                                                <TableCell>{cart.userId.substring(0, 8)}...</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-1">
                                                        <ShoppingCart className="h-4 w-4 text-gray-500" />
                                                        <span className="text-sm text-gray-600">{cart.cartItems.length}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {restaurantSettings?.currencySymbol}
                                                    {calculateCartTotal(cart.cartItems).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {formatDate(cart.createdAt)}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {formatDate(cart.updatedAt)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <Button size="sm" variant="ghost" onClick={() => handleViewCart(cart)}>
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="sm" variant="ghost" onClick={() => handleEditCart(cart)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-red-600"
                                                            onClick={() => handleDeleteCart(cart.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* View Cart Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Cart Details</DialogTitle>
                    </DialogHeader>
                    {selectedCart && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-semibold">Cart ID</h3>
                                    <p className="text-sm text-gray-600">{selectedCart.id}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold">User ID</h3>
                                    <p className="text-sm text-gray-600">{selectedCart.userId}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold">Created</h3>
                                    <p className="text-sm text-gray-600">{formatDate(selectedCart.createdAt)}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold">Updated</h3>
                                    <p className="text-sm text-gray-600">{formatDate(selectedCart.updatedAt)}</p>
                                </div>
                            </div>

                            <div className="mt-4">
                                <h3 className="text-sm font-semibold mb-2">Cart Items</h3>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50">
                                                <TableHead className="font-semibold">Item</TableHead>
                                                <TableHead className="font-semibold">Price</TableHead>
                                                <TableHead className="font-semibold">Quantity</TableHead>
                                                <TableHead className="font-semibold">Options</TableHead>
                                                <TableHead className="font-semibold">Notes</TableHead>
                                                <TableHead className="font-semibold text-right">Subtotal</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedCart.cartItems.map((cartItem) => {
                                                const itemPrice = cartItem.item.price
                                                const optionsPrice = cartItem.options
                                                    ? cartItem.options.reduce((sum, opt) => sum + ((opt.option?.priceModifier || 0)), 0)
                                                    : 0
                                                const totalPrice = (itemPrice + optionsPrice) * cartItem.quantity

                                                return (
                                                    <TableRow key={cartItem.id}>
                                                        <TableCell className="font-medium">
                                                            {cartItem.item.name}
                                                        </TableCell>
                                                        <TableCell>
                                                            {restaurantSettings?.currencySymbol}
                                                            {itemPrice.toFixed(2)}</TableCell>
                                                        <TableCell>{cartItem.quantity}</TableCell>
                                                        <TableCell>
                                                            {cartItem.options && cartItem.options.length > 0 ? (
                                                                <ul className="text-sm text-gray-600 space-y-1">
                                                                    {cartItem.options.map((opt, index) => (
                                                                        <li key={index}>
                                                                            {opt.option?.name} (+${opt.option?.priceModifier.toFixed(2)})
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <span className="text-sm text-gray-500">No options</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {cartItem.notes ? (
                                                                <p className="text-sm text-gray-600">{cartItem.notes}</p>
                                                            ) : (
                                                                <span className="text-sm text-gray-500">No notes</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            ${totalPrice.toFixed(2)}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-right font-bold">
                                                    Total:
                                                </TableCell>
                                                <TableCell className="text-right font-bold">
                                                    ${calculateCartTotal(selectedCart.cartItems).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Cart Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Edit Cart</DialogTitle>
                    </DialogHeader>
                    {selectedCart && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-semibold">Cart ID</h3>
                                    <p className="text-sm text-gray-600">{selectedCart.id}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold">User ID</h3>
                                    <p className="text-sm text-gray-600">{selectedCart.userId}</p>
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-sm font-semibold">Cart Items</h3>
                                    <Button size="sm" onClick={addNewCartItem} className="flex items-center gap-1">
                                        <PlusCircle className="h-4 w-4" /> Add Item
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {editedCartItems.map((cartItem, index) => {
                                        const currentItem = items.find(i => i.id === cartItem.itemId)

                                        return (
                                            <Card key={index} className="bg-gray-50">
                                                <CardContent className="pt-4">
                                                    <div className="flex justify-between">
                                                        <div className="flex-1">
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                <div>
                                                                    <label className="text-sm font-medium mb-1 block">Item</label>
                                                                    <Select
                                                                        value={cartItem.itemId}
                                                                        onValueChange={(value) => {
                                                                            const selectedItem = items.find(i => i.id === value)
                                                                            const newItems = [...editedCartItems]
                                                                            newItems[index] = {
                                                                                ...newItems[index],
                                                                                itemId: value,
                                                                                item: {
                                                                                    ...newItems[index].item,
                                                                                    id: value,
                                                                                    name: selectedItem?.name || "",
                                                                                    price: selectedItem?.price || 0
                                                                                },
                                                                                options: []
                                                                            }
                                                                            setEditedCartItems(newItems)
                                                                        }}
                                                                    >
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select an item" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {items.map((item) => (
                                                                                <SelectItem key={item.id} value={item.id}>
                                                                                    {item.name} - ${item.price.toFixed(2)}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>

                                                                <div>
                                                                    <label className="text-sm font-medium mb-1 block">Quantity</label>
                                                                    <div className="flex items-center space-x-2">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => updateCartItemQuantity(index, cartItem.quantity - 1)}
                                                                        >
                                                                            <MinusCircle className="h-4 w-4" />
                                                                        </Button>
                                                                        <Input
                                                                            type="number"
                                                                            min="1"
                                                                            value={cartItem.quantity}
                                                                            onChange={(e) => updateCartItemQuantity(index, parseInt(e.target.value) || 1)}
                                                                            className="w-20 text-center"
                                                                        />
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => updateCartItemQuantity(index, cartItem.quantity + 1)}
                                                                        >
                                                                            <PlusCircle className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <label className="text-sm font-medium mb-1 block">Notes</label>
                                                                    <Textarea
                                                                        value={cartItem.notes || ""}
                                                                        onChange={(e) => updateCartItemNotes(index, e.target.value)}
                                                                        placeholder="Special instructions..."
                                                                        className="h-10"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {currentItem && currentItem.options.length > 0 && (
                                                                <div className="mt-4">
                                                                    <label className="text-sm font-medium mb-1 block">Options</label>
                                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                                        {currentItem.options.map((option) => {
                                                                            const isSelected = cartItem.options?.some(opt => opt.optionId === option.id)

                                                                            return (
                                                                                <div key={option.id} className="flex items-center space-x-2">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        id={`option-${index}-${option.id}`}
                                                                                        checked={isSelected}
                                                                                        onChange={(e) => {
                                                                                            const newItems = [...editedCartItems]
                                                                                            if (e.target.checked) {
                                                                                                // Add option
                                                                                                const newOptions = [...(newItems[index].options || []), {
                                                                                                    optionId: option.id,
                                                                                                    option: {
                                                                                                        id: option.id,
                                                                                                        name: option.name,
                                                                                                        priceModifier: option.priceModifier
                                                                                                    }
                                                                                                }]
                                                                                                newItems[index] = { ...newItems[index], options: newOptions }
                                                                                            } else {
                                                                                                // Remove option
                                                                                                const newOptions = newItems[index].options?.filter(
                                                                                                    opt => opt.optionId !== option.id
                                                                                                ) || []
                                                                                                newItems[index] = { ...newItems[index], options: newOptions }
                                                                                            }
                                                                                            setEditedCartItems(newItems)
                                                                                        }}
                                                                                    />
                                                                                    <label htmlFor={`option-${index}-${option.id}`} className="text-sm">
                                                                                        {option.name} (+${option.priceModifier.toFixed(2)})
                                                                                    </label>
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <Button
                                                            variant="ghost"
                                                            className="text-red-600 self-start"
                                                            onClick={() => removeCartItem(index)}
                                                        >
                                                            <XCircle className="h-5 w-5" />
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}

                                    {editedCartItems.length === 0 && (
                                        <div className="text-center py-8 border rounded-md bg-gray-50">
                                            <p className="text-gray-500">No items in cart. Add an item to continue.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2 mt-6">
                                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleUpdateCart} disabled={editedCartItems.length === 0}>
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}