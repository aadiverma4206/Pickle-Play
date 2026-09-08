import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { isAdminRole, adminSectionsFor } from '../lib/permissions';
import { EmptyState } from '../components/ui/States';
import { ShieldAlert } from 'lucide-react';

export function RequireAuth() {
  const user = useCurrentUser();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}

export function RequireAdmin() {
  const user = useCurrentUser();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isAdminRole(user.role)) return <Navigate to="/home" replace />;
  return <Outlet />;
}

/** Gate a specific admin sub-section (e.g. only Finance Admin / Super Admin
 *  can open Finance) beyond the coarse "is some admin role" check above. */
export function RequireSection({ section, children }) {
  const user = useCurrentUser();
  if (!user) return null;
  if (!adminSectionsFor(user.role).includes(section)) {
    return (
      <EmptyState icon={ShieldAlert} title="Not authorized" message="Your role does not have access to this section." />
    );
  }
  return children;
}
