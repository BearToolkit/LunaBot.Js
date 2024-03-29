import axios from "axios";
import { load } from "cheerio";

import { EmbedBuilder } from "discord.js";
import fs from "fs";

import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

var RolesId = JSON.parse(fs.readFileSync(__dirname + '/../resources/roles.json', 'utf8'));
var huntDiscord = JSON.parse(fs.readFileSync(__dirname + '/../resources/huntDiscord.json', 'utf8'));

import { DatabaseManager } from './Database.js';
import { Handler } from "./Handler.js";

const lodestoneLookup = async (name, world) => {
  var playerId;
  const response = await axios.get("https://na.finalfantasyxiv.com/lodestone/character/?q=" + name + "&worldname=" + world);
  if (response.status == 200) {
    const html = response.data;
    const $ = load(html);

    $("a.entry__link").each((index, element) => {
      const playerName = $("p.entry__name", element).text();
      const playerWorld = $("p.entry__world", element).text();
      if (playerName == name.replaceAll("+"," ") && playerWorld.startsWith(world)) {
        playerId = $(element).attr("href").replace("/lodestone/character/","").replace("/","");
      }
    });
  }
  return playerId
}

const lodestoneVerification = async (id, verification) => {
  const response = await axios.get("https://na.finalfantasyxiv.com/lodestone/character/" + id);
  if (response.status == 200) {
    const html = response.data;
    const $ = load(html);

    var levelRequirement = 0;
    $("div.character__level__list > ul > li").each((index, element) => {
      const level = parseInt($(element).text().replace("-","0"));
      if (level > levelRequirement) {
        levelRequirement = level;
      }
    });

    const profilePic = $("div.frame__chara__face > img").attr("src");
    const ingameName = $("p.frame__chara__name").text();
    const ingameServer = $("p.frame__chara__world").text();
    const server = ingameServer.split(" ")[0];
    const dc = ingameServer.split(" [")[1].replace("]","");

    return {level: levelRequirement, profile: profilePic, name: ingameName, world: server, dc: dc};
    /*
    if ($('div.character__selfintroduction').text().includes(verification)) {
      console.log($('div.character__selfintroduction').text())
      console.log(verification)
    }
    */
  }
  return false;
}

export class CommandHandler extends Handler {
  constructor(guildId, channelId) {
    super(guildId, channelId);
  }

  async verifyUser(author, attributes) {
    try {
      const existingRoles = Object.keys(RolesId.StandardRoles).map((key) => RolesId.StandardRoles[key]);
      await author.setNickname(attributes.nick, "Verification Success");
      await author.roles.remove(existingRoles, "Verification Reset");
      await author.roles.add(attributes.roles, "Verification Success");
      return true;
    } catch (error) {
      console.log(error)
      setTimeout(() => {
        this.verifyUser(author, attributes);
      }, 5*1000)
    }
  }

  async extractPingedUser(guild, ping) {
    const memberId = ping.replace('<@','').replace('>','');
    const member = await guild.members.fetch(memberId);
    return member;
  }

  async userRoleUpdate(member, change, role) {
    try {
      if (change == "add") {
        await member.roles.add(role, "Admin Request Role Change");
      } else {
        await member.roles.remove(role, "Admin Request Role Change");
      }
      return true;
    } catch (error) {
      console.log(error)
      setTimeout(() => {
        this.userRoleUpdate(member, change, role);
      }, 5*1000)
    }
  }

  linkCharacterCommand(message) {
    if (!message.content.startsWith("+link")) {
      return;
    }
    
    if (!this.verifyChannel(message.guildId, message.channelId)) {
      return;
    }
    
    this.config = DatabaseManager.getConfig(this.guildId);

    const commands = message.content.split(" ");
    if (commands.length == 2) {
      const playerId = parseInt(commands[1]);
      
      lodestoneVerification(playerId).then((result) => {
        if (true) {
        //if (["Aether", "Crystal", "Primal"].includes(result.dc)) {
          if (result.level >= this.config.levelGated) {
            const embed = this.defaultEmbed("User Verification Success")
              .setThumbnail(result.profile)
              .addFields(
                {name: result.name + " @ " + ` ${result.world} [${result.dc}] `, value: "Welcome to AetherHunts Discord", inline: false},
                {name: "First Step", value: "You can get more role options at <#865129809452728351>", inline: true},
                {name: "Added Role", value: `<@&${RolesId.SpecialRoles["LicensedHunter"]}>\n<@&${RolesId.StandardRoles[result.world]}>\n<@&${RolesId.StandardRoles[result.dc]}>`, inline: true}
              );
            
            if (result.dc == "Aether") {
              this.verifyUser(message.member, {
                nick: result.name,
                roles: [RolesId.StandardRoles[result.world], RolesId.StandardRoles[result.dc], RolesId.SpecialRoles["LicensedHunter"]]
              });
            } else {
              let worldname = ` [${result.dc.slice(0,1).toUpperCase()}-${result.world.slice(0,4).toUpperCase()}]`;
              this.verifyUser(message.member, {
                nick: result.name + worldname,
                roles: [RolesId.StandardRoles[result.dc], RolesId.SpecialRoles["LicensedHunter"]]
              });
              
              message.member.createDM().then((channel) => {
                const embed = this.defaultEmbed("Welcome to the AetherHunt Discord")
                  .addFields(
                    {name: result.name + " @ " + ` ${result.world} [${result.dc}] `, value: "Welcome to AetherHunts Discord", inline: false},
                    {name: "Notice", value: "This is mainly used for Aether-DC Hunt-related Information. You can still pick-up roles for Aether trains/hunts if you want to stay for Cross-DC Hunts. For " + result.dc + " related hunt activities, you can visit the following link", inline: false},
                    {name: result.dc + " Hunt Discord", value:  huntDiscord[result.dc] , inline: false}
                  );
                this.sendMessage(channel, {embeds: [embed]}, true);
              });
            }
            this.sendMessage(message.channel, {embeds: [embed]});
          } else {
            const embed = this.defaultEmbed("User Verification Failed")
              .setDescription("Player-level below threshold");
            this.sendMessage(message.channel, {embeds: [embed]});
          }
        } else {
          const embed = this.defaultEmbed("User Verification Failed")
            .setDescription("We only support [Aether], [Crystal], [Primal] right now.");
          this.sendMessage(message.channel, {embeds: [embed]});
        }
      }).catch((error) => {
        console.log(error);
        const embed = this.defaultEmbed("Processing Error")
          .setDescription("Please try again in a few minutes");
        this.sendMessage(message.channel, {embeds: [embed]});
      });

    } else if (commands.length == 4) {
      const dc = commands[3].charAt(0).toUpperCase() + commands[3].substr(1).toLowerCase();
      const name = commands[1].charAt(0).toUpperCase() + commands[1].substr(1).toLowerCase() + "+" + commands[2].charAt(0).toUpperCase() + commands[2].substr(1).toLowerCase();
      lodestoneLookup(name, dc).then((result) => {
        if (result) {
          lodestoneVerification(result).then((result) => {
            if (result.level > this.config.levelGated) {
              const embed = this.defaultEmbed("User Verification Success")
                .setThumbnail(result.profile)
                .addFields(
                  {name: result.name + " @ " + ` ${result.world} [${result.dc}] `, value: "Welcome to AetherHunts Discord", inline: false},
                  {name: "First Step", value: "You can get more role options at <#865129809452728351>", inline: true},
                  {name: "Added Role", value: `<@&${RolesId.SpecialRoles["LicensedHunter"]}>\n<@&${RolesId.StandardRoles[result.world]}>\n<@&${RolesId.StandardRoles[result.dc]}>`, inline: true}
                );

              if (result.dc == "Aether") {
                this.verifyUser(message.member, {
                  nick: result.name,
                  roles: [RolesId.StandardRoles[result.world], RolesId.StandardRoles[result.dc], RolesId.SpecialRoles["LicensedHunter"]]
                });
              } else {
                let worldname = ` [${result.dc.slice(0,1).toUpperCase()}-${result.world.slice(0,4).toUpperCase()}]`;
                this.verifyUser(message.member, {
                  nick: result.name + worldname,
                  roles: [RolesId.StandardRoles[result.dc], RolesId.SpecialRoles["LicensedHunter"]]
                });
                
                message.member.createDM().then((channel) => {
                  const embed = this.defaultEmbed("Welcome to the AetherHunt Discord")
                    .addFields(
                      {name: result.name + " @ " + ` ${result.world} [${result.dc}] `, value: "Welcome to AetherHunts Discord", inline: false},
                      {name: "Notice", value: "This is mainly used for Aether-DC Hunt-related Information. You can still pick-up roles for Aether trains/hunts if you want to stay for Cross-DC Hunts. For " + result.dc + " related hunt activities, you can visit the following link", inline: false},
                      {name: result.dc + " Hunt Discord", value:  huntDiscord[result.dc] , inline: false}
                    );
                  this.sendMessage(channel, {embeds: [embed]}, true);
                });
              }
              this.sendMessage(message.channel, {embeds: [embed]});
            } else {
              const embed = this.defaultEmbed("User Verification Failed")
                .setDescription("Player-level below threshold");
              this.sendMessage(message.channel, {embeds: [embed]});
            }
          }).catch((error) => {
            console.log(error);
            const embed = this.defaultEmbed("Processing Error")
              .setDescription("Please try again in a few minutes");
            this.sendMessage(message.channel, {embeds: [embed]});
          })
        } else {
          const embed = this.defaultEmbed("User Verification Failed")
            .setDescription("Player not found");
          this.sendMessage(message.channel, {embeds: [embed]});
        }
      }).catch((error) => {
        console.log(error);
        const embed = this.defaultEmbed("Processing Error")
          .setDescription("Please try again in a few minutes");
        this.sendMessage(message.channel, {embeds: [embed]});
      });

    } else {
      const embed = this.defaultEmbed("Bad Parameters")
      .setDescription("Usage: '+link [FirstName] [LastName] [World]' or '+link [ID]'");
      this.sendMessage(message.channel, {embeds: [embed]});
    }

    setTimeout(() => {
      message.delete();
    }, this.config.autoDeleteMessageDuration)
  }

  async setPlayerRoles(message) {
    if (!message.content.startsWith("+viewroles") && !message.content.startsWith("+addroles") && !message.content.startsWith("+removeroles")) {
      return;
    }
  
    if (!this.verifyChannel(message.guildId, message.channelId)) {
      return;
    }

    const commands = message.content.split(" ");
    if (commands.length < 2) {
      const embed = this.defaultEmbed("Bad Parameters")
        .setDescription("Usage: " + commands[0] + " [@player]");
      this.sendMessage(message.channel, {embeds: [embed]});
    }

    this.config = DatabaseManager.getConfig(this.guildId);

    this.extractPingedUser(message.guild, commands[1]).then((member) => {
      if (!this.verifyPermission("Admin", message.member) && member != message.member) {
        console.log(member)
        console.log(message.member)
        return;
      }

      if (commands[0] == "+viewroles") {
        if (commands.length > 2) {
          const embed = this.defaultEmbed("Bad Parameters")
            .setDescription("Usage: " + commands[0] + " [@player]");
          this.sendMessage(message.channel, {embeds: [embed]});
          return;
        }

        let roleString = "";
        const roles = member.roles.cache.map((role) => roleString += `<@&${role.id}>\n`);
        
        const embed = this.defaultEmbed("Displaying Existing Roles")
          .addFields(
            {name: member.displayName, value: "Below are your currently used roles", inline: false},
            {name: "Roles", value: roleString, inline: false}
          );
        this.sendMessage(message.channel, {embeds: [embed]});
        return;
      } else if (commands[0] == "+removeroles") {
        if (commands.length < 3) {
          const embed = this.defaultEmbed("Bad Parameters")
            .setDescription("Usage: " + commands[0] + " [@player] all-roles/[roles1,roles2...]");
          this.sendMessage(message.channel, {embeds: [embed]});
          return;
        }

        const rolesSelected = commands.slice(2).join(" ");
        if (rolesSelected == "all-roles") {
          let standardRoles = [...Object.keys(RolesId.StandardRoles).map((key) => RolesId.StandardRoles[key]), ...Object.keys(RolesId.SpecialRoles).map((key) => RolesId.SpecialRoles[key]), "542602456132091904"]
          const roles = member.roles.cache.map((role) => role.id).filter((roleId) => !standardRoles.includes(roleId));
          
          let roleString = "";
          roles.map((role) => roleString += `<@&${role}>\n`);

          member.roles.remove(roles, "Command-based Role Removal").then(() => {
            const embed = this.defaultEmbed("Success Removing these Roles")
              .addFields(
                {name: member.displayName, value: "Below are the roles being removed", inline: false},
                {name: "Roles", value: roleString, inline: false}
              );
            this.sendMessage(message.channel, {embeds: [embed]});
          });
          return

        } else {
          let standardRoles = [...Object.keys(RolesId.StandardRoles).map((key) => RolesId.StandardRoles[key]), ...Object.keys(RolesId.SpecialRoles).map((key) => RolesId.SpecialRoles[key]), "542602456132091904"]
          
          try {
            const roleNameList = rolesSelected.replace("[","").replace("]","").split(",").map((roleName) => roleName.trim());
            const roles = member.roles.cache.filter((role) => roleNameList.includes(role.name) && !standardRoles.includes(role.id))
          
            let roleString = "";
            roles.map((role) => roleString += `<@&${role.id}>\n`);

            member.roles.remove(roles.map((role) => role.id), "Command-based Role Removal").then(() => {
              const embed = this.defaultEmbed("Success Removing these Roles")
                .addFields(
                  {name: member.displayName, value: "Below are the roles being removed", inline: false},
                  {name: "Roles", value: roleString, inline: false}
                );
              this.sendMessage(message.channel, {embeds: [embed]});
            });
            return;
            
          } catch (error) {
            console.log(error);
            const embed = this.defaultEmbed("Bad Parameters")
              .setDescription("Usage: " + commands[0] + " [@player] all-roles/[roles1,roles2...]");
            this.sendMessage(message.channel, {embeds: [embed]});
          }
        }
      } else if (commands[0] == "+addroles") {
        if (!this.verifyPermission("Admin", message.member)) {
          return;
        }

        if (commands.length < 3) {
          const embed = this.defaultEmbed("Bad Parameters")
            .setDescription("Usage: " + commands[0] + " [@player] [roles1,roles2...]");
          this.sendMessage(message.channel, {embeds: [embed]});
          return;
        }

        const rolesSelected = commands.slice(2).join(" ");
        let standardRoles = [...Object.keys(RolesId.StandardRoles).map((key) => RolesId.StandardRoles[key]), ...Object.keys(RolesId.SpecialRoles).map((key) => RolesId.SpecialRoles[key]), "542602456132091904"]
        
        try {
          const roleNameList = rolesSelected.replace("[","").replace("]","").split(",").map((roleName) => roleName.trim());
          const roles = message.guild.roles.cache.filter((role) => roleNameList.includes(role.name))
        
          let roleString = "";
          roles.map((role) => roleString += `<@&${role.id}>\n`);

          member.roles.add(roles.map((role) => role.id), "Command-based Role Addition").then(() => {
            const embed = this.defaultEmbed("Success Adding these Roles")
              .addFields(
                {name: member.displayName, value: "Below are the roles being added", inline: false},
                {name: "Roles", value: roleString, inline: false}
              );
            this.sendMessage(message.channel, {embeds: [embed]});
          });
          return;
          
        } catch (error) {
          console.log(error);
          const embed = this.defaultEmbed("Bad Parameters")
            .setDescription("Usage: " + commands[0] + " [@player] [roles1,roles2...]");
          this.sendMessage(message.channel, {embeds: [embed]});
        }
      } else {
        const embed = this.defaultEmbed("Bad Parameters")
          .setDescription("Usage: " + commands[0] + " Not Implemented");
        this.sendMessage(message.channel, {embeds: [embed]});
      }
    }).catch((error) => {
      const embed = this.defaultEmbed("Bad Parameters")
        .setDescription("Usage: " + commands[0] + " [@player]");
      this.sendMessage(message.channel, {embeds: [embed]});
    });
    
    setTimeout(() => {
      message.delete();
    }, this.config.autoDeleteMessageDuration)
  }

  async toggleConductorRoleCommand(message) {
    if (!message.content.startsWith("+conductor")) {
      return;
    }
  
    if (!this.verifyChannel(message.guildId, message.channelId)) {
      return;
    }

    if (!this.verifyPermission("Special", message.member)) {
      return;
    }
    
    this.config = DatabaseManager.getConfig(this.guildId);

    const commands = message.content.split(" ");
    if (commands.length == 3) {
      this.extractPingedUser(message.guild, commands[2]).then((member) => {
        if (commands[1] == "add" || commands[1] == "remove") {
          this.userRoleUpdate(member, commands[1], RolesId.SpecialRoles["Conductor"]);
          const embed = this.defaultEmbed("Role Change Success")
          this.sendMessage(message.channel, {embeds: [embed]});
        } else {
          const embed = this.defaultEmbed("Bad Parameters")
            .setDescription("Usage: '+conductor [add/remove] [@player]");
          this.sendMessage(message.channel, {embeds: [embed]});
        }
      }).catch((error) => {
        const embed = this.defaultEmbed("Bad Parameters")
        .setDescription("Usage: '+conductor [add/remove] [@player]");
        this.sendMessage(message.channel, {embeds: [embed]});
      });
    } else {
      const embed = this.defaultEmbed("Bad Parameters")
        .setDescription("Usage: '+conductor [add/remove] [@player]");
      this.sendMessage(message.channel, {embeds: [embed]});
    }

    setTimeout(() => {
      message.delete();
    }, this.config.autoDeleteMessageDuration)
  }
  
  async toggleSpawnerRoleCommand(message) {
    if (!message.content.startsWith("+spawner")) {
      return;
    }
  
    if (!this.verifyChannel(message.guildId, message.channelId)) {
      return;
    }

    if (!this.verifyPermission("Special", message.member)) {
      return;
    }
    
    this.config = DatabaseManager.getConfig(this.guildId);

    const commands = message.content.split(" ");
    if (commands.length == 3) {
      this.extractPingedUser(message.guild, commands[2]).then((member) => {
        if (commands[1] == "add" || commands[1] == "remove") {
          this.userRoleUpdate(member, commands[1], RolesId.SpecialRoles["Spawner"]);
          const embed = this.defaultEmbed("Role Change Success")
          this.sendMessage(message.channel, {embeds: [embed]});
        } else {
          const embed = this.defaultEmbed("Bad Parameters")
            .setDescription("Usage: '+spawner [add/remove] [@player]");
          this.sendMessage(message.channel, {embeds: [embed]});
        }
      }).catch((error) => {
        const embed = this.defaultEmbed("Bad Parameters")
        .setDescription("Usage: '+spawner [add/remove] [@player]");
        this.sendMessage(message.channel, {embeds: [embed]});
      });
    } else {
      const embed = this.defaultEmbed("Bad Parameters")
        .setDescription("Usage: '+spawner [add/remove] [@player]");
      this.sendMessage(message.channel, {embeds: [embed]});
    }

    setTimeout(() => {
      message.delete();
    }, this.config.autoDeleteMessageDuration)
  }
  
  async toggleConductorRoleCommand(message) {
    if (!message.content.startsWith("+conductor")) {
      return;
    }
  
    if (!this.verifyChannel(message.guildId, message.channelId)) {
      return;
    }

    if (!this.verifyPermission("Special", message.member)) {
      return;
    }
    
    this.config = DatabaseManager.getConfig(this.guildId);

    const commands = message.content.split(" ");
    if (commands.length == 3) {
      this.extractPingedUser(message.guild, commands[2]).then((member) => {
        if (commands[1] == "add" || commands[1] == "remove") {
          this.userRoleUpdate(member, commands[1], RolesId.SpecialRoles["Conductor"]);
          const embed = this.defaultEmbed("Role Change Success")
          this.sendMessage(message.channel, {embeds: [embed]});
        } else {
          const embed = this.defaultEmbed("Bad Parameters")
            .setDescription("Usage: '+conductor [add/remove] [@player]");
          this.sendMessage(message.channel, {embeds: [embed]});
        }
      }).catch((error) => {
        const embed = this.defaultEmbed("Bad Parameters")
        .setDescription("Usage: '+conductor [add/remove] [@player]");
        this.sendMessage(message.channel, {embeds: [embed]});
      });
    } else {
      const embed = this.defaultEmbed("Bad Parameters")
        .setDescription("Usage: '+conductor [add/remove] [@player]");
      this.sendMessage(message.channel, {embeds: [embed]});
    }

    setTimeout(() => {
      message.delete();
    }, this.config.autoDeleteMessageDuration)
  }
  
  async updateEarlyPullerTimer(message) {
    if (!message.content.startsWith("+ep")) {
      return;
    }
  
    if (!this.verifyChannel(message.guildId, message.channelId)) {
      return;
    }

    if (!this.verifyPermission("Special", message.member)) {
      return;
    }
    
    this.config = DatabaseManager.getConfig(this.guildId);

    await DatabaseManager.writeComplaintLog(message.guild.id, message.member, null, "Early Puller");
    const earlyPullers = await DatabaseManager.getEarlyPullerLogs();

    var sinceLastEP = 0;
    var longestDuration = 0;
    if (earlyPullers.length > 1) {
      sinceLastEP = new Date(earlyPullers[0].created_date).getTime() - new Date(earlyPullers[1].created_date).getTime();
      longestDuration = sinceLastEP;
      for (var i = 1; i < earlyPullers.length; i++) {
        const currentDuration = new Date(earlyPullers[i-1].created_date).getTime() - new Date(earlyPullers[i].created_date).getTime();
        if (currentDuration > longestDuration) {
          longestDuration = currentDuration;
        }
      }
    }

    const getDay = (timestamp) => {
      const dayIndex = Math.floor(timestamp / (24*3600000));
      if (dayIndex > 1) {
        return `${dayIndex} days`;
      } 
      return `${dayIndex} day`;
    }
    const getHour = (timestamp) => {
      const hourIndex = Math.floor((timestamp % (24*3600000)) / 3600000);
      if (hourIndex > 1) {
        return `${hourIndex} hours`;
      } 
      return `${hourIndex} hour`;
    }
    const getMinutes = (timestamp) => {
      const minutesIndex = Math.floor((timestamp % (3600000)) / 60000);
      if (minutesIndex > 1) {
        return `${minutesIndex} minutes`;
      } 
      return `${minutesIndex} minute`;
    }
    const getSeconds = (timestamp) => {
      const secondsIndex = Math.floor((timestamp % (60000)) / 1000);
      if (secondsIndex > 1) {
        return `${secondsIndex} seconds`;
      } 
      return `${secondsIndex} second`;
    }

    const embed = this.defaultEmbed("Early pull complaint detected!")
      .setDescription(`
        Please remember that Aether Hunts cannot control whether people pull marks early. Sometimes, this happens by accident. Other times, this is done by people beyond the mod team's jurisdiction. Regardless, please be advised that there will be additional S Rank marks in the future.`)
      .addFields(
        {name: "Current: ", value: `We have gone ${getDay(sinceLastEP)} ${getHour(sinceLastEP)} ${getMinutes(sinceLastEP)} ${getSeconds(sinceLastEP)} since the last logged complaint.`, inline: false},
        {name: "Record: ", value: `Our record between logged complaints is ${getDay(longestDuration)} ${getHour(longestDuration)} ${getMinutes(longestDuration)} ${getSeconds(longestDuration)}.`, inline: false},
      );

    this.sendMessage(message.channel, {embeds: [embed]}, true);
  }

  /* This is not being used 
  async addEarlyPullerComplaint(message) {
    if (!message.content.startsWith("+ep")) {
      return;
    }
  
    if (!this.verifyChannel(message.guildId, message.channelId)) {
      return;
    }

    if (!this.verifyPermission("Special", message.member)) {
      return;
    }
    
    this.config = DatabaseManager.getConfig(this.guildId);

    const commands = message.content.split(" ");
    if (commands.length == 2) {
      this.extractPingedUser(message.guild, commands[1]).then((member) => {
        DatabaseManager.writeComplaintLog(message.guild.id, message.member, member, "Early Puller");
        const embed = this.defaultEmbed("Early Puller Complaint Logged")
        this.sendMessage(message.channel, {embeds: [embed]});
      }).catch((error) => {
        const embed = this.defaultEmbed("Bad Parameters")
        .setDescription("Usage: '+ep [@player]");
        this.sendMessage(message.channel, {embeds: [embed]});
      });
    } else {
      const embed = this.defaultEmbed("Bad Parameters")
        .setDescription("Usage: '+ep [@player]");
      this.sendMessage(message.channel, {embeds: [embed]});
    }

    setTimeout(() => {
      message.delete();
    }, this.config.autoDeleteMessageDuration)
  }
  */
}
