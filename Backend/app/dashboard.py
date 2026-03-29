import streamlit as st
import json
import pandas as pd
import time
import os

# Configuration
CHAIN_FILE = "blockchain_data.json" # Make sure this path points to your actual file

st.set_page_config(
    page_title="IoT Blockchain Ledger",
    page_icon="🔗",
    layout="wide"
)

st.title("🔗 IoT Data Integrity Blockchain")

def load_data():
    if not os.path.exists(CHAIN_FILE):
        return []
    with open(CHAIN_FILE, "r") as f:
        return json.load(f)

# Auto-refresh logic
placeholder = st.empty()

while True:
    data = load_data()
    
    with placeholder.container():
        # KPI Metrics
        kpi1, kpi2, kpi3 = st.columns(3)
        kpi1.metric(label="Total Blocks Mined", value=len(data))
        
        if len(data) > 1:
            last_block = data[-1]
            # Handle potential missing data keys in Genesis block
            if "temperature" in last_block["data"]:
                temp = last_block["data"]["temperature"]
                humid = last_block["data"]["humidity"]
                kpi2.metric(label="Latest Temperature", value=f"{temp} °C")
                kpi3.metric(label="Latest Humidity", value=f"{humid} %")
        
        # Data Table & Charts
        st.subheader("⛓️ Live Blockchain Ledger")
        
        if len(data) > 0:
            # Convert to Pandas DataFrame for easier charting
            # Filter out Genesis block (index 0) for charts since it has no sensor data
            sensor_data = []
            for block in data:
                if block["index"] > 0:
                    record = block["data"]
                    record["index"] = block["index"]
                    record["hash"] = block["hash"]
                    sensor_data.append(record)
            
            if sensor_data:
                df = pd.DataFrame(sensor_data)
                
                # Show the raw table (with hashes!)
                st.dataframe(df[["index", "timestamp", "temperature", "humidity", "hash"]], use_container_width=True)

                # Charts
                col1, col2 = st.columns(2)
                
                with col1:
                    st.subheader("Temperature History")
                    st.line_chart(df.set_index("index")["temperature"])
                
                with col2:
                    st.subheader("Humidity History")
                    st.line_chart(df.set_index("index")["humidity"])

            else:
                st.info("Waiting for sensor data blocks...")
        else:
            st.warning("Blockchain file not found. Run the simulator!")

    # Wait 2 seconds before refreshing
    time.sleep(2)