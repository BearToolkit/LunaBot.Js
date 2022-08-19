
import { EmbedBuilder } from "discord.js";
import { DatabaseManager } from "./Database.js";

import fs from "fs";
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

var DataCenters = JSON.parse(fs.readFileSync(__dirname + '/../resources/data-centers.json', 'utf8'));
var RolesId = JSON.parse(fs.readFileSync(__dirname + '/../resources/roles.json', 'utf8'));

const Debug = false;

export class Handler {
  constructor(guildId, channelId) {
    this.guildId = guildId;
    this.channelId = channelId;
    this.config = DatabaseManager.getConfig(guildId);
  }

  defaultEmbed(title) {
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle(title)
      .setAuthor({ name: "LunaBot", url: "https://aetherhunts.net/", iconURL: "https://tracker-dev.ff14hunttool.com/images/Lunatender.png" })
      .setFooter({text: "© AetherHunts Discord", iconURL: "https://pbs.twimg.com/profile_images/1535840755385782272/UpqL2Hp8_400x400.png"});
    return embed;
  }

  verifyChannel(guildId, channelId) {
    return (guildId == this.guildId) && (this.channelId ? channelId == this.channelId : true);
  }

  verifyPermission(command, author) {
    const authorRoles = author.roles.cache.map((role) => role.id);

    if (Debug) {
      if (authorRoles.includes(RolesId.AdminRoles["Tech Support"])) {
        return true;
      }
    }

    if (command == "Admin") {
      if (authorRoles.includes(RolesId.AdminRoles["Mod"])) {
        return true;
      }
    } else if (command == "Rep") {
      if (authorRoles.includes(RolesId.AdminRoles["Rep"])) {
        return true;
      }
    } else if (command == "Special") {
      if (authorRoles.includes(RolesId.AdminRoles["Mod"]) || authorRoles.includes(RolesId.AdminRoles["Rep"])) {
        return true;
      }
    }
    return false;
  }

  sendMessage(channel, content, keep) {
    channel.send(content).then((message) => {
      setTimeout(() => {
        if (!keep) message.delete();
      }, this.config.autoDeleteMessageDuration)
    }).catch((error) => {
      this.sendMessage(channel, content);
    });
  }
}