import { createContext, useContext, useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRoleByEmail = async (email) => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data();
      return userData.role?.toLowerCase() || 'user';
    }
    return 'user'; // fallback si pas trouvé
  };

  const login = async (email, password) => {
    if (!email || !password) {
      throw new Error('Email et mot de passe obligatoires');
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase Auth success, UID:', userCredential.user.uid);

      const role = await fetchUserRoleByEmail(userCredential.user.email);
      setUserRole(role);
      setCurrentUser(userCredential.user);

      return {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        role,
      };
    } catch (err) {
      console.error('Login error:', err);
      throw new Error('Identifiants incorrects');
    }
  };

  const logout = () => signOut(auth);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          const role = await fetchUserRoleByEmail(user.email);
          setUserRole(role);
          console.log('User logged in, role:', role);
        } catch (err) {
          console.error('Error fetching role on auth state change:', err);
          setUserRole('user');
        }
      } else {
        setUserRole(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userRole, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
