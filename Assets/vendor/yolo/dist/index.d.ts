/** Axis-aligned box, pixel `xyxy`. */
export interface Box {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    /** Track id, set by {@link YOLO.track}. */
    id?: number;
    conf: number;
    cls: number;
    name: string;
    color: string;
}
/** Oriented box, `xywhr` (angle in radians). */
export interface Obb {
    x: number;
    y: number;
    w: number;
    h: number;
    angle: number;
    /** Track id, set by {@link YOLO.track}. */
    id?: number;
    conf: number;
    cls: number;
    name: string;
    color: string;
}
/** Keypoints for one detection: `[x, y, conf]` per point. */
export interface Keypoints {
    points: Array<[number, number, number]>;
    color: string;
}
/** Classification probabilities. */
export interface Probs {
    top1: number;
    top5: number[];
    top1conf: number;
    top5conf: number[];
    name: string;
    /** Display names for each {@link top5} class. */
    top5names: string[];
    color: string;
}
/** Per-stage timing in ms. */
export interface Speed {
    preprocess: number;
    inference: number;
    postprocess: number;
}
/** Inference results, mirroring the Ultralytics `Results` API. */
export interface Results {
    task: string;
    width: number;
    height: number;
    boxes: Box[];
    obb: Obb[];
    keypoints: Keypoints[];
    probs: Probs | null;
    /** Segment/semantic masks as a translucent RGBA overlay (`width*height*4`), else empty. */
    masks: Uint8Array;
    /**
     * Semantic segmentation class id per pixel, row-major (`width*height`),
     * `undefined` for other tasks. The sentinel `65535` marks background or
     * class-filtered pixels. The `masks` overlay is its renderable form.
     */
    semantic_mask?: Uint16Array;
    /**
     * Depth map as an opaque colorized RGBA image (`width*height*4`), using the colormap
     * from {@link PredictOptions.colormap}; empty for other tasks. {@link annotate} blends
     * it over the frame at {@link AnnotateOptions.depthAlpha} (default 0.6); draw it directly
     * for the raw map.
     */
    depth: Uint8Array;
    /** Depth range `[min, max]` in meters over valid pixels, for depth models. */
    depth_range?: [number, number];
    speed: Speed;
}
/** Options for {@link YOLO.load}. */
export interface LoadOptions {
    /**
     * Optional URL/path to the wasm binary (`ultralytics_inference_web_bg.wasm`).
     * Only needed if your bundler does not resolve it automatically.
     */
    wasmUrl?: string | URL;
    /**
     * Optional base URL to self-host the ONNX Runtime Web build instead of
     * fetching it from `cdn.pyke.io`. The directory must contain
     * `ort.webgpu.min.js`, `ort-wasm-simd-threaded.jsep.wasm`, and
     * `ort-wasm-simd-threaded.jsep.mjs` for WebGPU, plus `ort.wasm.min.js`,
     * `ort-wasm-simd-threaded.wasm`, and `ort-wasm-simd-threaded.mjs` for the CPU build, which is what a `"cpu"`
     * device and the WebGPU fallback below load. Use an absolute URL ending in `/`.
     */
    ortBaseUrl?: string | URL;
    /**
     * Which device to run on, mirroring the native `device` option. `"auto"`
     * (default) picks WebGPU when the browser has a working adapter, otherwise the
     * portable CPU/wasm build. `"webgpu"` or `"cpu"` force one; the GPU adapter is
     * chosen automatically by the browser. If WebGPU fails to engage the model
     * falls back to CPU; read {@link YOLO.device} to see what actually ran.
     */
    device?: "auto" | "webgpu" | "cpu";
    /**
     * Base URL of the `@litertjs/core` wasm assets folder, used when the model is a
     * `.tflite` (run through LiteRT.js). Defaults to the jsDelivr CDN. Self-host by
     * copying `node_modules/@litertjs/core/wasm/` and pointing here (absolute URL
     * ending in `/`). Requires the optional `@litertjs/core` peer dependency.
     *
     * Required on a cross-origin-isolated page: `COEP: require-corp` blocks the worker
     * LiteRT starts from the default CDN, so the wasm has to come from your own origin.
     */
    litertWasmUrl?: string | URL;
}
/** A model source: a URL/path, raw bytes, or a `Blob`/`File` (e.g. a dropped file). */
export type ModelSource = string | URL | ArrayBuffer | Uint8Array | Blob;
/** Options for {@link YOLO.predict}. */
export interface PredictOptions {
    /** Confidence threshold. Default `0.25` (matches Ultralytics). */
    conf?: number;
    /** NMS IoU threshold. Default `0.5` (matches Ultralytics predict). */
    iou?: number;
    /**
     * Keep only these class ids. Omit to keep all. Filters detections for
     * detect/segment/pose/obb, and for semantic marks other pixels as background.
     */
    classes?: number[];
    /**
     * Depth colormap for the `depth` overlay: `"jet"` (default, classic rainbow),
     * `"inferno"`, `"spectral"` (`Spectral_r`), or `"gray"` (raw grayscale). Ignored by
     * every other task.
     */
    colormap?: "inferno" | "jet" | "spectral" | "gray";
    /**
     * Depth normalization: `"disparity"` (default, inverse depth + percentile clip) or
     * `"metric"` (min/max). Ignored by every other task.
     */
    depthViz?: "metric" | "disparity";
}
/** Options for {@link YOLO.track}. */
export interface TrackOptions extends PredictOptions {
    /**
     * Tracker: `"botsort.yaml"`, `"bytetrack.yaml"`, `"ocsort.yaml"`, `"deepocsort.yaml"`, `"fasttrack.yaml"` or
     * `"tracktrack.yaml"` (default, like Ultralytics). Changing it starts new tracks.
     */
    tracker?: string;
}
/** Options for {@link annotate}. */
export interface AnnotateOptions {
    /** Box/line width in pixels. Defaults to a value scaled to the image size. */
    lineWidth?: number;
    /** Font CSS string. Defaults to a size scaled to the image. */
    font?: string;
    /** Draw `id:track_id class_name confidence%` labels. Default `true`. */
    labels?: boolean;
    /** Draw pose keypoints and skeleton. Default `true`. */
    keypoints?: boolean;
    /** Keypoint confidence threshold for drawing. Default `0.25` (matches Ultralytics). */
    keypointThreshold?: number;
    /** Keypoint radius in pixels (`kpt_radius`). Default `5`, like Ultralytics. */
    keypointRadius?: number;
    /** Draw the lines between keypoints (`kpt_line`). Default `true`. */
    keypointLines?: boolean;
    /** One CSS color for every keypoint and line (`kpt_color`). Defaults to the palette. */
    keypointColor?: string;
    /**
     * Pairs of keypoint indices to connect. Defaults to the human skeleton for 17-keypoint
     * (COCO-Pose) models and no lines for other layouts, like Ultralytics.
     */
    skeleton?: Array<[number, number]>;
    /**
     * Blend opacity for the depth overlay, `0`..`1`. Default `0.6` (matches the native
     * annotator); `1` shows the raw colorized depth map, `0` shows only the source.
     */
    depthAlpha?: number;
    /**
     * Optional URL/path to the wasm binary, as in {@link LoadOptions.wasmUrl}. Labels with
     * right-to-left text need the engine, so pass it when no model has loaded it in this thread.
     */
    wasmUrl?: string | URL;
}
/** Image-like inputs accepted by {@link YOLO.predict}. */
export type ImageInput = string | URL | Blob | ArrayBuffer | Uint8Array | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | OffscreenCanvas | ImageBitmap;
/**
 * A loaded YOLO model. Loading is asynchronous, so use {@link YOLO.load} instead
 * of a constructor.
 */
export declare class YOLO {
    private readonly engine;
    private queue;
    private constructor();
    /**
     * Load a model and initialize the inference backend.
     *
     * The engine is chosen from the model: a `.tflite` runs on LiteRT.js, an
     * `.onnx` on ONNX Runtime Web.
     *
     * @param source Model URL/path, raw bytes, or a `Blob`/`File` (e.g. from a file
     *   input or drag-and-drop). `.onnx` or `.tflite`.
     * @param options Loader options.
     */
    static load(source: ModelSource, options?: LoadOptions): Promise<YOLO>;
    /** Load the LiteRT (`.tflite`) backend. Metadata (task, class names, `imgsz`)
     * is read from the single `.tflite` file, the same as the `.onnx` path. */
    private static loadLiteRt;
    /** The model's task (`detect`, `segment`, `semantic`, `depth`, `classify`, `pose`, `obb`). */
    get task(): string;
    /** The active device that ran inference (`"webgpu"` or `"cpu"`). */
    get device(): string;
    /** Class id -> name map (like Ultralytics `model.names`). */
    get names(): Record<number, string>;
    /**
     * Run inference on an image.
     *
     * Drawable sources (`ImageData`, `HTMLImageElement`, `HTMLCanvasElement`,
     * `HTMLVideoElement`, `OffscreenCanvas`, `ImageBitmap`) take a fast path that reads raw pixels
     * with no re-encoding, ideal for webcam/video. URLs, `Blob`s, and raw bytes
     * are decoded (in wasm for `ort`, via a canvas for `litert`).
     *
     * @param image The image to run on.
     * @param options Confidence/IoU thresholds, class filter, and depth colorizing.
     */
    predict(image: ImageInput, options?: PredictOptions): Promise<Results>;
    /**
     * Run inference on the next frame of a video and track its objects, like Ultralytics
     * `model.track(persist=True)`: tracks carry over between calls and every tracked box gets an
     * `id` (a frame with no track to show keeps its boxes without one, as in Ultralytics). Confidence defaults to `0.1` here, as in Ultralytics. Call {@link resetTracker}
     * before a new video.
     *
     * @param image The frame to run on, as in {@link predict}.
     * @param options The {@link predict} options and the tracker.
     */
    track(image: ImageInput, options?: TrackOptions): Promise<Results>;
    /** Forget the tracks of {@link track}, so the next frame starts a new video. */
    resetTracker(): void;
    /** Run one prediction in turn, tracked by `tracker` when given. */
    private run;
    /** Release the underlying wasm model/engine. Call when you are done with it. */
    free(): void;
}
/**
 * Draw inference results onto a canvas, on top of the source image.
 *
 * Handles every task: axis-aligned boxes, oriented boxes (OBB), pose keypoints
 * with the COCO skeleton, and a top-5 list for classification. The canvas is
 * resized to the original image dimensions so detection coordinates line up.
 *
 * ```ts
 * const results = await model.predict("bus.jpg");
 * await annotate(document.querySelector("canvas"), "bus.jpg", results);
 * ```
 *
 * @param canvas Target `<canvas>` (or `OffscreenCanvas`).
 * @param image The same image passed to `predict` (URL, Blob, bytes, element, ...).
 * @param results The `Results` returned by {@link YOLO.predict}.
 * @param options Styling options.
 */
export declare function annotate(canvas: HTMLCanvasElement | OffscreenCanvas, image: ImageInput, results: Results, options?: AnnotateOptions): Promise<void>;
export default YOLO;
