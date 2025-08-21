#!/usr/bin/env python3
"""
Lightweight Windows Print Ingest Agent

- Monitors Windows PrintService Operational EventLog for completed print jobs
- Extracts username, document name, pages, and printer name
- Maps to configured print type and quantity
- Sends minimal signed JSON to backend ingest endpoint via HMAC (no secrets in URL)

Security:
- Uses HMAC-SHA256 with timestamp to prevent tampering and replay (5 min window)
- No long-running elevated privileges required

Configuration sources (precedence):
1) Environment variables
2) JSON config file next to the executable: agent.config.json (or AGENT_CONFIG_PATH)
"""

import os
import json
import time
import hmac
import hashlib
import subprocess
import threading
import queue
from typing import Optional, Dict, Any
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
import socketserver

def _base_dir() -> str:
    if getattr(sys, "frozen", False):  # PyInstaller executable
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))

BASE_DIR = _base_dir()
DEFAULT_CONFIG_PATH = os.path.join(BASE_DIR, "agent.config.json")

def _load_config_file() -> Dict[str, Any]:
    path = os.environ.get("AGENT_CONFIG_PATH", DEFAULT_CONFIG_PATH)
    try:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        print(f"config load error: {e}")
    return {}

_CONFIG = _load_config_file()

def _cfg(key: str, env: str, default: Any = None):
    v = os.environ.get(env)
    if v is not None and v != "":
        return v
    v = _CONFIG.get(key)
    return default if v is None else v

INGEST_URL = _cfg("printIngestUrl", "PRINT_INGEST_URL", "http://localhost:3000/api/print-jobs/ingest")
HMAC_SECRET = _cfg("hmacSecret", "PRINT_INGEST_HMAC_SECRET", "")
LOCAL_NOTIFY_PORT = int(_cfg("localNotifyPort", "LOCAL_NOTIFY_PORT", 57981) or 57981)
LOCAL_NOTIFY_TOKEN = _cfg("localNotifyToken", "LOCAL_NOTIFY_TOKEN", "")

# Map printer names to default print type (can be customized via env)
# Example: PRINTER_MAP='{"Canon Color":"A4Color","Canon B/W":"A4BW"}'
PRINTER_MAP: Dict[str, str] = {}
try:
    env_map = os.environ.get("PRINTER_MAP")
    if env_map:
        PRINTER_MAP = json.loads(env_map)
    else:
        PRINTER_MAP = _CONFIG.get("printerMap", {}) or {}
except Exception:
    PRINTER_MAP = {}

# Optional mapping from Windows usernames to app usernames/codes
# Example: USERNAME_MAP='{"john":"401","mary":"402"}'
USERNAME_MAP: Dict[str, str] = {}
try:
    env_umap = os.environ.get("USERNAME_MAP")
    if env_umap:
        USERNAME_MAP = json.loads(env_umap)
    else:
        USERNAME_MAP = _CONFIG.get("usernameMap", {}) or {}
    USERNAME_MAP = {str(k).lower(): str(v) for k, v in USERNAME_MAP.items()}
except Exception:
    USERNAME_MAP = {}

# Optional mapping from IP -> deviceName with default fallbackName
# Example: ipToDeviceName '{"192.168.3.41":"Canon B/W","192.168.3.42":"Canon Color","default":"Canon Color"}'
IP_TO_NAME: Dict[str, str] = {}
DEFAULT_DEVICE_NAME = "Canon Color"
try:
    raw_map = _CONFIG.get("ipToDeviceName")
    env_ip_map = os.environ.get("IP_TO_NAME")
    if env_ip_map:
        raw_map = json.loads(env_ip_map)
    if isinstance(raw_map, dict):
        IP_TO_NAME = {str(k): str(v) for k, v in raw_map.items() if k != "default"}
        DEFAULT_DEVICE_NAME = str(raw_map.get("default", DEFAULT_DEVICE_NAME))
except Exception:
    IP_TO_NAME = {}

# Built-in fallback mapping (no config required)
if not IP_TO_NAME:
    IP_TO_NAME = {
        "192.168.3.41": "Canon B/W",
        "192.168.3.42": "Canon Color",
        "192.168.3.43": "Brother",
        "192.168.6.41": "Κυδωνιών",
    }
    DEFAULT_DEVICE_NAME = "Canon Color"

def _ps(cmd: str) -> str:
    try:
        out = subprocess.check_output(["powershell", "-NoProfile", "-Command", cmd], stderr=subprocess.STDOUT)
        return out.decode("utf-8", errors="ignore").strip()
    except Exception as e:
        return ""

def _resolve_printer_ip(printer_name: str) -> Optional[str]:
    if not printer_name:
        return None
    # 1) Try PowerShell Get-Printer -> PortName
    port = _ps(f"(Get-Printer -Name '{printer_name.replace("'", "''")}' -ErrorAction SilentlyContinue).PortName")
    if port:
        # If the port string already looks like an IP
        if all(c.isdigit() or c == '.' for c in port) and port.count('.') == 3:
            return port
        # 2) Resolve via Get-PrinterPort
        ip = _ps(f"(Get-PrinterPort -Name '{port.replace("'", "''")}' -ErrorAction SilentlyContinue).PrinterHostAddress")
        if ip:
            return ip
        # 3) CIM fallback
        ip = _ps(f"(Get-CimInstance -ClassName Win32_TCPIPPrinterPort -Filter \"Name='{port.replace("'", "''")}'\").HostAddress")
        if ip:
            return ip
    return None

def _now_unix() -> int:
    return int(time.time())

def _sign(body: str, ts: int) -> str:
    mac = hmac.new(HMAC_SECRET.encode("utf-8"), f"{ts}.{body}".encode("utf-8"), hashlib.sha256)
    return mac.hexdigest()

def _post(payload: Dict[str, Any]) -> None:
    import urllib.request
    import urllib.error
    body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    ts = _now_unix()
    sig = _sign(body.decode("utf-8"), ts)
    req = urllib.request.Request(
        INGEST_URL,
        data=body,
        headers={
            "Content-Type": "application/json",
            "x-timestamp": str(ts),
            "x-signature": sig,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            if resp.status >= 300:
                print(f"ingest failed: {resp.status}")
    except urllib.error.HTTPError as e:
        try:
            msg = e.read().decode("utf-8", errors="ignore")
        except Exception:
            msg = str(e)
        print(f"ingest failed: {e.code} {msg[:200]}")
    except Exception as e:
        print(f"ingest error: {e}")

def _parse_event_xml(xml_text: str) -> Optional[Dict[str, Any]]:
    # Minimal XML parsing via string search to avoid heavy deps
    # We look for common fields in Microsoft-Windows-PrintService/Operational 307 event
    def _tag(name: str) -> Optional[str]:
        start_tag = f"<{name}>"
        end_tag = f"</{name}>"
        start = xml_text.find(start_tag)
        if start == -1:
            return None
        start += len(start_tag)
        end = xml_text.find(end_tag, start)
        if end == -1:
            return None
        return xml_text[start:end]

    # The Event XML has multiple Data elements with Name attributes; we fallback to simple substring checks
    # Extract username
    username = None
    for key in ["param3", "User"]:
        v = _tag(key)
        if v:
            username = v
            break
    # Extract printer name
    printer = None
    for key in ["param2", "PrinterName", "param4"]:
        v = _tag(key)
        if v:
            printer = v
            break
    # Extract total pages
    pages = None
    for key in ["TotalPages", "PagesPrinted", "param7", "param6"]:
        v = _tag(key)
        if v and v.isdigit():
            pages = int(v)
            break

    if not username or not pages:
        return None
    # Normalize DOMAIN\\user to just user
    if "\\" in username:
        username = username.split("\\")[-1]
    return {"username": username.strip(), "printer": printer or "", "pages": pages}

def _map_to_type(printer_name: str) -> str:
    t = PRINTER_MAP.get(printer_name)
    if t in {
        "A4BW","A4Color","A3BW","A3Color","RizochartoA3","RizochartoA4","ChartoniA3","ChartoniA4","Autokollito"
    }:
        return t  # trusted mapping from env
    # Fallback heuristics
    name = (printer_name or "").lower()
    if "color" in name:
        return "A4Color"
    return "A4BW"

def _consume_events(event_queue: "queue.Queue[str]") -> None:
    pending: Dict[str, Dict[str, Any]] = {}
    def put_pending(key: str, data: Dict[str, Any]):
        pending[key] = { **data, "_ts": _now_unix() }
    def get_pending(key: str) -> Optional[Dict[str, Any]]:
        prune_before = _now_unix() - 300
        # prune
        for k in list(pending.keys()):
            if pending[k].get("_ts", 0) < prune_before:
                pending.pop(k, None)
        return pending.pop(key, None)

    # Local notify server
    class Handler(BaseHTTPRequestHandler):
        def do_POST(self):  # type: ignore
            try:
                if self.path != "/notify":
                    self.send_response(404)
                    self.end_headers()
                    return
                length = int(self.headers.get('Content-Length','0'))
                raw = self.rfile.read(length).decode('utf-8', errors='ignore') if length > 0 else '{}'
                data = json.loads(raw)
                token = self.headers.get('x-agent-token') or data.get('token') or ''
                if LOCAL_NOTIFY_TOKEN and token != LOCAL_NOTIFY_TOKEN:
                    self.send_response(401)
                    self.end_headers()
                    return
                # expected: accountUsername, accountPassword, type, quantity, deviceName or deviceIP
                device_name = str(data.get('deviceName') or '')
                device_ip = str(data.get('deviceIP') or '')
                info = {
                    'accountUsername': str(data.get('accountUsername') or ''),
                    'accountPassword': str(data.get('accountPassword') or ''),
                    'type': str(data.get('type') or ''),
                    'quantity': int(data.get('quantity') or 0),
                    'deviceName': device_name,
                    'deviceIP': device_ip,
                }
                if device_ip:
                    put_pending(f"ip:{device_ip}", info)
                if device_name:
                    put_pending(f"name:{device_name.lower()}", info)
                self.send_response(200)
                self.end_headers()
            except Exception as e:
                try:
                    self.send_response(400)
                    self.end_headers()
                except Exception:
                    pass
        def log_message(self, format, *args):  # silence default logging
            return

    def serve_local():
        with socketserver.TCPServer(("127.0.0.1", LOCAL_NOTIFY_PORT), Handler) as httpd:
            httpd.serve_forever()

    threading.Thread(target=serve_local, daemon=True).start()
    while True:
        xml = event_queue.get()
        if xml is None:
            break
        info = _parse_event_xml(xml)
        if not info:
            continue
        uname = str(info["username"]).strip()
        mapped = USERNAME_MAP.get(uname.lower(), uname)
        pname = str(info.get("printer") or "")
        ip = _resolve_printer_ip(pname)
        device_name = IP_TO_NAME.get(ip or "", None) or pname or DEFAULT_DEVICE_NAME
        # Try to overlay pending details from local notify
        overlay = get_pending(f"ip:{ip}") if ip else None
        if (not overlay) and device_name:
            overlay = get_pending(f"name:{device_name.lower()}")

        ptype = _map_to_type(device_name)
        qty = int(info["pages"])
        acc_user = ""
        acc_pass = ""
        if overlay:
            ptype = str(overlay.get('type') or ptype)
            try:
                qv = int(overlay.get('quantity') or qty)
                if qv > 0: qty = qv
            except Exception:
                pass
            acc_user = str(overlay.get('accountUsername') or "")
            acc_pass = str(overlay.get('accountPassword') or "")
        lookup_username = acc_user if acc_user else mapped
        payload = {
            "username": lookup_username,
            "type": ptype,
            "quantity": qty,
            "deviceName": device_name,
            "deviceIP": ip or "",
        }
        if acc_user:
            payload["accountUsername"] = acc_user
        if acc_pass:
            payload["accountPassword"] = acc_pass
        _post(payload)

def main() -> None:
    if not HMAC_SECRET:
        print("Missing PRINT_INGEST_HMAC_SECRET")
        return

    # We use wevtutil to subscribe to Microsoft-Windows-PrintService/Operational EventLog
    # Event ID 307 indicates a printed document
    query = (
        "<QueryList>"
        "  <Query Id=\"0\" Path=\"Microsoft-Windows-PrintService/Operational\">"
        "    <Select Path=\"Microsoft-Windows-PrintService/Operational\">*" 
        "[System[(EventID=307)]]" 
        "</Select>"
        "  </Query>"
        "</QueryList>"
    )

    # Start a background reader thread to parse events
    q: "queue.Queue[str]" = queue.Queue(maxsize=100)
    t = threading.Thread(target=_consume_events, args=(q,), daemon=True)
    t.start()

    # Use wevtutil qe for polling in a loop to keep the agent simple and robust
    # Alternatively, one could use PowerShell Get-WinEvent -FilterXPath with -MaxEvents 1 and -Wait
    seen: set[str] = set()
    while True:
        try:
            # Fetch the most recent 5 events
            cmd = [
                "wevtutil",
                "qe",
                "Microsoft-Windows-PrintService/Operational",
                "/f:RenderedXml",
                "/c:5",
                "/q:" + query,
            ]
            out = subprocess.check_output(cmd, stderr=subprocess.STDOUT, shell=False)
            text = out.decode("utf-8", errors="ignore")
            # Split on closing Event tag
            for chunk in text.split("</Event>"):
                if "<Event" not in chunk:
                    continue
                xml = chunk + "</Event>"
                # Create a simple hash to dedupe in this session
                key = str(hash(xml))
                if key in seen:
                    continue
                seen.add(key)
                if q.full():
                    # Drop oldest by getting and ignoring
                    try:
                        q.get_nowait()
                    except Exception:
                        pass
                q.put(xml)
        except subprocess.CalledProcessError as e:
            print(f"wevtutil error: {e}")
        except Exception as e:
            print(f"agent loop error: {e}")
        time.sleep(3)

if __name__ == "__main__":
    main()


