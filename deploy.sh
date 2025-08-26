#!/bin/bash

# DigitalOcean Deployment Script for Portfolio Application
# Run this script on your DigitalOcean droplet

set -e  # Exit on any error

echo "🚀 Starting DigitalOcean deployment for Portfolio Application..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
   exit 1
fi

# Variables
APP_NAME="portfolio"
APP_DIR="/home/$USER/$APP_NAME"
BACKEND_DIR="$APP_DIR/backend"
DOMAIN_NAME="your-domain.com"  # Change this to your actual domain
DROPLET_IP=$(curl -s ifconfig.me)

print_status "Detected droplet IP: $DROPLET_IP"
print_status "Domain: $DOMAIN_NAME"

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
print_status "Installing required packages..."
sudo apt install -y python3 python3-pip python3-venv nginx postgresql postgresql-contrib python3-gunicorn build-essential libpq-dev python3-dev certbot python3-certbot-nginx

# Start and enable services
print_status "Starting and enabling services..."
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Configure PostgreSQL
print_status "Configuring PostgreSQL..."
sudo -u postgres psql -c "CREATE DATABASE ${APP_NAME}_db;" || print_warning "Database might already exist"
sudo -u postgres psql -c "CREATE USER ${APP_NAME}_user WITH PASSWORD '${APP_NAME}_secure_password_$(date +%s)';" || print_warning "User might already exist"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${APP_NAME}_db TO ${APP_NAME}_user;"

# Create application directory
print_status "Setting up application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

# Clone repository (you'll need to update this URL)
print_status "Cloning repository..."
if [ ! -d "$APP_DIR/.git" ]; then
    # If you have a git repository, uncomment and update the URL
    # git clone https://github.com/your-username/portfolio.git .
    print_warning "Please manually copy your application files to $APP_DIR"
    print_warning "Or uncomment the git clone line above and update the URL"
fi

# Create virtual environment
print_status "Creating virtual environment..."
cd $BACKEND_DIR
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
print_status "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn psycopg2-binary

# Create environment file
print_status "Creating environment file..."
cat > .env << EOF
DEBUG=False
SECRET_KEY=$(python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
DB_NAME=${APP_NAME}_db
DB_USER=${APP_NAME}_user
DB_PASSWORD=${APP_NAME}_secure_password_$(date +%s)
DB_HOST=localhost
DB_PORT=5432
ALLOWED_HOSTS=${DOMAIN_NAME},www.${DOMAIN_NAME},${DROPLET_IP}
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_email_password
DEFAULT_FROM_EMAIL=noreply@${DOMAIN_NAME}
EOF

print_warning "Please update the .env file with your actual API keys and email credentials"

# Copy production settings
print_status "Setting up production settings..."
cp deployment_settings.py portfolio_project/settings_production.py

# Run Django setup
print_status "Running Django setup..."
export DJANGO_SETTINGS_MODULE=portfolio_project.settings_production
python manage.py migrate
python manage.py collectstatic --noinput

# Create superuser (interactive)
print_status "Creating superuser..."
python manage.py createsuperuser

# Configure Gunicorn service
print_status "Configuring Gunicorn service..."
sudo tee /etc/systemd/system/${APP_NAME}.service > /dev/null << EOF
[Unit]
Description=${APP_NAME} Gunicorn daemon
After=network.target

[Service]
User=$USER
Group=www-data
WorkingDirectory=$BACKEND_DIR
Environment="PATH=$BACKEND_DIR/venv/bin"
Environment="DJANGO_SETTINGS_MODULE=portfolio_project.settings_production"
ExecStart=$BACKEND_DIR/venv/bin/gunicorn --workers 3 --bind unix:$BACKEND_DIR/${APP_NAME}.sock portfolio_project.wsgi:application

[Install]
WantedBy=multi-user.target
EOF

# Start and enable Gunicorn
print_status "Starting Gunicorn service..."
sudo systemctl daemon-reload
sudo systemctl start ${APP_NAME}
sudo systemctl enable ${APP_NAME}

# Configure Nginx
print_status "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/${APP_NAME} > /dev/null << EOF
server {
    listen 80;
    server_name ${DOMAIN_NAME} www.${DOMAIN_NAME};

    location = /favicon.ico { access_log off; log_not_found off; }
    
    location /static/ {
        root $BACKEND_DIR;
    }

    location /media/ {
        root $BACKEND_DIR;
    }

    location / {
        include proxy_params;
        proxy_pass http://unix:$BACKEND_DIR/${APP_NAME}.sock;
    }
}
EOF

# Enable Nginx site
print_status "Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# Configure firewall
print_status "Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Set up automatic security updates
print_status "Setting up automatic security updates..."
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Create backup script
print_status "Creating backup script..."
cat > /home/$USER/backup.sh << 'EOF'
#!/bin/bash
# Backup script for portfolio application

BACKUP_DIR="/home/$(whoami)/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/home/$(whoami)/portfolio"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump portfolio_db > $BACKUP_DIR/db_backup_$DATE.sql

# Backup media files
tar -czf $BACKUP_DIR/media_backup_$DATE.tar.gz -C $APP_DIR/backend media/

# Backup application code
tar -czf $BACKUP_DIR/code_backup_$DATE.tar.gz -C $APP_DIR .

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /home/$USER/backup.sh

# Set up cron job for daily backups
print_status "Setting up daily backup cron job..."
(crontab -l 2>/dev/null; echo "0 2 * * * /home/$USER/backup.sh") | crontab -

# Final status check
print_status "Performing final status check..."
sudo systemctl status ${APP_NAME} --no-pager
sudo systemctl status nginx --no-pager

print_status "🎉 Deployment completed successfully!"
print_status ""
print_status "Next steps:"
print_status "1. Update your GoDaddy DNS settings to point to: $DROPLET_IP"
print_status "2. Update the .env file with your actual API keys and credentials"
print_status "3. Configure SSL certificate: sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME"
print_status "4. Test your application at: http://$DROPLET_IP"
print_status ""
print_status "Useful commands:"
print_status "- Check application status: sudo systemctl status $APP_NAME"
print_status "- View logs: sudo journalctl -u $APP_NAME -f"
print_status "- Restart application: sudo systemctl restart $APP_NAME"
print_status "- Run backup: /home/$USER/backup.sh"
print_status ""
print_status "Your application should be accessible at: http://$DROPLET_IP"
print_status "After DNS propagation: http://$DOMAIN_NAME"
