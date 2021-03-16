// getting dom elements
var divSelectRoom = document.getElementById("selectRoom");
var divConsultingRoom = document.getElementById("consultingRoom");
var inputRoomNumber = document.getElementById("roomNumber");
var btnGoRoom = document.getElementById("goRoom");
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");

// variables
var fromCaller = false;
var fromReceiver = false;
var roomNumber;
var localStream;
var remoteStream;
var rtcPeerConnection;
var iceServers = {
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
});

socket.on('candidate', function (event) {
    var candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate
    });
    rtcPeerConnection.addIceCandidate(candidate);
});

socket.on('ready', function () {
    if (isCaller) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onAddStream;
        //rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
        rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
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
        rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
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
