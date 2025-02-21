'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from '@/hooks/use-toast';
import { Loader2, Coffee, Trash2, Plus, Minus, ChevronLeft, Edit2, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useRouter } from 'next/navigation';
import { Badge } from '@/app/components/ui/badge';
import { Textarea } from '@/app/components/ui/textarea';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Separator } from '@radix-ui/react-select';

// Loading Component
const LoadingState = () => (
    <div className="flex items-center justify-center min-h-screen bg-background/50">
        <div className="text-center space-y-4 animate-in fade-in duration-500">
            <Coffee className="h-12 w-12 animate-pulse mx-auto text-primary" />
            <p className="text-muted-foreground">Preparing your cart...</p>
        </div>
    </div>
);

// Login Required Component
const LoginRequired = ({ onShopClick }) => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
        <Card className="max-w-md w-full">
            <CardHeader className="text-center space-y-4">
                <div className="mx-auto bg-primary/10 w-fit p-4 rounded-full">
                    <Coffee className="h-12 w-12 text-primary" />
                </div>
                <div>
                    <CardTitle className="text-2xl mb-2">Welcome to Coffee Shop</CardTitle>
                    <p className="text-muted-foreground">Sign in to view your cart and complete your order</p>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button className="w-full" size="lg" onClick={() => window.location.href = '/login'}>
                    Sign In
                </Button>
                <Button variant="outline" className="w-full" size="lg" onClick={onShopClick}>
                    Continue Shopping
                </Button>
            </CardContent>
        </Card>
    </div>
);

// Empty Cart Component
const EmptyCart = ({ onShopClick }) => (
    <Card className="text-center p-8">
        <CardContent className="space-y-6">
            <div className="mx-auto bg-muted w-fit p-6 rounded-full">
                <Coffee className="h-16 w-16 text-muted-foreground" />
            </div>
            <div className="space-y-2">
                <h3 className="text-2xl font-semibold">Your cart is empty</h3>
                <p className="text-muted-foreground">Add some delicious items to get started</p>
            </div>
            <Button size="lg" onClick={onShopClick}>
                Browse Menu
            </Button>
        </CardContent>
    </Card>
);

// Edit Item Dialog Component
const EditItemDialog = ({ item, itemOptions, onSave, onClose, isUpdating }) => {
    const [quantity, setQuantity] = useState(item.quantity);
    const [notes, setNotes] = useState(item.notes || '');

    const handleSave = () => {
        onSave(item.id, { quantity, notes });
    };

    return (
        <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <span>Edit Order</span>
                    <Badge variant="outline">{item.item.name}</Badge>
                </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
                <div className="space-y-4">
                    <h4 className="font-medium">Quantity</h4>
                    <div className="flex items-center justify-center bg-muted/30 rounded-lg p-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        >
                            <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-medium text-lg">{quantity}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setQuantity(q => q + 1)}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <h4 className="font-medium">Special Instructions</h4>
                    <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any special requests for this item?"
                        className="resize-none"
                        rows={3}
                    />
                </div>

                {itemOptions.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="font-medium">Available Add-ons</h4>
                        <div className="grid gap-2">
                            {itemOptions.map(option => (
                                <div
                                    key={option.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                                >
                                    <span>{option.name}</span>
                                    <Badge variant="secondary">+${option.priceModifier.toFixed(2)}</Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button onClick={handleSave} disabled={isUpdating}>
                    {isUpdating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        'Save Changes'
                    )}
                </Button>
            </CardFooter>
        </DialogContent>
    );
};

const CartItem = ({ item, onEdit, onDelete, itemOptions, onPriceUpdate }) => {
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [itemTotal, setItemTotal] = useState(0);

    useEffect(() => {
        const fetchCartItemOptions = async () => {
            try {
                const response = await fetch(`/api/cart-item/${item.id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (!response.ok) throw new Error('Failed to fetch item options');
                const data = await response.json();
                setSelectedOptions(data.options || []);

                const basePrice = item.item.price * item.quantity;
                const optionsTotal = (data.options || []).reduce((total, opt) =>
                    total + (opt.option.priceModifier * item.quantity), 0);
                const total = basePrice + optionsTotal;

                setItemTotal(total);
                onPriceUpdate(item.id, total);
            } catch (error) {
                console.error('Error fetching item options:', error);
            }
        };

        fetchCartItemOptions();
    }, [
        // Check if the item or its quantity has changed
        item.id,
        item.item.price,
        item.quantity
    ]);

    return (
        <Card className="overflow-hidden transition-all hover:shadow-lg">
            <div className="flex gap-6 p-4">
                <div className="relative w-32 h-32 rounded-lg overflow-hidden">
                    <img
                        src={item.item.imageUrl}
                        alt={item.item.name}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </div>

                <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold text-lg">{item.item.name}</h3>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <span>${item.item.price.toFixed(2)} each</span>
                                <span>×</span>
                                <span>{item.quantity}</span>
                            </div>
                        </div>

                        <div className="flex gap-1">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="hover:bg-accent">
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <EditItemDialog
                                    item={item}
                                    itemOptions={itemOptions}
                                    onSave={onEdit}
                                    onClose={() => { }}
                                    isUpdating={false}
                                />
                            </Dialog>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => onDelete(item.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {selectedOptions.length > 0 && (
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Selected Options:</p>
                            <div className="flex flex-wrap gap-2">
                                {selectedOptions.map((opt) => (
                                    <Badge key={opt.id} variant="secondary">
                                        {opt.option.name} (+${opt.option.priceModifier.toFixed(2)})
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {item.notes && (
                        <Badge variant="outline" className="text-xs">
                            Note: {item.notes}
                        </Badge>
                    )}

                    <div className="text-sm text-muted-foreground">
                        Subtotal: ${itemTotal.toFixed(2)}
                    </div>
                </div>
            </div>
        </Card>
    );
};


// Main Cart Page Component
const CartPage = () => {
    const router = useRouter();
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [itemOptions, setItemOptions] = useState([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [itemTotals, setItemTotals] = useState({});
    const [orderTotal, setOrderTotal] = useState(0);

    const fetchCart = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch('/api/cart', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch cart');
            const data = await response.json();
            setCart(data);
        } catch (error) {
            console.error('Error fetching cart:', error);
            toast({
                title: "Error loading cart",
                description: "Please try again later",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };


    const fetchItemOptions = async () => {
        try {
            const response = await fetch('/api/itemOptions');
            if (!response.ok) throw new Error('Failed to fetch options');
            const data = await response.json();
            setItemOptions(data);
        } catch (error) {
            console.error('Error fetching options:', error);
        }
    };


    useEffect(() => {
        fetchCart();
        fetchItemOptions();
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        const total = Object.values(itemTotals)
            .filter((value): value is number => typeof value === 'number')
            .reduce((sum, value) => sum + value, 0);
        setOrderTotal(total);
    }, [itemTotals]);



    const handleItemPriceUpdate = (itemId, total) => {
        setItemTotals(prev => ({
            ...prev,
            [itemId]: total
        }));
    };

    if (loading) return <LoadingState />;
    if (!localStorage.getItem('token')) {
        return <LoginRequired onShopClick={() => router.push('/pages/coffee-shop')} />;
    }

    // const calculateTotal = () => {
    //     return cart.reduce((total, cartEntry) => {
    //         return total + cartEntry.cartItems.reduce(async (itemTotalPromise, item) => {
    //             const itemTotal = await itemTotalPromise;

    //             // Fetch options for this cart item
    //             const response = await fetch(`/api/cart-item/${item.id}`);
    //             const itemData = await response.json();

    //             const optionsTotal = (itemData.options || []).reduce((optTotal, opt) =>
    //                 optTotal + (opt.option.priceModifier * item.quantity), 0);

    //             return itemTotal + (item.item.price * item.quantity) + optionsTotal;
    //         }, Promise.resolve(0));
    //     }, 0).toFixed(2);
    // };

    const handleDeleteItem = async (itemId) => {
        try {
            setIsUpdating(true);
            const response = await fetch(`/api/cart-item/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete item');

            toast({
                title: "Item removed",
                description: "Your cart has been updated",
            });
            fetchCart();
        } catch (error) {
            console.error('Error deleting item:', error);
            toast({
                title: "Error",
                description: "Failed to remove item",
                variant: "destructive",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdateItem = async (itemId, updates) => {
        try {
            setIsUpdating(true);
            const response = await fetch(`/api/cart-item/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(updates)
            });

            if (!response.ok) throw new Error('Failed to update item');

            toast({
                title: "Success",
                description: "Cart item updated",
            });
            fetchCart();
        } catch (error) {
            console.error('Error updating item:', error);
            toast({
                title: "Error",
                description: "Failed to update item",
                variant: "destructive",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    // const calculateTotal = async () => {
    //     const total = await cart.reduce(async (totalPromise, cartEntry) => {
    //         const total = await totalPromise;

    //         const cartEntryTotal = await cartEntry.cartItems.reduce(async (itemTotalPromise, item) => {
    //             const itemTotal = await itemTotalPromise;

    //             // Fetch options for this cart item
    //             const response = await fetch(`/api/cart-item/${item.id}`, {
    //                 method: 'GET',
    //                 headers: {
    //                     'Authorization': `Bearer ${localStorage.getItem('token')}`
    //                 }
    //             });
    //             const itemData = await response.json();

    //             const optionsTotal = (itemData.options || []).reduce((optTotal, opt) =>
    //                 optTotal + (opt.option.priceModifier * item.quantity), 0);

    //             return itemTotal + (item.item.price * item.quantity) + optionsTotal;
    //         }, Promise.resolve(0));

    //         return total + cartEntryTotal;
    //     }, Promise.resolve(0));

    //     return total.toFixed(2);
    // };



    if (loading) return <LoadingState />;
    if (!localStorage.getItem('token')) {
        return <LoginRequired onShopClick={() => router.push('/pages/coffee-shop')} />;
    }

    const allCartItems = cart.flatMap(entry => entry.cartItems);
    const hasItems = allCartItems.length > 0;

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <div className="container mx-auto p-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/pages/coffee-shop')}
                        className="gap-2"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Continue Shopping
                    </Button>
                    <h1 className="text-3xl font-bold">Your Cart</h1>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={fetchCart}
                        disabled={isUpdating}
                    >
                        <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
                    </Button>
                </div>

                {!hasItems ? (
                    <EmptyCart onShopClick={() => router.push('/pages/coffee-shop')} />
                ) : (
                    <div className="grid gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <ScrollArea className="h-[calc(100vh-300px)]">
                                <div className="space-y-4 pr-4">
                                    {allCartItems.map((item) => (
                                        <CartItem
                                            key={item.id}
                                            item={item}
                                            onEdit={handleUpdateItem}
                                            onDelete={handleDeleteItem}
                                            itemOptions={itemOptions.filter(opt => opt.itemId === item.item.id)}
                                            onPriceUpdate={handleItemPriceUpdate}
                                        />
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>

                        <div>
                            <Card className="sticky top-4">
                                <CardHeader>
                                    <CardTitle>Order Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span>${orderTotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Tax</span>
                                            <span>${(orderTotal * 0.1).toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between text-lg font-semibold">
                                        <span>Total</span>
                                        <span>${(orderTotal * 1.1).toFixed(2)}</span>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" size="lg"
                                        onClick={() => router.push('/pages/checkout')
                                        }>
                                        Proceed to Checkout
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartPage;

