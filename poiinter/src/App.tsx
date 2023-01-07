import React, { useEffect, useId, useRef, useState } from "react";
import * as poseDetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import p5 from "p5";
import { detectPose, setupDetector } from "./Detector";
import { drawGrid } from "./Elements";
import { Box, Button } from "@chakra-ui/react";
import { CSVLink } from "react-csv";

import "./App.css";
import { IDataCase } from "./Types";

function App() {
  const p5_container = useRef<HTMLDivElement>();

  const [isRecording, setIsRecording] = useState(false);
  const [isModelMode, setIsModelMode] = useState(false);

  const [sessionData, setSessionData] = useState<IDataCase[] | []>([]);

  const id = useId();

  useEffect(() => {
    const sketch = (p: p5) => {
      let video: p5.Element;
      let framerate = 30;
      let pose_detector: poseDetection.PoseDetector;

      let circleSize = 75;
      let speed = 10;
      let x: number;
      let y: number;
      let stepX: number;
      let stepY: number;

      p.setup = () => {
        p.frameRate(framerate);
        p.createCanvas(1920, 1080);
        video = p.createCapture(p.VIDEO);
        video.size(640, 480);
        video.hide();

        setupDetector().then((detector) => {
          pose_detector = detector;
        });

        // Setup random movement
        x = p.random(p.width);
        y = p.random(p.height);
        // Set the initial direction of the circle to a random value
        stepX = p.random(-1 * speed, speed);
        stepY = p.random(-1 * speed, speed);
        // Change the direction of the circle every 5 seconds
        setInterval(() => {
          stepX = p.random(-1 * speed, speed);
          stepY = p.random(-1 * speed, speed);
        }, 5000);
      };

      if (isModelMode) {
        p.draw = () => {
          // DELAY FOR ERROR FIX
          if (p.frameCount > 20) {
            p.background(0);
            p.image(video, 0, 0, 640, 480);

            // Detect
            if (pose_detector !== undefined) {
              detectPose(video.elt, pose_detector).then((poses) => {
                // Draw keypoints for each detected pose
                poses.forEach((pose) => {
                  // For each keypoint in the pose
                  pose.keypoints.forEach((keypoint) => {
                    // If the keypoint has a high enough score, draw it
                    if (keypoint.score && keypoint.score > 0.2) {
                      p.fill(255, 0, 0);
                      p.noStroke();
                      p.ellipse(keypoint.x, keypoint.y, 10, 10);
                    }
                  });
                });
              });
            }

            drawGrid(p);
            // CIRCLE MOVEMENT
            p.noStroke();
            p.fill(255, 255, 255);
            p.circle(x, y, circleSize);
            // Update the position of the circle
            x += stepX;
            y += stepY;
            // If the circle is outside the bounds of the canvas, reverse its direction
            if (x < 0 || x > p.width || y < 0 || y > p.height) {
              stepX = -stepX;
              stepY = -stepY;
            }
          }
        };
      } else {
        p.draw = () => {
          // DELAY FOR ERROR FIX
          if (p.frameCount > 20) {
            p.background(0);
            p.image(video, 0, 0, 640, 480);

            // Detect
            if (pose_detector !== undefined) {
              detectPose(video.elt, pose_detector).then((poses) => {
                // Draw keypoints for each detected pose
                poses.forEach((pose) => {
                  let newDataCase: IDataCase = {
                    x,
                    y,
                    score: pose.score,
                  };

                  // For each keypoint in the pose
                  pose.keypoints.forEach((keypoint) => {
                    if (isRecording) {
                      console.log("REC");

                      console.log(sessionData);
                      //@ts-ignore
                      newDataCase[`${keypoint.name}_x`] = keypoint.x;
                      //@ts-ignore
                      newDataCase[`${keypoint.name}_y`] = keypoint.y;
                    }

                    // If the keypoint has a high enough score, draw it
                    if (keypoint.score && keypoint.score > 0.2) {
                      p.fill(255, 0, 0);
                      p.noStroke();
                      p.ellipse(keypoint.x, keypoint.y, 10, 10);
                    }
                  });
                  if (isRecording) {
                    // @ts-ignore
                    sessionData.push(newDataCase);
                    // Update the session data in the state
                    setSessionData(sessionData);
                  }
                });
              });
            }

            drawGrid(p);

            // CIRCLE MOVEMENT
            p.noStroke();
            p.fill(255, 0, 0);
            p.circle(x, y, circleSize);
            // Update the position of the circle
            x += stepX;
            y += stepY;
            // If the circle is outside the bounds of the canvas, reverse its direction
            if (x < 0 || x > p.width || y < 0 || y > p.height) {
              stepX = -stepX;
              stepY = -stepY;
            }
          }
        };
      }
    };
    const p5_sketch = new p5(sketch, p5_container.current);
    return () => {
      // Clean up the p5 sketch when the component unmounts
      p5_sketch.remove();
    };
  }, [isRecording, isModelMode, sessionData]);

  return (
    <div id={id} className="App">
      <Box position="absolute" top="24px" left="24px">
        <Button
          colorScheme={isRecording ? "red" : "gray"}
          disabled={isModelMode}
          marginRight="16px"
          onClick={() => {
            setIsRecording(!isRecording);
            if (isRecording) {
              console.log(sessionData);
            } else {
              setSessionData([]);
            }
          }}
        >
          {isRecording ? "Stop recording" : "Start recording"}
        </Button>
        {sessionData.length > 0 ? (
          <CSVLink data={sessionData}>
            <Button marginRight="16px">Download CSV</Button>
          </CSVLink>
        ) : (
          ""
        )}
        <Button
          colorScheme={isModelMode ? "green" : "gray"}
          disabled={isRecording}
          onClick={() => {
            setIsModelMode(!isModelMode);
          }}
        >
          {isModelMode ? "Model Mode: ON" : "Model Mode"}
        </Button>
      </Box>
      <div
        className="App"
        ref={p5_container as React.MutableRefObject<HTMLDivElement>}
      />
    </div>
  );
}

export default App;
