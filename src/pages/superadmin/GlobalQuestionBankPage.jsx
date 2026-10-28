import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  BookOpen,
  Plus,
  Search,
  Code2,
  HelpCircle,
  Sparkles,
  Archive,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Layers,
  ChevronRight,
  ChevronLeft,
  Eye,
  Globe,
  AlertCircle,
  CheckSquare,
  Square,
  MinusSquare,
  X,
  Check,
  ShieldAlert,
  Database,
  UploadCloud,
  FileSpreadsheet,
  FileJson
} from "lucide-react";
import { superAdminService } from "../../services/superAdminService";
import { useNotifications } from "../../context/NotificationContext";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Skeleton } from "../../components/common/LoadingSkeleton";
import { ProblemStatement } from "../../components/common/ProblemStatement";

export function GlobalQuestionBankPage() {
  const { showSuccess, showError } = useNotifications();
  const [searchParams] = useSearchParams();
  const shouldOpenNewModal = searchParams.get("action") === "new";

  const [questions, setQuestions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Topics & Topic Filter (backed by PostgreSQL)
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState("ALL");
  const [topicsLoading, setTopicsLoading] = useState(false);
  const requestSeqRef = React.useRef(0);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Selection State
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(shouldOpenNewModal);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, isBulk: false, question: null });

  // Bulk Ingestion State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [parsedBulkItems, setParsedBulkItems] = useState([]);
  const [bulkParseError, setBulkParseError] = useState("");

  // Form State for New Question
  const [formType, setFormType] = useState("CODING");
  const [formTitle, setFormTitle] = useState("");
  const [formStatement, setFormStatement] = useState("");
  const [formCategory, setFormCategory] = useState("Algorithms");
  const [formDifficulty, setFormDifficulty] = useState("MEDIUM");
  const [formTags, setFormTags] = useState("arrays, dynamic-programming");
  
  // Interactive Test Cases Builder State
  const [testCaseMode, setTestCaseMode] = useState("VISUAL"); // VISUAL | RAW
  const [visualTestCases, setVisualTestCases] = useState([
    { input: "2 3\n", output: "5\n", isSample: true, explanation: "Sample sum of 2 and 3" }
  ]);
  const [formTestCases, setFormTestCases] = useState('[{"input": "2 3\\n", "output": "5\\n", "isSample": true, "explanation": "Sample sum of 2 and 3"}]');

  // Interactive MCQ Options Builder State
  const [mcqOptions, setMcqOptions] = useState(["Option A", "Option B", "Option C", "Option D"]);
  const [formCorrectAnswer, setFormCorrectAnswer] = useState("0");
  const [formCreating, setFormCreating] = useState(false);

  const loadTopics = async () => {
    try {
      setTopicsLoading(true);
      const res = await superAdminService.getTopics();
      if (res && res.data && Array.isArray(res.data)) {
        setTopics(res.data);
      }
    } catch (err) {
      console.warn("Could not load dynamic topics catalog:", err);
    } finally {
      setTopicsLoading(false);
    }
  };

  const loadQuestions = async (page = 1) => {
    const seq = ++requestSeqRef.current;
    try {
      setLoading(true);
      const res = await superAdminService.getGlobalQuestions({
        page,
        limit: 20,
        search,
        topic: selectedTopic,
        type: typeFilter,
        difficulty: difficultyFilter,
        status: statusFilter
      });
      // Prevent stale requests from overwriting newer filter results
      if (seq !== requestSeqRef.current) return;

      setQuestions(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      if (seq !== requestSeqRef.current) return;
      console.error("Error loading global questions:", err);
      showError(err.message || "Failed to load global question bank");
    } finally {
      if (seq === requestSeqRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadTopics();
  }, []);

  useEffect(() => {
    setSelectedIds(new Set());
    loadQuestions(1);
  }, [selectedTopic, typeFilter, difficultyFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSelectedIds(new Set());
    loadQuestions(1);
  };

  // Selection Logic
  const allCurrentPageSelected = useMemo(() => {
    if (questions.length === 0) return false;
    return questions.every((q) => selectedIds.has(q.id));
  }, [questions, selectedIds]);

  const someCurrentPageSelected = useMemo(() => {
    if (questions.length === 0) return false;
    return questions.some((q) => selectedIds.has(q.id)) && !allCurrentPageSelected;
  }, [questions, selectedIds, allCurrentPageSelected]);

  const handleToggleSelectAll = () => {
    const next = new Set(selectedIds);
    if (allCurrentPageSelected) {
      questions.forEach((q) => next.delete(q.id));
    } else {
      questions.forEach((q) => next.add(q.id));
    }
    setSelectedIds(next);
  };

  const handleToggleSelectOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAllLoaded = () => {
    const next = new Set(questions.map((q) => q.id));
    setSelectedIds(next);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Single Actions
  const handleArchive = async (question) => {
    try {
      setActionLoadingId(question.id);
      const res = await superAdminService.archiveGlobalQuestion(question.id);
      showSuccess(res.message || "Question archived successfully");
      loadQuestions(pagination.page);
    } catch (err) {
      showError(err.message || "Failed to archive question");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleActivate = async (question) => {
    try {
      setActionLoadingId(question.id);
      const res = await superAdminService.activateGlobalQuestion(question.id);
      showSuccess(res.message || "Question published & active in Practice Hub!");
      loadQuestions(pagination.page);
    } catch (err) {
      showError(err.message || "Failed to activate question");
    } finally {
      setActionLoadingId(null);
    }
  };

  const confirmSingleDelete = (question) => {
    setDeleteModalState({ isOpen: true, isBulk: false, question });
  };

  const confirmBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setDeleteModalState({ isOpen: true, isBulk: true, question: null });
  };

  const executeDelete = async () => {
    try {
      if (deleteModalState.isBulk) {
        setBulkActionLoading(true);
        const idsArray = Array.from(selectedIds);
        const res = await superAdminService.bulkDeleteGlobalQuestions(idsArray);
        showSuccess(res.message || `Deleted ${idsArray.length} questions successfully`);
        setSelectedIds(new Set());
      } else if (deleteModalState.question) {
        setActionLoadingId(deleteModalState.question.id);
        const res = await superAdminService.deleteGlobalQuestion(deleteModalState.question.id);
        showSuccess(res.message || "Question deleted successfully");
        const next = new Set(selectedIds);
        next.delete(deleteModalState.question.id);
        setSelectedIds(next);
      }
      setDeleteModalState({ isOpen: false, isBulk: false, question: null });
      loadQuestions(pagination.page);
      loadTopics();
    } catch (err) {
      showError(err.message || "Failed to delete question(s)");
    } finally {
      setBulkActionLoading(false);
      setActionLoadingId(null);
    }
  };

  // Bulk Actions
  const handleBulkActivate = async () => {
    if (selectedIds.size === 0) return;
    try {
      setBulkActionLoading(true);
      const idsArray = Array.from(selectedIds);
      const res = await superAdminService.bulkActivateGlobalQuestions(idsArray);
      showSuccess(res.message || `Activated and published ${idsArray.length} questions to Practice Hub!`);
      loadQuestions(pagination.page);
    } catch (err) {
      showError(err.message || "Failed to activate selected questions");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedIds.size === 0) return;
    try {
      setBulkActionLoading(true);
      const idsArray = Array.from(selectedIds);
      const res = await superAdminService.bulkArchiveGlobalQuestions(idsArray);
      showSuccess(res.message || `Archived ${idsArray.length} questions.`);
      loadQuestions(pagination.page);
    } catch (err) {
      showError(err.message || "Failed to archive selected questions");
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Visual Test Case Helpers
  const handleAddTestCase = () => {
    const updated = [
      ...visualTestCases,
      { input: "", output: "", isSample: false, explanation: "" }
    ];
    setVisualTestCases(updated);
    setFormTestCases(JSON.stringify(updated, null, 2));
  };

  const handleRemoveTestCase = (index) => {
    const updated = visualTestCases.filter((_, idx) => idx !== index);
    setVisualTestCases(updated);
    setFormTestCases(JSON.stringify(updated, null, 2));
  };

  const handleUpdateTestCase = (index, field, value) => {
    const updated = visualTestCases.map((tc, idx) =>
      idx === index ? { ...tc, [field]: value } : tc
    );
    setVisualTestCases(updated);
    setFormTestCases(JSON.stringify(updated, null, 2));
  };

  const handleRawJsonChange = (rawText) => {
    setFormTestCases(rawText);
    try {
      const parsed = JSON.parse(rawText);
      if (Array.isArray(parsed)) {
        setVisualTestCases(parsed);
      }
    } catch (e) {
      // Allow in-progress typing in raw mode without erroring
    }
  };

  // MCQ Option Helpers
  const handleAddOption = () => {
    setMcqOptions((prev) => [...prev, `Option ${String.fromCharCode(65 + prev.length)}`]);
  };

  const handleRemoveOption = (index) => {
    if (mcqOptions.length <= 2) {
      showError("Multiple choice questions require at least 2 options.");
      return;
    }
    const updated = mcqOptions.filter((_, idx) => idx !== index);
    setMcqOptions(updated);
    if (parseInt(formCorrectAnswer, 10) >= updated.length) {
      setFormCorrectAnswer(String(updated.length - 1));
    }
  };

  const handleUpdateOption = (index, value) => {
    const updated = mcqOptions.map((opt, idx) => (idx === index ? value : opt));
    setMcqOptions(updated);
  };

  // Bulk File Ingestion Helpers
  const downloadSampleJson = () => {
    const sample = [
      {
        title: "Two Sum",
        statement: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        type: "CODING",
        category: "Algorithms",
        difficulty: "EASY",
        tags: ["arrays", "hash-table"],
        testCases: [
          { input: "4\n2 7 11 15\n9\n", output: "0 1\n", isSample: true, explanation: "nums[0] + nums[1] == 9" },
          { input: "3\n3 2 4\n6\n", output: "1 2\n", isSample: false }
        ]
      },
      {
        title: "ACID Properties in Relational Databases",
        statement: "Which property in ACID ensures that database transactions are executed in a isolated and concurrent-safe manner?",
        type: "MCQ",
        category: "DBMS",
        difficulty: "MEDIUM",
        tags: ["dbms", "sql", "acid"],
        options: ["Atomicity", "Consistency", "Isolation", "Durability"],
        correctAnswer: 2
      }
    ];

    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flash_question_bank_template.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadSampleCsv = () => {
    const headers = "title,type,category,difficulty,tags,statement,options,correctAnswer,testCases\n";
    const row1 = `"Binary Search","CODING","Algorithms","EASY","arrays;binary-search","Given a sorted array of distinct integers and a target value, return the index if the target is found.","","","[{""input"":""5\\n1 3 5 7 9\\n5\\n"",""output"":""2\\n"",""isSample"":true}]"\n`;
    const row2 = `"TCP vs UDP","MCQ","Networking","EASY","networking;protocols","Which protocol is connection-oriented and guarantees ordered delivery?","TCP;UDP;ICMP;IGMP","0",""\n`;
    const csv = headers + row1 + row2;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flash_question_bank_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleBulkFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkFile(file);
    setBulkParseError("");
    setParsedBulkItems([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (file.name.endsWith(".json")) {
          let parsed = JSON.parse(text);
          if (!Array.isArray(parsed) && parsed.items) {
            parsed = parsed.items;
          }
          if (!Array.isArray(parsed)) {
            throw new Error("JSON file must contain an array of question objects or { items: [...] }.");
          }
          setParsedBulkItems(parsed);
        } else if (file.name.endsWith(".csv")) {
          // Simple CSV parser for questions
          const lines = text.split(/\r?\n/).filter(Boolean);
          if (lines.length < 2) {
            throw new Error("CSV file is empty or missing data rows.");
          }
          const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
          const items = [];

          for (let i = 1; i < lines.length; i++) {
            const rawLine = lines[i];
            if (!rawLine.trim()) continue;

            // Handle quoted CSV fields
            const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
            const matches = [];
            let match;
            while ((match = regex.exec(rawLine)) !== null) {
              let val = match[1] || "";
              if (val.startsWith('"') && val.endsWith('"')) {
                val = val.slice(1, -1).replace(/""/g, '"');
              }
              matches.push(val);
              if (regex.lastIndex >= rawLine.length) break;
            }

            const row = {};
            headers.forEach((h, idx) => {
              row[h] = matches[idx] || "";
            });

            if (row.title && row.statement) {
              const isMcq = (row.type || "").toUpperCase() === "MCQ";
              let parsedTestCases = [];
              if (row.testCases) {
                try {
                  parsedTestCases = JSON.parse(row.testCases);
                } catch (err) {}
              }

              items.push({
                title: row.title,
                statement: row.statement,
                type: isMcq ? "MCQ" : "CODING",
                category: row.category || "General",
                difficulty: (row.difficulty || "MEDIUM").toUpperCase(),
                tags: row.tags ? row.tags.split(";").map((t) => t.trim()) : [],
                options: isMcq && row.options ? row.options.split(";").map((o) => o.trim()) : null,
                correctAnswer: isMcq && row.correctAnswer !== "" ? parseInt(row.correctAnswer, 10) : null,
                testCases: parsedTestCases,
                isGlobal: true
              });
            }
          }
          setParsedBulkItems(items);
        } else {
          throw new Error("Unsupported file format. Please upload a .json or .csv file.");
        }
      } catch (err) {
        console.error("Parse bulk questions error:", err);
        setBulkParseError(err.message || "Failed to parse file format.");
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteBulkImport = async () => {
    if (parsedBulkItems.length === 0) {
      showError("No valid questions found to import.");
      return;
    }

    try {
      setBulkImporting(true);
      const res = await superAdminService.bulkImportQuestions(parsedBulkItems);
      showSuccess(res.message || `Successfully imported ${parsedBulkItems.length} questions into PostgreSQL universal bank!`);
      setIsBulkModalOpen(false);
      setBulkFile(null);
      setParsedBulkItems([]);
      loadQuestions(1);
      loadTopics();
    } catch (err) {
      console.error("Bulk import execution error:", err);
      showError(err.message || "Bulk question ingestion failed.");
    } finally {
      setBulkImporting(false);
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formStatement.trim()) {
      showError("Title and problem statement are required.");
      return;
    }

    try {
      setFormCreating(true);
      let parsedTestCases = [];
      if (formType === "CODING") {
        if (testCaseMode === "RAW") {
          if (formTestCases.trim()) {
            try {
              parsedTestCases = JSON.parse(formTestCases);
            } catch (e) {
              showError("Invalid JSON in Test Cases. Please provide a valid JSON array.");
              setFormCreating(false);
              return;
            }
          }
        } else {
          parsedTestCases = visualTestCases.filter((tc) => tc.input || tc.output);
        }
      }

      let optionsPayload = null;
      let correctAnswerPayload = null;
      if (formType === "MCQ") {
        optionsPayload = mcqOptions.map((o) => o.trim()).filter(Boolean);
        if (optionsPayload.length < 2) {
          showError("Please provide at least 2 options for multiple-choice questions.");
          setFormCreating(false);
          return;
        }
        correctAnswerPayload = parseInt(formCorrectAnswer, 10);
        if (isNaN(correctAnswerPayload) || correctAnswerPayload < 0 || correctAnswerPayload >= optionsPayload.length) {
          correctAnswerPayload = 0;
        }
      }

      const tagsArray = formTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        title: formTitle.trim(),
        statement: formStatement.trim(),
        type: formType,
        category: formCategory.trim(),
        difficulty: formDifficulty,
        tags: tagsArray,
        isGlobal: true,
        testCases: parsedTestCases,
        options: optionsPayload,
        correctAnswer: correctAnswerPayload
      };

      const res = await superAdminService.createGlobalQuestion(payload);
      showSuccess(res.message || "Global question added to platform universal bank and Practice Hub!");
      setIsAddModalOpen(false);
      setFormTitle("");
      setFormStatement("");
      loadQuestions(1);
      loadTopics();
    } catch (err) {
      showError(err.message || "Failed to create global question");
    } finally {
      setFormCreating(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">
            <Globe className="w-4 h-4" />
            Universal Question Bank & Practice Hub Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Question Bank Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage, curate, select, publish, and delete benchmark coding questions & MCQs across the student Practice Hub and College Assessments.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={() => loadQuestions(pagination.page)}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={UploadCloud}
            onClick={() => setIsBulkModalOpen(true)}
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            Bulk Ingestion
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsAddModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
          >
            Add Question
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <Card padding="p-4" className="space-y-3 shadow-sm border-slate-200/80">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
            {[
              { id: "ALL", label: "All Questions" },
              { id: "ACTIVE", label: "Live in Practice Hub" },
              { id: "ARCHIVED", label: "Archived" }
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === st.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, tag, category, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-20 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 bg-white"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 px-2.5 py-1 text-[11px] font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Secondary filters: Type & Difficulty */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Type:</span>
              {["ALL", "CODING", "MCQ"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    typeFilter === t ? "bg-purple-600 text-white font-bold" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Difficulty:</span>
              {["ALL", "EASY", "MEDIUM", "HARD"].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficultyFilter(d)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    difficultyFilter === d ? "bg-purple-600 text-white font-bold" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
            <Database className="w-3.5 h-3.5 text-purple-600" />
            <span>
              Showing <strong className="text-slate-900">{questions.length}</strong> of <strong className="text-slate-900">{pagination.total}</strong> questions
            </span>
          </div>
        </div>

        {/* Dynamic Topic Browsing */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>Browse by Topic / Category</span>
              {topicsLoading && (
                <RefreshCw className="w-3 h-3 text-purple-600 animate-spin ml-1" />
              )}
            </div>
            {selectedTopic && (
              <button
                type="button"
                onClick={() => setSelectedTopic("")}
                className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1"
              >
                <span>Clear topic ({selectedTopic})</span>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedTopic("")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                !selectedTopic
                  ? "bg-slate-900 text-white shadow-sm font-bold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Topics
            </button>
            {topics.map((t) => {
              const isSelected = selectedTopic === t.name;
              return (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => setSelectedTopic(isSelected ? "" : t.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-purple-600 text-white shadow-sm font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>{t.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isSelected
                        ? "bg-purple-700 text-purple-100"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {t.questionCount}
                  </span>
                </button>
              );
            })}
            {topics.length === 0 && !topicsLoading && (
              <span className="text-xs text-slate-400 italic">No topics found in database</span>
            )}
          </div>
        </div>
      </Card>

      {/* Master Selection Toolbar */}
      {questions.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-purple-600 transition-colors"
            >
              {allCurrentPageSelected ? (
                <CheckSquare className="w-4 h-4 text-purple-600" />
              ) : someCurrentPageSelected ? (
                <MinusSquare className="w-4 h-4 text-purple-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Select All on Page ({questions.length})</span>
            </button>

            {selectedIds.size > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                {selectedIds.size} Selected
              </span>
            )}
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllLoaded}
                className="text-xs font-medium text-purple-700 hover:underline"
              >
                Select all loaded
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}

      {/* Questions List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-5 w-64 rounded-md" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                  <div className="flex items-center gap-3 pl-8">
                    <Skeleton className="h-3.5 w-24 rounded" />
                    <Skeleton className="h-3.5 w-20 rounded" />
                    <Skeleton className="h-3.5 w-32 rounded" />
                  </div>
                </div>
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            </Card>
          ))}
        </div>
      ) : questions.length === 0 ? (
        <Card padding="p-16" className="text-center shadow-sm">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No questions match your criteria</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search keywords, clearing status filters, or add new benchmark questions.
          </p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {questions.map((q) => {
            const isSelected = selectedIds.has(q.id);
            const isCoding = q.type === "CODING";
            const isArchived = q.status === "ARCHIVED";
            const isActive = q.status === "ACTIVE";

            return (
              <div
                key={q.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isSelected
                    ? "bg-purple-50/60 border-purple-300 shadow-sm ring-1 ring-purple-400/30"
                    : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Select Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggleSelectOne(q.id)}
                    className="mt-0.5 text-slate-400 hover:text-purple-600 transition-colors shrink-0"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-purple-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                    )}
                  </button>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Type Badge */}
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 ${
                          isCoding ? "bg-blue-50 text-blue-700 border border-blue-200/60" : "bg-amber-50 text-amber-700 border border-amber-200/60"
                        }`}
                      >
                        {isCoding ? <Code2 className="w-3 h-3" /> : <HelpCircle className="w-3 h-3" />}
                        {q.type}
                      </span>

                      {/* Question Title */}
                      <h4
                        onClick={() => setSelectedQuestion(q)}
                        className="font-bold text-sm text-slate-900 hover:text-purple-700 cursor-pointer truncate max-w-xl"
                      >
                        {q.latestTitle || q.title || q.externalId || "Untitled Question"}
                      </h4>

                      {/* Difficulty Badge */}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          q.difficulty === "EASY"
                            ? "bg-emerald-100 text-emerald-800"
                            : q.difficulty === "MEDIUM"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {q.difficulty}
                      </span>

                      {/* Status / Hub Badge */}
                      {isActive ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          Live in Practice Hub
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          Archived / Hidden
                        </span>
                      )}

                      {/* Global Badge */}
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                        GLOBAL
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>Category: <strong className="text-slate-700">{q.category || "General"}</strong></span>
                      {q.sourceNamespace && (
                        <>
                          <span>•</span>
                          <span>Source: <code className="text-indigo-600 font-mono text-[11px]">{q.sourceNamespace}</code></span>
                        </>
                      )}
                      {q.tags && q.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            {q.tags.slice(0, 4).map((tag) => (
                              <span key={tag} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-600">
                                #{tag}
                              </span>
                            ))}
                            {q.tags.length > 4 && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                +{q.tags.length - 4} more
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={Eye}
                    onClick={() => setSelectedQuestion(q)}
                    className="text-slate-600 hover:text-purple-600"
                  >
                    Details
                  </Button>

                  {isArchived ? (
                    <Button
                      variant="outline"
                      size="xs"
                      icon={CheckCircle2}
                      onClick={() => handleActivate(q)}
                      loading={actionLoadingId === q.id}
                      className="text-emerald-700 hover:bg-emerald-50 border-emerald-300"
                      title="Publish and make live in Practice Hub"
                    >
                      Publish
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="xs"
                      icon={Archive}
                      onClick={() => handleArchive(q)}
                      loading={actionLoadingId === q.id}
                      className="text-slate-600 hover:text-amber-600 hover:border-amber-300"
                      title="Archive from Practice Hub"
                    >
                      Archive
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="xs"
                    icon={Trash2}
                    onClick={() => confirmSingleDelete(q)}
                    loading={actionLoadingId === q.id}
                    className="text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                    title="Hard delete question from database"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 text-xs text-slate-500 bg-white p-4 rounded-xl border border-slate-200">
          <span>
            Page <strong className="text-slate-900">{pagination.page}</strong> of <strong className="text-slate-900">{pagination.totalPages}</strong> ({pagination.total} items)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              icon={ChevronLeft}
              disabled={pagination.page <= 1}
              onClick={() => loadQuestions(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="xs"
              icon={ChevronRight}
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => loadQuestions(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* FLOATING BULK ACTIONS TOOLBAR */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-4 animate-bounce-short">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
            <span className="w-6 h-6 rounded-full bg-purple-500/30 text-purple-300 font-black text-xs flex items-center justify-center">
              {selectedIds.size}
            </span>
            <span className="text-xs font-semibold text-slate-200">
              Questions Selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="xs"
              icon={CheckCircle2}
              onClick={handleBulkActivate}
              loading={bulkActionLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Publish to Practice Hub
            </Button>

            <Button
              variant="outline"
              size="xs"
              icon={Archive}
              onClick={handleBulkArchive}
              loading={bulkActionLoading}
              className="text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white"
            >
              Archive
            </Button>

            <Button
              variant="outline"
              size="xs"
              icon={Trash2}
              onClick={confirmBulkDelete}
              loading={bulkActionLoading}
              className="text-rose-400 border-rose-900/50 hover:bg-rose-950/50 hover:border-rose-700"
            >
              Delete Selected
            </Button>

            <button
              type="button"
              onClick={handleClearSelection}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 ml-1"
              title="Deselect all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">
                {deleteModalState.isBulk
                  ? `Delete ${selectedIds.size} Selected Questions?`
                  : "Delete Global Question?"}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {deleteModalState.isBulk
                  ? `This action will permanently delete ${selectedIds.size} questions from the PostgreSQL database, including all their versions, test cases, and coding problem references.`
                  : `Are you sure you want to permanently delete "${deleteModalState.question?.latestTitle || deleteModalState.question?.title}"? This cannot be undone.`}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteModalState({ isOpen: false, isBulk: false, question: null })}
                disabled={bulkActionLoading || !!actionLoadingId}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Trash2}
                onClick={executeDelete}
                loading={bulkActionLoading || !!actionLoadingId}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Global Question Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-purple-900 to-slate-900 p-6 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Add Question to Question Bank</h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Universal question visible across Practice Hub and Campus Assessments.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateQuestion} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Question Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormType("CODING")}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                      formType === "CODING"
                        ? "border-purple-600 bg-purple-50/50 text-purple-950 font-bold shadow-sm"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <Code2 className="w-5 h-5 text-purple-600" />
                    <div>
                      <div className="text-xs">Coding Problem</div>
                      <div className="text-[10px] text-slate-500">I/O test cases & code execution</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType("MCQ")}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                      formType === "MCQ"
                        ? "border-purple-600 bg-purple-50/50 text-purple-950 font-bold shadow-sm"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <HelpCircle className="w-5 h-5 text-purple-600" />
                    <div>
                      <div className="text-xs">Multiple Choice MCQ</div>
                      <div className="text-[10px] text-slate-500">Single correct choice</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Question Title
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Two Sum Problem / Maximum Subarray Sum"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              {/* Category & Difficulty */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    required
                    list="dynamic-topics-list"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g., Algorithms, Data Structures, DBMS, Networks"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                  <datalist id="dynamic-topics-list">
                    {topics.map((t) => (
                      <option key={t.name} value={t.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 bg-white"
                  >
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                </div>
              </div>

              {/* Problem Statement */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Problem Statement / Markdown Text
                </label>
                <textarea
                  rows={4}
                  required
                  value={formStatement}
                  onChange={(e) => setFormStatement(e.target.value)}
                  placeholder="Describe the problem, input format, constraints, and output expectations..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-mono"
                />
              </div>

              {/* Type specific fields */}
              {formType === "CODING" ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Test Cases ({visualTestCases.length})
                      </label>
                      <p className="text-[11px] text-slate-400">
                        Define benchmark input/output test cases for candidate evaluations.
                      </p>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setTestCaseMode("VISUAL")}
                        className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                          testCaseMode === "VISUAL"
                            ? "bg-white text-purple-700 shadow-2xs"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Visual Builder
                      </button>
                      <button
                        type="button"
                        onClick={() => setTestCaseMode("RAW")}
                        className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                          testCaseMode === "RAW"
                            ? "bg-white text-purple-700 shadow-2xs"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Raw JSON
                      </button>
                    </div>
                  </div>

                  {testCaseMode === "VISUAL" ? (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {visualTestCases.map((tc, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700 flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 text-[10px] flex items-center justify-center font-bold">
                                {idx + 1}
                              </span>
                              Test Case #{idx + 1}
                            </span>

                            <div className="flex items-center gap-3">
                              <label className="inline-flex items-center gap-1 text-[11px] text-slate-600 font-medium cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={tc.isSample}
                                  onChange={(e) =>
                                    handleUpdateTestCase(idx, "isSample", e.target.checked)
                                  }
                                  className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                                />
                                Sample Test Case
                              </label>

                              {visualTestCases.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTestCase(idx)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded cursor-pointer"
                                  title="Delete test case"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 font-mono">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                                Input (stdin)
                              </span>
                              <textarea
                                rows={2}
                                value={tc.input}
                                onChange={(e) =>
                                  handleUpdateTestCase(idx, "input", e.target.value)
                                }
                                placeholder="e.g., 2 3\n"
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                                Output (stdout)
                              </span>
                              <textarea
                                rows={2}
                                value={tc.output}
                                onChange={(e) =>
                                  handleUpdateTestCase(idx, "output", e.target.value)
                                }
                                placeholder="e.g., 5\n"
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                              />
                            </div>
                          </div>

                          <div>
                            <input
                              type="text"
                              value={tc.explanation || ""}
                              onChange={(e) =>
                                handleUpdateTestCase(idx, "explanation", e.target.value)
                              }
                              placeholder="Explanation (shown to candidates on sample failure)..."
                              className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        icon={Plus}
                        onClick={handleAddTestCase}
                        className="w-full border-dashed border-slate-300 text-purple-700 hover:bg-purple-50/50"
                      >
                        Add Another Test Case
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <textarea
                        rows={5}
                        value={formTestCases}
                        onChange={(e) => handleRawJsonChange(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-mono"
                      />
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Array of objects with <code>input</code>, <code>output</code>, <code>isSample</code>, and <code>explanation</code>.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Multiple Choice Options ({mcqOptions.length})
                      </label>
                      <p className="text-[11px] text-slate-400">
                        Provide choices and select the radio button corresponding to the correct answer.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={Plus}
                      onClick={handleAddOption}
                      className="text-xs h-7 px-2"
                    >
                      Add Option
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {mcqOptions.map((opt, idx) => {
                      const isCorrect = parseInt(formCorrectAnswer, 10) === idx;
                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-colors ${
                            isCorrect
                              ? "bg-purple-50/60 border-purple-300"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <label className="flex items-center gap-2 cursor-pointer shrink-0">
                            <input
                              type="radio"
                              name="correctAnswerGroup"
                              checked={isCorrect}
                              onChange={() => setFormCorrectAnswer(String(idx))}
                              className="w-4 h-4 text-purple-600 focus:ring-purple-500 cursor-pointer"
                            />
                            <span className="font-bold text-xs text-slate-700">
                              Option {String.fromCharCode(65 + idx)}:
                            </span>
                          </label>

                          <input
                            type="text"
                            required
                            value={opt}
                            onChange={(e) => handleUpdateOption(idx, e.target.value)}
                            placeholder={`Enter choice ${String.fromCharCode(65 + idx)}...`}
                            className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />

                          {isCorrect && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200 shrink-0">
                              Correct Answer
                            </span>
                          )}

                          {mcqOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="algorithms, math, trees, dynamic-programming"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)} disabled={formCreating}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={formCreating}
                  className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                >
                  Publish to Question Bank & Practice Hub
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Question Ingestion Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">
                  <UploadCloud className="w-4 h-4" />
                  PostgreSQL Batch Ingestion
                </div>
                <h3 className="text-xl font-bold">Bulk Ingest Questions</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Import tens or hundreds of questions into PostgreSQL universal bank with automated schema validation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setParsedBulkItems([]);
                  setBulkFile(null);
                  setBulkParseError("");
                }}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Template download strip */}
              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-purple-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Download Canonical Format Templates
                  </h4>
                  <p className="text-[11px] text-purple-700/80 mt-0.5">
                    Use our pre-configured formats with example coding challenges and MCQs.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={downloadSampleJson}
                    className="px-3 py-1.5 rounded-lg bg-white border border-purple-200 text-purple-700 hover:bg-purple-100/60 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <FileJson className="w-3.5 h-3.5 text-purple-600" />
                    Sample JSON
                  </button>
                  <button
                    type="button"
                    onClick={downloadSampleCsv}
                    className="px-3 py-1.5 rounded-lg bg-white border border-purple-200 text-purple-700 hover:bg-purple-100/60 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    Sample CSV
                  </button>
                </div>
              </div>

              {/* File Upload Dropzone */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-2">
                  Select Question Batch File (.json or .csv)
                </label>
                <div className="relative border-2 border-dashed border-slate-300 hover:border-purple-500 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
                  <input
                    type="file"
                    accept=".json,.csv"
                    onChange={handleBulkFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="w-10 h-10 text-purple-500 mx-auto mb-2" />
                  <p className="font-bold text-slate-800 text-sm">
                    {bulkFile ? bulkFile.name : "Click to select or drag and drop batch file here"}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    Supports JSON array or standard comma-separated CSV with problem metadata.
                  </p>
                </div>
              </div>

              {/* Error Alert */}
              {bulkParseError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">File Parsing Error: </span>
                    {bulkParseError}
                  </div>
                </div>
              )}

              {/* Dry Run Preview Table */}
              {parsedBulkItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Parsed Dry-Run Preview ({parsedBulkItems.length} Questions Ready)
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Verify contents before writing to PostgreSQL
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-500 sticky top-0">
                        <tr>
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">Title</th>
                          <th className="py-2 px-3">Type</th>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3">Difficulty</th>
                          <th className="py-2 px-3">Metadata</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {parsedBulkItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-bold text-slate-400">{idx + 1}</td>
                            <td className="py-2 px-3 font-semibold text-slate-900 truncate max-w-xs" title={item.title}>
                              {item.title}
                            </td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.type === "CODING"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              }`}>
                                {item.type}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-600">{item.category}</td>
                            <td className="py-2 px-3 font-mono text-slate-700 font-bold">{item.difficulty}</td>
                            <td className="py-2 px-3 text-slate-500">
                              {item.type === "CODING"
                                ? `${Array.isArray(item.testCases) ? item.testCases.length : 0} test cases`
                                : `${Array.isArray(item.options) ? item.options.length : 0} options`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {parsedBulkItems.length > 0 ? `${parsedBulkItems.length} questions ready for batch transaction.` : "No file loaded."}
              </span>
              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsBulkModalOpen(false);
                    setParsedBulkItems([]);
                    setBulkFile(null);
                  }}
                  disabled={bulkImporting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon={UploadCloud}
                  loading={bulkImporting}
                  disabled={parsedBulkItems.length === 0}
                  onClick={handleExecuteBulkImport}
                  className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                >
                  Import {parsedBulkItems.length > 0 ? `${parsedBulkItems.length} Questions` : "Batch"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[88vh] flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-400/20">
                    {selectedQuestion.type} • {selectedQuestion.difficulty}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/20">
                    {selectedQuestion.status || "ACTIVE"}
                  </span>
                </div>
                <h3 className="text-lg font-bold">{selectedQuestion.latestTitle || selectedQuestion.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuestion(null)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <p className="text-slate-400 uppercase font-bold text-[10px] mb-1.5">Problem Statement & Format</p>
                <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                  <ProblemStatement statement={selectedQuestion.statement} />
                </div>
              </div>

              {selectedQuestion.options && selectedQuestion.options.length > 0 && (
                <div>
                  <p className="text-slate-400 uppercase font-bold text-[10px] mb-1.5">MCQ Options</p>
                  <div className="space-y-2">
                    {selectedQuestion.options.map((opt, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
                        <span className="font-bold text-slate-500 text-xs">Option {idx + 1}:</span>
                        <span className="text-slate-800 font-medium">{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 uppercase block font-bold">Category</span>
                  <strong className="text-slate-800 text-xs">{selectedQuestion.category || "General"}</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 uppercase block font-bold">Source Namespace</span>
                  <strong className="text-slate-800 text-xs font-mono">{selectedQuestion.sourceNamespace || "Global"}</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 uppercase block font-bold">Total Practice Runs</span>
                  <strong className="text-slate-800 text-xs">{selectedQuestion.totalRuns || 0} Submissions</strong>
                </div>
              </div>

              {selectedQuestion.tags && selectedQuestion.tags.length > 0 && (
                <div>
                  <p className="text-slate-400 uppercase font-bold text-[10px] mb-1">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedQuestion.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs font-semibold">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <Button
                variant="outline"
                size="xs"
                icon={Trash2}
                onClick={() => {
                  const q = selectedQuestion;
                  setSelectedQuestion(null);
                  confirmSingleDelete(q);
                }}
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                Delete Question
              </Button>
              <Button variant="primary" size="sm" onClick={() => setSelectedQuestion(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
