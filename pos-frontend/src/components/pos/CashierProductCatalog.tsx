import { Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { usePos } from '@/context/PosContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/utils/format';
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
import { Product } from '@/types';
import { useRefresh } from '@/context/RefreshContext';
import { ProductImage } from '@/components/ui/ProductImage';

export function CashierProductCatalog() {
  const { state, addToCart, fetchProducts } = usePos();
  const { products } = state;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const { refreshTrigger } = useRefresh();

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
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || 
                           product.category === selectedCategory ||
                           (selectedCategory === 'Others' && !categories.slice(1, -1).includes(product.category));
    
    return matchesSearch && matchesCategory && product.status === 'active';
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  // Refresh products when refresh trigger changes
  useEffect(() => {
    fetchProducts();
  }, [refreshTrigger]); // Remove fetchProducts from dependencies to prevent infinite loop

  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Catalog</h2>
          <p className="text-gray-600">Select products to add to cart</p>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black h-4 w-4" />
          <Input
            placeholder="Search products by name, SKU, or barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-black"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48 bg-white border-gray-300 text-black">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {categories.map((category) => (
              <SelectItem key={category} value={category} className="text-black">
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {currentProducts.map((product) => (
          <Card key={product._id} className="p-4 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              {/* Product Image */}
              <ProductImage 
                imageId={product.image}
                alt={product.name}
                className="w-full h-32 object-cover rounded-lg"
                fallbackClassName="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center"
              />

              {/* Product Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm line-clamp-2 text-black">{product.name}</h3>
                <div className="text-xs text-gray-600">
                  <div>SKU: {product.sku}</div>
                  {product.barcode && <div>Barcode: {product.barcode}</div>}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(product.price)}
                  </span>
                  <div className="text-xs text-gray-600">
                    Stock: {product.stock} {product.unit}
                  </div>
                </div>
              </div>

              {/* Add to Cart Button */}
              <Button
                onClick={() => handleAddToCart(product)}
                disabled={product.stock <= 0 || isProductInCart(product._id)}
                className="w-full"
                size="sm"
              >
                {product.stock <= 0 ? (
                  'Out of Stock'
                ) : isProductInCart(product._id) ? (
                  'In Cart'
                ) : (
                  'Add to Cart'
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* No Products Message */}
      {currentProducts.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-600">
            {searchTerm || selectedCategory !== 'All' ? (
              <>
                <p className="text-black font-medium">No products found matching your criteria.</p>
                <p className="text-sm">Try adjusting your search or filter.</p>
              </>
            ) : (
              <>
                <p className="text-black font-medium">No products available.</p>
                <p className="text-sm">Please contact your administrator.</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Results Summary */}
      <div className="text-sm text-gray-500 text-center">
        Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
      </div>
    </div>
  );
}
