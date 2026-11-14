# model.predict(): Real-Time Edge Vision with Ultralytics

Animated slides for my Python Pizza Istanbul talk, 14 November 2026 🍕

## Keys

- Right arrow or space: next, left arrow: back
- F: fullscreen, N: speaker notes window with a timer
- Before/after slide: drag the slider, click a thumbnail, B for before, A for after
- Race slide: R restarts the race
- Browser demo slide: M switches between yolo26n and the pizza model, C switches between webcam and photos
- Last slide: P for more pizza

## Browser demo

The live slide runs both models in the browser with [@ultralytics/yolo](https://www.npmjs.com/package/@ultralytics/yolo) on WebGPU.
It needs http or https (not file://) and internet the first time, to fetch ONNX Runtime Web.
To run it locally: `python -m http.server` in this folder, then open http://localhost:8000.
