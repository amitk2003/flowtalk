"use client";

import { useEffect, useRef, useState } from "react";
import { socket } from "@/lib/socket";
import { Room, User } from "@/types";
import { Mic, MicOff, Video as Cam, VideoOff, PhoneOff, Loader2 } from "lucide-react";

interface VideoCallModalProps {
  room: Room;
  user: User;
  otherUserId: string;
  onClose: () => void;
}

export default function VideoCallModal({ room, user, otherUserId, onClose }: VideoCallModalProps) {
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [callStatus, setCallStatus] = useState<"connecting" | "connected" | "error">("connecting");

  useEffect(() => {
    startCall();

    const handleAnswer = async ({ sdp }: any) => {
      if (pc.current && sdp) {
        await pc.current.setRemoteDescription(new RTCSessionDescription(sdp));
        setCallStatus("connected");
      }
    };

    const handleIce = async ({ candidate }: any) => {
      if (pc.current && candidate) {
        await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    const handleEnded = () => { onClose(); };

    socket.on("webrtc:answer" as any, handleAnswer);
    socket.on("webrtc:icecandidate" as any, handleIce);
    socket.on("call:ended" as any, handleEnded);

    return () => {
      socket.off("webrtc:answer" as any, handleAnswer);
      socket.off("webrtc:icecandidate" as any, handleIce);
      socket.off("call:ended" as any, handleEnded);
      cleanup();
    };
  }, []);

  const cleanup = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    pc.current?.close();
    pc.current = null;
  };

  const startCall = async () => {
    try {
      pc.current = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;

      if (localVideo.current) localVideo.current.srcObject = stream;

      stream.getTracks().forEach((track) => pc.current?.addTrack(track, stream));

      pc.current.ontrack = (event) => {
        if (remoteVideo.current) {
          remoteVideo.current.srcObject = event.streams[0];
          setCallStatus("connected");
        }
      };

      pc.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc:icecandidate", { toUserId: otherUserId, candidate: event.candidate });
        }
      };

      socket.emit("call:request" as any, { toUserId: otherUserId, fromUser: user.id, room: room.id });

      const offer = await pc.current.createOffer();
      await pc.current.setLocalDescription(offer);
      socket.emit("webrtc:offer", { toUserId: otherUserId, sdp: offer });
    } catch (err) {
      console.error("Call error:", err);
      setCallStatus("error");
    }
  };

  const toggleMute = () => {
    const audioTrack = streamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const toggleCamera = () => {
    const videoTrack = streamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCamOff(!videoTrack.enabled);
    }
  };

  const handleEndCall = () => {
    socket.emit("call:end" as any, { room: room.id, toUserId: otherUserId });
    cleanup();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#0b141a]/95 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="w-full max-w-[680px] bg-[#111b21] border border-[#222d34] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#222d34] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-[#e9edef] tracking-wide">
              FlowTalk Video Call
            </h3>
            <p className="text-[10px] text-[#8696a0] mt-0.5 uppercase tracking-wider font-semibold">
              {callStatus === "connecting" ? "Connecting..." : callStatus === "connected" ? "● Live Call" : "⚠️ Disconnected"}
            </p>
          </div>
        </div>

        {/* Video Screens */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-[#0b141a] relative min-h-[300px]">
          
          {/* Local Camera */}
          <div className="relative rounded-xl overflow-hidden bg-[#111b21] aspect-video border border-[#222d34]">
            <video
              ref={localVideo}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />
            {isCamOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#111b21]">
                <Cam className="w-12 h-12 text-[#8696a0]/30" />
              </div>
            )}
            <span className="absolute bottom-2.5 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded font-light">
              You
            </span>
          </div>

          {/* Remote Camera */}
          <div className="relative rounded-xl overflow-hidden bg-[#111b21] aspect-video border border-[#222d34]">
            <video
              ref={remoteVideo}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {callStatus === "connecting" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111b21] gap-3">
                <Loader2 className="w-8 h-8 text-[#00a884] animate-spin" />
                <p className="text-[11px] text-[#8696a0] tracking-wider uppercase font-semibold">
                  Waiting for reply...
                </p>
              </div>
            )}
            <span className="absolute bottom-2.5 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded font-light">
              Contact
            </span>
          </div>

        </div>

        {/* Call Controls panel */}
        <div className="py-5 bg-[#202d33] border-t border-[#222d34] flex items-center justify-center gap-5">
          <button
            onClick={toggleMute}
            className={`p-3.5 rounded-full transition-all duration-200 ${
              isMuted ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-[#2d3f4b] hover:bg-[#3d5363] text-[#e9edef]"
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <button
            onClick={handleEndCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25 active:scale-95 transition-all"
            title="End Call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>

          <button
            onClick={toggleCamera}
            className={`p-3.5 rounded-full transition-all duration-200 ${
              isCamOff ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-[#2d3f4b] hover:bg-[#3d5363] text-[#e9edef]"
            }`}
            title={isCamOff ? "Turn Cam On" : "Turn Cam Off"}
          >
            {isCamOff ? <Cam className="w-5 h-5" /> : <Cam className="w-5 h-5" />}
          </button>
        </div>

      </div>
    </div>
  );
}
