//#include <EEPROM.h>

#include "CameraWebServer_AP.h"

CameraWebServer_AP Camera;

void setup() {
  // USB Serial for debugging (to see these messages USB connection is needed)
  Serial.begin(115200);
  
  // Hardware Serial1 for Arduino communication
  // RX=GPIO3, TX=GPIO40, Baud=9600
  Serial1.begin(9600, SERIAL_8N1, 3, 40);  // (baud, config, RX pin, TX pin)
  
  Serial.println();
  Serial.println("ESP32-S3 Camera + Motor Bridge Starting...");
  
  // Initialize camera and WiFi
  Camera.CameraWebServer_AP_Init();
  
  Serial.println("Setup complete!");
  Serial.println("Motor control endpoints:");
  Serial.println("  /motor?action=forward&speed=150");
  Serial.println("  /motor?action=backward&speed=150");
  Serial.println("  /motor?action=left&speed=150");
  Serial.println("  /motor?action=right&speed=150");
  Serial.println("  /motor?action=stop");
  Serial.println("  /led?r=255&g=0&b=0&pos=0");
  Serial.println("  /mode?mode=1");
  
  Serial.println();
  Serial.println("Serial1 (Arduino) initialized on:");
  Serial.println("  TX = GPIO40");
  Serial.println("  RX = GPIO3");
  Serial.println("  Baud = 9600");
}

void loop() {
  delay(10);
}

/*
C:\Program Files (x86)\Arduino\hardware\espressif\arduino-esp32/tools/esptool/esptool.exe --chip esp32 --port COM6 --baud 460800 --before default_reset --after hard_reset write_flash -z --flash_mode dio --flash_freq 80m --flash_size detect 
0xe000 C:\Program Files (x86)\Arduino\hardware\espressif\arduino-esp32/tools/partitions/boot_app0.bin 
0x1000 C:\Program Files (x86)\Arduino\hardware\espressif\arduino-esp32/tools/sdk/bin/bootloader_qio_80m.bin 
0x10000 C:\Users\Faynman\Documents\Arduino\Hex/CameraWebServer_AP_20200608xxx.ino.bin 
0x8000 C:\Users\Faynman\Documents\Arduino\Hex/CameraWebServer_AP_20200608xxx.ino.partitions.bin 

flash:path
C:\Program Files (x86)\Arduino\hardware\espressif\arduino-esp32\tools\partitions\boot_app0.bin
C:\Program Files (x86)\Arduino\hardware\espressif\arduino-esp32\tools\sdk\bin\bootloader_dio_40m.bin
C:\Users\Faynman\Documents\Arduino\Hex\CameraWebServer_AP_20200608xxx.ino.partitions.bin
*/
//esptool.py-- port / dev / ttyUSB0-- baub 261216 write_flash-- flash_size = detect 0 GetChipID.ino.esp32.bin
