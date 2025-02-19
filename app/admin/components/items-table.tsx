import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Plus, Pencil, Trash2 } from "lucide-react"

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

export default function ItemsTable() {
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [newItem, setNewItem] = useState<Partial<Item>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchItems()
    fetchCategories()
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

  const handleCreate = async () => {
    await fetch("/api/item", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(newItem),
    })

    // Log the bearer Token to check
    console.log("Bearer Token: ", localStorage.getItem('token'))

    setNewItem({})
    setShowAddForm(false)
    fetchItems()
  }

  const handleUpdate = async (id: string) => {
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
      method: "DELETE", headers: {
        "Content-Type": "application/json",
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
                <Input
                  placeholder="Image URL"
                  value={newItem.imageUrl || ""}
                  onChange={(e) => setNewItem({ ...newItem, imageUrl: e.target.value })}
                />
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
                <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
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
                      `$${item.price.toFixed(2)}`
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === item.id ? (
                      <Input
                        value={item.imageUrl}
                        onChange={(e) =>
                          setItems(items.map((i) => (i.id === item.id ? { ...i, imageUrl: e.target.value } : i)))
                        }
                      />
                    ) : (
                      <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded" />
                    )}
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