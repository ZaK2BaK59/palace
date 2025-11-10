import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { currentUser, userRole, loading } = useAuth();

  console.log('ProtectedRoute render:');
  console.log('  currentUser:', currentUser);
  console.log('  userRole:', userRole);
  console.log('  requiredRole:', requiredRole);
  console.log('  loading:', loading);

  if (loading) return <div>Loading...</div>;

  if (!currentUser) return <Navigate to="/" />;

  const normalizedUserRole = userRole?.toLowerCase();
  const normalizedRequiredRole = requiredRole?.toLowerCase();

  if (requiredRole && normalizedUserRole !== normalizedRequiredRole) {
    return <Navigate to={normalizedUserRole === 'admin' ? '/admin' : '/employee'} />;
  }

  return children;
}
