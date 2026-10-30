import React, { useState, useEffect, useMemo } from "react";
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
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckSquare,
  Square,
  HelpCircle,
  Code2,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Filter,
  Check,
  X,
  Award,
  BarChart2,
  Hash,
  ListOrdered,
  ListChecks,
  SlidersHorizontal,
  ExternalLink
} from "lucide-react";
import { adminService } from "../../services/adminService";
import { superAdminService } from "../../services/superAdminService";
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

  // Create Contest Modal State
  const [isModalOpen, setIsModalOpen] = useState(shouldOpenNew);
  const [submitting, setSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(1); // 1: Setup, 2: Questions, 3: Review

  // Contest Form Setup State
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSyllabus, setFormSyllabus] = useState("Aptitude, Data Structures, Algorithms & Core CS");
  const [formStartAt, setFormStartAt] = useState("");
  const [formEndAt, setFormEndAt] = useState("");
  const [formDuration, setFormDuration] = useState(90);
  const [formTierRequired, setFormTierRequired] = useState("FREE");
  const [formEntryFee, setFormEntryFee] = useState(0);
  const [formTargetDomain, setFormTargetDomain] = useState("ALL");

  // PostgreSQL Question Bank Selector State
  const [bankQuestions, setBankQuestions] = useState([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankTopics, setBankTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);

  // Selector Filter State
  const [qSearch, setQSearch] = useState("");
  const [qTopic, setQTopic] = useState("ALL");
  const [qType, setQType] = useState("ALL");
  const [qDifficulty, setQDifficulty] = useState("ALL");
  const [qPage, setQPage] = useState(1);
  const [qLimit] = useState(10);
  const [qPagination, setQPagination] = useState({ total: 0, totalPages: 1 });

  // Persistent Selected Questions State: { [questionId]: QuestionData }
  const [selectedQuestions, setSelectedQuestions] = useState({});

  // Question Preview Modal State
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // View Created Contest Questions Modal State
  const [viewContestModalOpen, setViewContestModalOpen] = useState(false);
  const [viewContestData, setViewContestData] = useState(null);
  const [viewContestLoading, setViewContestLoading] = useState(false);

  // Initial Data Fetching
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

  const loadTopics = async () => {
    try {
      setTopicsLoading(true);
      const res = await superAdminService.getTopics();
      if (res.success && Array.isArray(res.data)) {
        setBankTopics(res.data);
      }
    } catch (err) {
      console.error("Failed to load topics:", err);
    } finally {
      setTopicsLoading(false);
    }
  };

  useEffect(() => {
    loadContests();
    loadTopics();
  }, []);

  // Fetch Questions from PostgreSQL whenever selector filters or page change
  const loadBankQuestions = async () => {
    try {
      setBankLoading(true);
      const filters = {
        page: qPage,
        limit: qLimit,
        status: "ACTIVE",
        search: qSearch.trim(),
        topic: qTopic !== "ALL" ? qTopic : undefined,
        type: qType !== "ALL" ? qType : undefined,
        difficulty: qDifficulty !== "ALL" ? qDifficulty : undefined
      };

      const res = await superAdminService.getGlobalQuestions(filters);
      if (res.success && Array.isArray(res.data)) {
        setBankQuestions(res.data);
        if (res.pagination) {
          setQPagination({
            total: res.pagination.total || 0,
            totalPages: res.pagination.totalPages || 1
          });
        }
      }
    } catch (err) {
      console.error("Failed to load question bank:", err);
      showError("Failed to query questions from PostgreSQL");
    } finally {
      setBankLoading(false);
    }
  };

  useEffect(() => {
    if (isModalOpen && activeStep === 2) {
      loadBankQuestions();
    }
  }, [isModalOpen, activeStep, qPage, qTopic, qType, qDifficulty]);

  // Debounced search trigger
  useEffect(() => {
    if (!isModalOpen || activeStep !== 2) return;
    const timer = setTimeout(() => {
      setQPage(1);
      loadBankQuestions();
    }, 350);
    return () => clearTimeout(timer);
  }, [qSearch]);

  // Selection Management
  const selectedCount = useMemo(() => Object.keys(selectedQuestions).length, [selectedQuestions]);

  const selectedList = useMemo(() => Object.values(selectedQuestions), [selectedQuestions]);

  const selectedMetrics = useMemo(() => {
    let totalMarks = 0;
    let codingCount = 0;
    let mcqCount = 0;
    selectedList.forEach((q) => {
      totalMarks += Number(q.marks) || 0;
      if (q.type === "CODING") codingCount++;
      else mcqCount++;
    });
    return { totalMarks, codingCount, mcqCount };
  }, [selectedList]);

  const toggleQuestionSelection = (q) => {
    setSelectedQuestions((prev) => {
      const next = { ...prev };
      const qId = q.id;
      if (next[qId]) {
        delete next[qId];
      } else {
        const isCoding = q.type === "CODING";
        const cat = (q.category || "").toUpperCase();
        let defaultSection = "APTITUDE";
        if (isCoding) defaultSection = "CODING";
        else if (cat.includes("DBMS") || cat.includes("OS") || cat.includes("NETWORK") || cat.includes("TECH")) {
          defaultSection = "TECHNICAL";
        }

        next[qId] = {
          id: qId,
          questionId: qId,
          title: q.title || q.latestTitle || "Untitled Question",
          type: q.type,
          category: q.category || "General",
          difficulty: q.difficulty || "MEDIUM",
          marks: isCoding ? (q.maxMarks || 10) : 2,
          negativeMarks: 0,
          section: defaultSection,
          statement: q.statement || "",
          options: q.options || [],
          constraints: q.constraints || null,
          timeLimitMs: q.timeLimitMs || null
        };
      }
      return next;
    });
  };

  const removeSelectedQuestion = (id) => {
    setSelectedQuestions((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const updateQuestionConfig = (id, field, value) => {
    setSelectedQuestions((prev) => {
      if (!prev[id]) return prev;
      return {
        ...prev,
        [id]: {
          ...prev[id],
          [field]: value
        }
      };
    });
  };

  const toggleSelectAllCurrentPage = () => {
    const allCurrentSelected = bankQuestions.length > 0 && bankQuestions.every((q) => selectedQuestions[q.id]);
    setSelectedQuestions((prev) => {
      const next = { ...prev };
      if (allCurrentSelected) {
        bankQuestions.forEach((q) => delete next[q.id]);
      } else {
        bankQuestions.forEach((q) => {
          if (!next[q.id]) {
            const isCoding = q.type === "CODING";
            const cat = (q.category || "").toUpperCase();
            let defaultSection = "APTITUDE";
            if (isCoding) defaultSection = "CODING";
            else if (cat.includes("DBMS") || cat.includes("OS") || cat.includes("NETWORK") || cat.includes("TECH")) {
              defaultSection = "TECHNICAL";
            }
            next[q.id] = {
              id: q.id,
              questionId: q.id,
              title: q.title || q.latestTitle || "Untitled Question",
              type: q.type,
              category: q.category || "General",
              difficulty: q.difficulty || "MEDIUM",
              marks: isCoding ? (q.maxMarks || 10) : 2,
              negativeMarks: 0,
              section: defaultSection,
              statement: q.statement || "",
              options: q.options || [],
              constraints: q.constraints || null,
              timeLimitMs: q.timeLimitMs || null
            };
          }
        });
      }
      return next;
    });
  };

  // Contest Creation Submission
  const handleCreateContest = async (e, forcedStatus = null) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formTitle.trim()) {
      showError("Please enter a contest title");
      setActiveStep(1);
      return;
    }
    if (!formStartAt || !formEndAt) {
      showError("Please specify both start and end times");
      setActiveStep(1);
      return;
    }
    if (new Date(formEndAt) <= new Date(formStartAt)) {
      showError("Contest end time must be after start time");
      setActiveStep(1);
      return;
    }
    if (selectedCount === 0) {
      showError("Please select at least 1 question from PostgreSQL for this contest");
      setActiveStep(2);
      return;
    }

    try {
      setSubmitting(true);
      const questionPayload = selectedList.map((q) => ({
        id: q.id,
        questionId: q.id,
        marks: Number(q.marks) || (q.type === "CODING" ? 10 : 2),
        negativeMarks: Number(q.negativeMarks) || 0,
        section: q.section || (q.type === "CODING" ? "CODING" : "APTITUDE")
      }));

      const isDraft = forcedStatus === "DRAFT";
      const payload = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        instructions: formDescription.trim() || formSyllabus.trim(),
        syllabus: formSyllabus.trim(),
        startAt: new Date(formStartAt).toISOString(),
        endAt: new Date(formEndAt).toISOString(),
        durationMinutes: parseInt(formDuration, 10) || 90,
        tierRequired: formTierRequired,
        entryFee: parseInt(formEntryFee, 10) || 0,
        targetDomain: formTargetDomain,
        status: isDraft ? "DRAFT" : "PUBLISHED",
        questionIds: Object.keys(selectedQuestions),
        questions: questionPayload
      };

      const res = await adminService.createContest(payload);
      if (res.success) {
        showSuccess(
          isDraft
            ? `Contest "${formTitle}" saved as Draft (hidden from students).`
            : `Contest "${formTitle}" published successfully with ${selectedCount} questions from PostgreSQL!`
        );
        setIsModalOpen(false);
        setActiveStep(1);
        // Reset form
        setFormTitle("");
        setFormDescription("");
        setFormStartAt("");
        setFormEndAt("");
        setFormDuration(90);
        setFormTierRequired("FREE");
        setFormEntryFee(0);
        setFormTargetDomain("ALL");
        setSelectedQuestions({});
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

  const handleOpenContestQuestions = async (contest) => {
    try {
      setViewContestLoading(true);
      setViewContestData({ contest, questions: [] });
      setViewContestModalOpen(true);
      const res = await adminService.getContestQuestions(contest.id || contest._id);
      if (res.success) {
        setViewContestData(res);
      }
    } catch (err) {
      console.error("Failed to load contest questions:", err);
      showError("Could not fetch questions for this contest");
    } finally {
      setViewContestLoading(false);
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
            Universal competitive assessments backed by verified PostgreSQL Question Bank.
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setActiveStep(1);
            setIsModalOpen(true);
          }}
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
              : "No global contests have been created yet. Launch your first competitive contest with PostgreSQL questions!"}
          </p>
          <Button
            size="sm"
            icon={Plus}
            onClick={() => {
              setActiveStep(1);
              setIsModalOpen(true);
            }}
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
            const totalQ = c.totalQuestions || 0;
            const totalM = c.totalMarks || 0;
            const breakdown = c.sectionBreakdown || {};

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
                      variant={isLive ? "emerald" : isUpcoming ? "indigo" : c.status === "DRAFT" ? "amber" : "slate"}
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

                  {/* Question & Mark Summary Pill */}
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                      <ListChecks className="w-3.5 h-3.5" />
                      {totalQ} Questions ({totalM} Marks)
                    </span>
                    {breakdown.coding > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-100">
                        <Code2 className="w-3 h-3" />
                        {breakdown.coding} Coding
                      </span>
                    )}
                    {(breakdown.aptitude > 0 || breakdown.technical > 0) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
                        <BookOpen className="w-3 h-3" />
                        {(breakdown.aptitude || 0) + (breakdown.technical || 0)} MCQ
                      </span>
                    )}
                  </div>

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
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Domain: {c.targetDomain === "TECHNICAL" ? "Technical Domain" : (c.targetDomain === "MANAGEMENT" ? "Management Domain" : "Open to All")}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenContestQuestions(c)}
                      className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      title="Inspect Questions"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Questions
                    </button>

                    {c.status === "DRAFT" && (
                      <button
                        onClick={() => handleToggleStatus(c, "PUBLISHED")}
                        className="px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                        title="Publish Contest to Students"
                      >
                        Publish Now
                      </button>
                    )}
                    {c.status !== "LIVE" && c.status !== "DRAFT" && (
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

      {/* =========================================================================
          Create Contest Modal with 3-Step Wizard
         ========================================================================= */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Launch Universal Contest"
        subtitle="Broadcast a new competitive assessment backed by PostgreSQL Question Bank"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-5">
          {/* Step Indicator Header */}
          <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-3">
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeStep === 1
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
              Contest Setup
            </button>

            <button
              type="button"
              onClick={() => setActiveStep(2)}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeStep === 2
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
              Select Questions ({selectedCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveStep(3)}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeStep === 3
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">3</span>
              Review & Marks ({selectedMetrics.totalMarks} pts)
            </button>
          </div>

          {/* STEP 1: CONTEST SETUP & SCHEDULE */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Contest Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., All-India National Placement Grand Prix #1"
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
                    Target Candidate Domain
                  </label>
                  <select
                    value={formTargetDomain}
                    onChange={(e) => setFormTargetDomain(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  >
                    <option value="ALL">Open to All Candidates (General Aptitude / Mixed)</option>
                    <option value="TECHNICAL">Technical Domain Only (Engineering / SDE / CS)</option>
                    <option value="MANAGEMENT">Management Domain Only (MBA / BBA / Business)</option>
                  </select>
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

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  icon={ArrowRight}
                  onClick={() => {
                    if (!formTitle.trim()) {
                      showError("Please enter a contest title");
                      return;
                    }
                    if (!formStartAt || !formEndAt) {
                      showError("Please specify contest start and end times");
                      return;
                    }
                    setActiveStep(2);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  Next: Select Questions from Bank
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: SELECT QUESTIONS FROM POSTGRESQL QUESTION BANK */}
          {activeStep === 2 && (
            <div className="space-y-4">
              {/* Question Selection Controls */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search questions by title, problem text, tags..."
                      value={qSearch}
                      onChange={(e) => setQSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    {qSearch && (
                      <button
                        onClick={() => setQSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Type Filter */}
                    <select
                      value={qType}
                      onChange={(e) => {
                        setQType(e.target.value);
                        setQPage(1);
                      }}
                      className="px-2.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="ALL">All Types</option>
                      <option value="CODING">Coding Only</option>
                      <option value="MCQ">MCQ / Aptitude</option>
                    </select>

                    {/* Difficulty Filter */}
                    <select
                      value={qDifficulty}
                      onChange={(e) => {
                        setQDifficulty(e.target.value);
                        setQPage(1);
                      }}
                      className="px-2.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="ALL">All Difficulties</option>
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>
                </div>

                {/* Topic / Category Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase shrink-0 mr-1">
                    Topics:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setQTopic("ALL");
                      setQPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                      qTopic === "ALL"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
                    }`}
                  >
                    All Topics
                  </button>
                  {bankTopics.map((top) => (
                    <button
                      key={top.name}
                      type="button"
                      onClick={() => {
                        setQTopic(top.name);
                        setQPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                        qTopic === top.name
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
                      }`}
                    >
                      {top.name} ({top.count || 0})
                    </button>
                  ))}
                </div>
              </div>

              {/* Selection Bar & Select All Action */}
              <div className="flex items-center justify-between text-xs px-1">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleSelectAllCurrentPage}
                    className="flex items-center gap-1.5 font-bold text-slate-700 hover:text-indigo-600 cursor-pointer"
                  >
                    {bankQuestions.length > 0 && bankQuestions.every((q) => selectedQuestions[q.id]) ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span>Select Page ({bankQuestions.length})</span>
                  </button>

                  <span className="text-slate-400">|</span>

                  <span className="font-semibold text-slate-500">
                    Found {qPagination.total} questions in PostgreSQL
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {selectedCount} Selected
                  </span>
                </div>
              </div>

              {/* Question List View */}
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-[380px] overflow-y-auto bg-white">
                {bankLoading ? (
                  <div className="p-8 text-center">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Querying PostgreSQL Question Bank...</p>
                  </div>
                ) : bankQuestions.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold">No questions match your current filters</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Try clearing filters or search term to browse available questions.
                    </p>
                  </div>
                ) : (
                  bankQuestions.map((q) => {
                    const isSelected = !!selectedQuestions[q.id];
                    const isCoding = q.type === "CODING";

                    return (
                      <div
                        key={q.id}
                        className={`p-3.5 flex items-start gap-3 hover:bg-slate-50/80 transition-colors ${
                          isSelected ? "bg-indigo-50/30" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => toggleQuestionSelection(q)}
                          className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-indigo-600" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-400" />
                          )}
                        </button>

                        {/* Question Details */}
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => toggleQuestionSelection(q)}
                        >
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-bold text-slate-900 line-clamp-1">
                              {q.title || q.latestTitle || "Untitled Question"}
                            </span>

                            <Badge
                              variant={isCoding ? "indigo" : "amber"}
                              size="sm"
                              className="text-[10px] uppercase font-bold"
                            >
                              {q.type}
                            </Badge>

                            <Badge
                              variant={
                                q.difficulty === "EASY"
                                  ? "emerald"
                                  : q.difficulty === "HARD"
                                  ? "rose"
                                  : "amber"
                              }
                              size="sm"
                              className="text-[10px] uppercase font-bold"
                            >
                              {q.difficulty}
                            </Badge>

                            {q.category && (
                              <span className="text-[10px] text-slate-500 font-medium px-2 py-0.5 bg-slate-100 rounded">
                                {q.category}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-500 line-clamp-2">
                            {q.statement || "No preview statement available"}
                          </p>

                          {/* Metadata Tags */}
                          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-400">
                            {isCoding ? (
                              <span>
                                Constraints: {q.timeLimitMs || 1000}ms limit • Max Marks: {q.maxMarks || 10}
                              </span>
                            ) : (
                              <span>
                                Options: {Array.isArray(q.options) ? q.options.length : 4} choices
                              </span>
                            )}
                            {q.externalId && <span>ID: {q.externalId}</span>}
                          </div>
                        </div>

                        {/* Action: Preview */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewQuestion(q);
                            setIsPreviewOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors shrink-0 cursor-pointer"
                          title="Preview full problem statement"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Server-Side Pagination Bar */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <span className="text-slate-500 font-medium">
                  Page {qPage} of {Math.max(1, qPagination.totalPages)}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={ChevronLeft}
                    disabled={qPage <= 1 || bankLoading}
                    onClick={() => setQPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={ChevronRight}
                    disabled={qPage >= qPagination.totalPages || bankLoading}
                    onClick={() => setQPage((p) => Math.min(qPagination.totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>

              {/* Navigation Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  icon={ArrowLeft}
                  onClick={() => setActiveStep(1)}
                >
                  Back to Setup
                </Button>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    {selectedCount === 0 ? "No questions chosen" : `${selectedCount} questions ready`}
                  </span>
                  <Button
                    type="button"
                    variant="primary"
                    icon={ArrowRight}
                    disabled={selectedCount === 0}
                    onClick={() => setActiveStep(3)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    Next: Review & Marks Allocation
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & ALLOCATE MARKS */}
          {activeStep === 3 && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                  <span className="text-[11px] font-bold text-indigo-600 uppercase">Selected Questions</span>
                  <div className="text-xl font-black text-indigo-950 mt-0.5">{selectedCount}</div>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                  <span className="text-[11px] font-bold text-emerald-600 uppercase">Total Contest Marks</span>
                  <div className="text-xl font-black text-emerald-950 mt-0.5">{selectedMetrics.totalMarks} pts</div>
                </div>

                <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl">
                  <span className="text-[11px] font-bold text-purple-600 uppercase">Coding Problems</span>
                  <div className="text-xl font-black text-purple-950 mt-0.5">{selectedMetrics.codingCount}</div>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl">
                  <span className="text-[11px] font-bold text-amber-600 uppercase">MCQ / Aptitude</span>
                  <div className="text-xl font-black text-amber-950 mt-0.5">{selectedMetrics.mcqCount}</div>
                </div>
              </div>

              {/* Configurable Selected Questions List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>Question ({selectedCount})</span>
                  <div className="flex items-center gap-8">
                    <span>Section</span>
                    <span>Marks</span>
                    <span>Action</span>
                  </div>
                </div>

                {selectedList.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <p className="text-xs font-semibold">No questions selected yet.</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 text-indigo-600"
                      onClick={() => setActiveStep(2)}
                    >
                      Browse Question Bank
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto">
                    {selectedList.map((q, idx) => (
                      <div
                        key={q.id}
                        className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/60"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-slate-900 truncate">{q.title}</span>
                            <Badge
                              variant={q.type === "CODING" ? "indigo" : "amber"}
                              size="sm"
                              className="text-[10px]"
                            >
                              {q.type}
                            </Badge>
                          </div>
                          <span className="text-[11px] text-slate-400 ml-7">
                            {q.category} • {q.difficulty}
                          </span>
                        </div>

                        {/* Section Selector */}
                        <div className="flex items-center gap-3 shrink-0">
                          <select
                            value={q.section}
                            onChange={(e) => updateQuestionConfig(q.id, "section", e.target.value)}
                            className="px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-700 focus:outline-none"
                          >
                            <option value="CODING">Coding</option>
                            <option value="APTITUDE">Aptitude</option>
                            <option value="TECHNICAL">Technical</option>
                          </select>

                          {/* Marks Input */}
                          <div className="w-16">
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={q.marks}
                              onChange={(e) => updateQuestionConfig(q.id, "marks", e.target.value)}
                              className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 text-center font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              title="Points for this question"
                            />
                          </div>

                          {/* Remove Question Button */}
                          <button
                            type="button"
                            onClick={() => removeSelectedQuestion(q.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove from contest"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Review & Final Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  icon={ArrowLeft}
                  onClick={() => setActiveStep(2)}
                >
                  Back to Question Bank
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    loading={submitting}
                    disabled={selectedCount === 0}
                    onClick={(e) => handleCreateContest(e, "DRAFT")}
                    className="border-amber-300 text-amber-700 hover:bg-amber-50 font-bold"
                  >
                    Save as Draft
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    loading={submitting}
                    disabled={selectedCount === 0}
                    onClick={(e) => handleCreateContest(e, "PUBLISHED")}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/20"
                  >
                    Publish & Schedule Contest
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* =========================================================================
          Question Preview Modal (Read Only details from PostgreSQL)
         ========================================================================= */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={previewQuestion?.title || "Question Statement Preview"}
        subtitle={`${previewQuestion?.category || "General"} • ${previewQuestion?.type || ""} • ${previewQuestion?.difficulty || ""}`}
        maxWidth="max-w-2xl"
      >
        {previewQuestion && (
          <div className="space-y-4 text-xs">
            {/* Statement */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Problem Statement</h4>
              <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                {previewQuestion.statement || "No statement provided."}
              </p>
            </div>

            {/* MCQ Options */}
            {previewQuestion.type !== "CODING" && Array.isArray(previewQuestion.options) && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Multiple Choice Options</h4>
                <div className="space-y-1.5">
                  {previewQuestion.options.map((opt, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center gap-2"
                    >
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-slate-800">{typeof opt === "string" ? opt : opt.text || opt.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Coding Constraints */}
            {previewQuestion.type === "CODING" && (
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-purple-900 space-y-1">
                <h4 className="text-xs font-bold uppercase mb-1">Execution Constraints</h4>
                <div>Time Limit: {previewQuestion.timeLimitMs || 1000} ms</div>
                <div>Memory Limit: {previewQuestion.memoryLimitKb ? `${Math.round(previewQuestion.memoryLimitKb / 1024)} MB` : "256 MB"}</div>
                {previewQuestion.constraints && <div>Specific Constraints: {previewQuestion.constraints}</div>}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  toggleQuestionSelection(previewQuestion);
                  setIsPreviewOpen(false);
                }}
                className={
                  selectedQuestions[previewQuestion.id]
                    ? "bg-rose-600 hover:bg-rose-500 text-white"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
                }
              >
                {selectedQuestions[previewQuestion.id] ? "Remove from Contest" : "Select this Question"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* =========================================================================
          View Created Contest Questions Modal
         ========================================================================= */}
      <Modal
        isOpen={viewContestModalOpen}
        onClose={() => setViewContestModalOpen(false)}
        title={viewContestData?.contest?.title || "Contest Questions"}
        subtitle="Associated questions stored in PostgreSQL for this competitive round"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          {viewContestLoading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Retrieving contest questions from PostgreSQL...</p>
            </div>
          ) : !viewContestData?.questions || viewContestData.questions.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold">No questions associated with this contest.</p>
            </div>
          ) : (
            <div>
              <div className="mb-3 flex items-center justify-between text-xs text-slate-600">
                <span className="font-bold">
                  Total Questions: {viewContestData.questions.length}
                </span>
                <span className="font-bold text-indigo-600">
                  Total Marks: {viewContestData.questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0)} pts
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-[420px] overflow-y-auto bg-white">
                {viewContestData.questions.map((q, idx) => (
                  <div key={q.contestQuestionId || idx} className="p-3.5 flex items-start gap-3 text-xs">
                    <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      {q.order || idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-slate-900">{q.title}</span>
                        <Badge
                          variant={q.type === "CODING" ? "indigo" : "amber"}
                          size="sm"
                          className="text-[10px]"
                        >
                          {q.type}
                        </Badge>
                        <Badge
                          variant={
                            q.difficulty === "EASY"
                              ? "emerald"
                              : q.difficulty === "HARD"
                              ? "rose"
                              : "amber"
                          }
                          size="sm"
                          className="text-[10px]"
                        >
                          {q.difficulty}
                        </Badge>
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
                          Section: {q.section}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">{q.statement}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md text-xs">
                        {q.marks} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setViewContestModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
