# 🚀 MonaScribe Production Deployment Guide

## Architecture Overview

```
Monad Testnet → Envio Indexer (Render) → MongoDB Atlas → Frontend (Vercel)
     ↓              ↓                      ↓              ↓
Smart Contract   GraphQL API            Analytics      User Interface
   Events        (Port 4000)            Storage        (Port 3000)
```

## Prerequisites

- GitHub repository with latest code
- MongoDB Atlas account and database
- Render account (free tier available)
- Vercel account (free tier available)

## Step 1: Deploy Envio Indexer to Render

### 1.1 Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the `AdekunleBamz/Monascribe` repository

### 1.2 Configure the Service

**Basic Settings:**
- **Name**: `monascribe-indexer`
- **Environment**: `Docker`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Dockerfile Path**: `./monascribe-indexer/Dockerfile`

**Build & Deploy:**
- **Environment**: `Docker`
- **Dockerfile Path**: `./monascribe-indexer/Dockerfile`
- **Plan**: `Starter` (free tier)

### 1.3 Environment Variables

Add these environment variables in Render:

```
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=monascribe_analytics
NODE_ENV=production
ENVIO_INDEXER_PORT=4000
HASURA_GRAPHQL_ENDPOINT=http://localhost:4000/v1/metadata
HASURA_GRAPHQL_ROLE=admin
HASURA_GRAPHQL_ADMIN_SECRET=testing
ENVIO_HASURA=true

# PostgreSQL configuration
ENVIO_PG_HOST=localhost
ENVIO_PG_PORT=5433
ENVIO_PG_USER=postgres
ENVIO_PG_PASSWORD=testing
ENVIO_PG_DATABASE=envio-dev
ENVIO_PG_SSL_MODE=false

# Throttle configuration
ENVIO_THROTTLE_CHAIN_METADATA_INTERVAL_MILLIS=500
ENVIO_THROTTLE_PRUNE_STALE_DATA_INTERVAL_MILLIS=1000
ENVIO_THROTTLE_LIVE_METRICS_BENCHMARK_INTERVAL_MILLIS=2000
ENVIO_THROTTLE_JSON_FILE_BENCHMARK_INTERVAL_MILLIS=5000
```

### 1.4 Deploy

1. Click **"Create Web Service"**
2. Wait for deployment to complete (5-10 minutes)
3. Note the URL: `https://monascribe-indexer.onrender.com`

## Step 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"New Project"**
3. Import your GitHub repository
4. Select the `AdekunleBamz/Monascribe` repository

### 2.2 Configure the Project

**Framework Settings:**
- **Framework Preset**: `Next.js`
- **Root Directory**: `./` (default)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### 2.3 Environment Variables

Add these environment variables in Vercel:

```
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=monascribe_analytics
NEXT_PUBLIC_ENVIO_GRAPHQL_URL=https://monascribe-indexer.onrender.com/graphql
NEXT_PUBLIC_APP_ENV=production
```

### 2.4 Deploy

1. Click **"Deploy"**
2. Wait for deployment to complete (2-3 minutes)
3. Note the URL: `https://monascribe.vercel.app`

## Step 3: Update Configuration

### 3.1 Update Vercel Configuration

After getting your Render URL, update the `vercel.json` file:

```json
{
  "env": {
    "NEXT_PUBLIC_ENVIO_GRAPHQL_URL": "https://your-actual-render-url.onrender.com/graphql"
  }
}
```

### 3.2 Commit and Push

```bash
git add .
git commit -m "Update deployment configuration with actual URLs"
git push origin main
```

## Step 4: Verify Deployment

### 4.1 Test Envio Indexer

```bash
# Test GraphQL endpoint
curl https://monascribe-indexer.onrender.com/graphql \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'
```

Expected response:
```json
{"data": {"__typename": "query_root"}}
```

### 4.2 Test Frontend

1. Visit your Vercel URL
2. Connect MetaMask to Monad Testnet
3. Test subscription flow
4. Verify On-chain Screener works

### 4.3 Test Data Flow

```bash
# Test sync endpoint
curl https://monascribe.vercel.app/api/sync

# Expected response
{
  "success": true,
  "dataFlow": "Monad Testnet → Envio GraphQL → MongoDB → VIP Portal"
}
```

## Environment Variables Reference

### Render (Envio Indexer)

| Variable | Value | Description |
|----------|-------|-------------|
| `MONGODB_URI` | `mongodb+srv://...` | MongoDB Atlas connection string |
| `MONGODB_DB` | `monascribe_analytics` | Database name |
| `NODE_ENV` | `production` | Environment mode |

### Vercel (Frontend)

| Variable | Value | Description |
|----------|-------|-------------|
| `MONGODB_URI` | `mongodb+srv://...` | MongoDB Atlas connection string |
| `MONGODB_DB` | `monascribe_analytics` | Database name |
| `NEXT_PUBLIC_ENVIO_GRAPHQL_URL` | `https://...onrender.com/graphql` | Envio GraphQL endpoint |
| `NEXT_PUBLIC_APP_ENV` | `production` | Environment mode |

## Troubleshooting

### Common Issues

#### 1. Render Deployment Fails

**Problem**: Build command fails
**Solution**: 
- Check Node.js version (should be 20+)
- Verify `pnpm` is available
- Check build logs for specific errors

#### 2. Vercel Deployment Fails

**Problem**: Build fails
**Solution**:
- Check environment variables are set
- Verify MongoDB connection string
- Check build logs for specific errors

#### 3. GraphQL Connection Issues

**Problem**: Frontend can't connect to Envio
**Solution**:
- Verify Render URL is correct
- Check CORS settings
- Test GraphQL endpoint directly

#### 4. MongoDB Connection Issues

**Problem**: Can't connect to MongoDB
**Solution**:
- Verify connection string format
- Check IP whitelist in MongoDB Atlas
- Verify database name and permissions

### Monitoring

#### Render Monitoring
- Check service logs in Render dashboard
- Monitor resource usage
- Set up alerts for downtime

#### Vercel Monitoring
- Check function logs in Vercel dashboard
- Monitor build status
- Set up performance monitoring

## Cost Estimation

### Render (Free Tier)
- **Web Service**: Free (750 hours/month)
- **Database**: Free (1GB storage)
- **Bandwidth**: Free (100GB/month)

### Vercel (Free Tier)
- **Frontend**: Free (unlimited)
- **Functions**: Free (100GB-hours/month)
- **Bandwidth**: Free (100GB/month)

### Total Monthly Cost: **$0** (within free tier limits)

## Security Considerations

1. **Environment Variables**: Never commit secrets to Git
2. **MongoDB Access**: Use IP whitelisting
3. **CORS**: Configure properly for production
4. **HTTPS**: Both services use HTTPS by default

## Performance Optimization

1. **Render**: Use appropriate plan for traffic
2. **Vercel**: Enable edge functions for better performance
3. **MongoDB**: Use connection pooling
4. **Caching**: Implement proper caching strategies

## Backup and Recovery

1. **Code**: GitHub repository serves as backup
2. **Database**: MongoDB Atlas automatic backups
3. **Configuration**: Environment variables in service dashboards

## Success Metrics

- ✅ **Envio Indexer**: Running on Render
- ✅ **Frontend**: Deployed on Vercel
- ✅ **Database**: Connected to MongoDB Atlas
- ✅ **Smart Contracts**: Working on Monad Testnet
- ✅ **User Flow**: Complete subscription process
- ✅ **Analytics**: Real-time data processing

## Support

For deployment issues:
1. Check service logs
2. Verify environment variables
3. Test individual components
4. Check network connectivity

**Your MonaScribe application is now live in production!** 🎉
