import { Client } from 'discord.js';
import { CommandHandler } from "./Commands.js"; 
import { AdminHandler } from "./Admin.js";
import { HuntMapHandler } from "./Huntmap.js";
import { TaskHandler } from "./Task.js";

export class LunaBot {
  constructor(token) {
    this.token = token;
    this.client = new Client({ intents: ["Guilds", "GuildMembers", "GuildMessages", "MessageContent"] });
  }

  async run() {
    this.client.on("ready", () => {
      console.log("Ready")
      
      for (var [id, guild] of this.client.guilds.cache) {
        if (guild.id == this.taskHandler.guildId) {
          this.taskHandler.setupMemberHandlingTask(guild);
        }
      }

      /* To List All Roles
      var RoleIds = {};
      for (var [id, guild] of this.client.guilds.cache) {
        RoleIds[guild.id] = {};
        for (var [id, role] of guild.roles.cache) {
          RoleIds[guild.id][role.name] = role.id;
        }
      }
      */
    });
    this.client.login(this.token);
  }

  setupGuildMessageHandler(guildId, channelId) {
    this.commandHandler = new CommandHandler(guildId, channelId);

    this.client.on("messageCreate", (message) => this.commandHandler.toggleConductorRoleCommand(message));
    this.client.on("messageCreate", (message) => this.commandHandler.toggleSpawnerRoleCommand(message));
    this.client.on("messageCreate", (message) => this.commandHandler.linkCharacterCommand(message));
    this.client.on("messageCreate", (message) => this.commandHandler.addEarlyPullerComplaint(message));
  }

  setupAdminCommandsHandler(guildId, channelId) {
    this.adminHandler = new AdminHandler(guildId, channelId);

    this.client.on("messageCreate", (message) => this.adminHandler.setMessageDeleteThresholdCommand(message));
    this.client.on("messageCreate", (message) => this.adminHandler.setAutoKickState(message));
    this.client.on("messageCreate", (message) => this.adminHandler.setAutoKickThreshold(message));
    this.client.on("messageCreate", (message) => this.adminHandler.setMinimumVerificationLevel(message));
    this.client.on("messageCreate", (message) => this.adminHandler.showAuditLog(message));
  }
  
  setHuntMapHandler(guildId, channelId) {
    this.huntmapHandler = new HuntMapHandler(guildId, channelId);

    this.client.on("messageCreate", (message) => this.huntmapHandler.fetchFATEMaps(message));
  }
  
  setTasks(guildId) {
    this.taskHandler = new TaskHandler(guildId);
  }
}
