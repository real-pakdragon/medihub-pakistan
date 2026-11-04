# Hosting MediHub on your own PC (Manjaro)

This guide is written in plain English. You only need to copy and paste a few
commands. Nothing here deletes anything on your PC.

---

## What you need

- The old PC with **Manjaro** turned on and connected to the internet.
- About **30 minutes** for the first setup (it builds the website).
- The PC should stay **awake** while the website is running.

---

## Step 1 - Open the Terminal

On Manjaro, press the **Super** key (Windows key), type `Terminal`, and open it.

---

## Step 2 - Install Git (only if it is missing)

Copy this line, paste it in the Terminal, press **Enter**, and type your password
when asked:

```bash
sudo pacman -S --needed git
```

---

## Step 3 - Download the website

Copy and paste:

```bash
cd ~
git clone https://github.com/real-pakdragon/medihub-pakistan.git
```

This creates a folder called `medihub-pakistan` in your home folder.

---

## Step 4 - Start the setup

Copy and paste these two lines:

```bash
cd ~/medihub-pakistan
bash deploy/selfhost/setup.sh
```

The script will ask for your password (for installing Docker) and then do
everything automatically. **The first run can take 10-20 minutes.** You will see
a lot of text - that is normal.

When it finishes, it prints something like:

```
 Website is running
   On this PC   : http://localhost
   On your Wi-Fi : http://192.168.1.20
   Admin login  : http://192.168.1.20/admin/login
   Admin email  : admin@medihub.pk
   Admin password: ChangeMe!2024
```

---

## Step 5 - Use the website

- On the old PC: open a browser and go to **http://localhost**
- On your phone/another PC on the same Wi-Fi: use the address the script printed.
- Admin panel: add **/admin/login** to the address.

Sign in with:

- **Email:** `admin@medihub.pk`
- **Password:** `ChangeMe!2024`

> To set your own password, run this in the Terminal:
>
> ```bash
> cd ~/medihub-pakistan/deploy/selfhost
> bash reset-password.sh
> ```

To add your books: log in, open **MBBS -> Files & Content**, and upload the PDFs.
Files are saved on the old PC's hard drive.

---

## Where your data is stored

Everything lives on the old PC, in two places:

| Data | Location |
| --- | --- |
| Topics, posts, messages, admin login | Inside Docker (volume `medihub_pgdata`) |
| Uploaded PDFs, videos, pictures | `~/medihub-pakistan/deploy/selfhost/data/files` |

Nothing is stored on GitHub. GitHub only holds the code.

---

## Daily commands

Open the Terminal and go to the folder first:

```bash
cd ~/medihub-pakistan/deploy/selfhost
```

**Backup (do this regularly):**

```bash
bash backup.sh
```

**Stop the website:**

```bash
sudo docker compose -f docker-compose.yml down
```

**Start it again:**

```bash
sudo docker compose -f docker-compose.yml up -d
```

**Get the newest version from GitHub:**

```bash
bash update.sh
```

**Set a new admin password:**

```bash
bash reset-password.sh
```

**See what is wrong if the site does not load:**

```bash
sudo docker compose -f docker-compose.yml logs -f api
```

(Press `Ctrl+C` to leave the logs.)

---

## Keep the PC awake

If the PC sleeps, the website goes offline. In Manjaro:

**Settings -> Power Management ->** turn off automatic sleep/suspend.

Also make sure the PC does not shut down when the lid closes, if it is a laptop.

---

## Making it public on the internet (later)

Right now the site only works on your own Wi-Fi. When you are ready for a public
address, the easiest and safest way is **Cloudflare Tunnel**:

- it is free,
- it does not require changing your router,
- it gives you a real address with a padlock (HTTPS).

You will need a domain name (around $10 per year). When you are ready, ask and
the exact steps will be prepared for you.

---

## If something goes wrong

**The page does not open**

1. Make sure Docker is running: `sudo systemctl status docker`
2. Check the logs: `sudo docker compose -f docker-compose.yml logs -f api`
3. Restart: `sudo docker compose -f docker-compose.yml restart`

**"Port 80 is already in use"**

Another program is using port 80. Open `docker-compose.yml`, find `"80:8080"`,
change it to `"8080:8080"`, then run:

```bash
sudo docker compose -f docker-compose.yml up -d
```

The site will then be at `http://localhost:8080`.

**The PC restarted**

Docker starts the website automatically after a reboot. If it does not, run:

```bash
cd ~/medihub-pakistan/deploy/selfhost
sudo docker compose -f docker-compose.yml up -d
```
