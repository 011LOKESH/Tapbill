const mongoose = require('mongoose');

async function checkMongoDB() {
  console.log('Checking for local MongoDB installation...');
  
  try {
    await mongoose.connect('mongodb://localhost:27017/tapbill-desktop', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 3000,
    });
    
    console.log('✅ Local MongoDB is available and running');
    console.log('✅ TapBill will use persistent MongoDB storage');
    
    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.log('❌ Local MongoDB is not available');
    console.log('ℹ️  TapBill will use file-based persistence instead');
    console.log('ℹ️  To use MongoDB: Install MongoDB Community Server from https://www.mongodb.com/try/download/community');
    return false;
  }
}

if (require.main === module) {
  checkMongoDB().then(() => process.exit(0));
}

module.exports = checkMongoDB;
