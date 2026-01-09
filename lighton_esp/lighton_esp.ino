#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "JKNBD";
const char* password = "WilliamTing";
const char* serverUrl = "https://light-jy7268jur-rueilians-projects.vercel.app/api/data"; // 換成你的電腦 IP

unsigned long lastSendTime = 0;
const unsigned long sendInterval = 10000; // 每 10 秒送一次

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected.");
  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  if (millis() - lastSendTime >= sendInterval) {
    lastSendTime = millis();

    // 隨機產生假資料
    int temp = random(20, 30);
    int hum  = random(40, 60);

    sendDataToServer(temp, hum);
  }
}

void sendDataToServer(int temperature, int humidity) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    // 直接手動拼 JSON 字串
    String json = "{\"temperature\":" + String(temperature) + ",\"humidity\":" + String(humidity) + "}";

    int httpCode = http.POST(json);

    if (httpCode > 0) {
      Serial.printf("Sent data - Temp: %d°C, Humidity: %d%% (HTTP %d)\n", temperature, humidity, httpCode);
    } else {
      Serial.println("Failed to send data");
    }

    http.end();
  }
}
