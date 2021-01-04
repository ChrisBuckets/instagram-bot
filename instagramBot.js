let TAG_URL = (tag) => `https://instagram.com/explore/tags/${tag}/`;
let PAGE_URL = (page) => `https://instagram.com/${page}`;
const puppeteer = require("puppeteer");
const jsonfile = require("jsonfile");
const fs = require("fs");
let sessionCookies;
let browser;
var mongoose = require("mongoose");
let followingModel = require("./Schemas/following.js");
let keywords = [
  {
    keyword: "clutch",
    comments: ["Nice clutch!", "Okay! 👀", "🔥", "That was crazy", "Damnnnn"],
  },
  {
    keyword: "ace",
    comments: ["Nice ace!", "That was clean", "🔥", "👀", "Nice one dude"],
  },
];

class instagramBot {
  //make object of arrays with comments done
  //make it loop through keywords to check and match it with the object of arrays to post the proper comment on the post done
  //Make config done
  //Add more random delays in between actions done
  //Track how many actions have been made per hour, and set a limit per day done

  //Add db done
  //Follow people then make it go back to the post done
  //Loop through the list of similar accounts and follow people for the remaining amount of follows from the hashtag loop done
  //Make it so it stores people followed done
  //Set limit of follows per day done

  //Set limits of follows per loop and add a total follows per day done
  //Unfollow amount of people per day but make sure the account has been following them for at least 4 days
  //Add more delays in between actions to make it look realistic done
  //Make the tendencies of the actions look human like done

  //Have a random limit each day so it fluctuates, so some days have a high limit of actions on pages and other days have lower limits on pages done
  //Shuffle what hashtags the bot goes through as well as the other theme pages it goes to so they're not in the same order everytime it goes done
  //Log every action it does not just in console, but in the log file so it's easier to follow along in what the bot is trying to do done

  //Make it DM random people from the posts you're liking and ask for a sfs?

  constructor(credentials, totalActions, totalFollows) {
    this.credentials = credentials;
    this.config = require("./config.json");
    this.action = 0;
    this.follows = 0;
    this.totalActions = totalActions;
    this.totalFollows = totalFollows;
    this.cooldown = null;
    this.setLimits();
  }

  async init() {
    console.log("yo");
    var db = mongoose.connection;
    mongoose.set("useUnifiedTopology", true);
    mongoose.connect("mongodb://localhost/followed", { useNewUrlParser: true });
    db.on("error", console.error.bind(console, "connection error:"));
    db.once("open", function () {
      console.log("Database connected");
      // we're connected!
    });
    /*followingModel.find({}, (err, followed) => {
      if (err) console.log(err);

      followed.forEach(function (user) {
        console.log(user.followed);
        console.log(`It has been ${(Date.now() - user.followed) / 1000 / 60} minutes since followed`);
      });
    });*/
    if (!browser) {
      browser = await puppeteer.launch({
        headless: true,
        args: ["--window-size=1920, 1080"],
      });
    }
    this.page = await browser.newPage();
    this.page.setViewport({
      height: 1080,
      width: 1920,
    });

    await this.loadCookies();

    await this.validateCookies();

    await this.saveCookies();

    let date = new Date();
    await this.log(`Bot started at ${date.toLocaleString("en-US", { hour: "numeric", minute: "numeric", hour12: true })}`);
  }

  async cycleHashtags(tags) {
    /*if (cooldown) {
      if (cooldown < Date.now() + 10000) {
        console.log("cooldown");
        await this.cycleHashtags(this.config.tags);
        return;
      } else {
        console.log("cooldown ended");
        cooldown = null;
      }
    }*/
    for (let i = 0; i < 5; i++) {
      try {
        this.running = true;
        await this.delayActions(1, 10, 3, 1);

        for (let j = 0; j < tags.length; j++) {
          let tag = tags[j];
          await this.page.goto(TAG_URL(tag), {
            waitUntil: "networkidle2",
          });

          await this.delayActions(1, 10, 4, 1);
          let check = await this.checkActions();
          if (check) return (this.running = false);
          for (let i = 0; i < 3; i++) {
            let posts = await this.page.$x("//article/div[2]//img");
            let post = await posts[i];
            let check = await this.checkActions();
            if (check) return (this.running = false);

            await this.clickPost(post);
            await this.page.waitForXPath("//article/header/div[2]//a");

            let postersName = await this.page.evaluate((element) => {
              return element.textContent;
            }, (await this.page.$x("//article/header/div[2]//a"))[0]);

            let checkLike = await this.like(postersName);
            if (!checkLike) continue;

            let checkText = await this.keywordCaption(this.config.keywords, postersName, tag);
            if (!checkText) await this.closePost(postersName);
          }
        }
        return (this.running = false);
      } catch (error) {
        console.log(error);
        console.log("Retrying");
        //await this.log(`${error} Retrying...`);
        continue;
      }
    }

    //await this.page.close();
    //await this.cycleHashtags(this.config.tags);
    //likePosts();
  }

  async loadCookies() {
    let cookiesFile = fs.existsSync("cookies.json");
    if (cookiesFile) {
      // If file exist load the cookies
      const cookiesArr = require(`./cookies.json`);
      if (cookiesArr.length !== 0) {
        for (let cookie of cookiesArr) {
          await this.page.setCookie(cookie);
        }
        console.log("Session has been loaded in the browser");
        await this.page.goto("https://www.instagram.com");
        await this.page.waitFor(2000);
      }
    }
  }

  async validateCookies() {
    const loginBtn = await this.page.$x('//button/div[contains(text(), "Log In")]');
    if (loginBtn.length > 0) {
      await this.page.waitFor(() => document.querySelectorAll("input").length);
      await this.page.type("[name=username]", credentials.username, { delay: 250 });
      await this.page.type("[name=password]", credentials.password, { delay: 250 });
      await loginBtn.click();
    }
  }
  async saveCookies() {
    await this.page.waitFor(() => document.querySelector("[placeholder=Search]"));
    const notNow = await this.page.$x('//button[contains(text(), "Not Now")]');
    if (notNow[0]) await notNow[0].click();
    sessionCookies = await this.page.cookies();
    // Write cookies to temp file to be used in other profile this.pages
    jsonfile.writeFile("cookies.json", sessionCookies, { spaces: 2 }, function (err) {
      if (err) {
        console.log("The file could not be written.", err);
      }
      console.log("Session has been successfully saved");
    });
  }

  async clickPost(post) {
    await this.delayActions(1, 10, 3, 1);
    //await this.log("Click post");
    console.log("click post");
    await post.click();
  }

  async like(postersName) {
    await this.page.waitForXPath("//article/header/div[2]//a");
    await this.page.waitFor(1000);
    let likeBtn = await this.page.$x('//*[name()="svg" and @aria-label="Like"]');
    let unlikeBtn = await this.page.$x('//*[name()="svg" and @aria-label="Unlike"]');
    if (unlikeBtn.length) {
      await this.closePost();
      return false;
    }
    await this.delayActions(1, 10, 4, 1);
    await likeBtn[0].click();
    this.action += 1;
    await this.logAction("Liked", postersName, this.action);
    return true;
  }

  async closePost() {
    let closeBtn = await this.page.$x('//*[name()="svg" and @aria-label="Close"]');
    await this.delayActions(1, 10, 3, 1);
    if (closeBtn[0]) await closeBtn[0].click();
    await this.log("Closed post");
  }

  async keywordCaption(keywords, postersName, tag) {
    let postersText = await this.page.evaluate((element) => {
      return element.textContent;
    }, (await this.page.$x("//article/div[2]/div/ul//span"))[0]);
    let postComment = await this.page.$x("//textarea[@aria-label='Add a comment…']");
    console.log(postersText.toLowerCase());
    await this.log("Checking for keywords...");
    for (let i = 0; i < keywords.length; i++) {
      let keyword = await keywords[i];
      console.log("checking");
      console.log(`checking ${postersText} for ${keyword.keyword}`);
      if (
        (await postersText.toLowerCase().includes(` ${keyword.keyword} `)) ||
        (await postersText.toLowerCase().includes(` #${keyword.keyword} `)) //||
        //(await postersText.toLowerCase().includes(`#${keyword.keyword} `)) ||
        //(await postersText.toLowerCase().includes(`${keyword.keyword} `))
      ) {
        console.log("has keyword");
        let randomComment = keyword.comments[Math.floor(Math.random() * keyword.comments.length)];
        await postComment[0].type(randomComment, { delay: 450 });
        let postButton = await this.page.$x('//button[contains(text(), "Post")]');
        await this.delayActions(1, 10, 3, 1);
        await postButton[0].click();
        this.action += 1;
        await this.logAction("Commented on", postersName, this.action);
        await this.follow(postersName, tag);

        /*postAmount += 1;
        console.log(postAmount);*/
        return true;
      }
    }

    return false;
    /*if ((await postersText.toLowerCase().includes(" clutch ")) || (await postersText.toLowerCase().includes(" #clutch "))) {
      let randomComment = clutchComments[Math.floor(Math.random() * clutchComments.length)];
      await postComment[0].type(randomComment);
      let postButton = await this.page.$x('//button[contains(text(), "Post")]');
      await postButton[0].click();
      postAmount += 1;
      console.log(postAmount);
      return;
    }
    if ((await postersText.toLowerCase().includes(" ace ")) || (await postersText.toLowerCase().includes(" #ace "))) {
      let randomComment = aceComments[Math.floor(Math.random() * aceComments.length)];

      await postComment[0].type(randomComment);
      let postButton = await this.page.$x('//button[contains(text(), "Post")]');
      await postButton[0].click();
      postAmount += 1;
      console.log(postAmount);
      return;
    }*/
    console.log("yoo");
  }
  async logAction(log, postersName, action) {
    await new Promise((resolve, reject) => {
      fs.writeFile(
        "log.txt",
        `${log} @${postersName}'s post | Link: ${this.page.url()} | Action: ${action} | Total Actions: ${
          this.totalActions
        } | Total Follows: ${this.totalFollows}\n`,
        { flag: "a" },
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async log(log) {
    await new Promise((resolve, reject) => {
      fs.writeFile("log.txt", `${log}\n`, { flag: "a" }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async checkActions() {
    if (this.action >= this.config.rate || this.totalActions + this.action >= this.config.maxlimit) {
      this.cooldown = Date.now();
      await this.logAction("Cooldown started", "", "");
      this.totalActions += this.action;
      this.action = 0;
      if (this.totalFollows < this.maxFollows) await this.fillFollows();
      this.totalFollows += this.follows;
      console.log(`Added ${this.follows} to total follows, now at: ${this.totalFollows}`);
      this.follows = 0;
      console.log(this.follows);

      return true;
    }
    return false;
  }

  async checkFollows() {
    if (this.follows >= this.config.followRate || this.totalFollows >= this.maxFollows) {
      return true;
    }
    return false;
  }

  async fillFollows() {
    let difference = this.config.followRate - this.follows;
    console.log(`Difference is ${difference}`);
    if (this.follows < this.config.followRate) {
      await this.shuffleArray(this.config.pages);
      for (let page in this.config.pages) {
        await this.delayActions(1, 10, 4, 1);
        await this.page.goto(PAGE_URL(this.config.pages[page]), {
          waitUntil: "networkidle2",
        });
        if (difference <= 0) {
          await this.log("Follower amount met");
          console.log("Follower amount met");
          break;
        }
        await this.page.waitForXPath('//a[contains(string(), " followers")]');
        let followersButton = await this.page.$x('//a[contains(string(), " followers")]');
        await this.delayActions(1, 10, 4, 1);
        await followersButton[0].click();
        await this.page.waitForXPath('//div[@role="presentation"]//ul/div/li');
        for (let i = 0; i < 5; i++) {
          await this.page.waitFor(1000);
          await this.page.evaluate((element) => {
            let randomScroll = Math.floor(Math.random() * (500 - 250 + 1)) + 250;
            console.log(randomScroll);
            for (let i = 0; i <= randomScroll; i++) {
              element.scrollTop += 1;
            }
          }, (await this.page.$x('//div[@role="presentation"]/div/div[2]'))[0]);
        }

        await this.delayActions(1, 10, 4, 1);
        await this.page.waitForXPath('//div[@role="presentation"]//ul/div/li//button[contains(text(), "Follow")]');

        let fillRandom = Math.floor(Math.random() * difference) + 1;
        console.log(`Following ${fillRandom} pages`);
        for (let i = 0; i < fillRandom; i++) {
          let followerList = await this.page.$x(
            '//div[@role="presentation"]//ul/div/li//button[contains(text(), "Follow") and not(contains(text(), "Following"))]'
          );
          await this.delayActions(1, 10, 4, 1);
          let check = await this.checkFollows();
          if (check) {
            await this.log("Follow limit reached");
            console.log("follow limit reached");
            break;
          }
          let follower = await followerList[i];
          //Checks if there is list of followers, if not then it scrolls down further, probably because there's no followers left to load in
          if (!follower) {
            this.logAction("Scrolling further down because follower list was not found", "name", 0);
            for (let i = 0; i < 5; i++) {
              await this.delayActions(1, 10, 1, 1);
              await this.page.evaluate((element) => {
                let randomScroll = Math.floor(Math.random() * (500 - 250 + 1)) + 250;
                console.log(randomScroll);
                for (let i = 0; i <= randomScroll; i++) {
                  element.scrollTop += 1;
                }
              }, (await this.page.$x('//div[@role="presentation"]/div/div[2]'))[0]);
            }
            followerList = await this.page.$x(
              '//div[@role="presentation"]//ul/div/li//button[contains(text(), "Follow") and not(contains(text(), "Following"))]'
            );
            follower = await followerList[i];
            if (!follower) {
              this.logAction("Follower list still not found, moving to next page", "name", 0);
              break;
            }
            this.logAction("Followers found for list, continuing", "name", 0);
          }

          let followerParent = await follower.$x("../preceding-sibling::div/div[2]//a");
          let postersName = await this.page.evaluate((element) => {
            return element.textContent;
          }, await followerParent[0]);
          console.log(postersName + "name now");
          await this.delayActions(1, 10, 1, 1);
          await follower.click();
          this.follows += 1;
          console.log(postersName + "name after");
          await this.saveFollower(postersName);
          await this.logAction("Followed", postersName, this.action);
          difference -= 1;
        }

        console.log("yo");
      }
      if (difference > 0) {
        await this.delayActions(1, 10, 4, 1);
        await this.page.goto(PAGE_URL(this.config.pages[Math.floor(Math.random() * this.config.pages.length)]), {
          waitUntil: "networkidle2",
        });

        await this.page.waitForXPath('//a[contains(string(), " followers")]');
        let followersButton = await this.page.$x('//a[contains(string(), " followers")]');
        await this.delayActions(1, 10, 4, 1);
        await followersButton[0].click();
        await this.page.waitForXPath('//div[@role="presentation"]//ul/div/li');

        await this.delayActions(1, 10, 4, 1);
        await this.page.waitForXPath('//div[@role="presentation"]//ul/div/li//button[contains(text(), "Follow")]');

        for (let i = 0; i < 5; i++) {
          await this.page.waitFor(1000);
          await this.page.evaluate((element) => {
            let randomScroll = Math.floor(Math.random() * (500 - 250 + 1)) + 250;
            console.log(randomScroll);
            for (let i = 0; i <= randomScroll; i++) {
              element.scrollTop += 1;
            }
          }, (await this.page.$x('//div[@role="presentation"]/div/div[2]'))[0]);
        }

        await this.delayActions(1, 10, 4, 1);
        await this.page.waitForXPath('//div[@role="presentation"]//ul/div/li//button[contains(text(), "Follow")]');

        for (let i = 0; i < difference; i++) {
          let followerList = await this.page.$x(
            '//div[@role="presentation"]//ul/div/li//button[contains(text(), "Follow") and not(contains(text(), "Following"))]'
          );
          await this.delayActions(1, 10, 4, 1);
          let check = await this.checkFollows();
          if (check) {
            await this.log("Follow limit reached");
            console.log("follow limit reached");
            break;
          }
          let follower = await followerList[i];

          if (!follower) {
            this.logAction("Scrolling further down because follower list was not found", "name", 0);
            for (let i = 0; i < 5; i++) {
              await this.delayActions(1, 10, 1, 1);
              await this.page.evaluate((element) => {
                let randomScroll = Math.floor(Math.random() * (500 - 250 + 1)) + 250;
                console.log(randomScroll);
                for (let i = 0; i <= randomScroll; i++) {
                  element.scrollTop += 1;
                }
              }, (await this.page.$x('//div[@role="presentation"]/div/div[2]'))[0]);
            }
            followerList = await this.page.$x(
              '//div[@role="presentation"]//ul/div/li//button[contains(text(), "Follow") and not(contains(text(), "Following"))]'
            );
            follower = await followerList[i];
            if (!follower) {
              this.logAction("Follower list still not found, moving to next page", "name", 0);
              break;
            }
            this.logAction("Followers found for list, continuing", "name", 0);
          }

          let followerParent = await follower.$x("../preceding-sibling::div/div[2]//a");
          let postersName = await this.page.evaluate((element) => {
            return element.textContent;
          }, await followerParent[0]);
          console.log(postersName + "name now");
          await this.delayActions(1, 10, 1, 1);
          await follower.click();
          await this.checkActionBlocked();
          if (this.actionBlocked) return console.log("ACTION BLOCKED");
          this.follows += 1;
          console.log(postersName + "name after");
          await this.saveFollower(postersName);
          await this.logAction("Followed", postersName, this.action);
        }
      }
      //loop through and follow people off of similar niche related pages done
      //follow random number for each page that adds up to total (random total) need to add random total
      //loop again if didn't get enough followers
    }
  }

  async follow(postersName, tag) {
    let check = await this.checkFollows();
    if (check) return this.back(tag);
    let getName = await this.page.$x("//article/header/div[2]//a");

    await this.delayActions(1, 10, 4, 1);
    await getName[0].click();
    await this.delayActions(1, 10, 4, 1);
    const followBtn = await this.page.$x('//button[contains(text(), "Follow")]');
    if (followBtn.length > 0) {
      await followBtn[0].click();
      await this.saveFollower(postersName);
    } else {
      return await this.back(tag);
    }
    await this.delayActions(1, 10, 5, 1);
    this.follows += 1;
    await this.logAction("Followed", postersName, this.action);
    await this.back(tag);
  }

  async back(tag) {
    //Goes back to hashtag page
    //await this.page.goBack();
    this.log("Going back to hashtag page");
    await this.page.goto(TAG_URL(tag), {
      waitUntil: "networkidle2",
    });
  }

  async shuffleArray(array) {
    await this.log("Shuffling array");
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * i);
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  }

  async checkActionBlocked() {
    this.logAction("check action blocked", "", "checkActionBlocked");
    await this.page.waitFor(2000);
    let check = await this.page.$x("//h3[contains(text(), 'Action Blocked')]");
    if (check.length > 0) {
      this.actionBlocked = true;
    } else {
      console.log("not found");
      console.log(check);
    }
  }

  async setLimits() {
    let maxLimits = Math.floor(Math.random() * (this.config.maxlimit - this.config.minlimit) + this.config.minlimit + 1);
    let maxFollows = Math.floor(Math.random() * (this.config.maxFollowLimit - this.config.minFollowLimit) + this.config.minFollowLimit + 1);

    this.maxLimits = maxLimits;
    this.maxFollows = maxFollows;

    if (this.config.minFollowLimit <= 0 || this.config.maxFollowLimit <= 0) {
      maxFollows = 0;
      this.maxFollows = 0;
      console.log("yo");
    }
    await this.log(`Set max limits: ${maxLimits} Set max follows: ${maxFollows}`);
    console.log(`Set max limits: ${maxLimits} Set max follows: ${maxFollows}`);
  }
  async saveFollower(postersName) {
    let followed = new followingModel({ username: postersName, followed: Date.now() });
    followed.save(function (err) {
      if (err) console.log(err);
      console.log(`Saved ${followed.username} to db`);
    });
  }

  async delayActions(min, max, bias, influence) {
    var rnd = Math.random() * (max - min) + min, // random in range
      mix = Math.random() * influence; // random mixer
    let delay = (rnd * (1 - mix) + bias * mix) * 1000;
    console.log(`Waiting ${delay} seconds`);
    await this.page.waitFor(delay);
  }
}

module.exports = instagramBot;
/*if (sessionCookies) {
            await this.page.setCookie(...sessionCookies);
            await this.page.goto("https://www.instagram.com");
          } else {
            await this.page.goto("https://instagram.com/accounts/login");
      
            await this.page.waitFor(() => document.querySelectorAll("input").length);
            await this.page.type("[name=username]", credentials.username);
            await this.page.type("[name=password]", credentials.password);
            const loginBtn = await this.page.$x(
              '//button/div[contains(text(), "Log In")]'
            );
            await loginBtn[0].click();
          }*/
