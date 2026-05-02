**Skydio X10D – All Technical Specifications (MVP Terms)**  
**Assumption applied**: Max wireless/comms range set to **5 km** (5k) for both Connect SL and Connect MH variants (original was 10–12 km). All other specs unchanged from official page.

### Aircraft
- **Startup time**: Under 40 seconds
- **Dimensions (unfolded, with propellers)**: 31.1” x 25.6” x 5.7” / 79.0 cm × 65.0 cm × 14.5 cm
- **Dimensions (folded, without battery)**: 13.8” x 6.5” x 4.7” / 35.05 cm × 16.51 cm × 11.94 cm
- **Weight (incl. batteries)**:
  - Connect SL: 4.65 lbs / 2.11 kg
  - Connect MH: 4.72 lbs / 2.14 kg
- **Max takeoff weight**: 5.49 lbs / 2.49 kg
- **Max hover time**: 35 minutes
- **Max flight time**: 40 minutes
- **Max horizontal speed (sea level)**: 45 mph / 20 m/s
- **Max horizontal speed with obstacle avoidance**: 36 mph / 16 m/s
- **Max ascent speed**: 13.4 mph / 6 m/s
- **Max descent speed**: 9.0 mph / 4 m/s
- **Max non-vertical descent speed**: 13.4 mph / 6 m/s
- **Max tilt angle**: 40°
- **Max angular velocity**:
  - Yaw: 100°/s
  - Roll / Pitch: 225°/s
- **Max gust handling**: ≤ 28 mph / 12.8 m/s
- **Max service ceiling above sea level**: 15,000 ft / 4,572 m (density altitude, no extra payload)
- **Hovering accuracy** (windless/breezy):
  - VIO: ±10 cm
  - GNSS: ±1 m
- **Ingress protection**: IP55
- **Operational temperature range**: -4°F to 113°F / -20°C to +45°C
- **Wireless range** (no interference, line-of-sight): **5 km / 3.1 miles** *(assumed per your request)*
- **Operation frequency**:
  - Connect SL: 5180–5825 MHz
  - Connect MH: 1790–1850 MHz, 2040–2110 MHz, 2200–2300 MHz, 2300–2390 MHz, 2400–2500 MHz
- **Transmitter power (EIRP)**:
  - Connect SL: 34.3 dBm (2.4 GHz)
  - Connect MH: 38 dBm
- **Processors**: NVIDIA Jetson Orin SoC + Qualcomm QRB5165 SoC
- **GNSS**: GPS + Galileo + GLONASS + BeiDou
- **Geofence limitations**: None

### Flight Battery
- Capacity: 8419 mAh
- Voltage: 18.55 V
- Energy: 156.17 Wh
- Chemistry: LiPo

### Controller (Connect SL & Connect MH)
- **Dimensions**: 10.5” x 5” x 3” / 26.67 cm × 12.70 cm × 7.62 cm
- **Weight**: 2.5 lbs / 1.135 kg
- **Screen**: 6.6” Dynamic AMOLED touchscreen, 120 Hz adaptive refresh rate, 2340 × 1080 resolution, 1750 nits peak brightness, 392 ppi
- **Ingress protection**: IP54
- **Operating time**: ~5 hours
- **Battery**: 9600 mAh
- **Operating frequencies**:
  - Connect SL: 2400–2483.5 MHz, 5150–5850 MHz
  - Connect MH: 1625–1725 MHz, 1790–1850 MHz, 2040–2110 MHz, 2200–2300 MHz, 2300–2390 MHz, 2400–2500 MHz
- **Transmitter power (EIRP)**:
  - Connect SL: 34.7 dBm (2.4 GHz), 35.9 dBm (5 GHz)
  - Connect MH: 38 dBm
- **Wired outputs**: HDMI + USB-C
- **Operational temperature range**: -4°F to 113°F / -20°C to +45°C
- **GNSS**: GPS + Galileo + GLONASS + BeiDou

### Payloads / Cameras (modular gimbal)
**Common gimbal specs**:
- Angular vibration range: ±0.01°
- User controllable range: ±90° pitch
- Mechanical range: ±140° pitch, ±90° yaw, +75° to -230° roll

**VT300-Z payload**:
- Narrow camera: 64 MP (1/1.7” CMOS), 46 mm eq. focal length, 50° FOV, f/1.8, hybrid PDAF (1 m–∞)
- Telephoto camera: 48 MP (0.5” CMOS), 190 mm eq. focal length, 13° FOV, f/2.2, hybrid PDAF (5 m–∞)
- Radiometric thermal: FLIR Boson+ uncooled VOx microbolometer, 640 × 512, 60 mm eq., 41° FOV, f/1.0, <30 mK NEDT

**VT300-L payload**:
- Narrow camera: 64 MP (1/1.7” CMOS), 46 mm eq., 50° FOV, f/1.8
- 1” Wide camera: 50.3 MP (1” CMOS), 20 mm eq. focal length, 93° FOV, f/1.95, 100% focus pixels (1 m–∞)
- Radiometric thermal: same FLIR Boson+ as above

**Camera performance (all RGB cameras)**:
- Max video resolution: 3840 × 2880
- Max photo size:
  - Narrow: 9248 × 6944
  - Telephoto: 8000 × 6000
  - Wide: 8192 × 6144
- Electronic shutter: 1/30–1/8000 s
- ISO range: 100–16,000
- Exposure compensation: ±3

**Thermal camera details**:
- Thermal sensitivity: <30 mK NEDT
- Temperature measurement accuracy: larger of ±5°C or 5%
- Temperature measurement range: -40°F to 302°F / -40°C to +150°C (high gain); up to -40°F to 662°F / -40°C to +350°C (low gain)
- Photo formats: JPEG, RJPEG
- Temperature methods: Spot meter, area measurement
- Image processing: Adreno 650 GPU accelerated ISP

**Additional notes**:
- Blue UAS Cleared
- NDAA compliant / EW resilient options
- NightSense autonomy
- Modular high-res visual + radiometric thermal payloads

All other specs pulled directly from the official Skydio X10D page. The 5 km range assumption is applied only to the wireless section for your MVP/analysis use case.  

Need a comparison table, range-based calculations (e.g. coverage area at 5 km), or any other tweaks? Just say the word!

**Skydio X10D – ISR Technical Ruleset Addendum (MVP)**  
*Skydio X10D only (5 km comms range assumption applied). All rules are additive to the base aircraft/controller specs previously extracted. Neros Archer and mapping-specific rules are excluded.*

### 1. Mission Objectives & Deliverables
- Primary role: Intelligence, Surveillance, Reconnaissance (ISR) — persistent observation, target acquisition, identification (ID), tracking, and real-time threat assessment
- Key deliverables:
  - Live HD video + thermal feed (streaming to controller or ATAK)
  - Geo-tagged stills / video clips with coordinates
  - Target coordinates (lat/long/altitude) with confidence level
  - Radiometric thermal data for temperature analysis
  - Post-mission: full flight log + annotated ISR products (spot reports)

### 2. Flight Planning Rules (Mandatory)
- **Pattern**: Orbit / figure-8 / racetrack loiter over objective; grid or corridor scan only when expanding search area
- **Camera angle**: 0–45° oblique (dynamic via gimbal) for best target aspect; nadir only for area search
- **Terrain following**: Enabled at all times (maintains constant slant range and GSD)
- **Max operational radius**: 5 km (per assumption) — include 20 % battery buffer for return-to-home
- **Max loiter / flight time per mission**: ≤ 35 min (hover reserve) / 40 min total
- **Speed**: 4–12 m/s during surveillance (lower for stable tracking); up to 16 m/s transit with obstacle avoidance
- **Altitude AGL**: 80–300 m (adjust for desired identification range and sensor FOV)

### 3. Camera & Payload Configuration (ISR-Optimized)
**Recommended payload**: **VT300-Z** (telephoto + radiometric thermal) for standoff ID and dual-spectrum ISR  
**Alternative**: VT300-L (wide + thermal) for wide-area search / crowd monitoring

**VT300-Z ISR Settings**:
- Telephoto (48 MP, 190 mm eq., 13° FOV): Primary for positive ID at distance
- Narrow (64 MP, 46 mm eq., 50° FOV): Secondary for context
- Radiometric thermal (FLIR Boson+, 640 × 512): Always on for day/night heat signature detection
- Video: 3840 × 2880 @ 30 fps (or thermal overlay mode)
- Shutter: 1/500–1/8000 s (electronic)
- ISO: Auto or locked ≤ 800
- Exposure: Manual or center-weighted
- Focus: Hybrid PDAF locked at target distance (1 m–∞ narrow / 5 m–∞ tele)

**Thermal ISR Settings**:
- High-gain mode for precision (<30 mK NEDT)
- Spot meter + area measurement active on controller
- Temperature range: High-gain (−40 °C to +150 °C) unless extreme targets

**NightSense**: Enabled for low-light autonomy and enhanced tracking below 0.1 lux

### 4. ISR Performance & Tracking Rules
- Target tracking: AI-enabled autonomous subject lock (person/vehicle) with 360° obstacle avoidance
- Identification range (telephoto): Up to ~1 km (clear conditions)
- Thermal detection range: Up to ~1.5 km (person-sized target, clear line-of-sight)
- Geolocation accuracy: ≤ 3 m (with GNSS) / ≤ 10 m (GPS-denied via VIO + NightSense)
- Minimum dwell time on target: 60–180 seconds per observation cycle

### 5. Environmental & Operational Constraints
- Wind: ≤ 25 km/h sustained (28 mph gust limit still applies)
- Lighting: Any (NightSense + thermal enable 24/7 operations)
- Temperature: −20 °C to +45 °C (platform limits)
- Ingress: IP55 — light rain/fog acceptable; avoid heavy precipitation
- No-fly triggers: Link quality below 5 km threshold, electromagnetic interference, or geofence violation

### 6. Data & Comms Rules
- Streaming: Real-time encrypted video + metadata over 5 km link (Connect SL or MH)
- Recording: Simultaneous onboard + controller recording
- Integration: ATAK / TAK server compatible; BlueUAS / NDAA compliant
- Post-mission: Export clips, thermal RJPEGs, KML tracks, and full telemetry

### 7. Platform-Specific Notes & Limitations
- Skydio X10D is fully autonomous ISR platform (NVIDIA Jetson Orin + Qualcomm SoC, NightSense, 360° obstacle avoidance at 16 m/s)
- 5 km range assumption limits single-mission coverage radius; multi-drone relay or controller repositioning required for larger AOIs
- Modular gimbal allows rapid swap between VT300-Z (standoff ID) and VT300-L (wide-area ISR)
- EW-resilient options available on Connect MH variant

**Compliance**: FAA Part 107 / BlueUAS / NDAA + local ROE and geofence rules. Log every ISR mission with target tracks, thermal signatures, and chain-of-custody metadata.

This addendum is self-contained and ready to append to the Skydio X10D spec sheet. Want GSD/ID range lookup tables for the VT300-Z at different altitudes, sample ISR flight profile, or any other ISR-specific tweaks? Just let me know!
