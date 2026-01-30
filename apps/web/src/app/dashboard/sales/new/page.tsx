'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  ArrowLeft, 
  Search,
  User,
  Scissors,
  Package,
  CreditCard,
  QrCode,
  Banknote,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Check,
  Percent
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCard } from '@/components/ui/page-transition';
import { formatCurrency } from '@/lib/utils';

// Mock data
const customers = [
  { id: '1', name: 'Maria Silva', phone: '(11) 99999-1234' },
  { id: '2', name: 'Ana Santos', phone: '(11) 99999-5678' },
  { id: '3', name: 'Julia Costa', phone: '(11) 99999-9012' },
];

const services = [
  { id: 's1', name: 'Corte Feminino', price: 80, type: 'service' },
  { id: 's2', name: 'Escova', price: 50, type: 'service' },
  { id: 's3', name: 'Coloração', price: 180, type: 'service' },
  { id: 's4', name: 'Manicure', price: 35, type: 'service' },
];

const products = [
  { id: 'p1', name: 'Shampoo Profissional', price: 89.90, type: 'product', stock: 15 },
  { id: 'p2', name: 'Condicionador Hidratação', price: 79.90, type: 'product', stock: 12 },
  { id: 'p3', name: 'Óleo Reparador', price: 65.00, type: 'product', stock: 8 },
  { id: 'p4', name: 'Máscara Capilar', price: 120.00, type: 'product', stock: 5 },
];

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'service' | 'product';
}

export default function NewSalePage() {
  const router = useRouter();
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'services' | 'products'>('services');

  const addToCart = (item: { id: string; name: string; price: number; type: string }) => {
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      setCart(cart.map(i => 
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1, type: item.type as 'service' | 'product' }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeItem = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount;

  const filteredItems = activeTab === 'services' 
    ? services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSubmit = () => {
    // Aqui faria a criação da venda
    router.push('/dashboard/financial/transactions');
  };

  const paymentMethods = [
    { id: 'credit_card', name: 'Cartão de Crédito', icon: CreditCard },
    { id: 'debit_card', name: 'Cartão de Débito', icon: CreditCard },
    { id: 'pix', name: 'PIX', icon: QrCode },
    { id: 'cash', name: 'Dinheiro', icon: Banknote },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nova Venda</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Registre uma nova transação
          </p>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items Selection */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer Selection */}
          <AnimatedCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-ruby-500" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {customers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer.id)}
                    className={`px-4 py-2 rounded-xl border-2 transition-colors flex items-center gap-2 ${
                      selectedCustomer === customer.id
                        ? 'border-ruby-500 bg-ruby-50 dark:bg-ruby-950/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-ruby-300'
                    }`}
                  >
                    <div className="h-8 w-8 rounded-full bg-ruby-100 dark:bg-ruby-900/30 flex items-center justify-center">
                      <span className="text-xs font-medium text-ruby-600">
                        {customer.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{customer.name}</span>
                    {selectedCustomer === customer.id && (
                      <Check className="h-4 w-4 text-ruby-500" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </AnimatedCard>

          {/* Items */}
          <AnimatedCard>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-ruby-500" />
                  Itens
                </CardTitle>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('services')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'services'
                        ? 'bg-ruby-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Scissors className="h-4 w-4 inline mr-1" />
                    Serviços
                  </button>
                  <button
                    onClick={() => setActiveTab('products')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'products'
                        ? 'bg-ruby-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Package className="h-4 w-4 inline mr-1" />
                    Produtos
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Buscar ${activeTab === 'services' ? 'serviços' : 'produtos'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-ruby-500"
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {filteredItems.map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addToCart(item)}
                    className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-ruby-300 transition-colors text-left flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                      {'stock' in item && (
                        <p className="text-xs text-gray-500">{item.stock} em estoque</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ruby-600">{formatCurrency(item.price)}</span>
                      <Plus className="h-5 w-5 text-gray-400" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </AnimatedCard>
        </div>

        {/* Cart Summary */}
        <div className="space-y-4">
          <AnimatedCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-ruby-500" />
                Resumo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Carrinho vazio</p>
                  <p className="text-sm">Adicione itens para continuar</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                          <p className="text-xs text-gray-500">{formatCurrency(item.price)} un</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button 
                            onClick={() => removeItem(item.id)}
                            className="h-6 w-6 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center text-red-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Discount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Desconto (%)
                    </label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discount}
                        onChange={(e) => setDiscount(Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-ruby-500"
                      />
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-emerald-600">
                        <span>Desconto ({discount}%)</span>
                        <span>-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-ruby-600">{formatCurrency(total)}</span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Forma de Pagamento
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id)}
                          className={`p-2 rounded-xl border-2 transition-colors flex items-center gap-2 ${
                            paymentMethod === method.id
                              ? 'border-ruby-500 bg-ruby-50 dark:bg-ruby-950/30'
                              : 'border-gray-200 dark:border-gray-700 hover:border-ruby-300'
                          }`}
                        >
                          <method.icon className="h-4 w-4" />
                          <span className="text-xs font-medium">{method.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-ruby-600 hover:bg-ruby-700"
                    disabled={!paymentMethod || cart.length === 0}
                    onClick={handleSubmit}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Finalizar Venda
                  </Button>
                </>
              )}
            </CardContent>
          </AnimatedCard>
        </div>
      </div>
    </div>
  );
}
