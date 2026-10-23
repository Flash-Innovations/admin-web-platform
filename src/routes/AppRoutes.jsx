import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { DashboardLayout } from "../components/layout/DashboardLayout";

// Helper for dynamic named imports with React.lazy
const lazyNamed = (importFn, name) =>
  lazy(() => importFn().then((module) => ({ default: module[name] })));

// Eagerly loaded public entry pages for instant first paint
import { LoginPage } from "../pages/auth/LoginPage";
import { LandingPage } from "../pages/LandingPage";
import { NotFoundPage } from "../pages/NotFoundPage";

// Lazy-loaded Public / Legal Pages
const PrivacyPolicyPage = lazyNamed(() => import("../pages/legal/PrivacyPolicyPage"), "PrivacyPolicyPage");
const TermsOfServicePage = lazyNamed(() => import("../pages/legal/TermsOfServicePage"), "TermsOfServicePage");
const DataSecurityPage = lazyNamed(() => import("../pages/legal/DataSecurityPage"), "DataSecurityPage");

// Lazy-loaded Super Admin Pages
const SuperAdminDashboard = lazyNamed(() => import("../pages/superadmin/SuperAdminDashboard"), "SuperAdminDashboard");
const ContestsAdminPage = lazyNamed(() => import("../pages/superadmin/ContestsAdminPage"), "ContestsAdminPage");
const GdAdminPage = lazyNamed(() => import("../pages/superadmin/GdAdminPage"), "GdAdminPage");
const GlobalQuestionBankPage = lazyNamed(() => import("../pages/superadmin/GlobalQuestionBankPage"), "GlobalQuestionBankPage");
const ReportsGeneratorPage = lazyNamed(() => import("../pages/superadmin/ReportsGeneratorPage"), "ReportsGeneratorPage");

import { PageSkeleton } from "../components/common/LoadingSkeleton";

function RouteLoadingFallback() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageSkeleton />
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        {/* Public Entry - Direct Super Admin Login */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Platform Overview & Legal */}
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/security" element={<DataSecurityPage />} />

        {/* Direct shortcuts */}
        <Route path="/dashboard" element={<Navigate to="/super-admin/dashboard" replace />} />
        <Route path="/contests" element={<Navigate to="/super-admin/contests" replace />} />
        <Route path="/gd" element={<Navigate to="/super-admin/gd" replace />} />
        <Route path="/questions" element={<Navigate to="/super-admin/questions" replace />} />
        <Route path="/reports" element={<Navigate to="/super-admin/reports" replace />} />
        <Route path="/approvals" element={<Navigate to="/super-admin/dashboard" replace />} />
        <Route path="/institutions" element={<Navigate to="/super-admin/dashboard" replace />} />

        {/* Super Admin Console Routes */}
        <Route element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/contests" element={<ContestsAdminPage />} />
            <Route path="/super-admin/gd" element={<GdAdminPage />} />
            <Route path="/super-admin/questions" element={<GlobalQuestionBankPage />} />
            <Route path="/super-admin/reports" element={<ReportsGeneratorPage />} />

            {/* Route aliases */}
            <Route path="/super_admin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/super_admin/contests" element={<ContestsAdminPage />} />
            <Route path="/super_admin/gd" element={<GdAdminPage />} />
            <Route path="/super_admin/questions" element={<GlobalQuestionBankPage />} />
            <Route path="/super_admin/reports" element={<ReportsGeneratorPage />} />
            <Route path="/superadmin/*" element={<Navigate to="/super-admin/dashboard" replace />} />
            <Route path="/super_admin/*" element={<Navigate to="/super-admin/dashboard" replace />} />
          </Route>
        </Route>

        {/* 404 Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
