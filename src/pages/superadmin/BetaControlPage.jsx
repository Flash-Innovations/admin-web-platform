import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Zap,
  Users,
  Calendar,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Clock,
  Sparkles,
  Ticket,
  SlidersHorizontal,
  MessageSquare,
  Star,
  Check
} from "lucide-react";
import { adminService } from "../../services/adminService";
import { useNotifications } from "../../context/NotificationContext";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { cn } from "../../utils/cn";

const PHASES = [
  {
    phase: 1,
    title: "Phase 1: Closed Alpha Core",
    dates: "Nov 15 – Nov 30, 2026",
    code: "FLASH100",
    audience: "100 Exclusive Testers",
    tagline: "250 MCQs Cap • Unlimited Free Coding • Free Contests",
    unlocked: ["Coding Arena (Judge0)", "Practice MCQs (250 cap)", "Free Contests Access"],
    locked: ["AI Roadmap (Dec 1)", "Gemini Live Mocks (Dec 16)", "Peer GD Arena (Dec 16)", "Store Subscriptions (Jan 1)"]
  },
  {
    phase: 2,
    title: "Phase 2: AI Roadmap & Diagnostics",
    dates: "Dec 1 – Dec 15, 2026",
    code: "FLASH500",
    audience: "500 Total Testers",
    tagline: "Adaptive Skill Graph • Bayesian Knowledge Tracing",
    unlocked: ["Phase 1 Suite", "AI Personalized Roadmap", "15-Min Diagnostic Assessment"],
    locked: ["Gemini Live Mocks (Dec 16)", "Peer GD Arena (Dec 16)", "Store Subscriptions (Jan 1)"]
  },
  {
    phase: 3,
    title: "Phase 3: Placement Arena Suite",
    dates: "Dec 16 – Dec 26, 2026",
    code: "FLASH1000",
    audience: "1,000 Total Testers",
    tagline: "Multimodal Voice Mocks • WebRTC Peer GD • Resume ATS",
    unlocked: ["Phase 1 & 2 Suite", "Gemini Live AI Mock Interviews", "Peer GD Arena (WebRTC)", "ATS Resume Optimizer"],
    locked: ["Store Subscriptions (Jan 1)"]
  },
  {
    phase: 4,
    title: "Phase 4: Store & Gateway Rehearsal",
    dates: "Dec 27 – Dec 31, 2026",
    code: "FLASH1000",
    audience: "1,000 Total Testers",
    tagline: "Store Preview • 1 Rupee Live Mandate • Founding Badges",
    unlocked: ["All Beta Features", "Flash Store Preview", "Founding Member Vouchers"],
    locked: ["Full Commercial Billing (Jan 1)"]
  },
  {
    phase: 0,
    title: "Grand Public Launch",
    dates: "Jan 1, 2027 Onwards",
    code: "PUBLIC (No code needed)",
    audience: "Unrestricted Public Access",
    tagline: "Standard ₹99/mo • Premium ₹299/mo • Modular Passes ₹29",
    unlocked: ["All Modules Active", "Commercial Subscriptions Live", "Full Payment Gateway Active"],
    locked: []
  }
];

export function BetaControlPage() {
  const { showSuccess, showError } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [updatingPhase, setUpdatingPhase] = useState(false);
  const [overview, setOverview] = useState({
    currentPhase: 1,
    featureFlags: {},
    cohorts: [],
    totalFeedbackCount: 0,
    feedbackList: []
  });

  // Modal State
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [codeForm, setCodeForm] = useState({
    code: "",
    targetPhase: 1,
    maxUsesTotal: 100,
    mcqQuotaGranted: 250,
    description: ""
  });
  const [creatingCode, setCreatingCode] = useState(false);

  const loadBetaData = async () => {
    try {
      setLoading(true);
      const res = await adminService.getBetaOverview();
      if (res.success && res.overview) {
        setOverview(res.overview);
      }
    } catch (err) {
      console.error("Failed to load beta overview:", err);
      showError("Could not retrieve beta launch governance status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBetaData();
  }, []);

  const handlePhaseChange = async (targetPhase) => {
    try {
      setUpdatingPhase(true);
      const res = await adminService.setBetaPhase(targetPhase);
      if (res.success) {
        showSuccess(
          `Platform active phase switched to ${
            targetPhase === 0 ? "Grand Public Launch" : `Phase ${targetPhase}`
          }. Feature flags auto-recalculated!`
        );
        loadBetaData();
      }
    } catch (err) {
      showError(err.message || "Failed to switch phase.");
    } finally {
      setUpdatingPhase(false);
    }
  };

  const handleToggleFlag = async (flagKey, currentValue) => {
    try {
      const res = await adminService.updateBetaFeatureFlags({
        [flagKey]: !currentValue
      });
      if (res.success) {
        showSuccess(`Updated flag "${flagKey}" to ${!currentValue ? "ENABLED" : "LOCKED"}`);
        setOverview((prev) => ({
          ...prev,
          featureFlags: { ...prev.featureFlags, [flagKey]: !currentValue }
        }));
      }
    } catch (err) {
      showError(err.message || "Failed to update feature flag.");
    }
  };

  const handleCreateInviteCode = async (e) => {
    e.preventDefault();
    if (!codeForm.code.trim()) {
      showError("Invite code string is required.");
      return;
    }

    try {
      setCreatingCode(true);
      const res = await adminService.createBetaInviteCode(codeForm);
      if (res.success) {
        showSuccess(`Invite code "${codeForm.code.toUpperCase()}" generated successfully!`);
        setIsCodeModalOpen(false);
        setCodeForm({
          code: "",
          targetPhase: 1,
          maxUsesTotal: 100,
          mcqQuotaGranted: 250,
          description: ""
        });
        loadBetaData();
      }
    } catch (err) {
      showError(err.message || "Failed to create beta invite code.");
    } finally {
      setCreatingCode(false);
    }
  };

  const currentPhaseObj = PHASES.find((p) => p.phase === overview.currentPhase) || PHASES[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-2xl border border-indigo-900/40">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Closed Beta Governance & Option B Hype Locks
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Beta Launch Command Center
            </h1>
            <p className="text-sm text-slate-300">
              Control the staged rollout from Phase 1 (100 users, 250 MCQs, Free Contests) through Grand Public Launch on January 1, 2027.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={loadBetaData}
              variant="outline"
              size="sm"
              loading={loading}
              className="border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh Telemetry
            </Button>
            <Button
              onClick={() => setIsCodeModalOpen(true)}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs shadow-md shadow-indigo-600/30"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Generate Invite Code
            </Button>
          </div>
        </div>
      </div>

      {/* Active Phase Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-900 border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Platform Phase</div>
          <div className="text-lg font-bold text-white mt-1 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            {overview.currentPhase === 0 ? "Grand Public Launch" : `Phase ${overview.currentPhase}`}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">{currentPhaseObj.dates}</div>
        </Card>

        <Card className="p-4 bg-slate-900 border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Target Audience</div>
          <div className="text-lg font-bold text-white mt-1 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-400" />
            {currentPhaseObj.audience}
          </div>
          <div className="text-xs text-indigo-400 mt-0.5">Code: {currentPhaseObj.code}</div>
        </Card>

        <Card className="p-4 bg-slate-900 border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Registration Access</div>
          <div className="text-lg font-bold text-white mt-1">
            {overview.inviteCodeRequired ? "Invite Code Required" : "Open Public Access"}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {overview.inviteCodeRequired ? "Private Cohort Gate" : "Self-Serve Open Registration"}
          </div>
        </Card>

        <Card className="p-4 bg-slate-900 border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Student Feedback</div>
          <div className="text-lg font-bold text-white mt-1 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            {overview.totalFeedbackCount} Submissions
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Direct bug & UX reports</div>
        </Card>
      </div>

      {/* 5-Phase Switcher Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100">Rollout Phase Roadmap</h2>
            <p className="text-xs text-slate-400">Click any card to immediately switch active platform phase</p>
          </div>
          {updatingPhase && (
            <span className="text-xs text-indigo-400 flex items-center gap-1.5 font-medium animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Switching phase...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3.5">
          {PHASES.map((p) => {
            const isActive = overview.currentPhase === p.phase;
            return (
              <div
                key={p.phase}
                onClick={() => handlePhaseChange(p.phase)}
                className={cn(
                  "relative rounded-2xl p-4 border transition-all cursor-pointer flex flex-col justify-between select-none",
                  isActive
                    ? "bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/30"
                    : "bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-400"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono",
                        isActive
                          ? "bg-indigo-500 text-white"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      )}
                    >
                      {p.phase === 0 ? "Grand Launch" : `Phase ${p.phase}`}
                    </span>
                    {isActive && (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <h3 className={cn("text-xs font-bold mb-1", isActive ? "text-white" : "text-slate-200")}>
                    {p.title}
                  </h3>
                  <div className="text-[11px] text-slate-400 mb-2">{p.dates}</div>

                  <div className="text-[11px] font-mono p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-indigo-300 mb-3 truncate">
                    {p.code}
                  </div>

                  <div className="space-y-1 text-[11px]">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Unlocked:
                    </div>
                    {p.unlocked.map((u, i) => (
                      <div key={i} className="text-slate-300 flex items-start gap-1 leading-tight">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{u}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="text-[10px] text-slate-400 leading-tight">
                    {p.tagline}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cohort Spots Claim Tracker */}
      <Card className="p-5 bg-slate-900 border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Ticket className="w-4 h-4 text-indigo-400" />
              Cohort Invite Codes & Claim Tracker
            </h2>
            <p className="text-xs text-slate-400">
              Live consumption of invite spots across closed cohorts
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {overview.cohorts?.length || 0} active codes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(overview.cohorts || []).map((cohort) => (
            <div
              key={cohort.code}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                  {cohort.code}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  Phase {cohort.phase}
                </span>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <div className="text-lg font-bold text-white">
                    {cohort.claimed}{" "}
                    <span className="text-xs font-normal text-slate-400">/ {cohort.max} claimed</span>
                  </div>
                </div>
                <div className="text-xs font-bold text-indigo-400 font-mono">
                  {cohort.percent}%
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, cohort.percent)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                <span>{cohort.max - cohort.claimed} spots remaining</span>
                <span className="text-emerald-400 font-medium">
                  {cohort.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Feature Matrix Master Toggles */}
      <Card className="p-5 bg-slate-900 border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
              Granular Feature Matrix Master Toggles
            </h2>
            <p className="text-xs text-slate-400">
              Override individual feature locks without changing the global phase
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { key: "codingHub", label: "Coding Arena (Judge0)", desc: "100% Free & Unlimited" },
            { key: "practiceMcq", label: "Practice MCQs", desc: "250 MCQs Quota in Phase 1" },
            { key: "contestsFree", label: "Assessments / Contests", desc: "Zero entry fee for beta testers" },
            { key: "roadmap", label: "AI Career Roadmap", desc: "Unlocks Phase 2 (Dec 1)" },
            { key: "mockInterviews", label: "Gemini Live AI Mock", desc: "Unlocks Phase 3 (Dec 16)" },
            { key: "groupDiscussion", label: "Peer GD Arena (WebRTC)", desc: "Unlocks Phase 3 (Dec 16)" },
            { key: "resumeAts", label: "ATS Resume Optimizer", desc: "Unlocks Phase 3 (Dec 16)" },
            { key: "storeCheckout", label: "Flash Store & Subscriptions", desc: "Unlocks Grand Launch (Jan 1)" }
          ].map((item) => {
            const isEnabled = Boolean(overview.featureFlags?.[item.key]);
            return (
              <div
                key={item.key}
                className={cn(
                  "p-3.5 rounded-xl border flex items-center justify-between transition-colors",
                  isEnabled
                    ? "bg-slate-950 border-emerald-500/40"
                    : "bg-slate-950/60 border-slate-800 text-slate-400"
                )}
              >
                <div>
                  <div className="text-xs font-bold text-slate-200">{item.label}</div>
                  <div className="text-[10px] text-slate-400">{item.desc}</div>
                </div>

                <button
                  onClick={() => handleToggleFlag(item.key, isEnabled)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer",
                    isEnabled
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                      : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750"
                  )}
                >
                  {isEnabled ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  {isEnabled ? "ACTIVE" : "LOCKED"}
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Beta Feedback Table */}
      <Card className="p-5 bg-slate-900 border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              Live Beta Student Feedback Stream
            </h2>
            <p className="text-xs text-slate-400">
              Submitted bug reports, UX suggestions, and feature requests
            </p>
          </div>
          <Badge variant="neutral" className="text-xs font-mono">
            {overview.feedbackList?.length || 0} entries
          </Badge>
        </div>

        {(!overview.feedbackList || overview.feedbackList.length === 0) ? (
          <div className="py-8 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800/60">
            No student feedback submitted yet. Incoming reports will appear here in real time.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Rating</th>
                  <th className="py-2.5 px-3">Feedback / Comment</th>
                  <th className="py-2.5 px-3">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {overview.feedbackList.map((fb, idx) => (
                  <tr key={idx} className="hover:bg-slate-850/50">
                    <td className="py-2.5 px-3 font-medium text-white">{fb.studentName}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {fb.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-amber-400 font-bold flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {fb.rating}/5
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-200 max-w-md">{fb.comment}</td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {new Date(fb.submittedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal: Generate Custom Invite Code */}
      <Modal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        title="Generate Closed Beta Invite Code"
        subtitle="Create an exclusive cohort access code with custom claim caps and quotas"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateInviteCode} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Code String *</label>
            <input
              type="text"
              required
              value={codeForm.code}
              onChange={(e) => setCodeForm({ ...codeForm, code: e.target.value.toUpperCase() })}
              placeholder="e.g. FLASH200 or NITK_VIP"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold uppercase tracking-wider focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Target Phase</label>
              <select
                value={codeForm.targetPhase}
                onChange={(e) => setCodeForm({ ...codeForm, targetPhase: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value={1}>Phase 1 (Core)</option>
                <option value={2}>Phase 2 (Roadmap)</option>
                <option value={3}>Phase 3 (Placement)</option>
                <option value={4}>Phase 4 (Store)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Max Spots (Uses)</label>
              <input
                type="number"
                min={1}
                max={5000}
                required
                value={codeForm.maxUsesTotal}
                onChange={(e) => setCodeForm({ ...codeForm, maxUsesTotal: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Practice MCQ Quota</label>
            <input
              type="number"
              min={50}
              max={2500}
              required
              value={codeForm.mcqQuotaGranted}
              onChange={(e) => setCodeForm({ ...codeForm, mcqQuotaGranted: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">Default Phase 1 quota is 250 MCQs</p>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Description / Internal Tag</label>
            <input
              type="text"
              value={codeForm.description}
              onChange={(e) => setCodeForm({ ...codeForm, description: e.target.value })}
              placeholder="e.g. VIP Campus Ambassadors cohort"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCodeModalOpen(false)}
              className="text-xs border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={creatingCode}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs shadow-md shadow-indigo-600/30"
            >
              Generate Code
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default BetaControlPage;

