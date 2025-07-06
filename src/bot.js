const path = require ("path");
require("dotenv").config({path: __dirname + '/../.env'});
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const mongoose = require("mongoose");
const fs = require("fs");

const token = process.env.token;
const mongourl = process.env.MONGODB_URL;

const client = new Client({ intents: GatewayIntentBits.Guilds });
client.commands = new Collection();
client.commandArray = [];

const functionFolders = fs.readdirSync(`./src/functions`);
for (const folder of functionFolders) {
  const functionFiles = fs
    .readdirSync(`./src/functions/${folder}`)
    .filter((file) => file.endsWith(".js"));
  for (const file of functionFiles)
    require(`./functions/${folder}/${file}`)(client);
}

async function startBot() {
  try {
    await mongoose.connect(mongourl); // ✅ Modern connection without deprecated options
    console.log(" Connected to MongoDB");

    await client.login(token);
    console.log("Bot logged in");

    await client.handleCommands();
    await client.handleEvents();

    setInterval(() => {
      console.log(`📡 API Ping: ${client.ws.ping}ms`);
    }, 5000);
  } catch (err) {
    console.error("Startup error:", err);
  }
}

startBot();
