# Git Repository Upload Checklist

## ✅ Files to Include in Git Repository

### Essential Files:
- [ ] `package.json` (main)
- [ ] `package-lock.json` (main)
- [ ] `frontend/package.json`
- [ ] `frontend/package-lock.json`
- [ ] `backend/package.json`
- [ ] `backend/package-lock.json`
- [ ] All source code files (`.js`, `.ts`, `.tsx`, `.css`, etc.)
- [ ] Configuration files (`vite.config.ts`, `tsconfig.json`, etc.)
- [ ] `.env.example` (template for environment variables)
- [ ] `.gitignore`

### Documentation:
- [ ] `README.md` (updated with deployment instructions)
- [ ] `DEPLOYMENT.md` (detailed deployment guide)
- [ ] `CommanToRun.txt` (command reference)

### Setup Scripts:
- [ ] `setup.bat` (Windows setup script)
- [ ] `Start-TapBill.bat` (Windows start script)
- [ ] `check-mongodb.js` (MongoDB verification script)

### Application Structure:
- [ ] `frontend/src/` (all React source files)
- [ ] `backend/routes/` (all API routes)
- [ ] `backend/models/` (MongoDB models)
- [ ] `backend/server.js` (main backend server)
- [ ] `electron/main.js` (Electron main process)

## ❌ Files to Exclude (Should be in .gitignore)

### Dependencies:
- [ ] `node_modules/` (all instances)
- [ ] `frontend/node_modules/`
- [ ] `backend/node_modules/`

### Environment & Secrets:
- [ ] `.env` files (contains secrets)
- [ ] `backend/.env` (contains JWT secrets)

### Build Artifacts:
- [ ] `dist/` (Electron build output)
- [ ] `build/` (any build folders)
- [ ] `frontend/dist/` (Vite build output)
- [ ] `build-temp/` (temporary build files)

### Temporary Files:
- [ ] `data/` (local data files)
- [ ] Log files
- [ ] Cache files

## 🚀 Pre-Upload Steps

1. **Test the Application Locally**
   ```bash
   npm install
   cd backend && npm install && cd ..
   cd frontend && npm install && cd ..
   npm run build
   npm start
   ```

2. **Verify .gitignore is Working**
   ```bash
   git status
   # Should not show node_modules, .env, or dist folders
   ```

3. **Test Environment Template**
   ```bash
   # Make sure .env.example has correct template
   # Verify it doesn't contain real secrets
   ```

4. **Update Documentation**
   - [ ] README.md has correct repository URL
   - [ ] DEPLOYMENT.md is complete and accurate
   - [ ] All file paths in documentation are correct

## 📦 Client PC Requirements Summary

### Must Install:
1. **Node.js** (v18+) - https://nodejs.org/
2. **MongoDB** (v6.0+) - https://www.mongodb.com/try/download/community

### Setup Process for Clients:
1. Clone/download repository
2. Run `setup.bat` (Windows) or manual npm install
3. Copy `.env.example` to `backend/.env`
4. Run `Start-TapBill.bat` or `npm start`

### No Additional Software Needed:
- ✅ All dependencies installed via npm
- ✅ Electron bundled with the app
- ✅ Frontend built and served locally
- ✅ Backend runs within Electron process

## 🔍 Final Verification

Before uploading to Git:

1. **Clean Install Test**
   ```bash
   # In a fresh directory
   git clone <your-repo>
   cd TapBill
   # Follow setup instructions
   # Verify app works completely
   ```

2. **Cross-Platform Test** (if possible)
   - [ ] Test on different Windows versions
   - [ ] Verify MongoDB connection works
   - [ ] Test all major features

3. **Documentation Review**
   - [ ] All links work
   - [ ] Instructions are clear
   - [ ] No sensitive information exposed

## 📝 Git Commands for Upload

```bash
# Initialize repository (if not already done)
git init

# Add all files (respecting .gitignore)
git add .

# Commit changes
git commit -m "Initial commit: TapBill Desktop App"

# Add remote repository
git remote add origin <your-repo-url>

# Push to repository
git push -u origin main
```

## 🎯 Success Criteria

Your repository is ready when:
- [ ] Clients can clone and run with just Node.js + MongoDB
- [ ] No manual configuration needed beyond .env setup
- [ ] All features work after fresh install
- [ ] Documentation is complete and accurate
- [ ] No sensitive data in repository
