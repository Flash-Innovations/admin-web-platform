import React, { useState, useEffect } from "react";
import {
  Swords,
  Trophy,
  Users,
  Shield,
  Play,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Search,
  Code2,
  Filter
} from "lucide-react";
import arenaAdminService from "../../services/arenaAdminService";
import { useNotifications } from "../../context/NotificationContext";

export function TournamentAdminPage() {
  const { addNotification } = useNotifications();

  const [overview, setOverview] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWaveRound, setSelectedWaveRound] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Bracket Generation state
  const [generatingBracket, setGeneratingBracket] = useState(false);
  const [showSeedModal, setShowSeedModal] = useState(false);

  // Spectator God Mode Modal
  const [spectatingMatch, setSpectatingMatch] = useState(null);
  const [spectatingDetails, setSpectatingDetails] = useState(null);
  const [spectateLoading, setSpectateLoading] = useState(false);
  const [overrideLoading, setOverrideLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewRes, matchesRes] = await Promise.allSettled([
        arenaAdminService.getTournamentOverview(),
        arenaAdminService.getAllMatches({ roundNumber: selectedWaveRound })
      ]);

      if (overviewRes.status === "fulfilled" && overviewRes.value?.success) {
        setOverview(overviewRes.value.tournament);
      }
      if (matchesRes.status === "fulfilled" && matchesRes.value?.success) {
        setMatches(matchesRes.value.matches || []);
      }
    } catch (err) {
      addNotification("error", err.message || "Failed to load tournament data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 8000);
    return () => clearInterval(interval);
  }, [selectedWaveRound]);

  const handleGenerateBracket = async () => {
    try {
      setGeneratingBracket(true);
      const res = await arenaAdminService.generateKnockoutBracket();
      if (res.success) {
        addNotification("success", res.message || "Bracket successfully seeded!");
        setShowSeedModal(false);
        await fetchDashboardData();
      }
    } catch (err) {
      addNotification("error", err.message || "Failed to generate bracket.");
    } finally {
      setGeneratingBracket(false);
    }
  };

  const handleOpenSpectator = async (match) => {
    setSpectatingMatch(match);
    setSpectateLoading(true);
    try {
      const res = await arenaAdminService.getMatchDetails(match.roomCode);
      if (res.success) {
        setSpectatingDetails(res);
      }
    } catch (err) {
      addNotification("error", "Failed to load live match telemetry.");
    } finally {
      setSpectateLoading(false);
    }
  };

  const handleForceResolve = async (winnerSlot, winReason) => {
    if (!spectatingMatch) return;
    try {
      setOverrideLoading(true);
      const res = await arenaAdminService.forceResolveMatch({
        roomCode: spectatingMatch.roomCode,
        winnerSlot,
        winReason
      });
      if (res.success) {
        addNotification("success", res.message || "Match winner declared.");
        setSpectatingMatch(null);
        setSpectatingDetails(null);
        await fetchDashboardData();
      }
    } catch (err) {
      addNotification("error", err.message || "Failed to resolve match.");
    } finally {
      setOverrideLoading(false);
    }
  };

  const filteredMatches = matches.filter((m) => {
    const matchesStatus = statusFilter === "ALL" || m.status === statusFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      m.roomCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.player1?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.player2?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-mono text-indigo-400 mb-2">
            <Swords className="w-3.5 h-3.5" />
            SuperAdmin Esports Governance Deck
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            1v1 Battle Arena & Tournament Command
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time wave monitor, God-Mode match spectating, and power-of-two bracket generator.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSeedModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Seed Knockout Tree</span>
          </button>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>TOURNAMENT STAGE</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-black text-white uppercase">
            {overview?.currentStage?.replace(/_/g, " ") || "REGISTRATION"}
          </div>
          <span className="text-[11px] text-emerald-400 font-mono">
            {overview?.registrationOpen ? "Registration Open" : "Registration Closed"}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>REGISTERED CANDIDATES</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {overview?.totalRegisteredCount || 0}
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Top Qualifiers Seed into Tree</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>BRACKET CAPACITY (K)</span>
            <Shield className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {overview?.knockoutBracketSize || 512}
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {(overview?.knockoutBracketSize || 512) - 1} Total Knockout Matches
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>WAVE 1 ROUND</span>
            <Play className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {matches.filter((m) => m.status === "IN_PROGRESS").length} Active
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {matches.length} Matches in Selected Round
          </span>
        </div>
      </div>

      {/* Wave Round Selector & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Round Buttons */}
          <div className="flex flex-wrap gap-2">
            {[
              { r: 1, name: "Round 1 (R512)" },
              { r: 2, name: "Round 2 (R256)" },
              { r: 3, name: "Round 3 (R128)" },
              { r: 4, name: "Super 64" },
              { r: 5, name: "Sweet 16" },
              { r: 6, name: "Quarter-Finals" },
              { r: 7, name: "Semi-Finals" },
              { r: 8, name: "Grand Finals" }
            ].map((round) => (
              <button
                key={round.r}
                onClick={() => setSelectedWaveRound(round.r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  selectedWaveRound === round.r
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {round.name}
              </button>
            ))}
          </div>

          {/* Search & Status Filter */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search Room or Player..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="CHECKIN_OPEN">Check-in Open</option>
              <option value="COMPLETED">Completed</option>
              <option value="WALKOVER">Walkover</option>
            </select>
          </div>
        </div>

        {/* Live Match Wave Grid */}
        {filteredMatches.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
            <Swords className="w-8 h-8 mx-auto text-slate-600" />
            <h3 className="text-base font-bold text-white">No Matches Found in Selected Wave</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Knockout matches appear here once the Day 1 Qualifying Quiz finishes and you click "Seed Knockout Tree".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMatches.map((m) => {
              const p1 = m.player1 || {};
              const p2 = m.player2 || {};
              const hasCheatWarning = (p1.tabBlurCount || 0) > 2 || (p2.tabBlurCount || 0) > 2;

              return (
                <div
                  key={m.roomCode}
                  className={`p-5 rounded-2xl bg-slate-900 border space-y-4 transition-all shadow-md ${
                    m.status === "IN_PROGRESS"
                      ? "border-indigo-500/50 shadow-indigo-600/10"
                      : "border-slate-800"
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-indigo-400">{m.roomCode}</span>
                    <div className="flex items-center gap-1.5">
                      {hasCheatWarning && (
                        <span
                          title="Suspicious tab switching detected"
                          className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-400 font-bold flex items-center gap-1"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          <span>Blur Alert</span>
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          m.status === "IN_PROGRESS"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse"
                            : m.status === "COMPLETED"
                            ? "bg-slate-800 text-slate-400"
                            : "bg-indigo-500/10 text-indigo-300"
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                  </div>

                  {/* Competitors VS Bar */}
                  <div className="space-y-2 text-xs">
                    {/* Player 1 */}
                    <div
                      className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        m.winnerId && m.winnerId.toString() === p1.userId?.toString()
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-bold"
                          : "bg-slate-950/70 border-slate-800 text-slate-300"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span>{p1.name || "TBD (Slot 1)"}</span>
                        <span className="block text-[10px] text-slate-500 truncate">
                          {p1.collegeName || "Candidate"}
                        </span>
                      </div>
                      <div className="text-right font-mono text-[11px] shrink-0">
                        <span className="text-indigo-400 font-bold">
                          {p1.testCasesPassed || 0}/{p1.totalTestCases || 5}
                        </span>
                        {p1.tabBlurCount > 0 && (
                          <span className="block text-[9px] text-red-400">
                            {p1.tabBlurCount} Blurs
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Player 2 */}
                    <div
                      className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        m.winnerId && m.winnerId.toString() === p2.userId?.toString()
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-bold"
                          : "bg-slate-950/70 border-slate-800 text-slate-300"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span>{p2.name || "TBD (Slot 2)"}</span>
                        <span className="block text-[10px] text-slate-500 truncate">
                          {p2.collegeName || "Candidate"}
                        </span>
                      </div>
                      <div className="text-right font-mono text-[11px] shrink-0">
                        <span className="text-violet-400 font-bold">
                          {p2.testCasesPassed || 0}/{p2.totalTestCases || 5}
                        </span>
                        {p2.tabBlurCount > 0 && (
                          <span className="block text-[9px] text-red-400">
                            {p2.tabBlurCount} Blurs
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-2 border-t border-slate-800 flex gap-2">
                    <button
                      onClick={() => handleOpenSpectator(m)}
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-indigo-300 text-xs font-bold font-mono flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Spectate God Mode</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Seed Knockout Bracket Modal */}
      {showSeedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Seed Knockout Bracket Tree</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                This will rank all Day 1 qualifying quiz participants by Score and Time, take the Top{" "}
                <strong className="text-white">{overview?.knockoutBracketSize || 512}</strong>, and
                generate standard power-of-two pairings (Seed 1 faces Seed 512).
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-mono">
              Action cannot be undone once round 1 matches start.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSeedModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateBracket}
                disabled={generatingBracket}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                {generatingBracket ? "Seeding Bracket..." : "Confirm & Seed"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spectator God Mode Modal */}
      {spectatingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>God Mode Spectator</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {spectatingMatch.roomCode}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Challenge: {spectatingMatch.problemTitle || "Algorithmic Duel"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSpectatingMatch(null);
                  setSpectatingDetails(null);
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Split Screen Competitors Deck */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {spectateLoading ? (
                <div className="py-20 text-center font-mono text-xs text-slate-400">
                  Connecting to live match socket...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Player 1 Console */}
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold">
                          Player 1 (Seed #1)
                        </span>
                        <h4 className="text-sm font-bold text-white">
                          {spectatingMatch.player1?.name || "Player 1"}
                        </h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {spectatingMatch.player1?.testCasesPassed || 0}/5 Tests
                      </span>
                    </div>

                    <div className="text-xs font-mono text-slate-400 space-y-1">
                      <div>College: {spectatingMatch.player1?.collegeName || "N/A"}</div>
                      <div>Tab Blur Count: {spectatingMatch.player1?.tabBlurCount || 0}</div>
                    </div>

                    {/* Code Snippet Box */}
                    <div className="pt-2">
                      <label className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                        Active Solution Code ({spectatingMatch.player1?.language || "python"})
                      </label>
                      <pre className="p-3 rounded-xl bg-slate-900 border border-slate-850 text-xs font-mono text-slate-300 overflow-x-auto max-h-48">
                        {spectatingMatch.player1?.code || "// No code submitted yet"}
                      </pre>
                    </div>

                    {/* Admin Override Action */}
                    <button
                      onClick={() => handleForceResolve("player1", "WALKOVER")}
                      disabled={overrideLoading}
                      className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Declare Winner: Player 1
                    </button>
                  </div>

                  {/* Player 2 Console */}
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] font-mono text-violet-400 uppercase font-bold">
                          Player 2 (Seed #512)
                        </span>
                        <h4 className="text-sm font-bold text-white">
                          {spectatingMatch.player2?.name || "Player 2"}
                        </h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-violet-400">
                        {spectatingMatch.player2?.testCasesPassed || 0}/5 Tests
                      </span>
                    </div>

                    <div className="text-xs font-mono text-slate-400 space-y-1">
                      <div>College: {spectatingMatch.player2?.collegeName || "N/A"}</div>
                      <div>Tab Blur Count: {spectatingMatch.player2?.tabBlurCount || 0}</div>
                    </div>

                    {/* Code Snippet Box */}
                    <div className="pt-2">
                      <label className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                        Active Solution Code ({spectatingMatch.player2?.language || "python"})
                      </label>
                      <pre className="p-3 rounded-xl bg-slate-900 border border-slate-850 text-xs font-mono text-slate-300 overflow-x-auto max-h-48">
                        {spectatingMatch.player2?.code || "// No code submitted yet"}
                      </pre>
                    </div>

                    {/* Admin Override Action */}
                    <button
                      onClick={() => handleForceResolve("player2", "WALKOVER")}
                      disabled={overrideLoading}
                      className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Declare Winner: Player 2
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                onClick={() => {
                  setSpectatingMatch(null);
                  setSpectatingDetails(null);
                }}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs"
              >
                Close Spectator View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TournamentAdminPage;
