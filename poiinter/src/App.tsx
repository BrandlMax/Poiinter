import React, { useEffect, useRef } from "react";
import "./App.css";
import * as poseDetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";

import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

function App() {
  const videoRef: React.RefObject<HTMLVideoElement> = useRef(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(async function (stream) {
        if (videoRef.current === null) {
          return;
        } else {
          videoRef.current.srcObject = stream;
          videoRef.current.play();

          // Setup Detection Network
          const detectorConfig = {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          };
          const detector = await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            detectorConfig
          );

          // MultiPose
          // const detectorConfig = {
          //   modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
          //   enableTracking: true,
          //   trackerType: poseDetection.TrackerType.BoundingBox
          // };
          // const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);

          const estimatePoses = async (video: HTMLVideoElement) => {
            if (videoRef.current) {
              // call the estimatePoses method
              const poses = await detector.estimatePoses(video);
              // do something with the poses
              console.log(poses);
            }
          };

          const frameRate = 30;
          const interval = 1000 / frameRate;
          setInterval(() => {
            if (videoRef.current !== null) {
              estimatePoses(videoRef.current);
            }
          }, interval);
        }
      })
      .catch(function (error) {
        // handle error
        console.log("ERROR", error);
      });
  }, []);

  // texture = new THREE.Texture(videoRef.current);

  // useFrame(() => {
  //   texture.needsUpdate = true;
  // });

  // const mesh = new THREE.Mesh(
  //   new THREE.planeBufferGeometry(2, 2),
  //   new THREE.MeshBasicMaterial({ map: texture })
  // );

  // mesh.position.set(0, 0, 0);
  // mesh.rotation.set(0, 0, 0);

  return (
    <div className="App">
      {/* <primitive object={mesh} /> */}
      <video className="video" ref={videoRef} />
    </div>
  );
}

export default App;
