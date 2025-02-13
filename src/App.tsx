import React, { useRef, useState, useEffect } from "react";
import './App.css';

const App: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMusicOn, setIsMusicOn] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frames] = useState<string[]>(["kana-frame.png", "tana-frame.png", "pia-frame.png"]);
  const [selectedFrame, setSelectedFrame] = useState<string>("kana-frame.png");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [countdownDuration, setCountdownDuration] = useState<number>(5);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [isPortrait, setIsPortrait] = useState<boolean>(false);


  // Detect screen orientation for mobile
  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);

    return () => window.removeEventListener("resize", checkOrientation);
  }, []);

  // Background Music
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.05; // Set volume to 35%
      if (isMusicOn) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isMusicOn]);

  // Get available cameras
  useEffect(() => {
    const getCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((device) => device.kind === "videoinput");
        setCameras(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId);
        }
      } catch (error) {
        console.error("Error fetching cameras:", error);
      }
    };

    getCameras();
  }, []);

  // Start the camera stream
  useEffect(() => {
    const checkAndStartCamera = async () => {
      try {
        // Check camera permission
        const permission = await navigator.permissions.query({ name: "camera" as PermissionName });
  
        if (permission.state === "denied") {
          alert("Camera access is blocked. Please enable it in your browser settings.");
          return;
        }
  
      // If permission is not granted, request it
      if (permission.state === "prompt") {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop()); // Close stream after requesting permission
          window.location.reload(); // Reload the page after permission is granted
        } catch (error) {
          console.error("Camera permission denied by user:", error);
          alert("Camera access denied. Please allow camera permissions in your browser settings.");
          return;
        }
      }
  
        // Start the camera with the selected device
        if (selectedCamera) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: selectedCamera } },
          });
  
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        }
      } catch (error) {
        console.error("Error accessing the camera: ", error);
        alert("Failed to access the camera. Please check your browser settings.");
      }
    };
  
    checkAndStartCamera();
  
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [selectedCamera]);
  

  const startCountdown = () => {
    setCountdown(countdownDuration);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          handleCapture();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;
      
      const canvas = canvasRef.current;
      canvas.width = 1920; // 16:9 aspect ratio
      canvas.height = 1080; // 16:9 aspect ratio
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Draw a transparent background to fill the canvas
        ctx.fillStyle = "transparent";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      
        // Calculate the position to draw the camera image
        let x = 0;
        let y = 0;
        let width = canvas.width;
        let height = canvas.height;
      
        if (videoWidth / videoHeight > canvas.width / canvas.height) {
          height = canvas.width * (videoHeight / videoWidth);
          y = (canvas.height - height) / 2;
        } else {
          width = canvas.height * (videoWidth / videoHeight);
          x = (canvas.width - width) / 2;
        }
      
        // Draw the camera image on the canvas without stretching
        ctx.drawImage(videoRef.current, x, y, width, height);
      
        // Draw the frame image on the canvas
        const frameImage = new Image();
        frameImage.src = selectedFrame;
        frameImage.onload = () => {
          ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
          setCapturedImage(canvas.toDataURL("image/png"));
        };
      }
    }
  };

  return (
    <div className="w-screen min-h-screen bg-[#FBDEEB] bg-[linear-gradient(to_bottom,#F8BDD7_1px,transparent_1px),linear-gradient(to_right,#F8BDD7_1px,transparent_1px)] [background-size:30px_30px] bg-center overflow-x-hidden animate-bgmove p-4 relative">
      {isPortrait && (
        <div className="handwrite fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 text-white text-4xl z-50">
          Please rotate your device to landscape mode.
        </div>
      )}

      {/* Music Control */}
      <div>
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMusicOn(!isMusicOn)}
          className="bg-[#ff9fb7] text-[#bb1f1d] px-4 py-2 rounded"
          >
            {isMusicOn ? "Mute Music" : "Play Music"}
        </button>
      </div>

      {/* Audio Element */}
        <audio ref={audioRef} src="hagavi_jkt48v.mp3" loop autoPlay />
      </div>

      {/* Logos */}
      <div className="flex">
        <a href="https://wargavi48.github.io" target="_blank">
          <img src="spawn.gif" alt="Wargavi48 Logo" className="w-18 h-18 mr-2" />
        </a>
        <img src="logo_scaled.png" alt="ChekiChoco Logo" className="w-32 h-18 mr-2" />
      </div>

      {/* Camera Selection */}
      <div className="mx-auto flex items-center justify-center pb-4">
        <div className="group relative cursor-pointer py-1">
          {/* Selected Block */}
          <div className="flex items-center justify-between space-x-3 bg-[#ff9fb7] px-3 py-1 rounded-full shadow-md">
            <a 
              className="menu-hover text-sm font-medium text-[#bb1f1d] lg:mx-2" 
              onClick={() => console.log("Choose Camera")}
            >
              {selectedCamera 
                ? cameras.find(c => c.deviceId === selectedCamera)?.label || "Camera"
                : "Choose Camera"}
            </a>
            <span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4 text-[#bb1f1d]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </span>
          </div>

          {/* Options */}
          <div className="invisible absolute z-50 flex w-full flex-col bg-[#FCFBF0] py-1 px-2 text-gray-800 shadow-xl group-hover:visible rounded-lg">
            {cameras.map((camera) => (
              <a 
                key={camera.deviceId} 
                className="my-1 block py-1 text-sm font-semibold text-[#5d402d] hover:bg-[#f5c081] hover:text-[#5d402d] rounded-full md:mx-1" // Brown text, pink background, dark gray text on hover, rounded
                onClick={() => setSelectedCamera(camera.deviceId)}
              >
                {camera.label || "Camera"}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Video Preview*/}
      <div className="relative w-full max-w-2xl mx-auto" style={{ aspectRatio: "16/9" }}>
        {/* Video Element */}
        <video ref={videoRef} className="w-full h-full rounded shadow-md" autoPlay muted playsInline />

        {/* Selected Frame Overlay */}
        {selectedFrame && (
          <img
            src={selectedFrame}
            alt="Selected Frame"
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
        )}

        {/* Countdown Overlay */}
        {countdown > 0 && (
          <div className="absolute inset-0 flex items-center animate-pulse bg-opacity-50 justify-center">
            {/* Animated Progress Circle */}
            <div className="absolute w-full h-full">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  className="text-[#f5c081] stroke-current"
                  stroke-width="8"
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke-dasharray="251.2"
                  stroke-dashoffset={`calc(251.2 - (251.2 * ${countdown}) / ${countdownDuration})`}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                ></circle>
              </svg>
            </div>
            <div className="handwrite text-6xl font-bold text-[#bb1f1d] animate-pulse bg-white bg-opacity-50 rounded-full p-8">
              {countdown}
            </div>
          </div>
        )}
      </div>

      {/* Frame Selector */}
      <div className="mt-4 flex gap-2 justify-center">
        {frames.map((frame, index) => (
          <img
            key={index}
            src={frame}
            alt={`Frame ${index + 1}`}
            className={`w-16 h-9 rounded cursor-pointer border-2 ${
              selectedFrame === frame ? "border-[#bb1f1d]" : "border-gray-300"
            }`}
            onClick={() => setSelectedFrame(frame)}
          />
        ))}
      </div>

      {/* Countdown Duration Selector*/}
      <div className="mt-4 text-center space-y-4">
        <div className="space-x-2">
          <span className="handwrite text-2xl text-gray-800 font-medium">Select timer:</span>
          {[5, 10].map((duration) => (
            <button
              key={duration}
              onClick={() => setCountdownDuration(duration)}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                countdownDuration === duration
                  ? "bg-[#bb1f1d] text-white shadow-lg"
                  : "bg-[#5d402d] text-gray-800 hover:bg-[#f5c081] text-gray-800"
              }`}
            >
              {duration} Seconds
            </button>
          ))}
        </div>
      </div>

      {/* Capture Button */}
      <div className="mt-4 text-center">
        <button
          onClick={startCountdown}
          className="inline-flex items-center rounded cursor-pointer bg-[#ff9fb7] px-6 py-3 font-semibold text-[#bb1f1d] transition [box-shadow:rgb(251,202,224)-8px_8px] hover:[box-shadow:rgb(251,202,224)0px_0px]"
        >
          Capture Photo
        </button>
      </div>

      {/* Canvas (Hidden) */}
      <canvas ref={canvasRef} className="hidden" width={1920} height={1080} />

      {/* Captured Image Preview */}
      {capturedImage && (
        <div className="mt-4 text-center">
          <h2 className="handwrite text-4xl text-gray-800 mb-2">Captured Photo</h2>
          <img
            src={capturedImage}
            alt="Captured"
            className="max-w-2xl mx-auto rounded shadow-md"
            style={{ objectFit: "contain" }}
          />
          <div className="mt-4">
            <a href={capturedImage} download="captured-photo.png"
              className="inline-flex items-center rounded cursor-pointer bg-[#ff9fb7] px-6 py-3 font-semibold text-[#bb1f1d] transition [box-shadow:rgb(251,202,224)-8px_8px] hover:[box-shadow:rgb(251,202,224)0px_0px]"
              >
              Download Photo
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
