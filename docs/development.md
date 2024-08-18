# Development Guide
- [Development Guide](#development-guide)
  - [Setting things up](#setting-things-up)

[<= Back](ReadMe.md "Documentation Index")

## Setting things up

- This setup will use your `.env` and `init-mongo.js` files as well as your `data` folder in the project root

Build images:
```
./build.sh
```

Install node packages in the `api/app` folder (you will need to have npm installed):
```
cd api/app
npm install
```

For ease of use, the API development environment runs in Docker. In the project root, run:
```
docker compose -f dev-compose.yaml up -d
```

To watch API logs use:
```
docker logs opensmm-api -f
```

If you get an error in the API regarding the `sharp` module, run the following commands:
```
cd api/app
npm uninstall sharp
npm install --platform=linuxmusl --arch=x64 sharp
```

This is due to installing modules on your main machine but having them run inside a container.

You should now be able to reach the frontend on `http://localhost`. The API will automatically update when changes are made to the code. For the frontend, you will need to clear your browser cache periodically in order to view code changes.

[<= Back](ReadMe.md "Documentation Index")