const { Client, GatewayIntentBits } = require("discord.js");
const { token } = require('./config.json');
const client = new Client({
  intents: Object.values(GatewayIntentBits).reduce((a, b) => a | b)
});

client.on("ready", () => {
  console.log(`${client.user.tag} でログインしています。`);
});

client.on("messageCreate", async msg => {
  if (msg.content === "!ping") {
    msg.reply("Pong!");
  }
});

client.login(token);