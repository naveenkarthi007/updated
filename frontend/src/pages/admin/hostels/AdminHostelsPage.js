import React, { useEffect, useState, useCallback } from 'react';
import { hostelsAPI, usersAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import { Building2, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { Spinner } from '../../../components/ui';

const GENDER_LABELS = { MALE: 'Boys Hostel', FEMALE: 'Girls Hostel', COED: 'Co-ed Hostel' };
const GENDER_COLORS = {
  MALE:   'bg-blue-50 text-blue-700 border border-blue-200',
  FEMALE: 'bg-pink-50 text-pink-700 border border-pink-200',
  COED:   'bg-purple-50 text-purple-700 border border-purple-200',
};

const emptyForm = { name: '', block_code: '', gender: 'MALE', total_rooms: '', warden_id: '' };

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-2xl border border-brand-border/60 shadow-sm p-5 text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-1">{label}</p>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function HostelModal({ hostel, wardens, onSave, onClose }) {
  const [form, setForm] = useState(hostel || emptyForm);
  const [saving, setSaving] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Hostel name is required');
    setSaving(true);
    try {
      await onSave({ ...form, total_rooms: Number(form.total_rooms) || 0, warden_id: form.warden_id || null });
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border/60">
          <h2 className="text-base font-bold text-gray-900">{hostel ? 'Edit Hostel' : 'Add New Hostel'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handle} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Hostel Name *</label>
            <input
              required value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Sri Ramanujan Block"
              className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Block Code</label>
              <input
                value={form.block_code} onChange={e => setForm({ ...form, block_code: e.target.value })}
                placeholder="A, B, C…"
                className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Gender</label>
              <select
                value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}
                className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              >
                <option value="MALE">Boys Hostel</option>
                <option value="FEMALE">Girls Hostel</option>
                <option value="COED">Co-ed</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Total Rooms</label>
              <input
                type="number" min="0" value={form.total_rooms}
                onChange={e => setForm({ ...form, total_rooms: e.target.value })}
                className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Assign Warden</label>
              <select
                value={form.warden_id || ''} onChange={e => setForm({ ...form, warden_id: e.target.value })}
                className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              >
                <option value="">— None —</option>
                {wardens.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary/90 disabled:opacity-60 transition-colors"
            >
              {saving ? <Spinner size="sm" /> : <Check className="h-4 w-4" />}
              {hostel ? 'Save Changes' : 'Add Hostel'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-brand-border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminHostelsPage() {
  const [hostels,     setHostels]     = useState([]);
  const [wardens,     setWardens]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [editHostel,  setEditHostel]  = useState(null);
  const [deleteId,    setDeleteId]    = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [hRes, wRes] = await Promise.all([
        hostelsAPI.getAll(),
        usersAPI.getAll({ role: 'warden', limit: 100 }),
      ]);
      setHostels(hRes.data.hostels || []);
      setWardens(wRes.data.data || []);
    } catch { toast.error('Failed to load hostels'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSave = async (form) => {
    if (editHostel) {
      await hostelsAPI.update(editHostel.id, form);
      toast.success('Hostel updated!');
    } else {
      await hostelsAPI.create(form);
      toast.success('Hostel added!');
    }
    setEditHostel(null);
    fetchAll();
  };

  const handleDelete = async (id) => {
    try {
      await hostelsAPI.delete(id);
      toast.success('Hostel removed');
      setDeleteId(null);
      fetchAll();
    } catch {}
  };

  const maleHostels   = hostels.filter(h => h.gender === 'MALE');
  const femaleHostels = hostels.filter(h => h.gender === 'FEMALE');
  const coedHostels   = hostels.filter(h => h.gender === 'COED');
  const totalRooms    = hostels.reduce((s, h) => s + (h.actual_room_count || 0), 0);

  if (loading) return (
    <div className="flex items-center justify-center h-60">
      <Spinner size="lg" className="text-brand-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hostels Management</h1>
          <p className="text-sm text-brand-muted mt-0.5">Manage hostel blocks and their warden assignments</p>
        </div>
        <button
          onClick={() => { setEditHostel(null); setShowModal(true); }}
          className="flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Hostel
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Hostels"  value={hostels.length}        color="text-gray-900" />
        <StatCard label="Boys Hostels"   value={maleHostels.length}    color="text-blue-600" />
        <StatCard label="Girls Hostels"  value={femaleHostels.length}  color="text-pink-600" />
        <StatCard label="Total Rooms"    value={totalRooms}            color="text-green-600"/>
      </div>

      {/* Hostel Cards */}
      {hostels.length === 0 ? (
        <div className="bg-white rounded-2xl border border-brand-border/60 shadow-sm p-14 text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-200" />
          <p className="text-sm font-semibold text-gray-600">No hostels added yet</p>
          <p className="text-xs text-brand-muted mt-1">Click "Add Hostel" to create the first one.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {hostels.map(h => (
            <div key={h.id} className="bg-white rounded-2xl border border-brand-border/60 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-brand-border/40 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{h.name}</p>
                  {h.block_code && (
                    <p className="text-xs text-brand-muted mt-0.5">Block {h.block_code}</p>
                  )}
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ml-2 ${GENDER_COLORS[h.gender] || GENDER_COLORS.COED}`}>
                  {GENDER_LABELS[h.gender] || h.gender}
                </span>
              </div>

              <div className="px-5 py-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-brand-muted">Warden</span>
                  <span className="font-semibold text-gray-800">{h.warden_name || 'Not assigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Total Rooms</span>
                  <span className="font-semibold text-gray-800">{h.total_rooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Actual Rooms</span>
                  <span className="font-semibold text-gray-800">{h.actual_room_count || 0}</span>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-brand-border/40 flex gap-2">
                <button
                  onClick={() => { setEditHostel(h); setShowModal(true); }}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-brand-primary/30 text-brand-primary hover:bg-brand-primary/5 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                {deleteId === h.id ? (
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-red-600 font-semibold">Delete?</span>
                    <button onClick={() => handleDelete(h.id)} className="text-xs font-bold px-2.5 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">Yes</button>
                    <button onClick={() => setDeleteId(null)} className="text-xs font-bold px-2.5 py-1 rounded-lg border border-brand-border text-gray-600 hover:bg-gray-50 transition-colors">No</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteId(h.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors ml-auto"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <HostelModal
          hostel={editHostel}
          wardens={wardens}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditHostel(null); }}
        />
      )}
    </div>
  );
}
