# WpxApp

Application programmed to work with wordpress plugin BuddyPress or PeepSo

## Configuration
Configurable settings located in ```config.js``` and ```app.json``` file: 

```config.js```:

- ```secret_key``` (string): secret access key used to authorize request to the endpoints (should be unique for website)
- ```clientId``` (string): Google client id used for token verification
- ```facebookAppId``` (string): Facebook app id used for token verification

- colors ```primary``` (string): primary color for app login screen
- colors ```background``` (string): background color for app login screen
- colors ```white``` ```gray``` ```black``` (string): other colors in app 

```app.json```:

- ```name``` and ```slug``` (string): App name
- ```facebookScheme``` (string): Facebook scheme ('fb' + facebookAppId) 
- ```facebookAppId``` (string): Facebook app id used for token verification
- ```facebookDisplayName``` (string): App name used in facebook developers
- ```version``` (string): Version of app
- ```scheme``` (string): Custom app name for deepLinking
- ```icon``` (string): Icon for splash screen
- ```splash``` custom splash screen cofiguration
- ```bundleIndentifier``` (string): Bundle identifier for IOS standalone app
- ```package``` (string): Package name for Android standalone app

