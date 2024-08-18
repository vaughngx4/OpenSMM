# Meta API Setup
- [Meta API Setup](#meta-api-setup)
  - [App Creation](#app-creation)
  - [Login Functionality](#login-functionality)
  - [Configuration for Posting to Facebook Pages](#configuration-for-posting-to-facebook-pages)
  - [General API Settings](#general-api-settings)

[<= Back](ReadMe.md "Documentation Index")

## App Creation

- Go to https://developers.facebook.com/apps/ and click "Create App"

![create app](docs/images/facebook/facebook-1.png)

- Select "I don't want to connect a business portfolio yet" and click "Next"

![app setup 1](docs/images/facebook/facebook-2.png)

- Select "Other" and click "Next"

![app setup 2](docs/images/facebook/facebook-3.png)

- Select "Business" and click "Next"

![app setup 3](docs/images/facebook/facebook-4.png)

- Give your app a name, add a public contact email and click "Create App"

![app setup 4](docs/images/facebook/facebook-5.png)

## Login Functionality

- Scroll to the bottom of the page where you will find "Facebook Login for Business", click "Set up"

![login setup 1](docs/images/facebook/facebook-6.png)

- Scroll down until you find "Valid OAuth Redirect URIs". Here you will want to put https://localhost/callback/facebook replacing "localhost" with your domain. Next, click "Save changes"

![login setup 2](docs/images/facebook/facebook-7.png)

## Configuration for Posting to Facebook Pages

- In the bottom left under "Facebook Login for Business", click "Configurations". Next, click "Create configuration"

![page setup 1](docs/images/facebook/facebook-8.png)

- Give your configuration a name. I would suggest using the name "pages" or similar, as this configuration will be used for facebook page posting

![page setup 2](docs/images/facebook/facebook-9.png)

- For the login variation, choose "General" and click "Next"

![page setup 3](docs/images/facebook/facebook-10.png)

- For access token choose "User access token" and click "Next"

![page setup 4](docs/images/facebook/facebook-11.png)

- You will need to give the app the following 5 permissions in order for OpenSMM to function properly:

        - pages_manage_engagement
        - pages_manage_posts
        - pages_read_engagement
        - pages_show_list
        - publish_video

    Finish by clicking "Create"

![page setup 5](docs/images/facebook/facebook-12.png)
![page setup 6](docs/images/facebook/facebook-13.png)

- You will now be shown your configuration ID. Copy this ID to your .env file then click "Got it"

![page setup 7](docs/images/facebook/facebook-14.png)

## General API Settings

- On the left under "App settings" click "Basic". From here you will need to copy your "App ID" and "App Secret" to your .env file as well

![API setup 1](docs/images/facebook/facebook-15.png)

- On the left under "App settings click "Advanced". We want to ensure that our API version is upgraded to "v20.0"

![API setup 2](docs/images/facebook/facebook-16.png)

That's it for now. You can now use all of the Facebook features in OpenSMM!

[<= Back](ReadMe.md "Documentation Index")