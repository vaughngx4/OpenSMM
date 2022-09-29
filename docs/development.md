# Development Guide

## Notes

- npm needs to be installed to run the API

// add links to sections here

## Frontend Development Using VS Code (Without API and/or API Data)

- The following assumes you already have a local copy of the source code and have it open in VS Code
- Install "Live Server (Five Server)" on the Extensions Marketplace, "Live Server" will not work
- Right click the "web/www" folder and select "Open with Five Server (root)"

### How to open the screen behind the "Schedule a Post" button

 Search for `debug !!!` in app.js and find these lines:
```
  const result = await getTwitterAccounts();
  const twitterAccounts = result.data;
  // const twitterAccounts = ["sintelli_tech", "mindglowingart"]; // debug !!!
```

Comment the first 2 lines and uncomment the last line like so:
```
  //const result = await getTwitterAccounts();
  //const twitterAccounts = result.data;
  const twitterAccounts = ["sintelli_tech", "mindglowingart"]; // debug !!!
```

- When pushing to development, please revert these changes.

### Show some example posts in the dashboard

Search for "debug !!!" in app.js and uncomment this line:
```
showPosts() // debug !!!
```

Comment out these 2 lines like so:
```
  // const result = await getPosts();
  // const posts = result.data;
```

Uncomment the following lines like so:
```
  const date = new Date(); // debug !!!
  const posts = [ // debug !!!
    ...
  ];
```

- When pushing to development, please revert these changes.

### Show notification

Search for "debug !!!" in app.js and uncomment the following line like so:
```
popMsg() // debug !!!
```

Search for "debug !!!" in popup-message.js and comment/uncomment the following lines like so:
```
  timedDestruction(popup, 1500000); // debug !!!
  // timedDestruction(popup, 5000);
```

- You can find the notification popup on the main dashboard
- When pushing to development, please revert these changes.

## API Development With Frontend

- This setup is not intended for frontend development
- The following assumes you already have a local copy of the source code and have a terminal/cmd open in this directory
- This setup will use your `.env` and `init-mongo.js` files as well as your `data` folder in the project root
- You must run `build.sh` first so that you have the latest images.


### Running the development environment

For ease of use, the API development environment runs in Docker. In the project root, run:
```
docker compose -f dev-compose.yaml up -d
```

To watch logs use:
```
docker logs opensmm-api -f
```

You should now be able to reach the frontend on `http://localhost`. The API will automatically update when changes are made to the code.
