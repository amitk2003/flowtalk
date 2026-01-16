import { useEffect, useRef } from "react";
import { socket } from "@/lib/socket";

export default function VideoCallModal({ room, user, onClose }: any) {
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const pc = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    startCall();
  }, []);

  const startCall = async () => {
    pc.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    if (localVideo.current) localVideo.current.srcObject = stream;

    stream.getTracks().forEach((track) =>
      pc.current?.addTrack(track, stream)
    );

    pc.current.ontrack = (event) => {
      if (remoteVideo.current)
        remoteVideo.current.srcObject = event.streams[0];
    };

    pc.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc:icecandidate", {
          toUserId: room.members[0], // other user
          candidate: event.candidate,
        });
      }
    };

    const offer = await pc.current.createOffer();
    await pc.current.setLocalDescription(offer);

    socket.emit("webrtc:offer", {
      toUserId: room.members[0],
      sdp: offer,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg">
        <h2 className="font-bold mb-2">Video Call</h2>
        <div className="flex gap-4">
          <video ref={localVideo} autoPlay muted className="w-64 border" />
          <video ref={remoteVideo} autoPlay className="w-64 border" />
        </div>
        <button
          className="mt-4 bg-red-500 text-white px-4 py-2"
          onClick={onClose}
        >
          End Call
        </button>
      </div>
    </div>
  );
}
