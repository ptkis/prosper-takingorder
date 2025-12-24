import { useState } from 'react';
import { Product, Sale, SaleItem } from '../App';
import { Plus, Trash2, Save, Loader2 } from 'lucide-react';

interface SalesEntryProps {
  products: Product[];
  onSaleSubmit: (sale: Sale) => Promise<boolean>;
}

export function SalesEntry({ products, onSaleSubmit }: SalesEntryProps) {
  const [salesmanName, setSalesmanName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [items, setItems] = useState<SaleItem[]>([]);
  const [saving, setSaving] = useState(false);

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
      customerName,
      date: new Date().toISOString(),
      items,
      totalAmount
    };

    setSaving(true);
    const success = await onSaleSubmit(sale);
    setSaving(false);

    if (success) {
      // Reset form
      setSalesmanName('');
      setCustomerName('');
      setItems([]);
      
      alert('Penjualan berhasil dicatat!');
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl mb-6">Form Entry Penjualan</h2>

        {/* Salesman & Customer Info */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-gray-700 mb-2">Nama Salesman</label>
            <input
              type="text"
              value={salesmanName}
              onChange={(e) => setSalesmanName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan nama salesman"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Nama Customer</label>
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
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Kode</th>
                    <th className="px-4 py-3 text-left">Nama Produk</th>
                    <th className="px-4 py-3 text-right">Harga</th>
                    <th className="px-4 py-3 text-right">Jumlah</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">{item.productCode}</td>
                      <td className="px-4 py-3">{item.productName}</td>
                      <td className="px-4 py-3 text-right">Rp {item.price.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">Rp {item.total.toLocaleString('id-ID')}</td>
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
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right">
                      <strong>Total:</strong>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <strong>Rp {totalAmount.toLocaleString('id-ID')}</strong>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
  );
}
