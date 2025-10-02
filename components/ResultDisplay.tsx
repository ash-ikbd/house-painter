import React from 'react';
import { ImageComparator } from './ImageComparator';

interface ResultDisplayProps {
  originalImage: string;
  analysis: string;
  newImage: string;
}

// A simple parser to render the Bengali markdown-like text into structured HTML
const AnalysisContent: React.FC<{ content: string }> = ({ content }) => {
    const sections = content.split('---').map(s => s.trim());

    return (
        <div className="space-y-6 text-gray-700 dark:text-gray-300">
            {sections.map((section, index) => {
                const lines = section.split('\n').filter(line => line.trim() !== '');
                if (lines.length === 0) return null;

                const title = lines.shift() || '';

                if (title.includes(' রঙের স্কিম সংক্ষেপে')) {
                    // Table Section
                    const header = lines.shift()?.split('|').map(h => h.trim()).filter(Boolean);
                    const divider = lines.shift(); // remove divider line
                    const rows = lines.map(row => row.split('|').map(cell => cell.trim()).filter(Boolean));
                    
                    return (
                        <div key={index}>
                            <h3 className="text-lg font-semibold mb-2">{title}</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            {header?.map((h, i) => <th key={i} className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">{h}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {rows.map((row, i) => (
                                            <tr key={i}>
                                                {row.map((cell, j) => <td key={j} className="px-4 py-2 whitespace-nowrap text-sm">{cell}</td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                } else if (title.startsWith('🎨 রঙের প্রস্তাবনা') || title.startsWith('✅ আরও কিছু টিপস:') || title.startsWith('🏠') || title.startsWith('🪟') || title.startsWith('🎨')) {
                    // List Section
                    return (
                        <div key={index}>
                            <h3 className="text-lg font-semibold mb-2">{title}</h3>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                {lines.map((line, i) => <li key={i}>{line.replace(/^-/, '').trim()}</li>)}
                            </ul>
                        </div>
                    );
                }
                
                return null;
            })}
        </div>
    );
};


export const ResultDisplay: React.FC<ResultDisplayProps> = ({ originalImage, analysis, newImage }) => {
  return (
    <div className="w-full space-y-6 animate-fade-in">
      <ImageComparator originalImage={originalImage} newImage={newImage} />
      
      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold mb-4 text-center">AI Color Analysis</h3>
        <AnalysisContent content={analysis} />
      </div>
    </div>
  );
};