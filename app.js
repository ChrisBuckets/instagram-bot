//Make actions look more human by adding delays
//Make it give a generic comment based on the keywords found
//Maybe make it not like spam posts or figure out posts that are unrelated to valorant?

const puppeteer = require("puppeteer");
const jsonfile = require("jsonfile");
const fs = require("fs");
const credentials = require("./credentials.json");
let TAG_URL = (tag) => `https://instagram.com/explore/tags/${tag}/`;
let sessionCookies;
let browser;
let tags = ["valorant", "valorantgame"];
let clutchComments = ["Nice clutch!", "Okay! 👀", "🔥", "That was crazy", "Damnnnn"];
let postAmount = 0;
let aceComments = ["Nice ace!", "That was clean", "🔥", "👀", "Nice one dude"];
let posterNames = [];
async function likePosts() {
  try {
    if (!browser) {
      browser = await puppeteer.launch({
        headless: false,
        args: ["--window-size=1920, 1080"],
      });
    }
    const page = await browser.newPage();
    page.setViewport({
      height: 1080,
      width: 1920,
    });
    let cookiesFile = fs.existsSync("cookies.json");
    if (cookiesFile) {
      // If file exist load the cookies
      const cookiesArr = require(`./cookies.json`);
      if (cookiesArr.length !== 0) {
        for (let cookie of cookiesArr) {
          await page.setCookie(cookie);
        }
        console.log("Session has been loaded in the browser");
        await page.goto("https://www.instagram.com");
        await page.waitFor(2000);
        const loginBtn = await page.$x('//button/div[contains(text(), "Log In")]');
        if (loginBtn.length > 0) {
          await page.waitFor(() => document.querySelectorAll("input").length);
          await page.type("[name=username]", credentials.username);
          await page.type("[name=password]", credentials.password);
          await loginBtn.click();
        }
      }
    }
    /*if (sessionCookies) {
      await page.setCookie(...sessionCookies);
      await page.goto("https://www.instagram.com");
    } else {
      await page.goto("https://instagram.com/accounts/login");

      await page.waitFor(() => document.querySelectorAll("input").length);
      await page.type("[name=username]", credentials.username);
      await page.type("[name=password]", credentials.password);
      const loginBtn = await page.$x(
        '//button/div[contains(text(), "Log In")]'
      );
      await loginBtn[0].click();
    }*/

    await page.waitFor(() => document.querySelector("[placeholder=Search]"));
    const notNow = await page.$x('//button[contains(text(), "Not Now")]');
    if (notNow[0]) await notNow[0].click();
    sessionCookies = await page.cookies();
    // Write cookies to temp file to be used in other profile pages
    jsonfile.writeFile("cookies.json", sessionCookies, { spaces: 2 }, function (err) {
      if (err) {
        console.log("The file could not be written.", err);
      }
      console.log("Session has been successfully saved");
    });
    console.log(TAG_URL(tags[0]));
    await page.waitFor(3000);
    for (j = 0; j < tags.length; j++) {
      let tag = tags[j];
      await page.goto(TAG_URL(tag), {
        waitUntil: "networkidle2",
      });
      await page.waitFor(4000);
      let posts = await page.$x("//article/div[2]//img");
      console.log(posts.length);
      for (i = 0; i < 3; i++) {
        console.log("ye");
        let post = await posts[i];
        await post.click();
        await page.waitForXPath("//article/header/div[2]//a");
        await page.waitFor(1000);
        let postersName = await page.evaluate((element) => {
          return element.textContent;
        }, (await page.$x("//article/header/div[2]//a"))[0]);
        let likeBtn = await page.$x('//*[name()="svg" and @aria-label="Like"]');
        console.log(likeBtn);
        if (!likeBtn[0]) {
          let closeBtn = await page.$x('//*[name()="svg" and @aria-label="Close"]');
          await page.waitFor(4000);
          await closeBtn[0].click();
          continue;
        }
        await likeBtn[0].click();
        if (!posterNames.includes(postersName)) {
          console.log("not same");
          if (posterNames.length >= 3) posterNames = [];

          posterNames.push(postersName);
          console.log(posterNames);
          let postersText = await page.evaluate((element) => {
            return element.textContent;
          }, (await page.$x("//article/div[2]/div/ul//span"))[0]);
          let postComment = await page.$x("//textarea[@aria-label='Add a comment…']");
          console.log(postersText.toLowerCase());
          if ((await postersText.toLowerCase().includes(" clutch ")) || (await postersText.toLowerCase().includes(" #clutch "))) {
            let randomComment = clutchComments[Math.floor(Math.random() * clutchComments.length)];
            await postComment[0].type(randomComment);
            let postButton = await page.$x('//button[contains(text(), "Post")]');
            await postButton[0].click();
            postAmount += 1;
            console.log(postAmount);
            continue;
          }
          if ((await postersText.toLowerCase().includes(" ace ")) || (await postersText.toLowerCase().includes(" #ace "))) {
            let randomComment = aceComments[Math.floor(Math.random() * aceComments.length)];

            await postComment[0].type(randomComment);
            let postButton = await page.$x('//button[contains(text(), "Post")]');
            await postButton[0].click();
            postAmount += 1;
            console.log(postAmount);
            continue;
          }
        }

        let closeBtn = await page.$x('//*[name()="svg" and @aria-label="Close"]');
        await page.waitFor(4000);
        await closeBtn[0].click();
      }
    }

    await page.close();

    likePosts();
  } catch (err) {
    console.error("Exception: ", err);
    //await browser.close();
    //browser = null;
    //likePosts();
  }
}
likePosts();
