import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  MessageSquare,
  Plus,
  Search,
  Users,
  Clock,
  Sparkles,
  Calendar,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Layers,
  Radio,
  Trash2,
  StopCircle,
  Eye,
  RefreshCw,
  AlertTriangle,
  UserCheck
} from "lucide-react";
import { adminService } from "../../services/adminService";
import { useNotifications } from "../../context/NotificationContext";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { TableSkeleton } from "../../components/common/LoadingSkeleton";

export function GdAdminPage() {
  const { showSuccess, showError } = useNotifications();
  const [searchParams] = useSearchParams();
  const shouldOpenNew = searchParams.get("action") === "new";

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [search, setSearch] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(shouldOpenNew);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Inspector & Terminate Modal State
  const [inspectingRoom, setInspectingRoom] = useState(null);
  const [terminateConfirmRoom, setTerminateConfirmRoom] = useState(null);

  // Form State
  const [formTopic, setFormTopic] = useState("");
  const [formCategory, setFormCategory] = useState("TECH");
  const [formScheduledAt, setFormScheduledAt] = useState("");
  const [formMaxParticipants, setFormMaxParticipants] = useState(6);
  const [formMinTier, setFormMinTier] = useState("ALL");

  const loadRooms = async () => {
    try {
      setLoading(true);
      const res = await adminService.listGdRooms();
      if (res && res.rooms) {
        setRooms(res.rooms);
      }
    } catch (err) {
      console.error("Failed to load GD rooms:", err);
      showError("Could not retrieve GD room telemetry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const handleCreateOfficialRoom = async (e) => {
    e.preventDefault();
    if (!formTopic.trim()) {
      showError("Please enter a discussion topic");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        topic: formTopic.trim(),
        category: formCategory,
        scheduledAt: formScheduledAt ? new Date(formScheduledAt).toISOString() : new Date().toISOString(),
        maxParticipants: parseInt(formMaxParticipants, 10) || 6,
        minTier: formMinTier
      };

      const res = await adminService.createOfficialGdRoom(payload);
      if (res && (res.success || res.room)) {
        showSuccess("Official GD session scheduled and published to the student arena!");
        setIsModalOpen(false);
        setFormTopic("");
        setFormScheduledAt("");
        loadRooms();
      }
    } catch (err) {
      console.error("GD room creation error:", err);
      showError(err.message || "Failed to create official GD room");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTerminateRoom = async (roomId) => {
    try {
      setActionLoadingId(roomId);
      const res = await adminService.terminateGdRoom(roomId);
      showSuccess(res?.message || "GD Room terminated and concluded successfully!");
      setTerminateConfirmRoom(null);
      if (inspectingRoom && (inspectingRoom._id === roomId || inspectingRoom.roomId === roomId)) {
        setInspectingRoom(null);
      }
      loadRooms();
    } catch (err) {
      showError(err.message || "Failed to terminate GD room");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    try {
      setActionLoadingId(roomId);
      await adminService.deleteGdRoom(roomId);
      showSuccess("GD Room removed from records.");
      loadRooms();
    } catch (err) {
      showError(err.message || "Failed to delete GD room");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredRooms = rooms.filter((r) => {
    const st = (r.status || "").toUpperCase();
    if (filterStatus === "ACTIVE" && st !== "ACTIVE") return false;
    if (filterStatus === "WAITING" && st !== "WAITING" && st !== "OPEN") return false;
    if (filterStatus === "CONCLUDED" && st !== "CONCLUDED" && st !== "COMPLETED") return false;
    if (search && !r.topic.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeCount = rooms.filter((r) => (r.status || "").toUpperCase() === "ACTIVE").length;
  const waitingCount = rooms.filter((r) => {
    const s = (r.status || "").toUpperCase();
    return s === "WAITING" || s === "OPEN";
  }).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <MessageSquare className="w-7 h-7 text-indigo-600" />
            Group Discussion (GD Arena) Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Govern multi-peer GD rooms, schedule official mock GDs, monitor concurrency locks, and moderate live sessions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={loadRooms}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
          >
            Schedule Official GD
          </Button>
        </div>
      </div>

      {/* GD Arena Pulse Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200">
          <p className="text-[11px] font-bold uppercase text-slate-500">Live Active Rooms</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{activeCount}</span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse" /> Live
            </span>
          </div>
        </Card>

        <Card className="p-4 border-slate-200">
          <p className="text-[11px] font-bold uppercase text-slate-500">Waiting for Peers</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-600">{waitingCount}</span>
            <span className="text-xs text-slate-400">Lobbies open</span>
          </div>
        </Card>

        <Card className="p-4 border-slate-200">
          <p className="text-[11px] font-bold uppercase text-slate-500">Total Rooms Run</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{rooms.length}</span>
            <span className="text-xs text-slate-400">Recorded sessions</span>
          </div>
        </Card>

        <Card className="p-4 border-slate-200">
          <p className="text-[11px] font-bold uppercase text-slate-500">Session Policy</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-800">15 Mins / Max 8</span>
          </div>
        </Card>
      </div>

      {/* Control Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search GD topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "ACTIVE", "WAITING", "CONCLUDED"].map((st) => (
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

      {/* Rooms Grid */}
      {loading ? (
        <TableSkeleton rows={4} columns={3} />
      ) : filteredRooms.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-slate-200">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No GD Rooms Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || filterStatus !== "ALL"
              ? "No discussions match your filter."
              : "No group discussion sessions currently in progress. Schedule an official session to start peer debates!"}
          </p>
          <Button
            size="sm"
            icon={Plus}
            onClick={() => setIsModalOpen(true)}
            className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            Schedule Official GD
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRooms.map((r) => {
            const rawStatus = (r.status || "").toUpperCase();
            const isActive = rawStatus === "ACTIVE";
            const isWaiting = rawStatus === "WAITING" || rawStatus === "OPEN";
            const isConcluded = rawStatus === "CONCLUDED" || rawStatus === "COMPLETED";
            const participantsCount = Array.isArray(r.participants) ? r.participants.length : 0;
            const maxPart = r.maxParticipants || 6;
            const roomId = r._id || r.id || r.roomId;

            return (
              <Card
                key={roomId}
                className="p-5 flex flex-col justify-between border-slate-200 shadow-xs hover:shadow-md transition-all relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge
                      variant={isActive ? "emerald" : isWaiting ? "indigo" : "slate"}
                      size="sm"
                    >
                      {isActive ? "LIVE ARENA" : isWaiting ? "LOBBY OPEN" : "CONCLUDED"}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      {r.isOfficial && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200">
                          OFFICIAL
                        </span>
                      )}
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {r.category || "TECH"}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                    {r.topic}
                  </h3>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Users className="w-3.5 h-3.5" /> Participants:
                      </span>
                      <span className="font-bold text-slate-900">
                        {participantsCount} / {maxPart}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="w-3.5 h-3.5" /> Duration Policy:
                      </span>
                      <span className="font-semibold text-slate-700">
                        {r.durationMinutes || 15} Minutes Max
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Lock className="w-3.5 h-3.5" /> Tier Access:
                      </span>
                      <span className="font-semibold text-indigo-600">
                        {r.minTier === "ALL" ? "All Plans" : `${r.minTier}+`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer with Moderation Controls */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
                    <span>Room: #{String(roomId || "").slice(-6)}</span>
                    <span>
                      {new Date(r.createdAt || Date.now()).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setInspectingRoom(r)}
                      className="flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      Inspect
                    </button>

                    {(isActive || isWaiting) && (
                      <button
                        onClick={() => setTerminateConfirmRoom(r)}
                        disabled={actionLoadingId === roomId}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Force Conclude Room"
                      >
                        <StopCircle className="w-3.5 h-3.5" />
                        Conclude
                      </button>
                    )}

                    {isConcluded && (
                      <button
                        onClick={() => handleDeleteRoom(roomId)}
                        disabled={actionLoadingId === roomId}
                        className="p-1.5 text-xs rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Room Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Room Inspector Modal */}
      {inspectingRoom && (
        <Modal
          isOpen={Boolean(inspectingRoom)}
          onClose={() => setInspectingRoom(null)}
          title="Group Discussion Room Telemetry"
          subtitle={`Room ID: #${String(inspectingRoom._id || inspectingRoom.roomId || "").slice(-8)}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500 uppercase">Topic:</span>
                <span className="font-black text-slate-900 text-sm max-w-md text-right">
                  {inspectingRoom.topic}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500 uppercase">Status:</span>
                <Badge variant={inspectingRoom.status === "ACTIVE" ? "emerald" : "indigo"}>
                  {inspectingRoom.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500 uppercase">Host:</span>
                <span className="font-mono text-slate-700">
                  {inspectingRoom.hostName || inspectingRoom.hostId || "System"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500 uppercase">Created At:</span>
                <span className="text-slate-700">
                  {new Date(inspectingRoom.createdAt || Date.now()).toLocaleString()}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                Active Participants ({Array.isArray(inspectingRoom.participants) ? inspectingRoom.participants.length : 0} / {inspectingRoom.maxParticipants || 6})
              </h4>

              {Array.isArray(inspectingRoom.participants) && inspectingRoom.participants.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {inspectingRoom.participants.map((p, idx) => (
                    <div
                      key={p.userId || p.id || idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                          {p.name ? p.name[0] : String(idx + 1)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{p.name || p.userName || "Candidate"}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{p.userId || "Student"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Connected
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No active student participants currently in room lobby.
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
              <div>
                {inspectingRoom.status !== "CONCLUDED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTerminateConfirmRoom(inspectingRoom);
                    }}
                    className="border-rose-200 text-rose-600 hover:bg-rose-50"
                  >
                    Force Conclude Room
                  </Button>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectingRoom(null)}
              >
                Close Inspector
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Force Conclude Confirmation Modal */}
      {terminateConfirmRoom && (
        <Modal
          isOpen={Boolean(terminateConfirmRoom)}
          onClose={() => setTerminateConfirmRoom(null)}
          title="Force Conclude GD Arena Room?"
          subtitle="This will immediately end the session and release candidate concurrency locks."
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                All connected participants will receive a session termination event and their discussion state will be saved.
              </span>
            </div>

            <p className="text-xs font-semibold text-slate-700">
              Topic: <span className="font-bold text-slate-900">&ldquo;{terminateConfirmRoom.topic}&rdquo;</span>
            </p>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTerminateConfirmRoom(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={actionLoadingId === (terminateConfirmRoom._id || terminateConfirmRoom.roomId)}
                onClick={() => handleTerminateRoom(terminateConfirmRoom._id || terminateConfirmRoom.roomId)}
                className="bg-rose-600 hover:bg-rose-500 text-white"
              >
                Terminate Session
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Schedule Official GD Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Official Group Discussion"
        subtitle="Publish an official peer debate session to the B2C GD Arena"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateOfficialRoom} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Discussion Topic *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Generative AI in Production: Threat to Entry-Level Developers?"
              value={formTopic}
              onChange={(e) => setFormTopic(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Category
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="TECH">Technology & Software</option>
                <option value="CASE_STUDY">Consulting Case Study</option>
                <option value="HR">HR & Behavioral</option>
                <option value="ETHICS">Business & Tech Ethics</option>
                <option value="CASUAL">Current Affairs & Economy</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Minimum Plan Required
              </label>
              <select
                value={formMinTier}
                onChange={(e) => setFormMinTier(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="ALL">All Students (Free + Paid)</option>
                <option value="BASIC">Basic Plan & Above</option>
                <option value="PREMIUM">Premium Plan Only</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Scheduled Start (Optional)
              </label>
              <input
                type="datetime-local"
                value={formScheduledAt}
                onChange={(e) => setFormScheduledAt(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Max Candidates
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={formMaxParticipants}
                onChange={(e) => setFormMaxParticipants(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              <strong>Platform Concurrency Rule:</strong> Each student can participate in only one active GD room at a time. Concurrency locks release upon room completion or explicit exit.
            </span>
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
              Publish Official Session
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
