# OpenSMM
| Section     | Version   |
| ----------- | --------- |
| Application | v0.1.2-8    |
| API         | v0.1.2-7    |
| Web UI      | v0.1.0-1    |

![license](https://img.shields.io/github/license/vaughngx4/OpenSMM?style=for-the-badge "")
![stars](https://img.shields.io/github/stars/vaughngx4/OpenSMM?style=for-the-badge "")
![forks](https://img.shields.io/github/forks/vaughngx4/OpenSMM?style=for-the-badge "")

## Description
OpenSMM (Open Social Media Management) is a self-hosted social media management platform built to assist businesses manage their social media more easily.

## Please Note!
- This project is in early development stages.
- Seek help on Discord for general support (links at the bottom of the page).
- All errors (should) print to Docker logs, if you encounter any that you can't fix (i.e not config related) or something goes wrong but no errors are printed, open an issue.

### What Works
- Media Gallery (upload and save media for posting)
- Posting to Facebook Pages (text and images)

## Documentation
- [Click here to read the docs](docs/ReadMe.md "OpenSMM Documentation")

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

Generate mongo init script OR create it yourself:
```
./quick-setup.sh
```

OR

```bash
cp init-mongo-template.js init-mongo.js
$EDITOR init-mongo.js
```

Build/rebuild images and start containers (cache will be used if no changes are found):
```bash
./rebuild.sh
```

## Development
Note that Twitter support was dropped after their rebrand to X. We may add support back in the future.

### Social Platform Support
- [x] Facebook Pages
    - [x] Text
    - [x] Image
    - [ ] Video
- [ ] Instagram
    - [ ] Image
    - [ ] Video
- [ ] Instagram Business
    - [ ] Image
    - [ ] Video
- [ ] YouTube
    - [ ] Video
- [ ] Discord
    - [ ] Text
    - [ ] Image
    - [ ] Video
- [ ] LinkedIn Pages
    - [ ] Text
    - [ ] Image
    - [ ] Video
- [ ] Pinterest
    - [ ] Image

### Features
- [x] Schedule posts
- [x] Upload and save attachments
- [ ] Reschedule old posts
- [ ] Create predefined time slots for posting
    - [ ] "Quick Post" option - post to next available time slot

### Bug Fixes and Other Development
- [x] Change auth to use token directly through PHP
- [x] Add validation to api
- [x] Clean up UI and add popup responses
- [x] Store attachments for reuse
- [ ] Fix app screen size and dynamic resize
- [ ] Fix Gallery module not filling app screen width
- [ ] Add validation to UI

## Contact Us
You can get a hold of us on Discord https://discord.gg/TSnvnjE6zP

OR

Send us a message https://sintelli-tech.com/contact

## Donate
If you like what we're doing and want to see more, consider leaving us a donation by clicking the "Sponsor" button.
