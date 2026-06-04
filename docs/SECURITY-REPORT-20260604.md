# 🔒 DraftMind VPS Security Report — 2026-06-04

## Incident Summary

- **Date:** 2026-06-04, 02:28 PM – 03:05 PM CST
- **Triggered by:** 502 Bad Gateway on draftmind.web.id, caused by cryptominer consuming 2.4GB RAM
- **Root cause:** Cryptominer malware (`syslog-ng-a349bc45`) spawned as PM2 process, using 171% CPU
- **Impact:** PM2 crash, Next.js OOM, DraftMind unreachable, 1299 failed SSH brute force attempts logged

## Malware Identified

### Process: `syslog-ng-a349bc45`

- **Binary path:** `/home/ubuntu/.syslog-b3d84dd0/syslog-ng-a349bc45`
- **Watchdog:** `bin/syslog-helper` (PID 72314) — orphans miner, respawns via PPID=1
- **C2 server:** `120.224.114.212` (stored in `/dev/shm/bridge_srv_ip_d-r21836`)
- **Persistence:** Registered as PM2-managed process
- **Payload files:**
  - `/tmp/python3` (1MB miner binary)
  - `/tmp/libsystem.so` (26KB helper)
  - `/tmp/bridge_file_*`, `/tmp/bridge_miner_patterns`, `/tmp/bridge_clients/`
  - `/tmp/cpuidle_support.log`, `/tmp/setRps.log`, `/tmp/set_xps.log`, etc. (resource pinning)
  - `/dev/shm/bridge_srv_ip_d-r21836`, `/dev/shm/.miner_fail_72314`, `/dev/shm/duet/`
  - `/var/tmp/.bin/`

### Previous infection (cleaned May 29, 2026)

- **Payload:** `lava.x86_64` + `/tmp/lava.x86_64`
- **Persistence:** `.bashrc` line: `(pgrep -f lava.x86_64 >/dev/null || /tmp/lava.x86_64 &) >/dev/null 2>&1`
- **Status:** Previously cleaned by automated tool

## Actions Taken

### 1. Malware Removal ✅

- Killed all malicious processes: `syslog-helper`, `syslog-ng-a349bc45`, miner, bridge\_\*, cpuidle
- Removed all malicious files from `/dev/shm/`, `/var/tmp/`, `/tmp/`
- Verified no suspicious processes in `ps aux` after cleanup

### 2. SSH Hardening ✅

- `PermitRootLogin no` (was: yes)
- `PasswordAuthentication no` (was: yes)
- `PubkeyAuthentication yes` (confirmed)
- `MaxAuthTries 3` (was: 6)
- `ClientAliveInterval 300` (idle timeout)
- `X11Forwarding no`
- Duplicate config lines removed

### 3. Firewall (UFW) ✅

```
Status: active
Rules:
  [ 1] OpenSSH    ALLOW IN    Anywhere
  [ 2] 80/tcp     ALLOW IN    Anywhere
  [ 3] 443/tcp    ALLOW IN    Anywhere
  [ 4] 80.64.16.241  DENY OUT  Anywhere (IP that brute-forced)
  [ 5] Anywhere       DENY IN  80.64.16.241
  [ 6] Anywhere       DENY IN  120.224.114.212  # C2 server
Default: deny incoming, allow outgoing
```

### 4. Fail2ban (aggressive settings) ✅

```
[sshd]
maxretry = 3
bantime = 86400 (24h)
findtime = 3600
Currently banned: 50 IPs (157 total)
```

### 5. System Patches ✅

- 118 packages upgraded via `apt upgrade`
- Old kernel headers autoremoved

### 6. PM2 Auto-start on Reboot ✅

```
/etc/systemd/system/pm2-ubuntu.service
Restart=on-failure
ExecStart=pm2 resurrect
pm2 save → dump.pm2
```

### 7. Monitoring ✅

- Health check every 5 min via `/etc/cron.d/draftmind-monitor`
- Script: `~/.monitoring/draftmind-health.sh`
- Checks: app down, public URL, memory >90%, CPU hog, suspicious processes
- Auto-restart PM2 if app down
- Optional Telegram alerts (add bot token to `~/.monitoring/tg-token`)

### 8. Sysctl Security ✅

```
/etc/sysctl.d/99-security.conf:
- net.ipv4.ip_forward = 0
- net.ipv4.conf.all.accept_redirects = 0
- net.ipv4.conf.all.accept_source_route = 0
- net.ipv4.tcp_syncookies = 1
- net.ipv4.icmp_echo_ignore_broadcasts = 1
```

### 9. Security Tools Installed ✅

- `rkhunter` — rootkit hunter (baseline set)
- `debsums` — package integrity verification

### 10. /tmp & /dev/shm hardening ✅

Added to `/etc/fstab`:

```
tmpfs /tmp tmpfs defaults,noexec,nosuid,nodev,size=2G 0 0
tmpfs /dev/shm tmpfs defaults,noexec,nosuid,nodev 0 0
```

_(Effective on next reboot — not remounted live to avoid breaking running processes)_

## Current Security State

```
Firewall:     UFW active, deny incoming by default
SSH:          root=no, password=no, pubkey=yes, maxauth=3
Fail2ban:     active, 3 retries = 24h ban
PM2 startup:  systemd enabled, auto-resurrect on boot
Monitoring:   cron every 5min, auto-restart on failure
RKHunter:     baseline set
Disk:         16% used (67G free)
Memory:       703MB/7.4GB
Uptime:       1 day, 13 hours
```

## Recommendations for Hakim

### Immediate (do now)

1. ✅ **Change Supabase API keys** — if `.env.production` was leaked, rotate `SUPABASE_SERVICE_ROLE_KEY`
2. ⚠️ **Review GitHub deploy keys** — check for unauthorized keys in GitHub settings
3. ⚠️ **Change Hetzner/cloud provider password** — if password login was ever used

### Short-term (this week)

4. **Add Telegram alert token** — `echo "YOUR_BOT_TOKEN" > ~/.monitoring/tg-token`
5. **Reboot VPS** — to apply `/tmp` and `/dev/shm` noexec mounts
6. **Run rkhunter scan** — `sudo rkhunter --check --skip-keypress`

### Medium-term (this month)

7. **Consider SSH key rotation** — generate new keys, remove old ones
8. **Automated backup** — Supabase data backup to external storage
9. **Debian 12 security updates** — set up `unattended-upgrades` for auto-patching
10. **Audit nginx config** — ensure proper headers, rate limiting

### Known Issues

- UFW `status verbose` shows "problem running sysctl" (IPv6 sysctl issue — cosmetic, rules still work)
- `/tmp` noexec mount: effective after reboot; current /tmp files will become inaccessible on reboot (only 7MB, all temp files)
- `chkrootkit` not installed (rkhunter is sufficient alternative)
- Previous malware was cleaned May 29 but reinfection occurred — likely via different vector than bashrc

---

**Report generated by Lyra Aveline | 2026-06-04 03:05 PM CST**
