// getting dom elements
var durv;
var expnumv;
var dur=document.getElementById("dur");
var expnum=document.getElementById("expnum");
var divSelectRoom = document.getElementById("selectRoom");
var divConsultingRoom = document.getElementById("consultingRoom");
var inputRoomNumber = document.getElementById("roomNumber");
var btnGoRoom = document.getElementById("goRoom");
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");
let h2CallName = document.getElementById("callName")
let inputCallName = document.getElementById("inputCallName")
let btnSetName = document.getElementById("setName")



//sandy:
var statsrtt=document.getElementById("rtt");
var statsframeWidth=document.getElementById("frameWidth");
var statsframeHeight=document.getElementById("frameHeight");
var statsfps=document.getElementById("fps");
var statsframesDropped=document.getElementById("framesDropped");
var statsnackCount=document.getElementById("nackCount");
var statspps=document.getElementById("pps");
var statsbps=document.getElementById("bps");
var statspacketsLost=document.getElementById("packetsLost");
var rtt=0;
var pp=0;
var pb=0;
var pfps=0;



// variables
var roomNumber;
var localStream;
var remoteStream;
var rtcPeerConnection;
let dataChannel;
var iceServers = {
   'iceServers': [
        { 'urls': "turn:128.105.145.197?transport=udp",
           'username':"sandy",
            'credential': "sandy@12345"

        }
    ]
    /*'iceServers': [
        { 'urls': "turn:192.168.2.30:3478?transport=udp",
           'username':"sandy",
            'credential': "sandy@12345"
        }
    ]*/
    /*'iceServers': [
        { 'urls': 'stun:stun.l.google.com:19302' }
    ]*/

};
var streamConstraints = { audio: false, 
			  video: {
				width: { min: 1024, ideal: 1280, max: 1920 },
   				 height: { min: 576, ideal: 1080, max: 1080 }//sandy:576,720,1080
  				}
			}

var isCaller;

// Let's do this
var socket = io();

btnGoRoom.onclick = function () {
    if (inputRoomNumber.value === '') {
        alert("Please type a room number")
    } else {
        roomNumber = inputRoomNumber.value;
	durv=dur.value;
        expnumv=expnum.value;
	console.log("sandy: sending the room details to server\n");
        socket.emit('create or join', roomNumber);
        divSelectRoom.style = "display: none;";
        divConsultingRoom.style = "display: block;";
    }
};

btnSetName.onclick = () => {
    if (inputCallName.value === '') {
        alert("Please type a name")
    } else {
	/*if(isCaller){
        	dataChannel.send(inputCallName.value)
	}*/
        h2CallName.innerText = inputCallName.value
    }
}

// message handlers
socket.on('created', function (room) {
    console.log("sandy you created a room and let us see if someone joings");
    navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) {
        localStream = stream;
        localVideo.srcObject = stream;
        isCaller = true;
    }).catch(function (err) {
        console.log(' sandy: Steam constrains: An error ocurred when accessing media devices', err);
    });
});

socket.on('joined', function (room) {
    socket.emit('ready', roomNumber);
    /*var streamConstraintsrec = { audio: false, video:false }
    navigator.mediaDevices.getUserMedia(streamConstraintsrec).then(function (stream) {
        localStream = stream;
        localVideo.srcObject = stream;
        socket.emit('ready', roomNumber);
    }).catch(function (err) {
        console.log('An error ocurred when accessing media devices', err);
    });*/
});

socket.on('candidate', function (event) {
    var candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate
    });
    if(event.candidate.indexOf("relay")<0){ // if no relay address is found, assuming it means no TURN server
        return;
    }
    console.log('*** adding ice candidate sandy *** '+event.candidate+"***********"+event.candidate.typ+":"+event.candidate.indexOf("relay"));
    rtcPeerConnection.addIceCandidate(candidate);
});

socket.on('ready', function () {
    if (isCaller) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onAddStream;
        rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
        //rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
        dataChannel = rtcPeerConnection.createDataChannel(roomNumber)
        dataChannel.onmessage = event => { h2CallName.innerText = event.data }
        rtcPeerConnection.createOffer()
            .then(sessionDescription => {
                rtcPeerConnection.setLocalDescription(sessionDescription);
                socket.emit('offer', {
                    type: 'offer',
                    sdp: sessionDescription,
                    room: roomNumber
                });
            })
            .catch(error => {
                console.log(error)
            })

	extractStats("sender",expnumv,durv);
        window.setInterval(function() {
                rtcPeerConnection.getStats().then(stats => {
                stats.forEach(report => {
                        type=""+report.type
                        if(type==="remote-inbound-rtp"){
                                var statn=[];
                                var statv=[];
                                Object.keys(report).forEach(statName => {
                                        if(statName ==="roundTripTime"){
                                                rtt=report[statName];//converting to ms
                                                rtt*=1000;
                                                console.log("RTT: "+ rtt);
                                                statsrtt.innerText=rtt;
                                        }
                                });
                        }
                });
        })}, 1000);
    }
});

socket.on('offer', function (event) {
    if (!isCaller) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onAddStream;
        //rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
        //rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
        rtcPeerConnection.createAnswer()
            .then(sessionDescription => {
                rtcPeerConnection.setLocalDescription(sessionDescription);
                socket.emit('answer', {
                    type: 'answer',
                    sdp: sessionDescription,
                    room: roomNumber
                });
            })
            .catch(error => {
                console.log(error)
            });
        rtcPeerConnection.ondatachannel = event => {
            dataChannel = event.channel
            dataChannel.onmessage = event => { h2CallName.innerText = event.data }
        }
	 extractStats("receiver",expnumv,durv);
        window.setInterval(function() {
                rtcPeerConnection.getStats().then(stats => {
                stats.forEach(report => {
                        type=""+report.type
                        var width;
                        var height;
                        var fps;
                        var fd;
                        var nakc;
                        var pl;
                        var pps=0;
                        var bps=0;
                        if(type==="inbound-rtp"){
                                Object.keys(report).forEach(statName => {
                                //      console.log(" **inbound-rtp** "+statName); 
                                //      console.log("name: "+statName); 
                                        /*if(statName === "frameWidth") {
                                                width=report[statName];
                                                statsframeWidth.innerText=report[statName];       
                                        }
                                        if(statName === "frameHeight"){
                                                height=report[statName];
                                                statsframeHeight.innerText=report[statName];
                                        }
                                        if(statName === "framesPerSecond"){
                                                fps=report[statName];
                                                statsframesPerSecond.innerText=report[statName];
                                        }
                                        if(statName === "framesDropped"){
                                                fd=report[statName];
                                                statsframesDropped.innerText=report[statName];
                                        }*/
                                        if(statName === "nackCount"){
                                                nakc=report[statName];
                                                statsnackCount.innerText=report[statName];
                                        }
                                        if(statName === "packetsReceived"){
                                                pps=report[statName]-pp;
                                                statspps.innerText=pps;
                                                pp=report[statName];
                                                //console.log("pps  " +pps);
                                        }
                                        if(statName === "bytesReceived"){
                                                bps=(report[statName]-pb)*8;
                                                statsbps.innerText=bps;
                                                pb=report[statName]
                                                //console.log("bps  " +bps);
                                        }
                                        if(statName === "packetsLost"){
                                                pl=report[statName];
                                                statspacketsLost.innerText=report[statName];
                                        }

                                });
                        }
                        else if(type==="track"){
                                Object.keys(report).forEach(statName => {
                                        /*console.log(" **track** "+statName); 
                                        console.log("name: "+statName); 
                                        if(statName.indexOf("totalFreezesDuration")>=0){
                                                console.log("totalFreezes  " +report[statName]);
                                                statstotalFreezesDuration.innerText=report[statName];
                                        }
                                        if(statName.indexOf("totalPausesDuration")>=0){
                                                console.log("totalPause   " +report[statName]);
                                                statstotalPausesDuration.innerText=report[statName];
                                        }*/
					if(statName === "frameWidth") {
                                                width=report[statName];
                                                statsframeWidth.innerText=report[statName];       
                                        }
                                        if(statName === "frameHeight"){
                                                height=report[statName];
                                                statsframeHeight.innerText=report[statName];
                                        }
                                        if(statName === "framesReceived"){
                                                fps=report[statName]-pfps;
                                                statsfps.innerText=fps;
						pfps=report[statName];
                                        }
                                        if(statName === "framesDropped"){
                                                fd=report[statName];
                                                statsframesDropped.innerText=report[statName];
                                        }
                                });
                        }
			console.log("width "+ width +" height "+height +" fps " +fps + " framedrop "+ fd+" nack "+nakc +" pps "+pps +" bps "+bps +" pl "+pl +"\n");
                });
        })}, 1000);
    }
});

socket.on('answer', function (event) {
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
})

// handler functions
function onIceCandidate(event) {
    if (event.candidate) {
        console.log('sending ice candidate');
        socket.emit('candidate', {
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate,
            room: roomNumber
        })
    }
}

function onAddStream(event) {
    remoteVideo.srcObject = event.streams[0];
    remoteStream = event.stream;
}
