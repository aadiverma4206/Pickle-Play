import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import PlayerShell from './components/layout/PlayerShell';
import AdminShell from './components/layout/AdminShell';
import { RequireAuth, RequireAdmin, RequireSection } from './app/guards';
import ToastHost from './components/ui/ToastHost';
import ConfirmDialogHost from './components/ui/ConfirmDialogHost';

import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ProfileSetupPage from './pages/auth/ProfileSetupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

import HomePage from './pages/home/HomePage';
import FindGamesPage from './pages/games/FindGamesPage';
import GameDetailPage from './pages/games/GameDetailPage';
import MyGamesPage from './pages/games/MyGamesPage';
import ClubsListPage from './pages/courts/ClubsListPage';
import ClubDetailPage from './pages/courts/ClubDetailPage';
import MyBookingsPage from './pages/bookings/MyBookingsPage';
import CommunityListPage from './pages/community/CommunityListPage';
import CommunityDetailPage from './pages/community/CommunityDetailPage';
import TournamentsListPage from './pages/tournaments/TournamentsListPage';
import TournamentDetailPage from './pages/tournaments/TournamentDetailPage';
import PerformancePage from './pages/performance/PerformancePage';
import LeaderboardPage from './pages/performance/LeaderboardPage';
import AchievementsPage from './pages/performance/AchievementsPage';
import HeadToHeadPage from './pages/performance/HeadToHeadPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import SupportPage from './pages/support/SupportPage';
import ProfilePage from './pages/profile/ProfilePage';
import SettingsPage from './pages/profile/SettingsPage';

import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersListPage from './pages/admin/users/AdminUsersListPage';
import AdminUserDetailPage from './pages/admin/users/AdminUserDetailPage';
import AdminClubsPage from './pages/admin/clubs/AdminClubsPage';
import AdminClubDetailPage from './pages/admin/clubs/AdminClubDetailPage';
import AdminGamesPage from './pages/admin/games/AdminGamesPage';
import AdminBookingsPage from './pages/admin/bookings/AdminBookingsPage';
import AdminTournamentsPage from './pages/admin/tournaments/AdminTournamentsPage';
import AdminTournamentManagePage from './pages/admin/tournaments/AdminTournamentManagePage';
import AdminCommunitiesPage from './pages/admin/communities/AdminCommunitiesPage';
import AdminFinancePage from './pages/admin/finance/AdminFinancePage';
import AdminSupportPage from './pages/admin/support/AdminSupportPage';
import AdminReportsPage from './pages/admin/reports/AdminReportsPage';
import AdminSettingsPage from './pages/admin/settings/AdminSettingsPage';
import AdminAuditLogPage from './pages/admin/audit/AdminAuditLogPage';
import AdminRolesPermissionsPage from './pages/admin/roles/AdminRolesPermissionsPage';

export default function App() {
  return (
    <BrowserRouter>
      <ToastHost />
      <ConfirmDialogHost />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/profile-setup" element={<ProfileSetupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<PlayerShell />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/games" element={<FindGamesPage />} />
            <Route path="/games/mine" element={<MyGamesPage />} />
            <Route path="/games/:gameId" element={<GameDetailPage />} />
            <Route path="/courts" element={<ClubsListPage />} />
            <Route path="/courts/:clubId" element={<ClubDetailPage />} />
            <Route path="/bookings" element={<MyBookingsPage />} />
            <Route path="/community" element={<CommunityListPage />} />
            <Route path="/community/:communityId" element={<CommunityDetailPage />} />
            <Route path="/tournaments" element={<TournamentsListPage />} />
            <Route path="/tournaments/:tournamentId" element={<TournamentDetailPage />} />
            <Route path="/performance" element={<PerformancePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/head-to-head/:opponentId" element={<HeadToHeadPage />} />
            <Route path="/head-to-head" element={<HeadToHeadPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route element={<RequireAdmin />}>
          <Route element={<AdminShell />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<RequireSection section="users"><AdminUsersListPage /></RequireSection>} />
            <Route path="/admin/users/:userId" element={<RequireSection section="users"><AdminUserDetailPage /></RequireSection>} />
            <Route path="/admin/clubs" element={<RequireSection section="clubs"><AdminClubsPage /></RequireSection>} />
            <Route path="/admin/clubs/:clubId" element={<RequireSection section="clubs"><AdminClubDetailPage /></RequireSection>} />
            <Route path="/admin/games" element={<RequireSection section="games"><AdminGamesPage /></RequireSection>} />
            <Route path="/admin/bookings" element={<RequireSection section="bookings"><AdminBookingsPage /></RequireSection>} />
            <Route path="/admin/tournaments" element={<RequireSection section="tournaments"><AdminTournamentsPage /></RequireSection>} />
            <Route path="/admin/tournaments/:tournamentId" element={<RequireSection section="tournaments"><AdminTournamentManagePage /></RequireSection>} />
            <Route path="/admin/communities" element={<RequireSection section="communities"><AdminCommunitiesPage /></RequireSection>} />
            <Route path="/admin/finance" element={<RequireSection section="finance"><AdminFinancePage /></RequireSection>} />
            <Route path="/admin/support" element={<RequireSection section="support"><AdminSupportPage /></RequireSection>} />
            <Route path="/admin/reports" element={<RequireSection section="reports"><AdminReportsPage /></RequireSection>} />
            <Route path="/admin/settings" element={<RequireSection section="settings"><AdminSettingsPage /></RequireSection>} />
            <Route path="/admin/audit" element={<RequireSection section="audit"><AdminAuditLogPage /></RequireSection>} />
            <Route path="/admin/roles" element={<RequireSection section="roles"><AdminRolesPermissionsPage /></RequireSection>} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
