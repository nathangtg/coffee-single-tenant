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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-amber-50/30 to-amber-100/20">
        <div className="text-center space-y-4 animate-in fade-in duration-500">
            <Coffee className="h-16 w-16 animate-pulse mx-auto text-amber-800" />
            <p className="text-amber-800/70 font-medium">Brewing your cart...</p>
        </div>
    </div>
);

// Login Required Component
const LoginRequired = ({ onShopClick }) => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-amber-100/40 p-4">
        <Card className="max-w-md w-full border-amber-200 shadow-lg">
            <CardHeader className="text-center space-y-6 pb-6">
                <div className="mx-auto bg-amber-100 w-fit p-5 rounded-full shadow-inner">
                    <Coffee className="h-14 w-14 text-amber-800" />
                </div>
                <div>
                    <CardTitle className="text-2xl font-serif mb-3 text-amber-900">Project 1.0 Coffee</CardTitle>
                    <p className="text-amber-700/80">Sign in to view your cart and complete your order</p>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pb-8">
                <Button className="w-full bg-amber-800 hover:bg-amber-900 text-amber-50" size="lg" onClick={() => window.location.href = '/login'}>
                    Sign In
                </Button>
                <Button variant="outline" className="w-full border-amber-300 text-amber-800 hover:bg-amber-50" size="lg" onClick={onShopClick}>
                    Continue Shopping
                </Button>
            </CardContent>
        </Card>
    </div>
);

// Empty Cart Component
const EmptyCart = ({ onShopClick }) => (
    <Card className="text-center p-8 border-amber-200 shadow-md bg-white">
        <CardContent className="space-y-8 py-8">
            <div className="mx-auto bg-amber-100 w-fit p-8 rounded-full shadow-inner">
                <Coffee className="h-20 w-20 text-amber-700" />
            </div>
            <div className="space-y-3">
                <h3 className="text-2xl font-serif text-amber-900">Your cart is empty</h3>
                <p className="text-amber-700/70">Add some delicious items to get started</p>
            </div>
            <Button size="lg" className="bg-amber-800 hover:bg-amber-900 text-amber-50 px-8" onClick={onShopClick}>
                Browse Menu
            </Button>
        </CardContent>
    </Card>
);

// Edit Item Dialog Component
// Edit ItemDialog Component (updated version)
const EditItemDialog = ({ item, itemOptions, onSave, onClose, isUpdating }) => {
    const [quantity, setQuantity] = useState(item.quantity);
    const [notes, setNotes] = useState(item.notes || '');
    const [selectedOptionIds, setSelectedOptionIds] = useState(
        (item.options || []).map(opt => opt.optionId)
    );

    const handleSave = () => {
        onSave(item.id, {
            quantity,
            notes,
            options: selectedOptionIds.map(id => ({ optionId: id }))
        });
        onClose(); // Close dialog after saving
    };

    const toggleOption = (optionId) => {
        setSelectedOptionIds(prev =>
            prev.includes(optionId)
                ? prev.filter(id => id !== optionId)
                : [...prev, optionId]
        );
    };

    return (
        <DialogContent className="sm:max-w-[500px] border-amber-200 bg-amber-50/80 backdrop-blur-sm">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-amber-900 font-serif">
                    <span>Edit Order</span>
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                        {item.item.name}
                    </Badge>
                </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
                <div className="space-y-4">
                    <h4 className="font-medium text-amber-900">Quantity</h4>
                    <div className="flex items-center justify-center bg-white rounded-lg p-3 border border-amber-200">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-amber-100 text-amber-800"
                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        >
                            <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-16 text-center font-medium text-lg text-amber-900">{quantity}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-amber-100 text-amber-800"
                            onClick={() => setQuantity(q => q + 1)}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <h4 className="font-medium text-amber-900">Special Instructions</h4>
                    <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any special requests for this item?"
                        className="resize-none border-amber-200 focus:border-amber-400 bg-white"
                        rows={3}
                    />
                </div>

                {itemOptions.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="font-medium text-amber-900">Available Add-ons</h4>
                        <div className="grid gap-2">
                            {itemOptions.map(option => (
                                <div
                                    key={option.id}
                                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${selectedOptionIds.includes(option.id)
                                        ? 'border-amber-500 bg-amber-50'
                                        : 'border-amber-200 bg-white hover:bg-amber-50'
                                        }`}
                                    onClick={() => toggleOption(option.id)}
                                >
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-4 h-4 rounded-full ${selectedOptionIds.includes(option.id)
                                            ? 'bg-amber-500'
                                            : 'border border-amber-300'
                                            }`} />
                                        <span className="text-amber-800">{option.name}</span>
                                    </div>
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                                        +${option.priceModifier.toFixed(2)}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <CardFooter className="flex justify-end gap-2">
                <Button
                    variant="outline"
                    onClick={() => onClose()}
                    className="border-amber-300 text-amber-800 hover:bg-amber-100"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={isUpdating}
                    className="bg-amber-800 hover:bg-amber-900 text-amber-50"
                >
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
    const [dialogOpen, setDialogOpen] = useState(false);

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
    }, [item.id, item.item.price, item.quantity, item.options]);

    return (
        <Card className="overflow-hidden transition-all hover:shadow-md border-amber-200 bg-white">
            <div className="flex gap-6 p-4">
                <div className="relative w-32 h-32 rounded-lg overflow-hidden shadow-sm border border-amber-100">
                    <img
                        src={item.item.imageUrl}
                        alt={item.item.name}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </div>

                <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-serif text-lg text-amber-900">{item.item.name}</h3>
                            <div className="flex items-center gap-2 text-amber-700/70 text-sm">
                                <span>${item.item.price.toFixed(2)} each</span>
                                <span>×</span>
                                <span>{item.quantity}</span>
                            </div>
                        </div>

                        <div className="flex gap-1">
                            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="hover:bg-amber-100 text-amber-700">
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <EditItemDialog
                                    item={{ ...item, options: selectedOptions }}
                                    itemOptions={itemOptions}
                                    onSave={(itemId, updates) => {
                                        onEdit(itemId, updates);
                                        setDialogOpen(false);
                                    }}
                                    onClose={() => setDialogOpen(false)}
                                    isUpdating={false}
                                />
                            </Dialog>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-red-50 hover:text-red-600 text-amber-700"
                                onClick={() => onDelete(item.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {selectedOptions.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm text-amber-700/70">Selected Options:</p>
                            <div className="flex flex-wrap gap-2">
                                {selectedOptions.map((opt) => (
                                    <Badge key={opt.id} variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                                        {opt.option.name} (+${opt.option.priceModifier.toFixed(2)})
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {item.notes && (
                        <Badge variant="outline" className="text-xs border-amber-200 text-amber-700 bg-amber-50">
                            Note: {item.notes}
                        </Badge>
                    )}

                    <div className="text-sm font-medium text-amber-800">
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
        const total = Object.values(itemTotals)
            .filter((value) => typeof value === 'number')
            .reduce((sum, value) => sum + value, 0);
        setOrderTotal(total);
    }, [itemTotals]);

    const handleItemPriceUpdate = (itemId, total) => {
        setItemTotals(prev => ({
            ...prev,
            [itemId]: total
        }));
    };

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

    if (loading) return <LoadingState />;
    if (!localStorage.getItem('token')) {
        return <LoginRequired onShopClick={() => router.push('/pages/coffee-shop')} />;
    }

    const cartArray = Array.isArray(cart) ? cart : [cart]; // Ensure it's always an array
    const allCartItems = cartArray.flatMap(entry => entry.cartItems);
    const hasItems = allCartItems.length > 0;

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100/30">
            <div className="container mx-auto p-4 py-12">
                <div className="flex items-center justify-between mb-10">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/pages/coffee-shop')}
                        className="gap-2 text-amber-800 hover:bg-amber-100"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Continue Shopping
                    </Button>
                    <h1 className="text-3xl font-serif text-amber-900">Your Cart</h1>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={fetchCart}
                        disabled={isUpdating}
                        className="text-amber-800 hover:bg-amber-100"
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
                            <Card className="sticky top-4 border-amber-200 shadow-md bg-white">
                                <CardHeader className="border-b border-amber-100">
                                    <CardTitle className="font-serif text-amber-900">Order Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-amber-700/70">Subtotal</span>
                                            <span className="text-amber-900">${orderTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <Separator className="bg-amber-200" />
                                    <div className="flex justify-between text-lg font-medium">
                                        <span className="text-amber-900">Total</span>
                                        <span className="text-amber-900">${orderTotal.toFixed(2)}</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-2 pb-6">
                                    <Button
                                        className="w-full bg-amber-800 hover:bg-amber-900 text-amber-50 font-medium py-6"
                                        size="lg"
                                        onClick={() => router.push('/pages/checkout')}
                                    >
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