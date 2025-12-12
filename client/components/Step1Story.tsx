import React, { useState } from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import { ComicStyle } from '../types';

interface Step1Props {
  onNext: (data: { title: string; description: string; style: ComicStyle; pageCount: number }) => void;
}

export const Step1Story: React.FC<Step1Props> = ({ onNext }) => {
  const [title, setTitle] = useState('The Last Cyber-Samurai');
  const [description, setDescription] = useState('A lone samurai robot wanders a neon-lit, post-apocalyptic Tokyo searching for a rare battery to save his cat.');
  const [style, setStyle] = useState<ComicStyle>(ComicStyle.MANGA);
  const [pageCount, setPageCount] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ title, description, style, pageCount });
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-indigo-600 p-6 text-white">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          Story Context
        </h2>
        <p className="text-indigo-100 mt-1">Define your world and let the AI build the narrative.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Project Title</label>
          <input
            type="text"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Story Description</label>
          <textarea
            required
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your characters, setting, and plot..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Art Style</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={style}
              onChange={(e) => setStyle(e.target.value as ComicStyle)}
            >
              {Object.values(ComicStyle).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Length (Pages)</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="4"
                className="w-full accent-indigo-600 cursor-pointer"
                value={pageCount}
                onChange={(e) => setPageCount(parseInt(e.target.value))}
              />
              <span className="font-bold text-indigo-600 w-8 text-center">{pageCount}</span>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all flex justify-center items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Generate Scenes
          </button>
        </div>
      </form>
    </div>
  );
};
