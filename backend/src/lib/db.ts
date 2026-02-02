import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/brainstorm_db';

  mongoose.connection.on('connected', () =>
    console.log('✅ MongoDB connected')
  );
  mongoose.connection.on('disconnected', () =>
    console.warn('⚠️  MongoDB disconnected')
  );
  mongoose.connection.on('error', (err) =>
    console.error('❌ MongoDB error:', err)
  );

  await mongoose.connect(uri);
}
