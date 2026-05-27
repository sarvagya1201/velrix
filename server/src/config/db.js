import dns from "node:dns";
import mongoose from "mongoose";

const configureMongoDns = (mongoUri) => {
  if (!mongoUri.startsWith("mongodb+srv://")) {
    return;
  }

  const dnsServers = process.env.MONGO_DNS_SERVERS?.split(",")
    .map((server) => server.trim())
    .filter(Boolean) || ["8.8.8.8", "1.1.1.1"];

  dns.setServers(dnsServers);
};

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error("MONGO_URI is missing. Add it to server/.env");
    }

    configureMongoDns(mongoUri);

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB Error:", error.message);

    if (error.message.includes("querySrv ETIMEOUT")) {
      console.error("MongoDB SRV DNS lookup timed out. Try changing DNS, disabling VPN/firewall DNS filtering, or use a non-SRV mongodb:// Atlas connection string.");
    }

    if (error.name === "MongooseServerSelectionError") {
      console.error("Check your MongoDB Atlas Network Access IP allowlist and internet connection.");
    }

    process.exit(1);
  }
};

export default connectDB;
