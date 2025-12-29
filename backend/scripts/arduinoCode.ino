#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <LiquidCrystal_I2C.h>

// -------------------- Your Configuration --------------------
#define MQ2_PIN 34
#define DHT_PIN 4
#define DHT_TYPE DHT11
#define BUZZER_PIN 14
#define FAN_PIN 15

// WiFi credentials
const char* ssid = "Yo";
const char* password = "77777777";

// Backend API configuration
const char* backendURL = "https://ietp-g46-guardian-lab-smart-dashboard-3.onrender.com";
const char* apiEndpoint = "/api/devices/ingest";
const char* deviceSecret = "60be1e0138ff89a8168bb05bdb4ea8364eccd8a79406e1d9";
const char* deviceId = "63e5f91b7559";

// Thresholds
const int GAS_SAFE = 300;
const int GAS_WARNING = 600;
const float TEMP_THRESHOLD = 25.0;
const int HUM_SAFE = 35;
const int HUM_WARNING = 50;

// Objects
DHT dht(DHT_PIN, DHT_TYPE);
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Timing
unsigned long lastSendTime = 0;
const long sendInterval = 5000;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n=== Smart Home System Starting ===");
  
  // Initialize hardware
  pinMode(FAN_PIN, OUTPUT);
  digitalWrite(FAN_PIN, LOW);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  
  // Hardware test
  testAllPins();
  
  // Initialize DHT
  dht.begin();
  delay(2000);
  
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0,0);
  lcd.print("Connecting WiFi");
  
  // Connect to WiFi
  connectToWiFi();
  
  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("System Ready");
  lcd.setCursor(0,1);
  lcd.print("IP: ");
  lcd.print(WiFi.localIP().toString());
  
  Serial.println("System initialized");
  Serial.print("WiFi Connected. IP: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  static int loopCount = 0;
  loopCount++;
  
  Serial.print("\n=== Loop ");
  Serial.print(loopCount);
  Serial.println(" ===");
  
  // Read sensors
  int gasRaw = analogRead(MQ2_PIN);
  int gasValue = normalizedGas(gasRaw);
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  
  // Determine statuses
  String gasStatus = getGasStatus(gasValue);
  String tempStatus = getTempStatus(temp);
  String humStatus = getHumStatus(hum);
  
  // Control fan and buzzer based on readings
  controlDevices(temp, gasValue, humStatus);
  
  // Update LCD
  updateLCD(temp, hum, gasValue, gasStatus, humStatus);
  
  // Send data to backend every interval
  if (millis() - lastSendTime >= sendInterval) {
    sendToBackend(temp, hum, gasValue, gasStatus, tempStatus, humStatus);
    lastSendTime = millis();
  }
  
  delay(2000);
}

// -------------------- Hardware Testing --------------------
void testAllPins() {
  Serial.println("\n=== HARDWARE PIN TEST ===");
  
  // Test MQ2 Pin (Analog Input)
  Serial.print("MQ2 Pin (34) analog read: ");
  Serial.println(analogRead(MQ2_PIN));
  
  // Test DHT Pin (Digital Input)
  Serial.print("DHT Pin (4) digital read: ");
  Serial.println(digitalRead(DHT_PIN));
  
  // Test Fan Pin
  Serial.println("\nTesting FAN on Pin 15:");
  Serial.println("Setting HIGH...");
  digitalWrite(FAN_PIN, HIGH);
  delay(500);
  Serial.print("Reading: ");
  Serial.println(digitalRead(FAN_PIN));
  
  Serial.println("Setting LOW...");
  digitalWrite(FAN_PIN, LOW);
  delay(500);
  Serial.print("Reading: ");
  Serial.println(digitalRead(FAN_PIN));
  
  // Test Buzzer Pin
  Serial.println("\nTesting BUZZER on Pin 14:");
  Serial.println("Setting HIGH (should beep)...");
  digitalWrite(BUZZER_PIN, HIGH);
  delay(500);
  Serial.print("Reading: ");
  Serial.println(digitalRead(BUZZER_PIN));
  
  Serial.println("Setting LOW...");
  digitalWrite(BUZZER_PIN, LOW);
  delay(500);
  Serial.print("Reading: ");
  Serial.println(digitalRead(BUZZER_PIN));
  
  Serial.println("=== END HARDWARE TEST ===\n");
}

// -------------------- Backend Communication --------------------
void sendToBackend(float temp, float humidity, int gas, 
                   String gasStat, String tempStat, String humStat) {
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    connectToWiFi();
    return;
  }
  
  HTTPClient http;
  
  // Construct full URL
  String fullURL = String(backendURL) + String(apiEndpoint);
  
  Serial.print("Sending to: ");
  Serial.println(fullURL);
  
  http.begin(fullURL);
  
  // Set headers
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-key", String(deviceId) + ":" + String(deviceSecret));
  
  // Read actual pin states RIGHT BEFORE sending
  bool fanState = digitalRead(FAN_PIN) == HIGH;
  bool buzzerState = digitalRead(BUZZER_PIN) == HIGH;
  
  Serial.print("Actual hardware states - Fan: ");
  Serial.print(fanState ? "ON" : "OFF");
  Serial.print(" | Buzzer: ");
  Serial.println(buzzerState ? "ON" : "OFF");
  
  // Create JSON payload
  DynamicJsonDocument doc(512);
  doc["deviceId"] = deviceId;
  
  // Send sensor readings
  if (!isnan(temp)) {
    doc["temp"] = temp;
  } else {
    doc["temp"] = 22.5;
  }
  
  if (!isnan(humidity)) {
    doc["humidity"] = humidity;
  } else {
    doc["humidity"] = 45.0;
  }
  
  doc["gas"] = gas;
  doc["fanStatus"] = fanState;      // Use actual measured state
  doc["buzzerStatus"] = buzzerState; // Use actual measured state
  
  // Serialize JSON to string
  String payload;
  serializeJson(doc, payload);
  
  Serial.print("Payload: ");
  Serial.println(payload);
  
  // Send POST request
  int httpCode = http.POST(payload);
  
  // Check response
  if (httpCode > 0) {
    Serial.printf("HTTP Response code: %d\n", httpCode);
    
    if (httpCode == HTTP_CODE_CREATED) {
      String response = http.getString();
      Serial.println("Success! Response: " + response);
      lcd.setCursor(13, 1);
      lcd.print("OK");
    } else {
      String response = http.getString();
      Serial.print("Server error: ");
      Serial.println(response);
      lcd.setCursor(13, 1);
      lcd.print("ERR");
    }
  } else {
    Serial.printf("HTTP Error: %s\n", http.errorToString(httpCode).c_str());
    lcd.setCursor(13, 1);
    lcd.print("NET");
  }
  
  http.end();
}

// -------------------- Helper Functions --------------------
void connectToWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nConnected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\nFailed to connect to WiFi");
    WiFi.disconnect();
    delay(1000);
    WiFi.begin(ssid, password);
  }
}

String getGasStatus(int value) {
  if (value <= GAS_SAFE) return "Normal";
  else if (value <= GAS_WARNING) return "Warning";
  else return "Danger";
}

String getTempStatus(float temp) {
  if (isnan(temp)) return "Error";
  if (temp <= TEMP_THRESHOLD) return "Normal";
  else return "Warning";
}

String getHumStatus(float hum) {
  if (isnan(hum)) return "Error";
  if (hum <= HUM_SAFE) return "Normal";
  else if (hum <= HUM_WARNING) return "Warning";
  else return "Danger";
}

void controlDevices(float temp, int gas, String humStat) {
  // Fan control logic
  bool shouldFanBeOn = (!isnan(temp) && temp > TEMP_THRESHOLD);
  
  // Buzzer control logic
  bool shouldBuzzerBeOn = (gas > GAS_SAFE) || (humStat == "Warning") || (humStat == "Danger");
  
  // Apply control
  digitalWrite(FAN_PIN, shouldFanBeOn ? HIGH : LOW);
  digitalWrite(BUZZER_PIN, shouldBuzzerBeOn ? HIGH : LOW);
  
  // Give time for pins to stabilize
  delay(50);
  
  // Read back actual states
  bool actualFanState = digitalRead(FAN_PIN) == HIGH;
  bool actualBuzzerState = digitalRead(BUZZER_PIN) == HIGH;
  
  // Debug output
  Serial.println("\n--- Device Control ---");
  Serial.print("Temperature: ");
  Serial.print(temp);
  Serial.print("°C | Threshold: ");
  Serial.print(TEMP_THRESHOLD);
  Serial.print("°C | Fan should be: ");
  Serial.print(shouldFanBeOn ? "ON" : "OFF");
  Serial.print(" | Fan actually is: ");
  Serial.println(actualFanState ? "ON" : "OFF");
  
  Serial.print("Gas: ");
  Serial.print(gas);
  Serial.print(" | Humidity status: ");
  Serial.print(humStat);
  Serial.print(" | Buzzer should be: ");
  Serial.print(shouldBuzzerBeOn ? "ON" : "OFF");
  Serial.print(" | Buzzer actually is: ");
  Serial.println(actualBuzzerState ? "ON" : "OFF");
  
  // Check for mismatches
  if (shouldFanBeOn != actualFanState) {
    Serial.println("WARNING: Fan state mismatch! Check wiring/power.");
  }
  if (shouldBuzzerBeOn != actualBuzzerState) {
    Serial.println("WARNING: Buzzer state mismatch! Check wiring/power.");
  }
  Serial.println("---\n");
}

void updateLCD(float temp, float hum, int gas, String gasStat, String humStat) {
  lcd.clear();
  
  // Line 1: Temperature and Humidity
  lcd.setCursor(0, 0);
  lcd.print("T:");
  if (!isnan(temp)) {
    lcd.print(temp, 1);
    lcd.print("C");
  } else {
    lcd.print("ERR");
  }
  
  lcd.setCursor(9, 0);
  lcd.print("H:");
  if (!isnan(hum)) {
    lcd.print(hum, 0);
    lcd.print("%");
  } else {
    lcd.print("ERR");
  }
  
  // Line 2: Gas and Status
  lcd.setCursor(0, 1);
  lcd.print("G:");
  lcd.print(gas);
  
  // Show fan status on LCD
  bool fanOn = digitalRead(FAN_PIN) == HIGH;
  lcd.setCursor(9, 1);
  if (fanOn) {
    lcd.print("FAN");
  } else {
    lcd.print(gasStat.substring(0, 3));
  }
}

int normalizedGas(int raw) {
  return map(raw, 843, 3500, 300, 1023);
}