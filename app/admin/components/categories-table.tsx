import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Plus, Pencil, Trash2, Package } from "lucide-react"

type Category = {
  id: string
  name: string
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count: {
    items: number
  }
}

export default function CategoriesTable() {
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState<Partial<Category>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    const response = await fetch("/api/category")
    const data = await response.json()
    setCategories(data)
  }

  const handleCreate = async () => {
    await fetch("/api/category", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(newCategory),
    })
    setNewCategory({})
    setShowAddForm(false)
    fetchCategories()
  }

  const handleUpdate = async (id: string) => {
    await fetch(`/api/category/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(categories.find((c) => c.id === id)),
    })
    setEditingId(null)
    fetchCategories()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/category/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
    })
    fetchCategories()
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold">Categories Management</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search categories..."
                className="pl-8 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Category
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
                    value={newCategory.name || ""}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  />
                  <Input
                    placeholder="Description"
                    value={newCategory.description || ""}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={newCategory.isActive || false}
                      onCheckedChange={(checked) => setNewCategory({ ...newCategory, isActive: checked as boolean })}
                    />
                    <span>Active</span>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                  <Button onClick={handleCreate}>Create Category</Button>
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
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Items</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {editingId === category.id ? (
                        <Input
                          value={category.name}
                          onChange={(e) =>
                            setCategories(categories.map((c) => (c.id === category.id ? { ...c, name: e.target.value } : c)))
                          }
                        />
                      ) : (
                        category.name
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {editingId === category.id ? (
                        <Input
                          value={category.description}
                          onChange={(e) =>
                            setCategories(
                              categories.map((c) => (c.id === category.id ? { ...c, description: e.target.value } : c)),
                            )
                          }
                        />
                      ) : (
                        category.description
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={category.isActive}
                          onCheckedChange={(checked) =>
                            setCategories(
                              categories.map((c) => (c.id === category.id ? { ...c, isActive: checked as boolean } : c)),
                            )
                          }
                          disabled={editingId !== category.id}
                        />
                        <span className={`text-sm ${category.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{category._count.items}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {editingId === category.id ? (
                          <Button size="sm" onClick={() => handleUpdate(category.id)}>Save</Button>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(category.id)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600"
                          onClick={() => handleDelete(category.id)}
                          disabled={category._count.items > 0}
                        >
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
    </div>
  )
}