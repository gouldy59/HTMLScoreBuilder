# Multi-Environment Deployment Guide

This guide explains how to deploy the Score Reports application to different environments: Development, QC, Staging, and Production.

## Environment Overview

| Environment | Purpose | Database | URL | Replicas |
|-------------|---------|----------|-----|----------|
| Development | Local development | Local/Dev DB | localhost:5000 | 1 |
| QC | Quality assurance testing | QC DB | qc.yourapp.com | 1 |
| Staging | Pre-production testing | Staging DB | staging.yourapp.com | 2 |
| Production | Live application | Production DB | yourapp.com | 3+ |

## Quick Start

### 1. Environment Setup

```bash
# Create environment files
./scripts/setup-env.sh development
./scripts/setup-env.sh qc
./scripts/setup-env.sh staging
./scripts/setup-env.sh production

# Edit environment files with your actual values
nano environments/development.env
nano environments/qc.env
nano environments/staging.env
nano environments/production.env
```

### 2. Database Setup

Each environment needs its own database:

**Development:**
```bash
# Use Docker for local development
docker-compose up postgres-dev

# Or use Neon development database
# Update environments/development.env with Neon dev DB URL
```

**QC/Staging/Production:**
```bash
# Create separate Neon databases for each environment
# 1. Go to https://console.neon.tech
# 2. Create new databases:
#    - score_reports_qc
#    - score_reports_staging
#    - score_reports_prod
# 3. Update environment files with connection URLs
```

### 3. Deployment Methods

#### Option A: Direct Deployment (Replit/Simple)
```bash
# Development
npm run dev

# QC
NODE_ENV=test npm run dev

# Staging
NODE_ENV=staging npm run start

# Production
NODE_ENV=production npm run start
```

#### Option B: Docker Deployment
```bash
# Build images
docker build -t score-reports:dev -f Dockerfile.dev .
docker build -t score-reports:prod .

# Run containers
docker-compose up app-dev  # Development
docker run -d --name score-reports-staging score-reports:prod  # Staging
docker run -d --name score-reports-production score-reports:prod  # Production
```

#### Option C: Kubernetes Deployment
```bash
# Apply configurations
kubectl apply -f kubernetes/development.yaml
kubectl apply -f kubernetes/staging.yaml
kubectl apply -f kubernetes/production.yaml

# Check status
kubectl get pods -n score-reports-dev
kubectl get pods -n score-reports-staging
kubectl get pods -n score-reports-prod
```

## Environment Configuration

### Database Configuration

Each environment should have its own database:

```bash
# Development
DATABASE_URL=postgresql://dev_user:dev_password@localhost:5432/score_reports_dev

# QC
DATABASE_URL=postgresql://qc_user:qc_password@qc-host:5432/score_reports_qc

# Staging
DATABASE_URL=postgresql://staging_user:staging_password@staging-host:5432/score_reports_staging

# Production
DATABASE_URL=postgresql://prod_user:prod_password@prod-host:5432/score_reports_prod
```

### Security Configuration

**Development:**
- Relaxed CORS settings
- Debug mode enabled
- Weak session secrets (OK for dev)

**QC:**
- Test data only
- Moderate security
- Logging enabled for debugging

**Staging:**
- Production-like security
- Real-like data (anonymized)
- Analytics enabled

**Production:**
- Strict security settings
- Strong session secrets
- HTTPS only
- Rate limiting
- Monitoring enabled

## Deployment Checklist

### Before Deployment

- [ ] Environment file configured
- [ ] Database created and accessible
- [ ] Environment variables set
- [ ] Dependencies installed
- [ ] Tests passing (for non-dev environments)
- [ ] Build successful

### QC Deployment

- [ ] Deploy to QC environment
- [ ] Run integration tests
- [ ] Verify all features work
- [ ] Check performance
- [ ] Validate data integrity

### Staging Deployment

- [ ] Deploy to staging
- [ ] Run full test suite
- [ ] Load testing
- [ ] Security testing
- [ ] User acceptance testing
- [ ] Performance monitoring

### Production Deployment

- [ ] Database backup created
- [ ] Staging tests passed
- [ ] Deploy during maintenance window
- [ ] Health checks passing
- [ ] Monitoring active
- [ ] Rollback plan ready

## Monitoring and Logging

### Development
- Console logging
- Hot reload enabled
- Debug tools active

### QC
- Structured logging
- Test result tracking
- Error reporting

### Staging
- Application metrics
- Performance monitoring
- Error tracking (Sentry)

### Production
- Full observability stack
- Real-time monitoring
- Alerting system
- Log aggregation

## Database Migrations

```bash
# Run migrations for specific environment
NODE_ENV=development npm run db:push
NODE_ENV=test npm run db:push
NODE_ENV=staging npm run db:push
NODE_ENV=production npm run db:push
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL in environment file
   - Verify database server is running
   - Check network connectivity

2. **Environment Variables Not Loaded**
   - Ensure environment file exists
   - Check file path in config/environment.ts
   - Verify NODE_ENV is set correctly

3. **Build Failures**
   - Check dependencies are installed
   - Verify build scripts
   - Check for TypeScript errors

4. **Performance Issues**
   - Check database queries
   - Monitor memory usage
   - Check for memory leaks

### Health Checks

Each environment should respond to health check endpoints:

```bash
# Check application health
curl http://localhost:5000/health

# Check database connectivity
curl http://localhost:5000/health/db
```

## Backup and Recovery

### Database Backups

```bash
# Create backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Restore backup
psql $DATABASE_URL < backup-file.sql
```

### Application Backups

- Code: Git repository
- Configuration: Environment files
- Assets: File storage backup
- Database: Regular PostgreSQL dumps

## Security Considerations

1. **Environment Separation**
   - Each environment has its own database
   - Separate access credentials
   - No cross-environment data access

2. **Secrets Management**
   - Use strong passwords in production
   - Rotate secrets regularly
   - Use environment variables, not hardcoded values

3. **Network Security**
   - HTTPS in staging/production
   - Database access restrictions
   - Firewall rules

4. **Data Protection**
   - Anonymized data in non-production
   - Regular backups
   - Access logging

## CI/CD Pipeline

Recommended workflow:

1. **Development** → Code changes, local testing
2. **QC** → Automated testing, quality checks
3. **Staging** → Integration testing, performance testing
4. **Production** → Final deployment

Each stage should have automated tests and approval gates.