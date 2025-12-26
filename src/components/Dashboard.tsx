import { Sale } from '../App';
import { Product } from '../App';
import type { Salesman } from './SalesmanList';
import { TrendingUp, DollarSign, Package, Users, ShoppingCart } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  sales: Sale[];
  products: Product[];
  salesmen: Salesman[];
}

export function Dashboard({ sales, products, salesmen }: DashboardProps) {
  // Calculate metrics
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalTransactions = sales.length;
  const totalProducts = products.length;
  const totalSalesmen = salesmen.filter(s => s.status === 'active').length;

  // Top salesmen by revenue
  const salesmanRevenue = sales.reduce((acc, sale) => {
    const existing = acc.find(s => s.id === sale.salesmanId);
    if (existing) {
      existing.revenue += sale.totalAmount;
      existing.count += 1;
    } else {
      acc.push({
        id: sale.salesmanId,
        name: sale.salesmanName,
        revenue: sale.totalAmount,
        count: 1
      });
    }
    return acc;
  }, [] as Array<{ id: string; name: string; revenue: number; count: number }>);

  const topSalesmen = salesmanRevenue
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Top products by quantity sold
  const productSales = sales.reduce((acc, sale) => {
    sale.items.forEach(item => {
      const existing = acc.find(p => p.id === item.productId);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += item.total;
      } else {
        acc.push({
          id: item.productId,
          name: item.productName,
          code: item.productCode,
          quantity: item.quantity,
          revenue: item.total
        });
      }
    });
    return acc;
  }, [] as Array<{ id: string; name: string; code: string; quantity: number; revenue: number }>);

  const topProducts = productSales
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Monthly sales data for chart (last 6 months)
  const monthlySales = sales.reduce((acc, sale) => {
    const date = new Date(sale.date);
    const monthYear = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
    const existing = acc.find(m => m.month === monthYear);
    if (existing) {
      existing.revenue += sale.totalAmount;
      existing.count += 1;
    } else {
      acc.push({ month: monthYear, revenue: sale.totalAmount, count: 1 });
    }
    return acc;
  }, [] as Array<{ month: string; revenue: number; count: number }>);

  const chartData = monthlySales.slice(-6).reverse();

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="opacity-90">Total Pendapatan</span>
            <DollarSign className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-3xl mb-1">Rp {(totalRevenue / 1000000).toFixed(1)}Jt</p>
          <p className="text-sm opacity-80">Rp {totalRevenue.toLocaleString('id-ID')}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="opacity-90">Total Transaksi</span>
            <ShoppingCart className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-3xl mb-1">{totalTransactions}</p>
          <p className="text-sm opacity-80">Transaksi tercatat</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="opacity-90">Produk Aktif</span>
            <Package className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-3xl mb-1">{totalProducts}</p>
          <p className="text-sm opacity-80">Item dalam katalog</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="opacity-90">Salesman Aktif</span>
            <Users className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-3xl mb-1">{totalSalesmen}</p>
          <p className="text-sm opacity-80">Salesman terdaftar</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Trend Penjualan (6 Bulan Terakhir)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`}
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Pendapatan" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-green-600" />
            Jumlah Transaksi per Bulan
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#10b981" name="Transaksi" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Salesmen */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Top 5 Salesman
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">NO</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">SALESMAN</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">TRANSAKSI</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {topSalesmen.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      Belum ada data penjualan
                    </td>
                  </tr>
                ) : (
                  topSalesmen.map((salesman, index) => (
                    <tr 
                      key={salesman.id} 
                      className={index % 2 === 0 ? 'bg-blue-50' : 'bg-white'}
                    >
                      <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{salesman.name}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">{salesman.count}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {salesman.revenue.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {topSalesmen.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold">Total</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">
                      {topSalesmen.reduce((sum, s) => sum + s.revenue, 0).toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            Top 5 Produk Terlaris
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">NO</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">PRODUK</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">TERJUAL</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      Belum ada data penjualan
                    </td>
                  </tr>
                ) : (
                  topProducts.map((product, index) => (
                    <tr 
                      key={product.id}
                      className={index % 2 === 0 ? 'bg-green-50' : 'bg-white'}
                    >
                      <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{product.name}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">{product.quantity}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {product.revenue.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {topProducts.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold">Total</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">
                      {topProducts.reduce((sum, p) => sum + p.revenue, 0).toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
