#!/usr/bin/env python3
"""
Local Print Proxy

- Listens on a local TCP port (e.g., 127.0.0.1:9100) for RAW print jobs
- Before forwarding a job to the real printer, requests per-job credentials
  from a local HTTP endpoint provided by the billing app (or shows a minimal
  built-in prompt if configured), then injects vendor-specific accounting
  headers (pluggable) and forwards to the target printer IP/port.
- Posts the same credentials to the existing agent local notify API so the
  backend can catalog the job (already implemented in the repo).

This is vendor-agnostic plumbing. Vendor-specific injection is handled via
simple strategy functions selected per printer profile.

Security: This proxy is intended to run locally and bind only to 127.0.0.1.
Do not expose it to the network. Per-job credentials are kept in-memory only
for the duration of the job processing.
"""

import os
import sys
import json
import socket
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Dict, Any, Optional, Tuple
import socketserver
import urllib.request


def _base_dir() -> str:
    if getattr(sys, "frozen", False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))


BASE_DIR = _base_dir()


def _read_json(path: str) -> Dict[str, Any]:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


CONFIG_PATH = os.environ.get("PRINT_PROXY_CONFIG", os.path.join(BASE_DIR, "print_proxy.config.json"))
CONFIG: Dict[str, Any] = _read_json(CONFIG_PATH)


def cfg(key: str, default: Any = None):
    v = CONFIG.get(key)
    return default if v is None else v


class VendorInjector:
    """Strategy for injecting accounting info into RAW job bytes.

    Each function takes (job_bytes, account_username, account_password, profile)
    and returns possibly-modified bytes.
    """

    @staticmethod
    def none(job: bytes, user: str, pwd: str, profile: Dict[str, Any]) -> bytes:
        return job

    @staticmethod
    def pjl_header(job: bytes, user: str, pwd: str, profile: Dict[str, Any]) -> bytes:
        # Basic PJL preamble. Real models require precise keys; this is a placeholder.
        # Example keys (vary by vendor): SET DEPT=xxxx, SET USERNAME=..., SET ACCT=...
        lines = [
            b"\x1B%-12345X@PJL JOB\r\n",
        ]
        if user:
            key = str(profile.get("pjlUserKey") or "USER").upper()
            lines.append(f"@PJL SET {key}={user}\r\n".encode("ascii", errors="ignore"))
        if pwd:
            keyp = str(profile.get("pjlPassKey") or "PASS").upper()
            lines.append(f"@PJL SET {keyp}={pwd}\r\n".encode("ascii", errors="ignore"))
        # Allow arbitrary extra PJL lines from config
        for extra in profile.get("pjlExtra", []):
            try:
                lines.append((extra + "\r\n").encode("ascii", errors="ignore"))
            except Exception:
                pass
        lines.append(b"@PJL ENTER LANGUAGE = PCL\r\n")
        preamble = b"".join(lines)
        trailer = b"\x1B%-12345X"  # Universal reset
        return preamble + job + trailer


INJECTORS = {
    "none": VendorInjector.none,
    "pjl": VendorInjector.pjl_header,
}


def http_post(url: str, headers: Dict[str, str], data: Dict[str, Any]) -> Tuple[int, str]:
    body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(url, data=body, method="POST")
    for k, v in headers.items():
        req.add_header(k, v)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            text = resp.read().decode("utf-8", errors="ignore")
            return resp.getcode() or 0, text
    except Exception as e:
        return 0, str(e)


class CredentialServer(BaseHTTPRequestHandler):
    """Minimal local HTTP server to receive per-job credentials from your app UI.

    POST /set
      { token, deviceIP, deviceName, accountUsername, accountPassword, type, quantity }

    The record is kept for a short TTL and retrieved by the print path using
    deviceIP or deviceName.
    """

    pending: Dict[str, Dict[str, Any]] = {}

    @staticmethod
    def put_pending(key: str, data: Dict[str, Any]):
        data = {**data, "_ts": int(time.time())}
        CredentialServer.pending[key] = data

    @staticmethod
    def get_pending(key: str) -> Optional[Dict[str, Any]]:
        now = int(time.time())
        prune_before = now - int(cfg("pendingTtlSeconds", 300))
        for k in list(CredentialServer.pending.keys()):
            if int(CredentialServer.pending[k].get("_ts", 0)) < prune_before:
                CredentialServer.pending.pop(k, None)
        return CredentialServer.pending.pop(key, None)

    def _ok(self):
        self.send_response(200)
        self.end_headers()

    def _unauthorized(self):
        self.send_response(401)
        self.end_headers()

    def _notfound(self):
        self.send_response(404)
        self.end_headers()

    def do_POST(self):  # type: ignore
        try:
            if self.path != "/set":
                self._notfound()
                return
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length).decode("utf-8", errors="ignore") if length > 0 else "{}"
            data = json.loads(raw)
            token = self.headers.get("x-proxy-token") or str(data.get("token") or "")
            expected = str(cfg("localProxyToken", ""))
            if expected and token != expected:
                self._unauthorized()
                return
            device_ip = str(data.get("deviceIP") or "")
            device_name = str(data.get("deviceName") or "")
            info = {
                "accountUsername": str(data.get("accountUsername") or ""),
                "accountPassword": str(data.get("accountPassword") or ""),
                "type": str(data.get("type") or ""),
                "quantity": int(data.get("quantity") or 0),
                "deviceName": device_name,
                "deviceIP": device_ip,
            }
            if device_ip:
                CredentialServer.put_pending(f"ip:{device_ip}", info)
            if device_name:
                CredentialServer.put_pending(f"name:{device_name.lower()}", info)
            self._ok()
        except Exception:
            self.send_response(400)
            self.end_headers()

    def log_message(self, format, *args):  # silence default HTTP logging
        return


def start_http_server() -> threading.Thread:
    port = int(cfg("localHttpPort", 57991) or 57991)
    server = socketserver.TCPServer(("127.0.0.1", port), CredentialServer)
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    return t


def get_profile_for_target(device_ip: str) -> Dict[str, Any]:
    profiles = cfg("printerProfiles", {}) or {}
    return profiles.get(device_ip, profiles.get("default", {}))


def notify_agent_overlay(info: Dict[str, Any]):
    # Forward to existing agent local notify so backend links credentials to the job
    port = int(cfg("agentNotifyPort", 57981) or 57981)
    token = str(cfg("agentNotifyToken", "") or "")
    url = f"http://127.0.0.1:{port}/notify"
    headers = {}
    if token:
        headers["x-agent-token"] = token
    http_post(url, headers, info)


class RawProxyHandler(socketserver.BaseRequestHandler):
    def handle(self):  # type: ignore
        # Determine target from config (single target or by port mapping)
        listen_name = str(self.server.server_address[1])  # port as string
        listeners = cfg("listeners", {}) or {}
        listener = listeners.get(listen_name, {})
        device_ip = str(listener.get("targetIP") or cfg("defaultTargetIP", ""))
        device_port = int(listener.get("targetPort") or cfg("defaultTargetPort", 9100) or 9100)

        # Read entire job into memory; for large jobs, consider streaming with temp file
        self.request.settimeout(30)
        chunks = []
        total = 0
        while True:
            try:
                data = self.request.recv(64 * 1024)
            except socket.timeout:
                break
            if not data:
                break
            chunks.append(data)
            total += len(data)
            # small safety cap
            if total > int(cfg("maxJobBytes", 50 * 1024 * 1024)):
                break
        job = b"".join(chunks)

        # Fetch pending credentials for this device
        overlay = CredentialServer.get_pending(f"ip:{device_ip}") if device_ip else None
        if (not overlay) and listener.get("deviceName"):
            overlay = CredentialServer.get_pending(f"name:{str(listener.get('deviceName')).lower()}")
        account_user = str(overlay.get("accountUsername") or "") if overlay else ""
        account_pwd = str(overlay.get("accountPassword") or "") if overlay else ""

        # Choose injector based on profile
        profile = get_profile_for_target(device_ip)
        injector_name = str(profile.get("injector") or "none")
        injector = INJECTORS.get(injector_name, VendorInjector.none)
        try:
            out_job = injector(job, account_user, account_pwd, profile)
        except Exception:
            out_job = job

        # Forward to real printer
        try:
            with socket.create_connection((device_ip, device_port), timeout=10) as s:
                s.sendall(out_job)
        except Exception:
            pass

        # Notify agent for DB cataloging (best-effort)
        if overlay:
            info = {
                "deviceIP": device_ip,
                "deviceName": str(listener.get("deviceName") or ""),
                "type": str(overlay.get("type") or ""),
                "quantity": int(overlay.get("quantity") or 0),
                "accountUsername": account_user,
                "accountPassword": account_pwd,
            }
            notify_agent_overlay(info)


class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True


def start_raw_listener(port: int) -> ThreadedTCPServer:
    srv = ThreadedTCPServer(("127.0.0.1", port), RawProxyHandler)
    t = threading.Thread(target=srv.serve_forever, daemon=True)
    t.start()
    return srv


def main():
    # Start HTTP endpoint for credentials
    start_http_server()
    # Start one or more RAW listeners
    listeners = cfg("listeners", {}) or {"9100": {}}
    servers = []
    for port_str in listeners.keys():
        try:
            p = int(port_str)
        except Exception:
            continue
        servers.append(start_raw_listener(p))
    # Sleep forever
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()


