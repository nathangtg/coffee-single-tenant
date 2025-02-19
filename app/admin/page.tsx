import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Coffee, LayoutDashboard, Settings } from "lucide-react";
import ItemOptionsTable from "./components/item-options-table";
import CategoriesTable from "./components/categories-table";
import ItemsTable from "./components/items-table";

export function AdminPage() {
  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="p-6">
        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="categories" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-900">
              <div className="flex items-center space-x-2">
                <LayoutDashboard className="h-4 w-4" />
                <span>Categories</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="items" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-900">
              <div className="flex items-center space-x-2">
                <Coffee className="h-4 w-4" />
                <span>Items</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="options" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-900">
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Item Options</span>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="mt-6">
            <CategoriesTable />
          </TabsContent>
          <TabsContent value="items" className="mt-6">
            <ItemsTable />
          </TabsContent>
          <TabsContent value="options" className="mt-6">
            <ItemOptionsTable />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}