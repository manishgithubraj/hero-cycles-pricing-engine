import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getParts, getCategories, calculateQuote, saveQuote } from '../services/api';

export default function PricingEngine() {
  const [categories, setCategories] = useState([]);
  const [parts, setParts] = useState([]);
  const [selectedCat, setSelectedCat] = useState('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState({}); // { part_id: quantity }
  const [quote, setQuote] = useState(null);
  const [margin, setMargin] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saveModal, setSaveModal] = useState(false);
  const [saveForm, setSaveForm] = useState({ quote_name: '', customer_name: '', cycle_model: '', notes: '' });

  useEffect(() => {
    getCategories().then(r => setCategories(r.data));
    getParts().then(r => setParts(r.data));
  }, []);

  const filteredParts = parts.filter(p => {
    const matchCat = selectedCat === 'all' || p.category_id === parseInt(selectedCat);
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.sku.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalInCart = Object.values(cart).reduce((a, b) => a + b, 0);

  const addPart = (partId) => {
    setCart(prev => ({ ...prev, [partId]: (prev[partId] || 0) + 1 }));
  };

  const removePart = (partId) => {
    setCart(prev => {
      const next = { ...prev };
      if (next[partId] > 1) next[partId]--;
      else delete next[partId];
      return next;
    });
  };

  const clearCart = () => { setCart({}); setQuote(null); };

  const handleCalculate = async () => {
    if (Object.keys(cart).length === 0) { toast.error('Add at least one part'); return; }
    setLoading(true);
    try {
      const items = Object.entries(cart).map(([part_id, quantity]) => ({ part_id: parseInt(part_id), quantity }));
      const res = await calculateQuote({ items, margin_percent: parseFloat(margin) || 0 });
      setQuote(res.data);
    } catch {
      toast.error('Failed to calculate quote');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!saveForm.quote_name) { toast.error('Quote name is required'); return; }
    try {
      const items = Object.entries(cart).map(([part_id, quantity]) => ({ part_id: parseInt(part_id), quantity }));
      await saveQuote({ ...saveForm, items, margin_percent: parseFloat(margin) || 0 });
      toast.success('Quote saved successfully!');
      setSaveModal(false);
      setSaveForm({ quote_name: '', customer_name: '', cycle_model: '', notes: '' });
    } catch {
      toast.error('Failed to save quote');
    }
  };

  const getPartById = (id) => parts.find(p => p.id === parseInt(id));

  return (
    <div>
      <div className="page-header">
        <div className="page-title">🧮 Pricing Engine</div>
        <div className="page-sub">Select parts to build a cycle configuration and get instant pricing</div>
      </div>

      <div className="pricing-layout">
        {/* ─── LEFT: Parts Selector ─── */}
        <div>
          {/* Filters */}
          <div className="card mb-4">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
                <span className="search-icon">🔍</span>
                <input className="form-input" placeholder="Search parts by name or SKU…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="form-select" style={{ width: 180 }} value={selectedCat} onChange={e => setSelectedCat(e.target.value)}>
                <option value="all">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {totalInCart > 0 && (
                <button className="btn btn-danger btn-sm" onClick={clearCart}>🗑 Clear All</button>
              )}
            </div>
          </div>

          {/* Category Quick Filter */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <button className={`btn btn-sm ${selectedCat === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSelectedCat('all')}>All</button>
            {categories.map(c => (
              <button key={c.id} className={`btn btn-sm ${selectedCat == c.id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSelectedCat(String(c.id))}>
                {c.name}
              </button>
            ))}
          </div>

          {/* Parts Grid */}
          <div className="parts-grid">
            {filteredParts.map(part => {
              const qty = cart[part.id] || 0;
              return (
                <div key={part.id} className={`part-card ${qty > 0 ? 'selected' : ''}`} onClick={() => addPart(part.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span className={`badge badge-${catColor(part.category?.name)}`} style={{ fontSize: 10 }}>
                      {part.category?.name || 'Other'}
                    </span>
                    {qty > 0 && <span className="badge badge-green">×{qty} ✓</span>}
                  </div>
                  <div className="part-card-name" style={{ marginTop: 8 }}>{part.name}</div>
                  <div className="part-card-sku">{part.sku}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="part-card-price">₹{part.current_price.toLocaleString('en-IN')}</div>
                    {qty > 0 && (
                      <div className="qty-control" onClick={e => e.stopPropagation()}>
                        <button className="qty-btn" onClick={() => removePart(part.id)}>−</button>
                        <span className="qty-value">{qty}</span>
                        <button className="qty-btn" onClick={() => addPart(part.id)}>+</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredParts.length === 0 && (
            <div className="empty-state"><div className="empty-state-icon">🔍</div><div>No parts found</div></div>
          )}
        </div>

        {/* ─── RIGHT: Quote Panel ─── */}
        <div className="quote-panel">
          <div className="card">
            <div className="card-title">💰 Live Quote</div>

            {Object.keys(cart).length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <div className="empty-state-icon">🛒</div>
                <div className="empty-state-text">Click parts to add them</div>
              </div>
            ) : (
              <>
                {Object.entries(cart).map(([partId, qty]) => {
                  const part = getPartById(partId);
                  if (!part) return null;
                  return (
                    <div key={partId} className="quote-item">
                      <div className="quote-item-left">
                        <div className="quote-item-name">{part.name}</div>
                        <div className="quote-item-meta">₹{part.current_price.toLocaleString('en-IN')} × {qty}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="quote-item-price">₹{(part.current_price * qty).toLocaleString('en-IN')}</div>
                        <button className="qty-btn" onClick={() => removePart(parseInt(partId))}>−</button>
                      </div>
                    </div>
                  );
                })}

                <hr className="divider" />

                <div className="form-group">
                  <label className="form-label">Margin % (profit markup)</label>
                  <input
                    type="number"
                    className="form-input"
                    min={0} max={100}
                    value={margin}
                    onChange={e => setMargin(e.target.value)}
                    placeholder="0"
                  />
                </div>

                {/* Live estimated total (before API call) */}
                <div style={{ background: '#f0fff4', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span>Parts subtotal</span>
                    <strong>₹{Object.entries(cart).reduce((sum, [id, qty]) => {
                      const p = getPartById(id); return sum + (p ? p.current_price * qty : 0);
                    }, 0).toLocaleString('en-IN')}</strong>
                  </div>
                  {margin > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4, color: '#718096' }}>
                      <span>Margin ({margin}%)</span>
                      <span>+₹{(Object.entries(cart).reduce((sum, [id, qty]) => {
                        const p = getPartById(id); return sum + (p ? p.current_price * qty : 0);
                      }, 0) * margin / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                  )}
                </div>

                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }} onClick={handleCalculate} disabled={loading}>
                  {loading ? '⏳ Calculating…' : '🧮 Calculate Final Quote'}
                </button>
              </>
            )}

            {/* Quote Result */}
            {quote && (
              <div style={{ marginTop: 16, borderTop: '2px solid #e2e8f0', paddingTop: 16 }}>
                <div className="card-title">📋 Quote Breakdown</div>
                <table style={{ width: '100%', fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th>Part</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.items.map((item, i) => (
                      <tr key={i}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.part_name}</div>
                          <div style={{ color: '#a0aec0', fontSize: 10 }}>{item.sku} · {item.category_name}</div>
                        </td>
                        <td style={{ textAlign: 'right' }}>×{item.quantity}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{item.total_price.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <hr className="divider" />
                <div style={{ fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Subtotal</span><span>₹{quote.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {quote.margin_percent > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#718096' }}>
                      <span>Margin ({quote.margin_percent}%)</span><span>+₹{quote.margin_amount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
                <div className="quote-total">
                  <span>TOTAL</span>
                  <span className="text-green">₹{quote.total.toLocaleString('en-IN')}</span>
                </div>
                <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }} onClick={() => setSaveModal(true)}>
                  💾 Save This Quote
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Quote Modal */}
      {saveModal && (
        <div className="modal-overlay" onClick={() => setSaveModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">💾 Save Quote</div>
            <div className="form-group">
              <label className="form-label">Quote Name *</label>
              <input className="form-input" placeholder="e.g. MTB Config #1" value={saveForm.quote_name} onChange={e => setSaveForm({...saveForm, quote_name: e.target.value})} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <input className="form-input" placeholder="Ravi Kumar" value={saveForm.customer_name} onChange={e => setSaveForm({...saveForm, customer_name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Cycle Model</label>
                <input className="form-input" placeholder="Hero Sprint 26" value={saveForm.cycle_model} onChange={e => setSaveForm({...saveForm, cycle_model: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" placeholder="Any additional notes…" value={saveForm.notes} onChange={e => setSaveForm({...saveForm, notes: e.target.value})} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setSaveModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save Quote</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function catColor(name) {
  const map = { Frame: 'blue', 'Gear Set': 'purple', Tyres: 'orange', Brakes: 'green', Handlebar: 'gray', Saddle: 'blue', Wheels: 'purple', Accessories: 'orange' };
  return map[name] || 'gray';
}
