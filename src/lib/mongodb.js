import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI; // Your MongoDB URI
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};


// if (process.env.NODE_ENV === 'development') {
//   // In development mode, use a global variable to preserve the MongoDB client
//   if (!global._mongoClientPromise) {
//     client = new MongoClient(uri, options);
//     global._mongoClientPromise = client.connect();
//   }
//   clientPromise = global._mongoClientPromise;
// } else {
//   // In production mode, create a new client for each request

// }

const client = new MongoClient(uri, options);
const clientPromise = client.connect();
export default clientPromise;
