"""Agent tools — the execution surface. The model only emits requests; THIS code runs.

Design rules from Phase 6 applied:
- least privilege (tools do the minimum; no shell, no filesystem writes)
- safe calculator (AST-whitelisted arithmetic — never eval())
- destructive actions are marked and routed through the approval gate
- errors return readable observations so the model can recover once
"""
from __future__ import annotations

import ast
import datetime as _dt
import ipaddress
import operator
import socket
from urllib.parse import urlparse

import httpx

from .. import config

# Allowed arithmetic operators only.
_OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Pow: operator.pow,
    ast.Mod: operator.mod,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}


def calculator(expression: str) -> str:
    """Safely evaluate an arithmetic expression (numbers and + - * / % **)."""

    def ev(node: ast.AST):
        if isinstance(node, ast.Expression):
            return ev(node.body)
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
            return node.value
        if isinstance(node, ast.BinOp) and type(node.op) in _OPS:
            return _OPS[type(node.op)](ev(node.left), ev(node.right))
        if isinstance(node, ast.UnaryOp) and type(node.op) in _OPS:
            return _OPS[type(node.op)](ev(node.operand))
        raise ValueError("only numbers and + - * / % ** are allowed")

    try:
        return str(ev(ast.parse(expression, mode="eval")))
    except Exception as e:  # readable observation for the model
        return f"tool error: cannot evaluate {expression!r} ({e})"


def time_now() -> str:
    return _dt.datetime.now(_dt.timezone.utc).isoformat(timespec="seconds")


def _validate_public_https_url(url: str) -> None:
    """Block non-HTTPS schemes and private/loopback/link-local/reserved hosts (SSRF guard)."""
    parsed = urlparse(url.strip())
    if parsed.scheme != "https":
        raise ValueError("only https:// URLs are allowed")
    host = (parsed.hostname or "").strip().lower()
    if not host:
        raise ValueError("missing hostname")
    if host in {"localhost", "0.0.0.0"} or host.endswith(".local") or host.endswith(".internal"):
        raise ValueError(f"blocked internal host: {host}")

    # Check literal IP first
    try:
        ip_obj = ipaddress.ip_address(host)
        if (
            ip_obj.is_private
            or ip_obj.is_loopback
            or ip_obj.is_link_local
            or ip_obj.is_multicast
            or ip_obj.is_reserved
            or ip_obj.is_unspecified
        ):
            raise ValueError(f"blocked non-public IP address: {host}")
    except ValueError as e:
        if "blocked" in str(e):
            raise

    # Resolve DNS and ensure all resolved addresses are public
    try:
        infos = socket.getaddrinfo(host, 443, proto=socket.IPPROTO_TCP)
    except socket.gaierror as e:
        raise ValueError(f"DNS resolution failed for {host}: {e}") from e

    for info in infos:
        addr = info[4][0]
        ip_obj = ipaddress.ip_address(addr)
        if (
            ip_obj.is_private
            or ip_obj.is_loopback
            or ip_obj.is_link_local
            or ip_obj.is_multicast
            or ip_obj.is_reserved
            or ip_obj.is_unspecified
        ):
            raise ValueError(f"blocked resolved non-public IP: {addr}")


def fetch_page(url: str) -> str:
    """Fetch a page as truncated text. Network tool — bounded, SSRF-guarded, and read-only."""
    try:
        _validate_public_https_url(url)
        r = httpx.get(url, timeout=15, follow_redirects=False, headers={"User-Agent": "agent-academy/0.1"})
        r.raise_for_status()
        text = " ".join(r.text.split())
        return text[:600] + ("…" if len(text) > 600 else "")
    except Exception as e:
        return f"tool error: fetch failed for {url} ({e})"


def send_email(to: str, subject: str, body: str = "") -> str:
    """DESTRUCTIVE (gated): in this build it records the would-send draft instead of sending."""
    return f"email queued to {to!r} with subject {subject!r} (demo mode: not actually sent)"


def search_web(query: str) -> str:
    """Search via a configurable endpoint; without one, returns an honest observation."""
    import os

    endpoint = os.getenv("SEARCH_API_URL", "")
    if not endpoint:
        return (
            "observation: no search backend configured (set SEARCH_API_URL) — "
            "tell the user live search is unavailable and work from what you have."
        )
    try:
        r = httpx.get(endpoint, params={"q": query}, timeout=15)
        r.raise_for_status()
        return r.text[:600]
    except Exception as e:
        return f"tool error: search failed ({e})"


TOOL_SPECS: dict[str, dict] = {
    "calculator": {
        "description": "Evaluate arithmetic expressions, e.g. '2+2' or '0.032*1000'.",
        "params": {"expression": "string"},
        "destructive": False,
        "run": lambda args: calculator(args["expression"]),
    },
    "time_now": {
        "description": "Current UTC time.",
        "params": {},
        "destructive": False,
        "run": lambda args: time_now(),
    },
    "fetch_page": {
        "description": "Fetch a URL and return truncated readable text.",
        "params": {"url": "string (must start with https://)"},
        "destructive": False,
        "run": lambda args: fetch_page(args["url"]),
    },
    "send_email": {
        "description": "Send an email. IRREVERSIBLE — always requires human approval.",
        "params": {"to": "string", "subject": "string", "body": "optional string"},
        "destructive": True,
        "run": lambda args: send_email(args["to"], args.get("subject", "(no subject)"), args.get("body", "")),
    },
    "search_web": {
        "description": "Web search (if configured).",
        "params": {"query": "string"},
        "destructive": False,
        "run": lambda args: search_web(args["query"]),
    },
}

TOOLS_SCHEMA = {
    name: {"description": t["description"], "params": t["params"]} for name, t in TOOL_SPECS.items()
}
