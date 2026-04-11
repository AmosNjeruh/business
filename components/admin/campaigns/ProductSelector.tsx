// Product Selector Component

import React, { useState, useEffect } from 'react'
import { getProducts } from '@/services/vendor'
import { FaSpinner, FaPlus, FaTimes, FaSearch } from 'react-icons/fa'
import toast from 'react-hot-toast'

interface ProductSelectorProps {
  selectedProducts: Array<{
    productId: string
    commissionRate?: number
    commissionAmount?: number
    commissionType?: 'PERCENTAGE' | 'FIXED'
  }>
  onProductsChange: (products: Array<{
    productId: string
    commissionRate?: number
    commissionAmount?: number
    commissionType?: 'PERCENTAGE' | 'FIXED'
  }>) => void
  errors?: Record<string, string>
}

const ProductSelector: React.FC<ProductSelectorProps> = ({
  selectedProducts,
  onProductsChange,
  errors,
}) => {
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSelector, setShowSelector] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      const result = await getProducts({ isActive: true, isApproved: true })
      setProducts(result.data || [])
    } catch (error: any) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    } finally {
      setIsLoading(false)
    }
  }

  const addProduct = (product: any) => {
    if (selectedProducts.find((p) => p.productId === product.id)) {
      toast.error('Product already added')
      return
    }

    const newProduct = {
      productId: product.id,
      commissionRate: product.commissionRate,
      commissionAmount: product.commissionAmount,
      commissionType: product.commissionType || 'PERCENTAGE',
    }

    onProductsChange([...selectedProducts, newProduct])
    setShowSelector(false)
    setSearchTerm('')
    toast.success('Product added')
  }

  const removeProduct = (productId: string) => {
    onProductsChange(selectedProducts.filter((p) => p.productId !== productId))
  }

  const updateProductCommission = (
    productId: string,
    field: 'commissionRate' | 'commissionAmount' | 'commissionType',
    value: any
  ) => {
    const updated = selectedProducts.map((p) =>
      p.productId === productId ? { ...p, [field]: value } : p
    )
    onProductsChange(updated)
  }

  const filteredProducts = products.filter(
    (product) =>
      !selectedProducts.find((p) => p.productId === product.id) &&
      (searchTerm === '' ||
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getSelectedProductDetails = (productId: string) => {
    return products.find((p) => p.id === productId)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
          Products ({selectedProducts.length})
        </label>
        <button
          type="button"
          onClick={() => setShowSelector(!showSelector)}
          className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1"
        >
          <FaPlus className="h-3 w-3" />
          Add Product
        </button>
      </div>

      {showSelector && (
        <div className="border border-slate-200 dark:border-white/10 rounded-xl p-4 bg-white dark:bg-slate-900/70">
          <div className="relative mb-4">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-slate-900 dark:text-white text-sm"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-4">
              <FaSpinner className="h-5 w-5 animate-spin text-emerald-500" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">
              {searchTerm ? 'No products found' : 'No products available'}
            </p>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-2 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <div className="flex-1">
                    <div className="font-medium text-xs text-slate-900 dark:text-white">
                      {product.name}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {product.price} {product.currency}
                      {product.commissionRate && ` • ${product.commissionRate}% commission`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => addProduct(product)}
                    className="ml-2 px-2 py-1 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedProducts.length > 0 && (
        <div className="space-y-3">
          {selectedProducts.map((selected) => {
            const product = getSelectedProductDetails(selected.productId)
            if (!product) return null

            return (
              <div
                key={selected.productId}
                className="border border-slate-200 dark:border-white/10 rounded-xl p-4 bg-white dark:bg-slate-900/70"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-medium text-xs text-slate-900 dark:text-white">
                      {product.name}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {product.price} {product.currency}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProduct(selected.productId)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTimes className="h-4 w-4" />
                  </button>
                </div>

                <div className="bus-responsive-tile-grid gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Commission Type
                    </label>
                    <select
                      value={selected.commissionType || 'PERCENTAGE'}
                      onChange={(e) =>
                        updateProductCommission(selected.productId, 'commissionType', e.target.value)
                      }
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-slate-900 dark:text-white"
                    >
                      <option value="PERCENTAGE">Percentage</option>
                      <option value="FIXED">Fixed</option>
                    </select>
                  </div>

                  {selected.commissionType === 'PERCENTAGE' ? (
                    <div>
                      <label className="block text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Commission Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={selected.commissionRate || ''}
                        onChange={(e) =>
                          updateProductCommission(selected.productId, 'commissionRate', parseFloat(e.target.value) || undefined)
                        }
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-slate-900 dark:text-white"
                        placeholder="0.0"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Commission Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={selected.commissionAmount || ''}
                        onChange={(e) =>
                          updateProductCommission(selected.productId, 'commissionAmount', parseFloat(e.target.value) || undefined)
                        }
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-slate-900 dark:text-white"
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {errors?.products && (
        <p className="text-xs text-red-600 dark:text-red-400">{errors.products}</p>
      )}
    </div>
  )
}

export default ProductSelector
