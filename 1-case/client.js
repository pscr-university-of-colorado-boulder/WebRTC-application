// getting dom elements
var divSelectRoom = document.getElementById("selectRoom");
var divAddVide = document.getElementById('addVideo');
var divConsultingRoom = document.getElementById("consultingRoom");
var inputRoomNumber = document.getElementById("roomNumber");
var btnGoRoom = document.getElementById("goRoom");
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");
var userType = document.getElementById("user");

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

      localVideo.src = url;
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
});

socket.on('joined', function (room) {
    fromReceiver = true;
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

