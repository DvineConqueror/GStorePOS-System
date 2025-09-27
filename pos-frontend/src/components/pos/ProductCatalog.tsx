
import { Search, Plus, Trash2, Edit, Check } from 'lucide-react';
import { Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { usePos } from '@/context/PosContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/utils/format';
import { ProductForm } from './ProductForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useEffect } from 'react';
import { DeleteProductDialog } from './DeleteProductDialog';
import { Product } from '@/types'; // Add this import

export function ProductCatalog() {
  const { state, addToCart, fetchProducts } = usePos();
  const { products } = state;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState<{ id: string; name: string } | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const isProductInCart = (productId: string): boolean => {
    return state.cart.some(item => item._id === productId);
  };

  // Extract unique categories
  const categories = [
    'All',
    ...Array.from(new Set(products.map(product => product.category)))
      .filter(category => category !== 'Others')
      .sort((a, b) => a.localeCompare(b)),
    'Others'
  ];

  // Filter products based on search term and selected category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'All' ? true :
      selectedCategory === 'Others' ? product.category === 'Others' :
      product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const handleDeleteClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation(); // Prevent triggering the card click
    setDeleteProduct({ id: product.id, name: product.name });
  };

  const handleEditClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setEditProduct(product);
  };

  return (
    <Card className="flex flex-col h-full p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-4">
        <div className="relative w-full sm:flex-1 sm:mr-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            className="pl-8 text-black"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
          <div className="w-full sm:w-[140px]">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-9 bg-pos-primary text-white font-semibold">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            onClick={() => setShowAddProduct(true)}
            className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-2">
          {currentProducts.map(product => (
            <Card
              key={product._id}
              className="flex flex-col p-3 hover:bg-accent cursor-pointer transition-colors relative group"
              onClick={() => addToCart(product)}
            >
              {/* Add overlay for plus/check icon */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded">
                {isProductInCart(product._id) ? (
                  <Check className="h-8 w-8 text-pos-success" />
                ) : (
                  <Plus className="h-8 w-8 text-white" />
                )}
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => handleEditClick(e, product)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => handleDeleteClick(e, product)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="h-20 w-full bg-muted rounded flex items-center justify-center mb-2">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-scale-down rounded"
                  />
                ) : (
                  <span className="text-muted-foreground">No image</span>
                )}
              </div>
              <div className="font-medium text-sm truncate">{product.name}</div>
              <div className="font-bold text-sm mt-1 text-green-700">{formatCurrency(product.price)}</div>
            </Card>
          ))}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 bg-background hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <PaginationItem key={page}>
                  <Button
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    className={`h-9 w-9 ${currentPage === page ? 'bg-pos-primary text-white hover:bg-pos-primary/90' : 'bg-background hover:bg-accent hover:text-accent-foreground'}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                </PaginationItem>
              ))}
              <PaginationItem>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 bg-background hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <ProductForm
        open={showAddProduct || !!editProduct}
        onClose={() => {
          setShowAddProduct(false);
          setEditProduct(null);
        }}
        onSuccess={async () => {
          await fetchProducts();
          setShowAddProduct(false);
          setEditProduct(null);
        }}
        product={editProduct || undefined}
      />
      <DeleteProductDialog
        open={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        onSuccess={async () => {
          await fetchProducts();
          setDeleteProduct(null);
        }}
        productId={deleteProduct?.id || ''}
        productName={deleteProduct?.name || ''}
      />
    </Card>
  );
}
