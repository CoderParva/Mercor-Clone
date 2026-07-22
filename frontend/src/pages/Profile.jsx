import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CANDIDATE_TABS = [
  'Resume',
  'Location & work authorization',
  'Availability',
  'Work preferences',
  'Communications',
  'Account',
];

const RECRUITER_TABS = ['Company Profile', 'Communications', 'Account'];

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
  const isRecruiter = user?.role === 'recruiter';
  const TABS = isRecruiter ? RECRUITER_TABS : CANDIDATE_TABS;

  const [tab, setTab] = useState(TABS[0]);
  const [saving, setSaving] = useState(false);
  const [newLanguage, setNewLanguage] = useState('');

  const [form, setForm] = useState({
    name: '', title: '', bio: '', skills: '', hourlyRate: '',
    phone: '', linkedinUrl: '', summary: '',
    education: [], workExperience: [], projects: [],
    publications: [], certifications: [], awards: [],
    profiles: { leetcode: '', github: '', codechef: '', codeforces: '' },
    portfolioUrl: '', otherLinks: [],
    languages: [], hobbies: [],
    country: '', city: '', timezone: '', workAuthorization: '',
    availability: { hoursPerWeek: '', startDate: '', employmentType: '' },
    workPreferences: { remotePreference: '', willingToRelocate: false, desiredPayMin: '', desiredPayMax: '' },
    communicationPrefs: { preferredContact: 'email', emailNotifications: true },
    companyName: '', companyWebsite: '', positionAtCompany: '', department: '', companySize: '', industry: '',
  });

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);

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
        country: user.country || '',
        city: user.city || '',
        timezone: user.timezone || '',
        workAuthorization: user.workAuthorization || '',
        availability: {
          hoursPerWeek: user.availability?.hoursPerWeek ?? '',
          startDate: user.availability?.startDate || '',
          employmentType: user.availability?.employmentType || '',
        },
        workPreferences: {
          remotePreference: user.workPreferences?.remotePreference || '',
          willingToRelocate: user.workPreferences?.willingToRelocate || false,
          desiredPayMin: user.workPreferences?.desiredPayMin ?? '',
          desiredPayMax: user.workPreferences?.desiredPayMax ?? '',
        },
        communicationPrefs: {
          preferredContact: user.communicationPrefs?.preferredContact || 'email',
          emailNotifications: user.communicationPrefs?.emailNotifications ?? true,
        },
        companyName: user.companyName || '',
        companyWebsite: user.companyWebsite || '',
        positionAtCompany: user.positionAtCompany || '',
        department: user.department || '',
        companySize: user.companySize || '',
        industry: user.industry || '',
      });
    }
  }, [user]);

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
        hourlyRate: numify(form.hourlyRate),
        phone: form.phone,
        linkedinUrl: form.linkedinUrl,
        summary: form.summary,
        education: form.education.map((ed) => ({ ...ed, startYear: numify(ed.startYear), endYear: numify(ed.endYear) })),
        workExperience: form.workExperience.map((w) => ({ ...w, startYear: numify(w.startYear), endYear: numify(w.endYear) })),
        projects: form.projects.map((p) => ({ ...p, startYear: numify(p.startYear), endYear: numify(p.endYear) })),
        publications: form.publications.filter((p) => p.trim()),
        certifications: form.certifications.filter((c) => c.trim()),
        awards: form.awards.filter((a) => a.trim()),
        profiles: form.profiles,
        portfolioUrl: form.portfolioUrl,
        otherLinks: form.otherLinks.filter((l) => l.trim()),
        languages: form.languages,
        hobbies: form.hobbies,
        country: form.country,
        city: form.city,
        timezone: form.timezone,
        workAuthorization: form.workAuthorization,
        availability: {
          hoursPerWeek: numify(form.availability.hoursPerWeek),
          startDate: form.availability.startDate,
          employmentType: form.availability.employmentType,
        },
        workPreferences: {
          remotePreference: form.workPreferences.remotePreference,
          willingToRelocate: form.workPreferences.willingToRelocate,
          desiredPayMin: numify(form.workPreferences.desiredPayMin),
          desiredPayMax: numify(form.workPreferences.desiredPayMax),
        },
        communicationPrefs: form.communicationPrefs,
        companyName: form.companyName,
        companyWebsite: form.companyWebsite,
        positionAtCompany: form.positionAtCompany,
        department: form.department,
        companySize: form.companySize,
        industry: form.industry,
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

  const submitPasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    setPwSaving(true);
    try {
      await api.put('/users/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      showToast('Password updated', 'success');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update password', 'error');
    } finally {
      setPwSaving(false);
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

      {tab === 'Resume' && !isRecruiter && (
        <form className="resume-form" onSubmit={submit}>
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
              <label>Hourly rate ($)<input type="number" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} /></label>
            </div>
          </section>

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
                  <label>City<input value={w.city} onChange={(e) => updateItem('workExperience', i, 'city', e.target.value)} /></label>
                  <label>Country<input value={w.country} onChange={(e) => updateItem('workExperience', i, 'country', e.target.value)} /></label>
                </div>
                <label>Description<textarea rows={3} value={w.description} onChange={(e) => updateItem('workExperience', i, 'description', e.target.value)} /></label>
              </div>
            ))}
            {form.workExperience.length === 0 && <p className="resume-empty">No work experience added yet.</p>}
          </section>

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

          <section className="resume-section">
            <div className="resume-section-header"><h2>Certifications</h2></div>
            {form.certifications.map((c, i) => (
              <div className="tag-input-row" key={i}>
                <input value={c} onChange={(e) => updateStringItem('certifications', i, e.target.value)} />
                <button type="button" className="link-remove" onClick={() => removeStringItem('certifications', i)}>✕</button>
              </div>
            ))}
            <button type="button" className="link-add" onClick={() => addStringItem('certifications')}>+ Add certification</button>
          </section>

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

          <section className="resume-section">
            <h2>Profiles</h2>
            <label>LeetCode username<input value={form.profiles.leetcode} onChange={(e) => setForm({ ...form, profiles: { ...form.profiles, leetcode: e.target.value } })} /></label>
            <label>GitHub username<input value={form.profiles.github} onChange={(e) => setForm({ ...form, profiles: { ...form.profiles, github: e.target.value } })} /></label>
            <label>CodeChef username<input value={form.profiles.codechef} onChange={(e) => setForm({ ...form, profiles: { ...form.profiles, codechef: e.target.value } })} /></label>
            <label>Codeforces username<input value={form.profiles.codeforces} onChange={(e) => setForm({ ...form, profiles: { ...form.profiles, codeforces: e.target.value } })} /></label>
          </section>

          <section className="resume-section">
            <h2>Links</h2>
            <label>Portfolio URL<input value={form.portfolioUrl} onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })} /></label>
            <div className="resume-section-header"><span>Other links</span></div>
            {form.otherLinks.map((l, i) => (
              <div className="tag-input-row" key={i}>
                <input value={l} onChange={(e) => updateStringItem('otherLinks', i, e.target.value)} />
                <button type="button" className="link-remove" onClick={() => removeStringItem('otherLinks', i)}>✕</button>
              </div>
            ))}
            <button type="button" className="link-add" onClick={() => addStringItem('otherLinks')}>+ Add more links</button>
          </section>

          <section className="resume-section">
            <h2>Languages</h2>
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
                <span className="skill-tag" key={l}>{l} <button type="button" className="tag-x" onClick={() => removeLanguage(l)}>✕</button></span>
              ))}
            </div>
          </section>

          <section className="resume-section">
            <h2>Hobbies</h2>
            <div className="hobby-options">
              {HOBBY_OPTIONS.map((h) => (
                <button type="button" key={h} className={`hobby-chip ${form.hobbies.includes(h) ? 'selected' : ''}`} onClick={() => toggleHobby(h)}>
                  {h}
                </button>
              ))}
            </div>
          </section>

          <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </form>
      )}

      {tab === 'Location & work authorization' && !isRecruiter && (
        <form className="resume-form" onSubmit={submit}>
          <section className="resume-section">
            <div className="resume-row">
              <label>Country<input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="e.g. India" /></label>
              <label>City<input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g. Indore" /></label>
            </div>
            <label>Timezone<input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} placeholder="e.g. GMT+5:30" /></label>
            <label>Work authorization
              <select value={form.workAuthorization} onChange={(e) => setForm({ ...form, workAuthorization: e.target.value })}>
                <option value="">Select...</option>
                <option value="citizen">Citizen</option>
                <option value="permanent_resident">Permanent Resident</option>
                <option value="visa_required">Visa Sponsorship Required</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </label>
          </section>
          <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </form>
      )}

      {tab === 'Availability' && !isRecruiter && (
        <form className="resume-form" onSubmit={submit}>
          <section className="resume-section">
            <label>Hours available per week
              <input type="number" value={form.availability.hoursPerWeek}
                onChange={(e) => setForm({ ...form, availability: { ...form.availability, hoursPerWeek: e.target.value } })} placeholder="e.g. 40" />
            </label>
            <label>Preferred start date
              <input type="date" value={form.availability.startDate}
                onChange={(e) => setForm({ ...form, availability: { ...form.availability, startDate: e.target.value } })} />
            </label>
            <label>Employment type preference
              <select value={form.availability.employmentType}
                onChange={(e) => setForm({ ...form, availability: { ...form.availability, employmentType: e.target.value } })}>
                <option value="">Select...</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="either">No preference</option>
              </select>
            </label>
          </section>
          <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </form>
      )}

      {tab === 'Work preferences' && !isRecruiter && (
        <form className="resume-form" onSubmit={submit}>
          <section className="resume-section">
            <label>Remote preference
              <select value={form.workPreferences.remotePreference}
                onChange={(e) => setForm({ ...form, workPreferences: { ...form.workPreferences, remotePreference: e.target.value } })}>
                <option value="">Select...</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">Onsite</option>
                <option value="no preference">No preference</option>
              </select>
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={form.workPreferences.willingToRelocate}
                onChange={(e) => setForm({ ...form, workPreferences: { ...form.workPreferences, willingToRelocate: e.target.checked } })} />
              Willing to relocate
            </label>
            <div className="resume-row">
              <label>Desired pay min ($/hr)
                <input type="number" value={form.workPreferences.desiredPayMin}
                  onChange={(e) => setForm({ ...form, workPreferences: { ...form.workPreferences, desiredPayMin: e.target.value } })} />
              </label>
              <label>Desired pay max ($/hr)
                <input type="number" value={form.workPreferences.desiredPayMax}
                  onChange={(e) => setForm({ ...form, workPreferences: { ...form.workPreferences, desiredPayMax: e.target.value } })} />
              </label>
            </div>
          </section>
          <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </form>
      )}

      {tab === 'Company Profile' && isRecruiter && (
        <form className="resume-form" onSubmit={submit}>
          <section className="resume-section">
            <label>Full name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label>Email<input value={user?.email || ''} disabled /></label>
            <div className="resume-row">
              <label>Your position/title<input value={form.positionAtCompany} onChange={(e) => setForm({ ...form, positionAtCompany: e.target.value })} placeholder="e.g. Talent Acquisition Manager" /></label>
              <label>Department<input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. HR / Engineering" /></label>
            </div>
            <label>Company name<input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></label>
            <div className="resume-row">
              <label>Industry<input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="e.g. AI / Fintech / SaaS" /></label>
              <label>Company size
                <select value={form.companySize} onChange={(e) => setForm({ ...form, companySize: e.target.value })}>
                  <option value="">Select...</option>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-1000">201-1000</option>
                  <option value="1000+">1000+</option>
                </select>
              </label>
            </div>
            <label>Company website<input value={form.companyWebsite} onChange={(e) => setForm({ ...form, companyWebsite: e.target.value })} placeholder="https://yourcompany.com" /></label>
            <label>About / hiring focus<textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="What kind of talent are you typically hiring for?" /></label>
          </section>
          <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </form>
      )}

      {tab === 'Communications' && (
        <form className="resume-form" onSubmit={submit}>
          <section className="resume-section">
            <label>Preferred contact method
              <select value={form.communicationPrefs.preferredContact}
                onChange={(e) => setForm({ ...form, communicationPrefs: { ...form.communicationPrefs, preferredContact: e.target.value } })}>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="either">Either</option>
              </select>
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={form.communicationPrefs.emailNotifications}
                onChange={(e) => setForm({ ...form, communicationPrefs: { ...form.communicationPrefs, emailNotifications: e.target.checked } })} />
              Send me email notifications about application updates
            </label>
          </section>
          <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </form>
      )}

      {tab === 'Account' && (
        <div className="resume-form">
          <section className="resume-section">
            <h2>Account details</h2>
            <label>Email<input value={user?.email || ''} disabled /></label>
            <label>Role<input value={user?.role || ''} disabled style={{ textTransform: 'capitalize' }} /></label>
          </section>
          <section className="resume-section">
            <h2>Change password</h2>
            <form className="resume-form" onSubmit={submitPasswordChange} style={{ maxWidth: 420 }}>
              <label>Current password<input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} required /></label>
              <label>New password<input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} required /></label>
              <label>Confirm new password<input type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} required /></label>
              <button type="submit" className="btn primary" disabled={pwSaving}>{pwSaving ? 'Updating...' : 'Update password'}</button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}