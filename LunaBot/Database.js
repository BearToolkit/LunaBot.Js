import { Sequelize } from 'sequelize';
const sequelize = new Sequelize("LunaBotStorage", process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
  host: "localhost",
	dialect: 'sqlite',
  define: {
    charset: 'utf8',
    collate: 'utf8_general_ci',
  },
	storage: 'lunabot.sqlite3',
  logging: false,
});

import { GuildConfigHandler, GuildMemberHandler, ComplaintLogHandler } from "./Models.js";
const GuildMember = GuildMemberHandler(sequelize);
const GuildConfig = GuildConfigHandler(sequelize);
const ComplaintLog = ComplaintLogHandler(sequelize);

const defaultConfig = {
  autoKick: true,
  autoKickThreshold: 7*24*3600*1000,
  autoDeleteMessageDuration: 30*1000,
  levelGated: 50
};

export const DatabaseManager = (function () {
  var configuration = {};

  const init = async(guildId) => {
    await GuildConfig.sync();
    const [result, created] = await GuildConfig.findOrCreate({
      where: {
        id: guildId
      },
      defaults: {
        config: JSON.stringify(defaultConfig)
      }
    });

    configuration[guildId] = JSON.parse(result.config);
    var updateRequired = false;
    for (var key of Object.keys(defaultConfig)) {
      if (!Object.keys(configuration[guildId]).includes(key)) {
        configuration[guildId][key] = defaultConfig[key];
        updateRequired = true;
      }
    }

    if (updateRequired) {
      result.config = JSON.stringify(configuration[guildId]);
      await result.save();
    }

    await GuildMember.sync();
    await ComplaintLog.sync();
    
    return true;
  }

  const getConfig = (guildId) => {
    return configuration[guildId];
  }

  const setConfig = async (guildId, config) => {
    const result = await GuildConfig.findOne({
      where: {
        id: guildId
      }
    });

    var updateRequired = false;
    for (var key of Object.keys(config)) {
      if (config[key] != configuration[guildId][key]) {
        configuration[guildId][key] = config[key];
      }
    }

    result.config = JSON.stringify(configuration[guildId]);
    await result.save();
    
    return true;
  }

  const writeComplaintLog = (guildId, author, member, reason) => {
    if (!member) {
      return ComplaintLog.create({
        guild_id: guildId,
        author: author.id,
        reason: reason
      });
    } else {
      return ComplaintLog.create({
        guild_id: guildId,
        author: author.id,
        member: member.id,
        reason: reason
      });
    }
  }

  const getEarlyPullerLogs = () => {
    return ComplaintLog.findAll({
      where: {
        reason: "Early Puller"
      },
      order: [["created_date", "DESC"]]
    });
  }

  return {
    init: init,
    getConfig: getConfig,
    setConfig: setConfig,
    writeComplaintLog: writeComplaintLog,
    getEarlyPullerLogs: getEarlyPullerLogs,
  }

})();
