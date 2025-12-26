import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, X, Save, Loader2, Shield, User } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-a0489752`;

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  created_at: string;
}

interface ManageUsersProps {
  onUserUpdated?: () => void;
}

export function ManageUsers({ onUserUpdated }: ManageUsersProps) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'user' as 'admin' | 'user'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.name || (!editingId && !formData.password)) {
      alert('Semua field harus diisi');
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        // Update user
        const response = await fetch(`${API_URL}/users/${editingId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: formData.name,
            role: formData.role
          })
        });

        if (!response.ok) {
          const data = await response.json();
          alert(data.error || 'Gagal mengupdate user');
          return;
        }

        alert('User berhasil diupdate');
      } else {
        // Add new user
        const response = await fetch(`${API_URL}/users`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          const data = await response.json();
          alert(data.error || 'Gagal menambah user');
          return;
        }

        alert('User berhasil ditambahkan');
      }

      await loadUsers();
      if (onUserUpdated) onUserUpdated();
      resetForm();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Gagal menyimpan user');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user: AppUser) => {
    setEditingId(user.id);
    setFormData({
      email: user.email,
      name: user.name,
      password: '',
      role: user.role
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (!response.ok) {
        alert('Gagal menghapus user');
        return;
      }

      alert('User berhasil dihapus');
      await loadUsers();
      if (onUserUpdated) onUserUpdated();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Gagal menghapus user');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      password: '',
      role: 'user'
    });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Memuat data user...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl">Manajemen User</h2>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tambah User
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Cari user..."
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">NAMA</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">EMAIL</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">ROLE</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    {searchTerm ? 'Tidak ada hasil pencarian' : 'Belum ada data user'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr 
                    key={user.id}
                    className={index % 2 === 0 ? 'bg-blue-50' : 'bg-white'}
                  >
                    <td className="px-4 py-3 text-sm text-gray-900">{user.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{user.email}</td>
                    <td className="px-4 py-3 text-center">
                      {user.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                          <Shield className="w-3 h-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                          <User className="w-3 h-3" />
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-gray-700 text-sm">
            Total User: <strong>{users.length}</strong> | 
            Admin: <strong>{users.filter(u => u.role === 'admin').length}</strong> | 
            User Biasa: <strong>{users.filter(u => u.role === 'user').length}</strong>
          </p>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl">
                  {editingId ? 'Edit User' : 'Tambah User'}
                </h3>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={saving}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2 text-sm">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="user@example.com"
                    disabled={saving || !!editingId}
                    required
                  />
                  {editingId && (
                    <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 mb-2 text-sm">Nama Lengkap *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Masukkan nama lengkap"
                    disabled={saving}
                    required
                  />
                </div>

                {!editingId && (
                  <div>
                    <label className="block text-gray-700 mb-2 text-sm">Password *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Minimal 6 karakter"
                      disabled={saving}
                      minLength={6}
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-gray-700 mb-2 text-sm">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={saving}
                  >
                    <option value="user">User Biasa</option>
                    <option value="admin">Admin</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Admin dapat mengakses semua fitur. User biasa hanya dapat mengakses Dashboard, Penjualan, dan Daftar Barang.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={saving}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Simpan
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
