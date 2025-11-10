import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await login(email, password);
      navigate(userData.role === 'admin' ? '/admin' : '/employee');
    } catch (err) {
      setError(err.message || 'Identifiants incorrects');
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-bg"></div>
      <div className="login-content">
        <div className="login-card">
          <h1 className="logo">THE PALACE</h1>
          <p className="tagline">Système de Gestion</p>
          
          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="error-message">{error}</div>}
            
            <div className="input-group">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="login-btn">
              {loading ? 'Connexion...' : 'SE CONNECTER'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
