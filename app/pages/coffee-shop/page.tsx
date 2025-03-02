'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ShoppingCart, Clock, Plus, Minus, ChevronLeft, Coffee } from "lucide-react";
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Separator } from '@radix-ui/react-select';
import Image from 'next/image';

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
                    description: "Please log in to access your cart and enjoy member benefits.",
                    variant: "destructive",
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

            // Handle both array and object cases
            let latestCart;
            if (Array.isArray(data)) {
                latestCart = data.length > 0 ? data[data.length - 1] : null;
            } else {
                latestCart = data; // Treat it as an object response
            }

            setCart(latestCart?.cartItems || []);
        } catch (error) {
            console.error('Error fetching cart:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/category');
            const data = await response.json();
            const activeCategories = data.filter(category => category.isActive);

            setCategories(activeCategories);

            if (activeCategories.length > 0) {
                setSelectedCategory(activeCategories[0].id);
                fetchCategoryItems(activeCategories[0].id);
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
                title: "Added to Cart",
                description: "Your item has been added successfully",
                duration: 3000,
            });
        } catch (error) {
            console.error('Error adding to cart:', error);
            toast({
                title: "Something went wrong",
                description: "Unable to add item to your cart. Please try again.",
                variant: "destructive",
                duration: 3000,
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
            <div className="flex items-center justify-center min-h-screen bg-neutral-50">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-amber-700" />
                    <p className="text-amber-800 font-medium">Brewing our menu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            <div className="container mx-auto px-4 md:px-6 py-4 max-w-6xl">
                {/* Header */}
                <header className="flex justify-between items-center py-4 md:py-6 mb-6">
                    <div className="flex items-center space-x-3">
                        <Coffee className="h-8 w-8 text-amber-700" />
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-amber-900">Project 1.0</h1>
                            <p className="text-sm text-amber-800 hidden md:block">Artisan coffee, expertly crafted</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        className="gap-2 bg-white hover:bg-amber-50 text-amber-900 border-amber-200 hover:border-amber-300"
                        onClick={() => window.location.href = '/pages/cart'}
                        aria-label="View cart"
                    >
                        <ShoppingCart className="h-5 w-5" />
                        <span className="font-semibold">{cart.length}</span>
                    </Button>
                </header>

                <Separator className="mb-6 bg-amber-200" />

                {/* Main content */}
                <main>
                    <Tabs
                        value={selectedCategory}
                        onValueChange={(value) => {
                            setSelectedCategory(value);
                            fetchCategoryItems(value);
                        }}
                        className="space-y-6"
                    >
                        <ScrollArea className="w-full pb-2">
                            <TabsList className="bg-amber-100/50 p-1 mb-6 w-full justify-start overflow-x-auto">
                                {categories.map(category => (
                                    <TabsTrigger
                                        key={category.id}
                                        value={category.id}
                                        className="px-4 py-2 data-[state=active]:bg-amber-700 data-[state=active]:text-white rounded-md"
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
                                        className="mb-4 text-amber-800 hover:text-amber-900 hover:bg-amber-100"
                                        aria-label="Back to menu"
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-2" />
                                        Back to menu
                                    </Button>

                                    <Card className="overflow-hidden border-amber-200 shadow-md">
                                        <div className="relative h-64 md:h-80">
                                            <Image
                                                src={selectedItem.imageUrl || 'https://placehold.co/600x400/e9d8c2/5f4339?text=Project+1.0'}
                                                alt={selectedItem.name}
                                                layout="fill"
                                                objectFit="cover"
                                                className="w-full h-full"
                                            />
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                                                <Badge className="mb-2 bg-amber-700 hover:bg-amber-600">
                                                    ${selectedItem.price.toFixed(2)}
                                                </Badge>
                                                <h2 className="text-2xl font-bold text-white">{selectedItem.name}</h2>
                                            </div>
                                        </div>

                                        <CardContent className="space-y-6 p-6">
                                            <div className="flex items-center gap-4 text-amber-800">
                                                <Clock className="h-4 w-4" />
                                                <span>{selectedItem.preparationTime} mins preparation time</span>
                                            </div>

                                            <div className="bg-amber-50 p-4 rounded-lg space-y-2">
                                                <p className="font-medium text-amber-900">Description</p>
                                                <p className="text-amber-800">{selectedItem.description}</p>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-amber-900">Quantity</span>
                                                    <div className="flex items-center gap-3 bg-amber-50 rounded-full p-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                                            className="text-amber-800 hover:text-amber-900 hover:bg-amber-100"
                                                            aria-label="Decrease quantity"
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </Button>
                                                        <span className="w-8 text-center font-medium">{quantity}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setQuantity(q => q + 1)}
                                                            className="text-amber-800 hover:text-amber-900 hover:bg-amber-100"
                                                            aria-label="Increase quantity"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {selectedItem.options && selectedItem.options.length > 0 && (
                                                    <div className="space-y-3">
                                                        <h3 className="font-medium text-amber-900">Customize your drink</h3>
                                                        <div className="grid gap-2">
                                                            {selectedItem.options.map(option => (
                                                                <Button
                                                                    key={option.id}
                                                                    variant={selectedOptions[option.id] ? "default" : "outline"}
                                                                    className={`w-full justify-between h-auto py-3 ${selectedOptions[option.id]
                                                                        ? "bg-amber-700 hover:bg-amber-600 text-white"
                                                                        : "border-amber-200 hover:border-amber-300 bg-white hover:bg-amber-50 text-amber-900"
                                                                        }`}
                                                                    onClick={() => toggleOption(option.id)}
                                                                >
                                                                    <span>{option.name}</span>
                                                                    <span className={`text-sm ${selectedOptions[option.id] ? "text-amber-100" : "text-amber-700"}`}>
                                                                        +${option.priceModifier.toFixed(2)}
                                                                    </span>
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="space-y-2">
                                                    <h3 className="font-medium text-amber-900">Special Instructions</h3>
                                                    <Textarea
                                                        placeholder="Any special requests? Let us know..."
                                                        value={itemNotes}
                                                        onChange={(e) => setItemNotes(e.target.value)}
                                                        className="resize-none border-amber-200 focus:border-amber-300 focus-visible:ring-amber-400"
                                                        rows={3}
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>

                                        <CardFooter className="border-t border-amber-200 p-6">
                                            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4">
                                                <div className="text-lg text-amber-900">
                                                    Total: <span className="font-bold">${calculateItemTotal()}</span>
                                                </div>
                                                <Button
                                                    size="lg"
                                                    onClick={handleAddToCart}
                                                    disabled={isAddingToCart || !selectedItem.isAvailable}
                                                    className="w-full sm:w-auto min-w-[140px] bg-amber-700 hover:bg-amber-600 text-white"
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {items.length === 0 ? (
                                        <div className="col-span-full text-center py-12 text-amber-800">
                                            <p>No items available in this category at the moment.</p>
                                        </div>
                                    ) : (
                                        items.map(item => (
                                            <Card
                                                key={item.id}
                                                className={`group transition-all duration-300 hover:shadow-lg border-amber-200 ${item.isAvailable ? 'opacity-60' : ''}`}
                                                onClick={() => fetchItemDetails(item.id)}
                                            >
                                                <div className="relative h-48 overflow-hidden">
                                                    <Image
                                                        src={item.imageUrl || 'https://placehold.co/600x400/e9d8c2/5f4339?text=Project+1.0'}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                        width={600}
                                                        height={400}
                                                        layout="responsive"
                                                    />
                                                    {item.isAvailable && (
                                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                            <Badge variant="destructive" className="text-base py-2">
                                                                Currently Unavailable
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>

                                                <CardHeader>
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <CardTitle className="text-lg text-amber-900">{item.name}</CardTitle>
                                                            <CardDescription className="mt-2 line-clamp-2 text-amber-800">
                                                                {item.description}
                                                            </CardDescription>
                                                        </div>
                                                        <Badge className="text-base bg-amber-100 text-amber-900 hover:bg-amber-200">
                                                            ${item.price.toFixed(2)}
                                                        </Badge>
                                                    </div>
                                                </CardHeader>

                                                <CardFooter className="flex justify-between items-center text-amber-700 text-sm border-t border-amber-100 pt-4">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4" />
                                                        <span>{item.preparationTime} mins</span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-amber-700 hover:text-amber-900 hover:bg-amber-100"
                                                    >
                                                        View Details
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        ))
                                    )}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </main>

                <footer className="mt-16 text-center py-6 text-amber-800 text-sm">
                    <p>© 2025 Project 1.0 Coffee Shop. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
};

export default CoffeeShop;