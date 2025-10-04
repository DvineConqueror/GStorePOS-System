# 🚀 Render.com Deployment Guide - Monorepo MERN Stack

## 📋 **Render Deployment Strategy**

Since you have a **monorepo** with both frontend (`pos-frontend`) and backend (`pos-backend`), we'll create **two separate services** on Render:

1. **Web Service** - Backend (Express.js + MongoDB)
2. **Static Site** - Frontend (React + PWA)

## 🛠️ **Step-by-Step Deployment**

### ** Pre-Deployment Setup**

First, let's commit your deployment files:

```bash
# Navigate to project root
cd GroceryStorePOS

# Add deployment files
git add .
git commit -m "Add Render deployment configuration"

# Push to GitHub (master branch recommended)
git checkout master
git merge dom-oct2
git push origin master
```

### **🌐 Step 1: Create Render Account**

1. Go to [render.com](https://render.com)
2. Sign up with your **GitHub account**
3. Authorize Render to access your repositories

### **⚙️ Step 2: Deploy Backend (Web Service)**

#### **2.1 Create Web Service**

1. **Dashboard** → Click **"New +"** → **"Web Service"**
2. **Connect Repository**:
   - Select your GitHub repository
   - Choose the branch (`master`)
3. **Service Configuration**:

```
Name: smart-grocery-pos-backend
Environment: Node
Region: Oregon (US West) - Recommended
Branch: master
Root Directory: pos-backend
Build Command: npm install && npm run build
Start Command: npm start
```

#### **2.2 Environment Variables (Backend)**

Add these in **Service Settings** → **Environment**:

```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smart-grocery-pos
JWT_SECRET=<generate-32-char-secret>
JWT_REFRESH_SECRET=<generate-32-char-secret>
CLIENT_URL=https://your-frontend.onrender.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
FRONTEND_URL=https://your фронтенд.onrender.com
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000
```

#### **2.3 Generate Secrets**

```bash
# Generate secure JWT secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### **📱 Step 3: Deploy Frontend (Static Site)**

#### **3.1 Create Static Site**

1. **Dashboard** → Click **"New +"** → **"Static Site"**
2. **Connect Repository**:
   - Select same GitHub repository
   - Choose the branch (`master`)
3. **Site Configuration**:

```
Name: smart-grocery-pos-frontend
Branch: master
Root Directory: pos-frontend
Build Command: npm install && npm run build
Publish Directory: dist
```

#### **3.2 Environment Variables (Frontend)**

**Important**: Frontend env vars need `VITE_` prefix:

```bash
VITE_API_URL=https://smart-grocery-pos-backend.onrender.com/api/v1
VITE_APP_NAME=Smart Grocery POS
VITE_STORE_NAME=SmartGrocery
VITE_STORE_CURRENCY=USD
VITE_DEFAULT_TAX_RATE=0.08
VITE_ENABLE_PWA=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_LOGGING=true
```

#### **3.3 Update Build Scripts**

Make sure your frontend has a production start command:

**File: `pos-frontend/package.json`**
```json
{
  "scripts": {
    "start": "npm run preview",
    "preview": "vite preview --port $PORT --host",
    "build": "vite build",
    "dev": "vite"
  }
}
```

### **🗄️ Step 4: Setup MongoDB Atlas**

#### **4.1 Create MongoDB Atlas**

1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create **free account**
3. Create **cluster** (M0 Sandbox - Free)
4. Set **cluster name**: `smart-grocery-pos`

#### **4.2 Configure Database**

1. **Create Database**:
   - Name: `smart-grocery-pos`
   - Collection: `users`, `products`, `transactions`, `systemsettings`

2. **Create User**:
   - Username: `admin`
   - Password: `generate strong password`
   - Role: `Read and write to any database`

3. **Network Access**:
   - Add IP address: `0.0.0.0/0` (allow from anywhere)
   - Or add specific Render IP ranges

#### **4.3 Get Connection String**

1. **Clusters** → **Connect** → **Connect your application**
2. Copy connection string:
```
mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/smart-grocery-pos?retryWrites=true&w=majority
```

Replace `<password>` with your actual password.

### ** Step 5: Setup Email (Gmail)**

#### **5.1 Enable Gmail SMTP**

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. **Turn on 2-Step Verification**
3. **Generate App Password**:
   - Search: "App passwords"
   - Select: "Mail"
   - Generate password (use this in EMAIL_PASS)

### **🚀 Step 6: Deploy Both Services**

#### **6.1 Deploy Backend**

1. Click **"Create Web Service"**
2. Wait for build (5-10 minutes)
3. Note the **URL**: `https://smart-grocery-pos-backend.onrender.com`

#### **6.2 Deploy Frontend**

1. Click **"Create Static Site"**
2. Wait for build (3-5 minutes)
3. Note the **URL**: `https://smart-grocery-pos-frontend.onrender.com`

#### **6.3 Update URLs**

1. **Backend Environment**:
   - Update `CLIENT_URL`: `https://smart-grocery-pos-frontend.onrender.com`

2. **Frontend Environment**:
   - Update `VITE_API_URL`: `https://smart-grocery-pos-backend.onrender.com/api/v1`

### **🔄 Step 7: Redeploy After URL Updates**

1. **Backend**: Settings → **Manually Deploy**
2. **Frontend**: Settings → **Manually Deploy**

## ✅ **Post-Deployment Testing**

### **Test Checklist**:

- [ ] **Backend Health**: Visit `https://your-backend.onrender.com/api/v1/health`
- [ ] **Frontend Loads**: Visit `https://your-frontend.onrender.com`
- [ ] **API Connection**: Frontend calls backend APIs
- [ ] **Authentication**: Login/logout works
- [ ] **Database**: User registration saves to MongoDB
- [ ] **PWA**: Install prompt appears
- [ ] **Email**: Password reset emails work

### **Common Issues & Fixes**:

#### **Build Failures**:
```bash
# If TypeScript errors, add skipLibCheck to tsconfig.json
{
  "compilerOptions": {
    "skipLibCheck": true,
    "strict": false
  }
}
```

#### **Environment Variables**:
- Ensure `NODE_ENV=production`
- Check all URLs have `https://`
- Verify MongoDB URI format

#### **Cold Start Issues**:
- Render free tier has cold starts (~30 seconds)
- Upgrade to Starter ($7/month) for instant starts

##  **Render Features**

### **✅ What You Get**:
- **Auto-Deploy**: Git push → automatic deployment
- **HTTPS**: SSL certificates automatically
- **Custom Domains**: Add your own domain ($5/month)
- **Environment Variables**: Full env var support
- **Logs**: Real-time application logs
- **Metrics**: Performance monitoring
- **Team Collaboration**: Share dashboard access

### **💰 Pricing**:
- **Starter**: $7/month (instant starts, better performance)
- **Standard**: $25/month (dedicated resources)
- **Free Tier**: 750 hours/month (sleeping after inactivity)

## 🎯 **Next Steps**

1. **Access Your Apps**:
   - Frontend: `https://smart-grocery-pos-frontend.onrender.com`
   - Backend: `https://smart-grocery-pos-backend.onrender.com`

2. **Create Superadmin**: Use the script in your deployment

3. **Test All Features**: Authentication, POS, notifications, PWA

4. **Custom Domain** (Optional): Add your own domain

**🎉 Your Smart Grocery POS is now live on Render!**
