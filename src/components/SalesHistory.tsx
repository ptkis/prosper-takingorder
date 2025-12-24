import { useState } from 'react';
import { Sale } from '../App';
import { ChevronDown, ChevronUp, Calendar, User, DollarSign } from 'lucide-react';

interface SalesHistoryProps {
  sales: Sale[];
}

export function SalesHistory({ sales }: SalesHistoryProps) {
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  const toggleExpand = (saleId: string) => {
    setExpandedSaleId(expandedSaleId === saleId ? null : saleId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalItems = sales.reduce((sum, sale) => 
    sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-gray-600">Total Transaksi</span>
          </div>
          <p className="text-2xl">{sales.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-gray-600">Total Pendapatan</span>
          </div>
          <p className="text-2xl">Rp {totalRevenue.toLocaleString('id-ID')}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-gray-600">Total Item Terjual</span>
          </div>
          <p className="text-2xl">{totalItems}</p>
        </div>
      </div>

      {/* Sales List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl mb-6">Riwayat Penjualan</h2>

        {sales.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Belum ada data penjualan</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sales.map(sale => (
              <div key={sale.id} className="border rounded-lg overflow-hidden">
                <div
                  onClick={() => toggleExpand(sale.id)}
                  className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 grid md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-gray-600">Tanggal</p>
                        <p>{formatDate(sale.date)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Salesman</p>
                        <p>{sale.salesmanName}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Customer</p>
                        <p>{sale.customerName}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total</p>
                        <p className="text-green-600">
                          Rp {sale.totalAmount.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                    <div className="ml-4">
                      {expandedSaleId === sale.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedSaleId === sale.id && (
                  <div className="p-4 border-t">
                    <h4 className="mb-3">Detail Item:</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left">Kode</th>
                            <th className="px-3 py-2 text-left">Nama Produk</th>
                            <th className="px-3 py-2 text-right">Harga</th>
                            <th className="px-3 py-2 text-right">Jumlah</th>
                            <th className="px-3 py-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {sale.items.map((item, index) => (
                            <tr key={index}>
                              <td className="px-3 py-2">{item.productCode}</td>
                              <td className="px-3 py-2">{item.productName}</td>
                              <td className="px-3 py-2 text-right">
                                Rp {item.price.toLocaleString('id-ID')}
                              </td>
                              <td className="px-3 py-2 text-right">{item.quantity}</td>
                              <td className="px-3 py-2 text-right">
                                Rp {item.total.toLocaleString('id-ID')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
