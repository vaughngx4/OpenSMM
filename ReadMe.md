# OpenSMM
## Description
OpenSMM(Open Social Media Marketing) is a self-hosted social media marketing platform built to assist small businesses manage their social media more easily.

## Please Note:
- This project is in early development stages.
- Seek help on Discord(links at the bottom) for general support.
- All errors (should) print to Docker logs, if you encounter any that you can't fix(not config related) or something goes wrong but no errors are printed, open an issue.

## Installation
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

## Development
### ToDo
- [x] Authenticate Twitter API v2 OAuth2
- ~~Add scheduling interface and cron scheduling~~
- [x] Add scheduling support
- [ ] Add poll support
- [ ] Add attachment support
- [ ] Clean up UI and popup responses
- [ ] Store attached images for reuse
- [ ] Add option to reschedule a post
- [ ] Add option to add time slots
- [ ] Add option to auto-schedule to next available time slot

## Contact Us
You can get a hold of us on Discord https://discord.gg/TSnvnjE6zP or Matrix(Discord bridged) https://matrix.to/#/!xaTiJIBHgIwTeVOVYt:sintelli-tech.com?via=sintelli-tech.com or send us a message https://sintelli-tech.com/contact
