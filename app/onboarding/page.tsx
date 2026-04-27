"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Experience = { company: string; role: string; startDate: string; endDate: string; description: string; };
type Education = { school: string; degree: string; startDate: string; endDate: string; };
type Language = { name: string; level: string; };

const STEPS = ["Personal info", "Experience", "Education", "Skills", "Languages"];
const LEVELS = ["Basic", "Conversational", "Professional", "Fluent", "Native"];
const ALL_LANGUAGES = [
  "Afrikaans","Albanian","Arabic","Armenian","Azerbaijani","Basque","Bengali","Bosnian",
  "Bulgarian","Catalan","Chinese (Mandarin)","Chinese (Cantonese)","Croatian","Czech",
  "Danish","Dutch","English","Estonian","Finnish","French","Galician","Georgian","German",
  "Greek","Gujarati","Hebrew","Hindi","Hungarian","Icelandic","Indonesian","Irish","Italian",
  "Japanese","Kannada","Kazakh","Korean","Latvian","Lithuanian","Macedonian","Malay",
  "Maltese","Marathi","Mongolian","Nepali","Norwegian","Persian","Polish","Portuguese",
  "Punjabi","Romanian","Russian","Serbian","Sinhala","Slovak","Slovenian","Somali",
  "Spanish","Swahili","Swedish","Tagalog","Tamil","Telugu","Thai","Turkish","Ukrainian",
  "Urdu","Uzbek","Vietnamese","Welsh","Yoruba","Zulu"
];

const inputClass = "w-full text-sm text-gray-800 bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-gray-400 placeholder-gray-300";

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
          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        {onRemove && (
          <button onClick={onRemove} className="text-gray-300 hover:text-red-400 transition-colors text-sm px-1">x</button>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [experiences, setExperiences] = useState<Experience[]>([{ company: "", role: "", startDate: "", endDate: "", description: "" }]);
  const [education, setEducation] = useState<Education[]>([{ school: "", degree: "", startDate: "", endDate: "" }]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [languages, setLanguages] = useState<Language[]>([{ name: "", level: "Professional" }]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      const { data } = await supabase.from("profiles").select("onboarding_completed").eq("id", user.id).single();
      if (data?.onboarding_completed) { router.push("/"); return; }
      setLoaded(true);
    };
    check();
  }, []);

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

  const handleFinish = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").upsert({
      id: user.id, full_name: fullName, title, location,
      experiences, education, skills, languages, onboarding_completed: true,
    });
    router.push("/");
  };

  if (!loaded) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="max-w-xl mx-auto px-6 py-16 min-h-screen">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-6">Interview Prep</p>
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${i <= step ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"}`}>
                {i < step ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`h-px w-6 ${i < step ? "bg-gray-900" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>
        <h1 className="text-2xl font-light text-gray-900 tracking-tight">{STEPS[step]}</h1>
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">Full name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="Jane Doe" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">Current title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Software Engineer" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">Location</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} placeholder="Paris, France" />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          {experiences.map((exp, i) => (
            <div key={i} className="space-y-3 border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-gray-400">Experience {i + 1}</p>
                {experiences.length > 1 && <button onClick={() => setExperiences(experiences.filter((_, idx) => idx !== i))} className="text-xs text-gray-300 hover:text-red-400 transition-colors">Remove</button>}
              </div>
              <input type="text" value={exp.company} onChange={(e) => updateExperience(i, "company", e.target.value)} className={inputClass} placeholder="Company name" />
              <input type="text" value={exp.role} onChange={(e) => updateExperience(i, "role", e.target.value)} className={inputClass} placeholder="Job title" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={exp.startDate} onChange={(e) => updateExperience(i, "startDate", e.target.value)} className={inputClass} placeholder="Start (e.g. Jan 2022)" />
                <input type="text" value={exp.endDate} onChange={(e) => updateExperience(i, "endDate", e.target.value)} className={inputClass} placeholder="End (or Present)" />
              </div>
              <textarea value={exp.description} onChange={(e) => updateExperience(i, "description", e.target.value)} className={`${inputClass} h-24 resize-none`} placeholder="Key responsibilities and achievements..." />
            </div>
          ))}
          <button onClick={() => setExperiences([...experiences, { company: "", role: "", startDate: "", endDate: "", description: "" }])} className="w-full py-3 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl hover:border-gray-400 transition-colors">+ Add experience</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          {education.map((edu, i) => (
            <div key={i} className="space-y-3 border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-gray-400">Education {i + 1}</p>
                {education.length > 1 && <button onClick={() => setEducation(education.filter((_, idx) => idx !== i))} className="text-xs text-gray-300 hover:text-red-400 transition-colors">Remove</button>}
              </div>
              <input type="text" value={edu.school} onChange={(e) => updateEducation(i, "school", e.target.value)} className={inputClass} placeholder="University or school name" />
              <input type="text" value={edu.degree} onChange={(e) => updateEducation(i, "degree", e.target.value)} className={inputClass} placeholder="Degree (e.g. BSc Computer Science)" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={edu.startDate} onChange={(e) => updateEducation(i, "startDate", e.target.value)} className={inputClass} placeholder="Start year" />
                <input type="text" value={edu.endDate} onChange={(e) => updateEducation(i, "endDate", e.target.value)} className={inputClass} placeholder="End year" />
              </div>
            </div>
          ))}
          <button onClick={() => setEducation([...education, { school: "", degree: "", startDate: "", endDate: "" }])} className="w-full py-3 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl hover:border-gray-400 transition-colors">+ Add education</button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">Skills</label>
            <p className="text-xs text-gray-400 mb-3">Type a skill and press Enter to add it.</p>
            <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={addSkill} className={inputClass} placeholder="e.g. React, Python, Project Management..." />
          </div>
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
      )}

      {step === 4 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 mb-4">Select languages you speak and your proficiency level.</p>
          {languages.map((lang, i) => (
            <LanguageRow
              key={i}
              lang={lang}
              onUpdate={(field, value) => updateLanguage(i, field, value)}
              onRemove={languages.length > 1 ? () => setLanguages(languages.filter((_, idx) => idx !== i)) : null}
            />
          ))}
          <button onClick={() => setLanguages([...languages, { name: "", level: "Professional" }])} className="w-full py-3 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl hover:border-gray-400 transition-colors">+ Add language</button>
        </div>
      )}

      <div className="flex gap-3 mt-10">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="flex-1 py-3.5 text-sm font-medium border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all">Back</button>
        )}
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(step + 1)} className="flex-1 py-3.5 text-sm font-medium bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition-all">Continue</button>
        ) : (
          <button onClick={handleFinish} disabled={saving} className="flex-1 py-3.5 text-sm font-medium bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-25 transition-all">
            {saving ? "Saving..." : "Finish setup"}
          </button>
        )}
      </div>
    </main>
  );
}
