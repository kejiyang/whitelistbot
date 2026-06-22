require("dotenv").config();
const fs = require("fs");

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const STAFF_ROLE = "Staff";
const CITIZEN_ROLE = "Citizen";

const REQUEST_CHANNEL = "🔎┆ᴡʜɪᴛᴇʟɪsᴛ-ʀᴇǫᴜᴇsᴛ";
const LOG_CHANNEL = "whitelist-logs";

let db = {};

if (fs.existsSync("./database.json")) {
  db = JSON.parse(
    fs.readFileSync("./database.json", "utf8")
  );
}

function saveDatabase() {
  fs.writeFileSync(
    "./database.json",
    JSON.stringify(db, null, 2)
  );
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.once("ready", () => {
  console.log(`${client.user.tag} online`);
});

client.on("interactionCreate", async (interaction) => {

  try {

    if (
      interaction.isChatInputCommand() &&
      interaction.commandName === "whitelist"
    ) {

      const name =
        interaction.options.getString("name");

      const vouch =
        interaction.options.getUser("vouch");

      const userId =
        interaction.user.id;

      if (
        db[userId] &&
        db[userId].status === "pending"
      ) {
        return interaction.reply({
          content:
            "❌ You already have a pending whitelist application.",
          ephemeral: true
        });
      }

      db[userId] = {
        name,
        vouch: vouch.id,
        status: "pending"
      };

      saveDatabase();

      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("Whitelist Application")
        .addFields(
          {
            name: "Applicant",
            value: `<@${userId}>`
          },
          {
            name: "Name",
            value: name
          },
          {
            name: "Vouch By",
            value: `<@${vouch.id}>`
          },
          {
            name: "Vouch Status",
            value: "❌ Pending"
          },
          {
            name: "Staff Approval",
            value: "❌ Pending"
          }
        );

      const row =
        new ActionRowBuilder()
          .addComponents(

            new ButtonBuilder()
              .setCustomId(
                `vouch_${vouch.id}_${userId}`
              )
              .setLabel("Vouch Approved")
              .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
              .setCustomId(
                `staff_${userId}`
              )
              .setLabel("Staff Approved")
              .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
              .setCustomId(
                `deny_${userId}`
              )
              .setLabel("Denied")
              .setStyle(ButtonStyle.Danger)

          );

      const requestChannel =
        interaction.guild.channels.cache.find(
          c => c.name === REQUEST_CHANNEL
        );

      if (!requestChannel) {
        return interaction.reply({
          content:
            "Whitelist request channel not found.",
          ephemeral: true
        });
      }

      await requestChannel.send({
        embeds: [embed],
        components: [row]
      });

      await interaction.reply({
        content:
          "✅ Application submitted.",
        ephemeral: true
      });
    }
        if (interaction.isButton()) {

      const parts =
        interaction.customId.split("_");

      const action =
        parts[0];

      const embed =
        EmbedBuilder.from(
          interaction.message.embeds[0]
        );

      if (action === "vouch") {

        const vouchId =
          parts[1];

        if (
          interaction.user.id !== vouchId
        ) {
          return interaction.reply({
            content:
              "Only the tagged vouch user can approve.",
            ephemeral: true
          });
        }

        const citizenRole =
          interaction.guild.roles.cache.find(
            r => r.name === CITIZEN_ROLE
          );

        if (!citizenRole) {
          return interaction.reply({
            content:
              "Citizen role not found.",
            ephemeral: true
          });
        }

        if (
          !interaction.member.roles.cache.has(
            citizenRole.id
          )
        ) {
          return interaction.reply({
            content:
              "You must have the Citizen role to vouch.",
            ephemeral: true
          });
        }

        embed.data.fields[3].value =
          `✅ Approved by ${interaction.user}`;

        await interaction.update({
          embeds: [embed]
        });
      }

      if (action === "staff") {

        const applicantId =
          parts[1];

        const staffRole =
          interaction.guild.roles.cache.find(
            r => r.name === STAFF_ROLE
          );

        if (!staffRole) {
          return interaction.reply({
            content:
              "Staff role not found.",
            ephemeral: true
          });
        }

        if (
          !interaction.member.roles.cache.has(
            staffRole.id
          )
        ) {
          return interaction.reply({
            content:
              "Staff only.",
            ephemeral: true
          });
        }

        const applicant =
          await interaction.guild.members.fetch(
            applicantId
          );

        const citizenRole =
          interaction.guild.roles.cache.find(
            r => r.name === CITIZEN_ROLE
          );

        if (citizenRole) {
          await applicant.roles.add(
            citizenRole
          );
        }

        const submittedName =
          embed.data.fields[1].value;

        try {

          await applicant.setNickname(
            submittedName
          );

        } catch (err) {

          console.log(
            "Nickname change failed:",
            err.message
          );

        }

        db[applicantId] =
          db[applicantId] || {};

        db[applicantId].status =
          "approved";

        db[applicantId].approvedBy =
          interaction.user.id;

        saveDatabase();

        embed.data.fields[4].value =
          `✅ Approved by ${interaction.user}`;

        const disabledRow =
          new ActionRowBuilder()
            .addComponents(

              new ButtonBuilder()
                .setCustomId("done1")
                .setLabel(
                  "Vouch Approved"
                )
                .setStyle(
                  ButtonStyle.Primary
                )
                .setDisabled(true),

              new ButtonBuilder()
                .setCustomId("done2")
                .setLabel(
                  "Staff Approved"
                )
                .setStyle(
                  ButtonStyle.Success
                )
                .setDisabled(true),

              new ButtonBuilder()
                .setCustomId("done3")
                .setLabel("Locked")
                .setStyle(
                  ButtonStyle.Secondary
                )
                .setDisabled(true)

            );
                    const logChannel =
          interaction.guild.channels.cache.find(
            c => c.name === LOG_CHANNEL
          );

        if (logChannel) {

          await logChannel.send({
            embeds: [

              new EmbedBuilder()
                .setColor("Green")
                .setTitle(
                  "🟢 Whitelist Approved"
                )
                .addFields(

                  {
                    name: "User",
                    value: `<@${applicantId}>`
                  },

                  {
                    name: "Name",
                    value: submittedName
                  },

                  {
                    name: "Approved By",
                    value: `${interaction.user}`
                  }

                )

            ]
          });

        }

        await interaction.update({
          embeds: [embed],
          components: [disabledRow]
        });

      }

      if (action === "deny") {

        const applicantId =
          parts[1];

        const staffRole =
          interaction.guild.roles.cache.find(
            r => r.name === STAFF_ROLE
          );

        if (
          !staffRole ||
          !interaction.member.roles.cache.has(
            staffRole.id
          )
        ) {

          return interaction.reply({
            content: "Staff only.",
            ephemeral: true
          });

        }

        if (db[applicantId]) {

          db[applicantId].status =
            "denied";

          saveDatabase();

        }

        embed.data.fields[3].value =
          "❌ Denied";

        embed.data.fields[4].value =
          `❌ Denied by ${interaction.user}`;

        const disabledRow =
          new ActionRowBuilder()
            .addComponents(

              new ButtonBuilder()
                .setCustomId("done")
                .setLabel("Application Closed")
                .setStyle(
                  ButtonStyle.Secondary
                )
                .setDisabled(true)

            );

        const logChannel =
          interaction.guild.channels.cache.find(
            c => c.name === LOG_CHANNEL
          );

        if (logChannel) {

          await logChannel.send({

            embeds: [

              new EmbedBuilder()
                .setColor("Red")
                .setTitle(
                  "🔴 Whitelist Denied"
                )
                .addFields(

                  {
                    name: "User",
                    value: `<@${applicantId}>`
                  },

                  {
                    name: "Denied By",
                    value: `${interaction.user}`
                  }

                )

            ]

          });

        }

        await interaction.update({
          embeds: [embed],
          components: [disabledRow]
        });

      }

    }

  } catch (err) {

    console.error(err);

  }

});

client.login(process.env.TOKEN);