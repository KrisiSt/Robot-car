import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query,
  orderBy, 
  limit,
  serverTimestamp,
  updateDoc,
  doc
} from 'firebase/firestore';
 
class FirebaseService {
  /**
   * Log a new robot connection
   * @param {string} userId - User ID from Firebase Auth
   * @param {object} deviceInfo - Robot device information
   */
  async logConnection(userId, deviceInfo = {}) {
    try {
      const connectionRef = await addDoc(collection(db, 'users', userId, 'connections'), {
        deviceId: deviceInfo.ssid || 'ELEGOO-04FADA16A398',
        deviceType: 'Elegoo Robot Car V4.0',
        ipAddress: deviceInfo.ip || '192.168.4.1',
        connectedAt: serverTimestamp(),
        status: 'active',
        disconnectedAt: null,
        duration: 0
      });
      
      console.log('Connection logged:', connectionRef.id);
      return { success: true, connectionId: connectionRef.id };
    } catch (error) {
      console.error('Failed to log connection:', error);
      return { success: false, error: error.message };
    }
  }
 
  /**
   * Update connection when disconnected
   * @param {string} userId - User ID
   * @param {string} connectionId - Connection document ID
   * @param {number} duration - Connection duration in seconds
   */
  async logDisconnection(userId, connectionId, duration = 0) {
    try {
      const connectionRef = doc(db, 'users', userId, 'connections', connectionId);
      await updateDoc(connectionRef, {
        disconnectedAt: serverTimestamp(),
        status: 'completed',
        duration: duration
      });
      
      console.log('Disconnection logged');
      return { success: true };
    } catch (error) {
      console.error('Failed to log disconnection:', error);
      return { success: false, error: error.message };
    }
  }
 
  /**
   * Get user's connection history
   * @param {string} userId - User ID
   * @param {number} limitCount - Number of connections to retrieve
   */
  async getConnectionHistory(userId, limitCount = 10) {
    try {
      const connectionsRef = collection(db, 'users', userId, 'connections');
      const q = query(
        connectionsRef,
        orderBy('connectedAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      const connections = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`Retrieved ${connections.length} connections`);
      return { success: true, connections };
    } catch (error) {
      console.error('Failed to get connection history:', error);
      return { success: false, error: error.message, connections: [] };
    }
  }
 
  /**
   * Update user's last login time
   * @param {string} userId - User ID
   */
  async updateLastLogin(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        lastLogin: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Failed to update last login:', error);
      return { success: false };
    }
  }
 
  /**
   * Get user statistics (total connections, total time, etc.)
   * @param {string} userId - User ID
   */
  async getUserStats(userId) {
    try {
      const connections = await this.getConnectionHistory(userId, 100);
      
      if (!connections.success) {
        return { success: false, stats: null };
      }
 
      const totalConnections = connections.connections.length;
      const totalDuration = connections.connections.reduce(
        (sum, conn) => sum + (conn.duration || 0), 
        0
      );
 
      const stats = {
        totalConnections,
        totalDuration,
        totalDurationFormatted: this.formatDuration(totalDuration),
        lastConnection: connections.connections[0] || null
      };
 
      return { success: true, stats };
    } catch (error) {
      console.error('Failed to get user stats:', error);
      return { success: false, stats: null };
    }
  }
 
  /**
   * Format duration in seconds to human-readable string
   * @param {number} seconds - Duration in seconds
   */
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
 
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }
  // (Instead of video files, store metadata only)
  
  /**
   * Store: filename, duration, timestamp, thumbnail URL (if you generate one client-side)
   * @param {string} userId - User ID
   * @param {object} recordingMeta - Recording metadata
   */
  async logRecordingMetadata(userId, recordingMeta) {
    try {
      const recordingRef = await addDoc(collection(db, 'users', userId, 'recordings'), {
        fileName: recordingMeta.fileName,
        recordedAt: serverTimestamp(),
        duration: recordingMeta.duration || 0,
        fileSize: recordingMeta.fileSize || 0,
        deviceId: recordingMeta.deviceId || 'ELEGOO-04FADA16A398',
        // thumbnailDataURL: recordingMeta.thumbnail, // Optional: base64 thumbnail (keep small!)
        notes: recordingMeta.notes || ''
      });
      
      console.log('Recording metadata logged:', recordingRef.id);
      return { success: true, recordingId: recordingRef.id };
    } catch (error) {
      console.error('Failed to log recording:', error);
      return { success: false, error: error.message };
    }
  }
 
  /**
   * Get user's recording metadata
   * @param {string} userId - User ID
   * @param {number} limitCount - Number of recordings to retrieve
   */
  async getRecordings(userId, limitCount = 20) {
    try {
      const recordingsRef = collection(db, 'users', userId, 'recordings');
      const q = query(
        recordingsRef,
        orderBy('recordedAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      const recordings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`Retrieved ${recordings.length} recordings`);
      return { success: true, recordings };
    } catch (error) {
      console.error('Failed to get recordings:', error);
      return { success: false, error: error.message, recordings: [] };
    }
  }
}
 
export default new FirebaseService();