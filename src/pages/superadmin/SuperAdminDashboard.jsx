import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Users,
  Trophy,
  MessageSquare,
  BookOpen,
  ArrowRight,
  Sparkles,
  RefreshCw,
  CreditCard,
  TrendingUp,
  FileText,
  Building2,
  Calendar,
  CheckCircle2,
  Lock,
  Plus
} from "lucide-react";
import { adminService } from "../../services/adminService";
import { useNotifications } from "../../context/NotificationContext";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { StatCard } from "../../components/common/StatCard";
import { TableSkeleton } from "../../components/common/LoadingSkeleton";

export function SuperAdminDashboard() {
  const { showError, showSuccess } = useNotifications();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalStudents: 0,
    batch2028Count: 0,
    batch2028Percent: 0,
    subscribers: { free: 0, basic: 0, premium: 0, totalPaid: 0 },
    financials: { totalGmv: 0, netRevenue: 0, totalGst: 0, mrrEstimate: 0, paidTransactionsCount: 0 },
    operations: { activeContests: 0, upcomingContests: 0, totalGdRooms: 0, activeGdRooms: 0 },
    recentTransactions: [],
    topColleges: []
  });

  const loadOverview = async () => {
    try {
      setLoading(true);
      const res = await adminService.getOverview();
      if (res.success && res.stats) {
        setData(res.stats);
      }
    } catch (err) {
      console.error("Failed to load superadmin overview:", err);
      showError("Could not connect to B2C Command Center backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-2xl border border-indigo-900/40">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Flash B2C Platform Master Command Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Root Super Administrator Console
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Live governance for universal Contests, Group Discussion Arenas, Question Banks, and 4-Pillar Investor & Partnership Reports with strict Zero-PII privacy.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={loadOverview}
              loading={loading}
              className="border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800"
            >
              Refresh Telemetry
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={FileText}
              onClick={() => navigate("/super-admin/reports")}
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
            >
              4-Pillar Reports
            </Button>
          </div>
        </div>
      </div>

      {/* Primary Pulse KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <StatCard
          title="Total Registered Students"
          value={data.totalStudents.toLocaleString()}
          subtitle={`${data.batch2028Percent}% Batch 2028 Target Cohort`}
          icon={Users}
          iconBg="bg-indigo-50 text-indigo-600"
          trend={{
            value: `${data.batch2028Count} in '28`,
            direction: "up",
            label: "Core audience"
          }}
        />

        {/* Paid Subscribers */}
        <StatCard
          title="Active Paid Subscribers"
          value={data.subscribers.totalPaid.toLocaleString()}
          subtitle={`Basic: ${data.subscribers.basic} | Premium: ${data.subscribers.premium}`}
          icon={CreditCard}
          iconBg="bg-emerald-50 text-emerald-600"
          trend={{
            value: data.totalStudents > 0 ? `${((data.subscribers.totalPaid / data.totalStudents) * 100).toFixed(1)}%` : "0%",
            direction: "up",
            label: "Conversion rate"
          }}
        />

        {/* Platform Gross Revenue */}
        <StatCard
          title="Gross Revenue (GMV)"
          value={`₹${(data.financials.totalGmv || 0).toLocaleString()}`}
          subtitle={`Net: ₹${data.financials.netRevenue.toLocaleString()} | GST: ₹${data.financials.totalGst.toLocaleString()}`}
          icon={TrendingUp}
          iconBg="bg-violet-50 text-violet-600"
          trend={{
            value: `₹${data.financials.mrrEstimate}/mo`,
            direction: "up",
            label: "Estimated MRR"
          }}
        />

        {/* Global Competitions & GD */}
        <StatCard
          title="Live Arena Operations"
          value={`${data.operations.activeContests} Contests`}
          subtitle={`${data.operations.activeGdRooms} Active GD Rooms (${data.operations.totalGdRooms} Total)`}
          icon={Trophy}
          iconBg="bg-amber-50 text-amber-600"
          trend={{
            value: `${data.operations.upcomingContests} Scheduled`,
            direction: "neutral",
            label: "Upcoming"
          }}
        />
      </div>

      {/* Quick Launchpad Strip */}
      <Card className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Direct Administrator Actions
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Instantly broadcast challenges, initialize official GD arenas, or audit curriculum
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              size="sm"
              icon={Plus}
              onClick={() => navigate("/super-admin/contests?action=new")}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
            >
              Launch Global Contest
            </Button>
            <Button
              size="sm"
              icon={MessageSquare}
              onClick={() => navigate("/super-admin/gd?action=new")}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
            >
              Schedule Official GD
            </Button>
            <Button
              size="sm"
              icon={BookOpen}
              onClick={() => navigate("/super-admin/questions?action=new")}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs"
            >
              Add Question
            </Button>
            <Button
              size="sm"
              variant="outline"
              icon={FileText}
              onClick={() => navigate("/super-admin/reports")}
              className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs"
            >
              Export Pitch Decks
            </Button>
          </div>
        </div>
      </Card>

      {/* Two-Column Telemetry: Top Colleges vs Recent Financial Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pillar 3 Preview: Top College Cohorts (Strict Zero-PII) */}
        <Card className="p-5 border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Top College Cohorts</h3>
                  <p className="text-[11px] text-slate-500">Zero-PII aggregated readiness benchmarking</p>
                </div>
              </div>
              <Badge variant="indigo" size="sm">Strict Privacy</Badge>
            </div>

            <div className="mt-4 space-y-3">
              {loading ? (
                <TableSkeleton rows={4} columns={3} />
              ) : data.topColleges && data.topColleges.length > 0 ? (
                data.topColleges.map((college, idx) => (
                  <div
                    key={college.collegeName || idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-100"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate" title={college.collegeName}>
                          {college.collegeName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {college.studentCount} student{college.studentCount > 1 ? "s" : ""} enrolled
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {college.avgReadiness}% Readiness
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  No college cohort data aggregated yet.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => navigate("/super-admin/reports?tab=college")}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              Generate Full College Partnership Deck <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>

        {/* Pillar 1 Preview: Recent Financial Stream */}
        <Card className="p-5 border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Recent Revenue Stream</h3>
                  <p className="text-[11px] text-slate-500">Verified Razorpay subscription & power-up transactions</p>
                </div>
              </div>
              <Badge variant="emerald" size="sm">Real-Time</Badge>
            </div>

            <div className="mt-4 space-y-2.5">
              {loading ? (
                <TableSkeleton rows={4} columns={3} />
              ) : data.recentTransactions && data.recentTransactions.length > 0 ? (
                data.recentTransactions.map((tx, idx) => (
                  <div
                    key={tx.orderId || idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 truncate">
                          {tx.type || tx.orderType || "PLAN_SUBSCRIPTION"}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {tx.orderId?.slice(-8) || "TX"}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(tx.createdAt || Date.now()).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-black text-slate-900">
                        ₹{(tx.totalAmount || tx.amount || 0).toLocaleString()}
                      </span>
                      <div className="text-[10px] font-semibold text-emerald-600">
                        PAID / VERIFIED
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  No recent transactions recorded yet.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => navigate("/super-admin/reports?tab=self")}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              Open Complete Financial Ledger & Tax Records <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>
      </div>

      {/* Operations Quick Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => navigate("/super-admin/contests")}
          className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white border border-amber-200/80 cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
              <Trophy className="w-6 h-6" />
            </div>
            <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
          </div>
          <h4 className="mt-4 text-base font-bold text-slate-900">Contests & Global Assessments</h4>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Manage university hackathons, aptitude sprints, and competitive coding rounds broadcasted to every student.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs font-bold text-amber-700">
            <span>{data.operations.activeContests} Live Now</span>
            <span>•</span>
            <span>{data.operations.upcomingContests} Scheduled</span>
          </div>
        </div>

        <div
          onClick={() => navigate("/super-admin/gd")}
          className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-white border border-indigo-200/80 cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <MessageSquare className="w-6 h-6" />
            </div>
            <ArrowRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition-transform" />
          </div>
          <h4 className="mt-4 text-base font-bold text-slate-900">Group Discussion (GD Arena)</h4>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Schedule official 15-minute group discussion sessions, manage concurrency locks, and monitor active candidate rooms.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs font-bold text-indigo-700">
            <span>{data.operations.activeGdRooms} Active Rooms</span>
            <span>•</span>
            <span>{data.operations.totalGdRooms} Total Sessions</span>
          </div>
        </div>
      </div>
    </div>
  );
}
