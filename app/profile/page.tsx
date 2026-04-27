"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

type Experience = { company: string; role: string; startDate: string; endDate: string; description: string; };
type Education = { school: string; degree: string; startDate: string; endDate: string; };
type Language = { name: string; level: string; };

const LEVELS = ["Basic", "Conversational", "Professional", "Fluent", "Native"];
const inputClass = "w-full text-sm text-gray-800 bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-gray-400 placeholder-gray-300";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [languages, setLanguages] = useState<Language[]>([]);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      setUserEmail(user.email ?? null);
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setProfile(data);
        setFullName(data.full_name ?? "");
        setTitle(data.title ?? "");
        setLocation(data.location ?? "");
        setExperiences(data.experiences ?? []);
        setEducation(data.education ?? []);
        setSkills(data.skills ?? []);
        setLanguages(data.languages ?? []);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async (section: string) => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      title,
      location,
      experiences,
      education,
      skills,
      languages,
      onboarding_completed: true,
    });
    setSaving(false);
    setEditingSection(null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const updateExperience = (i: number, field: keyof Experience, value: string) => {
    const updated = [...experiences]; updated[i][field] = value; setExperiences(updated);
  };
  const updateEducation = (i: number, field: keyof Education, value: string) => {
    const updated = [...education]; updated[i][field] = value; setEducation(updated);
  };
  const updateLanguage = (i: number, field: keyof Language, value: string) => {
    const updated = [...languages]; updated[i][field] = value; setLanguages(updated);
  };
  const addSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && skillInput.trim()) {
      if (!skills.includes(skillInput.trim())) setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen">
      <Navbar showBack backHref="/" backLabel="Interview Prep" />

      <main className="max-w-2xl mx-auto px-6 py-12 space-y-10">

        <SectionWrapper label="Personal info" editing={editingSection === "info"} onEdit={() => setEditingSection("info")} onSave={() => handleSave("info")} onCancel={() => setEditingSection(null)} saving={saving}>
          {editingSection === "info" ? (
            <div className="space-y-3">
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="Full name" />
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Current title" />
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} placeholder="Location" />
            </div>
          ) : (
            <div>
              <p className="text-2xl font-light text-gray-900">{fullName || "No name set"}</p>
              {title && <p className="text-sm text-gray-500 mt-1">{title}</p>}
              {location && <p className="text-xs text-gray-400 mt-0.5">{location}</p>}
              <p className="text-xs text-gray-400 mt-0.5">{userEmail}</p>
            </div>
          )}
        </SectionWrapper>

        <SectionWrapper label="Experience" editing={editingSection === "exp"} onEdit={() => setEditingSection("exp")} onSave={() => handleSave("exp")} onCancel={() => setEditingSection(null)} saving={saving}>
          {editingSection === "exp" ? (
            <div className="space-y-4">
              {experiences.map((exp, i) => (
                <div key={i} className="space-y-3 border border-gray-100 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xs uppercase tracking-widest text-gray-400">Experience {i + 1}</p>
                    {experiences.length > 1 && <button onClick={() => setExperiences(experiences.filter((_, idx) => idx !== i))} className="text-xs text-gray-300 hover:text-red-400 transition-colors">Remove</button>}
                  </div>
                  <input type="text" value={exp.company} onChange={(e) => updateExperience(i, "company", e.target.value)} className={inputClass} placeholder="Company" />
                  <input type="text" value={exp.role} onChange={(e) => updateExperience(i, "role", e.target.value)} className={inputClass} placeholder="Job title" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" value={exp.startDate} onChange={(e) => updateExperience(i, "startDate", e.target.value)} className={inputClass} placeholder="Start" />
                    <input type="text" value={exp.endDate} onChange={(e) => updateExperience(i, "endDate", e.target.value)} className={inputClass} placeholder="End" />
                  </div>
                  <textarea value={exp.description} onChange={(e) => updateExperience(i, "description", e.target.value)} className={`${inputClass} h-20 resize-none`} placeholder="Description" />
                </div>
              ))}
              <button onClick={() => setExperiences([...experiences, { company: "", role: "", startDate: "", endDate: "", description: "" }])} className="w-full py-3 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl hover:border-gray-400 transition-colors">+ Add experience</button>
            </div>
          ) : (
            <div className="space-y-5">
              {experiences.length === 0 && <p className="text-sm text-gray-400">No experience added yet.</p>}
              {experiences.map((exp, i) => (
                <div key={i} className="border-l-2 border-gray-100 pl-4">
                  <p className="text-sm font-medium text-gray-800">{exp.role}</p>
                  <p className="text-sm text-gray-500">{exp.company}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : ""}</p>
                  {exp.description && <p className="text-sm text-gray-500 mt-1 leading-relaxed">{exp.description}</p>}
                </div>
              ))}
            </div>
          )}
        </SectionWrapper>

        <SectionWrapper label="Education" editing={editingSection === "edu"} onEdit={() => setEditingSection("edu")} onSave={() => handleSave("edu")} onCancel={() => setEditingSection(null)} saving={saving}>
          {editingSection === "edu" ? (
            <div className="space-y-4">
              {education.map((edu, i) => (
                <div key={i} className="space-y-3 border border-gray-100 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xs uppercase tracking-widest text-gray-400">Education {i + 1}</p>
                    {education.length > 1 && <button onClick={() => setEducation(education.filter((_, idx) => idx !== i))} className="text-xs text-gray-300 hover:text-red-400 transition-colors">Remove</button>}
                  </div>
                  <input type="text" value={edu.school} onChange={(e) => updateEducation(i, "school", e.target.value)} className={inputClass} placeholder="School" />
                  <input type="text" value={edu.degree} onChange={(e) => updateEducation(i, "degree", e.target.value)} className={inputClass} placeholder="Degree" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" value={edu.startDate} onChange={(e) => updateEducation(i, "startDate", e.target.value)} className={inputClass} placeholder="Start" />
                    <input type="text" value={edu.endDate} onChange={(e) => updateEducation(i, "endDate", e.target.value)} className={inputClass} placeholder="End" />
                  </div>
                </div>
              ))}
              <button onClick={() => setEducation([...education, { school: "", degree: "", startDate: "", endDate: "" }])} className="w-full py-3 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl hover:border-gray-400 transition-colors">+ Add education</button>
            </div>
          ) : (
            <div className="space-y-5">
              {education.length === 0 && <p className="text-sm text-gray-400">No education added yet.</p>}
              {education.map((edu, i) => (
                <div key={i} className="border-l-2 border-gray-100 pl-4">
                  <p className="text-sm font-medium text-gray-800">{edu.degree}</p>
                  <p className="text-sm text-gray-500">{edu.school}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ""}</p>
                </div>
              ))}
            </div>
          )}
        </SectionWrapper>

        <SectionWrapper label="Skills" editing={editingSection === "skills"} onEdit={() => setEditingSection("skills")} onSave={() => handleSave("skills")} onCancel={() => setEditingSection(null)} saving={saving}>
          {editingSection === "skills" ? (
            <div className="space-y-3">
              <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={addSkill} className={inputClass} placeholder="Type a skill and press Enter..." />
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span key={skill} className="flex items-center gap-1.5 text-xs border border-gray-200 rounded-full px-3 py-1.5 text-gray-600">
                      {skill}
                      <button onClick={() => setSkills(skills.filter((s) => s !== skill))} className="text-gray-300 hover:text-red-400 transition-colors">x</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.length === 0 && <p className="text-sm text-gray-400">No skills added yet.</p>}
              {skills.map((skill) => (
                <span key={skill} className="text-xs border border-gray-200 rounded-full px-3 py-1.5 text-gray-600">{skill}</span>
              ))}
            </div>
          )}
        </SectionWrapper>

        <SectionWrapper label="Languages" editing={editingSection === "lang"} onEdit={() => setEditingSection("lang")} onSave={() => handleSave("lang")} onCancel={() => setEditingSection(null)} saving={saving}>
          {editingSection === "lang" ? (
            <div className="space-y-3">
              {languages.map((lang, i) => (
                <LanguageRow key={i} lang={lang} onUpdate={(field, value) => updateLanguage(i, field, value)} onRemove={languages.length > 1 ? () => setLanguages(languages.filter((_, idx) => idx !== i)) : null} />
              ))}
              <button onClick={() => setLanguages([...languages, { name: "", level: "Professional" }])} className="w-full py-3 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl hover:border-gray-400 transition-colors">+ Add language</button>
            </div>
          ) : (
            <div className="space-y-2">
              {languages.length === 0 && <p className="text-sm text-gray-400">No languages added yet.</p>}
              {languages.filter(l => l.name).map((lang, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{lang.name}</span>
                  <span className="text-xs text-gray-400 border border-gray-100 rounded-full px-3 py-1">{lang.level}</span>
                </div>
              ))}
            </div>
          )}
        </SectionWrapper>

      </main>
    </div>
  );
}

const ALL_LANGUAGES = [
  "Afrikaans","Albanian","Arabic","Armenian","Azerbaijani","Basque","Belarusian","Bengali",
  "Bosnian","Bulgarian","Catalan","Chinese (Mandarin)","Chinese (Cantonese)","Croatian",
  "Czech","Danish","Dutch","English","Estonian","Finnish","French","Galician","Georgian",
  "German","Greek","Gujarati","Hebrew","Hindi","Hungarian","Icelandic","Indonesian","Irish",
  "Italian","Japanese","Kannada","Kazakh","Korean","Latvian","Lithuanian","Macedonian",
  "Malay","Maltese","Marathi","Mongolian","Nepali","Norwegian","Persian","Polish",
  "Portuguese","Punjabi","Romanian","Russian","Serbian","Sinhala","Slovak","Slovenian",
  "Somali","Spanish","Swahili","Swedish","Tagalog","Tamil","Telugu","Thai","Turkish",
  "Ukrainian","Urdu","Uzbek","Vietnamese","Welsh","Yoruba","Zulu"
];

function LanguageRow({ lang, onUpdate, onRemove }: {
  lang: Language;
  onUpdate: (field: keyof Language, value: string) => void;
  onRemove: (() => void) | null;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = ALL_LANGUAGES.filter((l) => l.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="grid grid-cols-2 gap-3 items-start">
      <div className="relative">
        <div
          onClick={() => setOpen(!open)}
          className="w-full text-sm text-gray-800 bg-white border border-gray-200 rounded-xl px-4 py-3 cursor-pointer flex items-center justify-between"
        >
          <span className={lang.name ? "text-gray-800" : "text-gray-300"}>{lang.name || "Select a language"}</span>
          <span className="text-gray-400 text-xs ml-2">{open ? "▲" : "▼"}</span>
        </div>
        {open && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 placeholder-gray-300"
                placeholder="Search language..."
                autoFocus
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.length === 0 && <p className="text-sm text-gray-400 px-4 py-3">No results</p>}
              {filtered.map((l) => (
                <button
                  key={l}
                  onClick={() => { onUpdate("name", l); setOpen(false); setSearch(""); }}
                  className={`w-full text-left text-sm px-4 py-2.5 hover:bg-gray-50 transition-colors ${lang.name === l ? "text-gray-900 font-medium" : "text-gray-600"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2 items-center">
        <select
          value={lang.level}
          onChange={(e) => onUpdate("level", e.target.value)}
          className="flex-1 text-sm text-gray-800 bg-white border border-gray-200 rounded-xl px-3 py-3 focus:outline-none focus:ring-1 focus:ring-gray-400 h-[50px]"
        >
          {["Basic","Conversational","Professional","Fluent","Native"].map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        {onRemove && (
          <button onClick={onRemove} className="text-gray-300 hover:text-red-400 transition-colors text-sm px-1">x</button>
        )}
      </div>
    </div>
  );
}

function SectionWrapper({ label, editing, onEdit, onSave, onCancel, saving, children }: {
  label: string; editing: boolean; onEdit: () => void; onSave: () => void; onCancel: () => void; saving: boolean; children: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-100 pb-10">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-widest text-gray-400">{label}</p>
        {editing ? (
          <div className="flex gap-3">
            <button onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Cancel</button>
            <button onClick={onSave} disabled={saving} className="text-xs text-gray-700 font-medium hover:text-gray-900 transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        ) : (
          <button onClick={onEdit} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Edit</button>
        )}
      </div>
      {children}
    </div>
  );
}
