# Remote Deployment Guide: EC2 + Nginx + AWS Services

This guide explains how to deploy the hotel management application to a remote EC2 instance with nginx, while using AWS services (API Gateway, Lambda, DynamoDB) for the backend.

## Architecture Overview

```
Internet → EC2 (nginx) → Static Frontend Files
                    ↓
                API Gateway → Lambda → DynamoDB
```

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **EC2 Instance** running Ubuntu/Amazon Linux
3. **Domain name** (optional, can use EC2 public IP)
4. **AWS CLI** configured on your local machine

## Step 1: Deploy Backend to AWS

### 1.1 Build and Deploy Backend

```bash
# Navigate to backend directory
cd backend

# Build the application
npm run build

# Deploy using SAM
sam deploy --guided
```

During the guided deployment, you'll be asked for:
- Stack name (e.g., `hotel-backend-prod`)
- AWS Region (e.g., `us-west-2`)
- Environment (use `prod`)
- Hotel Name (e.g., `AWS Hotel`)

### 1.2 Note the API Gateway URL

After deployment, SAM will output the API Gateway URL. Save this URL - you'll need it for frontend configuration.

Example output:
```
Outputs:
HotelApiUrl: https://abc123def.execute-api.us-west-2.amazonaws.com/prod
```

## Step 2: Configure Frontend for Production

### 2.1 Update Production Environment Variables

Edit `frontend/.env.production`:

```bash
# Replace with your actual API Gateway URL from Step 1.2
VITE_API_URL=https://abc123def.execute-api.us-west-2.amazonaws.com/prod
VITE_HOTEL_NAME=AWS Hotel
```

### 2.2 Build Frontend for Production

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Build for production
npm run build
```

This creates a `dist/` folder with optimized static files.

## Step 3: Set Up EC2 Instance

### 3.1 Connect to EC2 Instance

```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### 3.2 Install nginx

```bash
# Update system
sudo apt update

# Install nginx
sudo apt install nginx -y

# Start and enable nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 3.3 Create Application Directory

```bash
# Create directory for the app
sudo mkdir -p /var/www/hotel-app

# Set permissions
sudo chown -R $USER:$USER /var/www/hotel-app
```

## Step 4: Deploy Frontend to EC2

### 4.1 Upload Built Files

From your local machine:

```bash
# Upload the built frontend files
scp -i your-key.pem -r frontend/dist/* ubuntu@your-ec2-public-ip:/var/www/hotel-app/
```

### 4.2 Configure nginx

```bash
# On EC2 instance, create nginx configuration
sudo nano /etc/nginx/sites-available/hotel-app
```

Copy the content from `nginx.conf.example` and update:
- Replace `your-domain.com` with your domain or EC2 public IP
- Replace `your-api-gateway-url.execute-api.us-west-2.amazonaws.com/prod` with your actual API Gateway URL

### 4.3 Enable the Site

```bash
# Create symlink to enable the site
sudo ln -s /etc/nginx/sites-available/hotel-app /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## Step 5: Configure Security Groups

Ensure your EC2 security group allows:
- **Port 80** (HTTP) from 0.0.0.0/0
- **Port 443** (HTTPS) from 0.0.0.0/0 (if using SSL)
- **Port 22** (SSH) from your IP

## Step 6: Test the Deployment

1. **Access the application**: `http://your-ec2-public-ip`
2. **Check API connectivity**: The app should load rooms from DynamoDB
3. **Test CRUD operations**: Add, edit, delete rooms

## Troubleshooting

### Frontend Issues

```bash
# Check nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Check if files are served correctly
curl -I http://your-ec2-public-ip
```

### API Issues

```bash
# Test API directly
curl https://your-api-gateway-url.execute-api.us-west-2.amazonaws.com/prod/api/config

# Check browser network tab for CORS errors
```

### Common Issues

1. **CORS Errors**: Ensure API Gateway has CORS enabled
2. **404 on Refresh**: nginx `try_files` directive handles SPA routing
3. **API Not Found**: Verify the API Gateway URL in `.env.production`

## Optional: SSL/HTTPS Setup

For production, consider setting up SSL:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

## Environment-Specific Configurations

### Development
- Uses Vite proxy
- Local DynamoDB
- SAM Local

### Production
- nginx serves static files
- Direct API Gateway calls
- AWS DynamoDB

This setup separates concerns properly: nginx handles static file serving and routing, while AWS services handle the dynamic backend functionality.