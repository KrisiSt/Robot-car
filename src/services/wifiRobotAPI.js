// Using the ESP for the control
import axios from 'axios';

// In development, proxy forwards relative URLs to the robot.
// In production, we must call the robot's IP directly.
const BASE_URL = process.env.NODE_ENV === 'development' ? '' : 'http://192.168.4.1';

class WiFiRobotAPI {
  constructor() {
    this.isConnected = false;
    this.client = axios.create({ baseURL: BASE_URL });
  }

  async ping() {
    try {
      const response = await this.client.get('/status', { timeout: 2000 });
      console.log('Robot connected:', response.data);
      this.isConnected = true;
      return { success: true, data: response.data };
    } catch (error) {
      console.log('Connection failed:', error.message);
      this.isConnected = false;
      return { success: false, error: error.message };
    }
  }

  async sendMotorCommand(action, speed = 150) {
    try {
      const response = await this.client.get('/motor', {
        params: { action, speed },
        timeout: 3000
      });
      console.log(`Motor command sent: ${action} @ ${speed}`);
      return response.data;
    } catch (error) {
      console.error('Motor command failed:', error);
      throw error;
    }
  }

  async moveForward(speed = 150) {
    return this.sendMotorCommand('forward', speed);
  }

  async moveBackward(speed = 150) {
    return this.sendMotorCommand('backward', speed);
  }

  async turnLeft(speed = 150) {
    return this.sendMotorCommand('left', speed);
  }

  async turnRight(speed = 150) {
    return this.sendMotorCommand('right', speed);
  }

  async stop() {
    return this.sendMotorCommand('stop');
  }

  async setLED(r, g, b, position = 0) {
    try {
      const response = await this.client.get('/led', {
        params: { r, g, b, pos: position },
        timeout: 3000
      });
      console.log(`LED set: R=${r} G=${g} B=${b} Pos=${position}`);
      return response.data;
    } catch (error) {
      console.error('LED command failed:', error);
      throw error;
    }
  }

  async setMode(mode) {
    try {
      const response = await this.client.get('/mode', {
        params: { mode },
        timeout: 3000
      });
      console.log(`Mode changed to: ${mode}`);
      return response.data;
    } catch (error) {
      console.error('Mode change failed:', error);
      throw error;
    }
  }
}

export default new WiFiRobotAPI();