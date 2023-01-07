import * as poseDetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";

export async function setupDetector() {
  // Setup Detection Model
  const detectorConfig = {
    modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
  };

  // MultiPose
  // const detectorConfig = {
  //   modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
  //   enableTracking: true,
  //   trackerType: poseDetection.TrackerType.BoundingBox
  // };
  // const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);

  let detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    detectorConfig
  );
  return detector;
}

export async function detectPose(
  video: HTMLVideoElement,
  detector: poseDetection.PoseDetector
) {
  const poses = await detector.estimatePoses(video);
  // do something with the poses
  return poses;
}
