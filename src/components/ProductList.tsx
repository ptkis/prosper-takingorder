import { Product } from '../App';
import { Package } from 'lucide-react';

interface ProductListProps {
  products: Product[];
}

export function ProductList({ products }: ProductListProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <Package className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl">Daftar Barang</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Kode</th>
                <th className="px-4 py-3 text-left">Nama Produk</th>
                <th className="px-4 py-3 text-right">Harga</th>
                <th className="px-4 py-3 text-right">Stok</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{product.code}</td>
                  <td className="px-4 py-3">{product.name}</td>
                  <td className="px-4 py-3 text-right">
                    Rp {product.price.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {product.stock} {product.unit}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {product.stock > 50 ? (
                      <span className="inline-flex px-3 py-1 bg-green-100 text-green-800 rounded-full">
                        Tersedia
                      </span>
                    ) : product.stock > 10 ? (
                      <span className="inline-flex px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                        Terbatas
                      </span>
                    ) : (
                      <span className="inline-flex px-3 py-1 bg-red-100 text-red-800 rounded-full">
                        Stok Rendah
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-gray-700">
            Total Produk: <strong>{products.length}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
