// getting dom elements
var divSelectRoom = document.getElementById("selectRoom");
var divAddVide = document.getElementById('addVideo');
var divConsultingRoom = document.getElementById("consultingRoom");
var inputRoomNumber = document.getElementById("roomNumber");
var btnGoRoom = document.getElementById("goRoom");
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");
var userType = document.getElementById("user");
var statsval=document.getElementById("stats-val");
var statsname=document.getElementById("stats-name");
var statsname=document.getElementById("rtt");
// variables
var fromCaller = false;
var fromReceiver = false;
var roomNumber;
var localStream;
var remoteStream;
var rtcPeerConnection;
var iceServers = {
    'iceServers': [
        { 'urls': "turn:130.127.133.44:3478?transport=udp",
	   'username':"sandy",
      	    'credential': "sandy@12345"

	}
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
	window.setInterval(function() {
  		rtcPeerConnection.getStats().then(stats => {
    		stats.forEach(report => {
			type=""+report.type
			if(type==="inbound-rtp"){
				//framew=stats[report]
				//console.log("sandy stats:w"+framew);
				var statn=[]
				var statv=[]
				Object.keys(report).forEach(statName => {
					if(statName !== "id" && statName !== "timestamp" && statName !== "type" && statName !== "ssrc" && statName !== "isRemote" && statName !=="mediaType" && statName !=="kind" && statName !== "trackId" && statName !== "transportId"){
						statn.push(" "+statName);
						statv.push(" "+report[statName]);
						//console.log("sandy: "+statName+":"+report[statName]);
					}
				});
				statsname.innerText=statn;
				statsval.innerText =statv;					
			}	
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
}

