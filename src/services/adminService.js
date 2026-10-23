import { api } from "./api";

/**
 * Super Administrator B2C Backend Service
 * Interacts directly with student-b2c-backend endpoints:
 * - Pulse overview telemetry
 * - Contests / Assessments management
 * - Group Discussions (GD Arena) official scheduler & rooms
 * - 4-Pillar Report Generators (Self Usage, Investors, College Partnerships [Zero PII], Brand Collaborations [Zero PII])
 */
export const adminService = {
  /**
   * Super Admin Overview Command Center Pulse
   */
  async getOverview() {
    return api.get("/api/b2c/admin/overview");
  },

  /**
   * Report Pillar 1A: Subscriptions Report (Self Usage)
   */
  async getSubscriptionReports() {
    return api.get("/api/b2c/admin/reports/subscriptions");
  },

  /**
   * Report Pillar 1B: Financial & Revenue Ledger (Self Usage)
   */
  async getFinancialReports(params = {}) {
    const qs = new URLSearchParams();
    if (params.page) qs.append("page", params.page);
    if (params.limit) qs.append("limit", params.limit);
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return api.get(`/api/b2c/admin/reports/financials${query}`);
  },

  /**
   * Report Pillar 2: Investor Metrics Deck (Growth, Retention, Unit Economics)
   */
  async getInvestorReports() {
    return api.get("/api/b2c/admin/reports/investors");
  },

  /**
   * Report Pillar 3: Future College Partnerships (Strict ZERO-PII Aggregates)
   */
  async getCollegePartnershipReports() {
    return api.get("/api/b2c/admin/reports/college-partnerships");
  },

  /**
   * Report Pillar 4: Future Brand Collaborations & Sponsors Fact Sheet (Strict ZERO-PII)
   */
  async getBrandCollaborationReports() {
    return api.get("/api/b2c/admin/reports/brand-collaborations");
  },

  /**
   * Contests: List all global contests
   */
  async listContests() {
    return api.get("/api/b2c/admin/contests");
  },

  /**
   * Contests: Create and schedule a new global contest for all students
   */
  async createContest(contestData) {
    return api.post("/api/b2c/admin/contests", contestData);
  },

  /**
   * Contests: Update an existing contest (status, schedule, syllabus, etc.)
   */
  async updateContest(id, updates) {
    return api.put(`/api/b2c/admin/contests/${id}`, updates);
  },

  /**
   * Contests: Delete / Cancel a contest
   */
  async deleteContest(id) {
    return api.delete(`/api/b2c/admin/contests/${id}`);
  },

  /**
   * Group Discussions: List active and scheduled GD rooms
   */
  async listGdRooms() {
    return api.get("/api/b2c/admin/gd/rooms");
  },

  /**
   * Group Discussions: Create an official scheduled GD session for all students
   */
  async createOfficialGdRoom(roomData) {
    return api.post("/api/b2c/admin/gd/create-official", roomData);
  }
};
