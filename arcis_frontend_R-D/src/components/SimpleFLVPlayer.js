// src/components/SimpleFLVPlayer.js
import React, { useEffect, useRef } from "react";
import mpegts from "mpegts.js";
import { Box } from "@chakra-ui/react";

const SimpleFLVPlayer = ({ url, style }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (mpegts.getFeatureList().mseLivePlayback && url) {
      // Initialize Player
      playerRef.current = mpegts.createPlayer({
        type: "flv", // Support flv format
        url: url,
        isLive: true,
        cors: true,
        hasAudio: false, // Set to true if your cameras have audio
      });

      playerRef.current.attachMediaElement(videoRef.current);
      playerRef.current.load();
      
      const playPromise = playerRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Auto-play prevented:", error);
        });
      }
    }

    return () => {
      // Cleanup on unmount
      if (playerRef.current) {
        playerRef.current.pause();
        playerRef.current.unload();
        playerRef.current.detachMediaElement();
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [url]);

  return (
    <Box style={style} bg="black" display="flex" justifyContent="center" alignItems="center">
      <video
        ref={videoRef}
        style={{ width: "100%", height: "100%" }}
        controls
        autoPlay
        muted // Muted is often required for autoplay to work efficiently
      />
    </Box>
  );
};

export default SimpleFLVPlayer;
