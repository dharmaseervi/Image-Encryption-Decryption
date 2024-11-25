import mongoose from 'mongoose';

const MONGODB_URI = process.env.mongo_db_connect_url;

const connectDB = async () => {
    if (mongoose.connections[0].readyState) {
        return;
    }
    await mongoose.connect(MONGODB_URI, {
    });
    mongoose.set('strictPopulate', false);
    console.log('Connected to MongoDB');
};

export default connectDB;