"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { useComplaints } from "./hooks/useComplaints";
import { useAssignment } from "./hooks/useAssignment";
import { useEscalation } from "./hooks/useEscalation";
import { useMonitoring } from "./hooks/useMonitoring";
import { DashboardNav } from "./components/DashboardNav";
import { CasesTab } from "./components/CasesTab";
import { MonitoringTab } from "./components/MonitoringTab";
import { UssdTab } from "./components/UssdTab";
import { CaseDetailsModal } from "./components/CaseDetailsModal";
import { NewCaseModal } from "./components/NewCaseModal";
import { AssignmentModal } from "./components/AssignmentModal";
import { EscalationModal } from "./components/EscalationModal";
import { districtOptions } from "./utils/constants";

export default function DashboardPage() {
  const {
    token,
    currentUser,
    checkingAuth,
    handleLogout,
    isAdmin,
    isNavigator,
    isDistrictOfficer,
  } = useAuth();

  const [activeTab, setActiveTab] = useState("cases");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [newCaseModal, setNewCaseModal] = useState(false);
  const [adminDistrict, setAdminDistrict] = useState(
    districtOptions[0]?.value ?? "ablekuma_central"
  );

  const {
    monitoringMetrics,
    overdueComplaints,
    navigatorUpdates,
    navigators,
    refreshStats,
    refreshNavigatorUpdates,
    refreshOverdueComplaints,
    fetchNavigators,
  } = useMonitoring({ token, currentUser });

  const refreshStatsForAdmin = useCallback(() => {
    if (!token || currentUser?.role !== "admin") return;
    refreshStats(adminDistrict);
  }, [token, currentUser?.role, refreshStats, adminDistrict]);

  const {
    complaintsLoading,
    complaintsError,
    complaintForm,
    complaintSubmitting,
    complaintStatus,
    statusFilter,
    selectedCase,
    statusUpdateFeedback,
    statusUpdatingId,
    lastAction,
    escalatedToMe,
    filteredComplaints,
    activeComplaint,
    setComplaintForm,
    setStatusFilter,
    setLastAction,
    setComplaintStatus,
    refreshComplaints,
    handleComplaintSubmit,
    handleUpdateStatus,
    handleSelect,
    closeCaseDetailsModal,
    updateComplaintInList,
    resetComplaintForm,
    creatorLoadingIds,
    assignedLoadingIds,
  } = useComplaints({
    token,
    currentUser,
    onStatsRefresh: refreshStatsForAdmin,
  });

  const handleAssignSuccess = useCallback(
    (detail: string) => {
      setLastAction({ type: "assign", detail });
    },
    [setLastAction]
  );

  const handleEscalateSuccess = useCallback(
    (detail: string) => {
      setLastAction({ type: "escalate", detail });
    },
    [setLastAction]
  );

  const {
    assignmentModal,
    assignee,
    expectedResolutionDate,
    districtOfficers,
    eligibleDistrictOfficers,
    districtOfficersLoading,
    assigning,
    assignmentError,
    setAssignee,
    setExpectedResolutionDate,
    fetchDistrictOfficers,
    handleOpenAssignmentModal,
    handleAssign,
    closeAssignmentModal,
    clearAssignmentError,
  } = useAssignment({
    token,
    currentUser,
    activeComplaint,
    onComplaintUpdate: updateComplaintInList,
    onSuccess: handleAssignSuccess,
    onStatsRefresh: refreshStatsForAdmin,
  });

  const {
    escalationModal,
    targetAdmin,
    escalationReason,
    admins,
    adminsLoading,
    escalating,
    escalationError,
    setTargetAdmin,
    setEscalationReason,
    fetchAdmins,
    handleOpenEscalationModal,
    handleEscalate,
    closeEscalationModal,
    clearEscalationError,
  } = useEscalation({
    token,
    currentUser,
    activeComplaint,
    onComplaintUpdate: updateComplaintInList,
    onSuccess: handleEscalateSuccess,
    onStatsRefresh: refreshStatsForAdmin,
  });

  // Initial data loading
  useEffect(() => {
    if (!token) return;
    refreshComplaints();
    if (currentUser?.role === "admin") {
      refreshStatsForAdmin();
      refreshNavigatorUpdates(adminDistrict);
      refreshOverdueComplaints();
      fetchNavigators();
      fetchDistrictOfficers();
      fetchAdmins();
    }
  }, [
    token,
    currentUser?.role,
    refreshComplaints,
    refreshStats,
    refreshNavigatorUpdates,
    refreshOverdueComplaints,
    fetchNavigators,
    fetchDistrictOfficers,
    fetchAdmins,
    refreshStatsForAdmin,
    adminDistrict,
  ]);

  // Refresh monitoring data when tab changes to monitoring
  useEffect(() => {
    if (activeTab === "monitoring" && token && currentUser?.role === "admin") {
      refreshStatsForAdmin();
      refreshNavigatorUpdates(adminDistrict);
      refreshOverdueComplaints();
    }
  }, [
    activeTab,
    token,
    currentUser?.role,
    refreshStatsForAdmin,
    refreshNavigatorUpdates,
    refreshOverdueComplaints,
    adminDistrict,
  ]);

  // Handle closing case details modal - also close assignment/escalation modals
  const handleCloseCaseDetailsModal = useCallback(() => {
    closeCaseDetailsModal();
    closeAssignmentModal();
    closeEscalationModal();
  }, [closeCaseDetailsModal, closeAssignmentModal, closeEscalationModal]);

  const handleAdminDistrictChange = useCallback(
    (district: string) => {
      setAdminDistrict(district);
      handleCloseCaseDetailsModal();
      if (currentUser?.role === "admin") {
        refreshStats(district);
        refreshNavigatorUpdates(district);
      }
    },
    [
      handleCloseCaseDetailsModal,
      currentUser?.role,
      refreshStats,
      refreshNavigatorUpdates,
    ]
  );

  // Handle case selection - also close assignment/escalation modals
  const handleCaseSelect = useCallback(
    (id: string) => {
      handleSelect(id);
      closeAssignmentModal();
      closeEscalationModal();
    },
    [handleSelect, closeAssignmentModal, closeEscalationModal]
  );

  // Handle new case modal close
  const handleCloseNewCaseModal = useCallback(() => {
    setNewCaseModal(false);
    resetComplaintForm();
  }, [resetComplaintForm]);

  // Handle complaint submit with modal close on success
  const handleComplaintSubmitWithClose = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      const result = await handleComplaintSubmit(event);
      if (result) {
        // Close modal after 2 seconds on success
        setTimeout(() => {
          setNewCaseModal(false);
          setComplaintStatus(null);
        }, 2000);
      }
    },
    [handleComplaintSubmit, setComplaintStatus]
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "cases":
        const casesForTab = isAdmin
          ? filteredComplaints.filter((c) => c.district === adminDistrict)
          : filteredComplaints;
        return (
          <CasesTab
            isAdmin={isAdmin}
            isDistrictOfficer={isDistrictOfficer}
            escalatedToMe={escalatedToMe}
            filteredComplaints={casesForTab}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            selectedCase={selectedCase}
            statusUpdatingId={statusUpdatingId}
            onSelect={handleCaseSelect}
            onUpdateStatus={handleUpdateStatus}
            adminDistrict={adminDistrict}
            onAdminDistrictChange={handleAdminDistrictChange}
          />
        );

      case "monitoring":
        return (
          <MonitoringTab
            monitoringMetrics={monitoringMetrics}
            overdueComplaints={overdueComplaints}
            navigatorUpdates={navigatorUpdates}
            isAdmin={isAdmin}
            adminDistrict={adminDistrict}
            onAdminDistrictChange={handleAdminDistrictChange}
          />
        );

      case "ussd":
        return <UssdTab />;

      default:
        return null;
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-600">Checking session…</p>
      </div>
    );
  }

  if (!token || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-600">Redirecting to sign in…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <DashboardNav
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={isAdmin}
        isNavigator={isNavigator}
        isDistrictOfficer={isDistrictOfficer}
        onNewCase={() => setNewCaseModal(true)}
        profileMenuOpen={profileMenuOpen}
        setProfileMenuOpen={setProfileMenuOpen}
        onRefresh={refreshComplaints}
        onLogout={handleLogout}
        isLoading={complaintsLoading}
      />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">{renderTabContent()}</main>

      {/* New Case Modal */}
      {newCaseModal && (
        <NewCaseModal
          complaintForm={complaintForm}
          setComplaintForm={setComplaintForm}
          complaintSubmitting={complaintSubmitting}
          complaintStatus={complaintStatus}
          complaintsError={complaintsError}
          onSubmit={handleComplaintSubmitWithClose}
          onClose={handleCloseNewCaseModal}
        />
      )}

      {/* Assignment Modal */}
      {assignmentModal && (
        <AssignmentModal
          assignee={assignee}
          setAssignee={setAssignee}
          expectedResolutionDate={expectedResolutionDate}
          setExpectedResolutionDate={setExpectedResolutionDate}
          districtOfficers={eligibleDistrictOfficers}
          districtOfficersLoading={districtOfficersLoading}
          assigning={assigning}
          errorMessage={assignmentError}
          onClearError={clearAssignmentError}
          onAssign={handleAssign}
          onClose={closeAssignmentModal}
        />
      )}

      {/* Escalation Modal */}
      {escalationModal && (
        <EscalationModal
          targetAdmin={targetAdmin}
          setTargetAdmin={setTargetAdmin}
          escalationReason={escalationReason}
          setEscalationReason={setEscalationReason}
          admins={admins}
          adminsLoading={adminsLoading}
          escalating={escalating}
          errorMessage={escalationError}
          onClearError={clearEscalationError}
          onEscalate={handleEscalate}
          onRefreshAdmins={fetchAdmins}
          onClose={closeEscalationModal}
        />
      )}

      {/* Case Details Modal */}
      {selectedCase && activeComplaint && (
        <CaseDetailsModal
          activeComplaint={activeComplaint}
          currentUser={currentUser}
          isAdmin={isAdmin}
          isDistrictOfficer={isDistrictOfficer}
          districtOfficers={districtOfficers}
          navigators={navigators}
          admins={admins}
          creatorLoadingIds={creatorLoadingIds}
          assignedLoadingIds={assignedLoadingIds}
          lastAction={lastAction}
          statusUpdateFeedback={statusUpdateFeedback}
          statusUpdatingId={statusUpdatingId}
          onClose={handleCloseCaseDetailsModal}
          onOpenAssignmentModal={handleOpenAssignmentModal}
          onOpenEscalationModal={handleOpenEscalationModal}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
}
