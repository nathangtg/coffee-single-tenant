import { useState, useEffect, useRef } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Plus, Pencil, Trash2, Upload, X } from "lucide-react"

type Item = {
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
  category: {
    id: string
    name: string
  }
}

type Category = {
  id: string
  name: string
}

type RestaurantSettings = {
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

export default function ItemsTable() {
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [newItem, setNewItem] = useState<Partial<Item>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [restaurantSettings, setRestaurantSettings] = useState<RestaurantSettings | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchItems()
    fetchCategories()
    fetchRestaurantSettings()
  }, [])

  const fetchItems = async () => {
    const response = await fetch("/api/item")
    const data = await response.json()
    setItems(data)
  }

  const fetchCategories = async () => {
    const response = await fetch("/api/category")
    const data = await response.json()
    setCategories(data)
  }

  const fetchRestaurantSettings = async () => {
    const response = await fetch("/api/restaurant-settings")
    const data = await response.json()
    setRestaurantSettings(data)
  }


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const resetImageInput = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleCreate = async () => {
    const formData = new FormData()

    // Add all item data to form
    if (newItem.name) formData.append("name", newItem.name)
    if (newItem.description) formData.append("description", newItem.description)
    if (newItem.price !== undefined) formData.append("price", newItem.price.toString())
    formData.append("isAvailable", (newItem.isAvailable || false).toString())
    if (newItem.preparationTime !== undefined) formData.append("preparationTime", newItem.preparationTime.toString())
    if (newItem.categoryId) formData.append("categoryId", newItem.categoryId)

    // Add image file if exists
    if (imageFile) {
      formData.append("image", imageFile)
    }

    await fetch("/api/item", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: formData,
    })

    setNewItem({})
    resetImageInput()
    setShowAddForm(false)
    fetchItems()
  }

  const handleUpdate = async (id: string) => {
    // For simplicity, keep updates as JSON for now
    // A more complete solution would handle image updates with FormData too
    await fetch(`/api/item/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(items.find((i) => i.id === id)),
    })
    setEditingId(null)
    fetchItems()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/item/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
    })

    fetchItems()
  }

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-2xl font-bold">Items Management</CardTitle>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search items..."
              className="pl-8 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showAddForm && (
          <Card className="mb-6 bg-gray-50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Name"
                  value={newItem.name || ""}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                />
                <Input
                  placeholder="Description"
                  value={newItem.description || ""}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={newItem.price || ""}
                  onChange={(e) => setNewItem({ ...newItem, price: Number.parseFloat(e.target.value) })}
                />

                {/* Image upload section */}
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Upload className="h-4 w-4" /> Upload Image
                    </Button>
                    {imagePreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={resetImageInput}
                        className="flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {imagePreview && (
                    <div className="mt-2 relative w-24 h-24">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover rounded border"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={newItem.isAvailable || false}
                    onCheckedChange={(checked) => setNewItem({ ...newItem, isAvailable: checked as boolean })}
                  />
                  <span>Available</span>
                </div>
                <Input
                  type="number"
                  placeholder="Preparation Time"
                  value={newItem.preparationTime || ""}
                  onChange={(e) => setNewItem({ ...newItem, preparationTime: Number.parseInt(e.target.value) })}
                />
                <Select onValueChange={(value) => setNewItem({ ...newItem, categoryId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => {
                  setShowAddForm(false)
                  resetImageInput()
                }}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Create Item</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Description</TableHead>
                <TableHead className="font-semibold">Price</TableHead>
                <TableHead className="font-semibold">Image</TableHead>
                <TableHead className="font-semibold">Available</TableHead>
                <TableHead className="font-semibold">Prep Time</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    {editingId === item.id ? (
                      <Input
                        value={item.name}
                        onChange={(e) =>
                          setItems(items.map((i) => (i.id === item.id ? { ...i, name: e.target.value } : i)))
                        }
                      />
                    ) : (
                      item.name
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {editingId === item.id ? (
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          setItems(items.map((i) => (i.id === item.id ? { ...i, description: e.target.value } : i)))
                        }
                      />
                    ) : (
                      item.description
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === item.id ? (
                      <Input
                        type="number"
                        value={item.price}
                        onChange={(e) =>
                          setItems(
                            items.map((i) => (i.id === item.id ? { ...i, price: Number.parseFloat(e.target.value) } : i)),
                          )
                        }
                      />
                    ) : (
                      `${restaurantSettings?.currencySymbol || '$'} ${item.price.toFixed(2)}`
                    )}
                  </TableCell>
                  <TableCell>
                    {/* Display the image from imageUrl */}
                    <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded" />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={item.isAvailable}
                      onCheckedChange={(checked) =>
                        setItems(items.map((i) => (i.id === item.id ? { ...i, isAvailable: checked as boolean } : i)))
                      }
                      disabled={editingId !== item.id}
                    />
                  </TableCell>
                  <TableCell>
                    {editingId === item.id ? (
                      <Input
                        type="number"
                        value={item.preparationTime}
                        onChange={(e) =>
                          setItems(
                            items.map((i) =>
                              i.id === item.id ? { ...i, preparationTime: Number.parseInt(e.target.value) } : i,
                            ),
                          )
                        }
                      />
                    ) : (
                      `${item.preparationTime} min`
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === item.id ? (
                      <Select
                        value={item.categoryId}
                        onValueChange={(value) =>
                          setItems(items.map((i) => (i.id === item.id ? { ...i, categoryId: value } : i)))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-800">
                        {item.category.name}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      {editingId === item.id ? (
                        <Button size="sm" onClick={() => handleUpdate(item.id)}>Save</Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(item.id)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}