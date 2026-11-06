# Run the Fedora PC as a headless server (manage it from anywhere)

Goal: the PC sits in a corner with no monitor and no keyboard. You manage the
website from your laptop or phone, from any network, and the server comes back
by itself after a power cut.

There are two separate things:

| What you manage | How |
| --- | --- |
| Website content (books, posts, users) | the admin panel in a browser — no terminal needed |
| The server itself (restart, update, logs, disk) | SSH over Tailscale (this guide) |

---

## Part 1 — Remote access to the machine (Tailscale)

Tailscale creates a private network between your devices. It works through home
routers and CGNAT, needs no port forwarding, and is free for personal use.

### 1.1 On the Fedora PC

```bash
curl -fsSL https://tailscale.com/install.sh | sh
```

```bash
sudo tailscale up
```

It prints a link like `https://login.tailscale.com/a/xxxxx`. Open it on your
phone or laptop, sign in (Google/Microsoft/GitHub — pick one and remember it),
and approve the PC.

Check its private address:

```bash
tailscale ip -4
```

It prints something like `100.101.102.103`. **Write it down.**

### 1.2 On your laptop

Install Tailscale from <https://tailscale.com/download> and sign in with the
**same account**. Your laptop and the server can now see each other from any
network — home Wi-Fi, mobile data, a café, another city.

### 1.3 Turn on SSH on the Fedora PC

```bash
sudo systemctl enable --now sshd
```

```bash
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload
```

Find your username:

```bash
whoami
```

### 1.4 Give the laptop a key (better than a password)

On the **laptop** (Windows: open PowerShell; Linux/macOS: Terminal):

```bash
ssh-keygen -t ed25519 -C "my laptop"
```

Press Enter at every question (no passphrase is fine for a home setup).

Copy the key to the server — replace `USER` and `100.x.y.z`:

```bash
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh USER@100.x.y.z "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

On Linux/macOS use:

```bash
ssh-copy-id USER@100.x.y.z
```

### 1.5 Test it

```bash
ssh USER@100.x.y.z
```

If you land in a Fedora prompt, you are now managing the server from your laptop.
Type `exit` to leave.

### 1.6 Turn off password logins (after the key works)

**Only do this once the key login above works.** Keep the working window open
while you test a second one.

```bash
echo "PasswordAuthentication no" | sudo tee /etc/ssh/sshd_config.d/99-medihub.conf
sudo systemctl restart sshd
```

Open a **new** terminal and `ssh` again. If it works, password logins are off and
only your laptop key can get in.

Optional: install Tailscale on your phone too (and Termius/JuiceSSH) so you can
restart the server from your pocket.

---

## Part 2 — Survive power cuts and reboots

### 2.1 BIOS (one-time, needs a monitor and keyboard)

Restart the PC, press `Del` or `F2` to enter BIOS, and set:

- **Restore on AC Power Loss / AC Back** → **Power On**
  (so it boots by itself when electricity returns)
- **Halt On** (if present) → **No Errors**
  (so it boots without a keyboard attached)

Save and exit.

### 2.2 Fedora: never sleep

```bash
sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target
```

### 2.3 Check the services start on boot

```bash
sudo systemctl is-enabled docker cloudflared
```

Both should print `enabled`. If not:

```bash
sudo systemctl enable docker cloudflared
```

The containers already use `restart: unless-stopped`, so the website comes back
after a reboot without you doing anything.

### 2.4 Optional: automatic security updates

```bash
sudo dnf install -y dnf-automatic
sudo sed -i 's/^apply_updates = no/apply_updates = yes/' /etc/dnf/automatic.conf
sudo systemctl enable --now dnf-automatic.timer
```

Updates that need a restart will wait until you run `sudo reboot` over SSH.

---

## Part 3 — Automatic backups

Install the nightly timer once:

```bash
cd ~/medihub-pakistan
sudo bash deploy/selfhost/install-backup-timer.sh
```

It backs up the database and all uploaded files every night at 03:00, keeps the
newest 14 sets, and catches up after a missed run (for example if the PC was off).

Check it:

```bash
systemctl list-timers medihub-backup.timer
```

Run one immediately:

```bash
sudo systemctl start medihub-backup.service
journalctl -u medihub-backup.service -n 30
```

### Copy backups to your laptop (do this weekly)

On Windows PowerShell:

```powershell
scp -r USER@100.x.y.z:~/medihub-pakistan/deploy/selfhost/backups D:\medihub-backups
```

On Linux/macOS:

```bash
rsync -av USER@100.x.y.z:~/medihub-pakistan/deploy/selfhost/backups ./medihub-backups
```

A backup that only exists on the same PC is not a backup.

---

## Part 4 — Cheat sheet (from your laptop)

Log in first:

```bash
ssh USER@100.x.y.z
```

Then:

| Task | Command |
| --- | --- |
| Go to the stack | `cd ~/medihub-pakistan/deploy/selfhost` |
| Are the containers running? | `sudo docker compose -f docker-compose.yml ps` |
| Restart the website | `sudo docker compose -f docker-compose.yml restart` |
| Stop / start | `sudo docker compose -f docker-compose.yml down` / `... up -d` |
| Live logs | `sudo docker compose -f docker-compose.yml logs -f api` |
| Update from GitHub | `bash update.sh` |
| Change admin password | `bash reset-password.sh` |
| Backup now | `sudo systemctl start medihub-backup.service` |
| Disk space | `df -h` |
| Tunnel health | `systemctl status cloudflared` |
| Reboot | `sudo reboot` |

After `sudo reboot`, wait a minute, then reconnect with `ssh`.

---

## Part 5 — What still needs hands on the PC

Be realistic. Remote access covers software problems, not dead hardware:

| Problem | Can you fix it remotely? |
| --- | --- |
| Website crashed, container stopped | Yes |
| Need to update the code | Yes |
| Disk filling up | Yes |
| Uploads or logs need checking | Yes |
| Power cut | Yes, if BIOS is set to power on automatically |
| Internet/router down | No — nothing can reach the PC |
| Dead power supply, RAM or disk | No |
| BIOS reset / boot failure | No |

Buy a small **UPS** if you can. It keeps the PC alive through short outages and
prevents disk damage — the single best upgrade for a home server.

Keep the monitor and keyboard somewhere nearby, unplugged. You may never need
them again, but they are your emergency access.

---

## Security checklist

- Admin website password changed from the default (`reset-password.sh`).
- Admin panel protected by Cloudflare Access (email one-time PIN).
- SSH password logins disabled (Part 1.6).
- Fedora fully updated: `sudo dnf upgrade --refresh`.
- Tailscale account protected with a strong password and 2FA.
- Backups copied off the PC regularly.
