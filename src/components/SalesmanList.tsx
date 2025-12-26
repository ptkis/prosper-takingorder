import { useState } from 'react';
import { Users, Plus, Edit2, Trash2, X, Save, Loader2 } from 'lucide-react';

export interface Salesman {
  id: string;
  code: string;
  name: string;
  phone: string;
  area: string;
  status: 'active' | 'inactive';
}

interface SalesmanListProps {
  salesmen: Salesman[];
  onAdd: (salesman: Omit<Salesman, 'id'>) => Promise<boolean>;
  onUpdate: (id: string, salesman: Omit<Salesman, 'id'>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export function SalesmanList({ salesmen, onAdd, onUpdate, onDelete }: SalesmanListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    phone: '',
    area: '',
    status: 'active' as 'active' | 'inactive'
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.name || !formData.phone || !formData.area) {
      alert('Semua field harus diisi');
      return;
    }

    setSaving(true);
    let success = false;

    if (editingId) {
      success = await onUpdate(editingId, formData);
    } else {
      success = await onAdd(formData);
    }

    setSaving(false);

    if (success) {
      resetForm();
    }
  };

  const handleEdit = (salesman: Salesman) => {
    setEditingId(salesman.id);
    setFormData({
      code: salesman.code,
      name: salesman.name,
      phone: salesman.phone,
      area: salesman.area,
      status: salesman.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus salesman ini?')) {
      return;
    }

    await onDelete(id);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      phone: '',
      area: '',
      status: 'active'
    });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredSalesmen = salesmen.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl">Data Salesman</h2>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Salesman
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Cari salesman..."
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">NO</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">KODE</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">NAMA</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">TELEPON</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">AREA</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">STATUS</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredSalesmen.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    {searchTerm ? 'Tidak ada hasil pencarian' : 'Belum ada data salesman'}
                  </td>
                </tr>
              ) : (
                filteredSalesmen.map((salesman, index) => (
                  <tr 
                    key={salesman.id}
                    className={index % 2 === 0 ? 'bg-blue-50' : 'bg-white'}
                  >
                    <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{salesman.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{salesman.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{salesman.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{salesman.area}</td>
                    <td className="px-4 py-3 text-center">
                      {salesman.status === 'active' ? (
                        <span className="inline-flex px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(salesman)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(salesman.id)}
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
            Total Salesman: <strong>{salesmen.length}</strong> | 
            Aktif: <strong>{salesmen.filter(s => s.status === 'active').length}</strong> | 
            Nonaktif: <strong>{salesmen.filter(s => s.status === 'inactive').length}</strong>
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
                  {editingId ? 'Edit Salesman' : 'Tambah Salesman'}
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
                  <label className="block text-gray-700 mb-2">Kode Salesman *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Contoh: SLS001"
                    disabled={saving}
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Nama Lengkap *</label>
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

                <div>
                  <label className="block text-gray-700 mb-2">No. Telepon *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Contoh: 08123456789"
                    disabled={saving}
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Area *</label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Contoh: Jakarta Selatan"
                    disabled={saving}
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={saving}
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
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