import { useState, useEffect } from 'react';
import Login from './components/Login';
import WiFiRobotControl from './components/WiFiRobotControl';
import Profile from './components/Profile';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in (persistent auth)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is logged in - fetch their data
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              username: userData.username || firebaseUser.displayName || firebaseUser.email?.split('@')[0],
              email: firebaseUser.email,
              photoURL: userData.photoURL || firebaseUser.photoURL || null,
              isGuest: false
            });
          } else {
            // User in Auth but not in Firestore
            setUser({
              uid: firebaseUser.uid,
              username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL || null,
              isGuest: false
            });
          }
          setCurrentPage('control');
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
          setCurrentPage('login');
        }
      } else {
        // No user logged in
        setUser(null);
        setCurrentPage('login');
      }
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentPage('control');
  };

  const handleLogout = async () => {
    if (!user?.isGuest) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    setUser(null);
    setCurrentPage('login');
  };

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #dae2f8 0%, #d6a4a4 100%)',
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>
            <i className="fas fa-robot"></i>
          </div>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (currentPage === 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentPage === 'profile') {
    return (
      <Profile
        user={user}
        onLogout={handleLogout}
        onNavigateBack={() => setCurrentPage('control')}
      />
    );
  }

  return (
    <div className="App">
      <WiFiRobotControl
        user={user}
        onNavigateToProfile={() => setCurrentPage('profile')}
      />
    </div>
  );
}

export default App;