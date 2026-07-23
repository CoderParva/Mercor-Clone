import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ApplicationModal({ job, onClose }) {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  if (!job) return null;

  const saveName = async () => {
    if (!name.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await api.put('/users/profile', { name: name.trim() });
      setUser(res.data.user);
      setEditingName(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update name', 'error');
    } finally {
      setSaving(false);
    }
  };

  const proceed = () => {
    onClose();
    navigate(`/jobs/${job._id}/apply`);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>{job.title}</h3>
        <p className="modal-pay">
          {job.payMin === job.payMax ? `$${job.payMin}` : `$${job.payMin}-$${job.payMax}`} per hour
        </p>

        <div className="modal-identity">
          <span className="modal-avatar">{(user?.name || '?').charAt(0).toUpperCase()}</span>
          {editingName ? (
            <input
              className="modal-name-input"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveName(); }}
            />
          ) : (
            <span className="modal-name">{user?.name}</span>
          )}
          <button
            type="button"
            className="link-btn"
            onClick={() => (editingName ? saveName() : setEditingName(true))}
            disabled={saving}
          >
            {editingName ? (saving ? 'Saving...' : 'Save') : '✎'}
          </button>
        </div>

        <button className="btn primary modal-continue" onClick={proceed}>
          Continue application
        </button>
        <button className="link-btn modal-cancel" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}