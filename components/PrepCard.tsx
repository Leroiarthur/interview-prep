"use client";

import { useState } from "react";
import { PrepData, CvWeakness } from "@/lib/types";
import PracticeModal from "./PracticeModal";

export default function PrepCard({ data }: { data: PrepData }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const allQuestions = [
    ...data.technicalQuestions.map((q) => ({ text: q, type: "Technical" })),
    ...data.behavioralQuestions.map((q) => ({ text: q, type: "Behavioral" })),
  ];

  const openModal = (index: number) => {
    setStartIndex(index);
    setModalOpen(true);
  };

  const mapsUrl = data.location
    ? "https://maps.google.com/?q=" + encodeURIComponent(data.location)
    : null;

  return (
    <div className="space-y-10">
      {modalOpen && (
        <PracticeModal
          questions={allQuestions}
          startIndex={startIndex}
          onClose={() => setModalOpen(false)}
        />
      )}

      <div className="pb-6 border-b border-gray-100 space-y-2">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500">
          {mapsUrl && data.location && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 transition-colors">
              {data.location}
            </a>
          )}
          {data.website && (
            <a href={data.website} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-800 underline underline-offset-2 hover:text-blue-600 transition-colors">
              {data.website.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
      </div>

      <Section label="Role summary">
        <p className="text-sm leading-relaxed text-gray-600">{data.summary}</p>
      </Section>

      <Section label="Keywords">
        <div className="flex flex-wrap gap-2">
          {data.keywords.map((kw: string) => (
            <span key={kw} className="text-xs border border-gray-200 rounded px-2.5 py-1 text-gray-500">{kw}</span>
          ))}
        </div>
      </Section>

      <Section label="About the company">
        <p className="text-sm leading-relaxed text-gray-600">{data.company.summary}</p>
      </Section>

      <Section label="What they expect">
        <p className="text-sm leading-relaxed text-gray-600">{data.expectations}</p>
      </Section>

      <Section label="Likely technical questions">
        <ol className="space-y-2">
          {data.technicalQuestions.map((q: string, i: number) => (
            <li key={i}>
              <button
                onClick={() => openModal(i)}
                className="flex gap-4 text-sm w-full text-left group"
              >
                <span className="text-gray-300 font-mono w-4 shrink-0 tabular-nums">{i + 1}</span>
                <span className="text-gray-600 leading-relaxed group-hover:text-gray-900 transition-colors">{q}</span>
                <span className="text-gray-200 group-hover:text-gray-400 transition-colors shrink-0 ml-auto text-xs self-center">Practice →</span>
              </button>
            </li>
          ))}
        </ol>
      </Section>

      <Section label="Behavioral questions">
        <ol className="space-y-2">
          {data.behavioralQuestions.map((q: string, i: number) => (
            <li key={i}>
              <button
                onClick={() => openModal(data.technicalQuestions.length + i)}
                className="flex gap-4 text-sm w-full text-left group"
              >
                <span className="text-gray-300 font-mono w-4 shrink-0 tabular-nums">{i + 1}</span>
                <span className="text-gray-600 leading-relaxed group-hover:text-gray-900 transition-colors">{q}</span>
                <span className="text-gray-200 group-hover:text-gray-400 transition-colors shrink-0 ml-auto text-xs self-center">Practice →</span>
              </button>
            </li>
          ))}
        </ol>
      </Section>

      <Section label="Smart questions to ask">
        <ol className="space-y-3">
          {data.questionsToAsk.map((q: string, i: number) => (
            <li key={i} className="flex gap-4 text-sm">
              <span className="text-gray-300 font-mono w-4 shrink-0">{i + 1}</span>
              <span className="text-gray-600 leading-relaxed">{q}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section label="Potential weaknesses and how to address them">
        <div className="space-y-5">
          {data.cvWeaknesses.map((item: CvWeakness, i: number) => (
            <div key={i} className="border-l-2 border-gray-200 pl-4">
              <p className="text-sm font-medium text-gray-700">{item.weakness}</p>
              <p className="text-sm text-gray-400 mt-1 leading-relaxed">{item.howToAddress}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">{label}</p>
      {children}
    </div>
  );
}
