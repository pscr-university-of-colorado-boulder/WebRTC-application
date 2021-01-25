# WebRTC-application


curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt install nodejs
# to run 1-case
cd 1-case
npm install
npm start -> in one terminal
./ngrok http 3000 -> Give the http address else webrtc will not occur as it needs secure https connection
for media transmission and communication

# to run 2-case (don’t forget to go back)
cd 2-case
npm install
node server.js

# to run 3-case (don’t forget to go back)
cd 3-case
npm install
node server.js

1-Case:  Camera sender to receiver
2- Case: Sender and Receiver
