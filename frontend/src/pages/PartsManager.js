import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getParts, getCategories, createPart, updatePart, deletePart, updatePrice, getPriceHistory } from '../services/api';

export default function PartsManager() {
  const [parts, setParts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [priceModal, setPriceModal] = useState(null);
  const [historyModal, setHistoryModal] = useState(null);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({ name: '', sku: '', category_id: '', current_price: '', description: '', unit: 'piece' });
  const [priceForm, setPriceForm] = useState({ new_price: '', reason: '' });

  const load = () => {
    getParts().then(r => setParts(r.data));
    getCategories().then(r => setCategories(r.data));
  };

  useEffect(() => { load(); }, []);

  const filtered = parts.filter(p => {
    const s = search.toLowerCase();
    return (filterCat === 'all' || p.category_id === parseInt(filterCat)) &&
      (p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
  });

  const handleAdd = async () => {
    if (!form.name || !form.sku || !form.category_id || !form.current_price) {
      toast.error('Fill all required fields'); return;
    }
    try {
      await createPart({ ...form, category_id: parseInt(form.category_id), current_price: parseFloat(form.current_price) });
      toast.success('Part added!');
      setAddModal(false);
      setForm({ name: '', sku: '', category_id: '', current_price: '', description: '', unit: 'piece' });
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to add part');
    }
  };

  const handleEdit = async () => {
    try {
      await updatePart(editModal.id, { name: form.name, description: form.description });
      toast.success('Part updated!');
      setEditModal(null);
      load();
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this part?')) return;
    try {
      await deletePart(id);
      toast.success('Part deactivated');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handlePriceUpdate = async () => {
    if (!priceForm.new_price) { toast.error('Enter new price'); return; }
    try {
      await updatePrice(priceModal.id, { new_price: parseFloat(priceForm.new_price), reason: priceForm.reason });
      toast.success('Price updated with history recorded!');
      setPriceModal(null);
      setPriceForm({ new_price: '', reason: '' });
      load();
    } catch {
      toast.error('Failed to update price');
    }
  };

  const openHistory = async (part) => {
    const res = await getPriceHistory(part.id);
    setHistory(res.data);
    setHistoryModal(part);
  };

  const openEdit = (part) => {
    setForm({ name: part.name, sku: part.sku, category_id: part.category_id, current_price: part.current_price, description: part.description || '', unit: part.unit });
    setEditModal(part);
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <div className="page-title">⚙️ Parts Manager</div>
          <div className="page-sub">Add, edit, and manage all cycle components and their prices</div>
        </div>
        <button className="btn btn-primary" onClick={() => setAddModal(true)}>+ Add Part</button>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
            <span className="search-icon">🔍</span>
            <input className="form-input" placeholder="Search by name or SKU…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-select" style={{ width: 200 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: '#718096' }}>
            {filtered.length} parts found
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Part Name</th><th>SKU</th><th>Category</th>
                <th>Current Price</th><th>Last Updated</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(part => (
                <tr key={part.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{part.name}</div>
                    <div style={{ fontSize: 12, color: '#a0aec0' }}>{part.description?.slice(0, 40)}</div>
                  </td>
                  <td><span className="badge badge-gray">{part.sku}</span></td>
                  <td><span className="badge badge-blue">{part.category?.name}</span></td>
                  <td><strong className="text-green">₹{part.current_price.toLocaleString('en-IN')}</strong></td>
                  <td style={{ fontSize: 12, color: '#718096' }}>{new Date(part.updated_at).toLocaleDateString('en-IN')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-secondary" title="Update Price" onClick={() => { setPriceModal(part); setPriceForm({ new_price: '', reason: '' }); }}>💰</button>
                      <button className="btn btn-sm btn-secondary" title="Price History" onClick={() => openHistory(part)}>📈</button>
                      <button className="btn btn-sm btn-secondary" title="Edit" onClick={() => openEdit(part)}>✏️</button>
                      <button className="btn btn-sm btn-danger" title="Delete" onClick={() => handleDelete(part.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state"><div className="empty-state-icon">⚙️</div><div>No parts found</div></div>
          )}
        </div>
      </div>

      {/* Add Part Modal */}
      {addModal && (
        <div className="modal-overlay" onClick={() => setAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">➕ Add New Part</div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Part Name *</label>
                <input className="form-input" placeholder="e.g. Shimano 7-Speed" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">SKU *</label>
                <input className="form-input" placeholder="e.g. GR-SH-7S" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="form-select" value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Price (₹) *</label>
                <input className="form-input" type="number" placeholder="1200" value={form.current_price} onChange={e => setForm({...form, current_price: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" placeholder="Brief description of this part…" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd}>Add Part</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">✏️ Edit Part — {editModal.sku}</div>
            <div className="form-group">
              <label className="form-label">Part Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setEditModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Update Price Modal */}
      {priceModal && (
        <div className="modal-overlay" onClick={() => setPriceModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">💰 Update Price — {priceModal.name}</div>
            <div style={{ background: '#f0fff4', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <span className="text-muted">Current Price: </span>
              <strong className="text-green">₹{priceModal.current_price.toLocaleString('en-IN')}</strong>
            </div>
            <div className="form-group">
              <label className="form-label">New Price (₹)</label>
              <input className="form-input" type="number" placeholder="Enter new price" value={priceForm.new_price} onChange={e => setPriceForm({...priceForm, new_price: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Reason for change</label>
              <input className="form-input" placeholder="e.g. Supplier rate revision Jan 2025" value={priceForm.reason} onChange={e => setPriceForm({...priceForm, reason: e.target.value})} />
            </div>
            {priceForm.new_price && (
              <div style={{ fontSize: 13, color: parseFloat(priceForm.new_price) > priceModal.current_price ? '#c53030' : '#276749', marginBottom: 12 }}>
                {parseFloat(priceForm.new_price) > priceModal.current_price ? '↑ Price increase' : '↓ Price decrease'} of ₹{Math.abs(parseFloat(priceForm.new_price) - priceModal.current_price).toLocaleString('en-IN')}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setPriceModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handlePriceUpdate}>Update Price</button>
            </div>
          </div>
        </div>
      )}

      {/* Price History Modal */}
      {historyModal && (
        <div className="modal-overlay" onClick={() => setHistoryModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">📈 Price History — {historyModal.name}</div>
            {history.length === 0 ? (
              <div className="empty-state">No price changes recorded yet</div>
            ) : (
              <table>
                <thead><tr><th>Date</th><th>Old Price</th><th>New Price</th><th>Change</th><th>Reason</th></tr></thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.id}>
                      <td style={{ fontSize: 12 }}>{new Date(h.changed_at).toLocaleDateString('en-IN')}</td>
                      <td>₹{h.old_price.toLocaleString('en-IN')}</td>
                      <td><strong>₹{h.new_price.toLocaleString('en-IN')}</strong></td>
                      <td className={h.new_price > h.old_price ? 'price-change-positive' : 'price-change-negative'}>
                        {h.new_price > h.old_price ? '▲' : '▼'} ₹{Math.abs(h.new_price - h.old_price).toLocaleString('en-IN')}
                      </td>
                      <td style={{ fontSize: 12, color: '#718096' }}>{h.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setHistoryModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
