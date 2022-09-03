# instagram-bot

## General Info
Instagram Bot is a tool that was made to automate engagement within certain hashtags to generate followers to save people time. A common thing when looking up
"How to get more Instagram followers", they always say follow, comment, and like similar content that you make. This is very tedious and can take up hours out of 
your day, so I created a tool that did those actions for me.

Inside the config you can set the hashtags you want the bot to look at and it will navigate through them with a headless browser to like, follow and comment on random
posts. In order to prevent being detected as a bot account, I made it so it used an array of random generic comments to use under each post so it would never spam
the same thing. It also made sure there was a random delay between each action so it looked like a human was navigating the browser. It also would only perform
about 15 actions in 25 minute intervals so the account wouldn't get locked out of interactions.

This generated about 1400 followers in a month for a video game account I created, although the account is no longer active, it still hasn't been banned
a single time.

## Code
### Human like actions
This function takes four inputs, mimum and maximum delay in seconds, a bias, and an influence. The bias is the number of seconds that is most common when generating
a random delay. No human is truly random when using an app so when accounting for a proper delay, I tried making it so the bot would have a tendency to have a 
certain amount of delay. For example if bias is set to 4 and influence 1, it will make sure that most of the time the delay will be around 4 seconds, but sometimes
drift off to a short or longer amount.
```
  async delayActions(min, max, bias, influence) {
    var rnd = Math.random() * (max - min) + min, // random in range
    let mix = Math.random() * influence; // random mixer
    let delay = (rnd * (1 - mix) + bias * mix) * 1000;
    console.log(`Waiting ${delay} seconds`);
    await this.page.waitFor(delay);
  }
```

## The Account Used
If you would like to see the account I used to generate this engagement you can find it [here](https://socialblade.com/instagram/user/valorantcircle)
Instagram doesn't save follow statistics after a few months but a couple years ago when the account was active it peaked at around 1400 followers, with an average of
about 100 likes for each post.

## Technologies

* Javascript
* NodeJS
* MongoDB
* Puppeteer


## Summary
This program saved me a lot of time when I wanted to try and grow an instagram account. With the methods that I used to avoid being banned it seemed to work
very well for the month that I used it.
