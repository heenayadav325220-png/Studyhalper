import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Language, t } from '../services/translations';
import { FileText, Upload, Sparkles, FolderKanban, Eye } from 'lucide-react';
import { subscribeToDocuments, saveStudyDocument } from '../services/firebaseDb';
import { StudyDocument } from '../types';
import Markdown from 'react-markdown';

interface StudyDocsPanelProps {
  lang: Language;
  userId: string;
  onEarnXp: (amount: number) => void;
}

export const StudyDocsPanel: React.FC<StudyDocsPanelProps> = ({
  lang,
  userId,
  onEarnXp
}) => {
  const [docs, setDocs] = useState<StudyDocument[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeDoc, setActiveDoc] = useState<StudyDocument | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Subscribe to real-time documents from Firebase
  useEffect(() => {
    const unsubscribe = subscribeToDocuments(userId, (syncedDocs) => {
      setDocs(syncedDocs);
    });
    return () => unsubscribe();
  }, [userId]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/summarize-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, language: lang })
      });

      if (!res.ok) {
        throw new Error('AI summarization is currently offline. Verify your GEMINI_API_KEY configuration.');
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Save document to Firestore
      const newDoc: StudyDocument = {
        id: Math.random().toString(36).substring(2, 11),
        ownerId: userId,
        title,
        content,
        summary: data.summary,
        tagsJson: JSON.stringify(['AI-Summary', title.split(' ')[0] || 'Study']),
        isShared: true, // share so group can see it in real-time
        timestamp: new Date().toISOString()
      };

      await saveStudyDocument(newDoc);
      setActiveDoc(newDoc);
      setTitle('');
      setContent('');
      onEarnXp(100); // Complete study doc summary, earn 100 XP!
    } catch (err: any) {
      alert(`Error: ${err.message || 'Failed to analyze material.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Drag and Drop files following specifications
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const processFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text);
      // set title as file name
      const cleanName = file.name.split('.').slice(0, -1).join('.') || file.name;
      setTitle(cleanName);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Upload & Form Section */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-400" />
            {t('uploadNotes', lang)}
          </h3>

          <form onSubmit={handleAnalyze} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Document Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Chapter 1 Newton Notes"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-slate-100"
              />
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer relative ${
                isDragOver
                  ? 'border-indigo-500 bg-indigo-500/5'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
              }`}
            >
              <input
                type="file"
                accept=".txt,.md,.json,.html"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-xs text-slate-300 font-semibold mb-1">Drag file here, or click to browse</p>
              <p className="text-[10px] text-slate-500 font-mono">Supports .txt, .md files</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Paste Study Content / Transcript</label>
              <textarea
                required
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste equations, long historical paragraphs, transcripts or study slides here..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl text-sm transition duration-150 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-white" />
                  {t('summarizeNotes', lang)}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Saved Summaries Sidepanel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h4 className="font-bold text-slate-200 text-sm mb-4 flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-violet-400" />
            Library Notes ({docs.length})
          </h4>

          {docs.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-500 font-mono">{t('noDocumentsYet', lang)}</p>
          ) : (
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {docs.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setActiveDoc(d)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition duration-150 flex items-center justify-between ${
                    activeDoc?.id === d.id
                      ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-300 font-medium'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="truncate flex items-center gap-2">
                    <span className="text-sm">📄</span>
                    <span className="truncate">{d.title}</span>
                  </div>
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Viewing details Section */}
      <div className="lg:col-span-2">
        {activeDoc ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-slate-100 text-lg">{activeDoc.title}</h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  Created: {new Date(activeDoc.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-1.5">
                {JSON.parse(activeDoc.tagsJson).map((tag: string, i: number) => (
                  <span
                    key={i}
                    className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-mono px-2 py-0.5 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Split Content view */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Summary */}
              <div className="space-y-3 bg-slate-950/60 border border-slate-800/80 p-5 rounded-xl">
                <h4 className="font-semibold text-indigo-400 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {t('summaryResult', lang)}
                </h4>
                <div className="markdown-body text-xs text-slate-300 leading-relaxed overflow-y-auto max-h-[400px]">
                  <Markdown>{activeDoc.summary}</Markdown>
                </div>
              </div>

              {/* Right Column: Original content */}
              <div className="space-y-3 bg-slate-950/20 border border-slate-800/50 p-5 rounded-xl">
                <h4 className="font-semibold text-slate-500 text-xs font-mono uppercase tracking-wider">
                  Original Source Material
                </h4>
                <div className="text-xs text-slate-400 leading-relaxed overflow-y-auto max-h-[400px] font-mono whitespace-pre-line">
                  {activeDoc.content}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl h-full min-h-[350px] flex items-center justify-center text-center p-6">
            <div>
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-300 mb-1">No document selected</p>
              <p className="text-xs text-slate-500">Analyze a new document or select one from the library notes on the left.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
