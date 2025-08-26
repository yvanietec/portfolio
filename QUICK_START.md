# 🚀 Quick Start Guide - DigitalOcean + GoDaddy Deployment

## Prerequisites Checklist
- [ ] DigitalOcean droplet created (Ubuntu 22.04 LTS recommended)
- [ ] GoDaddy domain purchased
- [ ] SSH access to your droplet
- [ ] Your portfolio application code ready

## Step 1: Get Your Droplet Information
1. **Get your droplet IP:**
   ```bash
   # Run this on your droplet
   curl ifconfig.me
   ```
   **Note down this IP address - you'll need it for GoDaddy DNS setup**

2. **SSH into your droplet:**
   ```bash
   ssh root@your_droplet_ip
   ```

## Step 2: Run the Deployment Script
1. **Copy the deployment script to your droplet:**
   ```bash
   # On your local machine, copy the script
   scp deploy.sh root@your_droplet_ip:/root/
   ```

2. **Make it executable and run:**
   ```bash
   # On your droplet
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. **Follow the prompts:**
   - The script will ask you to create a superuser
   - Update the domain name in the script if needed

## Step 3: Configure GoDaddy DNS
1. **Log into GoDaddy** and go to your domain management
2. **Add these DNS records:**
   - **A Record:** `@` → Your droplet IP
   - **A Record:** `www` → Your droplet IP
3. **Wait for DNS propagation** (can take up to 48 hours)

## Step 4: Set Up SSL Certificate
```bash
# On your droplet, after DNS is configured
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Step 5: Update Environment Variables
```bash
# Edit the .env file with your actual credentials
nano /home/portfolio/portfolio/backend/.env
```

**Update these values:**
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD`
- `ALLOWED_HOSTS` with your actual domain

## Step 6: Test Your Application
1. **Test via IP:** `http://your_droplet_ip`
2. **Test via domain:** `http://yourdomain.com` (after DNS propagation)
3. **Test HTTPS:** `https://yourdomain.com` (after SSL setup)

## Common Commands
```bash
# Check application status
sudo systemctl status portfolio

# View logs
sudo journalctl -u portfolio -f

# Restart application
sudo systemctl restart portfolio

# Check Nginx status
sudo systemctl status nginx

# Run backup
/home/portfolio/backup.sh
```

## Troubleshooting Quick Fixes

### Website Not Loading
```bash
# Check if services are running
sudo systemctl status portfolio nginx

# Check firewall
sudo ufw status

# Check logs
sudo journalctl -u portfolio -n 50
```

### SSL Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew --dry-run
```

### Database Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Connect to database
sudo -u postgres psql -d portfolio_db
```

## Next Steps
1. **Set up monitoring** (Sentry, UptimeRobot)
2. **Configure automated backups**
3. **Set up CI/CD pipeline**
4. **Add CDN for static files**
5. **Implement rate limiting**

## Support
- **DigitalOcean Docs:** [docs.digitalocean.com](https://docs.digitalocean.com)
- **Django Deployment:** [docs.djangoproject.com/en/stable/howto/deployment](https://docs.djangoproject.com/en/stable/howto/deployment)
- **Nginx Docs:** [nginx.org/en/docs](https://nginx.org/en/docs)

---

**Your portfolio should now be live at https://yourdomain.com! 🎉**
