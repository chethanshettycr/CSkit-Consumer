"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/app/lib/auth"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { Moon, Sun, Menu, ShoppingCart, ClipboardList, MessageSquare } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type Product = {
  id: number
  name: string
  price: number
  image: string
  description: string
  category: "material" | "machine" | "worker"
}

export default function ConsumerDashboard() {
  const { user, login, logout } = useAuth()
  const router = useRouter()
  const [cartCount, setCartCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [displayedProducts, setDisplayedProducts] = useState<{
    material: Product[]
    machine: Product[]
    worker: Product[]
  }>({
    material: [],
    machine: [],
    worker: [],
  })
  const [cart, setCart] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/")
    }
  }, [user, router])

  if (!user) {
    return null // or a loading indicator
  }

  const loadCart = useCallback(() => {
    try {
      const storedCart = localStorage.getItem("cart")
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart)
        setCart(parsedCart)
        setCartCount(parsedCart.length)
      }
    } catch (error) {
      console.error("Error loading cart:", error)
      setCart([])
      setCartCount(0)
    }
  }, [])

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/products")
      const data = await response.json()
      setAllProducts(data)

      setDisplayedProducts({
        material: data.filter((p: Product) => p.category === "material"),
        machine: data.filter((p: Product) => p.category === "machine"),
        worker: data.filter((p: Product) => p.category === "worker"),
      })
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
    loadCart()

    const isDarkMode = localStorage.getItem("darkMode") === "true"
    setDarkMode(isDarkMode)
    document.documentElement.classList.toggle("dark", isDarkMode)
  }, [fetchProducts, loadCart])

  useEffect(() => {
    const handleProductsUpdated = () => {
      fetchProducts()
    }

    window.addEventListener("productsUpdated", handleProductsUpdated)

    return () => {
      window.removeEventListener("productsUpdated", handleProductsUpdated)
    }
  }, [fetchProducts])

  const filteredProducts = useCallback(
    (category: "material" | "machine" | "worker") => {
      return displayedProducts[category].filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    },
    [displayedProducts, searchTerm],
  )

  const addToCart = useCallback((product: Product) => {
    setCart((prevCart) => {
      const updatedCart = [...prevCart, product]
      localStorage.setItem("cart", JSON.stringify(updatedCart))
      return updatedCart
    })
    setCartCount((prevCount) => prevCount + 1)
    setSelectedProduct(null)
  }, [])

  const openProductDialog = useCallback((product: Product) => {
    setSelectedProduct(product)
  }, [])

  const isInCart = useCallback(
    (productId: number) => {
      return cart.some((item) => item.id === productId)
    },
    [cart],
  )

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      // Implement search functionality
      console.log("Searching for:", searchTerm)
    },
    [searchTerm],
  )

  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem("darkMode", newDarkMode.toString())
    document.documentElement.classList.toggle("dark", newDarkMode)
  }, [darkMode])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4"
    >
      <div className="flex justify-between items-center mb-6">
        <motion.h1
          className="text-2xl font-bold text-foreground"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {user ? `Welcome, ${user.username}` : "Welcome to CSkit Consumer"}
        </motion.h1>
        <div className="flex items-center space-x-2">
          {user ? (
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          ) : (
            <Button variant="outline" onClick={() => router.push("/")}>
              Back to Welcome
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={toggleDarkMode}>
            {darkMode ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push("/cart")}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                My Cart ({cartCount})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/orders")}>
                <ClipboardList className="mr-2 h-4 w-4" />
                Orders
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/complaints")}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Complaint
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <Input
            type="search"
            placeholder="Search for materials, machines, or professionals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="submit">Search</Button>
        </div>
      </form>

      <Tabs defaultValue="materials" className="space-y-4">
        <TabsList>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="machines">Machines</TabsTrigger>
          <TabsTrigger value="worker">Professional Workers</TabsTrigger>
        </TabsList>
        {["materials", "machines", "worker"].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue}>
            <Card>
              <CardHeader>
                <CardTitle>{tabValue.charAt(0).toUpperCase() + tabValue.slice(1)}</CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: {
                      transition: {
                        staggerChildren: 0.1,
                      },
                    },
                  }}
                >
                  {filteredProducts(
                    tabValue === "materials" ? "material" : tabValue === "machines" ? "machine" : "worker",
                  ).map((product) => (
                    <motion.div
                      key={product.id}
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 },
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Card className="cursor-pointer" onClick={() => openProductDialog(product)}>
                        <CardContent className="p-4">
                          <img
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            className="w-full h-40 object-cover mb-2 rounded-md"
                          />
                          <h3 className="font-bold">{product.name}</h3>
                          <p>₹{product.price}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {selectedProduct && (
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedProduct.name}</DialogTitle>
            </DialogHeader>
            <img
              src={selectedProduct.image || "/placeholder.svg"}
              alt={selectedProduct.name}
              className="w-full h-60 object-cover mb-4 rounded-md"
            />
            <DialogDescription>
              <p className="text-lg font-bold mb-2">₹{selectedProduct.price}</p>
              <p className="mb-4">{selectedProduct.description}</p>
            </DialogDescription>
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                if (isInCart(selectedProduct.id)) {
                  router.push("/cart")
                } else {
                  addToCart(selectedProduct)
                }
              }}
            >
              {isInCart(selectedProduct.id) ? "View Cart" : "Add to Cart"}
            </Button>
          </DialogContent>
        </Dialog>
      )}

      <footer className="mt-8 text-center text-sm text-gray-500">Created by Chethan Shetty</footer>
    </motion.div>
  )
}

