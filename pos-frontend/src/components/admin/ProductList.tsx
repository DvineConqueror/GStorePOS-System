import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Edit, Trash2, Package, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Product } from '@/types/product';

interface ProductListProps {
  products: Product[];
  loading?: boolean;
  onToggleStatus: (productId: string, currentStatus: 'active' | 'inactive' | 'deleted') => void;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
  highlightProductId?: string | null;
  highlightAllLowStock?: boolean;
  onClearHighlight?: () => void;
}

const ITEMS_PER_PAGE = 8; // 4 cards per row, 2 rows

export const ProductList: React.FC<ProductListProps> = ({
  products,
  loading = false,
  onToggleStatus,
  onEdit,
  onDelete,
  highlightProductId,
  highlightAllLowStock = false,
  onClearHighlight,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const highlightedProductRef = useRef<HTMLDivElement>(null);
  const firstLowStockRef = useRef<HTMLDivElement>(null);
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProducts = products.slice(startIndex, endIndex);

  // Identify low stock products (memoized to avoid unnecessary re-renders)
  const lowStockProducts = useMemo(() => 
    products.filter(p => p.stock <= (p.minStock || 10)), 
    [products]
  );
  
  const lowStockProductIds = useMemo(() => 
    new Set(lowStockProducts.map(p => p._id)), 
    [lowStockProducts]
  );

  // Handle highlighting single product: scroll to product and navigate to correct page
  useEffect(() => {
    if (highlightProductId && products.length > 0) {
      // Find the product index
      const productIndex = products.findIndex(p => p._id === highlightProductId);
      
      if (productIndex !== -1) {
        // Calculate which page the product is on
        const productPage = Math.floor(productIndex / ITEMS_PER_PAGE) + 1;
        
        // Navigate to that page
        if (productPage !== currentPage) {
          setCurrentPage(productPage);
        }
        
        // Scroll to the highlighted product after a short delay to allow rendering
        setTimeout(() => {
          if (highlightedProductRef.current) {
            highlightedProductRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }
        }, 100);
      }
    }
  }, [highlightProductId, products, currentPage]);

  // Handle highlighting all low stock products: scroll to first low stock item
  useEffect(() => {
    if (highlightAllLowStock && lowStockProducts.length > 0) {
      // Find the first low stock product
      const firstLowStockIndex = products.findIndex(p => lowStockProductIds.has(p._id));
      
      if (firstLowStockIndex !== -1) {
        // Calculate which page the first low stock product is on
        const productPage = Math.floor(firstLowStockIndex / ITEMS_PER_PAGE) + 1;
        
        // Navigate to that page
        if (productPage !== currentPage) {
          setCurrentPage(productPage);
        }
        
        // Scroll to the first low stock product after a short delay
        setTimeout(() => {
          if (firstLowStockRef.current) {
            firstLowStockRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }
        }, 100);
      }
    }
  }, [highlightAllLowStock, lowStockProducts.length, products, currentPage, lowStockProductIds]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500">No products match your current filters.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {currentProducts.map((product, index) => {
          const isSingleHighlight = highlightProductId === product._id;
          const isLowStock = lowStockProductIds.has(product._id);
          const isAllLowStockHighlight = highlightAllLowStock && isLowStock;
          const isHighlighted = isSingleHighlight || isAllLowStockHighlight;
          
          // Use ref for the first low stock product when highlighting all
          const isFirstLowStockOnPage = highlightAllLowStock && isLowStock && 
            currentProducts.findIndex(p => lowStockProductIds.has(p._id)) === index;
          
          return (
            <Card 
              key={product._id} 
              ref={isSingleHighlight ? highlightedProductRef : isFirstLowStockOnPage ? firstLowStockRef : null}
              className={`hover:shadow-lg transition-all duration-200 ${
                isHighlighted 
                  ? 'ring-4 ring-blue-500 ring-offset-2 shadow-xl bg-blue-50' 
                  : ''
              }`}
            >
              <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800 truncate">{product.name}</h3>
                <Badge
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    product.status === 'active' ? 'bg-green-100 text-green-700' :
                    product.status === 'inactive' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}
                >
                  {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                </Badge>
              </div>
              
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Price:</span>
                  <span className="font-medium">₱{product.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Stock:</span>
                  <span className="font-medium">{product.stock} {product.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span>Category:</span>
                  <span className="font-medium truncate">{product.category}</span>
                </div>
                <div className="flex justify-between">
                  <span>SKU:</span>
                  <span className="font-medium text-xs">{product.sku}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mt-3 pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleStatus(product._id, product.status)}
                  className="text-xs h-7 px-2"
                >
                  {product.status === 'active' ? (
                    <>
                      <EyeOff className="h-3 w-3 mr-1" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3 mr-1" />
                      Activate
                    </>
                  )}
                </Button>
                <div className="flex gap-1">
                  {onEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(product)}
                      className="text-xs h-7 w-7 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(product._id)}
                      className="text-xs h-7 w-7 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(endIndex, products.length)} of {products.length} products
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};