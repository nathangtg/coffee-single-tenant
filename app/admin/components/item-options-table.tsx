import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Plus, Pencil, Trash2, DollarSign } from "lucide-react"

type ItemOption = {
  id: string
  itemId: string
  name: string
  priceModifier: number
  createdAt: string
  updatedAt: string
}

type Item = {
  id: string
  name: string
}

export default function ItemOptionsTable() {
  const [itemOptions, setItemOptions] = useState<ItemOption[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [newItemOption, setNewItemOption] = useState<Partial<ItemOption>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchItemOptions()
    fetchItems()
  }, [])

  const fetchItemOptions = async () => {
    const response = await fetch("/api/itemOptions", {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    const data = await response.json()
    setItemOptions(data)
  }

  const fetchItems = async () => {
    const response = await fetch("/api/item", {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    const data = await response.json()
    setItems(data)
  }

  const handleCreate = async () => {
    await fetch("/api/itemOptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(newItemOption),
    })
    setNewItemOption({})
    setShowAddForm(false)
    fetchItemOptions()
  }

  const handleUpdate = async (id: string) => {
    await fetch(`/api/itemOptions/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(itemOptions.find((o) => o.id === id)),
    })
    setEditingId(null)
    fetchItemOptions()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/itemOptions/${id}`, {
      method: "DELETE",
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    fetchItemOptions()
  }

  const filteredOptions = itemOptions.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    items.find(item => item.id === option.itemId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-2xl font-bold">Item Options Management</CardTitle>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search options..."
              className="pl-8 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Option
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
                  value={newItemOption.name || ""}
                  onChange={(e) => setNewItemOption({ ...newItemOption, name: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Price Modifier"
                  value={newItemOption.priceModifier || ""}
                  onChange={(e) => setNewItemOption({ ...newItemOption, priceModifier: Number.parseFloat(e.target.value) })}
                />
                <Select onValueChange={(value) => setNewItemOption({ ...newItemOption, itemId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                <Button onClick={handleCreate}>Create Option</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Price Modifier</TableHead>
                <TableHead className="font-semibold">Item</TableHead>
                <TableHead className="font-semibold">Created At</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOptions.map((option) => (
                <TableRow key={option.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    {editingId === option.id ? (
                      <Input
                        value={option.name}
                        onChange={(e) =>
                          setItemOptions(itemOptions.map((o) => (o.id === option.id ? { ...o, name: e.target.value } : o)))
                        }
                      />
                    ) : (
                      option.name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === option.id ? (
                      <Input
                        type="number"
                        value={option.priceModifier}
                        onChange={(e) =>
                          setItemOptions(
                            itemOptions.map((o) =>
                              o.id === option.id ? { ...o, priceModifier: Number.parseFloat(e.target.value) } : o,
                            ),
                          )
                        }
                      />
                    ) : (
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span className={option.priceModifier >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {option.priceModifier >= 0 ? '+' : ''}{option.priceModifier.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === option.id ? (
                      <Select
                        value={option.itemId}
                        onValueChange={(value) =>
                          setItemOptions(itemOptions.map((o) => (o.id === option.id ? { ...o, itemId: value } : o)))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select item" />
                        </SelectTrigger>
                        <SelectContent>
                          {items.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-800">
                        {items.find((item) => item.id === option.itemId)?.name}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {new Date(option.createdAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      {editingId === option.id ? (
                        <Button size="sm" onClick={() => handleUpdate(option.id)}>Save</Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(option.id)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(option.id)}>
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