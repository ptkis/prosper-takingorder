import { useEffect, useState } from 'react';
import { User, Mail, Shield, Calendar, Save, Loader2 } from 'lucide-react';
import { API_URL } from '../utils/api';

interface UserProfileProps {
  user: any;
  userRole: 'admin' | 'user';
  authToken: string | null;
  onUpdate?: () => void | Promise<void>;
}

export function UserProfile({ user, userRole, authToken, onUpdate }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    newPassword: '',
    confirmPassword: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, name: user.name || '' }));
  }, [user?.name]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authToken) {
      alert('Anda belum login');
      return;
    }
    if (!formData.name.trim()) {
      alert('Nama tidak boleh kosong');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: formData.name })
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Gagal mengupdate profil');
        return;
      }

      alert('Profil berhasil diupdate');
      setIsEditing(false);
      if (onUpdate) await onUpdate();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Gagal mengupdate profil');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authToken) {
      alert('Anda belum login');
      return;
    }
    if (!formData.newPassword || !formData.confirmPassword) {
      alert('Password baru harus diisi');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      alert('Password baru tidak sama');
      return;
    }

    if (formData.newPassword.length < 6) {
      alert('Password minimal 6 karakter');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: formData.newPassword })
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Gagal mengubah password');
        return;
      }

      alert('Password berhasil diubah');
      setFormData({
        ...formData,
        newPassword: '',
        confirmPassword: ''
      });
      if (onUpdate) await onUpdate();
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Gagal mengubah password');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid gap-6">
        {/* Profile Information Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl">Informasi Profil</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-600 mt-1" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-gray-900">{user.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 text-gray-600 mt-1" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Nama</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={saving}
                  />
                ) : (
                  <p className="text-gray-900">{user.name || '-'}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <Shield className="w-5 h-5 text-gray-600 mt-1" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Role</p>
                <div className="mt-1">
                  {userRole === 'admin' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                      <Shield className="w-3 h-3" />
                      Administrator
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                      <User className="w-3 h-3" />
                      User Biasa
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-600 mt-1" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Bergabung Sejak</p>
                <p className="text-gray-900">{formatDate(user.created_at)}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({ ...formData, name: user.name || '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={saving}
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleUpdateProfile}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
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
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Profil
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg mb-4">Ubah Password</h3>
          
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2 text-sm">Password Baru *</label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Minimal 6 karakter"
                disabled={saving}
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2 text-sm">Konfirmasi Password Baru *</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ulangi password baru"
                disabled={saving}
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-gray-400"
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
                  Ubah Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
