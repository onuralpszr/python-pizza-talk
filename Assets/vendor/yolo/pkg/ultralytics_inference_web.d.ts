/* tslint:disable */
/* eslint-disable */

/**
 * A loaded ONNX model that runs end to end in wasm (preprocess, inference on
 * ONNX Runtime Web, and postprocess), for the `.onnx` path.
 *
 * Created via [`YoloModel::load_bytes`]; run with [`YoloModel::predict`]. The
 * TypeScript `YOLO` class wraps this for ONNX models, and [`YoloPipeline`] for
 * `.tflite` ones.
 */
export class YoloModel {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Load a model from raw ONNX bytes (fetched by the JS wrapper).
     *
     * Initializes the accelerated backend on first use, reads the embedded
     * Ultralytics metadata from the model bytes, then commits an ONNX Runtime
     * session on the requested execution provider.
     *
     * `device` is `"webgpu"` or `"cpu"` (the browser picks the GPU adapter
     * automatically). WebGPU is registered with `error_on_failure`, so if the
     * session cannot commit on it the load falls back to CPU and
     * [`device`](Self::device) reports what actually ran.
     *
     * # Errors
     * Returns a JS error if the backend cannot start, the bytes are not a valid
     * model, or the model lacks Ultralytics metadata.
     */
    static load_bytes(bytes: Uint8Array, ort_base_url: string | null | undefined, device: string): Promise<YoloModel>;
    /**
     * Run inference on a single encoded image (JPEG or PNG bytes).
     *
     * `conf` and `iou` are the confidence and NMS IoU thresholds (omit them for the
     * Ultralytics defaults 0.25 / 0.5); `classes` optionally keeps only
     * the given class ids (for semantic, other pixels become background).
     * `tracker` (`"tracktrack.yaml"`, `"botsort.yaml"`, ...) tracks the detections across
     * calls like Ultralytics `model.track(persist=True)`, starting anew when it changes.
     * Returns a plain JS object whose shape mirrors the Ultralytics `Results` API.
     *
     * # Errors
     * Returns a JS error if the image cannot be decoded, the tracker is unknown or
     * inference fails.
     */
    predict(image: Uint8Array, conf: number | null | undefined, iou: number | null | undefined, classes: Uint32Array | null | undefined, colormap: string, depth_viz: string, tracker?: string | null): Promise<any>;
    /**
     * Run inference on raw `RGBA` pixels (e.g. a canvas/webcam `ImageData`).
     *
     * Skips image encoding/decoding entirely, so it is the fast path for live
     * video. `rgba` is `width * height * 4` bytes, row-major.
     *
     * # Errors
     * Returns a JS error if the buffer size is wrong or inference fails.
     */
    predict_rgba(rgba: Uint8Array, width: number, height: number, conf: number | null | undefined, iou: number | null | undefined, classes: Uint32Array | null | undefined, colormap: string, depth_viz: string, tracker?: string | null): Promise<any>;
    /**
     * Forget the tracks, so the next frame starts a new video.
     */
    reset_tracker(): void;
    /**
     * The active device: `"webgpu"` or `"cpu"` (the fallback when WebGPU is
     * unavailable). Mirrors the native `Device` display.
     */
    readonly device: string;
    /**
     * Class id -> name map (like Ultralytics `model.names`), as a JS object.
     *
     * # Errors
     * Returns a JS error only if serialization fails (not expected).
     */
    readonly names: any;
    /**
     * The model's task (`"detect"`, `"segment"`, `"semantic"`, `"depth"`,
     * `"classify"`, `"pose"`, or `"obb"`).
     */
    readonly task: string;
}

/**
 * A metadata-only YOLO pre/post pipeline for use with an **external** inference
 * engine (e.g. LiteRT.js running a `.tflite` model in JavaScript).
 *
 * Unlike [`YoloModel`], it holds no ONNX Runtime session: JavaScript loads and
 * runs the model, while this struct reuses the shared Rust preprocessing and
 * postprocessing so results match every other path. Per frame the flow is
 * [`preprocess_rgba`](Self::preprocess_rgba) → (JS engine inference) →
 * [`postprocess`](Self::postprocess). It assumes a single prediction in flight
 * at a time (as the webcam render loop does).
 */
export class YoloPipeline {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Build a pipeline from a single-file `.tflite` model, reading the
     * Ultralytics metadata (task, class names, `imgsz`, ...) embedded in the
     * model bytes, the same way [`YoloModel::load_bytes`] reads it from an ONNX
     * model, so the ONNX and LiteRT paths load identically from one file.
     *
     * # Errors
     * Returns a JS error if the model carries no Ultralytics metadata or it
     * cannot be parsed.
     */
    constructor(tflite: Uint8Array);
    /**
     * Postprocess an external engine's raw outputs into the standard `Results`.
     *
     * `outputs` are the model's output tensors (one for most tasks; two for
     * segmentation: detection head + mask prototypes), with one entry of dims per
     * output in `shapes`. `inference_ms`
     * is the time the JS engine reported, used only for the `speed` breakdown.
     * `tracker` tracks the detections as in [`YoloModel::predict`].
     * Consumes the frame stashed by the preceding
     * [`preprocess_rgba`](Self::preprocess_rgba).
     *
     * # Errors
     * Returns a JS error if called before `preprocess_rgba`, if `shapes` does not
     * have one entry per output, if the tracker is unknown, or on serialization failure.
     */
    postprocess(outputs: Float32Array[], shapes: Uint32Array[], inference_ms: number, conf: number | null | undefined, iou: number | null | undefined, classes: Uint32Array | null | undefined, colormap: string, depth_viz: string, tracker?: string | null): any;
    /**
     * Preprocess raw RGBA pixels (e.g. a webcam `ImageData`) into the NCHW f32
     * input tensor an Ultralytics LiteRT/TFLite model expects, normalized to
     * `[0, 1]`, the same preprocessing as the ONNX path.
     *
     * Returns the tensor as a `Float32Array` (shape `[1, 3, H, W]`); the
     * letterbox geometry and original image are stashed for the matching
     * [`postprocess`](Self::postprocess) call.
     *
     * # Errors
     * Returns a JS error if the buffer size is not `width * height * 4`.
     */
    preprocess_rgba(rgba: Uint8Array, width: number, height: number): Float32Array;
    /**
     * Forget the tracks, so the next frame starts a new video.
     */
    reset_tracker(): void;
    /**
     * Adopt the input shape the engine reports for the compiled model.
     *
     * Without it the size comes from the metadata, which the graph itself never has to
     * agree with, and [`input_shape`](Self::input_shape) is what the caller sizes its
     * input tensor from - so a stale `imgsz` would feed the model a tensor it rejects.
     * The ONNX path reads the same fact off its session; this is the LiteRT equivalent,
     * which only the JS engine can see.
     *
     * Expects NCHW `[N, 3, H, W]`, what `ai_edge_torch` emits, with the signed dimensions
     * the engine reports. Any other rank or layout (a channels-last `[N, H, W, 3]`) and any
     * non-positive axis, which is how a dynamic dimension is reported, is ignored and leaves
     * the metadata size in place.
     */
    setInputShape(shape: Int32Array): void;
    /**
     * The model input shape as `[1, 3, H, W]` (NCHW), for sizing the engine's
     * input tensor. Ultralytics LiteRT exports (`ai_edge_torch`) keep the native
     * NCHW layout, matching the ONNX path.
     */
    readonly inputShape: Uint32Array;
    /**
     * Class id -> name map (like `model.names`), as a JS object.
     *
     * # Errors
     * Returns a JS error only if serialization fails (not expected).
     */
    readonly names: any;
    /**
     * The model's task (`"detect"`, `"segment"`, ...).
     */
    readonly task: string;
}

/**
 * Split a label into runs in left-to-right display order (Unicode bidi algorithm), each wrapped
 * in a left-to-right or right-to-left override so canvas draws it in its resolved direction. The
 * JS annotator draws runs one by one because Safari's canvas does not pair brackets in
 * right-to-left text. Explicit embeddings, overrides and isolates are dropped, since the
 * resolved levels already carry them.
 */
export function bidi_runs(text: string): string[];

/**
 * Return the Ultralytics pose skeleton + keypoint/limb colors (constant). The
 * JS annotator calls this once to color pose overlays from the shared palette.
 *
 * # Errors
 * Returns a JS error only if serialization fails (not expected).
 */
export function pose_palette(): any;

/**
 * Install a panic hook that logs Rust panics to the browser console.
 */
export function start(): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_yolomodel_free: (a: number, b: number) => void;
    readonly __wbg_yolopipeline_free: (a: number, b: number) => void;
    readonly bidi_runs: (a: number, b: number, c: number) => void;
    readonly pose_palette: (a: number) => void;
    readonly start: () => void;
    readonly yolomodel_device: (a: number, b: number) => void;
    readonly yolomodel_load_bytes: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
    readonly yolomodel_names: (a: number, b: number) => void;
    readonly yolomodel_predict: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number) => number;
    readonly yolomodel_predict_rgba: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number) => number;
    readonly yolomodel_reset_tracker: (a: number) => void;
    readonly yolomodel_task: (a: number, b: number) => void;
    readonly yolopipeline_inputShape: (a: number, b: number) => void;
    readonly yolopipeline_names: (a: number, b: number) => void;
    readonly yolopipeline_new: (a: number, b: number, c: number) => void;
    readonly yolopipeline_postprocess: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: number, q: number) => void;
    readonly yolopipeline_preprocess_rgba: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly yolopipeline_reset_tracker: (a: number) => void;
    readonly yolopipeline_setInputShape: (a: number, b: number, c: number) => void;
    readonly yolopipeline_task: (a: number, b: number) => void;
    readonly __wasm_bindgen_func_elem_1320: (a: number, b: number, c: number, d: number) => void;
    readonly __wasm_bindgen_func_elem_1951: (a: number, b: number, c: number, d: number) => void;
    readonly __wasm_bindgen_func_elem_1975: (a: number, b: number, c: number, d: number) => void;
    readonly __wasm_bindgen_func_elem_390: (a: number, b: number, c: number, d: number) => void;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_export3: (a: number) => void;
    readonly __wbindgen_export4: (a: number, b: number, c: number) => void;
    readonly __wbindgen_export5: (a: number, b: number) => void;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
