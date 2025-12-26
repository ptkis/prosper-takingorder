import { useState } from 'react';
import { Product, Sale, SaleItem } from '../App';
import { Plus, Trash2, Save, Loader2, X } from 'lucide-react';
import type { Salesman } from './SalesmanList';

interface SalesEntryModalProps {
  products: Product[];
  salesmen: Salesman[];
  onSaleSubmit: (sale: Sale) => Promise<boolean>;
  onClose: () => void;
}

export function SalesEntryModal({ products, salesmen, onSaleSubmit, onClose }: SalesEntryModalProps) {
  const [salesmanName, setSalesmanName] = useState('');
  const [salesmanId, setSalesmanId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [items, setItems] = useState<SaleItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [salesmanSearch, setSalesmanSearch] = useState('');
  const [showSalesmanDropdown, setShowSalesmanDropdown] = useState(false);

  // Filter active salesmen
  const activeSalesmen = salesmen.filter(s => s.status === 'active');

  // Filter salesmen based on search
  const filteredSalesmen = activeSalesmen.filter(s =>
    s.name.toLowerCase().includes(salesmanSearch.toLowerCase()) ||
    s.code.toLowerCase().includes(salesmanSearch.toLowerCase())
  );

  const handleSalesmanSelect = (salesman: Salesman) => {
    setSalesmanName(salesman.name);
    setSalesmanId(salesman.id);
    setSalesmanSearch(salesman.name);
    setShowSalesmanDropdown(false);
  };

  const handleAddItem = () => {
    if (!selectedProductId || !quantity || parseInt(quantity) <= 0) {
      alert('Pilih produk dan masukkan jumlah yang valid');
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const qty = parseInt(quantity);
    if (qty > product.stock) {
      alert(`Stok tidak cukup. Stok tersedia: ${product.stock} ${product.unit}`);
      return;
    }

    // Check if product already in items
    const existingItemIndex = items.findIndex(item => item.productId === selectedProductId);
    
    if (existingItemIndex >= 0) {
      const updatedItems = [...items];
      const newQty = updatedItems[existingItemIndex].quantity + qty;
      
      if (newQty > product.stock) {
        alert(`Stok tidak cukup. Stok tersedia: ${product.stock} ${product.unit}`);
        return;
      }
      
      updatedItems[existingItemIndex].quantity = newQty;
      updatedItems[existingItemIndex].total = newQty * product.price;
      setItems(updatedItems);
    } else {
      const newItem: SaleItem = {
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        quantity: qty,
        price: product.price,
        total: qty * product.price
      };
      setItems([...items, newItem]);
    }

    setSelectedProductId('');
    setQuantity('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!salesmanName.trim()) {
      alert('Masukkan nama salesman');
      return;
    }
    if (!customerName.trim()) {
      alert('Masukkan nama customer');
      return;
    }
    if (items.length === 0) {
      alert('Tambahkan minimal 1 item');
      return;
    }

    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
    
    const sale: Sale = {
      id: Date.now().toString(),
      salesmanName,
      salesmanId,
      customerName,
      date: new Date().toISOString(),
      items,
      totalAmount
    };

    setSaving(true);
    const success = await onSaleSubmit(sale);
    setSaving(false);

    if (success) {
      alert('Penjualan berhasil dicatat!');
      onClose();
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl">Form Entry Penjualan</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={saving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Salesman & Customer Info */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 mb-2">Nama Salesman *</label>
              <div className="relative">
                <input
                  type="text"
                  value={salesmanSearch}
                  onChange={(e) => {
                    setSalesmanSearch(e.target.value);
                    setSalesmanName(e.target.value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={activeSalesmen.length > 0 ? "Pilih atau ketik nama salesman" : "Masukkan nama salesman"}
                  onFocus={() => activeSalesmen.length > 0 && setShowSalesmanDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSalesmanDropdown(false), 200)}
                />
                {showSalesmanDropdown && filteredSalesmen.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-b-lg shadow-md max-h-40 overflow-y-auto">
                    {filteredSalesmen.map(salesman => (
                      <div
                        key={salesman.id}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSalesmanSelect(salesman)}
                      >
                        {salesman.code} - {salesman.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Nama Customer *</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Masukkan nama customer"
              />
            </div>
          </div>

          {/* Add Item Section */}
          <div className="border-t pt-6 mb-6">
            <h3 className="mb-4">Tambah Item</h3>
            <div className="flex gap-3">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Pilih Produk</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.code} - {product.name} (Stok: {product.stock} {product.unit}) - Rp {product.price.toLocaleString('id-ID')}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Jumlah"
                min="1"
              />
              <button
                onClick={handleAddItem}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Tambah
              </button>
            </div>
          </div>

          {/* Items Table */}
          {items.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-4">Daftar Item</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">KODE</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">PRODUK</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">HARGA</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">JUMLAH</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">TOTAL</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr 
                        key={index}
                        className={index % 2 === 0 ? 'bg-blue-50' : 'bg-white'}
                      >
                        <td className="px-4 py-3 text-sm text-gray-900">{item.productCode}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.productName}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">{item.price.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">{item.total.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50">
                      <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold">Total</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">
                        {totalAmount.toLocaleString('id-ID')}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Simpan Penjualan
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
