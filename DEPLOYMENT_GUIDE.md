# 🚀 DigitalOcean Deployment Guide for Portfolio Application

## Prerequisites
- DigitalOcean droplet (Ubuntu 22.04 LTS recommended)
- GoDaddy domain
- SSH access to your droplet
- Basic knowledge of Linux commands

## Step 1: Initial Server Setup

### 1.1 Connect to your droplet
```bash
ssh root@your_droplet_ip
```

### 1.2 Create a non-root user (recommended)
```bash
adduser portfolio
usermod -aG sudo portfolio
su - portfolio
```

### 1.3 Update system packages
```bash
sudo apt update && sudo apt upgrade -y
```

## Step 2: Install Required Software

### 2.1 Install Python and pip
```bash
sudo apt install python3 python3-pip python3-venv -y
```

### 2.2 Install Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2.3 Install PostgreSQL (recommended for production)
```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2.4 Install Gunicorn
```bash
sudo apt install python3-gunicorn -y
```

### 2.5 Install additional dependencies
```bash
sudo apt install build-essential libpq-dev python3-dev -y
```

## Step 3: Configure PostgreSQL

### 3.1 Create database and user
```bash
sudo -u postgres psql
CREATE DATABASE portfolio_db;
CREATE USER portfolio_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE portfolio_db TO portfolio_user;
\q
```

## Step 4: Deploy Your Application

### 4.1 Clone your repository
```bash
cd /home/portfolio
git clone https://github.com/your-username/portfolio.git
cd portfolio/backend
```

### 4.2 Create virtual environment
```bash
python3 -m venv venv
source venv/bin/activate
```

### 4.3 Install dependencies
```bash
pip install -r requirements.txt
pip install gunicorn psycopg2-binary
```

### 4.4 Create environment file
```bash
nano .env
```

Add the following content:
```env
DEBUG=False
SECRET_KEY=your_very_secure_secret_key_here
DATABASE_URL=postgresql://portfolio_user:your_secure_password@localhost/portfolio_db
ALLOWED_HOSTS=your-domain.com,www.your-domain.com,your_droplet_ip
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### 4.5 Configure Django settings
Make sure your `settings.py` is configured for production (see deployment_settings.py)

### 4.6 Run migrations
```bash
python manage.py migrate
python manage.py collectstatic --noinput
```

### 4.7 Create superuser
```bash
python manage.py createsuperuser
```

## Step 5: Configure Gunicorn

### 5.1 Create Gunicorn service file
```bash
sudo nano /etc/systemd/system/portfolio.service
```

Add the following content:
```ini
[Unit]
Description=Portfolio Gunicorn daemon
After=network.target

[Service]
User=portfolio
Group=www-data
WorkingDirectory=/home/portfolio/portfolio/backend
Environment="PATH=/home/portfolio/portfolio/backend/venv/bin"
ExecStart=/home/portfolio/portfolio/backend/venv/bin/gunicorn --workers 3 --bind unix:/home/portfolio/portfolio/backend/portfolio.sock portfolio_project.wsgi:application

[Install]
WantedBy=multi-user.target
```

### 5.2 Start and enable Gunicorn
```bash
sudo systemctl start portfolio
sudo systemctl enable portfolio
```

## Step 6: Configure Nginx

### 6.1 Create Nginx configuration
```bash
sudo nano /etc/nginx/sites-available/portfolio
```

Add the following content:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location = /favicon.ico { access_log off; log_not_found off; }
    
    location /static/ {
        root /home/portfolio/portfolio/backend;
    }

    location /media/ {
        root /home/portfolio/portfolio/backend;
    }

    location / {
        include proxy_params;
        proxy_pass http://unix:/home/portfolio/portfolio/backend/portfolio.sock;
    }
}
```

### 6.2 Enable the site
```bash
sudo ln -s /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled
sudo nginx -t
sudo systemctl reload nginx
```

## Step 7: Configure SSL with Let's Encrypt

### 7.1 Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 7.2 Obtain SSL certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Step 8: Configure GoDaddy Domain

### 8.1 Get your droplet's IP address
```bash
curl ifconfig.me
```

### 8.2 Configure DNS in GoDaddy
1. Log in to your GoDaddy account
2. Go to Domain Management
3. Click on your domain
4. Click "DNS" or "Manage DNS"
5. Add/Edit the following records:

**A Record:**
- Name: @ (or leave blank)
- Value: Your droplet's IP address
- TTL: 600

**A Record:**
- Name: www
- Value: Your droplet's IP address
- TTL: 600

**CNAME Record (optional):**
- Name: www
- Value: your-domain.com
- TTL: 600

## Step 9: Security Configuration

### 9.1 Configure firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 9.2 Set up automatic security updates
```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Step 10: Monitoring and Maintenance

### 10.1 Check application status
```bash
sudo systemctl status portfolio
sudo systemctl status nginx
```

### 10.2 View logs
```bash
sudo journalctl -u portfolio
sudo tail -f /var/log/nginx/error.log
```

### 10.3 Set up automatic backups
Create a backup script:
```bash
nano /home/portfolio/backup.sh
```

Add backup logic for database and media files.

## Troubleshooting

### Common Issues:
1. **Permission errors**: Ensure proper file permissions
2. **Database connection**: Check PostgreSQL configuration
3. **Static files not loading**: Run `python manage.py collectstatic`
4. **SSL issues**: Check Certbot configuration

### Useful Commands:
```bash
# Restart services
sudo systemctl restart portfolio
sudo systemctl restart nginx

# Check logs
sudo journalctl -u portfolio -f
sudo tail -f /var/log/nginx/error.log

# Test Django
cd /home/portfolio/portfolio/backend
source venv/bin/activate
python manage.py check --deploy
```

## Next Steps

1. Set up monitoring (Sentry, etc.)
2. Configure automated backups
3. Set up CI/CD pipeline
4. Implement rate limiting
5. Add CDN for static files

## Support

If you encounter issues:
1. Check the logs first
2. Verify all configurations
3. Test each component individually
4. Consider using DigitalOcean's support

---

**Your application should now be live at https://your-domain.com**
