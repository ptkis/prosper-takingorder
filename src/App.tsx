import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { ProductList } from './components/ProductList';
import { SalesHistory } from './components/SalesHistory';
import { Login } from './components/Login';
import { SalesmanList } from './components/SalesmanList';
import { SalesEntryModal } from './components/SalesEntryModal';
import { ManageUsers } from './components/ManageUsers';
import { LocationManagement } from './components/LocationManagement';
import { CustomerManagement } from './components/CustomerManagement';
import { UserProfile } from './components/UserProfile';
import { AddProductModal } from './components/AddProductModal';
import type { Salesman } from './components/SalesmanList';
import type { Location } from './components/AddProductModal';
import { LayoutDashboard, Package, ShoppingCart, Loader2, LogOut, Users, Shield, MapPin, UserCircle, Building2, Menu, ChevronDown } from 'lucide-react';
import { API_URL } from './utils/api';
import { useIsMobile } from './components/ui/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './components/ui/dropdown-menu';

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
  customerId?: string;
  customerName: string;
  date: string;
  items: SaleItem[];
  totalAmount: number;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
  created_at?: string;
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sales' | 'products' | 'salesmen' | 'users' | 'locations' | 'customers' | 'profile'>('dashboard');
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('orderapp_token'));
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);

  const canAccessTab = (tab: string) => {
    if (userRole === 'admin') return true;
    return ['dashboard', 'sales', 'products', 'profile'].includes(tab);
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpenMobile((open) => !open);
    } else {
      setSidebarCollapsed((collapsed) => !collapsed);
    }
  };

  const closeMobileSidebar = () => setSidebarOpenMobile(false);

  useEffect(() => {
    if (!isMobile) {
      setSidebarOpenMobile(false);
    }
  }, [isMobile]);

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

  useEffect(() => {
    if (!user) return;
    if (!canAccessTab(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [activeTab, userRole, user]);

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

      // Load customers
      try {
        const customersRes = await fetch(`${API_URL}/customers`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (customersRes.ok) {
          const customersData = await customersRes.json();
          const normalizedCustomers = (customersData.customers || []).map((c: any) => ({
            id: c.id,
            code: c.code,
            name: c.name,
            phone: c.phone || '',
            address: c.address || '',
            status: c.status || 'active',
            created_at: c.created_at
          }));
          setCustomers(normalizedCustomers);
        } else {
          console.log('Customers endpoint not available yet');
          setCustomers([]);
        }
      } catch (customersErr) {
        console.log('Customers feature not available:', customersErr);
        setCustomers([]);
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

  // Customer CRUD handlers (admin only UI)
  const handleAddCustomer = async (customer: Omit<Customer, 'id'>): Promise<boolean> => {
    if (!authToken) return false;
    try {
      const response = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customer)
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Gagal menambah customer');
        return false;
      }

      await loadData();
      alert('Customer berhasil ditambahkan');
      return true;
    } catch (err) {
      console.error('Error adding customer:', err);
      alert('Gagal menambah customer');
      return false;
    }
  };

  const handleUpdateCustomer = async (id: string, customer: Omit<Customer, 'id'>): Promise<boolean> => {
    if (!authToken) return false;
    try {
      const response = await fetch(`${API_URL}/customers/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customer)
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Gagal mengupdate customer');
        return false;
      }

      await loadData();
      alert('Customer berhasil diupdate');
      return true;
    } catch (err) {
      console.error('Error updating customer:', err);
      alert('Gagal mengupdate customer');
      return false;
    }
  };

  const handleDeleteCustomer = async (id: string): Promise<boolean> => {
    if (!authToken) return false;
    try {
      const response = await fetch(`${API_URL}/customers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        alert('Gagal menghapus customer');
        return false;
      }

      await loadData();
      alert('Customer berhasil dihapus');
      return true;
    } catch (err) {
      console.error('Error deleting customer:', err);
      alert('Gagal menghapus customer');
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

  const pageTitle =
    activeTab === 'dashboard' ? 'Dashboard' :
    activeTab === 'sales' ? 'Penjualan' :
    activeTab === 'products' ? 'Daftar Produk' :
    activeTab === 'salesmen' ? 'Daftar Salesman' :
    activeTab === 'users' ? 'Manajemen User' :
    activeTab === 'locations' ? 'Manajemen Lokasi' :
    activeTab === 'customers' ? 'Customer' :
    activeTab === 'profile' ? 'Profil Pengguna' :
    'Taking Order System';

  const showSidebarLabels = isMobile || !sidebarCollapsed;
  const sidebarWidth = isMobile ? 260 : (sidebarCollapsed ? 56 : 240);

  const goToTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (isMobile) closeMobileSidebar();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {isMobile && sidebarOpenMobile && (
        <div
          onClick={closeMobileSidebar}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: 10,
          }}
        />
      )}

      <aside
        className="bg-white shadow-md"
        style={{
          position: isMobile ? 'fixed' : 'relative',
          top: isMobile ? 0 : undefined,
          bottom: isMobile ? 0 : undefined,
          left: isMobile ? 0 : undefined,
          width: sidebarWidth,
          minHeight: isMobile ? undefined : '100vh',
          transform: isMobile ? `translateX(${sidebarOpenMobile ? 0 : -sidebarWidth}px)` : undefined,
          transition: isMobile ? 'transform 200ms ease' : 'width 200ms ease',
          zIndex: isMobile ? 20 : undefined,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="px-4 py-4 border-b flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <ShoppingCart className="w-5 h-5" />
          </div>
          {showSidebarLabels && (
            <div>
              <p className="text-sm">Taking Order</p>
              <p className="text-xs text-gray-500">Sales System</p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          <button
            onClick={() => goToTab('dashboard')}
            className={`w-full flex items-center ${showSidebarLabels ? 'gap-3' : 'justify-center'} px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            {showSidebarLabels && <span>Dashboard</span>}
          </button>

          <button
            onClick={() => goToTab('sales')}
            className={`w-full flex items-center ${showSidebarLabels ? 'gap-3' : 'justify-center'} px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'sales' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            {showSidebarLabels && <span>Penjualan</span>}
          </button>

          <button
            onClick={() => goToTab('products')}
            className={`w-full flex items-center ${showSidebarLabels ? 'gap-3' : 'justify-center'} px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'products' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Package className="w-5 h-5" />
            {showSidebarLabels && <span>Produk</span>}
          </button>

          {userRole === 'admin' && (
            <>
              <div className="border-t mt-4 mb-4" />

              <button
                onClick={() => goToTab('salesmen')}
                className={`w-full flex items-center ${showSidebarLabels ? 'gap-3' : 'justify-center'} px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'salesmen' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Users className="w-5 h-5" />
                {showSidebarLabels && <span>Salesman</span>}
              </button>

              <button
                onClick={() => goToTab('users')}
                className={`w-full flex items-center ${showSidebarLabels ? 'gap-3' : 'justify-center'} px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'users' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Shield className="w-5 h-5" />
                {showSidebarLabels && <span>User</span>}
              </button>

              <button
                onClick={() => goToTab('locations')}
                className={`w-full flex items-center ${showSidebarLabels ? 'gap-3' : 'justify-center'} px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'locations' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <MapPin className="w-5 h-5" />
                {showSidebarLabels && <span>Lokasi</span>}
              </button>

              <button
                onClick={() => goToTab('customers')}
                className={`w-full flex items-center ${showSidebarLabels ? 'gap-3' : 'justify-center'} px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'customers' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Building2 className="w-5 h-5" />
                {showSidebarLabels && <span>Customer</span>}
              </button>
            </>
          )}

          <div className="border-t mt-4 mb-4" />

          <button
            onClick={() => goToTab('profile')}
            className={`w-full flex items-center ${showSidebarLabels ? 'gap-3' : 'justify-center'} px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'profile' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <UserCircle className="w-5 h-5" />
            {showSidebarLabels && <span>Profil</span>}
          </button>
        </div>

        <div className="border-t px-2 py-3">
          <button
            onClick={() => {
              handleLogout();
              closeMobileSidebar();
            }}
            className={`w-full flex items-center ${showSidebarLabels ? 'gap-3' : 'justify-center'} px-3 py-2 rounded-lg transition-colors text-red-600 hover:bg-red-50`}
          >
            <LogOut className="w-5 h-5" />
            {showSidebarLabels && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1">
        <header className="bg-white border-b shadow-sm sticky top-0 z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Toggle sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <p className="text-sm text-gray-900">{pageTitle}</p>
                <p className="text-xs text-gray-500">Sistem Pencatatan Penjualan Salesman</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-100 transition-colors"
                  aria-label="User menu"
                  type="button"
                >
                  <div className="text-right">
                    <p className="text-sm text-gray-900">{user.name || user.email}</p>
                    <p className="text-xs text-gray-500">{userRole === 'admin' ? 'Administrator' : 'User'}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10rem]">
                <DropdownMenuItem onSelect={() => goToTab('profile')}>
                  <UserCircle className="w-4 h-4" />
                  Profil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => {
                    handleLogout();
                    closeMobileSidebar();
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="px-4 py-6">
          <div className="mx-auto w-full max-w-6xl">
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
            {activeTab === 'customers' && userRole === 'admin' && (
              <CustomerManagement
                customers={customers}
                onAdd={handleAddCustomer}
                onUpdate={handleUpdateCustomer}
                onDelete={handleDeleteCustomer}
              />
            )}
            {activeTab === 'profile' && (
              <UserProfile user={user} userRole={userRole} authToken={authToken} onUpdate={refreshMe} />
            )}
          </div>
        </main>

        {showSalesModal && (
          <SalesEntryModal
            products={products}
            salesmen={salesmen}
            customers={customers}
            onSaleSubmit={handleSaleSubmit}
            onClose={() => setShowSalesModal(false)}
          />
        )}

        {showAddProductModal && (
          <AddProductModal
            onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
            editProduct={editingProduct}
            locations={locations}
            onClose={() => setShowAddProductModal(false)}
          />
        )}
      </div>
    </div>
  );
}
