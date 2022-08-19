'use strict';
import { Sequelize, DataTypes } from "sequelize";

export const GuildMemberHandler = (sequelize) => {
  const GuildMember = sequelize.define("GuildMember", {
    id: {
      primaryKey: true,
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
      unique: true,
    },
    guild_id: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    ingame_name: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    ingame_server: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    ingame_id: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    join_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    freezeTableName: true,
  });

  GuildMember.associate = function(models) {

  };

  return GuildMember;
};

export const GuildConfigHandler = (sequelize) => {
  const GuildConfig = sequelize.define("GuildConfig", {
    id: {
      primaryKey: true,
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
      unique: true,
    },
    config: {
      type: DataTypes.STRING(9999),
      defaultValue: "",
    }
  }, {
    freezeTableName: true,
  });

  GuildConfig.associate = function(models) {

  };

  return GuildConfig;
};

export const ComplaintLogHandler = (sequelize) => {
  const ComplaintLog = sequelize.define("ComplaintLog", {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
      unique: true,
    },
    created_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    guild_id: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    author: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    member: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    player_name: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    reason: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
  }, {
    freezeTableName: true,
  });

  ComplaintLog.associate = function(models) {

  };

  return ComplaintLog;
};
