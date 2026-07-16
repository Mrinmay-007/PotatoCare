import platform
import requests





# ---------- IP-based location ----------
def get_location_ip():
    try:
        resp = requests.get("https://ipinfo.io/json", timeout=5)
        data = resp.json()
        lat, lon = map(float, data["loc"].split(","))
        return lat, lon
    except Exception as e:
        print("IP-based location failed:", e)
        return None, None

# ---------- GPS-based location (Android only) ----------
def get_location_android_gps():
    try:
        from plyer import gps  # type: ignore
        coords = {}

        def gps_callback(lat, lon):
            coords["lat"] = lat
            coords["lon"] = lon
            gps.stop()

        gps.configure(on_location=gps_callback)
        gps.start()

        import time
        for _ in range(20):  # wait max ~10s
            if "lat" in coords:
                return coords["lat"], coords["lon"]
            time.sleep(0.5)

    except Exception as e:
        print("Android GPS failed:", e)

    return None, None

# ---------- Unified function ----------
def get_device_location():
    system = platform.system()

    if system == "Windows":
        return get_location_ip()

    elif system == "Linux":  # Android usually reports "Linux"
        lat, lon = get_location_android_gps()
        if lat and lon:
            return lat, lon
        else:
            return get_location_ip()

    return get_location_ip()