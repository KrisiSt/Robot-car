import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider
} from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
  const [activeView, setActiveView] = useState("login");
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleView = () => {
    setActiveView(activeView === "login" ? "register" : "login");
    setError('');
  };

  // Register with Email/Password
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!registerData.username || !registerData.email || !registerData.password) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        registerData.email, 
        registerData.password
      );

      const user = userCredential.user;

      // Save additional user data to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        username: registerData.username,
        email: registerData.email,
        createdAt: new Date().toISOString(),
        photoURL: null,
        provider: 'email'
      });

      // Success - pass user to parent
      onLoginSuccess({
        uid: user.uid,
        username: registerData.username,
        email: user.email,
        photoURL: null
      });

    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/email-already-in-use') {
        setError('Email already in use');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Login with Email/Password
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        loginData.email,
        loginData.password
      );

      const user = userCredential.user;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        onLoginSuccess({
          uid: user.uid,
          username: userData.username,
          email: user.email,
          photoURL: userData.photoURL || null
        });
      } else {
        // User exists in Auth but not in Firestore
        onLoginSuccess({
          uid: user.uid,
          username: user.email.split('@')[0],
          email: user.email,
          photoURL: null
        });
      }

    } catch (error) {
      console.error('Login error:', error);
      
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Google Login
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // First time login - create user document
        await setDoc(userDocRef, {
          username: user.displayName || user.email.split('@')[0],
          email: user.email,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          provider: 'google'
        });
      }

      onLoginSuccess({
        uid: user.uid,
        username: user.displayName || user.email.split('@')[0],
        email: user.email,
        photoURL: user.photoURL
      });

    } catch (error) {
      console.error('Google login error:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Login cancelled');
      } else {
        setError('Google login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Apple Login
  const handleAppleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new OAuthProvider('apple.com');
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // First time login - create user document
        await setDoc(userDocRef, {
          username: user.displayName || user.email?.split('@')[0] || 'Apple User',
          email: user.email,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          provider: 'apple'
        });
      }

      onLoginSuccess({
        uid: user.uid,
        username: user.displayName || user.email?.split('@')[0] || 'Apple User',
        email: user.email,
        photoURL: user.photoURL
      });

    } catch (error) {
      console.error('Apple login error:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Login cancelled');
      } else {
        setError('Apple login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Guest Access
  const handleGuestAccess = () => {
    onLoginSuccess({
      uid: 'guest',
      username: 'Guest',
      email: null,
      photoURL: null,
      isGuest: true
    });
  };

  return (
    <div className="login-container">
      <div className="card">
        {/* Animated background panel */}
        <div className={`card-bg ${activeView === 'login' ? 'login' : ''}`}></div>

        {/* Hero sections */}
        <div className="hero-wrapper">
          {/* Register Hero (left side) */}
          <div className={`hero register ${activeView === 'register' ? 'active' : ''}`}>
            <div className="hero-content">
              <h2>Begin your robot control journey</h2>
              <button onClick={toggleView} className="hero-btn" disabled={loading}>
                SIGN UP
              </button>
            </div>
          </div>

          {/* Login Hero (right side) */}
          <div className={`hero login ${activeView === 'login' ? 'active' : ''}`}>
            <div className="hero-content">
              <h2>Already have an account?</h2>
              <button onClick={toggleView} className="hero-btn" disabled={loading}>
                LOGIN
              </button>
            </div>
          </div>
        </div>

        {/* Register Form */}
        <form onSubmit={handleRegisterSubmit} className={`form register ${activeView === 'register' ? 'active' : ''}`}>
          <h2>Sign Up</h2>
          {error && activeView === 'register' && (
            <div className="error-message">{error}</div>
          )}
          <input
            type="text"
            placeholder="Username"
            value={registerData.username}
            onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
            required
            disabled={loading}
          />
          <input
            type="email"
            placeholder="Email"
            value={registerData.email}
            onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={registerData.password}
            onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={registerData.confirmPassword}
            onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
            required
            disabled={loading}
          />
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'SIGNING UP...' : 'SIGN UP'}
          </button>

          <div className="sso">
            <button type="button" onClick={handleGoogleLogin} className="social-btn google" disabled={loading}>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
            <button type="button" onClick={handleAppleLogin} className="social-btn apple" disabled={loading}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Apple
            </button>
          </div>
        </form>

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className={`form login ${activeView === 'login' ? 'active' : ''}`}>
          <h2>Sign In</h2>
          {error && activeView === 'login' && (
            <div className="error-message">{error}</div>
          )}
          <input
            type="email"
            placeholder="Email"
            value={loginData.email}
            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={loginData.password}
            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
            required
            disabled={loading}
          />
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </button>

          <button type="button" onClick={handleGuestAccess} className="guest-btn" disabled={loading}>
            Continue as Guest
          </button>

          <div className="sso">
            <button type="button" onClick={handleGoogleLogin} className="social-btn google" disabled={loading}>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
            <button type="button" onClick={handleAppleLogin} className="social-btn apple" disabled={loading}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Apple
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;