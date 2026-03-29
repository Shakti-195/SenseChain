# Path: Backend/app/services/sensor_service.py
import random
from datetime import datetime

class SensorService:
    @staticmethod
    def get_mock_sensor_data():
        """
        SenseChain IoT Simulator: 
        Generates realistic DHT22 (Temp/Humidity) readings.
        """
        return {
            "temperature": round(random.uniform(22.5, 28.5), 2),
            "humidity": round(random.uniform(45.0, 65.0), 2),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "device_id": "SENSE-NODE-001",
            "status": "SECURE_LINK_ACTIVE"
        }

    @staticmethod
    def format_for_block(data):
        """Formats raw data into a clean string for mining."""
        return f"TEMP:{data['temperature']}°C | HUM:{data['humidity']}% | ID:{data['device_id']}"