# OpenSMM
![build status](https://img.shields.io/badge/build-passing-green?style=for-the-badge "")
![forks](https://img.shields.io/github/license/vaughngx4/OpenSMM?style=for-the-badge "")
![stars](https://img.shields.io/github/stars/vaughngx4/OpenSMM?style=for-the-badge "")
![forks](https://img.shields.io/github/forks/vaughngx4/OpenSMM?style=for-the-badge "")

## Description
OpenSMM(Open Social Media Marketing) is a self-hosted social media marketing platform built to assist small businesses manage their social media more easily.

![desktop-ui](docs/images/desktop-ui-1.gif "")

## :red_circle: Please Note:
- This project is in early development stages.
- Seek help on Discord(links at the bottom) for general support.
- All errors (should) print to Docker logs, if you encounter any that you can't fix(not config related) or something goes wrong but no errors are printed, open an issue.
- !!! BREAKING CHANGES !!!
- Some variable names in the `.env` file have changed to match the compose yaml(for development purposes), please change yours accordingly.
- `init-mongo.js` has been moved to the project root for ease of use. `quick-setup.sh` was also added to automatically generate `init-mongo.js` from your `.env` variables.
- The data folder has changed. `data/mongo/db` is now `data/db`. If you wish to keep old data, you will have to make this change.

### What Works
- Twitter text type scheduled posts
- Twitter poll type scheduled posts

## Documentation
- Documentation is a work in progress [click to view docs](docs/ReadMe.md "OpenSMM Documentation")

## :large_blue_diamond: Installation
The application is built for Docker, we will have images on Docker Hub when the application is usable. Here's how to get it running for now:

Clone source:
```bash
git clone https://github.com/vaughngx4/OpenSMM.git
cd OpenSMM
```

Copy example .env file and make changes:
```bash
cp .env.example .env
$EDITOR .env
```

Generate mongo init script OR create it yourself:
```
./quick-setup.sh
```

OR

```bash
cp init-mongo-template.js init-mongo.js
$EDITOR init-mongo.js
```

Build/rebuild images and start containers(cache will be used if no changes are found):
```bash
./rebuild.sh
```

## :green_circle: Development
### ToDo
- [x] Authenticate Twitter API v2 OAuth2
- ~~Add scheduling interface and cron scheduling~~
- [x] Add scheduling support
- [x] Add poll support
- [ ] Add attachment support
- [x] Add validation to api
- [ ] Add validation to UI
- [x] Clean up UI and add popup responses
- ~~Store attached images for reuse~~
- [ ] Store attachments for reuse
- [ ] Add option to reschedule a post
- [ ] Add option to add time slots
- [ ] Add option to auto-schedule to next available time slot
- [ ] Add Facebook Page support
- [ ] Add LinkedIn Page support
- [ ] Add YouTube support
- [ ] Add Pinterest support
- [ ] Add Discord support
- [ ] Add Instagram support
- [ ] Add Instagram Business Support

## :coffee: Buy Us a Coffee
If you like what we're doing and want to see more, feel free to leave us a donation! Currently only accepting GitHub Sponsorships.

## :telephone_receiver: Contact Us
You can get a hold of us on Discord https://discord.gg/TSnvnjE6zP or Matrix(Discord bridged) https://matrix.to/#/!xaTiJIBHgIwTeVOVYt:sintelli-tech.com?via=sintelli-tech.com or send us a message https://sintelli-tech.com/contact
