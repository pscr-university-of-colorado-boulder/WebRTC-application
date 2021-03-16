// getting dom elements
var durv;
var expnumv;
var divSelectRoom = document.getElementById("selectRoom");
var divAddVide = document.getElementById('addVideo');
var divConsultingRoom = document.getElementById("consultingRoom");
var inputRoomNumber = document.getElementById("roomNumber");
var dur=document.getElementById("dur");
var expnum=document.getElementById("expnum");
var btnGoRoom = document.getElementById("goRoom");
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");
var userType = document.getElementById("user");
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
var fromCaller = false;
var fromReceiver = false;
var roomNumber;
var localStream;
var remoteStream;
var rtcPeerConnection;
var iceServers = {
    /*'iceServers': [
        { 'urls': "turn:128.105.145.197:3478?transport=udp",
	   'username':"sandy",
      	    'credential': "sandy@12345"

	}
    ]*/
   /*'iceServers': [
        { 'urls': "turn:192.168.2.30:3478?transport=udp",
           'username':"sandy",
            'credential': "sandy@12345"
        }
    ]*/
    'iceServers': [
        { 'urls': 'stun:stun.l.google.com:19302' }
    ]

}


var streamConstraints = { audio: true, video: true };
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
        socket.emit('create or join', roomNumber);
        divSelectRoom.style = "display: none;";
        divConsultingRoom.style = "display: block;";
    }
};

const input = document.querySelector('#video-url-example');
      
    input.addEventListener('change', () => {
      const file = input.files[0];
      const url = URL.createObjectURL(file);

      // document.querySelector('#video-container').innerHTML = `
      //   <video autoplay loop width="500" src="${url}" />
      // `;
      localVideo.src = url;
      //socket.emit("register as broadcaster", user.room);
      //videoElement.id ='myvideo';
    });

    localVideo.addEventListener('canplay', () => {
        const fps = 0;
        if (localVideo.mozCaptureStream) {
          localStream = localVideo.mozCaptureStream(fps);
        }  else if (localVideo.captureStream) {
            localStream = localVideo.captureStream(fps);
          } else {
          console.error('Stream capture is not supported');
          localStream = null;
        }
        if(fromCaller){
            isCaller = true;
        }
        if(fromReceiver){
            socket.emit('ready', roomNumber);
            divAddVide.style = "display: none;";
        }
        
        //rightVideo.srcObject = stream;
      });

// message handlers
socket.on('created', function (room) {
    fromCaller = true;

    // navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) {
    //     localStream = stream;
    //     localVideo.srcObject = stream;
    //     isCaller = true;
    // }).catch(function (err) {
    //     console.log('An error ocurred when accessing media devices', err);
    // });
});

socket.on('joined', function (room) {
    fromReceiver = true;
    // navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) {
    //     localStream = stream;
    //     localVideo.srcObject = stream;
    //     socket.emit('ready', roomNumber);
    // }).catch(function (err) {
    //     console.log('An error ocurred when accessing media devices', err);
    // });
    divAddVide.style = "display: none;";
    socket.emit('ready', roomNumber);
});

socket.on('candidate', function (event) {
    var candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate
    });
    /*if(event.candidate.indexOf("relay")<0){ // if no relay address is found, assuming it means no TURN server
        return;
    }*/
    //console.log('*** adding ice candidate sandy *** '+event.candidate+"***********"+event.candidate.typ+":"+event.candidate.indexOf("relay"));
    rtcPeerConnection.addIceCandidate(candidate);
});

socket.on('ready', function () {
    if (isCaller) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onAddStream;
        rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream); //Hyoyoung : If the mediinfo has only video enable this else comment this line and use next line
	/*
	saving video at sender side
	*/
	sandy_recorder(localStream,durv);
	//sandy: This is video track when video has both audio and video
        //rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
	//sandy: This is audio track when video has both audio and video.
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
	/*let data="Hello world";
	fs.writeFile('/home/sandesh/workspace/5g/logs/1.txt',data,(err)=>{
		if(err) throw err;
	});*/
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
            })
	extractStats("receiver",expnumv,durv);
	window.setInterval(function() {
  		rtcPeerConnection.getStats().then(stats => {
    		stats.forEach(report => {
			type=""+report.type
			var width;
			var height;
			var fpsv;
			var fd;
			var nakc;
			var pl;
			var pps=0;
			var bps=0;
			if(type==="inbound-rtp"){
				Object.keys(report).forEach(statName => {
				//	console.log(" **inbound-rtp** "+statName); 
				//	console.log("name: "+statName); 
				/*	if(statName === "frameWidth") {
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
                                                fpsv=report[statName]-pfps;
                                                statsfps.innerText=fpsv;
						pfps=report[statName];
                                        }
                                        if(statName === "framesDropped"){
                                                fd=report[statName];
                                                statsframesDropped.innerText=report[statName];
                                        }
				});
			}
			console.log("width "+ width +" height "+height +" fps " +fpsv + " framedrop "+ fd+" nack "+nakc +" pps "+pps +" bps "+bps +" pl "+pl +"\n");
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
        //console.log('sending ice candidate'+event.candidate.candidate);
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
 sandy_recorder(event.streams[0],durv);
}

