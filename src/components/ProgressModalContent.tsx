import React, { useState } from 'react';
import { TrendingUp, FileText, CheckCircle, BookOpen, Award, Download, Calendar } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Progress, Note, ScheduleItem, User } from '../types';
import { translate } from '../services/translations';

interface ProgressModalContentProps {
  progress: Progress[];
  notes: Note[];
  schedule: ScheduleItem[];
  user: User | null;
  appLanguage: string;
}

export function ProgressModalContent({
  progress,
  notes,
  schedule,
  user,
  appLanguage,
}: ProgressModalContentProps) {
  const [activePeriod, setActivePeriod] = useState<'Weekly' | 'Monthly' | 'Yearly'>('Weekly');
  const [downloading, setDownloading] = useState(false);

  // Helper to compute stats based on active period
  const getPeriodStats = (period: 'Weekly' | 'Monthly' | 'Yearly') => {
    const now = new Date();
    let daysLimit = 7;
    let quizzesGoal = 7; // Weekly goal is 7 quizzes

    if (period === 'Monthly') {
      daysLimit = 30;
      quizzesGoal = 30; // Monthly goal is 30 quizzes
    } else if (period === 'Yearly') {
      daysLimit = 365;
      quizzesGoal = 365; // Yearly goal is 365 quizzes
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - daysLimit);

    // Filter practice quizzes within period
    const periodProgress = progress.filter((p) => {
      if (!p.date) return false;
      const pDate = new Date(p.date);
      return pDate >= cutoffDate && pDate <= now;
    });

    const quizzesTaken = periodProgress.length;

    // Calculate average score and percentage
    let averageScore = 0;
    let averagePct = 0;
    if (quizzesTaken > 0) {
      const totalScoreNorm = periodProgress.reduce((acc, curr) => {
        const normalized = (curr.score / curr.total) * 5;
        return acc + normalized;
      }, 0);
      averageScore = totalScoreNorm / quizzesTaken;

      const totalPct = periodProgress.reduce(
        (acc, curr) => acc + (curr.score / curr.total) * 100,
        0
      );
      averagePct = Math.round(totalPct / quizzesTaken);
    }

    // Filter notes written within this period
    const periodNotes = notes.filter((n) => {
      if (!n.updated_at) return false;
      const nDate = new Date(n.updated_at);
      return nDate >= cutoffDate && nDate <= now;
    });
    const notesCreated = periodNotes.length;

    // Filter completed planner tasks
    const completedTasksList = schedule.filter((s) => s.completed);
    let tasksCompleted = completedTasksList.length;
    if (period === 'Monthly') {
      tasksCompleted = completedTasksList.length * 4; // approximated
    } else if (period === 'Yearly') {
      tasksCompleted = completedTasksList.length * 52; // approximated
    }

    // Compile detailed log list
    const activities: { type: string; desc: string; date: string }[] = [];

    periodProgress.forEach((p) => {
      activities.push({
        type: appLanguage === 'Hindi' ? 'प्रश्नोत्तरी पूर्ण की' : 'Quiz Completed',
        desc:
          appLanguage === 'Hindi'
            ? `${p.subject} प्रश्नोत्तरी: ${p.score}/${p.total} अंक`
            : `${p.subject} Quiz: Scored ${p.score}/${p.total}`,
        date: new Date(p.date).toLocaleDateString(),
      });
    });

    periodNotes.forEach((n) => {
      activities.push({
        type: appLanguage === 'Hindi' ? 'नोट्स बनाए गए' : 'Note Created',
        desc:
          appLanguage === 'Hindi'
            ? `${n.subject} विषय पर "${n.title}" नोट`
            : `"${n.title}" note in ${n.subject}`,
        date: new Date(n.updated_at).toLocaleDateString(),
      });
    });

    completedTasksList.forEach((s) => {
      activities.push({
        type: appLanguage === 'Hindi' ? 'कार्य पूर्ण किया' : 'Planner Task Done',
        desc: `${s.task} (${s.time})`,
        date: appLanguage === 'Hindi' ? 'साप्ताहिक प्लानर' : 'Weekly Planner',
      });
    });

    // Sort by type then date description
    activities.sort((a, b) => b.type.localeCompare(a.type));

    return {
      quizzesTaken,
      quizzesGoal,
      averageScore,
      averagePct,
      notesCreated,
      tasksCompleted,
      activitiesList: activities,
    };
  };

  const stats = getPeriodStats(activePeriod);

  // Download PDF Report using jsPDF
  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const studentName = user?.name || (appLanguage === 'Hindi' ? 'अतिथि विद्यार्थी' : 'Guest Student');
      const school = user?.school || (appLanguage === 'Hindi' ? 'सामान्य अध्ययन' : 'General Studies');
      const className = user?.className || '6';
      const location = appLanguage === 'Hindi' ? 'केहर डबला' : 'Kehar Dabla';

      const doc = new jsPDF();
      const primaryColor = [99, 102, 241]; // #6366f1
      const secondaryColor = [15, 23, 42]; // #0f172a
      const textColor = [71, 85, 105];
      const lightBg = [248, 250, 252];

      // Deep header banner
      doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.rect(0, 0, 210, 48, 'F');

      // Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('ASCEND STUDY', 15, 18);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(199, 210, 254);
      doc.text(
        appLanguage === 'Hindi'
          ? `शैक्षणिक प्रगति फ़ाइल रिपोर्ट - ${
              activePeriod === 'Weekly' ? 'साप्ताहिक' : activePeriod === 'Monthly' ? 'मासिक' : 'वार्षिक'
            }`
          : `Academic Progress File Report - ${activePeriod} Report`,
        15, 26
      );

      // Metadata
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated Date: ${new Date().toLocaleDateString()}`, 15, 38);
      doc.text(`Location: Kehar Dabla`, 150, 38);

      // Student ID Section
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.rect(15, 55, 180, 28, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, 55, 180, 28);

      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('STUDENT INFORMATION', 20, 62);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(`Student Name: ${studentName}`, 20, 69);
      doc.text(`School/Institute: ${school}`, 20, 76);
      doc.text(`Grade/Class: Class ${className}`, 120, 69);
      doc.text(`Study Location: ${location}`, 120, 76);

      // Performance Summary Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(
        appLanguage === 'Hindi' ? 'प्रगति एवं प्रदर्शन मैट्रिक्स' : 'ACADEMIC PERFORMANCE METRICS',
        15, 96
      );

      // Box 1: Quizzes
      doc.setFillColor(244, 245, 255);
      doc.rect(15, 102, 85, 26, 'F');
      doc.setDrawColor(224, 231, 255);
      doc.rect(15, 102, 85, 26);

      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Quizzes Target', 20, 108);
      doc.setFontSize(13);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`${stats.quizzesTaken} / ${stats.quizzesGoal} Quizzes Completed`, 20, 119);

      // Box 2: Average Quiz Score
      doc.setFillColor(240, 253, 244);
      doc.rect(110, 102, 85, 26, 'F');
      doc.setDrawColor(220, 252, 231);
      doc.rect(110, 102, 85, 26);

      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Average Score & Ratio', 115, 108);
      doc.setFontSize(13);
      doc.setTextColor(22, 163, 74);
      doc.text(`${stats.averageScore.toFixed(1)} / 5.0 (${stats.averagePct}%)`, 115, 119);

      // Box 3: Notes written
      doc.setFillColor(255, 251, 235);
      doc.rect(15, 136, 85, 26, 'F');
      doc.setDrawColor(254, 243, 199);
      doc.rect(15, 136, 85, 26);

      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Academic Notes Created', 20, 142);
      doc.setFontSize(13);
      doc.setTextColor(217, 119, 6);
      doc.text(`${stats.notesCreated} Study Notes`, 20, 153);

      // Box 4: Tasks completed
      doc.setFillColor(240, 253, 250);
      doc.rect(110, 136, 85, 26, 'F');
      doc.setDrawColor(204, 251, 241);
      doc.rect(110, 136, 85, 26);

      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Study Tasks Completed', 115, 142);
      doc.setFontSize(13);
      doc.setTextColor(13, 148, 136);
      doc.text(`${stats.tasksCompleted} Planner Tasks`, 115, 153);

      // Log Section Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(
        appLanguage === 'Hindi' ? 'सक्रिय शैक्षणिक गतिविधियों की सूची' : 'REAL-TIME ACTIVITIES LOGGED',
        15, 178
      );

      doc.setDrawColor(226, 232, 240);
      doc.line(15, 182, 195, 182);

      let yOffset = 189;
      doc.setFontSize(9);

      if (stats.activitiesList.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(148, 163, 184);
        doc.text(
          appLanguage === 'Hindi'
            ? 'कोई शैक्षणिक गतिविधि दर्ज नहीं हुई है।'
            : 'No real-time educational activity recorded for this period yet.',
          20,
          yOffset
        );
      } else {
        // Render top 10 activities to ensure it fits nicely
        const visibleActivities = stats.activitiesList.slice(0, 10);
        visibleActivities.forEach((act) => {
          if (yOffset > 270) return;

          // Bullet point
          doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.circle(20, yOffset - 1, 1.2, 'F');

          // Title/Type
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
          doc.text(act.type, 25, yOffset);

          // Description
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          doc.text(`: ${act.desc}`, 60, yOffset);

          // Date tag
          doc.setTextColor(148, 163, 184);
          doc.text(act.date, 165, yOffset);

          yOffset += 8;
        });

        if (stats.activitiesList.length > 10) {
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(148, 163, 184);
          doc.text(
            appLanguage === 'Hindi'
              ? `... और ${stats.activitiesList.length - 10} गतिविधियाँ फ़ाइल में सुरक्षित हैं।`
              : `... and ${stats.activitiesList.length - 10} more activities logged in file.`,
            25,
            yOffset
          );
        }
      }

      // Footer
      doc.setDrawColor(226, 232, 240);
      doc.line(15, 278, 195, 278);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(148, 163, 184);
      doc.text('ASCEND STUDY - ACADEMIC COMPANION PLATFORM', 15, 285);
      doc.text('PAGE 1 OF 1', 180, 285);

      doc.save(`Ascend_Study_Progress_${activePeriod}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error('Error generating PDF:', e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4" id="progress_modal_container">
      {/* Tab bar header */}
      <div className="flex bg-slate-800/80 p-1 rounded-xl gap-1 border border-slate-700/60 shadow-inner">
        {(['Weekly', 'Monthly', 'Yearly'] as const).map((period) => (
          <button
            key={period}
            onClick={() => setActivePeriod(period)}
            className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
              activePeriod === period
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/40'
            }`}
          >
            {period === 'Weekly'
              ? appLanguage === 'Hindi'
                ? 'साप्ताहिक (Weekly)'
                : 'Weekly'
              : period === 'Monthly'
              ? appLanguage === 'Hindi'
                ? 'मासिक (Monthly)'
                : 'Monthly'
              : appLanguage === 'Hindi'
              ? 'वार्षिक (Yearly)'
              : 'Yearly'}
          </button>
        ))}
      </div>

      {/* Grid of 4 Core Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {/* Metric 1: Quizzes Target */}
        <div className="bg-slate-850 border border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
              {appLanguage === 'Hindi' ? 'पूर्ण प्रश्नोत्तरियाँ' : 'Quizzes Taken'}
            </span>
            <span className="text-sm">📝</span>
          </div>
          <div className="mt-3">
            <h4 className="text-lg font-black text-white leading-none">
              {stats.quizzesTaken} / {stats.quizzesGoal}
            </h4>
            <p className="text-[9px] text-slate-400 font-bold mt-1">
              {appLanguage === 'Hindi' ? 'लक्ष्य पूरा होने का दर' : 'Target completion rate'}
            </p>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3.5">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min((stats.quizzesTaken / stats.quizzesGoal) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Average Score */}
        <div className="bg-slate-850 border border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
              {appLanguage === 'Hindi' ? 'औसत स्कोर' : 'Average Score'}
            </span>
            <span className="text-sm">🎯</span>
          </div>
          <div className="mt-3">
            <h4 className="text-lg font-black text-emerald-400 leading-none">
              {stats.averageScore.toFixed(1)} / 5.0
            </h4>
            <p className="text-[9px] text-slate-400 font-bold mt-1">
              {stats.averagePct}% {appLanguage === 'Hindi' ? 'सफलता दर' : 'average success rate'}
            </p>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3.5">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${stats.averagePct}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Notes written */}
        <div className="bg-slate-850 border border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
              {appLanguage === 'Hindi' ? 'लिखित नोट्स' : 'Notes Created'}
            </span>
            <span className="text-sm">📖</span>
          </div>
          <div className="mt-3">
            <h4 className="text-lg font-black text-amber-400 leading-none">
              {stats.notesCreated} {appLanguage === 'Hindi' ? 'नोट्स' : 'Notes'}
            </h4>
            <p className="text-[9px] text-slate-400 font-bold mt-1">
              {appLanguage === 'Hindi' ? 'अध्ययन सामग्री' : 'Academic study notes'}
            </p>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3.5">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(stats.notesCreated * 15, 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 4: Tasks Done */}
        <div className="bg-slate-850 border border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
              {appLanguage === 'Hindi' ? 'पूर्ण योजना कार्य' : 'Tasks Completed'}
            </span>
            <span className="text-sm">✔️</span>
          </div>
          <div className="mt-3">
            <h4 className="text-lg font-black text-teal-400 leading-none">
              {stats.tasksCompleted} {appLanguage === 'Hindi' ? 'कार्य' : 'Tasks'}
            </h4>
            <p className="text-[9px] text-slate-400 font-bold mt-1">
              {appLanguage === 'Hindi' ? 'प्लानर कार्य' : 'Completed from scheduler'}
            </p>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3.5">
            <div
              className="bg-teal-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(stats.tasksCompleted * 10, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Activities Timeline list */}
      <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 space-y-3.5">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <h4 className="text-[10px] uppercase font-black tracking-wider text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            {appLanguage === 'Hindi' ? 'वास्तविक अध्ययन इतिहास' : 'Real Study Activity Log'}
          </h4>
          <span className="text-[8px] font-mono font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
            {stats.activitiesList.length} {appLanguage === 'Hindi' ? 'गतिविधियाँ' : 'Actions'}
          </span>
        </div>

        <div className="space-y-2.5 max-h-[160px] overflow-y-auto scrollbar-hide pr-1">
          {stats.activitiesList.length === 0 ? (
            <div className="text-center py-6 space-y-2.5">
              <span className="text-2xl block">📁</span>
              <p className="text-[10px] text-slate-500 font-bold">
                {appLanguage === 'Hindi'
                  ? 'कोई वास्तविक समय गतिविधि नहीं मिली।'
                  : 'No real-time academic activities registered in this range.'}
              </p>
              <p className="text-[9px] text-slate-600 font-medium">
                {appLanguage === 'Hindi'
                  ? 'अध्ययन इतिहास बनाने के लिए क्विज़ लें या नोट्स जोड़ें।'
                  : 'Start a practice quiz or write study notes to populate your progress file!'}
              </p>
            </div>
          ) : (
            stats.activitiesList.map((act, index) => (
              <div
                key={index}
                className="flex items-start space-x-2.5 p-2 bg-slate-900/40 border border-slate-800/40 rounded-xl"
              >
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-extrabold text-white">{act.type}</span>
                  <p className="text-[9px] text-slate-400 font-bold truncate mt-0.5">{act.desc}</p>
                </div>
                <span className="text-[8px] text-slate-500 font-mono mt-0.5 shrink-0 font-bold">
                  {act.date}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* PDF Download Button */}
      <button
        onClick={handleDownloadPDF}
        disabled={downloading}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white text-xs font-black rounded-xl transition shadow-md active:scale-95 duration-100 flex items-center justify-center space-x-2 border border-emerald-500/30 cursor-pointer"
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>
          {downloading
            ? appLanguage === 'Hindi'
              ? 'पीडीएफ तैयार हो रहा है...'
              : 'Generating PDF...'
            : appLanguage === 'Hindi'
            ? `डाउनलोड करें ${
                activePeriod === 'Weekly' ? 'साप्ताहिक' : activePeriod === 'Monthly' ? 'मासिक' : 'वार्षिक'
              } प्रगति पीडीएफ`
            : `Download ${activePeriod} Progress PDF`}
        </span>
      </button>
    </div>
  );
}
