import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Trophy,
  Plus,
  Search,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Trash2,
  Play,
  Pause,
  AlertCircle,
  FileCode,
  Tag,
  Sparkles,
  Layers
} from "lucide-react";
import { adminService } from "../../services/adminService";
import { useNotifications } from "../../context/NotificationContext";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { TableSkeleton } from "../../components/common/LoadingSkeleton";

export function ContestsAdminPage() {
  const { showSuccess, showError } = useNotifications();
  const [searchParams] = useSearchParams();
  const shouldOpenNew = searchParams.get("action") === "new";

  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [search, setSearch] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(shouldOpenNew);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSyllabus, setFormSyllabus] = useState("Aptitude, Data Structures, Algorithms & Core CS");
  const [formStartAt, setFormStartAt] = useState("");
  const [formEndAt, setFormEndAt] = useState("");
  const [formDuration, setFormDuration] = useState(90);
  const [formTierRequired, setFormTierRequired] = useState("FREE");
  const [formEntryFee, setFormEntryFee] = useState(0);

  const loadContests = async () => {
    try {
      setLoading(true);
      const res = await adminService.listContests();
      if (res.success && res.contests) {
        setContests(res.contests);
      }
    } catch (err) {
      console.error("Failed to load contests:", err);
      showError("Failed to fetch contests list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContests();
  }, []);

  const handleCreateContest = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showError("Please enter a contest title");
      return;
    }
    if (!formStartAt || !formEndAt) {
      showError("Please specify both start and end times");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        syllabus: formSyllabus.trim(),
        startAt: new Date(formStartAt).toISOString(),
        endAt: new Date(formEndAt).toISOString(),
        durationMinutes: parseInt(formDuration) || 90,
        tierRequired: formTierRequired,
        entryFee: parseInt(formEntryFee) || 0,
        sections: [
          { name: "Quantitative & Logical Aptitude", type: "MCQ", questionCount: 10, totalMarks: 20 },
          { name: "Core Coding Challenge (DSA)", type: "CODING", questionCount: 2, totalMarks: 50 }
        ]
      };

      const res = await adminService.createContest(payload);
      if (res.success) {
        showSuccess("Contest scheduled and broadcasted to all students!");
        setIsModalOpen(false);
        // Reset form
        setFormTitle("");
        setFormDescription("");
        setFormStartAt("");
        setFormEndAt("");
        setFormDuration(90);
        setFormEntryFee(0);
        loadContests();
      }
    } catch (err) {
      console.error("Contest creation error:", err);
      showError(err.message || "Failed to create contest");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (contest, newStatus) => {
    try {
      const res = await adminService.updateContest(contest._id || contest.id, { status: newStatus });
      if (res.success) {
        showSuccess(`Contest status updated to ${newStatus}`);
        loadContests();
      }
    } catch (err) {
      showError("Failed to update contest status");
    }
  };

  const handleDeleteContest = async (id) => {
    if (!window.confirm("Are you sure you want to cancel and remove this contest?")) return;
    try {
      const res = await adminService.deleteContest(id);
      if (res.success) {
        showSuccess("Contest cancelled successfully");
        loadContests();
      }
    } catch (err) {
      showError("Failed to delete contest");
    }
  };

  const filteredContests = contests.filter((c) => {
    if (filterStatus !== "ALL" && c.status !== filterStatus) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Trophy className="w-7 h-7 text-amber-500" />
            Global Contests & Assessments
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Universal competitive rounds, hackathons, and placement assessments shown to all students.
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
        >
          Launch Global Contest
        </Button>
      </div>

      {/* Control Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search contests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "LIVE", "UPCOMING", "COMPLETED", "DRAFT"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterStatus === st
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Contests Grid */}
      {loading ? (
        <TableSkeleton rows={4} columns={4} />
      ) : filteredContests.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-slate-200">
          <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Contests Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || filterStatus !== "ALL"
              ? "No contests match your current search criteria."
              : "No global contests have been created yet. Launch your first competitive contest to engage students!"}
          </p>
          <Button
            size="sm"
            icon={Plus}
            onClick={() => setIsModalOpen(true)}
            className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            Create New Contest
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredContests.map((c) => {
            const isLive = c.status === "LIVE";
            const isUpcoming = c.status === "UPCOMING";
            return (
              <Card
                key={c._id || c.id}
                className="p-5 flex flex-col justify-between border-slate-200 shadow-xs hover:shadow-md transition-all relative overflow-hidden"
              >
                {isLive && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black px-3 py-0.5 rounded-bl-lg tracking-wider animate-pulse">
                    LIVE NOW
                  </div>
                )}

                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge
                      variant={isLive ? "emerald" : isUpcoming ? "indigo" : "slate"}
                      size="sm"
                    >
                      {c.status}
                    </Badge>
                    <span className="text-xs font-bold text-slate-500">
                      {c.entryFee > 0 ? `₹${c.entryFee} Entry` : "FREE Access"}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                    {c.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {c.description || c.syllabus}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{c.durationMinutes || 90} Minutes Duration</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {new Date(c.startAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Min Tier: {c.tierRequired || "FREE"}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {c.status !== "LIVE" && (
                      <button
                        onClick={() => handleToggleStatus(c, "LIVE")}
                        className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                        title="Start Contest Now"
                      >
                        Set Live
                      </button>
                    )}
                    {c.status === "LIVE" && (
                      <button
                        onClick={() => handleToggleStatus(c, "COMPLETED")}
                        className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        title="Conclude Contest"
                      >
                        Conclude
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteContest(c._id || c.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Contest"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Contest Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Launch Universal Contest"
        subtitle="Broadcast a new competitive assessment to all students across India"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateContest} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Contest Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., All-India Batch of 2028 Placement Grand Prix #1"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Syllabus & Core Topics
            </label>
            <input
              type="text"
              value={formSyllabus}
              onChange={(e) => setFormSyllabus(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Contest Description & Rules
            </label>
            <textarea
              rows={3}
              placeholder="Guidelines for students, code environment details, negative marking..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formStartAt}
                onChange={(e) => setFormStartAt(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                End Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formEndAt}
                onChange={(e) => setFormEndAt(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Duration (Mins)
              </label>
              <input
                type="number"
                min="15"
                max="360"
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Minimum Plan Tier
              </label>
              <select
                value={formTierRequired}
                onChange={(e) => setFormTierRequired(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="FREE">FREE (All Students)</option>
                <option value="BASIC">BASIC (₹99+ Tier)</option>
                <option value="PREMIUM">PREMIUM Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Entry Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                value={formEntryFee}
                onChange={(e) => setFormEntryFee(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Publish & Schedule Contest
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
