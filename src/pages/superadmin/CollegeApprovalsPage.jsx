import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Phone,
  Globe,
  MapPin,
  ShieldCheck,
  Search,
  RefreshCw,
  Key,
  AlertCircle,
  Eye,
  Send,
  User,
  Plus,
  Layers,
  Copy,
  Check,
  KeyRound,
  FileCheck2,
  Sparkles
} from "lucide-react";
import { superAdminService } from "../../services/superAdminService";
import { useNotifications } from "../../context/NotificationContext";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";

export function CollegeApprovalsPage() {
  const { showSuccess, showError, showInfo } = useNotifications();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("collegeId");

  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING_APPROVAL");

  // Approval Modal state
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Direct Create Institution Modal state (for offline deals & direct additions)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    code: "",
    officialEmail: "",
    phone: "",
    website: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    adminName: "",
    adminUsername: "",
    tempPassword: "",
    acceptedDomains: "",
    sendEmail: true
  });
  const [createErrors, setCreateErrors] = useState({});
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Helper to generate secure temporary password
  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
    let pass = "Sips@";
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const loadColleges = async () => {
    try {
      setLoading(true);
      const res = await superAdminService.getAllColleges({
        status: statusFilter,
        search
      });
      setColleges(res.colleges || []);
    } catch (err) {
      console.error("Error loading colleges for approval:", err);
      showError("Failed to fetch college applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadColleges();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadColleges();
  };

  // Open direct creation modal (for offline deal)
  const openDirectCreateModal = () => {
    const pass = generatePassword();
    setCreateForm({
      name: "",
      code: "",
      officialEmail: "",
      phone: "",
      website: "",
      address: "",
      city: "",
      state: "",
      country: "India",
      adminName: "",
      adminUsername: "",
      tempPassword: pass,
      acceptedDomains: "",
      sendEmail: true
    });
    setCreateErrors({});
    setIsCreateModalOpen(true);
  };

  // Open approval modal for an inbound inquiry
  const openApproveModal = (college) => {
    setSelectedCollege(college);
    const pass = generatePassword();
    setTempPassword(pass);
    setIsApproveModalOpen(true);
  };

  // Handle Approve of inbound request
  const handleApprove = async () => {
    if (!selectedCollege) return;
    try {
      setActionLoading(true);
      const collegeLoginUrl = "http://localhost:5174/login";
      const res = await superAdminService.approveCollege(selectedCollege.id, {
        tempPassword,
        loginUrl: collegeLoginUrl
      });
      showSuccess(res.message || `College '${selectedCollege.name}' approved successfully! Login credentials dispatched.`);
      setIsApproveModalOpen(false);
      setSelectedCollege(null);
      loadColleges();
    } catch (err) {
      showError(err.message || "Failed to approve college application");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Direct Institution Creation (Offline Deal)
  const handleDirectCreate = async (e) => {
    e.preventDefault();
    const errs = {};

    if (!createForm.name.trim()) errs.name = "Institution name is required.";
    if (!createForm.officialEmail.trim()) {
      errs.officialEmail = "Official institutional email is required.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(createForm.officialEmail.trim())) {
        errs.officialEmail = "Please enter a valid email address.";
      }
    }
    if (!createForm.adminUsername.trim()) {
      errs.adminUsername = "Administrator username is required.";
    }
    if (!createForm.tempPassword.trim()) {
      errs.tempPassword = "Password is required.";
    }

    if (Object.keys(errs).length > 0) {
      setCreateErrors(errs);
      return;
    }

    try {
      setActionLoading(true);
      const collegeLoginUrl = "http://localhost:5174/login";
      const res = await superAdminService.createInstitution({
        ...createForm,
        loginUrl: collegeLoginUrl
      });

      showSuccess(res.message || `Institution '${createForm.name}' created and provisioned successfully!`);
      setIsCreateModalOpen(false);
      loadColleges();
    } catch (err) {
      showError(err.message || "Failed to provision institution.");
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (college) => {
    setSelectedCollege(college);
    setRejectReason("");
    setIsRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!selectedCollege) return;
    try {
      setActionLoading(true);
      const res = await superAdminService.rejectCollege(selectedCollege.id, rejectReason);
      showSuccess(res.message || `College application rejected.`);
      setIsRejectModalOpen(false);
      setSelectedCollege(null);
      loadColleges();
    } catch (err) {
      showError(err.message || "Failed to reject application");
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedPassword(true);
    showInfo("Copied temporary credentials to clipboard!");
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            Super Administrator Governance
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Institution Onboarding & Approvals
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage inbound pilot requests, provision new institutional tenants, and dispatch master credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={loadColleges}
            loading={loading}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={openDirectCreateModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
          >
            Provision Institution
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "PENDING_APPROVAL", label: "Inbound Inquiries", badgeColor: "bg-amber-100 text-amber-800" },
              { id: "ACTIVE", label: "Active Institutions", badgeColor: "bg-emerald-100 text-emerald-800" },
              { id: "REJECTED", label: "Rejected", badgeColor: "bg-rose-100 text-rose-800" },
              { id: "ALL", label: "All Records", badgeColor: "bg-slate-100 text-slate-800" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === tab.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, code..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-100/80 hover:bg-slate-100 text-xs rounded-xl border border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
            />
          </form>
        </div>
      </Card>

      {/* Colleges List */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mb-3" />
          <span className="text-xs font-semibold text-slate-500">Loading institution records...</span>
        </div>
      ) : colleges.length === 0 ? (
        <Card className="p-12 text-center bg-slate-50/50">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No applications found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {statusFilter === "PENDING_APPROVAL"
              ? "There are no pending inbound pilot requests at this time. You can directly provision an institution anytime."
              : "No institution records match the active status or search query."}
          </p>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={openDirectCreateModal}
            >
              Provision New Institution
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {colleges.map((col) => {
            const isHighlighted = highlightId && (col.id === highlightId || col._id === highlightId);
            return (
              <Card
                key={col.id || col._id}
                className={`p-5 transition-all relative ${
                  isHighlighted ? "ring-2 ring-indigo-500 shadow-lg bg-indigo-50/20" : "hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {col.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {col.code && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {col.code}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500 truncate">
                          {col.officialEmail}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant={
                      col.status === "ACTIVE"
                        ? "success"
                        : col.status === "PENDING_APPROVAL"
                        ? "warning"
                        : "danger"
                    }
                  >
                    {col.status === "PENDING_APPROVAL" ? "Pending Approval" : col.status}
                  </Badge>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y border-slate-100 my-3 text-slate-600">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{col.adminName || col.adminUsername || "Admin Account"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{col.phone || "No phone listed"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{col.city ? `${col.city}, ${col.state || ""}` : col.address || "Location not set"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{col.departmentCount || 0} Departments • {col.studentCount || 0} Students</span>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {col.createdAt ? `Submitted ${new Date(col.createdAt).toLocaleDateString()}` : "Active Tenant"}
                  </span>

                  <div className="flex items-center gap-2">
                    {col.status === "PENDING_APPROVAL" ? (
                      <>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => openRejectModal(col)}
                          className="text-rose-600 border-rose-200 hover:bg-rose-50"
                        >
                          Reject
                        </Button>
                        <Button
                          variant="primary"
                          size="xs"
                          icon={CheckCircle2}
                          onClick={() => openApproveModal(col)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
                        >
                          Approve & Dispatch
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="xs"
                        icon={KeyRound}
                        onClick={async () => {
                          try {
                            const res = await superAdminService.resendCredentials(col.id || col._id);
                            showSuccess(res.message || "Credentials re-dispatched to institutional email.");
                          } catch (e) {
                            showError("Failed to resend credentials.");
                          }
                        }}
                      >
                        Resend Credentials
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal 1: Approve Inbound Pilot Request */}
      {isApproveModalOpen && selectedCollege && (
        <Modal
          isOpen={isApproveModalOpen}
          onClose={() => {
            if (!actionLoading) {
              setIsApproveModalOpen(false);
              setSelectedCollege(null);
            }
          }}
          title="Authorize & Provision Institution Tenant"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-indigo-900 leading-snug">
              Approving <strong>{selectedCollege.name}</strong> will activate their tenant account and automatically email their login credentials to <strong>{selectedCollege.officialEmail}</strong>.
            </div>

            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Institution:</span>
                <span className="font-bold text-slate-800">{selectedCollege.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Official Email:</span>
                <span className="font-bold text-slate-800">{selectedCollege.officialEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Administrator Username:</span>
                <span className="font-mono font-bold text-indigo-700">{selectedCollege.adminUsername || selectedCollege.mainAdmin?.username || "admin"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Portal URL:</span>
                <span className="font-mono text-[11px] text-slate-700">http://localhost:5174/login</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Initial Temporary Password
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTempPassword(generatePassword())}
                >
                  Generate New
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={copiedPassword ? Check : Copy}
                  onClick={() => copyToClipboard(tempPassword)}
                >
                  {copiedPassword ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                The institution administrator will be forced to change this password on their first login.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                disabled={actionLoading}
                onClick={() => {
                  setIsApproveModalOpen(false);
                  setSelectedCollege(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={actionLoading}
                icon={Send}
                onClick={handleApprove}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20"
              >
                Approve & Dispatch Mail
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal 2: Direct Create Institution (For 100% Offline Deals) */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => {
            if (!actionLoading) setIsCreateModalOpen(false);
          }}
          title="Directly Provision New Institution (Offline / Deal Closure)"
        >
          <form onSubmit={handleDirectCreate} className="space-y-3.5 text-xs" noValidate>
            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600 text-[11px] leading-snug">
              Directly setup an approved university or college tenant. Credentials will be formatted for the <strong>College Web Platform (Port 5174)</strong>.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Institution Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RV College of Engineering"
                  value={createForm.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCreateForm((prev) => ({
                      ...prev,
                      name: val,
                      code: prev.code || val.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 6)
                    }));
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {createErrors.name && (
                  <p className="text-[11px] text-rose-600 mt-0.5">{createErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Code / Short Name
                </label>
                <input
                  type="text"
                  placeholder="RVCE"
                  value={createForm.code}
                  onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs uppercase font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Official Institutional Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="principal@rvce.edu.in"
                  value={createForm.officialEmail}
                  onChange={(e) => {
                    const email = e.target.value;
                    setCreateForm((prev) => ({
                      ...prev,
                      officialEmail: email,
                      adminUsername: prev.adminUsername || (email.includes("@") ? email.split("@")[0] : "")
                    }));
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {createErrors.officialEmail && (
                  <p className="text-[11px] text-rose-600 mt-0.5">{createErrors.officialEmail}</p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Contact Phone / WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Administrator Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="rvce_admin"
                  value={createForm.adminUsername}
                  onChange={(e) => setCreateForm({ ...createForm, adminUsername: e.target.value.toLowerCase().replace(/[^a-z0-9_]+/g, "_") })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {createErrors.adminUsername && (
                  <p className="text-[11px] text-rose-600 mt-0.5">{createErrors.adminUsername}</p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Initial Master Password <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    required
                    value={createForm.tempPassword}
                    onChange={(e) => setCreateForm({ ...createForm, tempPassword: e.target.value })}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, tempPassword: generatePassword() })}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 cursor-pointer"
                    title="Generate New Password"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  City / State
                </label>
                <input
                  type="text"
                  placeholder="Bengaluru, Karnataka"
                  value={createForm.city}
                  onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Accepted Student Email Domains
                </label>
                <input
                  type="text"
                  placeholder="rvce.edu.in, rvce.ac.in"
                  value={createForm.acceptedDomains}
                  onChange={(e) => setCreateForm({ ...createForm, acceptedDomains: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createForm.sendEmail}
                  onChange={(e) => setCreateForm({ ...createForm, sendEmail: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold">Dispatch Official Welcome Email with credentials immediately</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                type="button"
                disabled={actionLoading}
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                loading={actionLoading}
                icon={Plus}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                Provision & Activate
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal 3: Reject Inbound Request */}
      {isRejectModalOpen && selectedCollege && (
        <Modal
          isOpen={isRejectModalOpen}
          onClose={() => {
            if (!actionLoading) {
              setIsRejectModalOpen(false);
              setSelectedCollege(null);
            }
          }}
          title="Reject Onboarding Application"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Provide an optional remark explaining why <strong>{selectedCollege.name}</strong>'s request is rejected. An advisory email will be sent.
            </p>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Reason / Feedback</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Domain mismatch or duplicate request."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                disabled={actionLoading}
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setSelectedCollege(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={actionLoading}
                onClick={handleReject}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
