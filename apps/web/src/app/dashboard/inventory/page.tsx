'use client';

import { motion } from 'framer-motion';
import { 
  Package, 
  Plus, 
  Search, 
  Filter,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StaggerContainer, StaggerItem } from '@/components/ui/page-transition';

// Mock data for inventory
const products = [
  {
    id: '1',
    name: 'Shampoo Profissional 1L',
    brand: 'L\'Oréal',
    category: 'Cabelo',
    stock: 12,
    minStock: 5,
    price: 89.90,
    cost: 45.00,
    lastPurchase: '2026-01-15'
  },
  {
    id: '2',
    name: 'Condicionador Profissional 1L',
    brand: 'L\'Oréal',
    category: 'Cabelo',
    stock: 8,
    minStock: 5,
    price: 95.00,
    cost: 48.00,
    lastPurchase: '2026-01-15'
  },
  {
    id: '3',
    name: 'Tintura 60ml - Castanho',
    brand: 'Wella',
    category: 'Coloração',
    stock: 3,
    minStock: 10,
    price: 35.00,
    cost: 18.00,
    lastPurchase: '2026-01-10'
  },
  {
    id: '4',
    name: 'Oxidante 20 Vol 1L',
    brand: 'Wella',
    category: 'Coloração',
    stock: 2,
    minStock: 5,
    price: 25.00,
    cost: 12.00,
    lastPurchase: '2026-01-10'
  },
  {
    id: '5',
    name: 'Esmalte Cremoso',
    brand: 'Risqué',
    category: 'Unhas',
    stock: 45,
    minStock: 20,
    price: 8.90,
    cost: 4.50,
    lastPurchase: '2026-01-20'
  },
  {
    id: '6',
    name: 'Acetona 500ml',
    brand: 'Ideal',
    category: 'Unhas',
    stock: 15,
    minStock: 10,
    price: 12.00,
    cost: 6.00,
    lastPurchase: '2026-01-18'
  },
];

export default function InventoryPage() {
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const totalValue = products.reduce((acc, p) => acc + (p.stock * p.cost), 0);

  const stats = [
    { label: 'Total Produtos', value: products.length },
    { label: 'Estoque Baixo', value: lowStockProducts.length, alert: lowStockProducts.length > 0 },
    { label: 'Valor em Estoque', value: `R$ ${totalValue.toFixed(2)}` },
    { label: 'Categorias', value: [...new Set(products.map(p => p.category))].length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Estoque</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Controle de produtos e materiais
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      {/* Alert for low stock */}
      {lowStockProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl"
        >
          <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-xl">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-amber-800 dark:text-amber-200">Atenção: Estoque baixo</p>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {lowStockProducts.length} produto(s) abaixo do estoque mínimo
            </p>
          </div>
          <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100">
            Ver Produtos
          </Button>
        </motion.div>
      )}

      {/* Stats */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StaggerItem key={stat.label}>
            <Card className={stat.alert ? 'border-amber-300 dark:border-amber-700' : ''}>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.alert ? 'text-amber-600' : 'text-gray-900 dark:text-white'}`}>
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar produto..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-ruby-500 focus:border-transparent"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Produto</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Categoria</th>
                  <th className="text-center p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Estoque</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Preço</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Custo</th>
                  <th className="text-center p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const isLowStock = product.stock <= product.minStock;
                  return (
                    <tr 
                      key={product.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{product.brand}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg text-xs font-medium">
                          {product.category}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {isLowStock && (
                            <TrendingDown className="h-4 w-4 text-amber-500" />
                          )}
                          <span className={`font-semibold ${isLowStock ? 'text-amber-600' : 'text-gray-900 dark:text-white'}`}>
                            {product.stock}
                          </span>
                          <span className="text-gray-400 text-sm">/ {product.minStock}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right font-medium text-gray-900 dark:text-white">
                        R$ {product.price.toFixed(2)}
                      </td>
                      <td className="p-4 text-right text-gray-500 dark:text-gray-400">
                        R$ {product.cost.toFixed(2)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
