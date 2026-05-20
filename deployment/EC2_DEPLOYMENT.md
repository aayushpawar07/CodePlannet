# AssessHub EC2 Deployment

This deploys the Spring Boot backend on port `8080`, serves the Vite React build with Nginx on port `80`, and proxies `/api/*` to the backend.

## 1. EC2 Security Group

Allow inbound:

- SSH `22` from your IP only
- HTTP `80` from `0.0.0.0/0`
- HTTPS `443` from `0.0.0.0/0` when you add SSL

Do not open MySQL `3306` publicly.

## 2. SSH Into EC2

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

## 3. Install System Packages

If your instance has only 1 GB RAM, add swap first:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

```bash
sudo apt update
sudo apt install -y git curl unzip rsync nginx mysql-server maven

# Java 21 is required by this backend.
sudo apt install -y openjdk-21-jdk

# If openjdk-21-jdk is unavailable on your Ubuntu image, install Temurin 21:
# wget -qO - https://packages.adoptium.net/artifactory/api/gpg/key/public | sudo tee /etc/apt/keyrings/adoptium.asc
# echo "deb [signed-by=/etc/apt/keyrings/adoptium.asc] https://packages.adoptium.net/artifactory/deb $(. /etc/os-release && echo $VERSION_CODENAME) main" | sudo tee /etc/apt/sources.list.d/adoptium.list
# sudo apt update && sudo apt install -y temurin-21-jdk
```

Install Node.js 20:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Check versions:

```bash
java -version
mvn -version
node --version
npm --version
```

## 4. Create MySQL Database

```bash
sudo mysql
```

Inside MySQL:

```sql
CREATE DATABASE assessment_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'assesshub'@'localhost' IDENTIFIED BY 'CHANGE_THIS_DB_PASSWORD';
GRANT ALL PRIVILEGES ON assessment_platform.* TO 'assesshub'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 5. Put Code On The Server

Option A, from GitHub:

```bash
sudo mkdir -p /opt/assesshub
sudo chown -R ubuntu:ubuntu /opt/assesshub
git clone YOUR_GITHUB_REPO_URL /opt/assesshub
```

Option B, from your local machine with `rsync`:

```bash
rsync -avz --delete \
  --exclude backend/target \
  --exclude frontend/node_modules \
  --exclude frontend/dist \
  -e "ssh -i your-key.pem" \
  AssessHub-main/ ubuntu@YOUR_EC2_PUBLIC_IP:/tmp/assesshub/
```

Then on EC2:

```bash
sudo mkdir -p /opt/assesshub
sudo cp -r /tmp/assesshub/* /opt/assesshub/
sudo chown -R ubuntu:ubuntu /opt/assesshub
```

## 6. Configure Backend Environment

```bash
sudo mkdir -p /etc/assesshub
sudo cp /opt/assesshub/deployment/backend.env.example /etc/assesshub/backend.env
sudo nano /etc/assesshub/backend.env
```

Set:

- `DB_PASSWORD` to the MySQL password you created
- `JWT_SECRET` to `openssl rand -base64 32`
- `CORS_ALLOWED_ORIGINS` to `http://YOUR_EC2_PUBLIC_IP` or your domain
- mail credentials if OTP emails are required

Protect the env file:

```bash
sudo chmod 600 /etc/assesshub/backend.env
```

## 7. Build And Start Backend

```bash
cd /opt/assesshub/backend
mvn clean package -DskipTests

sudo cp /opt/assesshub/deployment/assesshub-backend.service /etc/systemd/system/assesshub-backend.service
sudo systemctl daemon-reload
sudo systemctl enable assesshub-backend
sudo systemctl start assesshub-backend
sudo systemctl status assesshub-backend --no-pager
```

Check logs:

```bash
sudo journalctl -u assesshub-backend -f
```

Health check:

```bash
curl http://localhost:8080/actuator/health
```

## 8. Build And Deploy Frontend

```bash
cd /opt/assesshub/frontend
npm ci
NODE_OPTIONS=--max-old-space-size=2048 npm run build

sudo mkdir -p /var/www/assesshub
sudo rsync -a --delete dist/ /var/www/assesshub/
sudo chown -R www-data:www-data /var/www/assesshub
```

The frontend uses `/api`, so no production API URL build variable is needed when Nginx proxies `/api` to Spring Boot.

## 9. Configure Nginx

```bash
sudo cp /opt/assesshub/deployment/nginx-assesshub.conf /etc/nginx/sites-available/assesshub
sudo nano /etc/nginx/sites-available/assesshub
```

Replace `YOUR_EC2_PUBLIC_IP_OR_DOMAIN`.

Enable the site:

```bash
sudo ln -sf /etc/nginx/sites-available/assesshub /etc/nginx/sites-enabled/assesshub
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Open:

```text
http://YOUR_EC2_PUBLIC_IP
```

## 10. Updating After Code Changes

```bash
cd /opt/assesshub
git pull

cd backend
mvn clean package -DskipTests
sudo systemctl restart assesshub-backend

cd ../frontend
npm ci
NODE_OPTIONS=--max-old-space-size=2048 npm run build
sudo rsync -a --delete dist/ /var/www/assesshub/
sudo systemctl reload nginx
```

## Useful Checks

```bash
sudo systemctl status assesshub-backend --no-pager
sudo systemctl status nginx --no-pager
sudo systemctl status mysql --no-pager
curl http://localhost:8080/actuator/health
curl http://localhost
```

Default seeded admin:

```text
admin@assessment.com / admin123
```

Change that password after the first login.
