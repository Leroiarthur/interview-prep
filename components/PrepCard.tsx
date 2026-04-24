import { PrepData, CvWeakness } from "@/lib/types";

export default function PrepCard({ data }: { data: PrepData }) {
  const site = data.website;
  const loc = data.location;
  return (
    <div className="space-y-10">
      <div className="pb-6 border-b border-gray-100 space-y-2">
        {loc && <p className="text-sm text-gray-500"><span className="text-gray-300 mr-2">Location</span><span className="font-medium text-gray-800">{loc}</span></p>}
        {site && <p className="text-sm text-gray-500"><span className="text-gray-300 mr-2">Website</span><a href={site} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-800 underline underline-offset-2 hover:text-blue-600 transition-colors">{site.replace(/^https?:\/\//, "")}</a></p>}
      </div>
      <Section label="Role summary"><p className="text-sm leading-relaxed text-gray-600">{data.summary}</p></Section>
      <Section label="Keywords">
        <div className="flex flex-wrap gap-2">
          {data.keywords.map((kw: string) => (<span key={kw} className="text-xs border border-gray-200 rounded px-2.5 py-1 text-gray-500">{kw}</span>))}
        </div>
      </Section>
      <Section label="About the company"><p className="text-sm leading-relaxed text-gray-600">{data.company.summary}</p></Section>
      <Section label="What they expect"><p className="text-sm leading-relaxed text-gray-600">{data.expectations}</p></Section>
      <Section label="Likely technical questions"><QuestionList questions={data.technicalQuestions} /></Section>
      <Section label="Behavioral questions"><QuestionList questions={data.behavioralQuestions} /></Section>
      <Section label="Smart questions to ask"><QuestionList questions={data.questionsToAsk} /></Section>
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

function QuestionList({ questions }: { questions: string[] }) {
  return (
    <ol className="space-y-3">
      {questions.map((q: string, i: number) => (
        <li key={i} className="flex gap-4 text-sm">
          <span className="text-gray-300 font-mono w-4 shrink-0">{i + 1}</span>
          <span className="text-gray-600 leading-relaxed">{q}</span>
        </li>
      ))}
    </ol>
  );
}