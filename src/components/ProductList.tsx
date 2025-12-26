import { Product } from '../App';
import { Package, AlertCircle } from 'lucide-react';

interface ProductListProps {
  products: Product[];
}

export function ProductList({ products }: ProductListProps) {
  const lowStockProducts = products.filter(p => p.stock < 100);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Low Stock Warning */}
      {lowStockProducts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="w-5 h-5" />
            <p>
              <strong>{lowStockProducts.length}</strong> produk dengan stok rendah (dibawah 100)
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <Package className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl">Daftar Produk</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">NO</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">KODE</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">NAMA PRODUK</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">HARGA</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">STOK</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr 
                  key={product.id}
                  className={index % 2 === 0 ? 'bg-green-50' : 'bg-white'}
                >
                  <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{product.code}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{product.name}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                    {product.price.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700">
                    {product.stock} {product.unit}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {product.stock === 0 ? (
                      <span className="inline-flex px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                        Habis
                      </span>
                    ) : product.stock < 100 ? (
                      <span className="inline-flex px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                        Stok Rendah
                      </span>
                    ) : (
                      <span className="inline-flex px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        Tersedia
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-gray-700 text-sm">
            Total Produk: <strong>{products.length}</strong> | 
            Stok Rendah: <strong>{lowStockProducts.length}</strong> | 
            Total Nilai Stok: <strong>Rp {products.reduce((sum, p) => sum + (p.price * p.stock), 0).toLocaleString('id-ID')}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}