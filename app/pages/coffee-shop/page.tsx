/* eslint-disable @typescript-eslint/no-unused-vars */

'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ShoppingCart, Clock, Plus, Minus, ChevronLeft } from "lucide-react";
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { ScrollArea } from '@/app/components/ui/scroll-area';


const CoffeeShop = () => {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [items, setItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState([]);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [itemNotes, setItemNotes] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    useEffect(() => {
        fetchCategories();
        fetchCart();
    }, []);
    const fetchCart = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast({
                    title: "Login Required",
                    description: "Do login to enjoy more customer benefits.",
                    variant: "destructive", // Or "default" if you prefer a normal toast
                });
                return;
            }

            const response = await fetch('/api/cart', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch cart: ${response.statusText}`);
            }

            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                const latestCart = data[data.length - 1];
                setCart(latestCart?.cartItems || []);
            } else {
                setCart([]); // Reset cart if empty
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
        }
    };



    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/category');
            const data = await response.json();
            setCategories(data);
            if (data.length > 0) {
                setSelectedCategory(data[0].id);
                fetchCategoryItems(data[0].id);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategoryItems = async (categoryId) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/category/${categoryId}`);
            const data = await response.json();
            setItems(data.items);
        } catch (error) {
            console.error('Error fetching items:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchItemDetails = async (itemId) => {
        try {
            const response = await fetch(`/api/item/${itemId}`);
            const data = await response.json();
            setSelectedItem(data);
            setSelectedOptions({});
            setItemNotes("");
            setQuantity(1);
        } catch (error) {
            console.error('Error fetching item details:', error);
        }
    };

    const handleAddToCart = async () => {
        setIsAddingToCart(true);
        try {
            const selectedOptionsList = Object.entries(selectedOptions)
                .filter(([_, selected]) => selected)
                .map(([optionId]) => ({ optionId }));

            const cartItem = {
                items: [{
                    itemId: selectedItem.id,
                    quantity: quantity,
                    notes: itemNotes,
                    options: selectedOptionsList
                }]
            };

            // If No bearer token found in localStorage, then Redirect to login page
            if (!localStorage.getItem('token')) {
                window.location.href = '/login';
                return;
            }

            const response = await fetch('/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,

                },
                body: JSON.stringify(cartItem),
            });

            if (!response.ok) {
                throw new Error('Failed to add item to cart');
            }

            await fetchCart();
            setSelectedItem(null);
            toast({
                title: "Success",
                description: "Item added to cart successfully",
            });
        } catch (error) {
            console.error('Error adding to cart:', error);
            toast({
                title: "Error",
                description: "Failed to add item to cart",
                variant: "destructive",
            });
        } finally {
            setIsAddingToCart(false);
        }
    };

    const toggleOption = (optionId) => {
        setSelectedOptions(prev => ({
            ...prev,
            [optionId]: !prev[optionId]
        }));
    };

    const calculateItemTotal = () => {
        const basePrice = selectedItem.price * quantity;
        const optionsTotal = Object.entries(selectedOptions)
            .filter(([_, selected]) => selected)
            .reduce((sum, [optionId]) => {
                const option = selectedItem.options.find(opt => opt.id === optionId);
                return sum + (option ? option.priceModifier : 0);
            }, 0) * quantity;
        return (basePrice + optionsTotal).toFixed(2);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">Loading menu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <div className="container mx-auto p-4 space-y-6">
                <header className="flex justify-between items-center py-6 border-b">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            Coffee Shop
                        </h1>
                        <p className="text-muted-foreground mt-1">Start your day with our perfect brew</p>
                    </div>
                    <Button variant="outline" size="lg" className="gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        <span className="font-semibold">{cart.length}</span>
                    </Button>
                </header>

                <Tabs
                    value={selectedCategory}
                    onValueChange={(value) => {
                        setSelectedCategory(value);
                        fetchCategoryItems(value);
                    }}
                    className="space-y-6"
                >
                    <ScrollArea className="w-full">
                        <TabsList className="mb-4 w-full justify-start">
                            {categories.map(category => (
                                <TabsTrigger
                                    key={category.id}
                                    value={category.id}
                                    className="px-6"
                                >
                                    {category.name}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </ScrollArea>

                    <TabsContent value={selectedCategory}>
                        {selectedItem ? (
                            <div className="max-w-2xl mx-auto">
                                <Button
                                    variant="ghost"
                                    onClick={() => setSelectedItem(null)}
                                    className="mb-4"
                                >
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    Back to menu
                                </Button>

                                <Card className="overflow-hidden">
                                    <div className="relative h-72">
                                        <img
                                            src={selectedItem.imageUrl}
                                            alt={selectedItem.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent p-6">
                                            <Badge className="mb-2">${selectedItem.price.toFixed(2)}</Badge>
                                            <h2 className="text-2xl font-bold">{selectedItem.name}</h2>
                                        </div>
                                    </div>

                                    <CardContent className="space-y-6 p-6">
                                        <div className="flex items-center gap-4 text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            <span>{selectedItem.preparationTime} mins preparation time</span>
                                        </div>

                                        <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                                            <p className="font-medium">Description</p>
                                            <p className="text-muted-foreground">{selectedItem.description}</p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">Quantity</span>
                                                <div className="flex items-center gap-3 bg-muted/30 rounded-full p-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <span className="w-8 text-center font-medium">{quantity}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setQuantity(q => q + 1)}
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {selectedItem.options.length > 0 && (
                                                <div className="space-y-3">
                                                    <h3 className="font-medium">Customize your drink</h3>
                                                    <div className="grid gap-2">
                                                        {selectedItem.options.map(option => (
                                                            <Button
                                                                key={option.id}
                                                                variant={selectedOptions[option.id] ? "default" : "outline"}
                                                                className="w-full justify-between h-auto py-4"
                                                                onClick={() => toggleOption(option.id)}
                                                            >
                                                                <span>{option.name}</span>
                                                                <span className="text-sm">
                                                                    +${option.priceModifier.toFixed(2)}
                                                                </span>
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <h3 className="font-medium">Special Instructions</h3>
                                                <Textarea
                                                    placeholder="Any special requests? Let us know..."
                                                    value={itemNotes}
                                                    onChange={(e) => setItemNotes(e.target.value)}
                                                    className="resize-none"
                                                    rows={3}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>

                                    <CardFooter className="border-t p-6">
                                        <div className="w-full flex items-center justify-between">
                                            <div className="text-lg">
                                                Total: <span className="font-bold">${calculateItemTotal()}</span>
                                            </div>
                                            <Button
                                                size="lg"
                                                onClick={handleAddToCart}
                                                disabled={isAddingToCart || !selectedItem.isAvailable}
                                                className="min-w-[140px]"
                                            >
                                                {isAddingToCart ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                        Adding...
                                                    </>
                                                ) : (
                                                    'Add to Cart'
                                                )}
                                            </Button>
                                        </div>
                                    </CardFooter>
                                </Card>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {items.map(item => (
                                    <Card
                                        key={item.id}
                                        className={`group cursor-pointer transition-all duration-300 hover:shadow-lg ${item.isAvailable && 'opacity-60'}`}
                                        onClick={() => fetchItemDetails(item.id)}
                                    >
                                        <div className="relative h-48 overflow-hidden">
                                            <img
                                                src={item.imageUrl}
                                                alt={item.name}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                            />
                                            {item.isAvailable && (
                                                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                                                    <Badge variant="destructive" className="text-lg py-2">
                                                        Currently Unavailable
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>

                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <CardTitle className="text-xl">{item.name}</CardTitle>
                                                    <CardDescription className="mt-2 line-clamp-2">
                                                        {item.description}
                                                    </CardDescription>
                                                </div>
                                                <Badge variant="secondary" className="text-lg">
                                                    ${item.price.toFixed(2)}
                                                </Badge>
                                            </div>
                                        </CardHeader>

                                        <CardFooter className="text-muted-foreground text-sm">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4" />
                                                <span>{item.preparationTime} mins</span>
                                            </div>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default CoffeeShop;