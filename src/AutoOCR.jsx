import React, { useEffect, useRef, useState } from "react";
import Tesseract from "tesseract.js";

const AutoOCR = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [status, setStatus] = useState("Initializing camera…");
  const [output, setOutput] = useState("Waiting for paper...");

  let prevFrame = useRef(null);
  let detecting = useRef(true);
  let processing = useRef(false);

  useEffect(() => {
    startCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      videoRef.current.srcObject = stream;
      setStatus("Camera ready. Watching for paper…");

      requestAnimationFrame(checkFrame);
    } catch (err) {
      setStatus("Camera error: " + err);
    }
  };

  const getFrameData = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const w = video.videoWidth;
    const h = video.videoHeight;

    if (w === 0 || h === 0) return null;

    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    console.log(ctx);
    
    ctx.drawImage(video, 0, 0);

    return ctx.getImageData(0, 0, w, h);
  };

  const frameDifference = (a, b) => {
    if (!a || !b) return 0;
    let diff = 0;

    for (let i = 0; i < a.data.length; i += 4) {
      diff += Math.abs(a.data[i] - b.data[i]);
    }

    return diff / (a.data.length / 4);
  };

  const checkFrame = async () => {
    if (!detecting.current) return;

    const frame = getFrameData();
    if (!frame) {
      requestAnimationFrame(checkFrame);
      return;
    }

    if (prevFrame.current) {
      const diff = frameDifference(frame, prevFrame.current);

      if (diff > 15 && !processing.current) {
        setStatus("Paper detected! Capturing…");

        processing.current = true;
        detecting.current = false;

        await autoCaptureAndOCR();

        processing.current = false;

        setTimeout(() => {
          setStatus("Watching for next paper…");
          detecting.current = true;
          prevFrame.current = null;
          requestAnimationFrame(checkFrame);
        }, 3000);

        return;
      }
    }

    prevFrame.current = frame;
    requestAnimationFrame(checkFrame);
  };

  const autoCaptureAndOCR = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    setOutput("Processing OCR… Please wait.");

    const { data: { text } } = await Tesseract.recognize(canvas, "eng");

    setOutput(text);
    setStatus("OCR complete.");
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>Mobile OCR — Automatic Capture</h2>
      <p>Keep phone steady above the printer output tray.</p>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: "100%", maxWidth: 400 }}
      ></video>

      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

      <h3>Status:</h3>
      <div style={{ fontWeight: "bold", color: "green" }}>{status}</div>

      <h3>Extracted Text:</h3>
      <div style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>{output}</div>
    </div>
  );
};

export default AutoOCR;
