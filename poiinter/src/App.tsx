import React, { useEffect, useId, useRef, useState } from "react";
import * as poseDetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import * as tf from "@tensorflow/tfjs";
import p5 from "p5";
import { detectPose, loadModel, setupDetector } from "./Detector";
import { drawGrid } from "./Elements";
import { Box, Button } from "@chakra-ui/react";
import { CSVLink } from "react-csv";

import "./App.css";
import { IDataCase } from "./Types";

function App() {
  console.log("👉 V0.1.0");
  const p5_container = useRef<HTMLDivElement>();

  const [isRecording, setIsRecording] = useState(false);
  const [isModelMode, setIsModelMode] = useState(false);

  const [sessionData, setSessionData] = useState<IDataCase[] | []>([]);

  const id = useId();

  useEffect(() => {
    console.log("UPDATED");
    const sketch = (p: p5) => {
      let video: p5.Element;
      let framerate = 30;
      let pose_detector: poseDetection.PoseDetector;

      let circleSize = 80;
      let x = 0;
      let y = 0;
      let xSpeed = circleSize / 10;

      let model: tf.LayersModel;

      p.setup = () => {
        p.frameRate(framerate);
        p.createCanvas(1920, 1080);
        video = p.createCapture(p.VIDEO);
        video.size(640, 480);
        video.hide();

        setupDetector().then((detector) => {
          pose_detector = detector;
        });

        // tensorflowjs_converter --input_format keras ./20230107-2204_model.h5 ./
        loadModel("./models/model.json").then((loadedModel) => {
          model = loadedModel;
        });

        x = 0;
        y = circleSize / 2 + 10;

        // Update Circle
      };

      if (isModelMode) {
        // MODEL MODE
        p.draw = () => {
          // DELAY FOR ERROR FIX
          if (p.frameCount > 20) {
            p.background(0);
            p.image(video, 0, 0, 640, 480);

            let predictionArray: number[] = [];
            // Detect
            if (pose_detector !== undefined) {
              detectPose(video.elt, pose_detector).then((poses) => {
                // Draw keypoints for each detected pose
                poses.forEach((pose) => {
                  // For each keypoint in the pose
                  pose.keypoints.forEach((keypoint) => {
                    predictionArray.push(keypoint.x);
                    predictionArray.push(keypoint.y);
                    // If the keypoint has a high enough score, draw it
                    if (keypoint.score && keypoint.score > 0.2) {
                      p.fill(255, 0, 0);
                      p.noStroke();
                      p.ellipse(keypoint.x, keypoint.y, 10, 10);
                    }
                  });
                });

                drawGrid(p);
                // CIRCLE MOVEMENT
                p.noStroke();
                p.fill(255, 255, 255);

                if (predictionArray.slice(0, 22).length !== 0) {
                  let input = tf.tensor1d(predictionArray.slice(0, 22));
                  // @ts-ignore
                  input = tf.reshape(input, [1, 22]);
                  const prediction = model.predict(input);
                  //@ts-ignore
                  let predictionXY = prediction.dataSync();
                  p.circle(predictionXY[0], predictionXY[1], circleSize);
                  predictionArray = [];
                }
              });
            }
          }
        };
      } else {
        p.draw = () => {
          // DELAY FOR ERROR FIX
          if (p.frameCount > 30) {
            p.background(0);
            p.image(video, 0, 0, 640, 480);

            // Move the circle
            x += xSpeed;

            // Check if the circle has reached the right edge of the display
            if (x >= window.innerWidth) {
              // x = 0;
              xSpeed = xSpeed * -1;
              y += 100;
              // Check if the circle has reached the bottom edge of the display
              if (y + circleSize >= window.innerHeight) {
                y = circleSize / 2 + 10;
              }
            }

            // Check if the circle has reached the left edge of the display
            if (x <= 0) {
              // x = 0;
              xSpeed = xSpeed * -1;
              y += 100;
              // Check if the circle has reached the bottom edge of the display
              if (y + circleSize >= window.innerHeight) {
                y = circleSize / 2 + 10;
                x = 0;
              }
            }

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
                    console.log(sessionData);
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
