import axios from "axios";
import cheerio from "cheerio";

import { DatabaseManager } from './Database.js';
import { Handler } from "./Handler.js";

export class AdminHandler extends Handler {
  constructor(guildId, channelId) {
    super(guildId, channelId);
  }

  setMessageDeleteThresholdCommand(message) {
    if (!message.content.startsWith("+deleteDuration")) {
      return;
    }
    
    if (!this.verifyChannel(message.guildId, message.channelId)) {
      return;
    }

    if (!this.verifyPermission("Admin", message.member)) {
      return;
    }

    this.config = DatabaseManager.getConfig(this.guildId);

    const commands = message.content.split(" ");

    if (commands.length == 2) {
      var durationInSeconds = parseInt(commands[1]);
      if (durationInSeconds < 5) durationInSeconds = 5;
      this.config.autoDeleteMessageDuration = durationInSeconds * 1000;

      DatabaseManager.setConfig(this.guildId, this.config).then(() => {
        const embed = this.defaultEmbed("Duration Change Success")
        this.sendMessage(message.channel, {embeds: [embed]});
      }).catch((error) => {
        const embed = this.defaultEmbed("Processing Error")
          .setDescription("Please try again in a few minutes");
        this.sendMessage(message.channel, {embeds: [embed]});
      });
    } else {
      const embed = this.defaultEmbed("Bad Parameters")
        .setDescription("Usage: '+deleteDuration [time_in_seconds]'");
      this.sendMessage(message.channel, {embeds: [embed]});
    }
    
    setTimeout(() => {
      message.delete();
    }, this.config.autoDeleteMessageDuration)
  }
  
  setAutoKickState(message) {
    if (!message.content.startsWith("+autoKick ")) {
      return;
    }
    
    if (!this.verifyChannel(message.guildId, message.channelId)) {
      return;
    }

    if (!this.verifyPermission("Admin", message.member)) {
      return;
    }

    this.config = DatabaseManager.getConfig(this.guildId);

    const commands = message.content.split(" ");

    if (commands.length == 2) {
      if (commands[1] == "on") {
        this.config.autoKick = true;
      } else {
        this.config.autoKick = false;
      }
      
      DatabaseManager.setConfig(this.guildId, this.config).then(() => {
        const embed = this.defaultEmbed("State Change Success")
        this.sendMessage(message.channel, {embeds: [embed]});
      }).catch((error) => {
        const embed = this.defaultEmbed("Processing Error")
          .setDescription("Please try again in a few minutes");
        this.sendMessage(message.channel, {embeds: [embed]});
      });
    } else {
      const embed = this.defaultEmbed("Bad Parameters")
        .setDescription("Usage: '+autoKick [on/off]'");
      this.sendMessage(message.channel, {embeds: [embed]});
    }
    
    setTimeout(() => {
      message.delete();
    }, this.config.autoDeleteMessageDuration)
  }
  
  setAutoKickThreshold(message) {
    if (!message.content.startsWith("+autoKickThreshold")) {
      return;
    }
    
    if (!this.verifyChannel(message.guildId, message.channelId)) {
      return;
    }

    if (!this.verifyPermission("Admin", message.member)) {
      return;
    }

    this.config = DatabaseManager.getConfig(this.guildId);

    const commands = message.content.split(" ");

    if (commands.length == 2) {
      var durationInDays = parseInt(commands[1]);
      if (durationInDays < 1) durationInDays = 7;
      this.config.autoKickThreshold = durationInDays * 24*3600*1000;

      DatabaseManager.setConfig(this.guildId, this.config).then(() => {
        const embed = this.defaultEmbed("Duration Change Success")
        this.sendMessage(message.channel, {embeds: [embed]});
      }).catch((error) => {
        const embed = this.defaultEmbed("Processing Error")
          .setDescription("Please try again in a few minutes");
        this.sendMessage(message.channel, {embeds: [embed]});
      });
    } else {
      const embed = this.defaultEmbed("Bad Parameters")
        .setDescription("Usage: '+autoKickThreshold [time_in_days]'");
      this.sendMessage(message.channel, {embeds: [embed]});
    }
    
    setTimeout(() => {
      message.delete();
    }, this.config.autoDeleteMessageDuration)
  }
  
  setMinimumVerificationLevel(message) {
    if (!message.content.startsWith("+verificationLevel")) {
      return;
    }
    
    if (!this.verifyChannel(message.guildId, message.channelId)) {
      return;
    }

    if (!this.verifyPermission("Admin", message.member)) {
      return;
    }

    this.config = DatabaseManager.getConfig(this.guildId);

    const commands = message.content.split(" ");

    if (commands.length == 2) {
      var minimumLevel = parseInt(commands[1]);
      this.config.levelGated = minimumLevel;

      DatabaseManager.setConfig(this.guildId, this.config).then(() => {
        const embed = this.defaultEmbed("Duration Change Success")
        this.sendMessage(message.channel, {embeds: [embed]});
      }).catch((error) => {
        const embed = this.defaultEmbed("Processing Error")
          .setDescription("Please try again in a few minutes");
        this.sendMessage(message.channel, {embeds: [embed]});
      });
    } else {
      const embed = this.defaultEmbed("Bad Parameters")
        .setDescription("Usage: '+verificationLevel [level]'");
      this.sendMessage(message.channel, {embeds: [embed]});
    }
    
    setTimeout(() => {
      message.delete();
    }, this.config.autoDeleteMessageDuration)
  }
}
