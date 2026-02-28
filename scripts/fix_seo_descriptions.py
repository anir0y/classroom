#!/usr/bin/env python3
"""Fix boilerplate SEO descriptions across all TryHackMe/CTF posts.

Replaces generic "solved by Animesh Roy. this is a walkthrough. read more..."
with meaningful, unique descriptions based on the room name and any useful
content already in the description.
"""

import re
import glob
import os

BASE = "/Users/animeshroy/Documents/git/classroom"
POST_DIR = f"{BASE}/content/post"

# Patterns to detect boilerplate
BOILERPLATE_PURE = re.compile(
    r"^(Try\s*Hack\s*Me\s+Room\s+)?\{?[\w\s\-:]+\}?\s*solved\s+by\s+Animesh\s+Roy\.\s*this\s+is\s+a\s+walkthrough\.\s*read\s+more\.\.\.\s*$",
    re.IGNORECASE,
)

# Detect "solved by" prefix pattern (with possible useful content after)
SOLVED_BY_PREFIX = re.compile(
    r"^(Try\s*Hack\s*Me\s+Room\s+)?\{?[\w\s\-:]+\}?\s*solved\s+by\s+Animesh\s+Roy\.?\s*",
    re.IGNORECASE,
)

WALKTHROUGH_SUFFIX = re.compile(
    r"\s*this\s+is\s+a\s+walkthrough\.\s*(read\s+more\.\.\.)?\s*",
    re.IGNORECASE,
)


def extract_room_name(title: str) -> str:
    """Extract the room/topic name from a TryHackMe post title."""
    name = title
    # Remove common prefixes
    for prefix in [
        "TryHackMe ",
        "Try Hack Me ",
        "Try Hack Me writeup | ",
        "Try Hack Me writeup ",
        "TryHackMe writeup ",
    ]:
        if name.lower().startswith(prefix.lower()):
            name = name[len(prefix):]
            break
    # Remove [WriteUp] suffix
    name = re.sub(r"\s*\[?\s*WriteUp\s*\]?\s*$", "", name, flags=re.IGNORECASE)
    return name.strip()


def generate_description(title: str, existing_useful: str = "") -> str:
    """Generate a meaningful SEO description from title and any useful content."""
    room = extract_room_name(title)

    if existing_useful:
        # Clean up the useful part
        useful = existing_useful.strip()
        useful = re.sub(r"^this\s+is\s+a\s+walkthrough\.\s*", "", useful, flags=re.IGNORECASE)
        useful = re.sub(r"\s*read\s+more\.\.\.\s*$", "", useful, flags=re.IGNORECASE)
        useful = useful.strip()
        if useful:
            # Capitalize first letter if needed
            if useful[0].islower():
                useful = useful[0].upper() + useful[1:]
            return f"TryHackMe {room} walkthrough — {useful}"

    # Generate based on room name keywords
    room_lower = room.lower()

    # Map known room names to better descriptions
    keyword_templates = {
        "buffer overflow": f"TryHackMe {room} walkthrough — practice stack-based buffer overflow exploitation with hands-on fuzzing, offset discovery, and shellcode execution.",
        "hydra": f"TryHackMe {room} walkthrough — learn brute-force password attacks using Hydra against SSH, FTP, and web login forms.",
        "django": f"TryHackMe {room} walkthrough — learn Django web framework fundamentals including models, views, templates, and common security pitfalls.",
        "meterpreter": f"TryHackMe {room} walkthrough — deep dive into Meterpreter post-exploitation payloads, in-memory execution, and privilege escalation techniques.",
        "inclusion": f"TryHackMe {room} walkthrough — exploit Local File Inclusion (LFI) vulnerabilities to read sensitive files and escalate privileges.",
        "phishing": f"TryHackMe {room} walkthrough — analyze phishing emails, identify social engineering techniques, and examine malicious headers and payloads.",
        "overpass": f"TryHackMe {room} walkthrough — investigate a compromised server, analyze attacker artifacts, and trace the intrusion timeline.",
        "kerberos": f"TryHackMe {room} walkthrough — learn Kerberos authentication attacks including AS-REP roasting, Kerberoasting, and golden ticket techniques.",
        "osquery": f"TryHackMe {room} walkthrough — learn endpoint monitoring with osquery SQL-based queries for process, network, and file system analysis.",
        "malware": f"TryHackMe {room} walkthrough — analyze malware samples using static and dynamic analysis techniques to understand malicious behavior.",
        "siem": f"TryHackMe {room} walkthrough — practice Security Information and Event Management log analysis and threat detection.",
        "nmap": f"TryHackMe {room} walkthrough — master Nmap network scanning techniques including service detection, scripting engine, and firewall evasion.",
        "windows": f"TryHackMe {room} walkthrough — explore Windows operating system fundamentals, security features, and common attack surfaces.",
        "linux": f"TryHackMe {room} walkthrough — strengthen Linux command-line skills with practical file system navigation, permissions, and scripting exercises.",
        "privilege": f"TryHackMe {room} walkthrough — learn privilege escalation techniques to elevate access from low-privilege shells to root.",
        "network": f"TryHackMe {room} walkthrough — practice network security fundamentals including scanning, enumeration, and protocol analysis.",
        "security analyst": f"TryHackMe {room} walkthrough — introduction to SOC analyst responsibilities, alert triage, and incident response fundamentals.",
        "forensic": f"TryHackMe {room} walkthrough — practice digital forensics techniques for evidence acquisition, analysis, and incident investigation.",
        "crypto": f"TryHackMe {room} walkthrough — crack password hashes using various tools and techniques including dictionary attacks and rainbow tables.",
        "hash": f"TryHackMe {room} walkthrough — crack password hashes using various tools and techniques including dictionary attacks and rainbow tables.",
        "ctf": f"TryHackMe {room} walkthrough — solve CTF challenges covering enumeration, exploitation, and privilege escalation on a vulnerable target.",
        "web": f"TryHackMe {room} walkthrough — exploit web application vulnerabilities and practice common web attack techniques.",
        "exploit": f"TryHackMe {room} walkthrough — identify and exploit vulnerabilities in target systems to gain unauthorized access.",
        "ffuf": f"TryHackMe {room} walkthrough — master web fuzzing with ffuf for directory brute-forcing, parameter discovery, and virtual host enumeration.",
        "git": f"TryHackMe {room} walkthrough — exploit exposed Git repositories to extract secrets, credentials, and sensitive source code.",
        "kubernetes": f"TryHackMe {room} walkthrough — explore container security and Kubernetes cluster exploitation techniques.",
        "empire": f"TryHackMe {room} walkthrough — learn post-exploitation using PowerShell Empire for command-and-control operations.",
        "operating system": f"TryHackMe {room} walkthrough — understand operating system security fundamentals including hardening, access controls, and common weaknesses.",
    }

    for keyword, template in keyword_templates.items():
        if keyword in room_lower:
            return template

    # Generic but still unique description
    return f"TryHackMe {room} walkthrough with step-by-step solutions — enumeration, exploitation, and privilege escalation on the {room} challenge room."


def process_file(filepath: str) -> tuple[bool, str]:
    """Process a single markdown file and fix its description.

    Returns (changed, message).
    """
    with open(filepath, "r") as f:
        content = f.read()

    # Extract front matter
    parts = content.split("---", 2)
    if len(parts) < 3:
        return False, "no front matter"

    front_matter = parts[1]
    body = parts[2]

    # Find description line
    desc_match = re.search(r'^description:\s*"?(.*?)"?\s*$', front_matter, re.MULTILINE)
    if not desc_match:
        return False, "no description field"

    old_desc = desc_match.group(1).strip()

    # Check if it's boilerplate
    is_pure_boilerplate = bool(BOILERPLATE_PURE.match(old_desc))
    has_solved_by = bool(SOLVED_BY_PREFIX.match(old_desc))

    if not (is_pure_boilerplate or has_solved_by):
        return False, "description is already custom"

    # Extract title
    title_match = re.search(r'^title:\s*"?(.*?)"?\s*$', front_matter, re.MULTILINE)
    if not title_match:
        return False, "no title"
    title = title_match.group(1).strip()

    # Extract useful content from hybrid descriptions
    useful = ""
    if has_solved_by and not is_pure_boilerplate:
        remaining = SOLVED_BY_PREFIX.sub("", old_desc).strip()
        remaining = WALKTHROUGH_SUFFIX.sub("", remaining).strip()
        if remaining and remaining.lower() != "read more...":
            useful = remaining

    new_desc = generate_description(title, useful)

    # Replace description in front matter
    new_fm = re.sub(
        r'^description:\s*"?.*?"?\s*$',
        f'description: "{new_desc}"',
        front_matter,
        flags=re.MULTILINE,
    )

    new_content = f"---{new_fm}---{body}"
    with open(filepath, "w") as f:
        f.write(new_content)

    return True, f"'{old_desc[:50]}...' -> '{new_desc[:60]}...'"


def main():
    files = sorted(glob.glob(f"{POST_DIR}/*.md"))
    changed = 0
    skipped = 0

    for filepath in files:
        was_changed, msg = process_file(filepath)
        basename = os.path.basename(filepath)
        if was_changed:
            changed += 1
            print(f"  ✓ {basename}: {msg}")
        else:
            skipped += 1

    print(f"\nDone: {changed} descriptions improved, {skipped} skipped")


if __name__ == "__main__":
    main()
