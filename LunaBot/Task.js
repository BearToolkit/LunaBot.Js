import fs from "fs";
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

import { CronJob } from "cron";

import { DatabaseManager } from './Database.js';

export class TaskHandler {
  constructor(guildId) {
    this.guildId = guildId;
    this.config = DatabaseManager.getConfig(this.guildId);
  }

  autoKickMember() {
    this.config = DatabaseManager.getConfig(this.guildId);

    if (this.config.autoKick) {
      const kickThreshold = this.config.autoKickThreshold;
      const currentTime = new Date().getTime();
      this.guild.members.cache.each((member) => {
        const roles = member.roles.cache.map((role) => role.id);
        if (roles.length == 1) {
          if (currentTime - member.joinedAt.getTime() > kickThreshold) {
            console.log("Kick Required for " + member.displayName);
          }
        }
      })

      console.log(this.guild.members.cache.size);
    }
  }

  async setupMemberHandlingTask(guild) {
    this.guild = guild;
    await this.guild.members.fetch();

    this.memberCheck = new CronJob(
      "* * * * *",
      this.autoKickMember.bind(this),
      null,
      true,
    )
  }
}
