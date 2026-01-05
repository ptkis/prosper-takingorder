import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { ProductList } from './components/ProductList';
import { SalesHistory } from './components/SalesHistory';
import { Login } from './components/Login';
import { SalesmanList } from './components/SalesmanList';
import { SalesEntryModal } from './components/SalesEntryModal';
import { ManageUsers } from './components/ManageUsers';
import { LocationManagement } from './components/LocationManagement';
import { UserProfile } from './components/UserProfile';
import { AddProductModal } from './components/AddProductModal';
import type { Salesman } from './components/SalesmanList';
import type { Location } from './components/AddProductModal';
import { LayoutDashboard, Package, ShoppingCart, Loader2, LogOut, Users, Shield, MapPin, UserCircle } from 'lucide-react';
import { API_URL } from './utils/api';

export interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  stock: number;
  unit: string;
  locationId?: string;
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sales' | 'products' | 'salesmen' | 'users' | 'locations' | 'profile'>('dashboard');
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('orderapp_token'));
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);

  const refreshMe = async (): Promise<boolean> => {
    if (!authToken) return false;
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setUserRole(data.user.role || 'user');
        return true;
      }
      localStorage.removeItem('orderapp_token');
      setAuthToken(null);
      setUser(null);
      setUserRole('user');
      return false;
    } catch (error) {
      console.error('Error checking session:', error);
      return false;
    }
  };

  // Check for existing session
  useEffect(() => {
    const loadSession = async () => {
      if (!authToken) {
        setLoading(false);
        return;
      }
      try {
        await refreshMe();
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, [authToken]);

  // Initialize and load data
  useEffect(() => {
    if (user && authToken) {
      loadData();
    }
  }, [user, authToken]);

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Gagal login');
        return false;
      }

      setUser(data.user);
      setUserRole(data.user.role || 'user');
      setAuthToken(data.token);
      localStorage.setItem('orderapp_token', data.token);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      alert('Gagal login. Silakan coba lagi.');
      return false;
    }
  };

  const handleSignup = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, name })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Gagal membuat akun');
        return false;
      }

      setUser(data.user);
      setUserRole(data.user.role || 'user');
      setAuthToken(data.token);
      localStorage.setItem('orderapp_token', data.token);
      alert('Akun berhasil dibuat!');
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      alert('Gagal membuat akun. Silakan coba lagi.');
      return false;
    }
  };

  const handleLogout = async () => {
    if (authToken) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` }
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    localStorage.removeItem('orderapp_token');
    setUser(null);
    setAuthToken(null);
    setUserRole('user');
    setProducts(initialProducts);
    setSales([]);
  };

  const loadData = async () => {
    if (!authToken) {
      return;
    }
    try {
      setLoading(true);
      setError(null);

      // Initialize products if needed
      await fetch(`${API_URL}/init-products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      // Load products
      const productsRes = await fetch(`${API_URL}/products`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (!productsRes.ok) {
        throw new Error('Failed to load products');
      }
      
      const productsData = await productsRes.json();
      const normalizedProducts = (productsData.products || initialProducts).map((p: any) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        price: Number(p.price) || 0,
        stock: Number(p.stock) || 0,
        unit: p.unit || 'pcs',
        locationId: p.locationId ?? p.location_id ?? undefined
      }));
      setProducts(normalizedProducts);

      // Load sales
      const salesRes = await fetch(`${API_URL}/sales`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (!salesRes.ok) {
        throw new Error('Failed to load sales');
      }
      
      const salesData = await salesRes.json();
      const normalizedSales = (salesData.sales || []).map((s: any) => ({
        id: s.id,
        salesmanName: s.salesmanName ?? s.salesman_name ?? '',
        salesmanId: s.salesmanId ?? s.salesman_id ?? '',
        customerName: s.customerName ?? s.customer_name ?? '',
        date: s.date,
        totalAmount: Number(s.totalAmount ?? s.total_amount ?? 0),
        items: (s.items || []).map((i: any) => ({
          productId: i.productId ?? i.product_id ?? '',
          productName: i.productName ?? i.product_name ?? '',
          productCode: i.productCode ?? i.product_code ?? '',
          quantity: Number(i.quantity) || 0,
          price: Number(i.price) || 0,
          total: Number(i.total) || Number(i.price || 0) * Number(i.quantity || 0)
        }))
      }));
      setSales(normalizedSales);

      // Load salesmen (optional - don't fail if it doesn't exist yet)
      try {
        const salesmenRes = await fetch(`${API_URL}/salesmen`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (salesmenRes.ok) {
          const salesmenData = await salesmenRes.json();
          const normalizedSalesmen = (salesmenData.salesmen || []).map((s: any) => ({
            ...s,
            status: s.status || 'active'
          }));
          setSalesmen(normalizedSalesmen);
        } else {
          console.log('Salesmen endpoint not available yet');
          setSalesmen([]);
        }
      } catch (salesmenErr) {
        console.log('Salesmen feature not available:', salesmenErr);
        setSalesmen([]);
      }

      // Load locations (optional - don't fail if it doesn't exist yet)
      try {
        const locationsRes = await fetch(`${API_URL}/locations`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (locationsRes.ok) {
          const locationsData = await locationsRes.json();
          setLocations(locationsData.locations || []);
        } else {
          console.log('Locations endpoint not available yet');
          setLocations([]);
        }
      } catch (locationsErr) {
        console.log('Locations feature not available:', locationsErr);
        setLocations([]);
      }

    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaleSubmit = async (sale: Sale) => {
    if (!authToken) return false;
    try {
      const response = await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
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
    if (!authToken) return false;
    try {
      const newSalesman = {
        id: Date.now().toString(),
        ...salesman
      };

      const response = await fetch(`${API_URL}/salesmen`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
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
    if (!authToken) return false;
    try {
      const response = await fetch(`${API_URL}/salesmen/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
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
    if (!authToken) return false;
    try {
      const response = await fetch(`${API_URL}/salesmen/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
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

  // Product CRUD handlers
  const handleAddProduct = async (productData: any): Promise<boolean> => {
    if (!authToken) return false;
    try {
      const newProduct = {
        id: Date.now().toString(),
        ...productData
      };

      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newProduct)
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Gagal menambah produk');
        return false;
      }

      await loadData();
      alert('Produk berhasil ditambahkan');
      return true;
    } catch (err) {
      console.error('Error adding product:', err);
      alert('Gagal menambah produk');
      return false;
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowAddProductModal(true);
  };

  const handleUpdateProduct = async (productData: any): Promise<boolean> => {
    if (!editingProduct) return false;
    if (!authToken) return false;
    
    try {
      const response = await fetch(`${API_URL}/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Gagal mengupdate produk');
        return false;
      }

      await loadData();
      setEditingProduct(undefined);
      alert('Produk berhasil diupdate');
      return true;
    } catch (err) {
      console.error('Error updating product:', err);
      alert('Gagal mengupdate produk');
      return false;
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!authToken) return;
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        alert('Gagal menghapus produk');
        return;
      }

      await loadData();
      alert('Produk berhasil dihapus');
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Gagal menghapus produk');
    }
  };

  // Location CRUD handlers
  const handleAddLocation = async (location: Omit<Location, 'id'>): Promise<boolean> => {
    if (!authToken) return false;
    try {
      const newLocation = {
        id: Date.now().toString(),
        ...location
      };

      const response = await fetch(`${API_URL}/locations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newLocation)
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Gagal menambah lokasi');
        return false;
      }

      await loadData();
      alert('Lokasi berhasil ditambahkan');
      return true;
    } catch (err) {
      console.error('Error adding location:', err);
      alert('Gagal menambah lokasi');
      return false;
    }
  };

  const handleUpdateLocation = async (id: string, location: Omit<Location, 'id'>): Promise<boolean> => {
    if (!authToken) return false;
    try {
      const response = await fetch(`${API_URL}/locations/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(location)
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Gagal mengupdate lokasi');
        return false;
      }

      await loadData();
      alert('Lokasi berhasil diupdate');
      return true;
    } catch (err) {
      console.error('Error updating location:', err);
      alert('Gagal mengupdate lokasi');
      return false;
    }
  };

  const handleDeleteLocation = async (id: string): Promise<boolean> => {
    if (!authToken) return false;
    try {
      const response = await fetch(`${API_URL}/locations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        alert('Gagal menghapus lokasi');
        return false;
      }

      await loadData();
      alert('Lokasi berhasil dihapus');
      return true;
    } catch (err) {
      console.error('Error deleting location:', err);
      alert('Gagal menghapus lokasi');
      return false;
    }
  };

  // Show login screen if not authenticated
  if (!user) {
    return <Login onLogin={handleLogin} onSignup={handleSignup} />;
  }

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
    return ['dashboard', 'sales', 'products', 'profile'].includes(tab);
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
                <p className="text-sm">{user.name || user.email}</p>
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
                <button
                  onClick={() => setActiveTab('locations')}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === 'locations'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <MapPin className="w-5 h-5" />
                  Manajemen Lokasi
                </button>
              </>
            )}
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserCircle className="w-5 h-5" />
              Profil Pengguna
            </button>
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
          <ProductList 
            products={products}
            locations={locations}
            onAddProduct={() => setShowAddProductModal(true)}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
          />
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
          <ManageUsers onUserUpdated={loadData} authToken={authToken} />
        )}
        {activeTab === 'locations' && userRole === 'admin' && (
          <LocationManagement 
            locations={locations}
            onAdd={handleAddLocation}
            onUpdate={handleUpdateLocation}
            onDelete={handleDeleteLocation}
          />
        )}
        {activeTab === 'profile' && (
          <UserProfile user={user} userRole={userRole} authToken={authToken} onUpdate={refreshMe} />
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

      {/* Add Product Modal */}
      {showAddProductModal && (
        <AddProductModal
          onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
          editProduct={editingProduct}
          locations={locations}
          onClose={() => setShowAddProductModal(false)}
        />
      )}
    </div>
  );
}
