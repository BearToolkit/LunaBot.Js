import fs from "fs";
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

var RolesId = JSON.parse(fs.readFileSync(__dirname + '/../resources/roles.json', 'utf8'));
let OtherDCRoles = [RolesId["StandardRoles"]["Chaos"],RolesId["StandardRoles"]["Light"],RolesId["StandardRoles"]["Materia"],RolesId["StandardRoles"]["Elemental"],RolesId["StandardRoles"]["Gaia"],RolesId["StandardRoles"]["Mana"],RolesId["StandardRoles"]["Meteor"]];

import { CronJob } from "cron";

import { Handler } from './Handler.js';
import { DatabaseManager } from './Database.js';

let DCKickList = {};

export class TaskHandler extends Handler {
  constructor(guildId) {
    super(guildId);
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
            member.createDM().then((channel) => {
              const kickDays = kickThreshold / 24 / 3600000;
              const embed = this.defaultEmbed("Automatic Removal from AetherHunt Discord")
                .setDescription("You have not verified your account within " + kickDays.toFixed(0) + "-day of joining AetherHunt Discord, per Discord rules you were removed from the Guild.");
              this.sendMessage(channel, {embeds: [embed]}, true);

              member.kick("No verification after " + kickDays.toFixed(0) + " days");
            });
            
            this.guild.channels.fetch("995751812437119036").then((debugChannel) => {
              const kickDays = kickThreshold / 24 / 3600000;
              const embed = this.defaultEmbed(member.displayName + " Automatic Removal from AetherHunt Discord")
                .setDescription("Member have not verified your account within " + kickDays.toFixed(0) + "-day of joining AetherHunt Discord.");
              this.sendMessage(debugChannel, {embeds: [embed]}, true);
            });
            
          } else {
            const timeSinceJoin = currentTime - member.joinedAt.getTime();
            const kickDays = timeSinceJoin / 24 / 3600000;
            if (kickDays > 6.5) {
              console.log(`${member.displayName} have not verified account for ${kickDays.toFixed(2)} days`);
            }
          }
        } else if (roles.length < 10) {
          for (let role of roles) {
            if (OtherDCRoles.includes(role)) {
              this.guild.channels.fetch("995751812437119036").then((debugChannel) => {
                let roleInfo = "";
                roles.map((role) => {
                  roleInfo = roleInfo + `<@&${role}>\n`
                });
                
                const embed = this.defaultEmbed(member.displayName + " (Will Be Eventually) Automatic Removed from AetherHunt Discord")
                  .addFields(
                    {name: "Reason", value: "Member is from Another Data Center joining AetherHunt Discord.", inline: true},
                    {name: "Current Role", value: roleInfo, inline: true}
                  );
                //this.sendMessage(debugChannel, {embeds: [embed]}, true);
              })
              break
            }
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
