// Using the ESP for the control
import axios from 'axios';

class WiFiRobotAPI {
  constructor() {
    this.isConnected = false;
    this.baseURL = ''; // Using proxy, so empty string
  }

  async ping() {
    try {
      const response = await axios.get('/status', { timeout: 2000 });
      console.log('✅ Robot connected:', response.data);
      this.isConnected = true;
      return { success: true, data: response.data };
    } catch (error) {
      console.log('❌ Connection failed:', error.message);
      this.isConnected = false;
      return { success: false, error: error.message };
    }
  }

  async sendMotorCommand(action, speed = 150) {
    try {
      const response = await axios.get('/motor', {
        params: { action, speed },
        timeout: 3000
      });
      console.log(`✅ Motor command sent: ${action} @ ${speed}`);
      return response.data;
    } catch (error) {
      console.error('❌ Motor command failed:', error);
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
      const response = await axios.get('/led', {
        params: { r, g, b, pos: position },
        timeout: 3000
      });
      console.log(`✅ LED set: R=${r} G=${g} B=${b} Pos=${position}`);
      return response.data;
    } catch (error) {
      console.error('❌ LED command failed:', error);
      throw error;
    }
  }

  async setMode(mode) {
    try {
      const response = await axios.get('/mode', {
        params: { mode },
        timeout: 3000
      });
      console.log(`✅ Mode changed to: ${mode}`);
      return response.data;
    } catch (error) {
      console.error('❌ Mode change failed:', error);
      throw error;
    }
  }
}

export default new WiFiRobotAPI();