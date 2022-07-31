import axios from "axios";
import cheerio from "cheerio";
import sharp from "sharp";

import { AttachmentBuilder } from "discord.js";
import fs from "fs";

import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
var FateDictionary = JSON.parse(fs.readFileSync(__dirname + '/../resources/fates.json', 'utf8'));

import { DatabaseManager } from './Database.js';
import { Handler } from "./Handler.js";

export class HuntMapHandler extends Handler {
  constructor(guildId, channelId) {
    super(guildId, channelId);
  }

  fetchFATEMaps(message) {
    if (!message.content.startsWith("+fatemap")) {
      return;
    }
    
    if (!this.verifyChannel(message.guildId, message.channelId)) {
      return;
    }

    this.config = DatabaseManager.getConfig(this.guildId);

    const commands = message.content.split(" ");

    if (commands.length == 2) {
      const map = commands[1];

      if (!Object.keys(FateDictionary).includes(map)) {
        const embed = this.defaultEmbed("Bad Parameters")
          .setDescription("Usage: '+fatemap [fate_name]'")
          .addFields(
            {name: "Possible Map Options", value: Object.keys(FateDictionary).join("\n"), inline: false}
          );
        this.sendMessage(message.channel, {embeds: [embed]});
      } else {
        axios.post("https://tracker-dev.ff14hunttool.com/api/fatemap", {
          QueryMap: true,
          DatabaseName: FateDictionary[map]
        }).then(async (response) => {
          
          var regions = {};
          for (var point of response.data) {
            if (!Object.keys(regions).includes(point.region)) {
              regions[point.region] = [];
            }
            regions[point.region].push(point.coordinate);
          }

          const flag = await sharp(__dirname + "/../resources/flag.png").resize(100,100).toBuffer();

          for (var name of Object.keys(regions)) {
            const response = await axios.get("https://tracker-dev.ff14hunttool.com/images/HuntRegions/" + name.replaceAll(" ","%20") + ".png", {
              responseType: 'arraybuffer'
            });
            const buffer = Buffer.from(response.data, "binary");
            const fateMap = await sharp(buffer)
              .composite(
                regions[name].map((point) => {
                  return {
                    input: flag,
                    top: Math.round(point.Y + 1024 - 50),
                    left: Math.round(point.X + 1024 - 50),
                  }
                })
              ).toBuffer();
            
            const file = new AttachmentBuilder(fateMap).setName("fatemap.png");
            const embed = this.defaultEmbed(FateDictionary[map] + " " + name)
              .setImage("attachment://fatemap.png");
            this.sendMessage(message.channel, {embeds: [embed], files: [file]}, true);
          }

        }).catch((error) => {
          console.log(error);
        })
      }
    } else {
      const embed = this.defaultEmbed("Bad Parameters")
        .setDescription("Usage: '+fatemap [fate_name]'");
      this.sendMessage(message.channel, {embeds: [embed]});
    }

    setTimeout(() => {
      message.delete();
    }, this.config.autoDeleteMessageDuration)
  }
}
