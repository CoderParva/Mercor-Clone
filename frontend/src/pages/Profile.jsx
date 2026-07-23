import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Toggle from '../components/Toggle';
import WorkingHoursGrid from '../components/WorkingHoursGrid';

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

const DOMAIN_OPTIONS = [
  'Software engineering', 'Other engineering', 'Medicine', 'Law', 'Data analysis',
  'Finance', 'Business operations', 'Life, Physical, and Social Science',
  'Arts & Design', 'Language and Audio', 'Humanities', 'Miscellaneous',
];

const emptyEducation = { school: '', degree: '', startYear: '', endYear: '', major: '', gpa: '' };
const emptyWork = { company: '', role: '', startYear: '', endYear: '', city: '', country: '', description: '' };
const emptyProject = { name: '', startYear: '', endYear: '', description: '' };
const emptyHours = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };

export default function Profile() {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const isRecruiter = user?.role === 'recruiter';
  const TABS = isRecruiter ? RECRUITER_TABS : CANDIDATE_TABS;

  const [tab, setTab] = useState(TABS[0]);
  const [saving, setSaving] = useState(false);
  const [newLanguage, setNewLanguage] = useState('');

  // phone verification
  const [phoneStep, setPhoneStep] = useState('idle'); // idle | codeSent
  const [otpInput, setOtpInput] = useState('');
  const [devCode, setDevCode] = useState('');
  const [phoneBusy, setPhoneBusy] = useState(false);

  // account actions
  const [emailForm, setEmailForm] = useState({ newEmail: '', password: '' });
  const [emailBusy, setEmailBusy] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [form, setForm] = useState({
    name: '', title: '', bio: '', skills: '', hourlyRate: '',
    phone: '', linkedinUrl: '', summary: '',
    education: [], workExperience: [], projects: [],
    publications: [], certifications: [], awards: [],
    profiles: { leetcode: '', github: '', codechef: '', codeforces: '' },
    portfolioUrl: '', otherLinks: [],
    languages: [], hobbies: [],
    country: '', state: '', city: '', postalCode: '', timezone: '', workAuthorization: '',
    dateOfBirth: '', workingFromDifferentCountry: false,
    legalAttestation: { authorizedToWork: false, willNotifyOnChange: false },
    availability: { hoursPerWeek: '', startOption: '', startDate: '', employmentType: '' },
    workingHours: emptyHours,
    dateExceptions: [],
    workPreferences: { remotePreference: '', willingToRelocate: false, desiredPayMin: '', desiredPayMax: '' },
    domainInterests: [], otherDomainInterest: '',
    minCompensation: { fullTime: '', partTime: '' },
    communicationPrefs: {
      lookingForWork: true, emailChannel: true, smsChannel: true,
      fullTimeOpportunities: true, partTimeOpportunities: true, referralOpportunities: true,
      jobOpportunityNotifs: true, workUpdateNotifs: true, unsubscribedAll: false,
    },
    avatarUrl: '', generativeAvatarOptIn: false,
    companyName: '', companyWebsite: '', positionAtCompany: '', department: '', companySize: '', industry: '',
  });

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
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
        country: user.country || '', state: user.state || '', city: user.city || '',
        postalCode: user.postalCode || '', timezone: user.timezone || '',
        workAuthorization: user.workAuthorization || '',
        dateOfBirth: user.dateOfBirth || '',
        workingFromDifferentCountry: user.workingFromDifferentCountry || false,
        legalAttestation: {
          authorizedToWork: user.legalAttestation?.authorizedToWork || false,
          willNotifyOnChange: user.legalAttestation?.willNotifyOnChange || false,
        },
        availability: {
          hoursPerWeek: user.availability?.hoursPerWeek ?? '',
          startOption: user.availability?.startOption || '',
          startDate: user.availability?.startDate || '',
          employmentType: user.availability?.employmentType || '',
        },
        workingHours: {
          mon: user.workingHours?.mon || [], tue: user.workingHours?.tue || [],
          wed: user.workingHours?.wed || [], thu: user.workingHours?.thu || [],
          fri: user.workingHours?.fri || [], sat: user.workingHours?.sat || [],
          sun: user.workingHours?.sun || [],
        },
        dateExceptions: user.dateExceptions || [],
        workPreferences: {
          remotePreference: user.workPreferences?.remotePreference || '',
          willingToRelocate: user.workPreferences?.willingToRelocate || false,
          desiredPayMin: user.workPreferences?.desiredPayMin ?? '',
          desiredPayMax: user.workPreferences?.desiredPayMax ?? '',
        },
        domainInterests: user.domainInterests || [],
        otherDomainInterest: user.otherDomainInterest || '',
        minCompensation: {
          fullTime: user.minCompensation?.fullTime ?? '',
          partTime: user.minCompensation?.partTime ?? '',
        },
        communicationPrefs: {
          lookingForWork: user.communicationPrefs?.lookingForWork ?? true,
          emailChannel: user.communicationPrefs?.emailChannel ?? true,
          smsChannel: user.communicationPrefs?.smsChannel ?? true,
          fullTimeOpportunities: user.communicationPrefs?.fullTimeOpportunities ?? true,
          partTimeOpportunities: user.communicationPrefs?.partTimeOpportunities ?? true,
          referralOpportunities: user.communicationPrefs?.referralOpportunities ?? true,
          jobOpportunityNotifs: user.communicationPrefs?.jobOpportunityNotifs ?? true,
          workUpdateNotifs: user.communicationPrefs?.workUpdateNotifs ?? true,
          unsubscribedAll: user.communicationPrefs?.unsubscribedAll ?? false,
        },
        avatarUrl: user.avatarUrl || '',
        generativeAvatarOptIn: user.generativeAvatarOptIn || false,
        companyName: user.companyName || '',
        companyWebsite: user.companyWebsite || '',
        positionAtCompany: user.positionAtCompany || '',
        department: user.department || '',
        companySize: user.companySize || '',
        industry: user.industry || '',
      }));
    }
  }, [user]);

  const addItem = (key, empty) => setForm((f) => ({ ...f, [key]: [...f[key], { ...empty }] }));
  const removeItem = (key, index) => setForm((f) => ({ ...f, [key]: f[key].filter((_, i) => i !== index) }));
  const updateItem = (key, index, field, value) =>
    setForm((f) => ({ ...f, [key]: f[key].map((item, i) => (i === index ? { ...item, [field]: value } : item)) }));

  const addStringItem = (key) => setForm((f) => ({ ...f, [key]: [...f[key], ''] }));
  const removeStringItem = (key, index) => setForm((f) => ({ ...f, [key]: f[key].filter((_, i) => i !== index) }));
  const updateStringItem = (key, index, value) =>
    setForm((f) => ({ ...f, [key]: f[key].map((v, i) => (i === index ? value : v)) }));

  const toggleHobby = (hobby) =>
    setForm((f) => ({ ...f, hobbies: f.hobbies.includes(hobby) ? f.hobbies.filter((h) => h !== hobby) : [...f.hobbies, hobby] }));

  const toggleDomain = (domain) =>
    setForm((f) => ({
      ...f,
      domainInterests: f.domainInterests.includes(domain)
        ? f.domainInterests.filter((d) => d !== domain)
        : [...f.domainInterests, domain],
    }));

  const addLanguage = () => {
    const val = newLanguage.trim();
    if (val && !form.languages.includes(val)) setForm((f) => ({ ...f, languages: [...f.languages, val] }));
    setNewLanguage('');
  };
  const removeLanguage = (lang) => setForm((f) => ({ ...f, languages: f.languages.filter((l) => l !== lang) }));

  const addDateException = () => {
    setForm((f) => ({
      ...f,
      dateExceptions: [...f.dateExceptions, { date: '', available: false, note: '' }],
    }));
  };
  const removeDateException = (index) => {
    setForm((f) => ({ ...f, dateExceptions: f.dateExceptions.filter((_, i) => i !== index) }));
  };
  const updateDateException = (index, field, value) => {
    setForm((f) => ({
      ...f,
      dateExceptions: f.dateExceptions.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex)),
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const numify = (v) => (v === '' || v === null || v === undefined ? undefined : Number(v));
      const payload = {
        name: form.name, title: form.title, bio: form.bio,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        hourlyRate: numify(form.hourlyRate),
        phone: form.phone, linkedinUrl: form.linkedinUrl, summary: form.summary,
        education: form.education.map((ed) => ({ ...ed, startYear: numify(ed.startYear), endYear: numify(ed.endYear) })),
        workExperience: form.workExperience.map((w) => ({ ...w, startYear: numify(w.startYear), endYear: numify(w.endYear) })),
        projects: form.projects.map((p) => ({ ...p, startYear: numify(p.startYear), endYear: numify(p.endYear) })),
        publications: form.publications.filter((p) => p.trim()),
        certifications: form.certifications.filter((c) => c.trim()),
        awards: form.awards.filter((a) => a.trim()),
        profiles: form.profiles,
        portfolioUrl: form.portfolioUrl,
        otherLinks: form.otherLinks.filter((l) => l.trim()),
        languages: form.languages, hobbies: form.hobbies,
        country: form.country, state: form.state, city: form.city,
        postalCode: form.postalCode, timezone: form.timezone, workAuthorization: form.workAuthorization,
        dateOfBirth: form.dateOfBirth, workingFromDifferentCountry: form.workingFromDifferentCountry,
        legalAttestation: form.legalAttestation,
        availability: {
          hoursPerWeek: numify(form.availability.hoursPerWeek),
          startOption: form.availability.startOption,
          startDate: form.availability.startDate,
          employmentType: form.availability.employmentType,
        },
        workingHours: form.workingHours,
        dateExceptions: form.dateExceptions,
        workPreferences: {
          remotePreference: form.workPreferences.remotePreference,
          willingToRelocate: form.workPreferences.willingToRelocate,
          desiredPayMin: numify(form.workPreferences.desiredPayMin),
          desiredPayMax: numify(form.workPreferences.desiredPayMax),
        },
        domainInterests: form.domainInterests,
        otherDomainInterest: form.otherDomainInterest,
        minCompensation: {
          fullTime: numify(form.minCompensation.fullTime) || 0,
          partTime: numify(form.minCompensation.partTime) || 0,
        },
        communicationPrefs: form.communicationPrefs,
        avatarUrl: form.avatarUrl,
        generativeAvatarOptIn: form.generativeAvatarOptIn,
        companyName: form.companyName, companyWebsite: form.companyWebsite,
        positionAtCompany: form.positionAtCompany, department: form.department,
        companySize: form.companySize, industry: form.industry,
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

  // --- phone verification ---
  const requestPhoneCode = async () => {
    if (!form.phone.trim()) {
      showToast('Enter a phone number first', 'error');
      return;
    }
    setPhoneBusy(true);
    try {
      const res = await api.post('/users/phone/request-code', { phone: form.phone });
      setPhoneStep('codeSent');
      setDevCode(res.data.devCode || '');
      showToast('Verification code sent', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not send code', 'error');
    } finally {
      setPhoneBusy(false);
    }
  };
  const confirmPhoneCode = async () => {
    setPhoneBusy(true);
    try {
      const res = await api.post('/users/phone/verify', { code: otpInput });
      setUser(res.data.user);
      setPhoneStep('idle');
      setOtpInput('');
      showToast('Phone verified', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Incorrect code', 'error');
    } finally {
         setPhoneBusy(false);
    }
  };
      // --- account actions ---
  const onAvatarSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_000_000) {
      showToast('Image too large — please use a file under 2MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, avatarUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  const submitEmailChange = async (e) => {
    e.preventDefault();
    setEmailBusy(true);
    try {
      const res = await api.put('/users/change-email', emailForm);
      setUser(res.data.user);
      showToast('Email updated', 'success');
      setEmailForm({ newEmail: '', password: '' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update email', 'error');
    } finally {
      setEmailBusy(false);
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

  const deleteAccount = async () => {
    setDeleteBusy(true);
    try {
      await api.delete('/users/account', { data: { password: deletePassword } });
      showToast('Account deleted', 'success');
      localStorage.removeItem('token');
      window.location.href = '/';
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete account', 'error');
      setDeleteBusy(false);
    }
  };

  return (
    <div className="page">
      <h1>Profile</h1>

      <div className="profile-tabs">
        {TABS.map((t) => (
          <button key={t} className={`profile-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {/* ---------- CANDIDATE: Resume ---------- */}
      {tab === 'Resume' && !isRecruiter && (
        <form className="resume-form" onSubmit={submit}>
          <section className="resume-section">
            <label>Full legal name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <div className="resume-row">
              <label>Email<input value={user?.email || ''} disabled /></label>
              <div className="phone-verify-field">
                <label>Phone
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765-43210" />
                </label>
                {user?.phoneVerified ? (
                  <span className="verified-badge">✓ Verified</span>
                ) : phoneStep === 'idle' ? (
                  <button type="button" className="link-btn" onClick={requestPhoneCode} disabled={phoneBusy}>
                    {phoneBusy ? 'Sending...' : 'Verify phone'}
                  </button>
                ) : (
                  <div className="otp-row">
                    <input
                      placeholder="6-digit code"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      maxLength={6}
                    />
                    <button type="button" className="btn primary small" onClick={confirmPhoneCode} disabled={phoneBusy}>
                      {phoneBusy ? 'Checking...' : 'Confirm'}
                    </button>
                    {devCode && <span className="resume-hint">(dev code: {devCode})</span>}
                  </div>
                )}
              </div>
            </div>
            <label>LinkedIn URL<input value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} placeholder="https://www.linkedin.com/in/your-name/" /></label>
            <label>Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Full Stack Developer" /></label>
            <label>Summary<textarea rows={3} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></label>
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
                <button type="button" key={h} className={`hobby-chip ${form.hobbies.includes(h) ? 'selected' : ''}`} onClick={() => toggleHobby(h)}>{h}</button>
              ))}
            </div>
          </section>

          <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </form>
      )}

      {/* ---------- CANDIDATE: Location & work authorization ---------- */}
      {tab === 'Location & work authorization' && !isRecruiter && (
        <form className="resume-form" onSubmit={submit}>
          <section className="resume-section">
            <h2>Location of residence</h2>
            <p className="resume-hint">Where you're based for most of the year.</p>
            <div className="resume-row">
              <label>Country<input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="e.g. India" /></label>
              <label>State / Province<input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="e.g. Madhya Pradesh" /></label>
            </div>
            <div className="resume-row">
              <label>City<input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g. Indore" /></label>
              <label>Postal code<input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} /></label>
            </div>
            <label className="checkbox-label">
              <input type="checkbox" checked={form.workingFromDifferentCountry}
                onChange={(e) => setForm({ ...form, workingFromDifferentCountry: e.target.checked })} />
              I will be physically working from a different country than the one above.
            </label>
          </section>

          <section className="resume-section">
            <h2>Legal attestation</h2>
            <label>Date of birth<input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></label>
            <label>Work authorization
              <select value={form.workAuthorization} onChange={(e) => setForm({ ...form, workAuthorization: e.target.value })}>
                <option value="">Select...</option>
                <option value="citizen">Citizen</option>
                <option value="permanent_resident">Permanent Resident</option>
                <option value="visa_required">Visa Sponsorship Required</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={form.legalAttestation.authorizedToWork}
                onChange={(e) => setForm({ ...form, legalAttestation: { ...form.legalAttestation, authorizedToWork: e.target.checked } })} />
              I confirm that I am legally authorized to work from the location above.
              </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={form.legalAttestation.willNotifyOnChange}
                onChange={(e) => setForm({ ...form, legalAttestation: { ...form.legalAttestation, willNotifyOnChange: e.target.checked } })} />
              I agree to notify TalentMarket in writing before changing my work location.
            </label>
          </section>

          <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </form>
      )}

      {/* ---------- CANDIDATE: Availability ---------- */}
      {tab === 'Availability' && !isRecruiter && (
        <form className="resume-form" onSubmit={submit}>
          <section className="resume-section">
            <h2>Availability</h2>
            <div className="resume-row">
              <label>Availability to start
                <select value={form.availability.startOption}
                  onChange={(e) => setForm({ ...form, availability: { ...form.availability, startOption: e.target.value } })}>
                  <option value="">Select...</option>
                  <option value="immediately">Immediately</option>
                  <option value="1_week">Within 1 week</option>
                  <option value="2_weeks">Within 2 weeks</option>
                  <option value="1_month">Within 1 month</option>
                </select>
              </label>
              <label>Preferred hours per week
                <input type="number" placeholder="Ex: 40" value={form.availability.hoursPerWeek}
                  onChange={(e) => setForm({ ...form, availability: { ...form.availability, hoursPerWeek: e.target.value } })} />
              </label>
            </div>
            <label>Timezone
              <select value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}>
                <option value="">Select timezone...</option>
                <option value="GMT-8">GMT-8 (Pacific)</option>
                <option value="GMT-5">GMT-5 (Eastern)</option>
                <option value="GMT+0">GMT+0 (UTC)</option>
                <option value="GMT+1">GMT+1 (Central Europe)</option>
                <option value="GMT+5:30">GMT+5:30 (India)</option>
                <option value="GMT+8">GMT+8 (China/Singapore)</option>
                <option value="GMT+9">GMT+9 (Japan/Korea)</option>
              </select>
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

          <section className="resume-section">
            <h2>Working hours</h2>
            <p className="resume-hint">Select when you're typically available to work.</p>
            <WorkingHoursGrid value={form.workingHours} onChange={(v) => setForm({ ...form, workingHours: v })} />
          </section>

          <section className="resume-section">
            <div className="resume-section-header">
              <h2>Date-specific hours</h2>
              <button type="button" className="link-add" onClick={addDateException}>+ Add exception</button>
            </div>
            <p className="resume-hint">Specify date-based exceptions to your weekly availability.</p>

            {form.dateExceptions.length === 0 ? (
              <p className="resume-empty">No active exceptions</p>
            ) : (
              form.dateExceptions.map((ex, i) => (
                <div className="exception-row" key={i}>
                  <input
                    type="date"
                    value={ex.date}
                    onChange={(e) => updateDateException(i, 'date', e.target.value)}
                  />
                  <label className="checkbox-label exception-toggle">
                    <input
                      type="checkbox"
                      checked={ex.available}
                      onChange={(e) => updateDateException(i, 'available', e.target.checked)}
                    />
                    Available this day
                  </label>
                  <input
                    className="exception-note"
                    placeholder="Note (optional)"
                    value={ex.note}
                    onChange={(e) => updateDateException(i, 'note', e.target.value)}
                  />
                  <button type="button" className="link-remove" onClick={() => removeDateException(i)}>✕</button>
                </div>
              ))
            )}
          </section>

          <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </form>
      )}

      {/* ---------- CANDIDATE: Work preferences ---------- */}

      {/* ---------- CANDIDATE: Work preferences ---------- */}
      {tab === 'Work preferences' && !isRecruiter && (
        <form className="resume-form" onSubmit={submit}>
          <section className="resume-section">
            <h2>Domain interests</h2>
            <p className="resume-hint">What domains are you interested in? Select all that apply.</p>
            <div className="hobby-options">
              {DOMAIN_OPTIONS.map((d) => (
                <button type="button" key={d} className={`hobby-chip ${form.domainInterests.includes(d) ? 'selected' : ''}`} onClick={() => toggleDomain(d)}>{d}</button>
              ))}
            </div>
            <input
              className="domain-other-input"
              placeholder="Others (please specify)"
              value={form.otherDomainInterest}
              onChange={(e) => setForm({ ...form, otherDomainInterest: e.target.value })}
            />
          </section>

          <section className="resume-section">
            <h2>Work arrangement</h2>
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
          </section>

          <section className="resume-section">
            <h2>Minimum expected compensation</h2>
            <p className="resume-hint">This stays private and won't impact your offers.</p>
            <div className="resume-row">
              <label>Full-time ($/year)
                <input type="number" value={form.minCompensation.fullTime}
                  onChange={(e) => setForm({ ...form, minCompensation: { ...form.minCompensation, fullTime: e.target.value } })} />
              </label>
              <label>Part-time ($/hour)
                <input type="number" value={form.minCompensation.partTime}
                  onChange={(e) => setForm({ ...form, minCompensation: { ...form.minCompensation, partTime: e.target.value } })} />
              </label>
            </div>
          </section>

          <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </form>
      )}

      {/* ---------- RECRUITER: Company Profile ---------- */}
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
            <label>About / hiring focus<textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></label>
          </section>
          <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </form>
      )}

      {/* ---------- BOTH ROLES: Communications ---------- */}
      {tab === 'Communications' && (
        <form className="resume-form" onSubmit={submit}>
          <section className="resume-section">
            <div className="toggle-row">
              <div>
                <strong>Looking for work</strong>
                <p className="resume-hint">Pause job-related outreach if you're not currently looking.</p>
              </div>
              <Toggle checked={form.communicationPrefs.lookingForWork}
                onChange={(v) => setForm({ ...form, communicationPrefs: { ...form.communicationPrefs, lookingForWork: v } })} />
            </div>
          </section>

          <section className="resume-section">
            <h2>Communication channels</h2>
            <div className="toggle-row">
              <div><strong>Email</strong></div>
              <Toggle checked={form.communicationPrefs.emailChannel}
                onChange={(v) => setForm({ ...form, communicationPrefs: { ...form.communicationPrefs, emailChannel: v } })} />
            </div>
            <div className="toggle-row">
              <div><strong>Text message (SMS)</strong></div>
              <Toggle checked={form.communicationPrefs.smsChannel}
                onChange={(v) => setForm({ ...form, communicationPrefs: { ...form.communicationPrefs, smsChannel: v } })} />
            </div>
          </section>

          <section className="resume-section">
            <h2>Opportunity types</h2>
            <div className="toggle-row">
              <div><strong>Full-time opportunities</strong><p className="resume-hint">Contact me about full-time roles</p></div>
              <Toggle checked={form.communicationPrefs.fullTimeOpportunities}
                onChange={(v) => setForm({ ...form, communicationPrefs: { ...form.communicationPrefs, fullTimeOpportunities: v } })} />
            </div>
            <div className="toggle-row">
              <div><strong>Part-time opportunities</strong><p className="resume-hint">Contact me about part-time roles</p></div>
              <Toggle checked={form.communicationPrefs.partTimeOpportunities}
                onChange={(v) => setForm({ ...form, communicationPrefs: { ...form.communicationPrefs, partTimeOpportunities: v } })} />
            </div>
            <div className="toggle-row">
              <div><strong>Referral opportunities</strong><p className="resume-hint">Contact me about referral opportunities</p></div>
              <Toggle checked={form.communicationPrefs.referralOpportunities}
                onChange={(v) => setForm({ ...form, communicationPrefs: { ...form.communicationPrefs, referralOpportunities: v } })} />
            </div>
          </section>

          <section className="resume-section">
            <h2>General</h2>
            <div className="toggle-row">
              <div><strong>Job opportunities</strong><p className="resume-hint">Receive notifications about new job openings and invitations.</p></div>
              <Toggle checked={form.communicationPrefs.jobOpportunityNotifs}
                onChange={(v) => setForm({ ...form, communicationPrefs: { ...form.communicationPrefs, jobOpportunityNotifs: v } })} />
            </div>
            <div className="toggle-row">
              <div><strong>Work-related updates</strong><p className="resume-hint">Get updates about offers, contracts, and status changes.</p></div>
              <Toggle checked={form.communicationPrefs.workUpdateNotifs}
                onChange={(v) => setForm({ ...form, communicationPrefs: { ...form.communicationPrefs, workUpdateNotifs: v } })} />
            </div>
            <div className="toggle-row">
              <div><strong>Unsubscribe from all</strong><p className="resume-hint">Turn this on to stop all outreach.</p></div>
              <Toggle checked={form.communicationPrefs.unsubscribedAll}
                onChange={(v) => setForm({ ...form, communicationPrefs: { ...form.communicationPrefs, unsubscribedAll: v } })} />
            </div>
          </section>

          <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </form>
      )}

      {/* ---------- BOTH ROLES: Account ---------- */}
      {tab === 'Account' && (
        <div className="resume-form">
          <section className="resume-section">
            <h2>Avatar</h2>
            <div className="avatar-row">
              <div className="avatar-preview">
                {form.avatarUrl ? <img src={form.avatarUrl} alt="Avatar" /> : <span>{(user?.name || '?').charAt(0).toUpperCase()}</span>}
              </div>
              <div>
                <label className="btn secondary avatar-upload-btn">
                  Change avatar
                  <input type="file" accept="image/png,image/jpeg,image/gif" onChange={onAvatarSelected} hidden />
                </label>
                <p className="resume-hint">JPG, PNG, or GIF. Max 2MB.</p>
              </div>
            </div>
            <div className="toggle-row" style={{ marginTop: '1rem' }}>
              <div><strong>Generative profile pictures</strong><p className="resume-hint">Let AI generate a professional photo from your interview.</p></div>
              <Toggle checked={form.generativeAvatarOptIn} onChange={(v) => setForm({ ...form, generativeAvatarOptIn: v })} />
            </div>
            <button type="button" className="btn primary" onClick={submit} disabled={saving} style={{ marginTop: '1rem' }}>
              {saving ? 'Saving...' : 'Save avatar settings'}
            </button>
          </section>

          <section className="resume-section">
            <h2>Payout preferences</h2>
            <div className="payout-notice">
              <strong>Payment method setup required</strong>
              <p>Complete your payment method setup during job acceptance to enable payouts. (Not yet wired to a real payment processor in this build.)</p>
            </div>
          </section>

          <section className="resume-section">
            <h2>Change email</h2>
            <form className="resume-form" onSubmit={submitEmailChange} style={{ maxWidth: 420 }}>
              <label>New email<input type="email" value={emailForm.newEmail} onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })} required /></label>
              <label>Confirm password<input type="password" value={emailForm.password} onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })} required /></label>
              <button type="submit" className="btn secondary" disabled={emailBusy}>{emailBusy ? 'Updating...' : 'Change email'}</button>
            </form>
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

          <section className="resume-section">
            <h2>Delete account</h2>
            <p className="resume-hint">Permanently delete your account and all data. This cannot be undone.</p>
            {!deleteConfirming ? (
              <button type="button" className="btn danger" onClick={() => setDeleteConfirming(true)}>Delete account</button>
            ) : (
              <div className="delete-confirm-box">
                <p>Enter your password to confirm permanent deletion:</p>
                <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder="Password" />
                <div className="delete-confirm-actions">
                  <button type="button" className="btn danger" onClick={deleteAccount} disabled={deleteBusy || !deletePassword}>
                    {deleteBusy ? 'Deleting...' : 'Confirm permanent delete'}
                  </button>
                  <button type="button" className="link-btn" onClick={() => { setDeleteConfirming(false); setDeletePassword(''); }}>Cancel</button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}