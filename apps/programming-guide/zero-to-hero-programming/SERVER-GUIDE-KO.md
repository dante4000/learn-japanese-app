# 서버 배포 가이드

Zero to Hero 과정을 자체 서버에 호스팅하여 여러 사용자가 접속하고 학습 진행 상황이 세션 간에 유지되도록 설정하는 방법을 안내합니다.

---

## 목차

1. [데이터 저장 방식 이해하기](#데이터-저장-방식-이해하기)
2. [빠른 시작 (로컬)](#빠른-시작-로컬)
3. [방법 A: Python HTTP 서버](#방법-a-python-http-서버)
4. [방법 B: Node.js HTTP 서버](#방법-b-nodejs-http-서버)
5. [방법 C: Nginx](#방법-c-nginx)
6. [방법 D: Apache](#방법-d-apache)
7. [방법 E: Docker](#방법-e-docker)
8. [방법 F: 클라우드 배포](#방법-f-클라우드-배포)
9. [HTTPS 설정 (Let's Encrypt)](#https-설정-lets-encrypt)
10. [백그라운드 서비스로 실행하기](#백그라운드-서비스로-실행하기)
11. [서버 중지하기](#서버-중지하기)
12. [모니터링 및 로그](#모니터링-및-로그)
13. [백업 및 복원](#백업-및-복원)
14. [과정 업데이트하기](#과정-업데이트하기)
15. [다중 사용자 고려사항](#다중-사용자-고려사항)
16. [문제 해결](#문제-해결)
17. [보안 점검 목록](#보안-점검-목록)

---

## 데이터 저장 방식 이해하기

서버 옵션을 선택하기 전에, 데이터가 어떻게 저장되는지 이해해야 합니다:

| 데이터 | 저장 위치 | 범위 | 유지되는 상황 |
|--------|-----------|------|---------------|
| 연습문제 진행 상황 | `localStorage` (`zth-progress`) | 브라우저별, 도메인별 | 세션 종료, 페이지 새로고침, 브라우저 재시작 |
| 테마 설정 | `localStorage` (`zth-theme`) | 브라우저별, 도메인별 | 세션 종료, 페이지 새로고침, 브라우저 재시작 |
| 확대/축소 수준 | `localStorage` (`zth-zoom`) | 브라우저별, 도메인별 | 세션 종료, 페이지 새로고침, 브라우저 재시작 |

**"유지된다"는 것의 의미:** 모든 사용자 데이터는 브라우저의 `localStorage`에 저장됩니다. 이는 다음을 의미합니다:

- 같은 컴퓨터, 같은 브라우저에서 페이지를 새로고침하거나 브라우저를 재시작해도 진행 상황이 **유지됩니다**.
- 다른 기기, 다른 브라우저로 접속하거나, 브라우저 데이터를 삭제하면 진행 상황이 **유지되지 않습니다**.
- 서버 측 데이터베이스가 필요 없습니다. 서버는 정적 파일만 제공합니다.
- 각 사용자의 진행 상황은 해당 사용자의 브라우저에만 저장됩니다.

**서버가 제공하는 것:** 사용자가 즐겨찾기에 추가하고 다시 돌아올 수 있는 안정적인 URL입니다. 서버 없이 `index.html`을 로컬 파일로 직접 열어도 작동하지만, `localStorage`의 동작이 브라우저마다 다를 수 있어 안정성이 떨어집니다.

---

## 빠른 시작 (로컬)

개인 사용을 위해 로컬에서 과정을 실행하는 가장 빠른 방법:

```bash
cd src
python3 -m http.server 8000
```

브라우저에서 http://localhost:8000 을 엽니다. 끝입니다.

중지하려면: 터미널에서 `Ctrl+C`를 누릅니다.

---

## 방법 A: Python HTTP 서버

**적합한 경우:** 빠른 로컬 호스팅, 단일 사용자, 테스트용

**필요 조건:** Python 3.x

### 시작

```bash
cd /path/to/zero-to-hero-programming/src
python3 -m http.server 8000
```

`src/` 디렉토리를 포트 8000에서 서비스합니다.

### 접속

- 로컬: http://localhost:8000
- 같은 네트워크(LAN): http://내_IP:8000 (IP 확인: Linux에서 `hostname -I`, macOS에서 `ipconfig getifaddr en0`)

### 중지

서버가 실행 중인 터미널에서 `Ctrl+C`를 누릅니다.

### 특정 인터페이스에 바인딩

```bash
# localhost에서만 접근 가능 (더 안전)
python3 -m http.server 8000 --bind 127.0.0.1

# 모든 네트워크 인터페이스에서 접근 가능 (LAN 접속에 필요)
python3 -m http.server 8000 --bind 0.0.0.0
```

### 백그라운드에서 실행

```bash
cd /path/to/zero-to-hero-programming/src
nohup python3 -m http.server 8000 --bind 0.0.0.0 > /tmp/zth-server.log 2>&1 &
echo $! > /tmp/zth-server.pid
```

백그라운드 서버를 중지하려면:

```bash
kill $(cat /tmp/zth-server.pid)
```

### 제한 사항

- 싱글 스레드 방식 - 한 번에 하나의 요청만 처리
- HTTPS 미지원
- 캐싱 헤더 없음
- 프로덕션 환경이나 공개 인터넷 노출에 부적합

---

## 방법 B: Node.js HTTP 서버

**적합한 경우:** Python보다 나은 성능의 빠른 로컬 호스팅

**필요 조건:** Node.js 18+

### `http-server` 사용 (권장)

```bash
# 한 번만 설치
npm install -g http-server

# 시작
cd /path/to/zero-to-hero-programming/src
http-server -p 8000 -c-1
```

`-c-1` 플래그는 캐싱을 비활성화합니다 (개발 중 유용). 프로덕션에서는 제거하세요.

### 접속

- 로컬: http://localhost:8000
- 같은 네트워크(LAN): http://내_IP:8000

### 중지

터미널에서 `Ctrl+C`를 누릅니다.

### 백그라운드에서 실행

```bash
cd /path/to/zero-to-hero-programming/src
nohup http-server -p 8000 -c 86400 > /tmp/zth-server.log 2>&1 &
echo $! > /tmp/zth-server.pid
```

중지하려면:

```bash
kill $(cat /tmp/zth-server.pid)
```

### `serve` 사용 (대안)

```bash
npm install -g serve
cd /path/to/zero-to-hero-programming
serve src -l 8000
```

---

## 방법 C: Nginx

**적합한 경우:** 프로덕션 배포, 다중 사용자, 공개 호스팅

**필요 조건:** Nginx 설치됨 (Debian/Ubuntu: `sudo apt install nginx`, macOS: `brew install nginx`)

### 1. 파일을 웹 루트에 복사

```bash
sudo mkdir -p /var/www/zero-to-hero
sudo cp -r /path/to/zero-to-hero-programming/src/* /var/www/zero-to-hero/
sudo chown -R www-data:www-data /var/www/zero-to-hero
```

### 2. Nginx 설정 파일 생성

```bash
sudo nano /etc/nginx/sites-available/zero-to-hero
```

아래 내용을 붙여넣기:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 또는 모든 호스트명은 _ 사용

    root /var/www/zero-to-hero;
    index index.html;

    # 정적 자산 (CSS, JS, 폰트) 1년 캐싱
    location ~* \.(css|js|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # HTML 파일 — 1시간 캐싱 (업데이트 반영 가능)
    location ~* \.html$ {
        expires 1h;
        add_header Cache-Control "public";
    }

    # gzip 압축 활성화
    gzip on;
    gzip_types text/html text/css application/javascript image/svg+xml;
    gzip_min_length 1000;

    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 정적 파일 요청 처리
    location / {
        try_files $uri $uri/ =404;
    }
}
```

### 3. 사이트 활성화

```bash
sudo ln -s /etc/nginx/sites-available/zero-to-hero /etc/nginx/sites-enabled/
sudo nginx -t          # 설정 테스트
sudo systemctl reload nginx
```

### 접속

- http://your-domain.com 또는 http://서버_IP

### 중지

```bash
sudo systemctl stop nginx
```

### 시작 / 재시작

```bash
sudo systemctl start nginx
sudo systemctl restart nginx
```

### 상태 확인

```bash
sudo systemctl status nginx
```

### 로그 보기

```bash
# 접근 로그
sudo tail -f /var/log/nginx/access.log

# 오류 로그
sudo tail -f /var/log/nginx/error.log
```

### 제거

```bash
sudo rm /etc/nginx/sites-enabled/zero-to-hero
sudo rm /etc/nginx/sites-available/zero-to-hero
sudo systemctl reload nginx
sudo rm -rf /var/www/zero-to-hero
```

---

## 방법 D: Apache

**적합한 경우:** Apache가 이미 설치된 서버

**필요 조건:** Apache 2.x (Debian/Ubuntu: `sudo apt install apache2`)

### 1. 파일 복사

```bash
sudo mkdir -p /var/www/zero-to-hero
sudo cp -r /path/to/zero-to-hero-programming/src/* /var/www/zero-to-hero/
sudo chown -R www-data:www-data /var/www/zero-to-hero
```

### 2. 가상 호스트 생성

```bash
sudo nano /etc/apache2/sites-available/zero-to-hero.conf
```

아래 내용을 붙여넣기:

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/zero-to-hero

    <Directory /var/www/zero-to-hero>
        Options -Indexes +FollowSymLinks
        AllowOverride None
        Require all granted
    </Directory>

    # 정적 자산 캐싱
    <FilesMatch "\.(css|js|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico)$">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </FilesMatch>

    # 응답 압축
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/css application/javascript image/svg+xml
    </IfModule>

    # 보안 헤더
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"

    ErrorLog ${APACHE_LOG_DIR}/zth-error.log
    CustomLog ${APACHE_LOG_DIR}/zth-access.log combined
</VirtualHost>
```

### 3. 사이트 활성화

```bash
sudo a2enmod headers deflate
sudo a2ensite zero-to-hero
sudo systemctl reload apache2
```

### 중지 / 시작 / 재시작

```bash
sudo systemctl stop apache2
sudo systemctl start apache2
sudo systemctl restart apache2
```

### 제거

```bash
sudo a2dissite zero-to-hero
sudo systemctl reload apache2
sudo rm /etc/apache2/sites-available/zero-to-hero.conf
sudo rm -rf /var/www/zero-to-hero
```

---

## 방법 E: Docker

**적합한 경우:** 격리된 배포, 재현 가능한 설정, 손쉬운 정리

**필요 조건:** Docker 설치됨

### 1. Dockerfile 생성

프로젝트 루트 (`zero-to-hero-programming/`)에 아래 파일을 생성합니다:

```dockerfile
FROM nginx:alpine
COPY src/ /usr/share/nginx/html/
EXPOSE 80
```

### 2. 이미지 빌드

```bash
cd /path/to/zero-to-hero-programming
docker build -t zero-to-hero .
```

### 3. 컨테이너 실행

```bash
docker run -d --name zth-server -p 8000:80 zero-to-hero
```

### 접속

- http://localhost:8000

### 중지

```bash
docker stop zth-server
```

### 시작 (중지 후)

```bash
docker start zth-server
```

### 재시작

```bash
docker restart zth-server
```

### 로그 보기

```bash
docker logs zth-server
docker logs -f zth-server  # 실시간 확인
```

### 완전 제거

```bash
docker stop zth-server
docker rm zth-server
docker rmi zero-to-hero
```

### Docker Compose (대안)

프로젝트 루트에 `docker-compose.yml` 파일을 생성합니다:

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
# 시작
docker compose up -d

# 중지
docker compose down

# 로그 보기
docker compose logs -f

# 재시작
docker compose restart
```

`volumes` 마운트를 사용하면 이미지를 다시 빌드하지 않고도 과정 파일을 업데이트할 수 있습니다.

---

## 방법 F: 클라우드 배포

### GitHub Pages (무료)

1. 저장소를 GitHub에 푸시합니다
2. Settings > Pages로 이동합니다
3. 소스를 `main` 브랜치의 `/src` 폴더로 설정합니다 (또는 GitHub Action을 사용하여 배포)
4. `https://사용자명.github.io/zero-to-hero-programming/` 으로 접속합니다

### Netlify (무료 플랜)

1. GitHub 저장소를 연결합니다
2. 빌드 명령어를 _(비워두기)_ 로 설정합니다
3. 게시 디렉토리를 `src`로 설정합니다
4. 배포합니다

### Cloudflare Pages (무료 플랜)

1. GitHub 저장소를 연결합니다
2. 빌드 출력 디렉토리를 `src`로 설정합니다
3. 배포합니다

### AWS S3 + CloudFront

```bash
# 버킷 생성
aws s3 mb s3://zero-to-hero-course

# 업로드
aws s3 sync src/ s3://zero-to-hero-course/ --delete

# 정적 웹사이트 호스팅 활성화
aws s3 website s3://zero-to-hero-course/ --index-document index.html
```

모든 클라우드 옵션에서 `localStorage`를 통한 진행 상황 저장은 동일하게 작동합니다 - 브라우저가 도메인(origin)별로 데이터를 저장합니다.

---

## HTTPS 설정 (Let's Encrypt)

공개 인터넷에 서버를 노출하는 경우 HTTPS는 필수입니다. Certbot을 사용하면 무료 TLS 인증서를 자동으로 발급받을 수 있습니다.

### Nginx + Certbot

```bash
# certbot 설치
sudo apt install certbot python3-certbot-nginx

# 인증서 발급 (Nginx가 이미 HTTP를 서비스하고 있어야 함)
sudo certbot --nginx -d your-domain.com

# 자동 갱신이 자동으로 설정됩니다. 테스트:
sudo certbot renew --dry-run
```

### Apache + Certbot

```bash
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d your-domain.com
sudo certbot renew --dry-run
```

인증서는 systemd 타이머를 통해 자동으로 갱신됩니다. 수동 개입이 필요 없습니다.

---

## 백그라운드 서비스로 실행하기

프로덕션 서버에서는 과정을 systemd 서비스로 실행하여 부팅 시 자동 시작하고 실패 시 자동 재시작되도록 설정합니다.

### systemd 서비스 생성 (Python 예시)

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
sudo systemctl enable zero-to-hero   # 부팅 시 자동 시작
sudo systemctl start zero-to-hero    # 지금 시작
```

### 서비스 명령어

```bash
# 상태 확인
sudo systemctl status zero-to-hero

# 중지
sudo systemctl stop zero-to-hero

# 재시작
sudo systemctl restart zero-to-hero

# 부팅 시 자동 시작 해제
sudo systemctl disable zero-to-hero

# 로그 보기
sudo journalctl -u zero-to-hero -f
```

### 서비스 제거

```bash
sudo systemctl stop zero-to-hero
sudo systemctl disable zero-to-hero
sudo rm /etc/systemd/system/zero-to-hero.service
sudo systemctl daemon-reload
```

---

## 서버 중지하기

각 방법별 중지 명령어 요약:

| 방법 | 중지 명령어 | 완전 제거 |
|------|-------------|-----------|
| Python (포그라운드) | `Ctrl+C` | 해당 없음 |
| Python (백그라운드) | `kill $(cat /tmp/zth-server.pid)` | PID 파일 삭제 |
| Node.js (포그라운드) | `Ctrl+C` | 해당 없음 |
| Node.js (백그라운드) | `kill $(cat /tmp/zth-server.pid)` | PID 파일 삭제 |
| Nginx | `sudo systemctl stop nginx` | [Nginx 제거](#제거) 참조 |
| Apache | `sudo systemctl stop apache2` | [Apache 제거](#제거-1) 참조 |
| Docker | `docker stop zth-server` | `docker rm zth-server && docker rmi zero-to-hero` |
| Docker Compose | `docker compose down` | 네트워크도 함께 제거됨 |
| systemd 서비스 | `sudo systemctl stop zero-to-hero` | [서비스 제거](#서비스-제거) 참조 |

### 서버를 어떻게 시작했는지 잊었을 때 찾는 방법

```bash
# 포트 8000에서 수신 중인 프로세스 찾기
sudo lsof -i :8000
# 또는
sudo ss -tlnp | grep 8000

# PID로 종료
kill <PID>

# 위 명령이 작동하지 않으면 강제 종료
kill -9 <PID>
```

---

## 모니터링 및 로그

### 서버 실행 확인

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000
# 200이 반환되어야 함
```

### 디스크 사용량 확인

```bash
du -sh /path/to/zero-to-hero-programming/src/
# 예상 크기: ~2-3 MB (정적 HTML/CSS/JS만 포함)
```

### 활성 연결 모니터링 (Nginx)

```bash
sudo nginx -T | grep -c server_name
sudo tail -f /var/log/nginx/access.log
```

### 컨테이너 리소스 사용량 모니터링 (Docker)

```bash
docker stats zth-server
```

---

## 백업 및 복원

사용자 진행 상황은 브라우저(`localStorage`)에 저장되므로 서버 측에 백업할 데이터가 없습니다. 하지만 과정 파일 자체는 백업하고 싶을 수 있습니다.

### 과정 파일 백업

```bash
tar czf zero-to-hero-backup-$(date +%Y%m%d).tar.gz -C /path/to zero-to-hero-programming/src/
```

### 복원

```bash
tar xzf zero-to-hero-backup-20260319.tar.gz
```

### 사용자 진행 상황 백업 (클라이언트 측)

사용자가 브라우저 콘솔(F12 > Console)에서 다음 명령을 실행하여 직접 진행 상황을 백업할 수 있습니다:

```javascript
// 진행 상황 내보내기
copy(JSON.stringify(localStorage));

// 클립보드에 모든 localStorage 데이터가 복사됩니다. 파일로 저장하세요.
```

다른 브라우저에서 복원하거나 데이터를 삭제한 후 복원하려면:

```javascript
// 진행 상황 가져오기 (JSON 객체를 붙여넣기)
var data = {"zth-progress": "...", "zth-theme": "dark", "zth-zoom": "100"};
Object.keys(data).forEach(function(k) { localStorage.setItem(k, data[k]); });
location.reload();
```

---

## 과정 업데이트하기

### 저장소에서 직접 서비스하는 경우 (Docker Compose 볼륨 마운트 또는 개발 서버)

```bash
cd /path/to/zero-to-hero-programming
git pull
# 볼륨 마운트의 경우 변경 사항이 즉시 반영됩니다 (재시작 불필요)
```

### 파일을 웹 루트에 복사한 경우 (Nginx/Apache)

```bash
cd /path/to/zero-to-hero-programming
git pull
sudo rsync -av --delete src/ /var/www/zero-to-hero/
sudo chown -R www-data:www-data /var/www/zero-to-hero
```

### Docker 이미지를 빌드한 경우

```bash
cd /path/to/zero-to-hero-programming
git pull
docker build -t zero-to-hero .
docker stop zth-server
docker rm zth-server
docker run -d --name zth-server -p 8000:80 zero-to-hero
```

업데이트 시 사용자 진행 상황은 영향을 받지 않습니다 - 진행 상황은 서버가 아닌 브라우저에 저장됩니다.

---

## 다중 사용자 고려사항

### 동시 접속자 수

이 과정은 정적 사이트입니다. 서버 측 처리가 없으므로 웹 서버가 허용하는 만큼 많은 동시 접속자를 처리할 수 있습니다:

| 서버 | 일반적인 동시 접속자 수 |
|------|-------------------------|
| Python `http.server` | 1-5명 (싱글 스레드) |
| Node.js `http-server` | 50-100명 |
| Nginx | 10,000명 이상 |
| Apache | 1,000-5,000명 |

### 공용 컴퓨터 (실습실, 교실)

여러 사용자가 같은 컴퓨터의 같은 브라우저를 사용하면 `localStorage`가 겹칩니다. 해결 방법:

1. **브라우저 프로필 분리** - 각 사용자가 Chrome/Firefox에서 자신만의 프로필을 생성
2. **시크릿 모드** - 진행 상황은 저장되지 않지만 연습문제는 정상 작동
3. **다른 브라우저 사용** - 각 사용자가 서로 다른 브라우저 사용 (Chrome, Firefox, Edge, Safari)

### 교실용 LAN 배포

1. Nginx 또는 Docker를 사용하여 한 컴퓨터에 서버를 설정합니다
2. 서버의 LAN IP를 확인합니다: `hostname -I`
3. URL을 공유합니다: `http://192.168.1.x:8000`
4. 모든 학생이 각자의 기기에서 접속합니다 - 진행 상황은 기기별로 저장됩니다

---

## 문제 해결

### 서버 시작 시 "Address already in use" 오류

```bash
# 해당 포트를 사용 중인 프로세스 찾기
sudo lsof -i :8000

# 해당 프로세스 종료
kill <PID>

# 또는 다른 포트 사용
python3 -m http.server 9000
```

### 연습문제가 실행되지 않음 (Pyodide 로딩 실패)

- **인터넷 연결 확인** - Pyodide는 CDN(`cdn.jsdelivr.net`)에서 로드됩니다
- **브라우저 콘솔 확인** (F12 > Console)에서 오류 메시지 확인
- **방화벽/프록시** - `cdn.jsdelivr.net`이 차단되지 않았는지 확인
- **오프라인 사용** - Pyodide는 처음 로드 시 인터넷이 필요합니다. 이후에는 브라우저 캐시에 저장될 수 있습니다.

### 진행 상황이 사라짐

- 사용자가 브라우저 데이터 또는 `localStorage`를 삭제함
- 사용자가 다른 브라우저 또는 기기로 접속함
- 사용자가 다른 URL에서 사이트를 열었음 (다른 origin = 다른 `localStorage`)
- **해결:** 사용자가 항상 같은 URL에서 접속하도록 합니다. 즐겨찾기에 추가하세요.

### 브라우저 콘솔에 CORS 오류

- `index.html`을 `file://` URL로 직접 열 때 일부 브라우저에서 발생합니다
- **해결:** 파일을 직접 여는 대신 위의 서버 옵션 중 하나를 사용하세요

### 페이지가 로드되지만 스타일이 적용되지 않음

- CSS 파일을 찾을 수 없음 - 프로젝트 루트가 아닌 `src/` 디렉토리를 서비스하고 있는지 확인
- **확인:** `curl http://localhost:8000/css/design-system.css` 명령이 CSS 내용을 반환해야 합니다

### 포트 80에서 "Permission denied" 오류

```bash
# 1024 미만의 포트는 root 권한이 필요합니다
sudo python3 -m http.server 80

# 또는 높은 포트를 사용하고 리다이렉트 설정
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8000
```

### SSH 세션 종료 시 서버도 함께 중지됨

- `nohup`을 사용하세요 (위의 백그라운드 실행 예시 참조)
- 또는 `tmux`/`screen`을 사용하세요:

```bash
tmux new -s zth
cd /path/to/zero-to-hero-programming/src
python3 -m http.server 8000
# Ctrl+B를 누른 다음 D를 눌러 분리

# 나중에 다시 연결:
tmux attach -t zth
```

- 또는 systemd 서비스를 사용하세요 ([백그라운드 서비스로 실행하기](#백그라운드-서비스로-실행하기) 참조)

---

## 보안 점검 목록

서버를 공개 인터넷에 노출하는 경우:

- [ ] **HTTPS 사용** - Let's Encrypt를 설정하세요 ([HTTPS 설정 섹션](#https-설정-lets-encrypt) 참조)
- [ ] **프로덕션 웹 서버 사용** - Python의 `http.server`가 아닌 Nginx 또는 Apache를 사용하세요
- [ ] **디렉토리 목록 비활성화** - Nginx: `autoindex off;` (기본값). Apache: `Options -Indexes`
- [ ] **보안 헤더 설정** - X-Frame-Options, X-Content-Type-Options (위의 Nginx/Apache 설정에 포함됨)
- [ ] **서버 업데이트 유지** - `sudo apt update && sudo apt upgrade`
- [ ] **방화벽 사용** - 포트 80과 443만 열기

  ```bash
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw enable
  ```

- [ ] **이 서버에 민감한 데이터를 두지 마세요** - 이것은 정적 교육 사이트입니다. API 키, 비밀번호, 데이터베이스가 없습니다. 추가하지 마세요.
- [ ] **속도 제한 (선택)** - 부하가 큰 경우 Nginx에 추가:

  ```nginx
  limit_req_zone $binary_remote_addr zone=zth:10m rate=30r/s;
  location / {
      limit_req zone=zth burst=60 nodelay;
      try_files $uri $uri/ =404;
  }
  ```
