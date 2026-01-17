import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'sales';
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, role, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isRoleLoading, setIsRoleLoading] = useState(true);

  useEffect(() => {
    // Give role a moment to load after user is available
    if (!isLoading && user) {
      const timer = setTimeout(() => {
        setIsRoleLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    } else if (!isLoading && !user) {
      setIsRoleLoading(false);
    }
  }, [isLoading, user]);

  useEffect(() => {
    if (!isLoading && !isRoleLoading) {
      if (!user) {
        // Not logged in - redirect to appropriate login
        if (requiredRole === 'admin') {
          navigate('/admin/login');
        } else {
          navigate('/auth');
        }
      } else if (requiredRole === 'admin' && role !== 'admin') {
        // Admin route requires admin role specifically
        navigate('/admin/login');
      } else if (requiredRole === 'sales' && role !== 'sales' && role !== 'admin') {
        // Sales route - allow both sales and admin
        navigate('/auth');
      }
    }
  }, [user, role, isLoading, isRoleLoading, requiredRole, navigate]);

  if (isLoading || isRoleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check role access
  if (requiredRole === 'admin' && role !== 'admin') {
    return null;
  }

  if (requiredRole === 'sales' && role !== 'sales' && role !== 'admin') {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
