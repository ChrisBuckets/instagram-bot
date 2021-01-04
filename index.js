const instagramBot = require("./instagramBot.js");
const credentials = require("./credentials.json");

const run = async () => {
  const bot = new instagramBot(credentials, 0, 0);

  await bot.init();
  let runInterval = setInterval(async function () {
    if (bot.running) {
      console.log(`bot running is ${bot.running}`);
      return console.log("already running");
    }
    if (bot.totalActions >= bot.maxLimits) {
      let date = new Date();
      await bot.log(`Bot ended at ${date.toLocaleString("en-US", { hour: "numeric", minute: "numeric", hour12: true })}`);
      clearInterval(runInterval);
      return console.log("Total actions reached");
    }
    if (bot.cooldown + bot.config.cooldown * 60000 > Date.now()) {
      console.log(bot.cooldown + "  " + Date.now() + 10000);
      console.log(`Cooldown has ${(bot.cooldown + bot.config.cooldown * 60000 - Date.now()) / 1000} seconds left.`);
      return console.log("On cooldown");
    }
    bot.cooldown = null;

    await bot.shuffleArray(bot.config.tags); //Shuffles tags so it doesn't repeat the same cycle every time
    await bot.cycleHashtags(bot.config.tags);
  }, 37000);

  await bot.shuffleArray(bot.config.tags);

  await bot.cycleHashtags(bot.config.tags);
};

run();
