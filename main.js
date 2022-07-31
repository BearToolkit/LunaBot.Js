import dotenv from "dotenv";
dotenv.config(".env");

import { LunaBot } from "./LunaBot/LunaBot.js";
import { DatabaseManager } from "./LunaBot/Database.js";

const bot = new LunaBot(process.env.DISCORD_BOT_TOKEN);
DatabaseManager.init("542602456132091904").then(() => {
  bot.setupGuildMessageHandler("542602456132091904", "995751812437119036");
  bot.setupAdminCommandsHandler("542602456132091904", "995751812437119036");
  bot.setHuntMapHandler("542602456132091904");
  bot.setTasks("542602456132091904");
  bot.run();
});