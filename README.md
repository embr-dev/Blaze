> Blaze Beta
> 
> Updates on blaze have slowed down beause of summer break. Expect a beta release by September at the latest

# Blaze

Blaze is a tool that allows you to easily download files from websites by proxying them. With Blaze, you can download files such as images, videos, and documents from a website directly to your device.

Please note that Blaze is not designed to be run on cloud servers.

Blaze is still a beta tool. If you encounter any bugs please open an issue so we can fix it.

A tutorial on how to install and use Blaze can be found here: https://www.youtube.com/watch?v=ETpmGixOV5g

## Run Blaze Locally

To run Blaze locally on your own device, follow these steps:

1. Clone the Blaze repository from Github by opening your console and entering the following command (You can also download the zip of the repo if you do not want git tracking):
```bash
git clone https://github.com/EmberNetwork/Blaze.git
```
2. Make sure you have Node.js installed on your device. If you don't have it installed, you can download it from the [official Node.js website](https://nodejs.org).
3. Install the necessary dependencies by running the following command in your console:
```bash
npm install
```
4. Once the dependencies have been installed, start the Blaze server by running the following command:
```bash
npm start
```
5. The default port is `5000`, when the server starts, you can check this is true. Open up your browser and go to http://localhost:5000 
Note: The port can be changed in the index.js file
