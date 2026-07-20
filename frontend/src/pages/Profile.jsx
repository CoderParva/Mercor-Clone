import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const TABS = [
  'Resume',
  'Location & work authorization',
  'Availability',
  'Work preferences',
  'Communications',
  'Account',
];

const HOBBY_OPTIONS = [
  'Football (American)', 'Basketball', 'Soccer', 'Cricket',
  'Volleyball', 'Hockey', 'Golf', 'Shopping/Fashion',
];

const emptyEducation = { school: '', degree: '', startYear: '', endYear: '', major: '', gpa: '' };
const emptyWork = { company: '', role: '', startYear: '', endYear: '', city: '', country: '', description: '' };
const emptyProject = { name: '', startYear: '', endYear: '', description: '' };

export default function Profile() {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState('Resume');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '', title: '', bio: '', skills: '', hourlyRate: '',
    phone: '', linkedinUrl: '', summary: '',
    education: [], workExperience: [], projects: [],
    publications: [], certifications: [], awards: [],
    profiles: { leetcode: '', github: '', codechef: '', codeforces: '' },
    portfolioUrl: '', otherLinks: [],
    languages: [], hobbies: [],
  });
  const [newLanguage, setNewLanguage] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        title: user.title || '',
        bio: user.bio || '',
        skills: (user.skills || []).join(', '),
        hourlyRate: user.hourlyRate || '',
        phone: user.phone || '',
        linkedinUrl: user.linkedinUrl || '',
        summary: user.summary || '',
        education: user.education?.length ? user.education : [],
        workExperience: user.workExperience?.length ? user.workExperience : [],
        projects: user.projects?.length ? user.projects : [],
        publications: user.publications || [],
        certifications: user.certifications || [],
        awards: user.awards || [],
        profiles: user.profiles || { leetcode: '', github: '', codechef: '', codeforces: '' },
        portfolioUrl: user.portfolioUrl || '',
        otherLinks: user.otherLinks || [],
        languages: user.languages || [],
        hobbies: user.hobbies || [],
      });
    }
  }, [user]);

  // --- generic list helpers ---
  const addItem = (key, empty) => setForm((f) => ({ ...f, [key]: [...f[key], { ...empty }] }));
  const removeItem = (key, index) => setForm((f) => ({ ...f, [key]: f[key].filter((_, i) => i !== index) }));
  const updateItem = (key, index, field, value) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));

  const addStringItem = (key) => setForm((f) => ({ ...f, [key]: [...f[key], ''] }));
  const removeStringItem = (key, index) => setForm((f) => ({ ...f, [key]: f[key].filter((_, i) => i !== index) }));
  const updateStringItem = (key, index, value) =>
    setForm((f) => ({ ...f, [key]: f[key].map((v, i) => (i === index ? value : v)) }));

  const toggleHobby = (hobby) =>
    setForm((f) => ({
      ...f,
      hobbies: f.hobbies.includes(hobby) ? f.hobbies.filter((h) => h !== hobby) : [...f.hobbies, hobby],
    }));

  const addLanguage = () => {
    const val = newLanguage.trim();
    if (val && !form.languages.includes(val)) {
      setForm((f) => ({ ...f, languages: [...f.languages, val] }));
    }
    setNewLanguage('');
  };
  const removeLanguage = (lang) =>
    setForm((f) => ({ ...f, languages: f.languages.filter((l) => l !== lang) }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const numify = (v) => (v === '' || v === null || v === undefined ? undefined : Number(v));
      const payload = {
        name: form.name,
        title: form.title,
        bio: form.bio,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        hourlyRate: Number(form.hourlyRate) || undefined,
        phone: form.phone,
        linkedinUrl: form.linkedinUrl,
        summary: form.summary,
        education: form.education.map((ed) => ({
          ...ed,
          startYear: numify(ed.startYear),
          endYear: numify(ed.endYear),
        })),
        workExperience: form.workExperience.map((w) => ({
          ...w,
          startYear: numify(w.startYear),
          endYear: numify(w.endYear),
        })),
        projects: form.projects.map((p) => ({
          ...p,
          startYear: numify(p.startYear),
          endYear: numify(p.endYear),
        })),
        publications: form.publications.filter((p) => p.trim()),
        certifications: form.certifications.filter((c) => c.trim()),
        awards: form.awards.filter((a) => a.trim()),
        profiles: form.profiles,
        portfolioUrl: form.portfolioUrl,
        otherLinks: form.otherLinks.filter((l) => l.trim()),
        languages: form.languages,
        hobbies: form.hobbies,
      };
      const res = await api.put('/users/profile', payload);
      setUser(res.data.user);
      showToast('Profile updated', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <h1>Profile</h1>

      <div className="profile-tabs">
        {TABS.map((t) => (
          <button key={t} className={`profile-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab !== 'Resume' && (
        <div className="profile-placeholder">
          <p>{tab} settings aren't wired up yet — this tab is a UI placeholder.</p>
        </div>
      )}

      {tab === 'Resume' && (
        <form className="resume-form" onSubmit={submit}>

          {/* Basic info */}
          <section className="resume-section">
            <label>Full legal name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <div className="resume-row">
              <label>Email<input value={user?.email || ''} disabled /></label>
              <label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765-43210" /></label>
            </div>
            <label>LinkedIn URL<input value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} placeholder="https://www.linkedin.com/in/your-name/" /></label>
            <label>Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Full Stack Developer" /></label>
            <label>Summary<textarea rows={3} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="A short profile summary" /></label>
            <label>Bio<textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></label>
            <div className="resume-row">
              <label>Skills (comma separated)<input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} /></label>
              {user?.role === 'candidate' && (
                <label>Hourly rate ($)<input type="number" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} /></label>
              )}
            </div>
          </section>

          {/* Education */}
          <section className="resume-section">
            <div className="resume-section-header">
              <h2>Education</h2>
              <button type="button" className="link-add" onClick={() => addItem('education', emptyEducation)}>+ Add education</button>
            </div>
            {form.education.map((ed, i) => (
              <div className="resume-card" key={i}>
                <div className="resume-card-header">
                  <strong>{ed.degree || 'Degree'} {ed.school ? `from ${ed.school}` : ''}</strong>
                  <button type="button" className="link-remove" onClick={() => removeItem('education', i)}>✕ Remove</button>
                </div>
                <div className="resume-row">
                  <label>School<input value={ed.school} onChange={(e) => updateItem('education', i, 'school', e.target.value)} /></label>
                  <label>Degree<input value={ed.degree} onChange={(e) => updateItem('education', i, 'degree', e.target.value)} /></label>
                </div>
                <div className="resume-row">
                  <label>Start year<input value={ed.startYear} onChange={(e) => updateItem('education', i, 'startYear', e.target.value)} /></label>
                  <label>End year<input value={ed.endYear} onChange={(e) => updateItem('education', i, 'endYear', e.target.value)} /></label>
                </div>
                <div className="resume-row">
                  <label>Major<input value={ed.major} onChange={(e) => updateItem('education', i, 'major', e.target.value)} /></label>
                  <label>GPA<input value={ed.gpa} onChange={(e) => updateItem('education', i, 'gpa', e.target.value)} placeholder="Ex: 3.9" /></label>
                </div>
              </div>
            ))}
            {form.education.length === 0 && <p className="resume-empty">No education added yet.</p>}
          </section>

          {/* Work experience */}
          <section className="resume-section">
            <div className="resume-section-header">
              <h2>Work experience</h2>
              <button type="button" className="link-add" onClick={() => addItem('workExperience', emptyWork)}>+ Add work experience</button>
            </div>
            {form.workExperience.map((w, i) => (
              <div className="resume-card" key={i}>
                <div className="resume-card-header">
                  <strong>{w.role || 'Role'} {w.company ? `at ${w.company}` : ''}</strong>
                  <button type="button" className="link-remove" onClick={() => removeItem('workExperience', i)}>✕ Remove</button>
                </div>
                <div className="resume-row">
                  <label>Company<input value={w.company} onChange={(e) => updateItem('workExperience', i, 'company', e.target.value)} /></label>
                  <label>Role<input value={w.role} onChange={(e) => updateItem('workExperience', i, 'role', e.target.value)} /></label>
                </div>
                <div className="resume-row">
                  <label>Start year<input value={w.startYear} onChange={(e) => updateItem('workExperience', i, 'startYear', e.target.value)} /></label>
                  <label>End year<input value={w.endYear} onChange={(e) => updateItem('workExperience', i, 'endYear', e.target.value)} /></label>
                </div>
                <div className="resume-row">
                  <label>City<input value={w.city} onChange={(e) => updateItem('workExperience', i, 'city', e.target.value)} placeholder="Ex: San Francisco" /></label>
                  <label>Country<input value={w.country} onChange={(e) => updateItem('workExperience', i, 'country', e.target.value)} placeholder="Ex: United States of America" /></label>
                </div>
                <label>Description<textarea rows={3} value={w.description} onChange={(e) => updateItem('workExperience', i, 'description', e.target.value)} /></label>
              </div>
            ))}
            {form.workExperience.length === 0 && <p className="resume-empty">No work experience added yet.</p>}
          </section>

          {/* Projects */}
          <section className="resume-section">
            <div className="resume-section-header">
              <h2>Projects</h2>
              <button type="button" className="link-add" onClick={() => addItem('projects', emptyProject)}>+ Add project</button>
            </div>
            {form.projects.map((p, i) => (
              <div className="resume-card" key={i}>
                <div className="resume-card-header">
                  <strong>{p.name || 'Project'}</strong>
                  <button type="button" className="link-remove" onClick={() => removeItem('projects', i)}>✕ Remove</button>
                </div>
                <label>Project name<input value={p.name} onChange={(e) => updateItem('projects', i, 'name', e.target.value)} /></label>
                <div className="resume-row">
                  <label>Start year<input value={p.startYear} onChange={(e) => updateItem('projects', i, 'startYear', e.target.value)} /></label>
                  <label>End year<input value={p.endYear} onChange={(e) => updateItem('projects', i, 'endYear', e.target.value)} /></label>
                </div>
                <label>Description<input value={p.description} onChange={(e) => updateItem('projects', i, 'description', e.target.value)} /></label>
              </div>
            ))}
            {form.projects.length === 0 && <p className="resume-empty">No projects added yet.</p>}
          </section>

          {/* Publications */}
          <section className="resume-section">
            <div className="resume-section-header"><h2>Publications</h2></div>
            {form.publications.map((pub, i) => (
              <div className="tag-input-row" key={i}>
                <input value={pub} onChange={(e) => updateStringItem('publications', i, e.target.value)} />
                <button type="button" className="link-remove" onClick={() => removeStringItem('publications', i)}>✕</button>
              </div>
            ))}
            <button type="button" className="link-add" onClick={() => addStringItem('publications')}>+ Add publication</button>
          </section>

          {/* Certifications */}
          <section className="resume-section">
            <div className="resume-section-header"><h2>Certifications</h2></div>
            {form.certifications.map((c, i) => (
              <div className="tag-input-row" key={i}>
                <input value={c} onChange={(e) => updateStringItem('certifications', i, e.target.value)} placeholder="e.g. MERN Full Stack Certification (Ethnus, 2025)" />
                <button type="button" className="link-remove" onClick={() => removeStringItem('certifications', i)}>✕</button>
              </div>
            ))}
            <button type="button" className="link-add" onClick={() => addStringItem('certifications')}>+ Add certification</button>
          </section>

          {/* Awards */}
          <section className="resume-section">
            <div className="resume-section-header"><h2>Awards</h2></div>
            {form.awards.map((a, i) => (
              <div className="tag-input-row" key={i}>
                <input value={a} onChange={(e) => updateStringItem('awards', i, e.target.value)} />
                <button type="button" className="link-remove" onClick={() => removeStringItem('awards', i)}>✕</button>
              </div>
            ))}
            <button type="button" className="link-add" onClick={() => addStringItem('awards')}>+ Add award</button>
          </section>

          {/* Coding profiles */}
          <section className="resume-section">
            <h2>Profiles</h2>
            <label>LeetCode username<input value={form.profiles.leetcode} onChange={(e) => setForm({ ...form, profiles: { ...form.profiles, leetcode: e.target.value } })} /></label>
            <label>GitHub username<input value={form.profiles.github} onChange={(e) => setForm({ ...form, profiles: { ...form.profiles, github: e.target.value } })} /></label>
            <label>CodeChef username<input value={form.profiles.codechef} onChange={(e) => setForm({ ...form, profiles: { ...form.profiles, codechef: e.target.value } })} /></label>
            <label>Codeforces username<input value={form.profiles.codeforces} onChange={(e) => setForm({ ...form, profiles: { ...form.profiles, codeforces: e.target.value } })} /></label>
          </section>

          {/* Links */}
          <section className="resume-section">
            <h2>Links</h2>
            <label>Portfolio URL<input value={form.portfolioUrl} onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })} placeholder="https://yourportfolio.com" /></label>
            <div className="resume-section-header"><span>Other links</span></div>
            {form.otherLinks.map((l, i) => (
              <div className="tag-input-row" key={i}>
                <input value={l} onChange={(e) => updateStringItem('otherLinks', i, e.target.value)} placeholder="https://example.com" />
                <button type="button" className="link-remove" onClick={() => removeStringItem('otherLinks', i)}>✕</button>
              </div>
            ))}
            <button type="button" className="link-add" onClick={() => addStringItem('otherLinks')}>+ Add more links</button>
          </section>

          {/* Languages */}
          <section className="resume-section">
            <h2>Languages</h2>
            <p className="resume-hint">What languages can you natively speak, read, and write?</p>
            <div className="tag-input-row">
              <input
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLanguage(); } }}
                placeholder="Type a language and press Enter"
              />
              <button type="button" className="link-add" onClick={addLanguage}>+ Add</button>
            </div>
            <div className="skill-tags">
              {form.languages.map((l) => (
                <span className="skill-tag" key={l}>
                  {l} <button type="button" className="tag-x" onClick={() => removeLanguage(l)}>✕</button>
                </span>
              ))}
            </div>
          </section>

          {/* Hobbies */}
          <section className="resume-section">
            <h2>Hobbies</h2>
            <p className="resume-hint">Select all that apply:</p>
            <div className="hobby-options">
              {HOBBY_OPTIONS.map((h) => (
                <button
                  type="button"
                  key={h}
                  className={`hobby-chip ${form.hobbies.includes(h) ? 'selected' : ''}`}
                  onClick={() => toggleHobby(h)}
                >
                  {h}
                </button>
              ))}
            </div>
            {form.hobbies.length > 0 && (
              <div className="skill-tags" style={{ marginTop: '0.75rem' }}>
                {form.hobbies.map((h) => (
                  <span className="skill-tag" key={h}>
                    {h} <button type="button" className="tag-x" onClick={() => toggleHobby(h)}>✕</button>
                  </span>
                ))}
              </div>
            )}
          </section>

          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      )}
    </div>
  );
}