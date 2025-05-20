import 'dotenv/config';
import mongoose from 'mongoose';
import Part from './models/Part.js';

await mongoose.connect(process.env.MONGODB_URI, {
  dbName: 'usedpartpicker',
});

const parts = [
  {
    name: "GTX 1660 Super",
    aliases: ["gtx1660super", "1660super"],
    type: "gpu",
    performance_score: 11000,
    last_known_price: 120,
  },
  {
    name: "Ryzen 5 3600",
    aliases: ["ryzen53600", "r53600"],
    type: "cpu",
    performance_score: 14000,
    last_known_price: 95,
  }
];

await Part.deleteMany();
await Part.insertMany(parts);

console.log("✅ Seeded parts!");
process.exit();
