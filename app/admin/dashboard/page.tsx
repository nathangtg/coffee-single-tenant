'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import CategoriesTable from "../components/categories-table"
import ItemsTable from "../components/items-table"
import ItemOptionsTable from "../components/item-options-table"
import { LayoutDashboard } from "lucide-react"
import CartManagementTable from "../components/CartTable"

export default function AdminPage() {
    return (
        <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-2 mb-6">
                <LayoutDashboard className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>

            <Card>
                <CardContent className="p-6">
                    <Tabs defaultValue="categories" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-6">
                            <TabsTrigger value="categories" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                Categories
                            </TabsTrigger>
                            <TabsTrigger value="items" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                Items
                            </TabsTrigger>
                            <TabsTrigger value="options" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                Item Options
                            </TabsTrigger>
                            <TabsTrigger value="cart" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                Cart Management
                            </TabsTrigger>
                        </TabsList>

                        <div className="mt-4">
                            <TabsContent value="categories">
                                <CategoriesTable />
                            </TabsContent>
                            <TabsContent value="items">
                                <ItemsTable />
                            </TabsContent>
                            <TabsContent value="options">
                                <ItemOptionsTable />
                            </TabsContent>
                            <TabsContent value="cart">
                                <CartManagementTable />
                            </TabsContent>
                        </div>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}