# OpenSMM
![build status](https://img.shields.io/badge/build-passing-green?style=for-the-badge "")
![forks](https://img.shields.io/github/license/vaughngx4/OpenSMM?style=for-the-badge "")
![stars](https://img.shields.io/github/stars/vaughngx4/OpenSMM?style=for-the-badge "")
![forks](https://img.shields.io/github/forks/vaughngx4/OpenSMM?style=for-the-badge "")

## Description
OpenSMM(Open Social Media Marketing) is a self-hosted social media marketing platform built to assist small businesses manage their social media more easily.

## :red_circle: Please Note:
- This project is in early development stages.
- Seek help on Discord(links at the bottom) for general support.
- All errors (should) print to Docker logs, if you encounter any that you can't fix(not config related) or something goes wrong but no errors are printed, open an issue.

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

Copy mongo init script and make changes:
```bash
cp init-mongo-template.js data/mongo/init-mongo.js
$EDITOR data/mongo/init-mongo.js
```

Build/rebuild images and start containers:
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

## :coffee: Buy Us a Coffee
If you like what we're doing and want to see more, feel free to leave us a donation! Currently only accepting GitHub Sponsorships.

## :telephone_receiver: Contact Us
You can get a hold of us on Discord https://discord.gg/TSnvnjE6zP or Matrix(Discord bridged) https://matrix.to/#/!xaTiJIBHgIwTeVOVYt:sintelli-tech.com?via=sintelli-tech.com or send us a message https://sintelli-tech.com/contact
