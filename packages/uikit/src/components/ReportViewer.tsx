import React from 'react';

interface ReportViewerProps {
  report: string;
}

export function ReportViewer({ report }: ReportViewerProps) {
  if (!report) return null;

  const lines = report.split('\n');
  const sections = lines.reduce<{ heading: string; content: string }[]>((acc, line) => {
    if (line.startsWith('## ')) {
      acc.push({ heading: line.replace('## ', ''), content: '' });
    } else if (acc.length > 0) {
      acc[acc.length - 1].content += line + '\n';
    }
    return acc;
  }, []);

  return (
    <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-headings:font-medium prose-h2:text-[#F27D26] prose-h3:text-orange-300">
      {sections.map((section, i) => (
        <div key={i} className="mb-6">
          {section.heading && (
            <h2 className="text-lg font-medium text-[#F27D26] mb-3">{section.heading}</h2>
          )}
          <div className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
            {section.content}
          </div>
        </div>
      ))}
    </div>
  );
}
