import React, { useState, useEffect } from 'react';
import firebaseService from '../services/firebaseService';
import './WiFiRobotControl.css';

function Profile({ user, onLogout, onNavigateBack }) {
  const [connections, setConnections] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.isGuest && user?.uid) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [user, loadUserData]);

  const loadUserData = async () => {
    setLoading(true);
    
    // Load connection history
    const connectionsResult = await firebaseService.getConnectionHistory(user.uid, 10);
    if (connectionsResult.success) {
      setConnections(connectionsResult.connections);
    }

    // Load statistics
    const statsResult = await firebaseService.getUserStats(user.uid);
    if (statsResult.success) {
      setStats(statsResult.stats);
    }

    setLoading(false);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      // Handle Firestore Timestamp
      let date;
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        // Firestore Timestamp
        date = timestamp.toDate();
      } else if (timestamp.seconds) {
        // Firestore Timestamp object with seconds
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp instanceof Date) {
        // Already a Date object
        date = timestamp;
      } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        // ISO string or Unix timestamp
        date = new Date(timestamp);
      } else {
        return 'N/A';
      }
      
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, timestamp);
      return 'Invalid Date';
    }
  };

  return (
    <div className="wifi-robot-control">
      {/* Header */}
      <div className="header">
        <div className="project-area">
          <h1 className="project-name">
            User Profile
          </h1>
        </div>
        <div className="header-right">
          <button 
            onClick={onNavigateBack}
            style={{
              padding: '10px 24px',
              background: 'linear-gradient(135deg, #b88e9d 0%, #b88e9d 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '40px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.2s',
            }}
          >
            ← Back to Control
          </button>
          <button onClick={onLogout} style={{
            padding: '10px 24px',
            background: 'linear-gradient(135deg, #b88e9d 0%, #b88e9d 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '40px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
          }}>
            Logout
          </button>
        </div>
      </div>

      {/* Profile Content */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginTop: '20px',
        marginBottom: '20px'
      }}>
        {/* User Info Card */}
        <div className="function-card">
          <h3 className="card-title">
            <i className="fas fa-user"></i>
            User Information
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {user.photoURL && (
              <div style={{ textAlign: 'center' }}>
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '4px solid #667eea'
                  }}
                />
              </div>
            )}
            <div>
              <strong style={{ color: '#d6a4a4' }}>Username:</strong>
              <p style={{ margin: '4px 0', color: '#4b5563' }}>{user.username}</p>
            </div>
            <div>
              <strong style={{ color: '#d6a4a4' }}>Email:</strong>
              <p style={{ margin: '4px 0', color: '#4b5563' }}>{user.email || 'N/A'}</p>
            </div>
            <div>
              <strong style={{ color: '#d6a4a4' }}>Account Type:</strong>
              <p style={{ margin: '4px 0', color: '#4b5563' }}>
                {user.isGuest ? 'Guest Account' : 'Registered Account'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        {!user?.isGuest && stats && (
          <div className="function-card">
            <h3 className="card-title">
              <i className="fas fa-chart-bar"></i>
              Statistics
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ 
                padding: '16px',
                background: 'linear-gradient(135deg, #d6a4a4 0%, #dae2f8 100%)',
                borderRadius: '12px',
                color: 'white'
              }}>
                <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold' }}>
                  {stats.totalConnections}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
                  Total Connections
                </p>
              </div>
              <div style={{ 
                padding: '16px',
                background: 'linear-gradient(135deg, #d6a4a4 0%, #dae2f8 100%)',
                borderRadius: '12px',
                color: 'white'
              }}>
                <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold' }}>
                  {stats.totalDurationFormatted}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
                  Total Control Time
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Connection History */}
        {!user?.isGuest && (
          <div className="function-card" style={{ gridColumn: '1 / -1' }}>
            <h3 className="card-title">
              <i className="fas fa-history"></i>
              Connection History
            </h3>
            
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px' }}></i>
                <p>Loading...</p>
              </div>
            ) : connections.length === 0 ? (
              <div style={{ 
                padding: '40px 20px',
                textAlign: 'center',
                color: '#6b7280',
                backgroundColor: '#f9fafb',
                borderRadius: '12px',
                border: '2px dashed #d1d5db'
              }}>
                <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>📡</p>
                <p style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: '#374151' }}>
                  No Connection Logs Yet
                </p>
                <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
                  Connect to your robot to see logs here
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{ 
                      backgroundColor: '#f9fafb',
                      borderBottom: '2px solid #e5e7eb'
                    }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                        Device
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                        Connected At
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                        Duration
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {connections.map((conn, index) => (
                      <tr key={conn.id} style={{ 
                        borderBottom: '1px solid #e5e7eb',
                        backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                      }}>
                        <td style={{ padding: '12px', color: '#4b5563' }}>
                          {conn.deviceId}
                        </td>
                        <td style={{ padding: '12px', color: '#4b5563' }}>
                          {formatDate(conn.connectedAt)}
                        </td>
                        <td style={{ padding: '12px', color: '#4b5563' }}>
                          {conn.duration > 0 ? firebaseService.formatDuration(conn.duration) : 'Active'}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: conn.status === 'active' ? '#d1fae5' : '#e0e7ff',
                            color: conn.status === 'active' ? '#065f46' : '#3730a3'
                          }}>
                            {conn.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Guest User Message */}
        {user?.isGuest && (
          <div className="function-card" style={{ gridColumn: '1 / -1' }}>
            <div style={{ 
              padding: '40px',
              textAlign: 'center',
              color: '#6b7280',
              backgroundColor: '#fff7ed',
              borderRadius: '12px',
              border: '2px dashed #fed7aa'
            }}>
              <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>🎭</p>
              <p style={{ margin: '0', fontSize: '20px', fontWeight: '600', color: '#92400e' }}>
                Guest Account
              </p>
              <p style={{ margin: '12px 0 0 0', fontSize: '14px', color: '#78350f' }}>
                Guest users don't have connection history or statistics saved.
                <br />
                Create an account to track your robot control sessions!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="footer">
        <p className="tech-stack">ESP32-S3 • Arduino UNO • React • WiFi Bridge • Firebase</p>
      </div>
    </div>
  );
}

export default Profile;