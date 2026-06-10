import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getDashboardStats, getParts, getQuotes } from '../services/api';

const COLORS = ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2', '#b7e4c7'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [parts, setParts] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardStats(), getParts(), getQuotes()])
      .then(([s, p, q]) => {
        setStats(s.data);
        setParts(p.data);
        setQuotes(q.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">⏳ Loading dashboard...</div>;

  // Category distribution for pie chart
  const catMap = {};
  parts.forEach(p => {
    const name = p.category?.name || 'Other';
    catMap[name] = (catMap[name] || 0) + 1;
  });
  const catData = Object.entries(catMap).map(([name, value]) => ({ name, value }));

  // Price range distribution
  const ranges = { '₹0–500': 0, '₹500–1000': 0, '₹1000–2000': 0, '₹2000+': 0 };
  parts.forEach(p => {
    if (p.current_price < 500) ranges['₹0–500']++;
    else if (p.current_price < 1000) ranges['₹500–1000']++;
    else if (p.current_price < 2000) ranges['₹1000–2000']++;
    else ranges['₹2000+']++;
  });
  const priceData = Object.entries(ranges).map(([name, count]) => ({ name, count }));

  // Recent quotes for chart
  const recentQuoteData = (quotes || []).slice(0, 6).reverse().map(q => ({
    name: q.quote_name.slice(0, 12),
    value: q.final_price
  }));

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Dashboard</div>
        <div className="page-sub">Overview of Hero Cycles Pricing Engine</div>
      </div>

      <div className="stats-grid">
        <StatCard icon="⚙️" label="Total Parts" value={stats.total_parts} desc="Active components" color="#2d6a4f" />
        <StatCard icon="📂" label="Categories" value={stats.total_categories} desc="Part categories" color="#3182ce" />
        <StatCard icon="📄" label="Quotes Generated" value={stats.total_quotes} desc="All time" color="#805ad5" />
        <StatCard icon="💰" label="Avg Quote Value" value={`₹${stats.avg_quote_value.toLocaleString('en-IN')}`} desc="Per quote" color="#c05621" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="card">
          <div className="card-title">Parts by Category</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name, value}) => `${name} (${value})`} labelLine={false}>
                {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">Parts by Price Range</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priceData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#2d6a4f" radius={[4,4,0,0]} name="Parts" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {recentQuoteData.length > 0 && (
          <div className="card">
            <div className="card-title">Recent Quote Values (₹)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={recentQuoteData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}`} />
                <Bar dataKey="value" fill="#40916c" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="card">
          <div className="card-title">Recent Quotes</div>
          {stats.recent_quotes.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📄</div><div>No quotes yet</div></div>
          ) : (
            <table>
              <thead>
                <tr><th>Quote</th><th>Customer</th><th>Amount</th></tr>
              </thead>
              <tbody>
                {stats.recent_quotes.map(q => (
                  <tr key={q.id}>
                    <td><strong>{q.quote_name}</strong></td>
                    <td className="text-muted">{q.customer_name || '—'}</td>
                    <td className="text-green"><strong>₹{q.final_price.toLocaleString('en-IN')}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, desc, color }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="stat-label">{label}</div>
          <div className="stat-value" style={{ color }}>{value}</div>
          <div className="stat-desc">{desc}</div>
        </div>
        <span style={{ fontSize: 28 }}>{icon}</span>
      </div>
    </div>
  );
}
