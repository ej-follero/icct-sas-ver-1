# Install Mosquitto on Windows

## Method 1: Using Chocolatey (Recommended)

1. **Install Chocolatey** (if not already installed):
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   ```

2. **Install Mosquitto**:
   ```powershell
   choco install mosquitto
   ```

3. **Start Mosquitto**:
   ```powershell
   mosquitto -c mosquitto.conf
   ```

## Method 2: Download Binary

1. **Download**: https://mosquitto.org/download/
2. **Extract** to a folder (e.g., `C:\mosquitto`)
3. **Run**: `mosquitto.exe -c mosquitto.conf`

## Configuration File (mosquitto.conf)

```
# Basic Mosquitto Configuration
listener 1883
listener 9001
protocol websockets

# Allow anonymous connections (for testing)
allow_anonymous true

# Log file
log_dest file mosquitto.log
log_type all
