# 🌐 GoDaddy DNS Configuration Guide

## Prerequisites
- GoDaddy account with your domain
- DigitalOcean droplet IP address
- Access to GoDaddy domain management

## Step 1: Get Your Droplet IP Address

First, get your DigitalOcean droplet's IP address. You can find this in:
1. DigitalOcean dashboard → Droplets → Your droplet
2. Or run this command on your droplet: `curl ifconfig.me`

**Example IP:** `123.456.789.012`

## Step 2: Access GoDaddy Domain Management

1. **Log in to GoDaddy**
   - Go to [godaddy.com](https://godaddy.com)
   - Click "Sign In" in the top right
   - Enter your GoDaddy account credentials

2. **Navigate to Domain Management**
   - Click "My Products" or "Domains"
   - Find your domain in the list
   - Click on your domain name

3. **Access DNS Settings**
   - Look for "DNS" or "Manage DNS" button
   - Click on it to access DNS management

## Step 3: Configure DNS Records

### 3.1 Remove Existing Records (if any)
Before adding new records, you may want to remove or update existing A records that point to other servers.

### 3.2 Add A Record for Root Domain
1. Click "Add" or "Add Record"
2. Select "A" as the record type
3. Configure as follows:
   - **Name:** `@` (or leave blank)
   - **Value:** Your droplet IP address (e.g., `123.456.789.012`)
   - **TTL:** `600` (or 1 hour)
4. Click "Save" or "Add Record"

### 3.3 Add A Record for WWW Subdomain
1. Click "Add" or "Add Record" again
2. Select "A" as the record type
3. Configure as follows:
   - **Name:** `www`
   - **Value:** Your droplet IP address (e.g., `123.456.789.012`)
   - **TTL:** `600` (or 1 hour)
4. Click "Save" or "Add Record"

### 3.4 Optional: Add CNAME Record for WWW
Instead of an A record for www, you can use a CNAME record:
1. Click "Add" or "Add Record"
2. Select "CNAME" as the record type
3. Configure as follows:
   - **Name:** `www`
   - **Value:** `yourdomain.com` (replace with your actual domain)
   - **TTL:** `600` (or 1 hour)
4. Click "Save" or "Add Record"

## Step 4: Verify DNS Configuration

### 4.1 Check DNS Propagation
After updating DNS records, it can take up to 48 hours for changes to propagate globally. You can check propagation using:

1. **Online DNS Checkers:**
   - [whatsmydns.net](https://whatsmydns.net)
   - [dnschecker.org](https://dnschecker.org)
   - [mxtoolbox.com](https://mxtoolbox.com)

2. **Command Line Check:**
   ```bash
   # Check A record
   nslookup yourdomain.com
   
   # Check www subdomain
   nslookup www.yourdomain.com
   
   # Using dig (more detailed)
   dig yourdomain.com
   dig www.yourdomain.com
   ```

### 4.2 Test Website Access
Once DNS has propagated:
1. Try accessing `http://yourdomain.com`
2. Try accessing `http://www.yourdomain.com`
3. Both should show your portfolio application

## Step 5: Configure SSL Certificate

After DNS is properly configured, set up SSL:

1. **SSH into your droplet:**
   ```bash
   ssh username@your_droplet_ip
   ```

2. **Run Certbot:**
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

3. **Follow the prompts:**
   - Enter your email address
   - Agree to terms of service
   - Choose whether to redirect HTTP to HTTPS (recommended)

## Common Issues and Solutions

### Issue 1: Website Not Loading
**Symptoms:** Domain shows "This site can't be reached" or similar error

**Solutions:**
1. Check if DNS records are correct
2. Verify droplet is running and accessible via IP
3. Check if Nginx is running: `sudo systemctl status nginx`
4. Check firewall settings: `sudo ufw status`

### Issue 2: DNS Not Propagating
**Symptoms:** Some users can access site, others can't

**Solutions:**
1. Wait up to 48 hours for full propagation
2. Clear your local DNS cache
3. Try accessing from different networks
4. Use VPN to test from different locations

### Issue 3: SSL Certificate Issues
**Symptoms:** Browser shows security warnings

**Solutions:**
1. Ensure DNS is properly configured before running Certbot
2. Check if ports 80 and 443 are open
3. Verify domain ownership
4. Check Certbot logs: `sudo certbot certificates`

### Issue 4: WWW vs Non-WWW Redirect
**Symptoms:** www.yourdomain.com and yourdomain.com show different content

**Solutions:**
1. Ensure both A records point to the same IP
2. Configure Nginx to handle both domains
3. Set up redirects if needed

## Advanced DNS Configuration

### Subdomain Setup
If you want to add subdomains (e.g., `api.yourdomain.com`):

1. Add A record:
   - **Name:** `api`
   - **Value:** Your droplet IP
   - **TTL:** `600`

2. Configure Nginx for the subdomain

### Email Configuration (MX Records)
If you want to use your domain for email:

1. Add MX record:
   - **Name:** `@`
   - **Value:** `mail.yourdomain.com` (or your email provider)
   - **Priority:** `10`
   - **TTL:** `3600`

2. Add A record for mail server if needed

## Monitoring and Maintenance

### Regular Checks
1. **DNS Health:** Use monitoring tools to check DNS resolution
2. **SSL Certificate:** Monitor certificate expiration
3. **Website Uptime:** Set up uptime monitoring

### Backup DNS Configuration
Keep a record of your DNS settings:
- Screenshot of DNS records
- Export DNS configuration if available
- Document any custom configurations

## Security Considerations

1. **DNS Security:**
   - Use strong passwords for GoDaddy account
   - Enable two-factor authentication
   - Regularly review DNS records

2. **Domain Security:**
   - Enable domain lock if available
   - Use privacy protection for WHOIS
   - Monitor for unauthorized changes

## Support Resources

- **GoDaddy Support:** [support.godaddy.com](https://support.godaddy.com)
- **DigitalOcean Support:** [digitalocean.com/support](https://digitalocean.com/support)
- **DNS Tools:** [mxtoolbox.com](https://mxtoolbox.com)

---

**After completing these steps, your domain should successfully point to your DigitalOcean droplet and your portfolio application should be accessible via your domain name.**
