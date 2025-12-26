import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { ProductList } from './components/ProductList';
import { SalesHistory } from './components/SalesHistory';
import { Login } from './components/Login';
import { SalesmanList } from './components/SalesmanList';
import { SalesEntryModal } from './components/SalesEntryModal';
import { ManageUsers } from './components/ManageUsers';
import type { Salesman } from './components/SalesmanList';
import { LayoutDashboard, Package, ShoppingCart, Loader2, LogOut, Users, Shield } from 'lucide-react';
import { projectId, publicAnonKey } from './utils/supabase/info';
import { createClient } from '@supabase/supabase-js';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-a0489752`;

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

export interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  stock: number;
  unit: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Sale {
  id: string;
  salesmanName: string;
  salesmanId: string;
  customerName: string;
  date: string;
  items: SaleItem[];
  totalAmount: number;
}

const initialProducts: Product[] = [
  { id: '1', name: 'Mie Instan Goreng', code: 'MIG001', price: 3500, stock: 500, unit: 'pcs' },
  { id: '2', name: 'Mie Instan Kuah', code: 'MIK001', price: 3000, stock: 450, unit: 'pcs' },
  { id: '3', name: 'Kopi Sachet', code: 'KOP001', price: 2000, stock: 800, unit: 'pcs' },
  { id: '4', name: 'Teh Botol', code: 'TEH001', price: 5000, stock: 300, unit: 'botol' },
  { id: '5', name: 'Air Mineral 600ml', code: 'AIR001', price: 3500, stock: 600, unit: 'botol' },
  { id: '6', name: 'Biskuit Kaleng', code: 'BIS001', price: 15000, stock: 150, unit: 'kaleng' },
  { id: '7', name: 'Wafer Coklat', code: 'WAF001', price: 8000, stock: 200, unit: 'pcs' },
  { id: '8', name: 'Keripik Kentang', code: 'KER001', price: 10000, stock: 180, unit: 'pcs' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sales' | 'products' | 'salesmen' | 'users'>('dashboard');
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [showSalesModal, setShowSalesModal] = useState(false);

  // Check for existing session
  useEffect(() => {
    checkSession();
  }, []);

  // Initialize and load data
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        setAccessToken(session.access_token);
        // Get user role from metadata
        const role = session.user.user_metadata?.role || 'user';
        setUserRole(role);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert(error.message);
        return false;
      }

      if (data.session) {
        setUser(data.user);
        setAccessToken(data.session.access_token);
        const role = data.user.user_metadata?.role || 'user';
        setUserRole(role);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      alert('Gagal login. Silakan coba lagi.');
      return false;
    }
  };

  const handleSignup = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, name })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Gagal membuat akun');
        return false;
      }

      alert('Akun berhasil dibuat! Silakan login.');
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      alert('Gagal membuat akun. Silakan coba lagi.');
      return false;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAccessToken(null);
    setUserRole('user');
    setProducts(initialProducts);
    setSales([]);
  };

  // Show login screen if not authenticated
  if (!user) {
    return <Login onLogin={handleLogin} onSignup={handleSignup} />;
  }

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize products if needed
      await fetch(`${API_URL}/init-products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      // Load products
      const productsRes = await fetch(`${API_URL}/products`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      
      if (!productsRes.ok) {
        throw new Error('Failed to load products');
      }
      
      const productsData = await productsRes.json();
      setProducts(productsData.products || initialProducts);

      // Load sales
      const salesRes = await fetch(`${API_URL}/sales`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      
      if (!salesRes.ok) {
        throw new Error('Failed to load sales');
      }
      
      const salesData = await salesRes.json();
      setSales(salesData.sales || []);

      // Load salesmen (optional - don't fail if it doesn't exist yet)
      try {
        const salesmenRes = await fetch(`${API_URL}/salesmen`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        });
        
        if (salesmenRes.ok) {
          const salesmenData = await salesmenRes.json();
          setSalesmen(salesmenData.salesmen || []);
        } else {
          console.log('Salesmen endpoint not available yet');
          setSalesmen([]);
        }
      } catch (salesmenErr) {
        console.log('Salesmen feature not available:', salesmenErr);
        setSalesmen([]);
      }

    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaleSubmit = async (sale: Sale) => {
    try {
      const response = await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sale)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save sale');
      }

      // Reload data to get updated products and sales
      await loadData();
      
      return true;
    } catch (err) {
      console.error('Error saving sale:', err);
      alert(err instanceof Error ? err.message : 'Failed to save sale');
      return false;
    }
  };

  // Salesman CRUD handlers
  const handleAddSalesman = async (salesman: Omit<Salesman, 'id'>): Promise<boolean> => {
    try {
      const newSalesman = {
        id: Date.now().toString(),
        ...salesman
      };

      const response = await fetch(`${API_URL}/salesmen`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSalesman)
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Gagal menambah salesman');
        return false;
      }

      await loadData();
      alert('Salesman berhasil ditambahkan');
      return true;
    } catch (err) {
      console.error('Error adding salesman:', err);
      alert('Gagal menambah salesman');
      return false;
    }
  };

  const handleUpdateSalesman = async (id: string, salesman: Omit<Salesman, 'id'>): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/salesmen/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(salesman)
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Gagal mengupdate salesman');
        return false;
      }

      await loadData();
      alert('Salesman berhasil diupdate');
      return true;
    } catch (err) {
      console.error('Error updating salesman:', err);
      alert('Gagal mengupdate salesman');
      return false;
    }
  };

  const handleDeleteSalesman = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/salesmen/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (!response.ok) {
        alert('Gagal menghapus salesman');
        return false;
      }

      await loadData();
      alert('Salesman berhasil dihapus');
      return true;
    } catch (err) {
      console.error('Error deleting salesman:', err);
      alert('Gagal menghapus salesman');
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800 mb-4">{error}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if user can access the current tab
  const canAccessTab = (tab: string) => {
    if (userRole === 'admin') return true;
    // User biasa hanya bisa akses dashboard, sales, dan products
    return ['dashboard', 'sales', 'products'].includes(tab);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl">Taking Order System</h1>
              <p className="text-blue-100 text-sm">Sistem Pencatatan Penjualan Salesman</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm">{user.user_metadata?.name || user.email}</p>
                <p className="text-xs text-blue-100">
                  {userRole === 'admin' ? 'Administrator' : 'User'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'sales'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              Penjualan
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'products'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package className="w-5 h-5" />
              Daftar Barang
            </button>
            {userRole === 'admin' && (
              <>
                <button
                  onClick={() => setActiveTab('salesmen')}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'salesmen'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  Daftar Salesman
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'users'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  Manajemen User
                </button>
              </>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-4 border-b-2 transition-colors text-red-600 hover:text-red-700 whitespace-nowrap ml-auto"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard sales={sales} products={products} salesmen={salesmen} />
        )}
        {activeTab === 'sales' && (
          <SalesHistory 
            sales={sales} 
            salesmen={salesmen}
            onAddSale={() => setShowSalesModal(true)}
          />
        )}
        {activeTab === 'products' && (
          <ProductList products={products} />
        )}
        {activeTab === 'salesmen' && userRole === 'admin' && (
          <SalesmanList 
            salesmen={salesmen} 
            onAdd={handleAddSalesman} 
            onUpdate={handleUpdateSalesman} 
            onDelete={handleDeleteSalesman} 
          />
        )}
        {activeTab === 'users' && userRole === 'admin' && (
          <ManageUsers onUserUpdated={loadData} />
        )}
      </main>

      {/* Sales Entry Modal */}
      {showSalesModal && (
        <SalesEntryModal
          products={products}
          salesmen={salesmen}
          onSaleSubmit={handleSaleSubmit}
          onClose={() => setShowSalesModal(false)}
        />
      )}
    </div>
  );
}
