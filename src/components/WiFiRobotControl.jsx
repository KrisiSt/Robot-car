import React, { useState, useEffect, useRef, useCallback } from 'react';
import wifiRobotAPI from '../services/wifiRobotAPI';
import firebaseService from '../services/firebaseService';
import './WiFiRobotControl.css';

function WiFiRobotControl({ user, onNavigateToProfile }) {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState('Not connected to robot');
  const [activeButton, setActiveButton] = useState(null);
  const [speed, setSpeed] = useState(150);
  const [showCamera, setShowCamera] = useState(false);
  const [activeMode, setActiveMode] = useState(null);
  const [activeLED, setActiveLED] = useState('off');
  
  // Track connection for Firebase logging
  const connectionIdRef = useRef(sessionStorage.getItem('robot_conn_id') || null);
  const connectionStartTimeRef = useRef(
    sessionStorage.getItem('robot_conn_start') ? parseInt(sessionStorage.getItem('robot_conn_start')) : null
  );

  const logConnectionToFirebase = useCallback(async () => {
    if (connectionIdRef.current) return;
    try {
      const result = await firebaseService.logConnection(user.uid, {
        ssid: 'ELEGOO-04FADA16A398',
        ip: '192.168.4.1'
      });
      if (result.success) {
        connectionIdRef.current = result.connectionId;
        connectionStartTimeRef.current = Date.now();
        sessionStorage.setItem('robot_conn_id', result.connectionId);
        sessionStorage.setItem('robot_conn_start', Date.now().toString());
      }
    } catch (error) {
      console.error('Failed to log connection:', error);
    }
  }, [user?.uid]);

  const handleDisconnectLogging = useCallback(async () => {
    if (!connectionIdRef.current || !connectionStartTimeRef.current) return;
    const duration = Math.floor((Date.now() - connectionStartTimeRef.current) / 1000);
    await firebaseService.logDisconnection(user.uid, connectionIdRef.current, duration);
    connectionIdRef.current = null;
    connectionStartTimeRef.current = null;
    sessionStorage.removeItem('robot_conn_id');
    sessionStorage.removeItem('robot_conn_start');
  }, [user?.uid]);

  // Silent check on mount — never logs to Firebase
  const checkConnection = useCallback(async () => {
    const result = await wifiRobotAPI.ping();
    if (result.success) {
      setIsConnected(true);
      setStatus('Connected to robot via WiFi');
    } else {
      setIsConnected(false);
      setStatus('Not connected. Make sure you are on robot WiFi: ELEGOO-04FADA16A398');
    }
  }, []);

  // Explicit Connect button click — logs to Firebase
  const handleConnectClick = useCallback(async () => {
    setStatus('Testing connection...');
    const result = await wifiRobotAPI.ping();
    if (result.success) {
      setIsConnected(true);
      setStatus('Connected to robot via WiFi');
      if (!user?.isGuest && user?.uid) {
        logConnectionToFirebase();
      }
    } else {
      setIsConnected(false);
      setStatus('Not connected. Make sure you are on robot WiFi: ELEGOO-04FADA16A398');
    }
  }, [user?.isGuest, user?.uid, logConnectionToFirebase]);

  const handleDisconnect = useCallback(async () => {
    if (!user?.isGuest && connectionIdRef.current) {
      try {
        await handleDisconnectLogging();
      } catch (error) {
        console.error('Failed to log disconnection:', error);
      }
    }
    connectionIdRef.current = null;
    connectionStartTimeRef.current = null;
    sessionStorage.removeItem('robot_conn_id');
    sessionStorage.removeItem('robot_conn_start');
    setIsConnected(false);
    setActiveButton(null);
    setActiveMode(null);
    setStatus('Not connected. Make sure you are on robot WiFi: ELEGOO-04FADA16A398');
  }, [user?.isGuest, handleDisconnectLogging]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const handleMove = useCallback(async (direction, actionFunction) => {
    if (!isConnected) return;
    setActiveButton(direction);
    try {
      await actionFunction();
      console.log(`Moving: ${direction} at speed ${speed}`);
    } catch (error) {
      console.error('Move failed:', error);
      setStatus(`Error: ${error.message}`);
    }
  }, [isConnected, speed]);

  const handleStop = useCallback(async () => {
    setActiveButton(null);
    if (isConnected) {
      try {
        await wifiRobotAPI.stop();
        console.log('Stopped');
      } catch (error) {
        console.error('Stop failed:', error);
      }
    }
  }, [isConnected]);

  const handleLED = async (r, g, b, colorName) => {
    if (!isConnected) return;
    try {
      await wifiRobotAPI.setLED(r, g, b, 0);
      setActiveLED(colorName);
      setStatus(`LED set to ${colorName.toUpperCase()}`);
    } catch (error) {
      console.error('LED failed:', error);
      setStatus(`LED error: ${error.message}`);
    }
  };

  const handleMode = async (mode, modeName) => {
    if (!isConnected) return;
    try {
      await wifiRobotAPI.setMode(mode);
      setActiveMode(mode);
      setStatus(`Mode: ${modeName}`);
    } catch (error) {
      console.error('Mode change failed:', error);
      setStatus(`Mode error: ${error.message}`);
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isConnected) return;
      
      
      switch(e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          e.preventDefault();
          if (activeButton !== 'forward') {
            handleMove('forward', () => wifiRobotAPI.moveForward(speed));
          }
          break;
        case 's':
        case 'arrowdown':
          e.preventDefault();
          if (activeButton !== 'backward') {
            handleMove('backward', () => wifiRobotAPI.moveBackward(speed));
          }
          break;
        case 'a':
        case 'arrowleft':
          e.preventDefault();
          if (activeButton !== 'left') {
            handleMove('left', () => wifiRobotAPI.turnLeft(speed));
          }
          break;
        case 'd':
        case 'arrowright':
          e.preventDefault();
          if (activeButton !== 'right') {
            handleMove('right', () => wifiRobotAPI.turnRight(speed));
          }
          break;
        case ' ':
          e.preventDefault();
          handleStop();
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e) => {
      if (!isConnected) return;
      
      const keys = ['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
      if (keys.includes(e.key.toLowerCase())) {
        e.preventDefault();
        handleStop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isConnected, activeButton, speed, handleMove, handleStop]);

  return (
    <div className="wifi-robot-control">
      {/* Header */}
      <div className="header">
        <div className="project-area">
          <h1 className="project-name">
            Elegoo Robot WiFi Control
          </h1>
        </div>
        <div className="header-right">
          {isConnected && (
            <button onClick={handleDisconnect} className="disconnect-btn">
              <i className="fas fa-plug"></i>
              Disconnect
            </button>
          )}
          <button
            onClick={handleConnectClick}
            className={`connect-btn ${isConnected ? 'connected' : ''}`}
          >
            <i className={`fas ${isConnected ? 'fa-check-circle' : 'fa-wifi'}`}></i>
            {isConnected ? 'Connected' : 'Connect'}
          </button>
          <div 
            className="profile-icon"
            onClick={onNavigateToProfile}
            style={{ cursor: 'pointer' }}
            title="View Profile"
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.username}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <span style={{ fontSize: '1.2rem', fontWeight: '600', color: '#b88e9d' }}>
                {user.username?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-message">
          <i className="fas fa-info-circle"></i>
          <p>{status}</p>
        </div>
        <div className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="dot"></span>
          {isConnected ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* Connection Instructions (when not connected) */}
      {!isConnected && (
        <div className="connection-instructions">
          <h3>
            <i className="fas fa-satellite-dish"></i>
            Connection Instructions
          </h3>
          <ol>
            <li>Make sure robot is powered ON</li>
            <li>Set "Upload-Cam" switch to <strong>"Cam"</strong></li>
            <li>Connect to WiFi: <strong>ELEGOO-04FADA16A398</strong></li>
            <li>Wait a few seconds, then click Connect</li>
          </ol>
        </div>
      )}

      {/* Main Control Layout */}
      {isConnected && (
        <div className="main-layout">
          {/* Camera Section */}
          <div className="camera-section">
            <button onClick={() => setShowCamera(!showCamera)} className="toggle-camera-btn">
              <i className={`fas ${showCamera ? 'fa-eye-slash' : 'fa-video'}`}></i>
              {showCamera ? 'Hide Camera' : 'Show Camera'}
            </button>
            
            <div className="camera-container">
              {showCamera ? (
                <img 
                  src="http://192.168.4.1:81/stream" 
                  alt="Robot Camera Feed"
                  className="camera-feed"
                />
              ) : (
                <div className="camera-placeholder">
                  <i className="fas fa-camera"></i>
                  <p>Click "Show Camera" to view feed</p>
                </div>
              )}
            </div>

            {isConnected && !user?.isGuest && (
              <div className="connection-note">
                <i className="fas fa-database"></i>
                Connection logged to Firebase
              </div>
            )}
          </div>

          {/* Functions Panel */}
          <div className="functions-panel">
            {/* Movement Control */}
            <div className="function-card">
              <h3 className="card-title">
                <i className="fas fa-gamepad"></i>
                Movement Control
                <span className="keyboard-hint">
                  <i className="fas fa-keyboard"></i> WASD / Arrows
                </span>
              </h3>

              <div className="speed-control">
                <label>
                  <i className="fas fa-tachometer-alt"></i>
                  Speed: {speed}
                </label>
                <input 
                  type="range" 
                  min="50" 
                  max="255" 
                  value={speed} 
                  onChange={(e) => setSpeed(parseInt(e.target.value))}
                  className="speed-slider"
                />
              </div>

              <div className="movement-grid">
                <div className="movement-row">
                  <div className="spacer"></div>
                  <button 
                    className={`ctrl-btn ${activeButton === 'forward' ? 'active' : ''}`}
                    onMouseDown={() => handleMove('forward', () => wifiRobotAPI.moveForward(speed))}
                    onMouseUp={handleStop}
                    onMouseLeave={handleStop}
                  >
                    <i className="fas fa-arrow-up"></i>
                    <span className="key-hint">W</span>
                  </button>
                  <div className="spacer"></div>
                </div>

                <div className="movement-row">
                  <button 
                    className={`ctrl-btn ${activeButton === 'left' ? 'active' : ''}`}
                    onMouseDown={() => handleMove('left', () => wifiRobotAPI.turnLeft(speed))}
                    onMouseUp={handleStop}
                    onMouseLeave={handleStop}
                  >
                    <i className="fas fa-arrow-left"></i>
                    <span className="key-hint">A</span>
                  </button>
                  <button className="ctrl-btn stop-btn" onClick={handleStop}>
                    <i className="fas fa-stop"></i>
                    <span className="key-hint">SPACE</span>
                  </button>
                  <button 
                    className={`ctrl-btn ${activeButton === 'right' ? 'active' : ''}`}
                    onMouseDown={() => handleMove('right', () => wifiRobotAPI.turnRight(speed))}
                    onMouseUp={handleStop}
                    onMouseLeave={handleStop}
                  >
                    <i className="fas fa-arrow-right"></i>
                    <span className="key-hint">D</span>
                  </button>
                </div>

                <div className="movement-row">
                  <div className="spacer"></div>
                  <button 
                    className={`ctrl-btn ${activeButton === 'backward' ? 'active' : ''}`}
                    onMouseDown={() => handleMove('backward', () => wifiRobotAPI.moveBackward(speed))}
                    onMouseUp={handleStop}
                    onMouseLeave={handleStop}
                  >
                    <i className="fas fa-arrow-down"></i>
                    <span className="key-hint">S</span>
                  </button>
                  <div className="spacer"></div>
                </div>
              </div>
            </div>

            {/* Autonomous Modes */}
            <div className="function-card">
              <h3 className="card-title">
                <i className="fas fa-brain"></i>
                Autonomous Modes
              </h3>

              <div className="modes-row">
                <button 
                  onClick={() => handleMode(1, 'Line Tracking')}
                  className={`mode-item ${activeMode === 1 ? 'active-mode' : ''}`}
                >
                  <i className="fas fa-route"></i>
                  Line Tracking
                </button>
                <button 
                  onClick={() => handleMode(2, 'Obstacle Avoidance')}
                  className={`mode-item ${activeMode === 2 ? 'active-mode' : ''}`}
                >
                  <i className="fas fa-shield-alt"></i>
                  Obstacle Avoidance
                </button>
                <button 
                  onClick={() => handleMode(3, 'Follow Mode')}
                  className={`mode-item ${activeMode === 3 ? 'active-mode' : ''}`}
                >
                  <i className="fas fa-user-friends"></i>
                  Follow Mode
                </button>
              </div>

              <p className="mode-note">
                <i className="fas fa-exclamation-triangle"></i>
                Press STOP before switching modes
              </p>
            </div>

            {/* LED Control */}
            <div className="function-card">
              <h3 className="card-title">
                <i className="fas fa-lightbulb"></i>
                LED Control
              </h3>

              <div className="led-control">
                <div className="led-indicator" style={{ 
                  background: activeLED === 'red' ? '#ef4444' : 
                             activeLED === 'green' ? '#10b981' : 
                             activeLED === 'blue' ? '#3b82f6' : 
                             activeLED === 'yellow' ? '#f59e0b' : 
                             activeLED === 'purple' ? '#a855f7' : 
                             activeLED === 'cyan' ? '#06b6d4' : 
                             activeLED === 'white' ? '#e0e0e0' : 
                             '#1f2937'
                }}>
                  <i className="fas fa-circle"></i>
                </div>
                
                <div className="led-grid">
                  <button onClick={() => handleLED(255, 0, 0, 'red')} className="led-btn red">Red</button>
                  <button onClick={() => handleLED(0, 255, 0, 'green')} className="led-btn green">Green</button>
                  <button onClick={() => handleLED(0, 0, 255, 'blue')} className="led-btn blue">Blue</button>
                  <button onClick={() => handleLED(255, 255, 0, 'yellow')} className="led-btn yellow">Yellow</button>
                  <button onClick={() => handleLED(255, 0, 255, 'purple')} className="led-btn purple">Purple</button>
                  <button onClick={() => handleLED(0, 255, 255, 'cyan')} className="led-btn cyan">Cyan</button>
                  <button onClick={() => handleLED(255, 255, 255, 'white')} className="led-btn white">White</button>
                  <button onClick={() => handleLED(0, 0, 0, 'off')} className="led-btn off">Off</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="footer">
        <p className="tech-stack">ESP32-S3 • Arduino UNO • React • WiFi Bridge • Firebase</p>
      </div>
    </div>
  );
}

export default WiFiRobotControl;