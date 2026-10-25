import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FileText,
  Download,
  Printer,
  Sparkles,
  TrendingUp,
  CreditCard,
  Building2,
  Briefcase,
  ShieldCheck,
  ShieldAlert,
  Users,
  Trophy,
  PieChart as PieIcon,
  BarChart3,
  CheckCircle2,
  Lock,
  RefreshCw,
  ArrowUpRight
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from "recharts";
import { adminService } from "../../services/adminService";
import { useNotifications } from "../../context/NotificationContext";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { TableSkeleton } from "../../components/common/LoadingSkeleton";

const CHART_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

export function ReportsGeneratorPage() {
  const { showSuccess, showError } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "self";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);

  // Pillar 1 Data: Self Usage
  const [subsData, setSubsData] = useState(null);
  const [finData, setFinData] = useState(null);

  // Pillar 2 Data: Investors
  const [investorData, setInvestorData] = useState(null);

  // Pillar 3 Data: College Partnerships
  const [collegeData, setCollegeData] = useState(null);

  // Pillar 4 Data: Brand Collaborations
  const [brandData, setBrandData] = useState(null);

  const loadAllReports = async () => {
    try {
      setLoading(true);
      const [subsRes, finRes, invRes, colRes, brandRes] = await Promise.all([
        adminService.getSubscriptionReports().catch(() => ({ data: null })),
        adminService.getFinancialReports({ limit: 50 }).catch(() => ({ summary: null })),
        adminService.getInvestorReports().catch(() => ({ deck: null })),
        adminService.getCollegePartnershipReports().catch(() => ({ collegeCohorts: [] })),
        adminService.getBrandCollaborationReports().catch(() => ({ brandFactSheet: null }))
      ]);

      if (subsRes.data) setSubsData(subsRes.data);
      if (finRes.summary) setFinData(finRes);
      if (invRes.deck) setInvestorData(invRes.deck);
      if (colRes.collegeCohorts) setCollegeData(colRes);
      if (brandRes.brandFactSheet) setBrandData(brandRes.brandFactSheet);
    } catch (err) {
      console.error("Failed to load reports:", err);
      showError("Failed to generate complete report metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllReports();
  }, []);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  // One-Click CSV Exporter
  const handleExportCsv = () => {
    let csvContent = "";
    let filename = `flash_${activeTab}_report_${Date.now()}.csv`;

    if (activeTab === "self") {
      csvContent = "Order ID,Payment ID,Type,Amount (INR),GST (INR),Date\n";
      (finData?.transactions || []).forEach((t) => {
        csvContent += `"${t.orderId || ""}","${t.paymentId || ""}","${t.orderType || t.type || "PLAN"}","${t.totalAmount || t.amount || 0}","${t.gstAmount || 0}","${new Date(t.createdAt || Date.now()).toISOString()}"\n`;
      });
    } else if (activeTab === "investor") {
      csvContent = "Metric,Value\n";
      const h = investorData?.headlineMetrics || {};
      Object.keys(h).forEach((k) => {
        csvContent += `"${k}","${h[k]}"\n`;
      });
    } else if (activeTab === "college") {
      csvContent = "College Name,Enrolled Students,Average Readiness Score (%),Technical Students (%)\n";
      (collegeData?.collegeCohorts || []).forEach((c) => {
        csvContent += `"${c.collegeName}","${c.studentCount}","${c.avgReadinessScore}%","${c.technicalRatioPercent}%"\n`;
      });
    } else if (activeTab === "brand") {
      csvContent = "Tech Stack Skill,Candidate Volume,Platform Share (%)\n";
      (brandData?.topTechStackDistribution || []).forEach((s) => {
        csvContent += `"${s.skill}","${s.candidateCount}","${s.sharePercent}%"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess(`Exported ${filename} successfully!`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-16 print:p-0 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-indigo-600" />
            4-Pillar Executive Report Generator
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate verifiable analytics for Internal Usage, Investors, College MoUs, and Corporate Brand Sponsors.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={handleExportCsv}
            disabled={loading}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Printer}
            onClick={handlePrint}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            Printable Deck / PDF
          </Button>
        </div>
      </div>

      {/* 4 Pillar Tabs Navigation */}
      <div className="flex border-b border-slate-200 print:hidden overflow-x-auto no-scrollbar">
        {[
          { key: "self", label: "1. Self Usage & Financials", icon: CreditCard },
          { key: "investor", label: "2. Investor Metrics Deck", icon: TrendingUp },
          { key: "college", label: "3. College Partnerships (Zero-PII)", icon: Building2 },
          { key: "brand", label: "4. Brand Collaborations (Zero-PII)", icon: Briefcase }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/40"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: SELF USAGE & FINANCIALS */}
      {activeTab === "self" && (
        <div className="space-y-6">
          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border-slate-200">
              <p className="text-[11px] font-bold uppercase text-slate-500">Gross GMV (Collected)</p>
              <p className="mt-1 text-2xl font-black text-slate-900">
                ₹{(finData?.summary?.grossRevenue || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {finData?.summary?.totalPaidOrders || 0} Total Paid Orders
              </p>
            </Card>

            <Card className="p-4 border-slate-200">
              <p className="text-[11px] font-bold uppercase text-slate-500">Net Platform Revenue</p>
              <p className="mt-1 text-2xl font-black text-emerald-600">
                ₹{(finData?.summary?.netRevenue || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Excludes GST component</p>
            </Card>

            <Card className="p-4 border-slate-200">
              <p className="text-[11px] font-bold uppercase text-slate-500">Total GST Remitted (18%)</p>
              <p className="mt-1 text-2xl font-black text-violet-600">
                ₹{(finData?.summary?.totalGst || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Govt compliance ready</p>
            </Card>

            <Card className="p-4 border-slate-200">
              <p className="text-[11px] font-bold uppercase text-slate-500">Annual Run-Rate (ARR)</p>
              <p className="mt-1 text-2xl font-black text-indigo-600">
                ₹{((subsData?.mrr || 0) * 12).toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                MRR: ₹{(subsData?.mrr || 0).toLocaleString()} / month
              </p>
            </Card>
          </div>

          {/* Plan Distribution & Revenue Streams */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5 border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Subscription Tiers Breakdown</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Free Tier (₹0)", value: subsData?.tiers?.FREE || 0 },
                        { name: "Basic Plan (₹99/mo)", value: subsData?.tiers?.BASIC || 0 },
                        { name: "Premium Plan (₹199/mo)", value: subsData?.tiers?.PREMIUM || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {CHART_COLORS.slice(0, 3).map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 text-xs font-semibold text-slate-600 pt-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-indigo-600" /> Free ({subsData?.tiers?.FREE || 0})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" /> Basic ({subsData?.tiers?.BASIC || 0})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500" /> Premium ({subsData?.tiers?.PREMIUM || 0})
                </span>
              </div>
            </Card>

            <Card className="p-5 border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Revenue by Product Stream</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { category: "Subscriptions", amount: finData?.summary?.revenueByType?.SUBSCRIPTION || 0 },
                      { category: "GD Power-Ups", amount: finData?.summary?.revenueByType?.GD_POWERUP || 0 },
                      { category: "Mock Minutes", amount: finData?.summary?.revenueByType?.MOCK_MINUTES || 0 },
                      { category: "Contest Passes", amount: finData?.summary?.revenueByType?.CONTEST_PASS || 0 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="category" textAnchor="end" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => `₹${value}`} />
                    <Bar dataKey="amount" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Transactions Ledger Table */}
          <Card className="p-5 border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Live Order & Tax Records</h3>
            {loading ? (
              <TableSkeleton rows={5} columns={5} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Order ID</th>
                      <th className="py-2.5 px-3">Product Item</th>
                      <th className="py-2.5 px-3">Gross Amount</th>
                      <th className="py-2.5 px-3">GST (18%)</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(finData?.transactions || []).map((t, idx) => (
                      <tr key={t.orderId || idx} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                          {t.orderId}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-700">
                          {t.orderType || t.type || "PLAN_SUBSCRIPTION"}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          ₹{t.totalAmount || t.amount || 0}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          ₹{t.gstAmount || Math.round((t.totalAmount || t.amount || 0) * 0.18 / 1.18)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {new Date(t.createdAt || Date.now()).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                            PAID
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: INVESTOR METRICS DECK */}
      {activeTab === "investor" && (
        <div className="space-y-6">
          {/* Deck Headline Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white shadow-xl">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-[10px] uppercase tracking-wider border border-indigo-400/30">
              Venture Capital & Angel Investor Fact Sheet
            </span>
            <h2 className="text-xl sm:text-2xl font-black mt-2">
              Flash B2C SaaS Economics & Cohort Retention
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Audited performance metrics tailored for institutional investors: unit economics, viral campus adoption, and student preparation engagement depth.
            </p>
          </div>

          {/* Unit Economics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Blended ARPU", val: investorData?.headlineMetrics?.blendedArpu || "—" },
              { label: "Est. CAC", val: investorData?.headlineMetrics?.estimatedCac || "—" },
              { label: "Customer LTV", val: investorData?.headlineMetrics?.customerLifetimeValue || "—" },
              { label: "LTV / CAC Ratio", val: investorData?.headlineMetrics?.ltvToCac || "—" },
              { label: "Gross Margin", val: investorData?.headlineMetrics?.grossMargin || "—" },
              { label: "DAU / MAU Ratio", val: investorData?.headlineMetrics?.dauMauRatio || "—" }
            ].map((item, idx) => (
              <Card key={idx} className="p-4 border-slate-200">
                <p className="text-[10px] font-bold uppercase text-slate-500">{item.label}</p>
                <p className="text-xl font-black text-slate-900 mt-1">{item.val}</p>
              </Card>
            ))}
          </div>

          {/* Growth & Engagement Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Traction & Cohort Concentration
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <span className="text-slate-600">Weekly Organic Growth Rate:</span>
                  <span className="font-black text-emerald-600">
                    {investorData?.traction?.weeklyGrowthRate || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <span className="text-slate-600">Batch of 2028 Concentration:</span>
                  <span className="font-black text-indigo-600">
                    {investorData?.traction?.targetBatch2028Concentration || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <span className="text-slate-600">Paid Conversion Rate:</span>
                  <span className="font-black text-slate-900">
                    {investorData?.headlineMetrics?.payingConversionRate || "0%"}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-5 border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-amber-500" />
                Practice Platform Engagement Depth
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <span className="text-slate-600">Total Practice Problems Attempted:</span>
                  <span className="font-black text-slate-900">
                    {(investorData?.engagementDepth?.totalQuestionsSolved || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <span className="text-slate-600">Average Session Length:</span>
                  <span className="font-black text-violet-600">
                    {investorData?.engagementDepth?.averageSessionLengthMins || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <span className="text-slate-600">Avg Problems Per Active Student:</span>
                  <span className="font-black text-slate-900">
                    {investorData?.engagementDepth?.avgQuestionsPerActiveUser || 0}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: FUTURE COLLEGE PARTNERSHIPS (ZERO-PII) */}
      {activeTab === "college" && (
        <div className="space-y-6">
          {/* Privacy Charter Notice Banner */}
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-start gap-3">
            <Lock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-black uppercase tracking-wider text-indigo-950">
                Strict Zero-PII Privacy Charter
              </p>
              <p className="mt-0.5 text-indigo-800 leading-relaxed">
                Handwritten Specification Requirement: <em>"Any details will never contain any private data of the student on the platform. Just the figure."</em>
                Only aggregated demographic counts and campus average readiness benchmarks are published.
              </p>
            </div>
          </div>

          {/* Ecosystem Benchmarks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 border-slate-200">
              <p className="text-[11px] font-bold uppercase text-slate-500">DSA Pass Rate</p>
              <p className="mt-1 text-2xl font-black text-emerald-600">
                {collegeData?.ecosystemBenchmark?.benchmarkSkills?.dsaExecutionPassRate || "—"}
              </p>
            </Card>
            <Card className="p-4 border-slate-200">
              <p className="text-[11px] font-bold uppercase text-slate-500">Aptitude Accuracy</p>
              <p className="mt-1 text-2xl font-black text-indigo-600">
                {collegeData?.ecosystemBenchmark?.benchmarkSkills?.aptitudeAccuracy || "—"}
              </p>
            </Card>
            <Card className="p-4 border-slate-200">
              <p className="text-[11px] font-bold uppercase text-slate-500">Mock Interview Score</p>
              <p className="mt-1 text-2xl font-black text-amber-600">
                {collegeData?.ecosystemBenchmark?.benchmarkSkills?.mockInterviewStarRating || "—"}
              </p>
            </Card>
            <Card className="p-4 border-slate-200">
              <p className="text-[11px] font-bold uppercase text-slate-500">ATS Resume Match</p>
              <p className="mt-1 text-2xl font-black text-violet-600">
                {collegeData?.ecosystemBenchmark?.benchmarkSkills?.atsResumeMatchAverage || "—"}
              </p>
            </Card>
          </div>

          {/* College Cohort Table */}
          <Card className="p-5 border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              College Enrolment & Readiness Figures
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Institution Name</th>
                    <th className="py-2.5 px-3">Enrolled Figures</th>
                    <th className="py-2.5 px-3">Average Readiness</th>
                    <th className="py-2.5 px-3">Technical Ratio</th>
                    <th className="py-2.5 px-3">Target Batches</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(collegeData?.collegeCohorts || []).map((c, idx) => (
                    <tr key={c.collegeName || idx} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-bold text-slate-800">
                        {c.collegeName}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {c.studentCount} Students
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                          {c.avgReadinessScore}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {c.technicalRatioPercent}% Engineering
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {(c.batchDistribution || ["2028"]).join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: FUTURE BRAND COLLABORATIONS (ZERO-PII) */}
      {activeTab === "brand" && (
        <div className="space-y-6">
          {/* Privacy Notice Banner */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-black uppercase tracking-wider text-amber-950">
                Corporate Sponsorship & Brand Partnership Charter
              </p>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                Handwritten Specification Requirement: <em>"What our platform can offer. Again only figures, no private/personal data shared."</em>
              </p>
            </div>
          </div>

          {/* Demographic Reach Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 border-slate-200">
              <p className="text-[11px] font-bold uppercase text-slate-500">Total Verified Reach</p>
              <p className="mt-1 text-2xl font-black text-slate-900">
                {(brandData?.totalVerifiedCandidates || 0).toLocaleString()} Candidates
              </p>
              <p className="text-[11px] text-slate-400 mt-1">High-intent pre-placement engineers</p>
            </Card>

            <Card className="p-4 border-slate-200">
              <p className="text-[11px] font-bold uppercase text-slate-500">Primary Audience</p>
              <p className="mt-1 text-xl font-black text-indigo-600">
                Batch of 2028 & 2027
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Ready for 2026/27 intern & FTE hiring</p>
            </Card>

            <Card className="p-4 border-slate-200">
              <p className="text-[11px] font-bold uppercase text-slate-500">Talent Authenticity</p>
              <p className="mt-1 text-xl font-black text-emerald-600">
                100% Organic Prep
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Direct algorithmic code validation</p>
            </Card>
          </div>

          {/* Tech Stack Distribution */}
          <Card className="p-5 border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Candidate Tech Stack Skill Share
            </h3>
            <div className="space-y-3">
              {(brandData?.topTechStackDistribution || []).map((skill, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-800">{skill.skill}</span>
                    <span className="text-indigo-600">{skill.candidateCount} Students ({skill.sharePercent}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${skill.sharePercent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Sponsor Offerings */}
          <Card className="p-5 border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Platform Offerings for Corporate Partners
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(brandData?.platformOfferingsForBrands || []).map((offering, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="font-semibold text-slate-800">{offering}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
