const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const User = require('./models/User');

async function updatePassword() {
  try {
    const user = await User.findOne({ email: 'eliyahasan@gmail.com' });
    if (!user) {
      console.log('User not found');
      return;
    }
    user.password = 'foree1234';
    await user.save();
    console.log('Password updated successfully for', user.email);
  } catch (err) {
    console.error('Error updating password:', err);
  } finally {
    mongoose.disconnect();
  }
}

updatePassword(); 