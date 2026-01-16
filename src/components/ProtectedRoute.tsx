import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'sales';
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, role, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not logged in - redirect to appropriate login
        if (requiredRole === 'admin') {
          navigate('/admin/login');
        } else {
          navigate('/auth');
        }
      } else if (requiredRole && role !== requiredRole) {
        // Wrong role
        if (requiredRole === 'admin') {
          navigate('/admin/login');
        } else {
          navigate('/auth');
        }
      }
    }
  }, [user, role, isLoading, requiredRole, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole && role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
