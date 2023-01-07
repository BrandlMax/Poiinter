import * as poseDetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import p5 from "p5";
import { detectPose, setupDetector } from "./Detector";
import { drawGrid } from "./Elements";

export function sketch(p: p5) {
  let video: p5.Element;
  let pose_detector: poseDetection.PoseDetector;

  let circleSize = 75;
  let speed = 10;
  let x: number;
  let y: number;
  let stepX: number;
  let stepY: number;

  p.setup = () => {
    p.frameRate(30);
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

  p.draw = () => {
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

    // Draw a circle at the current position
    p.noStroke();
    p.circle(x, y, circleSize);
    // Update the position of the circle
    x += stepX;
    y += stepY;
    // If the circle is outside the bounds of the canvas, reverse its direction
    if (x < 0 || x > p.width || y < 0 || y > p.height) {
      stepX = -stepX;
      stepY = -stepY;
    }
  };
}
