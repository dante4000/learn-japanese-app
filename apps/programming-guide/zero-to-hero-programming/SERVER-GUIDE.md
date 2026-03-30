# Server Deployment Guide

How to host Zero to Hero on your own server so that multiple users can access it and their progress persists across sessions.

---

## Table of Contents

1. [Understanding Persistence](#understanding-persistence)
2. [Quick Start (Local)](#quick-start-local)
3. [Option A: Python HTTP Server](#option-a-python-http-server)
4. [Option B: Node.js HTTP Server](#option-b-nodejs-http-server)
5. [Option C: Nginx](#option-c-nginx)
6. [Option D: Apache](#option-d-apache)
7. [Option E: Docker](#option-e-docker)
8. [Option F: Cloud Deployment](#option-f-cloud-deployment)
9. [HTTPS with Let's Encrypt](#https-with-lets-encrypt)
10. [Running as a Background Service](#running-as-a-background-service)
11. [Stopping the Server](#stopping-the-server)
12. [Monitoring and Logs](#monitoring-and-logs)
13. [Backup and Restore](#backup-and-restore)
14. [Updating the Course](#updating-the-course)
15. [Multi-User Considerations](#multi-user-considerations)
16. [Troubleshooting](#troubleshooting)
17. [Security Checklist](#security-checklist)

---

## Understanding Persistence

Before choosing a server option, understand how data is stored:

| Data | Storage | Scope | Persists Across |
|------|---------|-------|-----------------|
| Exercise progress | `localStorage` (`zth-progress`) | Per browser, per origin | Sessions, page reloads, browser restarts |
| Theme preference | `localStorage` (`zth-theme`) | Per browser, per origin | Sessions, page reloads, browser restarts |
| Zoom level | `localStorage` (`zth-zoom`) | Per browser, per origin | Sessions, page reloads, browser restarts |

**What "persists" means:** All user data is stored in the browser's `localStorage`. This means:

- Progress **does persist** across page reloads and browser restarts on the same machine and browser.
- Progress **does not** sync across devices, browsers, or after clearing browser data.
- No server-side database is needed. The server only serves static files.
- Each user's progress is private to their own browser.

**What the server provides:** A stable URL that users can bookmark and return to. Without a server, users must open `index.html` as a local file, which works but has a less reliable `localStorage` scope (varies by browser).

---

## Quick Start (Local)

The fastest way to run the course locally for yourself:

```bash
cd src
python3 -m http.server 8000
```

Open http://localhost:8000 in your browser. Done.

To stop: press `Ctrl+C` in the terminal.

---

## Option A: Python HTTP Server

**Best for:** Quick local hosting, single user, testing.

**Requirements:** Python 3.x

### Start

```bash
cd /path/to/zero-to-hero-programming/src
python3 -m http.server 8000
```

This serves the `src/` directory on port 8000.

### Access

- Local: http://localhost:8000
- LAN: http://YOUR_IP:8000 (find your IP with `hostname -I` on Linux or `ipconfig getifaddr en0` on macOS)

### Stop

Press `Ctrl+C` in the terminal where the server is running.

### Bind to a specific interface

```bash
# Only accessible from localhost (more secure)
python3 -m http.server 8000 --bind 127.0.0.1

# Accessible from any network interface (needed for LAN access)
python3 -m http.server 8000 --bind 0.0.0.0
```

### Run in the background

```bash
cd /path/to/zero-to-hero-programming/src
nohup python3 -m http.server 8000 --bind 0.0.0.0 > /tmp/zth-server.log 2>&1 &
echo $! > /tmp/zth-server.pid
```

To stop the background server:

```bash
kill $(cat /tmp/zth-server.pid)
```

### Limitations

- Single-threaded — handles one request at a time
- No HTTPS
- No caching headers
- Not suitable for production or public internet exposure

---

## Option B: Node.js HTTP Server

**Best for:** Quick local hosting with better performance than Python.

**Requirements:** Node.js 18+

### Using `http-server` (recommended)

```bash
# Install once
npm install -g http-server

# Start
cd /path/to/zero-to-hero-programming/src
http-server -p 8000 -c-1
```

The `-c-1` flag disables caching (useful during development). Remove it for production.

### Access

- Local: http://localhost:8000
- LAN: http://YOUR_IP:8000

### Stop

Press `Ctrl+C` in the terminal.

### Run in the background

```bash
cd /path/to/zero-to-hero-programming/src
nohup http-server -p 8000 -c 86400 > /tmp/zth-server.log 2>&1 &
echo $! > /tmp/zth-server.pid
```

To stop:

```bash
kill $(cat /tmp/zth-server.pid)
```

### Using `serve` (alternative)

```bash
npm install -g serve
cd /path/to/zero-to-hero-programming
serve src -l 8000
```

---

## Option C: Nginx

**Best for:** Production deployment, multiple users, public hosting.

**Requirements:** Nginx installed (`sudo apt install nginx` on Debian/Ubuntu, `brew install nginx` on macOS)

### 1. Copy files to web root

```bash
sudo mkdir -p /var/www/zero-to-hero
sudo cp -r /path/to/zero-to-hero-programming/src/* /var/www/zero-to-hero/
sudo chown -R www-data:www-data /var/www/zero-to-hero
```

### 2. Create Nginx configuration

```bash
sudo nano /etc/nginx/sites-available/zero-to-hero
```

Paste:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # or _ for any hostname

    root /var/www/zero-to-hero;
    index index.html;

    # Cache static assets (CSS, JS, fonts) for 1 year
    location ~* \.(css|js|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # HTML files — cache for 1 hour (allows updates to propagate)
    location ~* \.html$ {
        expires 1h;
        add_header Cache-Control "public";
    }

    # Enable gzip compression
    gzip on;
    gzip_types text/html text/css application/javascript image/svg+xml;
    gzip_min_length 1000;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # SPA-style fallback (not strictly needed but prevents 404 on direct links)
    location / {
        try_files $uri $uri/ =404;
    }
}
```

### 3. Enable the site

```bash
sudo ln -s /etc/nginx/sites-available/zero-to-hero /etc/nginx/sites-enabled/
sudo nginx -t          # Test configuration
sudo systemctl reload nginx
```

### Access

- http://your-domain.com or http://YOUR_SERVER_IP

### Stop

```bash
sudo systemctl stop nginx
```

### Start / Restart

```bash
sudo systemctl start nginx
sudo systemctl restart nginx
```

### Check status

```bash
sudo systemctl status nginx
```

### View logs

```bash
# Access log
sudo tail -f /var/log/nginx/access.log

# Error log
sudo tail -f /var/log/nginx/error.log
```

### Uninstall / Remove

```bash
sudo rm /etc/nginx/sites-enabled/zero-to-hero
sudo rm /etc/nginx/sites-available/zero-to-hero
sudo systemctl reload nginx
sudo rm -rf /var/www/zero-to-hero
```

---

## Option D: Apache

**Best for:** Servers where Apache is already installed.

**Requirements:** Apache 2.x (`sudo apt install apache2` on Debian/Ubuntu)

### 1. Copy files

```bash
sudo mkdir -p /var/www/zero-to-hero
sudo cp -r /path/to/zero-to-hero-programming/src/* /var/www/zero-to-hero/
sudo chown -R www-data:www-data /var/www/zero-to-hero
```

### 2. Create virtual host

```bash
sudo nano /etc/apache2/sites-available/zero-to-hero.conf
```

Paste:

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/zero-to-hero

    <Directory /var/www/zero-to-hero>
        Options -Indexes +FollowSymLinks
        AllowOverride None
        Require all granted
    </Directory>

    # Cache static assets
    <FilesMatch "\.(css|js|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico)$">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </FilesMatch>

    # Compress responses
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/css application/javascript image/svg+xml
    </IfModule>

    # Security headers
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"

    ErrorLog ${APACHE_LOG_DIR}/zth-error.log
    CustomLog ${APACHE_LOG_DIR}/zth-access.log combined
</VirtualHost>
```

### 3. Enable the site

```bash
sudo a2enmod headers deflate
sudo a2ensite zero-to-hero
sudo systemctl reload apache2
```

### Stop / Start / Restart

```bash
sudo systemctl stop apache2
sudo systemctl start apache2
sudo systemctl restart apache2
```

### Uninstall / Remove

```bash
sudo a2dissite zero-to-hero
sudo systemctl reload apache2
sudo rm /etc/apache2/sites-available/zero-to-hero.conf
sudo rm -rf /var/www/zero-to-hero
```

---

## Option E: Docker

**Best for:** Isolated deployment, reproducible setup, easy teardown.

**Requirements:** Docker installed

### 1. Create a Dockerfile

In the project root (`zero-to-hero-programming/`), create:

```dockerfile
FROM nginx:alpine
COPY src/ /usr/share/nginx/html/
EXPOSE 80
```

### 2. Build the image

```bash
cd /path/to/zero-to-hero-programming
docker build -t zero-to-hero .
```

### 3. Run the container

```bash
docker run -d --name zth-server -p 8000:80 zero-to-hero
```

### Access

- http://localhost:8000

### Stop

```bash
docker stop zth-server
```

### Start (after stopping)

```bash
docker start zth-server
```

### Restart

```bash
docker restart zth-server
```

### View logs

```bash
docker logs zth-server
docker logs -f zth-server  # follow live
```

### Remove completely

```bash
docker stop zth-server
docker rm zth-server
docker rmi zero-to-hero
```

### Docker Compose (alternative)

Create `docker-compose.yml` in the project root:

```yaml
services:
  web:
    image: nginx:alpine
    ports:
      - "8000:80"
    volumes:
      - ./src:/usr/share/nginx/html:ro
    restart: unless-stopped
```

```bash
# Start
docker compose up -d

# Stop
docker compose down

# View logs
docker compose logs -f

# Restart
docker compose restart
```

The `volumes` mount means you can update the course files without rebuilding the image.

---

## Option F: Cloud Deployment

### GitHub Pages (Free)

1. Push the repository to GitHub
2. Go to Settings > Pages
3. Set source to the `main` branch and `/src` folder (or use a GitHub Action to deploy)
4. Access at `https://your-username.github.io/zero-to-hero-programming/`

### Netlify (Free tier)

1. Connect your GitHub repository
2. Set build command to _(empty)_
3. Set publish directory to `src`
4. Deploy

### Cloudflare Pages (Free tier)

1. Connect your GitHub repository
2. Set build output directory to `src`
3. Deploy

### AWS S3 + CloudFront

```bash
# Create bucket
aws s3 mb s3://zero-to-hero-course

# Upload
aws s3 sync src/ s3://zero-to-hero-course/ --delete

# Enable static website hosting
aws s3 website s3://zero-to-hero-course/ --index-document index.html
```

For all cloud options, `localStorage` persistence works identically — the browser stores data per origin (domain + port).

---

## HTTPS with Let's Encrypt

For any server exposed to the public internet, HTTPS is essential. Certbot automates free TLS certificates.

### Nginx + Certbot

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate (Nginx must already be serving HTTP)
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically. Test it:
sudo certbot renew --dry-run
```

### Apache + Certbot

```bash
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d your-domain.com
sudo certbot renew --dry-run
```

Certificates auto-renew via a systemd timer. No manual intervention needed.

---

## Running as a Background Service

For production servers, run the course as a systemd service so it starts automatically on boot and restarts on failure.

### Create a systemd service (Python example)

```bash
sudo nano /etc/systemd/system/zero-to-hero.service
```

```ini
[Unit]
Description=Zero to Hero Programming Course
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/zero-to-hero
ExecStart=/usr/bin/python3 -m http.server 8000 --bind 0.0.0.0
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable zero-to-hero   # start on boot
sudo systemctl start zero-to-hero    # start now
```

### Service commands

```bash
# Check status
sudo systemctl status zero-to-hero

# Stop
sudo systemctl stop zero-to-hero

# Restart
sudo systemctl restart zero-to-hero

# Disable auto-start on boot
sudo systemctl disable zero-to-hero

# View logs
sudo journalctl -u zero-to-hero -f
```

### Remove the service

```bash
sudo systemctl stop zero-to-hero
sudo systemctl disable zero-to-hero
sudo rm /etc/systemd/system/zero-to-hero.service
sudo systemctl daemon-reload
```

---

## Stopping the Server

Summary of stop commands for each option:

| Method | Stop Command | Permanent Remove |
|--------|-------------|------------------|
| Python (foreground) | `Ctrl+C` | N/A |
| Python (background) | `kill $(cat /tmp/zth-server.pid)` | Remove PID file |
| Node.js (foreground) | `Ctrl+C` | N/A |
| Node.js (background) | `kill $(cat /tmp/zth-server.pid)` | Remove PID file |
| Nginx | `sudo systemctl stop nginx` | See [Nginx uninstall](#3-enable-the-site) |
| Apache | `sudo systemctl stop apache2` | See [Apache uninstall](#uninstall--remove-1) |
| Docker | `docker stop zth-server` | `docker rm zth-server && docker rmi zero-to-hero` |
| Docker Compose | `docker compose down` | Also removes network |
| systemd service | `sudo systemctl stop zero-to-hero` | See [Remove service](#remove-the-service) |

### Finding a running server if you forgot how you started it

```bash
# Find what's listening on port 8000
sudo lsof -i :8000
# or
sudo ss -tlnp | grep 8000

# Kill by PID
kill <PID>

# If that doesn't work
kill -9 <PID>
```

---

## Monitoring and Logs

### Check if the server is running

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000
# Should return: 200
```

### Check disk usage

```bash
du -sh /path/to/zero-to-hero-programming/src/
# Expected: ~2-3 MB (static HTML/CSS/JS only)
```

### Monitor active connections (Nginx)

```bash
sudo nginx -T | grep -c server_name
sudo tail -f /var/log/nginx/access.log
```

### Monitor container resource usage (Docker)

```bash
docker stats zth-server
```

---

## Backup and Restore

Since user progress is stored in the browser (`localStorage`), there is no server-side data to back up. However, you may want to back up the course files themselves.

### Backup course files

```bash
tar czf zero-to-hero-backup-$(date +%Y%m%d).tar.gz -C /path/to zero-to-hero-programming/src/
```

### Restore

```bash
tar xzf zero-to-hero-backup-20260318.tar.gz
```

### User progress backup (client-side)

Users can back up their own progress by running this in the browser console (F12 > Console):

```javascript
// Export progress
copy(JSON.stringify(localStorage));

// This copies all localStorage data to clipboard. Save it to a file.
```

To restore on another browser or after clearing data:

```javascript
// Import progress (paste the JSON object)
var data = {"zth-progress": "...", "zth-theme": "dark", "zth-zoom": "100"};
Object.keys(data).forEach(function(k) { localStorage.setItem(k, data[k]); });
location.reload();
```

---

## Updating the Course

### If serving from the repo directly (Docker Compose volume mount or dev server)

```bash
cd /path/to/zero-to-hero-programming
git pull
# Changes are immediately live (no restart needed for volume mounts)
```

### If files were copied to a web root (Nginx/Apache)

```bash
cd /path/to/zero-to-hero-programming
git pull
sudo rsync -av --delete src/ /var/www/zero-to-hero/
sudo chown -R www-data:www-data /var/www/zero-to-hero
```

### If using Docker (built image)

```bash
cd /path/to/zero-to-hero-programming
git pull
docker build -t zero-to-hero .
docker stop zth-server
docker rm zth-server
docker run -d --name zth-server -p 8000:80 zero-to-hero
```

User progress is unaffected by updates — it lives in the browser, not on the server.

---

## Multi-User Considerations

### Concurrent users

This is a static site. There is no server-side processing, so the server handles as many concurrent users as the web server allows:

| Server | Typical Concurrent Users |
|--------|--------------------------|
| Python `http.server` | 1-5 (single-threaded) |
| Node.js `http-server` | 50-100 |
| Nginx | 10,000+ |
| Apache | 1,000-5,000 |

### Shared computers (labs, classrooms)

If multiple users share the same browser on the same machine, their `localStorage` will overlap. Solutions:

1. **Different browser profiles** — each user creates their own Chrome/Firefox profile
2. **Incognito mode** — progress won't persist, but exercises still work
3. **Different browsers** — each user uses a different browser (Chrome, Firefox, Edge, Safari)

### LAN deployment for a classroom

1. Set up the server on one machine using Nginx or Docker
2. Find the server's LAN IP: `hostname -I`
3. Share the URL: `http://192.168.1.x:8000`
4. All students access from their own devices — progress is stored per device

---

## Troubleshooting

### "Address already in use" when starting the server

```bash
# Find what's using the port
sudo lsof -i :8000

# Kill it
kill <PID>

# Or use a different port
python3 -m http.server 9000
```

### Exercises don't run (Pyodide not loading)

- **Check internet connection** — Pyodide loads from CDN (`cdn.jsdelivr.net`)
- **Check browser console** (F12 > Console) for errors
- **Firewall/proxy** — ensure `cdn.jsdelivr.net` is not blocked
- **Offline use** — Pyodide requires internet on first load. After that, it may be cached by the browser.

### Progress disappeared

- User cleared browser data or `localStorage`
- User switched browsers or devices
- User opened the site from a different URL (different origin = different `localStorage`)
- **Fix:** Ensure users always access from the same URL. Bookmark it.

### CORS errors in browser console

- This happens when opening `index.html` directly as a `file://` URL in some browsers
- **Fix:** Use any of the server options above instead of opening the file directly

### Pages load but look unstyled

- CSS file not found — check that you're serving the `src/` directory, not the project root
- **Verify:** `curl http://localhost:8000/css/design-system.css` should return CSS content

### "Permission denied" on port 80

```bash
# Ports below 1024 require root
sudo python3 -m http.server 80

# Or use a high port and redirect
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8000
```

### Server stops when SSH session closes

- Use `nohup` (see background examples above)
- Or use `tmux`/`screen`:

```bash
tmux new -s zth
cd /path/to/zero-to-hero-programming/src
python3 -m http.server 8000
# Press Ctrl+B then D to detach

# Later, reattach:
tmux attach -t zth
```

- Or use a systemd service (see [Running as a Background Service](#running-as-a-background-service))

---

## Security Checklist

If exposing the server to the public internet:

- [ ] **Use HTTPS** — Set up Let's Encrypt (see [HTTPS section](#https-with-lets-encrypt))
- [ ] **Use a production web server** — Nginx or Apache, not Python's `http.server`
- [ ] **Disable directory listing** — Nginx: `autoindex off;` (default). Apache: `Options -Indexes`
- [ ] **Set security headers** — X-Frame-Options, X-Content-Type-Options (included in Nginx/Apache configs above)
- [ ] **Keep the server updated** — `sudo apt update && sudo apt upgrade`
- [ ] **Use a firewall** — Only open ports 80 and 443

  ```bash
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw enable
  ```

- [ ] **No sensitive data on this server** — This is a static educational site. No API keys, passwords, or databases. Don't add any.
- [ ] **Rate limiting (optional)** — Add to Nginx if under heavy load:

  ```nginx
  limit_req_zone $binary_remote_addr zone=zth:10m rate=30r/s;
  location / {
      limit_req zone=zth burst=60 nodelay;
      try_files $uri $uri/ =404;
  }
  ```
