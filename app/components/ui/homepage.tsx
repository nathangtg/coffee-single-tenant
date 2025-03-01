'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Coffee, Users, Clock, Award, ChefHat, Leaf, PackageCheck, ThumbsUp, Heart, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeInUp = {
    initial: { y: 40, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.5, ease: "easeOut" }
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.15
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
        <div className="min-h-screen bg-white">
            {/* Hero Section with Animation */}
            <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="relative h-[80vh] w-full"
            >
                <div className="absolute inset-0">
                    <Image
                        src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb"
                        alt="Project 1.0 Coffee Shop Interior"
                        fill
                        className="object-cover brightness-[0.4]"
                        priority
                    />
                </div>
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="relative flex h-full items-center justify-center px-4"
                >
                    <div className="text-center text-white">
                        <motion.h1
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            className="mb-6 font-serif text-6xl font-bold tracking-tight"
                        >
                            Project 1.0
                        </motion.h1>
                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.7, duration: 0.5 }}
                            className="mb-10 max-w-md mx-auto text-xl font-light"
                        >
                            Artisanal coffee crafted with precision and passion
                        </motion.p>
                        <motion.div
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="flex justify-center gap-4"
                        >
                            <Link
                                href="/pages/coffee-shop"
                                className="rounded-md bg-amber-700 px-8 py-3 text-lg font-medium text-white hover:bg-amber-600 transition-all duration-200 shadow-lg"
                            >
                                Explore Menu
                            </Link>
                            <Link
                                href="#about"
                                className="rounded-md border-2 border-white px-8 py-3 text-lg font-medium text-white hover:bg-white/10 transition-all duration-200"
                            >
                                About Us
                            </Link>
                        </motion.div>
                    </div>
                </motion.div>
            </motion.section>

            {/* About Us Section */}
            <motion.section
                id="about"
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerContainer}
                className="py-24 bg-stone-50"
            >
                <div className="container mx-auto px-4">
                    <motion.h2
                        variants={fadeInUp}
                        className="mb-16 text-center font-serif text-4xl font-bold text-stone-800"
                    >
                        Our Story
                    </motion.h2>

                    <div className="grid gap-16 md:grid-cols-2">
                        <motion.div
                            variants={fadeInUp}
                            className="flex flex-col justify-center"
                        >
                            <h3 className="mb-6 font-serif text-3xl font-semibold text-stone-800">Welcome to Project 1.0</h3>
                            <p className="mb-6 text-lg text-stone-600 leading-relaxed">
                                At Project 1.0, we believe in creating more than just a coffee shop – we are crafting experiences that awaken your senses and build community.
                            </p>
                            <p className="text-lg text-stone-600 leading-relaxed">
                                Every cup we serve is a result of careful selection, precise roasting, and expert preparation. We source our beans from sustainable farms worldwide, ensuring both extraordinary quality and ethical practices.
                            </p>

                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="mt-8"
                            >
                                <Link
                                    href="/pages/our-story"
                                    className="inline-flex items-center text-amber-700 font-medium hover:text-amber-600 transition-colors"
                                >
                                    Learn more about our journey
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </motion.div>
                        </motion.div>

                        <div className="grid gap-6 md:grid-cols-2">
                            {[
                                { icon: Coffee, title: "Premium Coffee", desc: "Expertly roasted single-origin beans" },
                                { icon: ChefHat, title: "Artisanal Food", desc: "House-made delicacies daily" },
                                { icon: Users, title: "Community Space", desc: "A welcoming environment for all" },
                                { icon: Leaf, title: "Sustainability", desc: "Eco-friendly practices & sourcing" }
                            ].map((item, index) => (
                                <motion.div
                                    key={index}
                                    variants={{
                                        initial: { scale: 0.9, opacity: 0 },
                                        animate: { scale: 1, opacity: 1 }
                                    }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                                    className="rounded-lg bg-white p-8 border border-stone-100 transition-all duration-300"
                                >
                                    <div className="rounded-full bg-amber-100 p-3 w-fit mb-4">
                                        <item.icon className="h-6 w-6 text-amber-700" />
                                    </div>
                                    <h3 className="mb-3 text-xl font-semibold text-stone-800">{item.title}</h3>
                                    <p className="text-stone-600">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Menu Highlights Section */}
            <motion.section
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerContainer}
                className="py-24"
            >
                <div className="container mx-auto px-4">
                    <motion.div
                        variants={fadeInUp}
                        className="text-center mb-16"
                    >
                        <h2 className="mb-4 font-serif text-4xl font-bold text-stone-800">Menu Highlights</h2>
                        <p className="mx-auto max-w-2xl text-lg text-stone-600">
                            Discover our carefully crafted selection of specialty coffee and delicious food items
                        </p>
                    </motion.div>

                    {loading ? (
                        <div className="flex justify-center py-16">
                            <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-200 border-t-amber-700" />
                        </div>
                    ) : (
                        <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {items.map((item) => (
                                <motion.div
                                    key={item.id}
                                    variants={fadeInUp}
                                    whileHover={{ y: -8 }}
                                    className="group overflow-hidden rounded-xl bg-white border border-stone-200 shadow-sm transition-all hover:shadow-lg"
                                >
                                    <Link href={`/pages/coffee-shop/items/${item.id}`}>
                                        <div className="relative h-56 w-full overflow-hidden">
                                            <Image
                                                src={item.imageUrl}
                                                alt={item.name}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-medium text-white text-lg">{item.name}</h3>
                                                    <span className="rounded-full bg-amber-700 px-3 py-1 text-sm font-bold text-white">
                                                        ${item.price}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <p className="mb-4 text-stone-600">{item.description}</p>
                                            <div className="space-y-2">
                                                {item.options.map((option) => (
                                                    <div key={option.id} className="flex items-center justify-between text-sm border-b border-stone-100 pb-2">
                                                        <span className="text-stone-700">{option.name}</span>
                                                        <span className="text-amber-700 font-medium">+${option.priceModifier}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-6 flex justify-end">
                                                <span className="inline-flex items-center text-amber-700 font-medium text-sm">
                                                    View details
                                                    <ArrowRight className="ml-1 h-4 w-4" />
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    <motion.div
                        variants={fadeInUp}
                        className="mt-12 text-center"
                    >
                        <Link
                            href="/pages/coffee-shop"
                            className="inline-flex items-center justify-center rounded-md bg-amber-700 px-6 py-3 font-medium text-white hover:bg-amber-600 transition-all duration-200 shadow-md"
                        >
                            View Full Menu
                        </Link>
                    </motion.div>
                </div>
            </motion.section>

            {/* Services Section */}
            <motion.section
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerContainer}
                className="py-24 bg-stone-50"
            >
                <div className="container mx-auto px-4">
                    <motion.h2
                        variants={fadeInUp}
                        className="mb-16 text-center font-serif text-4xl font-bold text-stone-800"
                    >
                        What We Offer
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
                                    initial: { y: 40, opacity: 0 },
                                    animate: { y: 0, opacity: 1 }
                                }}
                                transition={{ delay: index * 0.15 }}
                                className="rounded-xl bg-white p-8 shadow-md border border-stone-100 hover:border-amber-200 transition-all duration-300"
                            >
                                <div className="mb-6 rounded-full bg-amber-100 p-4 w-fit">
                                    <service.icon className="h-8 w-8 text-amber-700" />
                                </div>
                                <h3 className="mb-6 text-2xl font-semibold text-stone-800">{service.title}</h3>
                                <ul className="space-y-3">
                                    {service.items.map((item, i) => (
                                        <li key={i} className="flex items-center text-stone-600">
                                            <span className="mr-2 text-amber-700">•</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* Why Choose Us Section */}
            <section className="py-24 bg-amber-900 text-white">
                <div className="container mx-auto px-4">
                    <h2 className="mb-16 text-center font-serif text-4xl font-bold">Why Choose Us</h2>

                    <div className="grid gap-8 md:grid-cols-4">
                        {[
                            {
                                icon: Award,
                                title: "Quality First",
                                desc: "Premium ingredients and expert preparation"
                            },
                            {
                                icon: Clock,
                                title: "Prompt Service",
                                desc: "Quick service without compromising quality"
                            },
                            {
                                icon: Heart,
                                title: "Made with Passion",
                                desc: "Love and care in every cup we serve"
                            },
                            {
                                icon: ThumbsUp,
                                title: "Customer Focus",
                                desc: "Your satisfaction is our top priority"
                            }
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                                className="text-center px-4"
                            >
                                <div className="mx-auto mb-6 rounded-full bg-amber-800/50 p-4 w-fit">
                                    <item.icon className="h-8 w-8" />
                                </div>
                                <h3 className="mb-3 text-xl font-semibold">{item.title}</h3>
                                <p className="text-amber-100">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Newsletter Section */}
            <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="py-24 bg-white"
            >
                <div className="container mx-auto px-4 max-w-4xl text-center">
                    <h2 className="mb-6 font-serif text-4xl font-bold text-stone-800">Join Our Community</h2>
                    <p className="mx-auto mb-8 text-lg text-stone-600">
                        Subscribe to our newsletter for updates on new menu items, special offers, and upcoming events. Be part of our growing coffee community!
                    </p>

                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="mx-auto flex max-w-md flex-col gap-4 sm:flex-row"
                    >
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 rounded-md border border-stone-300 px-4 py-3 focus:border-amber-700 focus:outline-none shadow-sm"
                        />
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="rounded-md bg-amber-700 px-6 py-3 font-medium text-white hover:bg-amber-600 transition-all duration-200 shadow-md"
                        >
                            Subscribe
                        </motion.button>
                    </motion.div>

                    <p className="mt-4 text-sm text-stone-500">
                        By subscribing, you agree to receive marketing emails from Project 1.0
                    </p>
                </div>
            </motion.section>

            {/* Footer */}
            <footer className="bg-stone-900 py-12 text-stone-400">
                <div className="container mx-auto px-4">
                    <div className="grid gap-8 md:grid-cols-4">
                        <div>
                            <h3 className="mb-4 text-lg font-bold text-white">Project 1.0</h3>
                            <p className="mb-4">Artisan coffee, expertly crafted</p>
                            <div className="flex space-x-4">
                                <a href="#" className="hover:text-white transition-colors">Instagram</a>
                                <a href="#" className="hover:text-white transition-colors">Facebook</a>
                                <a href="#" className="hover:text-white transition-colors">Twitter</a>
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-4 text-lg font-bold text-white">Visit Us</h3>
                            <p>123 Coffee Street</p>
                            <p>Beantown, CA 12345</p>
                            <p>Mon-Fri: 7am-7pm</p>
                            <p>Sat-Sun: 8am-6pm</p>
                        </div>

                        <div>
                            <h3 className="mb-4 text-lg font-bold text-white">Quick Links</h3>
                            <ul className="space-y-2">
                                <li><Link href="/pages/coffee-shop" className="hover:text-white transition-colors">Menu</Link></li>
                                <li><Link href="/pages/our-story" className="hover:text-white transition-colors">Our Story</Link></li>
                                <li><Link href="/pages/events" className="hover:text-white transition-colors">Events</Link></li>
                                <li><Link href="/pages/contact" className="hover:text-white transition-colors">Contact</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="mb-4 text-lg font-bold text-white">Contact</h3>
                            <p>info@project1coffee.com</p>
                            <p>(555) 123-4567</p>
                            <Link
                                href="/pages/contact"
                                className="mt-4 inline-block text-amber-500 hover:text-amber-400 transition-colors"
                            >
                                Send us a message
                            </Link>
                        </div>
                    </div>

                    <div className="mt-12 border-t border-stone-800 pt-6 text-center">
                        <p>© 2025 Project 1.0 Coffee Shop. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;