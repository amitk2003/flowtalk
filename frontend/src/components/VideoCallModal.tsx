"use client";

import { useEffect, useRef, useState } from "react";
import { socket } from "@/lib/socket";
import { Room, User } from "@/types";

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

      // Notify other user
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

  const btnStyle = (active: boolean, danger = false): React.CSSProperties => ({
    width: 48,
    height: 48,
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    fontSize: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    background: danger
      ? "var(--color-danger)"
      : active
      ? "rgba(255,255,255,0.1)"
      : "rgba(255,255,255,0.2)",
    boxShadow: danger ? "0 4px 16px rgba(244,63,94,0.4)" : "none",
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(10px)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        animation: "fadeIn 0.25s ease",
      }}
    >
      <div
        style={{
          background: "#0a0c12",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(0,0,0,0.8)",
          width: "100%",
          maxWidth: 700,
          animation: "scaleIn 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "white", fontSize: 16 }}>
              📞 Video Call
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              {callStatus === "connecting" ? "Connecting..." : callStatus === "connected" ? "● Connected" : "⚠️ Connection failed"}
            </p>
          </div>
        </div>

        {/* Video grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            padding: 16,
            background: "#050608",
          }}
        >
          {/* Local video */}
          <div style={{ position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden", aspectRatio: "16/9", background: "#111" }}>
            <video
              ref={localVideo}
              autoPlay
              muted
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
            />
            {isCamOff && (
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "#111", fontSize: 36, color: "rgba(255,255,255,0.3)",
              }}>📷</div>
            )}
            <div style={{
              position: "absolute", bottom: 8, left: 10,
              background: "rgba(0,0,0,0.5)", borderRadius: "var(--radius-sm)",
              padding: "3px 8px", fontSize: 11, color: "white",
            }}>
              You
            </div>
          </div>

          {/* Remote video */}
          <div style={{ position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden", aspectRatio: "16/9", background: "#111" }}>
            <video
              ref={remoteVideo}
              autoPlay
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            {callStatus === "connecting" && (
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 8, background: "#111",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  border: "3px solid rgba(255,255,255,0.1)",
                  borderTopColor: "var(--color-primary)",
                  animation: "spin 1s linear infinite",
                }} />
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Waiting for connection...</p>
              </div>
            )}
            <div style={{
              position: "absolute", bottom: 8, left: 10,
              background: "rgba(0,0,0,0.5)", borderRadius: "var(--radius-sm)",
              padding: "3px 8px", fontSize: 11, color: "white",
            }}>
              Remote
            </div>
          </div>
        </div>

        {/* Controls */}
        <div
          style={{
            padding: "16px 20px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            background: "#0a0c12",
          }}
        >
          <button
            id="call-toggle-mute"
            onClick={toggleMute}
            style={btnStyle(isMuted)}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? "🔇" : "🎤"}
          </button>
          <button
            id="call-toggle-camera"
            onClick={toggleCamera}
            style={btnStyle(isCamOff)}
            title={isCamOff ? "Turn on camera" : "Turn off camera"}
          >
            {isCamOff ? "📷" : "📹"}
          </button>
          <button
            id="call-end-btn"
            onClick={handleEndCall}
            style={btnStyle(false, true)}
            title="End call"
          >
            📵
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
