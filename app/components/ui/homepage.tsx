'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Coffee, Users, Clock, Award, ChefHat, Leaf, PackageCheck, ThumbsUp, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeInUp = {
    initial: { y: 60, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.2
        }
    }
};

const HomePage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await fetch('/api/item');
                const data = await response.json();
                setItems(data);
            } catch (error) {
                console.error('Error fetching items:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, []);

    return (
        <div className="min-h-screen">
            {/* Hero Section with Animation */}
            <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                className="relative h-[70vh] w-full"
            >
                <div className="absolute inset-0">
                    <Image
                        src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb"
                        alt="Coffee Shop Interior"
                        fill
                        className="object-cover brightness-50"
                        priority
                    />
                </div>
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="relative flex h-full items-center justify-center"
                >
                    <div className="text-center text-white">
                        <motion.h1
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.8, duration: 0.5 }}
                            className="mb-4 font-mono text-5xl font-bold"
                        >
                            Project 1.0
                        </motion.h1>
                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 1, duration: 0.5 }}
                            className="mb-8 text-xl"
                        >
                            Specialty Coffee & More
                        </motion.p>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Link
                                href="/pages/coffee-shop"
                                className="rounded-md bg-white px-8 py-3 text-lg font-medium text-gray-900 hover:bg-gray-100"
                            >
                                View Menu
                            </Link>
                        </motion.div>
                    </div>
                </motion.div>
            </motion.section>

            {/* About Us Section */}
            <motion.section
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="py-16"
            >
                <div className="container mx-auto px-4">
                    <div className="grid gap-12 md:grid-cols-2">
                        <motion.div
                            variants={fadeInUp}
                            className="flex flex-col justify-center"
                        >
                            <h2 className="mb-6 font-mono text-3xl font-bold">Welcome to Project 1.0</h2>
                            <p className="mb-4 text-gray-600">
                                At Project 1.0, we believe in creating more than just a coffee shop – we&#39;re crafting experiences.
                            </p>
                            <p className="text-gray-600">
                                Every cup we serve is a result of careful selection, precise roasting, and expert preparation. We source our beans from sustainable farms worldwide, ensuring both quality and ethical practices.
                            </p>
                        </motion.div>
                        <div className="grid gap-4 md:grid-cols-2">
                            {[
                                { icon: Coffee, title: "Premium Coffee", desc: "Expertly roasted and crafted beans" },
                                { icon: Users, title: "Community", desc: "A welcoming space for everyone" },
                                { icon: ChefHat, title: "Fresh Food", desc: "Delicious house-made treats" },
                                { icon: Leaf, title: "Sustainable", desc: "Eco-friendly practices" }
                            ].map((item, index) => (
                                <motion.div
                                    key={index}
                                    variants={{
                                        initial: { scale: 0.8, opacity: 0 },
                                        animate: { scale: 1, opacity: 1 }
                                    }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ scale: 1.05 }}
                                    className="rounded-lg bg-gray-50 p-6 transition-shadow hover:shadow-md"
                                >
                                    <item.icon className="mb-4 h-8 w-8 text-gray-700" />
                                    <h3 className="mb-2 font-medium">{item.title}</h3>
                                    <p className="text-sm text-gray-600">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Services Section */}
            <motion.section
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="bg-gray-50 py-16"
            >
                <div className="container mx-auto px-4">
                    <motion.h2
                        variants={fadeInUp}
                        className="mb-12 text-center font-mono text-3xl font-bold"
                    >
                        Our Services
                    </motion.h2>
                    <div className="grid gap-8 md:grid-cols-3">
                        {[
                            {
                                icon: Coffee,
                                title: "Specialty Coffee Bar",
                                items: ["Espresso-based drinks", "Pour-over coffee", "Cold brew variations", "Seasonal specialties"]
                            },
                            {
                                icon: PackageCheck,
                                title: "Retail & Equipment",
                                items: ["Fresh roasted beans", "Brewing equipment", "Coffee accessories", "Gift sets"]
                            },
                            {
                                icon: Users,
                                title: "Events & Classes",
                                items: ["Brewing workshops", "Tasting sessions", "Private events", "Corporate catering"]
                            }
                        ].map((service, index) => (
                            <motion.div
                                key={index}
                                variants={{
                                    initial: { y: 50, opacity: 0 },
                                    animate: { y: 0, opacity: 1 }
                                }}
                                transition={{ delay: index * 0.2 }}
                                whileHover={{ y: -10 }}
                                className="rounded-lg bg-white p-6 shadow-sm"
                            >
                                <service.icon className="mb-4 h-12 w-12 text-gray-700" />
                                <h3 className="mb-4 text-xl font-medium">{service.title}</h3>
                                <ul className="space-y-2 text-gray-600">
                                    {service.items.map((item, i) => (
                                        <li key={i}>• {item}</li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>


            {/* Featured Items Section */}
            <motion.section
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="py-16"
            >                <div className="container mx-auto px-4">
                    <h2 className="mb-12 text-center font-mono text-3xl font-bold">Featured Items</h2>

                    {loading ? (
                        <div className="flex justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
                        </div>
                    ) : (
                        <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={
                                        // Redirect to item page
                                        () => window.location.href = `/pages/coffee-shop`
                                    }
                                    className="group overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:shadow-md"
                                >
                                    <div className="relative h-48 w-full">
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.name}
                                            fill
                                            className="object-cover transition-transform group-hover:scale-105"
                                        />
                                    </div>
                                    <div className="p-4">
                                        <div className="mb-2 flex items-center justify-between">
                                            <h3 className="font-medium">{item.name}</h3>
                                            <span className="text-lg font-bold">${item.price}</span>
                                        </div>
                                        <p className="mb-4 text-sm text-gray-600">{item.description}</p>
                                        <div className="space-y-2">
                                            {item.options.map((option) => (
                                                <div key={option.id} className="flex items-center justify-between text-sm">
                                                    <span>{option.name}</span>
                                                    <span>+${option.priceModifier}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.section>

            {/* Why Choose Us Section */}
            <section className="bg-gray-900 py-16 text-white">
                <div className="container mx-auto px-4">
                    <h2 className="mb-12 text-center font-mono text-3xl font-bold">Why Choose Us</h2>
                    <div className="grid gap-8 md:grid-cols-4">
                        <div className="text-center">
                            <Award className="mx-auto mb-4 h-12 w-12" />
                            <h3 className="mb-2 font-medium">Quality First</h3>
                            <p className="text-sm text-gray-300">Premium ingredients and expert preparation</p>
                        </div>
                        <div className="text-center">
                            <Clock className="mx-auto mb-4 h-12 w-12" />
                            <h3 className="mb-2 font-medium">Fast Service</h3>
                            <p className="text-sm text-gray-300">Quick service without compromising quality</p>
                        </div>
                        <div className="text-center">
                            <Heart className="mx-auto mb-4 h-12 w-12" />
                            <h3 className="mb-2 font-medium">Made with Love</h3>
                            <p className="text-sm text-gray-300">Passion in every cup we serve</p>
                        </div>
                        <div className="text-center">
                            <ThumbsUp className="mx-auto mb-4 h-12 w-12" />
                            <h3 className="mb-2 font-medium">Customer First</h3>
                            <p className="text-sm text-gray-300">Your satisfaction is our priority</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action Section */}
            <motion.section
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-gray-50 py-16"
            >
                <div className="container mx-auto px-4 text-center">
                    <h2 className="mb-6 font-mono text-3xl font-bold">Join Our Community</h2>
                    <p className="mx-auto mb-8 max-w-2xl text-gray-600">
                        Subscribe to our newsletter for updates on new menu items, special offers, and upcoming events. Be part of our growing coffee community!
                    </p>
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="mx-auto flex max-w-md flex-col gap-4 sm:flex-row"
                    >
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 rounded-md border px-4 py-2 focus:border-gray-900 focus:outline-none"
                        />
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="rounded-md bg-gray-900 px-6 py-2 font-medium text-white hover:bg-gray-800"
                        >
                            Subscribe
                        </motion.button>
                    </motion.div>
                </div>
            </motion.section>
        </div>
    );
};

export default HomePage;